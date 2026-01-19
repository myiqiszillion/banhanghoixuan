import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 4 prizes for lucky wheel with weights (higher = more likely)
const PRIZES = [
    { id: 0, label: 'Chúc bạn may mắn lần sau', emoji: '🍀', weight: 40 }, // 40%
    { id: 1, label: '1 ly nước', emoji: '🥤', weight: 30 }, // 30%
    { id: 2, label: '+1 xiên', emoji: '🍡', weight: 20 }, // 20%
    { id: 3, label: '10K', emoji: '💰', weight: 10 }, // 10%
];

// Weighted random selection
function selectPrize() {
    const totalWeight = PRIZES.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < PRIZES.length; i++) {
        random -= PRIZES[i].weight;
        if (random <= 0) {
            return i;
        }
    }
    return 0; // Default to first prize
}

// GET: Get player's game state
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const phone = searchParams.get('phone');

        if (!phone) {
            return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
        }

        const gameState = await db.getGameState(phone);
        const ticketBalance = await db.getTicketBalance(phone);

        return NextResponse.json({
            phone,
            collectedCards: gameState?.collectedCards || [], // Keep for backward compat
            usedTickets: gameState?.usedTickets || 0,
            totalTickets: ticketBalance,
            availableTickets: ticketBalance - (gameState?.usedTickets || 0)
        });
    } catch (error) {
        console.error('Game State Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Spin the wheel (server-validated)
export async function POST(request) {
    try {
        const body = await request.json();
        const { phone } = body;

        if (!phone) {
            return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
        }

        // Get current game state
        const gameState = await db.getGameState(phone) || { collectedCards: [], usedTickets: 0 };
        const ticketBalance = await db.getTicketBalance(phone);
        const availableTickets = ticketBalance - gameState.usedTickets;

        // Check if player has tickets
        if (availableTickets <= 0) {
            return NextResponse.json({
                error: 'Không đủ lượt quay! Mua thêm Tuyết Sơn để nhận lượt.',
                availableTickets: 0
            }, { status: 400 });
        }

        // Select prize (server-side weighted RNG)
        const prizeIndex = selectPrize();
        const prize = PRIZES[prizeIndex];

        // Update game state (increment used tickets)
        const newUsedTickets = gameState.usedTickets + 1;

        await db.updateGameState(phone, {
            collectedCards: gameState.collectedCards, // Keep existing data
            usedTickets: newUsedTickets
        });

        return NextResponse.json({
            success: true,
            prizeIndex: prizeIndex,
            prize: prize,
            usedTickets: newUsedTickets,
            availableTickets: ticketBalance - newUsedTickets
        });

    } catch (error) {
        console.error('Spin Wheel Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

