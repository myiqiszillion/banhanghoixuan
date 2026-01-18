import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// 11 unique cards
const CARD_COLLECTION = [
    { id: 1, emoji: '🔥', name: 'Hỏa Long' },
    { id: 2, emoji: '❄️', name: 'Tuyết Sơn' },
    { id: 3, emoji: '⭐', name: 'Ngôi Sao' },
    { id: 4, emoji: '🎭', name: 'Lễ Hội' },
    { id: 5, emoji: '🎪', name: 'Hội Xuân' },
    { id: 6, emoji: '🎸', name: 'Âm Nhạc' },
    { id: 7, emoji: '🎨', name: 'Nghệ Thuật' },
    { id: 8, emoji: '🏆', name: 'Vô Địch' },
    { id: 9, emoji: '💎', name: 'Kim Cương' },
    { id: 10, emoji: '🌟', name: 'Siêu Sao' },
    { id: 11, emoji: '👑', name: 'Vương Miện' },
];

// Smart probability function - same as client but verified server-side
function getDuplicateChance(cardCount) {
    if (cardCount === 0) return 0;
    if (cardCount === 1) return 0.20;
    if (cardCount === 2) return 0.30;
    if (cardCount === 3) return 0.45;
    if (cardCount === 4) return 0.55;
    if (cardCount === 5) return 0.70;
    if (cardCount === 6) return 0.80;
    if (cardCount === 7) return 0.88;
    if (cardCount === 8) return 0.93;
    if (cardCount === 9) return 0.97;
    return 0.993; // Last card - legendary!
}

function selectCard(collectedCardIds) {
    const duplicateChance = getDuplicateChance(collectedCardIds.length);

    if (collectedCardIds.length > 0 && collectedCardIds.length < 11 && Math.random() < duplicateChance) {
        // Duplicate
        const randomId = collectedCardIds[Math.floor(Math.random() * collectedCardIds.length)];
        return CARD_COLLECTION.find(c => c.id === randomId);
    } else {
        // New card
        const uncollected = CARD_COLLECTION.filter(c => !collectedCardIds.includes(c.id));
        if (uncollected.length > 0) {
            return uncollected[Math.floor(Math.random() * uncollected.length)];
        }
        return CARD_COLLECTION[Math.floor(Math.random() * CARD_COLLECTION.length)];
    }
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
            collectedCards: gameState?.collectedCards || [],
            usedTickets: gameState?.usedTickets || 0,
            totalTickets: ticketBalance,
            availableTickets: ticketBalance - (gameState?.usedTickets || 0),
            isComplete: (gameState?.collectedCards || []).length === 11
        });
    } catch (error) {
        console.error('Game State Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Flip a card (server-validated)
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
                error: 'Không đủ vé! Mua thêm Tuyết Sơn để nhận vé.',
                availableTickets: 0
            }, { status: 400 });
        }

        // Check if already completed
        if (gameState.collectedCards.length === 11) {
            return NextResponse.json({
                error: 'Bạn đã hoàn thành bộ sưu tập!',
                isComplete: true
            }, { status: 400 });
        }

        // Select card (server-side RNG)
        const selectedCard = selectCard(gameState.collectedCards);
        const isNewCard = !gameState.collectedCards.includes(selectedCard.id);

        // Update game state
        const newCollectedCards = isNewCard
            ? [...gameState.collectedCards, selectedCard.id]
            : gameState.collectedCards;
        const newUsedTickets = gameState.usedTickets + 1;

        await db.updateGameState(phone, {
            collectedCards: newCollectedCards,
            usedTickets: newUsedTickets
        });

        const isComplete = newCollectedCards.length === 11;

        return NextResponse.json({
            success: true,
            card: selectedCard,
            isNew: isNewCard,
            collectedCards: newCollectedCards,
            usedTickets: newUsedTickets,
            availableTickets: ticketBalance - newUsedTickets,
            isComplete
        });

    } catch (error) {
        console.error('Flip Card Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
