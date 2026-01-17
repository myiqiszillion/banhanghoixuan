import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const orders = await db.getAllOrders();
        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();

        // Validation (Basic)
        if (!body.name || !body.phone || !body.quantity) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const newOrder = {
            orderCode: body.orderCode,
            name: body.name,
            phone: body.phone,
            class: body.class,
            quantity: body.quantity,
            note: body.note,
            total: body.total,
            tickets: body.tickets,
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        const savedOrder = await db.addOrder(newOrder);
        return NextResponse.json(savedOrder);

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
