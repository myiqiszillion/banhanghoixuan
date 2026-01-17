import { sql } from '@vercel/postgres';

const isPostgresConfigured = !!process.env.POSTGRES_URL;

// Helper to map DB row to App Object
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

// Fallback in-memory store for local dev without env vars
global.mockStore = global.mockStore || { orders: [] };

export const db = {
    async addOrder(order) {
        if (isPostgresConfigured) {
            try {
                // Insert into Postgres
                const { rows } = await sql`
                    INSERT INTO orders (order_code, name, phone, class_name, quantity, note, total, tickets, status)
                    VALUES (
                        ${order.orderCode}, 
                        ${order.name}, 
                        ${order.phone}, 
                        ${order.class}, 
                        ${order.quantity}, 
                        ${order.note}, 
                        ${order.total}, 
                        ${order.tickets}, 
                        ${order.status}
                    )
                    ON CONFLICT (order_code) DO UPDATE 
                    SET status = EXCLUDED.status
                    RETURNING *;
                `;
                return mapRowToOrder(rows[0]);
            } catch (e) {
                console.error("Postgres Error:", e);
                throw e;
            }
        } else {
            console.warn('⚠️ Postgres not configured. Using in-memory store.');
            global.mockStore.orders.push(order);
            return order;
        }
    },

    async getAllOrders() {
        if (isPostgresConfigured) {
            try {
                const { rows } = await sql`SELECT * FROM orders ORDER BY created_at DESC`;
                return rows.map(mapRowToOrder);
            } catch (e) {
                console.error("Postgres Error:", e);
                return [];
            }
        } else {
            return global.mockStore.orders;
        }
    }
};
