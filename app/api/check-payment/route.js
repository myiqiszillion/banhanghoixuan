import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const orderCode = searchParams.get('code');

    if (!orderCode) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

    try {
        let isPaid = false;

        // 1. Check DB first (manual update by admin)
        const orders = await db.getAllOrders();
        let order = orders.find(o => o.orderCode === orderCode);

        if (order && order.status === 'paid') {
            return NextResponse.json({ paid: true });
        }

        // 2. Check SePay API
        if (CONFIG.sepay.apiKey) {
            const res = await fetch(`${CONFIG.sepay.apiUrl}?account_number=${CONFIG.bankInfo.accountNumber}&limit=20`, {
                headers: {
                    'Authorization': `Bearer ${CONFIG.sepay.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
                if (data.status === 200 && data.transactions) {
                    const matching = data.transactions.find(tx => {
                        const content = tx.transaction_content || tx.description || '';
                        // Check strictly for orderCode
                        return content.toUpperCase().includes(orderCode.toUpperCase()) &&
                            parseFloat(tx.amount_in) >= (order ? order.total : 0);
                    });

                    if (matching) {
                        isPaid = true;
                        // Update status in DB
                        if (order) {
                            order.status = 'paid';
                            await db.addOrder(order);
                        }
                    }
                }
            }
        }

        return NextResponse.json({ paid: isPaid });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
