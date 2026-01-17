import { kv } from '@vercel/kv';

// Fallback in-memory store for local dev without KV credentials
global.mockStore = global.mockStore || { orders: [] };

const isKvConfigured = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

export const db = {
    async createOrder(order) {
        if (isKvConfigured) {
            // Add to list and save individual key for lookup
            await kv.lpush('hoixuan_orders', order);
            await kv.set(`order:${order.orderCode}`, order);
            return order;
        } else {
            console.warn('⚠️ Vercel KV not configured. Using in-memory store.');
            global.mockStore.orders.push(order);
            return order;
        }
    },

    async getOrders() {
        if (isKvConfigured) {
            return await kv.lrange('hoixuan_orders', 0, -1);
        } else {
            return global.mockStore.orders;
        }
    },

    async updateStatus(orderCode, status) {
        if (isKvConfigured) {
            // This is tricky with list. Better to just update individual key ? 
            // Simplified: Update individual key, but list will be stale.
            // For simple app: Just get all, update one, save back? (Not atomic but ok for small traffic)
            // Or better: Use hash for all orders?
            // Let's stick to list for listing and individual keys for details?
            // Actually, for admin list we need list.
            // Let's implement full list replacement for status update to keep it simple or use a Hash `hoixuan_orders_map`.

            // Switch to Hash logic for better updates? 
            // Let's stick to list but retrieval logic is: Get list, if we need updated status, maybe we should store in Hash instead of List?

            // PLAN B: Store everything in a single JSON object in KV? limit 4MB? Ok for small scale.
            // PLAN C: Use `lset` if we know index? No.

            // Let's use Hash: key = orderCode, value = JSON.
            // And a Set/List of orderCodes.

            // BUT, to keep it compatible with simple array logic:
            // Let's fetch all, update, save all. (Inefficient but simple for < 1000 orders)
            // Vercel KV free tier limits.

            // Let's try: Update order in `order:CODE` key. 
            // Admin list should fetch generic list.
            // We should update the list item too.

            // Simplest for now: In-memory fallback is array. KV: Let's use `kv.hset('orders', orderCode, order)`
            // Then `hgetall` to get all orders.

            await kv.hset('hoixuan_all_orders', { [orderCode]: { ...order, status } });
            // We need to fetch current order first to merge? 
            // Assume we pass full object or we fetch first.
            const current = await kv.hget('hoixuan_all_orders', orderCode) || {};
            await kv.hset('hoixuan_all_orders', { [orderCode]: { ...current, status } });
            return { ...current, status };
        } else {
            const order = global.mockStore.orders.find(o => o.orderCode === orderCode);
            if (order) order.status = status;
            return order;
        }
    },

    // Improved create for Hash logic
    async addOrder(order) {
        if (isKvConfigured) {
            await kv.hset('hoixuan_all_orders', { [order.orderCode]: order });
            return order;
        } else {
            global.mockStore.orders.push(order);
            return order;
        }
    },

    async getAllOrders() {
        if (isKvConfigured) {
            const data = await kv.hgetall('hoixuan_all_orders');
            return data ? Object.values(data) : [];
        } else {
            return global.mockStore.orders;
        }
    }
};
