import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

// Debug endpoint to see raw SePay transactions (REMOVE IN PRODUCTION!)
export async function GET() {
    try {
        if (!CONFIG.sepay.apiKey) {
            return NextResponse.json({ error: 'Missing SePay API Key' });
        }

        const res = await fetch(`${CONFIG.sepay.apiUrl}?account_number=${CONFIG.bankInfo.accountNumber}&limit=10`, {
            headers: {
                'Authorization': `Bearer ${CONFIG.sepay.apiKey}`,
                'Content-Type': 'application/json'
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            return NextResponse.json({ error: `SePay API Error: ${res.status}` });
        }

        const data = await res.json();

        // Return raw data with simplified view
        const transactions = (data.transactions || []).map(tx => ({
            id: tx.id,
            amount_in: tx.amount_in,
            amount: tx.amount,
            content: tx.transaction_content || tx.description,
            date: tx.transaction_date,
            reference: tx.reference_number
        }));

        return NextResponse.json({
            status: data.status,
            account: CONFIG.bankInfo.accountNumber,
            count: transactions.length,
            transactions
        });
    } catch (e) {
        return NextResponse.json({ error: e.message });
    }
}
