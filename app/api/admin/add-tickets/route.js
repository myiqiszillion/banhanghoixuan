import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

// POST: Add bonus tickets to a player
export async function POST(request) {
    try {
        const body = await request.json();
        const { password, phone, tickets } = body;

        // Validate admin password
        if (password !== CONFIG.admin.password) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!phone) {
            return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
        }

        const ticketsToAdd = parseInt(tickets) || 1;

        // Get current game state
        const gameState = await db.getGameState(phone) || { usedTickets: 0, bonusTickets: 0 };

        // Add bonus tickets by reducing usedTickets (negative usedTickets = bonus)
        const newUsedTickets = Math.max(0, gameState.usedTickets - ticketsToAdd);

        const success = await db.updateGameState(phone, {
            usedTickets: newUsedTickets,
            bonusTickets: (gameState.bonusTickets || 0) + ticketsToAdd
        });

        if (!success) {
            throw new Error('Failed to update database. Did you run the migration?');
        }

        return NextResponse.json({
            success: true,
            message: `Đã thêm ${ticketsToAdd} vé cho ${phone}`,
            phone,
            addedTickets: ticketsToAdd
        });

    } catch (error) {
        console.error('Add Tickets Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
