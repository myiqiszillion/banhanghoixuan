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
    }
};
