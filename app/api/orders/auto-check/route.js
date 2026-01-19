import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Auto-check all pending orders against SePay transactions
export async function GET() {
    try {
        // 1. Get all pending orders
        const allOrders = await db.getAllOrders();
        const pendingOrders = allOrders.filter(o => o.status === 'pending');

        if (pendingOrders.length === 0) {
            return NextResponse.json({ checked: 0, updated: 0, message: 'No pending orders' });
        }

        // 2. Get recent transactions from SePay
        if (!CONFIG.sepay.apiKey) {
            return NextResponse.json({ error: 'SePay API key not configured' }, { status: 500 });
        }

        const res = await fetch(
            `${CONFIG.sepay.apiUrl}?account_number=${CONFIG.bankInfo.accountNumber}&limit=50`,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.sepay.apiKey}`,
                    'Content-Type': 'application/json'
                },
                cache: 'no-store'
            }
        );

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
        }

        const data = await res.json();

        if (data.status !== 200 || !data.transactions) {
            return NextResponse.json({ error: 'Invalid API response' }, { status: 500 });
        }

        // 3. Check each pending order against transactions
        const updatedOrders = [];

        for (const order of pendingOrders) {
            const matching = data.transactions.find(tx => {
                const content = (tx.transaction_content || tx.description || '').toUpperCase();
                const isMatch = content.includes(order.orderCode.toUpperCase());
                const txAmount = Math.round(parseFloat(tx.amount_in || tx.amount || 0));
                const orderTotal = parseInt(order.total) || 0;
                return isMatch && txAmount === orderTotal;
            });

            if (matching) {
                // Update order status to paid
                order.status = 'paid';
                await db.addOrder(order);
                updatedOrders.push(order.orderCode);
                console.log(`[Auto-Check] Order ${order.orderCode} marked as PAID`);
            }
        }

        return NextResponse.json({
            checked: pendingOrders.length,
            updated: updatedOrders.length,
            updatedOrders,
            message: updatedOrders.length > 0
                ? `Updated ${updatedOrders.length} orders to PAID`
                : 'No new payments found'
        });

    } catch (e) {
        console.error('Auto-check payment error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
