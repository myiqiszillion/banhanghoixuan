import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const orderCode = searchParams.get('code');

    const debugResult = {
        config: {
            hasApiKey: !!CONFIG.sepay.apiKey,
            apiKeyPrefix: CONFIG.sepay.apiKey ? CONFIG.sepay.apiKey.substring(0, 5) + '...' : 'NONE',
            apiUrl: CONFIG.sepay.apiUrl,
            acc: CONFIG.bankInfo.accountNumber
        },
        lookupCode: orderCode,
        apiResponse: null,
        error: null,
        matchFound: false
    };

    try {
        if (!CONFIG.sepay.apiKey) {
            throw new Error('Missing API Key');
        }

        const res = await fetch(`${CONFIG.sepay.apiUrl}?account_number=${CONFIG.bankInfo.accountNumber}&limit=20`, {
            headers: {
                'Authorization': `Bearer ${CONFIG.sepay.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        debugResult.apiStatus = res.status;

        if (res.ok) {
            const data = await res.json();
            // Sanitize data for safety (hide full sensitive info if needed, but here we need to see it)
            debugResult.apiResponse = data;

            if (data.transactions) {
                // Return top 5 transactions for debugging
                debugResult.recentTransactions = data.transactions.slice(0, 5).map(tx => ({
                    id: tx.id,
                    date: tx.transaction_date,
                    amount: tx.amount_in,
                    content: tx.transaction_content,
                    desc: tx.description
                }));

                const match = data.transactions.find(tx => {
                    const content = tx.transaction_content || tx.description || '';
                    const isCodeMatch = orderCode && content.toUpperCase().includes(orderCode.toUpperCase());

                    if (isCodeMatch) {
                        const txAmountStr = String(tx.amount_in).replace(/[^0-9]/g, '');
                        const txAmount = parseFloat(txAmountStr);
                        // Log match candidate
                        debugResult.candidates = debugResult.candidates || [];
                        debugResult.candidates.push({
                            content,
                            amountRaw: tx.amount_in,
                            amountParsed: txAmount
                        });
                    }

                    return isCodeMatch;
                });

                if (match) {
                    debugResult.matchFound = true;
                    debugResult.matchedTransaction = match;
                }
            }
        } else {
            debugResult.error = await res.text();
        }
    } catch (e) {
        debugResult.error = e.message;
        debugResult.stack = e.stack;
    }

    return NextResponse.json(debugResult);
}
