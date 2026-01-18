'use client';

import { useEffect, useState, useCallback } from 'react';
import { getLocalOrders } from '@/lib/storage';

// 11 unique cards for collection
const CARD_COLLECTION = [
    { id: 1, emoji: '🔥', name: 'Hỏa Long', color: '#ff4444' },
    { id: 2, emoji: '❄️', name: 'Tuyết Sơn', color: '#00bcd4' },
    { id: 3, emoji: '⭐', name: 'Ngôi Sao', color: '#ffcc00' },
    { id: 4, emoji: '🎭', name: 'Lễ Hội', color: '#9c27b0' },
    { id: 5, emoji: '🎪', name: 'Hội Xuân', color: '#ff9800' },
    { id: 6, emoji: '🎸', name: 'Âm Nhạc', color: '#e91e63' },
    { id: 7, emoji: '🎨', name: 'Nghệ Thuật', color: '#3f51b5' },
    { id: 8, emoji: '🏆', name: 'Vô Địch', color: '#ffc107' },
    { id: 9, emoji: '💎', name: 'Kim Cương', color: '#00e5ff' },
    { id: 10, emoji: '🌟', name: 'Siêu Sao', color: '#ff5722' },
    { id: 11, emoji: '👑', name: 'Vương Miện', color: '#ffd700' },
];

// Local storage key for collected cards
const STORAGE_KEY = 'minigame_collected_cards';

