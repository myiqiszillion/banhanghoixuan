// lib/db.js
import pg from 'pg';
const { Pool } = pg;

let pool;
const isPostgresConfigured = !!process.env.POSTGRES_URL;

if (isPostgresConfigured) {
    if (!global.pgPool) {
        // Fix: Remove sslmode from query if present to prevent conflict
        let connectionString = process.env.POSTGRES_URL;
        try {
            const url = new URL(process.env.POSTGRES_URL);
            url.searchParams.delete('sslmode');
            connectionString = url.toString();
        } catch (e) {
            // If not a valid URL, ignore
        }

        global.pgPool = new Pool({
            connectionString,
            ssl: {
                rejectUnauthorized: false
            }
        });

        // Auto-create game_states table if not exists
        global.pgPool.query(`
            CREATE TABLE IF NOT EXISTS game_states (
                phone VARCHAR(20) PRIMARY KEY,
                collected_cards JSONB DEFAULT '[]',
                used_tickets INTEGER DEFAULT 0,
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `).catch(e => console.error('Failed to create game_states table:', e));
    }
    pool = global.pgPool;
}

// Fallback in-memory store
global.mockStore = global.mockStore || { orders: [] };

const mapRowToOrder = (row) => {
    if (!row) return null;
    return {
        ...row,
        orderCode: row.order_code,
        class: row.class_name,
        timestamp: row.created_at,
        total: Number(row.total),
        quantity: Number(row.quantity),
        tickets: Number(row.tickets),
        // Add delivered status (boolean or string, user asked to toggle)
        // Let's assume we add a 'delivered' column or use status
        // User said: "than toan la thanh toan, giao hang la giao hang" -> Separate status.
        delivered: row.delivered || false
    };
};

