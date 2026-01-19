'use client';

import { useEffect, useState, useCallback } from 'react';

// 8 segments for a proper lucky wheel
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

const PRIZE_WEIGHTS = { 0: 20, 1: 12, 2: 20, 3: 6, 4: 20, 5: 10, 6: 20, 7: 12 };

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
            if (data.error) { setError(data.error); return false; }
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
        if (!phone || phone.length !== 10) { setError('Vui lòng nhập đúng 10 số điện thoại'); return; }
        const success = await loadGameState(phone);
        if (success) setIsVerified(true);
    };

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
            if (data.error) { setError(data.error); setIsSpinning(false); return; }

            const prizeIndex = data.prizeIndex !== undefined ? data.prizeIndex % 8 : selectPrizeIndex();
            const prize = WHEEL_SEGMENTS[prizeIndex];
            const segmentAngle = 360 / 8;
            const prizeAngle = prizeIndex * segmentAngle + segmentAngle / 2;
            const spins = 5 + Math.random() * 3;
            const targetRotation = rotation + (360 * spins) + (360 - prizeAngle);
            setRotation(targetRotation);

            setTimeout(() => {
                setCurrentPrize(prize);
                setShowResult(true);
                setIsSpinning(false);
                setUsedTickets(data.usedTickets);
                setAvailableTickets(data.availableTickets);
                setPrizeHistory(prev => [{ prize, time: new Date().toLocaleTimeString('vi-VN') }, ...prev].slice(0, 5));
            }, 4500);
        } catch (e) {
            setError('Lỗi kết nối server');
            setIsSpinning(false);
        }
    };

    useEffect(() => {
        if (!isOpen) { setPhone(''); setIsVerified(false); setError(''); setShowResult(false); setCurrentPrize(null); }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active">
            <div className="modal-content minigame-modal" style={{ maxWidth: '420px', padding: '1.5rem' }}>
                <button className="modal-close" onClick={onClose}>&times;</button>

                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', background: 'linear-gradient(135deg, #ff6b35 0%, #ffd700 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        🎡 VÒNG QUAY MAY MẮN
                    </h2>
                </div>

                {!isVerified ? (
                    <form onSubmit={handleVerify} style={{ textAlign: 'center' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
                            <p style={{ color: '#ffcc00', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(255,204,0,0.1)', borderRadius: '8px' }}>
                                💡 Mỗi 3 phần Tuyết Sơn = 1 lượt quay!
                            </p>
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Số điện thoại (10 số)" style={{ width: '100%', padding: '0.9rem', fontSize: '1.1rem', textAlign: 'center', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '12px', color: '#fff', marginBottom: '0.75rem', fontFamily: 'monospace' }} />
                            {error && <p style={{ color: '#ff4444', marginBottom: '0.75rem', fontSize: '0.85rem' }}>❌ {error}</p>}
                            <button type="submit" disabled={isLoading || phone.length !== 10} style={{ width: '100%', padding: '0.9rem', background: phone.length === 10 ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '700', fontSize: '1rem', cursor: phone.length === 10 ? 'pointer' : 'not-allowed' }}>
                                {isLoading ? '⏳ Đang xác thực...' : '🎡 VÀO CHƠI'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,210,106,0.1)', border: '1px solid #00d26a', borderRadius: '8px', padding: '0.4rem 0.8rem', marginBottom: '1rem' }}>
                            <span style={{ color: '#00d26a', fontSize: '0.8rem' }}>✅ {phone}</span>
                            <div style={{ background: '#ffcc00', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '50px', fontWeight: '800', fontSize: '0.85rem' }}>🎟️ {availableTickets} lượt</div>
                        </div>

                        {error && <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid #ff4444', borderRadius: '8px', padding: '0.5rem', marginBottom: '0.75rem', textAlign: 'center', color: '#ff4444', fontSize: '0.85rem' }}>❌ {error}</div>}

                        {/* Wheel Container */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', zIndex: 20, fontSize: '1.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>▼</div>

                            <svg width="280" height="280" viewBox="0 0 280 280" style={{ filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.4))' }}>
                                {/* Outer ring */}
                                <circle cx="140" cy="140" r="138" fill="none" stroke="url(#goldGradient)" strokeWidth="6" />

                                {/* Wheel group with rotation */}
                                <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '140px 140px', transition: isSpinning ? 'transform 4.5s cubic-bezier(0.17, 0.67, 0.05, 0.99)' : 'none' }}>
                                    {/* Segments */}
                                    {WHEEL_SEGMENTS.map((seg, i) => {
                                        const angle = 360 / 8;
                                        const startAngle = (i * angle - 90) * Math.PI / 180;
                                        const endAngle = ((i + 1) * angle - 90) * Math.PI / 180;
                                        const x1 = 140 + 130 * Math.cos(startAngle);
                                        const y1 = 140 + 130 * Math.sin(startAngle);
                                        const x2 = 140 + 130 * Math.cos(endAngle);
                                        const y2 = 140 + 130 * Math.sin(endAngle);
                                        const largeArc = angle > 180 ? 1 : 0;
                                        const midAngle = (startAngle + endAngle) / 2;
                                        const labelX = 140 + 80 * Math.cos(midAngle);
                                        const labelY = 140 + 80 * Math.sin(midAngle);

                                        return (
                                            <g key={seg.id}>
                                                <path d={`M 140 140 L ${x1} ${y1} A 130 130 0 ${largeArc} 1 ${x2} ${y2} Z`} fill={seg.color} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                                                <text x={labelX} y={labelY - 8} textAnchor="middle" fill="#fff" fontSize="20" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{seg.emoji}</text>
                                                <text x={labelX} y={labelY + 12} textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>{seg.label}</text>
                                            </g>
                                        );
                                    })}
                                </g>

                                {/* Center */}
                                <circle cx="140" cy="140" r="28" fill="url(#centerGradient)" stroke="#ffd700" strokeWidth="4" />
                                <text x="140" y="147" textAnchor="middle" fontSize="22">🎡</text>

                                {/* Decorative dots */}
                                {[...Array(16)].map((_, i) => {
                                    const dotAngle = (i * 22.5 - 90) * Math.PI / 180;
                                    const dotX = 140 + 135 * Math.cos(dotAngle);
                                    const dotY = 140 + 135 * Math.sin(dotAngle);
                                    return <circle key={i} cx={dotX} cy={dotY} r="4" fill="#ffd700" style={{ opacity: isSpinning ? (i % 2 === 0 ? 1 : 0.3) : 1 }} />;
                                })}

                                <defs>
                                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ffd700" />
                                        <stop offset="50%" stopColor="#ff8c00" />
                                        <stop offset="100%" stopColor="#ffd700" />
                                    </linearGradient>
                                    <linearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#1a1a2e" />
                                        <stop offset="100%" stopColor="#2d2d44" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        {/* Result */}
                        {showResult && currentPrize && (
                            <div style={{ background: currentPrize.isLose ? 'rgba(100,100,100,0.15)' : 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,107,53,0.15) 100%)', border: `2px solid ${currentPrize.isLose ? '#666' : '#ffd700'}`, borderRadius: '12px', padding: '0.75rem', marginBottom: '0.75rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem' }}>{currentPrize.emoji}</div>
                                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: currentPrize.isLose ? '#aaa' : '#ffd700' }}>
                                    {currentPrize.isLose ? 'Chúc bạn may mắn lần sau!' : `🎉 ${currentPrize.label}`}
                                </div>
                                {!currentPrize.isLose && <p style={{ color: '#00d26a', fontSize: '0.75rem', marginTop: '0.3rem' }}>📸 Chụp màn hình nhận quà tại gian hàng!</p>}
                            </div>
                        )}

                        {/* Spin Button */}
                        <button onClick={spinWheel} disabled={availableTickets <= 0 || isSpinning} style={{ width: '100%', padding: '0.9rem', background: availableTickets > 0 && !isSpinning ? 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '700', fontSize: '1rem', cursor: availableTickets > 0 && !isSpinning ? 'pointer' : 'not-allowed', marginBottom: '0.75rem', boxShadow: availableTickets > 0 && !isSpinning ? '0 4px 15px rgba(255,107,53,0.4)' : 'none' }}>
                            {isSpinning ? '⏳ Đang quay...' : availableTickets > 0 ? '🎡 QUAY NGAY' : '❌ Hết lượt'}
                        </button>

                        {/* History */}
                        {prizeHistory.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                                {prizeHistory.map((item, i) => (
                                    <span key={i} style={{ background: item.prize.isLose ? 'rgba(100,100,100,0.3)' : 'rgba(255,215,0,0.2)', padding: '0.15rem 0.4rem', borderRadius: '50px', fontSize: '0.7rem', color: item.prize.isLose ? '#999' : '#ffd700' }}>
                                        {item.prize.emoji}
                                    </span>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
