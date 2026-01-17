import { NextResponse } from 'next/server';
import pg from 'pg';

export const dynamic = 'force-dynamic';

export async function DELETE(request) {
    try {
        const body = await request.json();
        const { orderCode, all } = body;

        if (!orderCode && !all) {
            return NextResponse.json({ error: 'Missing order code or all flag' }, { status: 400 });
        }

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
            if (all) {
                await client.query('DELETE FROM orders');
                return NextResponse.json({ message: 'All orders deleted' });
            } else {
                const res = await client.query('DELETE FROM orders WHERE order_code = $1 RETURNING *', [orderCode]);
                if (res.rowCount === 0) {
                    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
                }
                return NextResponse.json({ message: 'Order deleted', order: res.rows[0] });
            }
        } finally {
            client.release();
            await pool.end();
        }

    } catch (error) {
        console.error('Delete Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
