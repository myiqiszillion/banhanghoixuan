import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request) {
    try {
        const order = await request.json();
        const savedOrder = await db.addOrder(order);
        return NextResponse.json(savedOrder);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(request) {
    // Basic API to list orders
    try {
        const orders = await db.getAllOrders();
        return NextResponse.json(orders);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
