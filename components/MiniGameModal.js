'use client';

import { useEffect, useState, useCallback } from 'react';

// 8 segments for a proper lucky wheel - alternating colors, smart distribution
const WHEEL_SEGMENTS = [
    { id: 0, label: 'May mắn', emoji: '🍀', color: '#6B7280', isLose: true },
    { id: 1, label: '+1 Xiên', emoji: '🍡', color: '#F97316', isLose: false },
    { id: 2, label: 'May mắn', emoji: '🍀', color: '#8B5CF6', isLose: true },
    { id: 3, label: '10K', emoji: '💰', color: '#FBBF24', isLose: false },
    { id: 4, label: 'May mắn', emoji: '🍀', color: '#10B981', isLose: true },
    { id: 5, label: '1 Ly nước', emoji: '🥤', color: '#3B82F6', isLose: false },
    { id: 6, label: 'May mắn', emoji: '🍀', color: '#EC4899', isLose: true },
    { id: 7, label: '+1 Xiên', emoji: '🍡', color: '#EF4444', isLose: false },
];

// Weight distribution (higher = more likely)
const PRIZE_WEIGHTS = {
    0: 20, // May mắn
    1: 12, // +1 Xiên
    2: 20, // May mắn
    3: 6,  // 10K (rare)
    4: 20, // May mắn
    5: 10, // 1 Ly nước
    6: 20, // May mắn
    7: 12, // +1 Xiên
};

