import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const password = searchParams.get('password');

    // Simple auth check
    if (password !== CONFIG.admin.password) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        if (!CONFIG.sepay.apiKey) {
            return NextResponse.json({ error: 'Missing SePay API Key' }, { status: 500 });
        }

        const res = await fetch(`${CONFIG.sepay.apiUrl}?account_number=${CONFIG.bankInfo.accountNumber}&limit=50`, {
            headers: {
                'Authorization': `Bearer ${CONFIG.sepay.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            return NextResponse.json({ error: `SePay Error: ${res.statusText}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
