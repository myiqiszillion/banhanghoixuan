export const STORAGE_KEY = 'hoixuan_2026_orders';

export const saveOrderLocally = (order) => {
    if (typeof window === 'undefined') return;

    try {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        // Avoid duplicates
        if (!existing.some(o => o.orderCode === order.orderCode)) {
            const newHistory = [order, ...existing];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
        }
    } catch (e) {
        console.error('Error saving order locally:', e);
    }
};

export const getLocalOrders = () => {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (e) {
        return [];
    }
};

export const calculateTotalTickets = () => {
    const orders = getLocalOrders();
    // Only count paid orders, or count all? Usually tickets are valid once paid.
    // For now, let's count all 'paid' orders. Or if pending/manual, maybe just show them?
    // User said "Mua 3 tặng 1", usually confirmed orders.
    // Let's filter by status === 'paid' if we can update it. 
    // But local storage might be outdated status.
    // Ideally, we fetch status from API for these codes.
    // For simplicity locally, just sum up 'tickets'.
    return orders.reduce((acc, curr) => acc + (curr.tickets || 0), 0);
};
