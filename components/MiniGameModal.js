'use client';

import { useEffect, useState, useCallback } from 'react';

// 11 unique cards for collection (display only)
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

export default function MiniGameModal({ isOpen, onClose }) {
    const [phone, setPhone] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Game state from server
    const [availableTickets, setAvailableTickets] = useState(0);
    const [collectedCards, setCollectedCards] = useState([]);
    const [usedTickets, setUsedTickets] = useState(0);

    // UI state
    const [isFlipping, setIsFlipping] = useState(false);
    const [currentFlippedCard, setCurrentFlippedCard] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [isNewCard, setIsNewCard] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    // Load game state from server
    const loadGameState = useCallback(async (phoneNum) => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/minigame?phone=${encodeURIComponent(phoneNum)}`);
            const data = await res.json();

            if (data.error) {
                setError(data.error);
                return false;
            }

            setCollectedCards(data.collectedCards || []);
            setUsedTickets(data.usedTickets || 0);
            setAvailableTickets(data.availableTickets || 0);

            if (data.isComplete) {
                setShowCelebration(true);
            }

            return true;
        } catch (e) {
            setError('Không thể kết nối server');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Verify phone and load game
    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');

        if (!phone || phone.length !== 10) {
            setError('Vui lòng nhập đúng 10 số điện thoại');
            return;
        }

        const success = await loadGameState(phone);
        if (success) {
            setIsVerified(true);
        }
    };

    // Flip card (server-validated)
    const flipCard = async () => {
        if (availableTickets <= 0 || isFlipping) return;

        setIsFlipping(true);
        setShowResult(false);
        setError('');

        try {
            const res = await fetch('/api/minigame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone })
            });

            const data = await res.json();

            if (data.error) {
                setError(data.error);
                setIsFlipping(false);
                return;
            }

            // Animate card flip
            setTimeout(() => {
                const fullCard = CARD_COLLECTION.find(c => c.id === data.card.id);
                setCurrentFlippedCard(fullCard);
                setShowResult(true);
                setIsNewCard(data.isNew);
                setCollectedCards(data.collectedCards);
                setUsedTickets(data.usedTickets);
                setAvailableTickets(data.availableTickets);

                if (data.isComplete) {
                    setTimeout(() => setShowCelebration(true), 500);
                }

                setIsFlipping(false);
            }, 600);

        } catch (e) {
            setError('Lỗi kết nối server');
            setIsFlipping(false);
        }
    };

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setPhone('');
            setIsVerified(false);
            setError('');
            setShowResult(false);
            setCurrentFlippedCard(null);
        }
    }, [isOpen]);

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
                        marginBottom: '0.5rem'
                    }}>
                        🎴 LẬT THẺ SƯU TẬP
                    </h2>

                    {/* Prize Display */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,107,53,0.15) 100%)',
                        border: '2px solid #ffd700',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        marginTop: '0.5rem'
                    }}>
                        <div style={{ fontSize: '0.75rem', color: '#ffd700', fontWeight: '600', letterSpacing: '1px' }}>
                            🏆 GIẢI THƯỞNG
                        </div>
                        <div style={{
                            fontSize: '1.8rem',
                            fontWeight: '900',
                            background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            lineHeight: 1.2
                        }}>
                            5.555.555đ
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                            Sưu tập đủ 11 thẻ để nhận giải!
                        </div>
                    </div>
                </div>

                {/* Celebration Overlay */}
                {showCelebration && (
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.95)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                        borderRadius: 'inherit'
                    }}>
                        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
                        <h2 style={{
                            fontSize: '1.8rem',
                            fontWeight: '900',
                            background: 'linear-gradient(135deg, #ffd700 0%, #ffcc00 50%, #ffa500 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '0.5rem',
                            textAlign: 'center'
                        }}>CHÚC MỪNG!</h2>
                        <p style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1rem', textAlign: 'center' }}>
                            Bạn đã sưu tập đủ 11 thẻ!<br />
                            <strong style={{ color: '#ffcc00' }}>SĐT: {phone}</strong>
                        </p>
                        <p style={{ color: '#00d26a', fontSize: '1rem', marginBottom: '1.5rem', textAlign: 'center' }}>
                            📸 Chụp màn hình này và đến gian hàng 10.11 để nhận giải!
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

                {/* Phone Verification */}
                {!isVerified ? (
                    <form onSubmit={handleVerify} style={{ textAlign: 'center' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '2rem',
                            borderRadius: '16px',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
                            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>XÁC THỰC ĐỂ CHƠI</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                Nhập số điện thoại đã dùng để đặt hàng
                            </p>
                            <p style={{
                                color: '#ffcc00',
                                fontSize: '0.8rem',
                                marginBottom: '1.5rem',
                                padding: '0.5rem',
                                background: 'rgba(255,204,0,0.1)',
                                borderRadius: '8px'
                            }}>
                                💡 Lưu ý: Dùng đúng SĐT khi mua hàng để nhận vé!
                            </p>

                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="Số điện thoại (10 số)"
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    fontSize: '1.2rem',
                                    textAlign: 'center',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    marginBottom: '1rem',
                                    fontFamily: 'monospace'
                                }}
                            />

                            {error && (
                                <p style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                    ❌ {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || phone.length !== 10}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    background: phone.length === 10
                                        ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
                                        : 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontWeight: '700',
                                    fontSize: '1.1rem',
                                    cursor: phone.length === 10 ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {isLoading ? '⏳ Đang xác thực...' : '🎮 VÀO CHƠI'}
                            </button>
                        </div>

                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                            💡 Vé được tính từ đơn hàng đã thanh toán thành công
                        </p>
                    </form>
                ) : (
                    <>
                        {/* Verified Player Info */}
                        <div style={{
                            background: 'rgba(0,210,106,0.1)',
                            border: '1px solid #00d26a',
                            borderRadius: '8px',
                            padding: '0.5rem 1rem',
                            marginBottom: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ color: '#00d26a', fontSize: '0.85rem' }}>
                                ✅ SĐT: {phone}
                            </span>
                            <button
                                onClick={() => setIsVerified(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                Đổi SĐT
                            </button>
                        </div>

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
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div style={{
                                background: 'rgba(255,68,68,0.1)',
                                border: '1px solid #ff4444',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                marginBottom: '1rem',
                                textAlign: 'center',
                                color: '#ff4444',
                                fontSize: '0.9rem'
                            }}>
                                ❌ {error}
                            </div>
                        )}

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
                                    transform: isFlipping || showResult ? 'rotateY(180deg)' : 'rotateY(0)',
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
                                            <div style={{ color: currentFlippedCard.color, fontWeight: 'bold', fontSize: '1rem', textAlign: 'center' }}>
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
                                <>❌ Hết vé - Mua thêm Tuyết Sơn!</>
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
                                gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
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
                                                fontSize: '0.55rem',
                                                color: isCollected ? card.color : 'rgba(255,255,255,0.3)',
                                                fontWeight: '600',
                                                marginTop: '0.2rem',
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
                            borderRadius: '10px'
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
                                <li>Mỗi <strong>3 phần Tuyết Sơn</strong> đã thanh toán = <strong>1 Vé</strong></li>
                                <li>Lật thẻ để sưu tập <strong>11 thẻ khác nhau</strong></li>
                                <li>Thu thập đủ 11 thẻ → <strong>Nhận giải 5.555.555đ!</strong></li>
                                <li style={{ color: '#ff4444' }}>⚠️ Mỗi SĐT chỉ được 1 lần trúng giải</li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
