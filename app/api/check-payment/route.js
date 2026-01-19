import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const orderCode = searchParams.get('code');

    if (!orderCode) {
        return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    try {
        // Check if order exists in DB
        const orders = await db.getAllOrders();
        const order = orders.find(o => o.orderCode === orderCode);

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Already paid
        if (order.status === 'paid') {
            return NextResponse.json({ paid: true });
        }

        // Check SePay API for matching transaction
        if (!CONFIG.sepay.apiKey) {
            return NextResponse.json({ paid: false });
        }

        const res = await fetch(
            `${CONFIG.sepay.apiUrl}?account_number=${CONFIG.bankInfo.accountNumber}&limit=20`,
            {
                headers: {
                    'Authorization': `Bearer ${CONFIG.sepay.apiKey}`,
                    'Content-Type': 'application/json'
                },
                cache: 'no-store'
            }
        );

        if (!res.ok) {
            return NextResponse.json({ paid: false });
        }

        const data = await res.json();

        if (data.status !== 200 || !data.transactions) {
            return NextResponse.json({ paid: false });
        }

        // Find matching transaction
        const matching = data.transactions.find(tx => {
            const content = (tx.transaction_content || tx.description || '').toUpperCase();
            const isMatch = content.includes(orderCode.toUpperCase());
            const txAmount = Math.round(parseFloat(tx.amount_in || tx.amount || 0));
            const orderTotal = parseInt(order.total) || 0;
            return isMatch && txAmount === orderTotal;
        });

        if (matching) {
            // Update order status to paid
            order.status = 'paid';
            await db.addOrder(order);
            return NextResponse.json({ paid: true });
        }

        return NextResponse.json({ paid: false });

    } catch (e) {
        console.error('Payment check error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
