'use client';

import { useEffect, useState, useCallback } from 'react';

// 4 prizes for lucky wheel
const PRIZES = [
    { id: 1, label: 'Chúc bạn may mắn lần sau', emoji: '🍀', color: '#666', isLose: true },
    { id: 2, label: '1 ly nước', emoji: '🥤', color: '#00bcd4', isLose: false },
    { id: 3, label: '+1 xiên', emoji: '🍡', color: '#ff6b35', isLose: false },
    { id: 4, label: '10K', emoji: '💰', color: '#ffd700', isLose: false },
];

export default function MiniGameModal({ isOpen, onClose }) {
    const [phone, setPhone] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Game state from server
    const [availableTickets, setAvailableTickets] = useState(0);
    const [usedTickets, setUsedTickets] = useState(0);

    // UI state
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [currentPrize, setCurrentPrize] = useState(null);
    const [showResult, setShowResult] = useState(false);
    const [prizeHistory, setPrizeHistory] = useState([]);

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

    // Spin the wheel
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

            // Calculate prize (weighted random)
            const prizeIndex = data.prizeIndex !== undefined ? data.prizeIndex : Math.floor(Math.random() * PRIZES.length);
            const prize = PRIZES[prizeIndex];

            // Calculate rotation (at least 5 full spins + land on prize)
            const segmentAngle = 360 / PRIZES.length;
            const prizeAngle = prizeIndex * segmentAngle + segmentAngle / 2;
            const spins = 5 + Math.random() * 3; // 5-8 full rotations
            const targetRotation = rotation + (360 * spins) + (360 - prizeAngle);

            setRotation(targetRotation);

            // Show result after spin completes
            setTimeout(() => {
                setCurrentPrize(prize);
                setShowResult(true);
                setIsSpinning(false);
                setUsedTickets(data.usedTickets);
                setAvailableTickets(data.availableTickets);

                // Add to history
                setPrizeHistory(prev => [{
                    prize: prize,
                    time: new Date().toLocaleTimeString('vi-VN')
                }, ...prev].slice(0, 5));
            }, 4000);

        } catch (e) {
            setError('Lỗi kết nối server');
            setIsSpinning(false);
        }
    };

    // Reset form when modal closes
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

    return (
        <div className="modal-overlay active">
            <div className="modal-content minigame-modal" style={{ maxWidth: '500px' }}>
                <button className="modal-close" onClick={onClose}>&times;</button>

                {/* Header */}
                <div className="modal-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    <h2 style={{
                        fontSize: '1.8rem',
                        fontWeight: '900',
                        background: 'linear-gradient(135deg, #ff4444 0%, #ffcc00 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem'
                    }}>
                        🎡 VÒNG QUAY MAY MẮN
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                        Quay để nhận phần thưởng hấp dẫn!
                    </p>
                </div>

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
                                💡 Mỗi 3 phần Tuyết Sơn = 1 lượt quay!
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
                                {isLoading ? '⏳ Đang xác thực...' : '🎡 VÀO CHƠI'}
                            </button>
                        </div>
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
                            background: 'rgba(255,204,0,0.1)',
                            border: '2px solid #ffcc00',
                            borderRadius: '12px',
                            padding: '1rem',
                            textAlign: 'center',
                            marginBottom: '1.5rem'
                        }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#ffcc00' }}>{availableTickets}</div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Lượt quay còn lại</div>
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

                        {/* Lucky Wheel */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginBottom: '1.5rem',
                            position: 'relative'
                        }}>
                            {/* Pointer */}
                            <div style={{
                                position: 'absolute',
                                top: '-10px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 10,
                                fontSize: '2rem'
                            }}>
                                ▼
                            </div>

                            {/* Wheel */}
                            <div style={{
                                width: '280px',
                                height: '280px',
                                borderRadius: '50%',
                                border: '6px solid #ffd700',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 0 30px rgba(255,215,0,0.4)',
                                transform: `rotate(${rotation}deg)`,
                                transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                            }}>
                                {PRIZES.map((prize, index) => {
                                    const segmentAngle = 360 / PRIZES.length;
                                    const startAngle = index * segmentAngle;

                                    return (
                                        <div
                                            key={prize.id}
                                            style={{
                                                position: 'absolute',
                                                width: '50%',
                                                height: '50%',
                                                left: '50%',
                                                top: '50%',
                                                transformOrigin: '0 0',
                                                transform: `rotate(${startAngle}deg) skewY(${90 - segmentAngle}deg)`,
                                                background: prize.color,
                                                border: '1px solid rgba(255,255,255,0.3)'
                                            }}
                                        />
                                    );
                                })}

                                {/* Prize Labels */}
                                {PRIZES.map((prize, index) => {
                                    const segmentAngle = 360 / PRIZES.length;
                                    const labelAngle = index * segmentAngle + segmentAngle / 2;

                                    return (
                                        <div
                                            key={`label-${prize.id}`}
                                            style={{
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: `rotate(${labelAngle}deg) translateY(-90px)`,
                                                transformOrigin: '0 0',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                width: '80px',
                                                marginLeft: '-40px'
                                            }}
                                        >
                                            <span style={{ fontSize: '1.8rem' }}>{prize.emoji}</span>
                                            <span style={{
                                                fontSize: '0.6rem',
                                                fontWeight: 'bold',
                                                color: '#fff',
                                                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                                                textAlign: 'center',
                                                lineHeight: 1.2
                                            }}>
                                                {prize.label}
                                            </span>
                                        </div>
                                    );
                                })}

                                {/* Center */}
                                <div style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                                    border: '4px solid #ffd700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                                }}>
                                    🎡
                                </div>
                            </div>
                        </div>

                        {/* Result Display */}
                        {showResult && currentPrize && (
                            <div style={{
                                background: currentPrize.isLose
                                    ? 'rgba(100,100,100,0.2)'
                                    : 'rgba(255,215,0,0.15)',
                                border: `2px solid ${currentPrize.isLose ? '#666' : '#ffd700'}`,
                                borderRadius: '12px',
                                padding: '1rem',
                                marginBottom: '1rem',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{currentPrize.emoji}</div>
                                <div style={{
                                    fontSize: '1.2rem',
                                    fontWeight: 'bold',
                                    color: currentPrize.isLose ? '#aaa' : '#ffd700'
                                }}>
                                    {currentPrize.isLose ? currentPrize.label : `🎉 Bạn nhận được: ${currentPrize.label}`}
                                </div>
                                {!currentPrize.isLose && (
                                    <p style={{ color: '#00d26a', fontSize: '0.85rem', marginTop: '0.5rem' }}>
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
                                padding: '1rem',
                                background: availableTickets > 0 && !isSpinning
                                    ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)'
                                    : 'rgba(255,255,255,0.1)',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#fff',
                                fontWeight: '700',
                                fontSize: '1.1rem',
                                cursor: availableTickets > 0 && !isSpinning ? 'pointer' : 'not-allowed',
                                marginBottom: '1rem'
                            }}
                        >
                            {isSpinning ? (
                                <>⏳ Đang quay...</>
                            ) : availableTickets > 0 ? (
                                <>🎡 QUAY NGAY (-1 lượt)</>
                            ) : (
                                <>❌ Hết lượt - Mua thêm Tuyết Sơn!</>
                            )}
                        </button>

                        {/* Prize History */}
                        {prizeHistory.length > 0 && (
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '0.75rem',
                                borderRadius: '10px',
                                marginBottom: '1rem'
                            }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#fff' }}>
                                    📝 Lịch sử quay:
                                </h4>
                                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                                    {prizeHistory.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0' }}>
                                            <span>{item.prize.emoji} {item.prize.label}</span>
                                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{item.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
                                <li>Mỗi <strong>3 phần Tuyết Sơn</strong> đã thanh toán = <strong>1 lượt quay</strong></li>
                                <li>Phần thưởng: <strong>10K</strong> | <strong>+1 xiên</strong> | <strong>1 ly nước</strong></li>
                                <li>Chụp màn hình kết quả để nhận quà!</li>
                                <li style={{ color: '#ffcc00' }}>💡 Dùng đúng SĐT khi mua hàng để nhận lượt!</li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