export default function MiniGameModal({ isOpen, onClose }) {
    const [totalTickets, setTotalTickets] = useState(0);
    const [usedTickets, setUsedTickets] = useState(0);
    const [collectedCards, setCollectedCards] = useState([]);
    const [isFlipping, setIsFlipping] = useState(false);
    const [currentFlippedCard, setCurrentFlippedCard] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [isNewCard, setIsNewCard] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    // Load collected cards from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                setCollectedCards(data.collected || []);
                setUsedTickets(data.usedTickets || 0);
            }
        }
    }, []);

    // Calculate total tickets from orders
    useEffect(() => {
        if (isOpen) {
            const orders = getLocalOrders();
            const tickets = orders.reduce((acc, curr) => acc + (curr.tickets || 0), 0);
            setTotalTickets(tickets);
        }
    }, [isOpen]);

    // Save to localStorage whenever collected cards change
    const saveToStorage = useCallback((collected, used) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                collected,
                usedTickets: used
            }));
        }
    }, []);

    const availableTickets = totalTickets - usedTickets;

    const flipCard = () => {
        if (availableTickets <= 0 || isFlipping) return;

        setIsFlipping(true);
        setShowResult(false);

        // SMART PSYCHOLOGY-BASED PROBABILITY SYSTEM
        // Strategy: Easy start to HOOK players, then progressively impossible
        // Players feel "so close" but can never finish
        let duplicateChance;
        const cardCount = collectedCards.length;

        if (cardCount === 0) {
            duplicateChance = 0; // First card ALWAYS new - instant gratification!
        } else if (cardCount === 1) {
            duplicateChance = 0.20; // 20% dup - fast progress feels good
        } else if (cardCount === 2) {
            duplicateChance = 0.30; // 30% dup - still easy, building hope
        } else if (cardCount === 3) {
            duplicateChance = 0.45; // 45% dup - slight slowdown
        } else if (cardCount === 4) {
            duplicateChance = 0.55; // 55% dup - now it's a challenge
        } else if (cardCount === 5) {
            duplicateChance = 0.70; // 70% dup - "I'm halfway there!"
        } else if (cardCount === 6) {
            duplicateChance = 0.80; // 80% dup - getting tough
        } else if (cardCount === 7) {
            duplicateChance = 0.88; // 88% dup - very hard
        } else if (cardCount === 8) {
            duplicateChance = 0.93; // 93% dup - extremely hard
        } else if (cardCount === 9) {
            duplicateChance = 0.97; // 97% dup - nearly impossible (needs ~33 flips avg)
        } else {
            duplicateChance = 0.993; // 99.3% dup - LAST CARD IS LEGENDARY (~143 flips avg)
        }

        let selectedCard;

        // Check if we should give a duplicate
        if (collectedCards.length > 0 && collectedCards.length < 11 && Math.random() < duplicateChance) {
            // Pick a random card from already collected cards (guaranteed duplicate)
            const randomCollectedId = collectedCards[Math.floor(Math.random() * collectedCards.length)];
            selectedCard = CARD_COLLECTION.find(c => c.id === randomCollectedId);
        } else {
            // Give a card NOT in collection (if possible) or random
            const uncollectedCards = CARD_COLLECTION.filter(c => !collectedCards.includes(c.id));
            if (uncollectedCards.length > 0) {
                selectedCard = uncollectedCards[Math.floor(Math.random() * uncollectedCards.length)];
            } else {
                // All collected - random (shouldn't happen normally)
                selectedCard = CARD_COLLECTION[Math.floor(Math.random() * CARD_COLLECTION.length)];
            }
        }

        // Animation timing
        setTimeout(() => {
            setCurrentFlippedCard(selectedCard);
            setShowResult(true);

            // Check if it's a new card
            const isNew = !collectedCards.includes(selectedCard.id);
            setIsNewCard(isNew);

            // Update collected cards
            const newCollected = isNew
                ? [...collectedCards, selectedCard.id]
                : collectedCards;
            const newUsedTickets = usedTickets + 1;

            setCollectedCards(newCollected);
            setUsedTickets(newUsedTickets);
            saveToStorage(newCollected, newUsedTickets);

            // Check for completion
            if (newCollected.length === 11 && isNew) {
                setTimeout(() => setShowCelebration(true), 500);
            }

            setIsFlipping(false);
        }, 1000);
    };

    const resetCollection = () => {
        if (confirm('Bạn có chắc muốn reset bộ sưu tập? Số vé đã dùng sẽ được giữ nguyên.')) {
            setCollectedCards([]);
            saveToStorage([], usedTickets);
            setShowCelebration(false);
        }
    };

    if (!isOpen) return null;

    const collectionProgress = (collectedCards.length / 11) * 100;

    return (
        <div className="modal-overlay active">
            <div className="modal-content minigame-modal" style={{ maxWidth: '600px' }}>
                <button className="modal-close" onClick={onClose}>&times;</button>

                {/* Header */}
                <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
                    <h2 style={{
                        fontSize: '1.8rem',
                        fontWeight: '900',
                        background: 'linear-gradient(135deg, #ff4444 0%, #ffcc00 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.25rem'
                    }}>
                        🎴 LẬT THẺ SƯU TẬP
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                        Sưu tập đủ 11 thẻ để đổi quà đặc biệt!
                    </p>
                </div>

                {/* Celebration Overlay */}
                {showCelebration && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.9)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                        borderRadius: 'inherit',
                        animation: 'fadeIn 0.5s ease'
                    }}>
                        <div style={{ fontSize: '5rem', marginBottom: '1rem', animation: 'bounce 0.5s ease infinite' }}>🎉</div>
                        <h2 style={{
                            fontSize: '1.8rem',
                            fontWeight: '900',
                            background: 'linear-gradient(135deg, #ffd700 0%, #ffcc00 50%, #ffa500 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '0.5rem',
                            textAlign: 'center'
                        }}>CHÚC MỪNG!</h2>
                        <p style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                            Bạn đã sưu tập đủ 11 thẻ!<br />
                            <strong style={{ color: '#ffcc00' }}>Đến gian hàng 10.11 để nhận quà!</strong>
                        </p>
                        <button
                            onClick={() => setShowCelebration(false)}
                            style={{
                                padding: '0.75rem 2rem',
                                background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                                border: 'none',
                                borderRadius: '50px',
                                color: '#fff',
                                fontWeight: '700',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            ĐÓNG
                        </button>
                    </div>
                )}

                {/* Tickets Display */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{
                        background: 'rgba(255,204,0,0.1)',
                        border: '2px solid #ffcc00',
                        borderRadius: '12px',
                        padding: '1rem',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', fontWeight: '900', color: '#ffcc00' }}>{availableTickets}</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Vé còn lại</div>
                    </div>
                    <div style={{
                        background: 'rgba(102,126,234,0.1)',
                        border: '2px solid #667eea',
                        borderRadius: '12px',
                        padding: '1rem',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '2rem', fontWeight: '900', color: '#667eea' }}>{collectedCards.length}/11</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>Thẻ đã sưu tập</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        height: '10px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${collectionProgress}%`,
                            height: '100%',
                            background: collectionProgress === 100
                                ? 'linear-gradient(90deg, #00d26a, #00ff88)'
                                : 'linear-gradient(90deg, #ff6b35, #ffcc00)',
                            transition: 'width 0.5s ease',
                            borderRadius: '10px'
                        }} />
                    </div>
                    {collectedCards.length === 11 && (
                        <p style={{ textAlign: 'center', color: '#00d26a', fontWeight: 'bold', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                            ✅ Đã hoàn thành bộ sưu tập!
                        </p>
                    )}
                </div>

                {/* Flip Card Area */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '1.5rem',
                    perspective: '1000px'
                }}>
                    <div
                        onClick={flipCard}
                        style={{
                            width: '140px',
                            height: '180px',
                            position: 'relative',
                            cursor: availableTickets > 0 && !isFlipping ? 'pointer' : 'not-allowed',
                            transformStyle: 'preserve-3d',
                            transform: isFlipping ? 'rotateY(180deg)' : showResult ? 'rotateY(180deg)' : 'rotateY(0)',
                            transition: 'transform 0.6s ease',
                            opacity: availableTickets <= 0 && !showResult ? 0.5 : 1
                        }}
                    >
                        {/* Card Back */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                            border: '3px solid #ffcc00',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backfaceVisibility: 'hidden',
                            boxShadow: '0 10px 30px rgba(255,204,0,0.2)'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎴</div>
                            <div style={{ color: '#ffcc00', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                {availableTickets > 0 ? 'NHẤN ĐỂ LẬT' : 'HẾT VÉ'}
                            </div>
                        </div>

                        {/* Card Front (Revealed) */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: currentFlippedCard
                                ? `linear-gradient(135deg, ${currentFlippedCard.color}22 0%, ${currentFlippedCard.color}44 100%)`
                                : 'rgba(0,0,0,0.5)',
                            border: currentFlippedCard ? `3px solid ${currentFlippedCard.color}` : '3px solid #fff',
                            borderRadius: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            boxShadow: currentFlippedCard ? `0 10px 30px ${currentFlippedCard.color}44` : 'none'
                        }}>
                            {currentFlippedCard && (
                                <>
                                    <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>{currentFlippedCard.emoji}</div>
                                    <div style={{
                                        color: currentFlippedCard.color,
                                        fontWeight: 'bold',
                                        fontSize: '1rem',
                                        textAlign: 'center'
                                    }}>
                                        {currentFlippedCard.name}
                                    </div>
                                    {showResult && (
                                        <div style={{
                                            marginTop: '0.5rem',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '50px',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            background: isNewCard ? '#00d26a' : '#ff9800',
                                            color: '#fff'
                                        }}>
                                            {isNewCard ? '✨ MỚI!' : '🔄 TRÙNG'}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Flip Button */}
                <button
                    onClick={flipCard}
                    disabled={availableTickets <= 0 || isFlipping}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: availableTickets > 0 && !isFlipping
                            ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
                            : 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '1.1rem',
                        cursor: availableTickets > 0 && !isFlipping ? 'pointer' : 'not-allowed',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {isFlipping ? (
                        <>⏳ Đang lật...</>
                    ) : availableTickets > 0 ? (
                        <>🎴 LẬT THẺ (-1 vé)</>
                    ) : (
                        <>❌ Hết vé</>
                    )}
                </button>

                {/* Collection Grid */}
                <div style={{ marginBottom: '1rem' }}>
                    <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        marginBottom: '0.75rem',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        📚 Bộ sưu tập của bạn
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                        gap: '0.5rem'
                    }}>
                        {CARD_COLLECTION.map(card => {
                            const isCollected = collectedCards.includes(card.id);
                            return (
                                <div
                                    key={card.id}
                                    style={{
                                        aspectRatio: '1',
                                        background: isCollected
                                            ? `linear-gradient(135deg, ${card.color}22 0%, ${card.color}44 100%)`
                                            : 'rgba(255,255,255,0.05)',
                                        border: isCollected ? `2px solid ${card.color}` : '2px dashed rgba(255,255,255,0.2)',
                                        borderRadius: '10px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s ease',
                                        opacity: isCollected ? 1 : 0.4
                                    }}
                                >
                                    <div style={{ fontSize: '1.5rem' }}>{isCollected ? card.emoji : '❓'}</div>
                                    <div style={{
                                        fontSize: '0.6rem',
                                        color: isCollected ? card.color : 'rgba(255,255,255,0.3)',
                                        fontWeight: '600',
                                        marginTop: '0.25rem',
                                        textAlign: 'center'
                                    }}>
                                        {isCollected ? card.name : '???'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Rules */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '1rem',
                    borderRadius: '10px',
                    marginBottom: '1rem'
                }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#ff4444' }}>
                        📝 THỂ LỆ:
                    </h4>
                    <ul style={{
                        paddingLeft: '1.25rem',
                        fontSize: '0.8rem',
                        color: 'rgba(255,255,255,0.7)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        margin: 0
                    }}>
                        <li>Mỗi <strong>3 phần Tuyết Sơn</strong> = <strong>1 Vé lật thẻ</strong></li>
                        <li>Lật thẻ để sưu tập <strong>11 thẻ khác nhau</strong></li>
                        <li>Thu thập đủ 11 thẻ → <strong>Đổi quà đặc biệt!</strong></li>
                        <li>Thẻ trùng không tính vào bộ sưu tập</li>
                    </ul>
                </div>

                {/* Reset Button */}
                {collectedCards.length > 0 && (
                    <button
                        onClick={resetCollection}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'transparent',
                            border: '1px solid rgba(255,68,68,0.5)',
                            borderRadius: '8px',
                            color: '#ff4444',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        🔄 Reset bộ sưu tập
                    </button>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
}
