import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
    if (!pool) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const client = await pool.connect();
    try {
        await client.query(`
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
        `);
        return NextResponse.json({ message: 'Database initialized successfully' });
    } catch (error) {
        console.error('Init DB Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
