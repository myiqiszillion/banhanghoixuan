import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CONFIG } from '@/lib/config';
import { googleSheets } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();
        const { password, spreadsheetId } = body;

        // Security check
        if (password !== CONFIG.admin.password) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Spreadsheet ID is required' }, { status: 400 });
        }

        // Get only PAID orders
        // Use db wrapper if possible, or direct query if not available in db.js for filtering
        // We'll reuse logic similar to getAllOrders but filter in memory or add db method later.
        // For now, let's fetch all and filter in memory as the dataset is small.

        // NOTE: In a real app with pagination, this might be inefficient, but for this scale it's fine.
        let allOrders = [];
        if (db.getAllOrders) { // If implemented
            allOrders = await db.getAllOrders();
        } else {
            // Fallback: we don't have a direct getAllOrders unrelated to request in db.js structure shown previously?
            // Actually, the api/orders fetch does a GET. We can simulate that or use direct DB access.
            // Let's use direct DB access via a new ad-hoc query here or better, add getPaidOrders to db.js?
            // To be quick, I'll implement a simple fetch here reusing db connection logic or adding a helper.
            // Wait, `db` object usually has methods. Let's look at `db.js` again to see what's available.
            // I'll assume I can add `getPaidOrders` to db.js or just write the query here if I import `pool`.
            // But to keep it clean, let's update `db.js` first.
            // OR, just use the endpoint logic.
            // Actually, `app/api/orders/route.js` calls `db.getOrders()` or similar?
            // Let's check `db.js` again.
            // It calls `client.query('SELECT * FROM orders...')`.
            // I will add `getPaidOrders` to `db.js` in the next step to be clean.
            // For now, I will write this file assuming `db.getPaidOrders()` exists.
        }

        // Assuming db.getPaidOrders exists. If not I will add it.
        const paidOrders = await db.getPaidOrders();

        // Debug: Get total orders to compare (if possible, or just report paid count)
        const totalOrders = global.mockStore ? global.mockStore.orders.length : 'N/A';

        console.log(`Syncing ${paidOrders.length} paid orders.`);

        const result = await googleSheets.appendOrdersToSheet(spreadsheetId, paidOrders);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Đã đồng bộ ${paidOrders.length} đơn (Tổng: ${totalOrders}). ${result.message || ''}`
            });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

    } catch (error) {
        console.error('API Sync Sheets Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
