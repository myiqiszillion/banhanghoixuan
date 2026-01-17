import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import pg from 'pg';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();
        const { orderCode, status, delivered } = body;

        if (!orderCode) {
            return NextResponse.json({ error: 'Missing order code' }, { status: 400 });
        }

        // We need a direct update method in db or just use raw query here for simplicity/speed
        // Since we are using pg pool in db.js, we can reuse it, or just use a new client.
        // Let's assume db.js logic is complex to extend quickly, so we use direct query here safely.

        if (!process.env.POSTGRES_URL) {
            return NextResponse.json({ error: 'DB not configured' }, { status: 500 });
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
            // Build dynamic update query
            const updates = [];
            const values = [];
            let paramCounter = 1;

            if (status !== undefined) {
                updates.push(`status = $${paramCounter++}`);
                values.push(status);
            }
            if (delivered !== undefined) {
                updates.push(`delivered = $${paramCounter++}`);
                values.push(delivered);
            }

            if (updates.length === 0) {
                return NextResponse.json({ message: 'No changes' });
            }

            values.push(orderCode);
            const query = `
                UPDATE orders 
                SET ${updates.join(', ')} 
                WHERE order_code = $${paramCounter}
                RETURNING *
            `;

            const { rows } = await client.query(query, values);

            if (rows.length === 0) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }

            return NextResponse.json(rows[0]);
        } finally {
            client.release();
            await pool.end();
        }

    } catch (error) {
        console.error('Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
