import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Cleanup expired orders (pending > 15 minutes)
export async function POST() {
    try {
        const deletedCount = await db.cleanupExpiredOrders(15);
        return NextResponse.json({
            success: true,
            deletedCount,
            message: `Cleaned up ${deletedCount} expired orders`
        });
    } catch (error) {
        console.error('Cleanup Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
