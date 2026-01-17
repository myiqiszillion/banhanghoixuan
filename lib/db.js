import { Pool } from 'pg';

let pool;
const isPostgresConfigured = !!process.env.POSTGRES_URL;

if (isPostgresConfigured) {
    if (!global.pgPool) {
        global.pgPool = new Pool({
            connectionString: process.env.POSTGRES_URL,
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
        tickets: Number(row.tickets)
    };
};

export const db = {
    async addOrder(order) {
        if (isPostgresConfigured) {
            const client = await pool.connect();
            try {
                const query = `
                    INSERT INTO orders (order_code, name, phone, class_name, quantity, note, total, tickets, status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    ON CONFLICT (order_code) DO UPDATE 
                    SET status = EXCLUDED.status
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
                    order.status
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
            // Mock
            console.warn('⚠️ Postgres not configured. Using in-memory store.');
            global.mockStore.orders.push(order);
            return order;
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
    }
};

// Export pool for direct query (init-db)
export { pool };
