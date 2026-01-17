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
        if (!CONFIG.sepay.apiKey) {
            console.error('SePay API Key is missing');
            // Allow debugging: return indication
            return NextResponse.json({ paid: false, error: 'Configuration Error: Missing API Key' });
        }

        if (CONFIG.sepay.apiKey) {
            // Log for debugging
            console.log(`Checking SePay for code: ${orderCode}`);

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
                        const isMatch = content.toUpperCase().includes(orderCode.toUpperCase());

                        // Sanitize amount: remove ALL non-numeric characters (dots, commas)
                        // Example: "20.000" -> "20000", "20,000" -> "20000"
                        const txAmountStr = String(tx.amount_in).replace(/[^0-9]/g, '');
                        const txAmount = parseFloat(txAmountStr);

                        if (isMatch) {
                            console.log(`Debug Payment: Code Match found. Content: ${content}. Amount SePay: ${tx.amount_in} -> Parsed: ${txAmount}. Order Total: ${order ? order.total : 0}`);
                        }

                        // Compare
                        return isMatch && txAmount >= (order ? order.total : 0);
                    });

                    if (matching) {
                        isPaid = true;
                        // Update status in DB
                        if (order) {
                            order.status = 'paid';
                            // We need to re-save. db.addOrder handles update.
                            try {
                                await db.addOrder(order);
                            } catch (dbError) {
                                console.error('Failed to update order status in DB:', dbError);
                            }
                        }
                    }
                }
            } else {
                console.error('SePay API Error:', res.status, res.statusText);
            }
        }

        return NextResponse.json({ paid: isPaid });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
