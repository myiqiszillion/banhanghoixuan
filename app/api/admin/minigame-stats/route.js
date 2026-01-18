import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const password = searchParams.get('password');

        if (password !== CONFIG.admin.password) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const stats = await db.getAllGameStats();
        return NextResponse.json({ stats });
    } catch (error) {
        console.error('Admin Minigame Stats Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