export default function MiniGameModal({ isOpen, onClose }) {
    const [phone, setPhone] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [availableTickets, setAvailableTickets] = useState(0);
    const [usedTickets, setUsedTickets] = useState(0);

    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [currentPrize, setCurrentPrize] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [prizeHistory, setPrizeHistory] = useState([]);

    const loadGameState = useCallback(async (phoneNum) => {
        try {
            setIsLoading(true);
            const res = await fetch(`/api/minigame?phone=${encodeURIComponent(phoneNum)}`);
            const data = await res.json();

            if (data.error) {
                setError(data.error);
                return false;
            }

            setUsedTickets(data.usedTickets || 0);
            setAvailableTickets(data.availableTickets || 0);
            return true;
        } catch (e) {
            setError('Không thể kết nối server');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

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

    // Weighted random selection for 8 segments
    const selectPrizeIndex = () => {
        const totalWeight = Object.values(PRIZE_WEIGHTS).reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
            random -= PRIZE_WEIGHTS[i];
            if (random <= 0) return i;
        }
        return 0;
    };

    const spinWheel = async () => {
        if (availableTickets <= 0 || isSpinning) return;

        setIsSpinning(true);
        setShowResult(false);
        setError('');

        try {
            const res = await fetch('/api/minigame', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, gameType: 'wheel' })
            });

            const data = await res.json();

            if (data.error) {
                setError(data.error);
                setIsSpinning(false);
                return;
            }

            // Use server prize index or calculate locally
            const prizeIndex = data.prizeIndex !== undefined
                ? data.prizeIndex % WHEEL_SEGMENTS.length
                : selectPrizeIndex();
            const prize = WHEEL_SEGMENTS[prizeIndex];

            // Calculate rotation
            const segmentAngle = 360 / WHEEL_SEGMENTS.length;
            const prizeAngle = prizeIndex * segmentAngle + segmentAngle / 2;
            const spins = 5 + Math.random() * 3;
            const targetRotation = rotation + (360 * spins) + (360 - prizeAngle) + 90;

            setRotation(targetRotation);

            setTimeout(() => {
                setCurrentPrize(prize);
                setShowResult(true);
                setIsSpinning(false);
                setUsedTickets(data.usedTickets);
                setAvailableTickets(data.availableTickets);

                setPrizeHistory(prev => [{
                    prize: prize,
                    time: new Date().toLocaleTimeString('vi-VN')
                }, ...prev].slice(0, 5));
            }, 4500);

        } catch (e) {
            setError('Lỗi kết nối server');
            setIsSpinning(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setPhone('');
            setIsVerified(false);
            setError('');
            setShowResult(false);
            setCurrentPrize(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const segmentAngle = 360 / WHEEL_SEGMENTS.length;

    return (
        <div className="modal-overlay active">
            <div className="modal-content minigame-modal" style={{ maxWidth: '450px', padding: '1.5rem' }}>
                <button className="modal-close" onClick={onClose}>&times;</button>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <h2 style={{
                        fontSize: '1.6rem',
                        fontWeight: '900',
                        background: 'linear-gradient(135deg, #ff6b35 0%, #ffd700 50%, #ff6b35 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.3rem'
                    }}>
                        🎡 VÒNG QUAY MAY MẮN
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                        Quay để nhận quà hấp dẫn!
                    </p>
                </div>

                {!isVerified ? (
                    <form onSubmit={handleVerify} style={{ textAlign: 'center' }}>
                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '1.5rem',
                            borderRadius: '16px',
                            marginBottom: '1rem'
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔐</div>
                            <h3 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.1rem' }}>XÁC THỰC ĐỂ CHƠI</h3>
                            <p style={{
                                color: '#ffcc00',
                                fontSize: '0.8rem',
                                marginBottom: '1rem',
                                padding: '0.5rem',
                                background: 'rgba(255,204,0,0.1)',
                                borderRadius: '8px'
                            }}>
                                💡 Mỗi 3 phần Tuyết Sơn = 1 lượt quay!
                            </p>

                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                placeholder="Số điện thoại (10 số)"
                                style={{
                                    width: '100%',
                                    padding: '0.9rem',
                                    fontSize: '1.1rem',
                                    textAlign: 'center',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '2px solid rgba(255,255,255,0.2)',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    marginBottom: '0.75rem',
                                    fontFamily: 'monospace'
                                }}
                            />

                            {error && (
                                <p style={{ color: '#ff4444', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                                    ❌ {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || phone.length !== 10}
                                style={{
                                    width: '100%',
                                    padding: '0.9rem',
                                    background: phone.length === 10
                                        ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
                                        : 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    cursor: phone.length === 10 ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {isLoading ? '⏳ Đang xác thực...' : '🎡 VÀO CHƠI'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        {/* Player Info */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(0,210,106,0.1)',
                            border: '1px solid #00d26a',
                            borderRadius: '8px',
                            padding: '0.4rem 0.8rem',
                            marginBottom: '1rem'
                        }}>
                            <span style={{ color: '#00d26a', fontSize: '0.8rem' }}>✅ {phone}</span>
                            <div style={{
                                background: '#ffcc00',
                                color: '#000',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '50px',
                                fontWeight: '800',
                                fontSize: '0.85rem'
                            }}>
                                🎟️ {availableTickets} lượt
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(255,68,68,0.1)',
                                border: '1px solid #ff4444',
                                borderRadius: '8px',
                                padding: '0.5rem',
                                marginBottom: '0.75rem',
                                textAlign: 'center',
                                color: '#ff4444',
                                fontSize: '0.85rem'
                            }}>
                                ❌ {error}
                            </div>
                        )}

                        {/* Lucky Wheel Container */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: '1rem',
                            position: 'relative'
                        }}>
                            {/* Pointer */}
                            <div style={{
                                position: 'absolute',
                                top: '-5px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 10,
                                fontSize: '1.8rem',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                            }}>
                                🔻
                            </div>

                            {/* Wheel Outer Ring */}
                            <div style={{
                                width: '290px',
                                height: '290px',
                                borderRadius: '50%',
                                padding: '8px',
                                background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 50%, #ffd700 100%)',
                                boxShadow: '0 0 40px rgba(255,215,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)',
                                position: 'relative'
                            }}>
                                {/* Wheel */}
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transform: `rotate(${rotation}deg)`,
                                    transition: isSpinning ? 'transform 4.5s cubic-bezier(0.17, 0.67, 0.05, 0.99)' : 'none',
                                    background: '#1a1a2e'
                                }}>
                                    {/* Segments using conic-gradient */}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        borderRadius: '50%',
                                        background: `conic-gradient(
                                            ${WHEEL_SEGMENTS.map((seg, i) =>
                                            `${seg.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
                                        ).join(', ')}
                                        )`
                                    }} />

                                    {/* Segment Dividers */}
                                    {WHEEL_SEGMENTS.map((_, i) => (
                                        <div
                                            key={`divider-${i}`}
                                            style={{
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                width: '50%',
                                                height: '2px',
                                                background: 'rgba(255,255,255,0.3)',
                                                transformOrigin: '0 50%',
                                                transform: `rotate(${i * segmentAngle}deg)`
                                            }}
                                        />
                                    ))}

                                    {/* Prize Labels */}
                                    {WHEEL_SEGMENTS.map((segment, i) => {
                                        const angle = i * segmentAngle + segmentAngle / 2;
                                        return (
                                            <div
                                                key={`label-${segment.id}`}
                                                style={{
                                                    position: 'absolute',
                                                    left: '50%',
                                                    top: '50%',
                                                    transform: `rotate(${angle}deg) translateX(55px)`,
                                                    transformOrigin: '0 0',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    width: '60px',
                                                    marginLeft: '-30px'
                                                }}
                                            >
                                                <span style={{
                                                    fontSize: '1.4rem',
                                                    transform: `rotate(${-angle - rotation}deg)`,
                                                    transition: 'none'
                                                }}>
                                                    {segment.emoji}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.55rem',
                                                    fontWeight: 'bold',
                                                    color: '#fff',
                                                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                                    textAlign: 'center',
                                                    lineHeight: 1.1,
                                                    marginTop: '2px',
                                                    transform: `rotate(${-angle - rotation}deg)`,
                                                    transition: 'none'
                                                }}>
                                                    {segment.label}
                                                </span>
                                            </div>
                                        );
                                    })}

                                    {/* Center Button */}
                                    <div style={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
                                        border: '4px solid #ffd700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.3rem',
                                        boxShadow: '0 0 15px rgba(0,0,0,0.5)',
                                        zIndex: 5
                                    }}>
                                        🎡
                                    </div>
                                </div>
                            </div>

                            {/* Light Dots */}
                            {[...Array(12)].map((_, i) => (
                                <div
                                    key={`light-${i}`}
                                    style={{
                                        position: 'absolute',
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: isSpinning
                                            ? (i % 2 === 0 ? '#ffd700' : '#fff')
                                            : '#ffd700',
                                        left: '50%',
                                        top: '50%',
                                        transform: `rotate(${i * 30}deg) translateY(-152px)`,
                                        transformOrigin: '0 0',
                                        boxShadow: '0 0 6px rgba(255,215,0,0.8)',
                                        animation: isSpinning ? `blink 0.3s infinite ${i * 0.05}s` : 'none'
                                    }}
                                />
                            ))}
                        </div>

                        {/* Result Display */}
                        {showResult && currentPrize && (
                            <div style={{
                                background: currentPrize.isLose
                                    ? 'rgba(100,100,100,0.15)'
                                    : 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,107,53,0.15) 100%)',
                                border: `2px solid ${currentPrize.isLose ? '#666' : '#ffd700'}`,
                                borderRadius: '12px',
                                padding: '0.75rem',
                                marginBottom: '0.75rem',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>{currentPrize.emoji}</div>
                                <div style={{
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    color: currentPrize.isLose ? '#aaa' : '#ffd700'
                                }}>
                                    {currentPrize.isLose ? 'Chúc bạn may mắn lần sau!' : `🎉 Bạn nhận được: ${currentPrize.label}`}
                                </div>
                                {!currentPrize.isLose && (
                                    <p style={{ color: '#00d26a', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                                        📸 Chụp màn hình để nhận quà tại gian hàng 10.11!
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Spin Button */}
                        <button
                            onClick={spinWheel}
                            disabled={availableTickets <= 0 || isSpinning}
                            style={{
                                width: '100%',
                                padding: '0.9rem',
                                background: availableTickets > 0 && !isSpinning
                                    ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
                                    : 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#fff',
                                fontWeight: '700',
                                fontSize: '1rem',
                                cursor: availableTickets > 0 && !isSpinning ? 'pointer' : 'not-allowed',
                                marginBottom: '0.75rem',
                                boxShadow: availableTickets > 0 && !isSpinning
                                    ? '0 4px 15px rgba(255,107,53,0.4)'
                                    : 'none'
                            }}
                        >
                            {isSpinning ? '⏳ Đang quay...' : availableTickets > 0 ? '🎡 QUAY NGAY' : '❌ Hết lượt'}
                        </button>

                        {/* Prize History */}
                        {prizeHistory.length > 0 && (
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                padding: '0.5rem 0.75rem',
                                borderRadius: '8px',
                                marginBottom: '0.5rem'
                            }}>
                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.3rem' }}>
                                    Lịch sử:
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {prizeHistory.map((item, i) => (
                                        <span key={i} style={{
                                            background: item.prize.isLose ? 'rgba(100,100,100,0.3)' : 'rgba(255,215,0,0.2)',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '50px',
                                            fontSize: '0.7rem',
                                            color: item.prize.isLose ? '#999' : '#ffd700'
                                        }}>
                                            {item.prize.emoji} {item.prize.label}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Mini Rules */}
                        <div style={{
                            fontSize: '0.7rem',
                            color: 'rgba(255,255,255,0.4)',
                            textAlign: 'center'
                        }}>
                            💡 Mua 3 phần = 1 lượt quay • 100% có quà!
                        </div>
                    </>
                )}

                <style jsx>{`
                    @keyframes blink {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.3; }
                    }
                `}</style>
            </div>
        </div>
    );
}
