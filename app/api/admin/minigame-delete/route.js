import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CONFIG } from '@/lib/config';

export async function POST(request) {
    try {
        const body = await request.json();
        const { phone, password } = body;

        // Security check
        if (password !== CONFIG.admin.password) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!phone) {
            return NextResponse.json({ error: 'Missing phone number' }, { status: 400 });
        }

        const success = await db.deleteGameState(phone);

        if (success) {
            return NextResponse.json({ success: true, message: 'Deleted game state' });
        } else {
            return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
        }

    } catch (error) {
        console.error('API Minigame Delete Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
