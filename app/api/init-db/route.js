import { NextResponse } from 'next/server';
import { db } from '@/lib/db'; // We can't import pool directly easily if not exported, let's just use pg here too or export pool from db.js
import pg from 'pg';

export const dynamic = 'force-dynamic';

export async function GET() {
    if (!process.env.POSTGRES_URL) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Fix: Remove sslmode from query
    let connectionString = process.env.POSTGRES_URL;
    try {
        const url = new URL(process.env.POSTGRES_URL);
        url.searchParams.delete('sslmode');
        connectionString = url.toString();
    } catch (e) { }

    const pool = new pg.Pool({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

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
                delivered BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE TABLE IF NOT EXISTS game_states (
                phone VARCHAR(50) PRIMARY KEY,
                collected_cards TEXT DEFAULT '[]',
                used_tickets INTEGER DEFAULT 0,
                bonus_tickets INTEGER DEFAULT 0,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Migrations for existing tables
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered BOOLEAN DEFAULT FALSE;
            ALTER TABLE game_states ADD COLUMN IF NOT EXISTS bonus_tickets INTEGER DEFAULT 0;
        `);
        return NextResponse.json({ message: 'Database initialized successfully' });
    } catch (error) {
        console.error('Init DB Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        client.release();
        await pool.end();
    }
}
