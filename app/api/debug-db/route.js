import { NextResponse } from 'next/server';
import pg from 'pg';

export const dynamic = 'force-dynamic';

export async function GET() {
    const debugInfo = {
        env: {
            hasPostgresUrl: !!process.env.POSTGRES_URL,
            urlPrefix: process.env.POSTGRES_URL?.substring(0, 15) + '...'
        },
        connection: null,
        query: null,
        error: null
    };

    try {
        if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL is missing');

        const pool = new pg.Pool({
            connectionString: process.env.POSTGRES_URL,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000 // Fail fast
        });

        const client = await pool.connect();
        debugInfo.connection = 'Success';

        try {
            // Test SELECT to check table existence
            const resSelect = await client.query('SELECT count(*) FROM orders');
            debugInfo.query = { type: 'SELECT', rowCount: resSelect.rows[0].count };

            // Test Column Existence
            const resColumn = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='orders' AND column_name='delivered'
            `);
            debugInfo.hasDeliveredColumn = resColumn.rows.length > 0;

        } finally {
            client.release();
            await pool.end();
        }

        return NextResponse.json(debugInfo);
    } catch (e) {
        debugInfo.error = {
            message: e.message,
            stack: e.stack,
            code: e.code
        };
        return NextResponse.json(debugInfo, { status: 500 });
    }
}
