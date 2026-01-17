import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                order_code VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                class_name VARCHAR(50),
                quantity INTEGER NOT NULL,
                note TEXT,
                total INTEGER NOT NULL,
                tickets INTEGER DEFAULT 0,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        return NextResponse.json({ message: 'Database initialized successfully' });
    } catch (error) {
        console.error('Init DB Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