export const db = {
    async addOrder(order) {
        if (isPostgresConfigured) {
            const client = await pool.connect();
            try {
                // We need to handle 'delivered' update
                const query = `
                    INSERT INTO orders (order_code, name, phone, class_name, quantity, note, total, tickets, status, delivered)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    ON CONFLICT (order_code) DO UPDATE 
                    SET status = EXCLUDED.status,
                        delivered = EXCLUDED.delivered
                    RETURNING *
                `;
                const values = [
                    order.orderCode,
                    order.name,
                    order.phone,
                    order.class,
                    order.quantity,
                    order.note,
                    order.total,
                    order.tickets,
                    order.status,
                    order.delivered || false
                ];

                const { rows } = await client.query(query, values);
                return mapRowToOrder(rows[0]);
            } catch (e) {
                console.error("Postgres Error:", e);
                throw e;
            } finally {
                client.release();
            }
        } else {
            console.warn('⚠️ Postgres not configured. Using in-memory store.');
            // Update existing
            const existingIdx = global.mockStore.orders.findIndex(o => o.orderCode === order.orderCode);
            if (existingIdx >= 0) {
                global.mockStore.orders[existingIdx] = { ...global.mockStore.orders[existingIdx], ...order };
                return global.mockStore.orders[existingIdx];
            } else {
                global.mockStore.orders.push(order);
                return order;
            }
        }
    },

    async getAllOrders() {
        if (isPostgresConfigured) {
            const client = await pool.connect();
            try {
                const { rows } = await client.query('SELECT * FROM orders ORDER BY created_at DESC');
                return rows.map(mapRowToOrder);
            } catch (e) {
                console.error("Postgres Error:", e);
                return [];
            } finally {
                client.release();
            }
        } else {
            return global.mockStore.orders;
        }
    },

    async deleteOrder(orderCode) {
        if (isPostgresConfigured) {
            const client = await pool.connect();
            try {
                await client.query('DELETE FROM orders WHERE order_code = $1', [orderCode]);
                return true;
            } catch (e) {
                console.error("Postgres Delete Error:", e);
                return false;
            } finally {
                client.release();
            }
        } else {
            const idx = global.mockStore.orders.findIndex(o => o.orderCode === orderCode);
            if (idx >= 0) {
                global.mockStore.orders.splice(idx, 1);
                return true;
            }
            return false;
        }
    },

    async cleanupExpiredOrders(timeoutMinutes = 15) {
        const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

        if (isPostgresConfigured) {
            const client = await pool.connect();
            try {
                const result = await client.query(
                    `DELETE FROM orders 
                     WHERE status = 'pending' 
                     AND created_at < $1
                     RETURNING order_code`,
                    [cutoffTime.toISOString()]
                );
                const deletedCount = result.rowCount || 0;
                if (deletedCount > 0) {
                    console.log(`🗑️ Cleaned up ${deletedCount} expired orders`);
                }
                return deletedCount;
            } catch (e) {
                console.error("Postgres Cleanup Error:", e);
                return 0;
            } finally {
                client.release();
            }
        } else {
            const before = global.mockStore.orders.length;
            global.mockStore.orders = global.mockStore.orders.filter(o => {
                if (o.status !== 'pending') return true;
                const orderTime = new Date(o.timestamp);
                return orderTime >= cutoffTime;
            });
            const deletedCount = before - global.mockStore.orders.length;
            if (deletedCount > 0) {
                console.log(`🗑️ Cleaned up ${deletedCount} expired orders (in-memory)`);
            }
            return deletedCount;
        }
    },

    // ===== MINI GAME FUNCTIONS (Anti-cheat) =====

    async getTicketBalance(phone) {
        // Count total tickets from PAID orders for this phone number
        if (isPostgresConfigured) {
            const client = await pool.connect();
            try {
                const { rows } = await client.query(
                    `SELECT COALESCE(SUM(tickets), 0) as total_tickets 
                     FROM orders 
                     WHERE phone = $1 AND status = 'paid'`,
                    [phone]
                );
                return parseInt(rows[0]?.total_tickets || 0);
            } catch (e) {
                console.error("Postgres getTicketBalance Error:", e);
                return 0;
            } finally {
                client.release();
            }
        } else {
            return global.mockStore.orders
                .filter(o => o.phone === phone && o.status === 'paid')
                .reduce((sum, o) => sum + (o.tickets || 0), 0);
        }
    },

    async getGameState(phone) {
        if (isPostgresConfigured) {
            const client = await pool.connect();
            try {
                const { rows } = await client.query(
                    `SELECT collected_cards, used_tickets FROM game_states WHERE phone = $1`,
                    [phone]
                );
                if (rows[0]) {
                    // Parse collected_cards - could be JSON string or already parsed array
                    let collectedCards = rows[0].collected_cards;
                    if (typeof collectedCards === 'string') {
                        try {
                            collectedCards = JSON.parse(collectedCards);
                        } catch (e) {
                            collectedCards = [];
                        }
                    }
                    return {
                        collectedCards: collectedCards || [],
                        usedTickets: parseInt(rows[0].used_tickets || 0)
                    };
                }
                return null;
            } catch (e) {
                console.error("Postgres getGameState Error:", e);
                return null;
            } finally {
                client.release();
            }
        } else {
            // In-memory fallback
            global.mockStore.gameStates = global.mockStore.gameStates || {};
            return global.mockStore.gameStates[phone] || null;
        }
    },

    async updateGameState(phone, state) {
        if (isPostgresConfigured) {
            const client = await pool.connect();
            try {
                await client.query(
                    `INSERT INTO game_states (phone, collected_cards, used_tickets, bonus_tickets, updated_at)
                     VALUES ($1, $2, $3, $4, NOW())
                     ON CONFLICT (phone) DO UPDATE SET
                         collected_cards = $2,
                         used_tickets = $3,
                         bonus_tickets = COALESCE(game_states.bonus_tickets, 0) + $4 - COALESCE((SELECT bonus_tickets FROM game_states WHERE phone = $1), 0),
                         updated_at = NOW()`,
                    [phone, JSON.stringify(state.collectedCards), state.usedTickets, state.bonusTickets || 0]
                );
                return true;
            } catch (e) {
                console.error("Postgres updateGameState Error:", e);
                return false;
            } finally {
                client.release();
            }
        } else {
            global.mockStore.gameStates = global.mockStore.gameStates || {};
            global.mockStore.gameStates[phone] = state;
            return true;
        }
    },

    async getAllGameStats() {
        if (isPostgresConfigured) {
            const client = await pool.connect();
            try {
                // 1. Get all ORDERS (paid) to calculate total tickets per phone
                const ordersRes = await client.query(`SELECT phone, tickets FROM orders WHERE status = 'paid'`);
                const ticketMap = {};
                ordersRes.rows.forEach(r => {
                    const p = r.phone;
                    ticketMap[p] = (ticketMap[p] || 0) + (r.tickets || 0);
                });

                // 2. Get all GAME STATES (including bonus_tickets)
                const gameStatesRes = await client.query(`SELECT phone, collected_cards, used_tickets, COALESCE(bonus_tickets, 0) as bonus_tickets FROM game_states`);

                // 3. Merge data
                const allPhones = new Set([...Object.keys(ticketMap), ...gameStatesRes.rows.map(r => r.phone)]);
                const stats = [];

                for (const phone of allPhones) {
                    const orderTickets = ticketMap[phone] || 0;
                    const gs = gameStatesRes.rows.find(r => r.phone === phone);

                    let collected = [];
                    let used = 0;
                    let bonus = 0;

                    if (gs) {
                        used = parseInt(gs.used_tickets || 0);
                        bonus = parseInt(gs.bonus_tickets || 0);
                        try {
                            collected = (typeof gs.collected_cards === 'string')
                                ? JSON.parse(gs.collected_cards)
                                : (gs.collected_cards || []);
                        } catch (e) { collected = []; }
                    }

                    const total = orderTickets + bonus;
                    if (total > 0 || used > 0) { // Only include if they have interacted
                        stats.push({
                            phone,
                            totalTickets: total,
                            usedTickets: used,
                            remainingTickets: total - used,
                            bonusTickets: bonus,
                            collectedCount: collected.length,
                            collectedCards: collected
                        });
                    }
                }
                return stats;

            } catch (e) {
                console.error("Postgres getAllGameStats Error:", e);
                return [];
            } finally {
                client.release();
            }
        } else {
            return []; // Mock not implemented for aggregate
        }
    },
    async deleteGameState(phone) {
        if (isPostgresConfigured) {
            const client = await pool.connect();
            try {
                await client.query('DELETE FROM game_states WHERE phone = $1', [phone]);
                return true;
            } catch (e) {
                console.error("Postgres deleteGameState Error:", e);
                return false;
            } finally {
                client.release();
            }
        } else {
            if (global.mockStore.gameStates && global.mockStore.gameStates[phone]) {
                delete global.mockStore.gameStates[phone];
                return true;
            }
            return false;
        }
    },
    async getPaidOrders() {
        if (isPostgresConfigured) {
            const client = await pool.connect();
            try {
                const res = await client.query("SELECT * FROM orders WHERE status = 'paid' ORDER BY timestamp ASC");
                console.log(`[DB] Postgres getPaidOrders found ${res.rows.length} records`);
                return res.rows;
            } catch (e) {
                console.error("Postgres getPaidOrders Error:", e);
                return [];
            } finally {
                client.release();
            }
        } else {
            const paid = global.mockStore.orders.filter(o => o.status === 'paid');
            console.log(`[DB] MockStore getPaidOrders found ${paid.length} records. Total orders: ${global.mockStore.orders.length}`);
            return paid;
        }
    }
};
