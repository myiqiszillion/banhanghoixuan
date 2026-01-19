'use client';

import { useEffect, useState, useCallback } from 'react';

// 8 segments - simple labels
const WHEEL_SEGMENTS = [
    { id: 0, label: '🍀', color: '#6B7280', isLose: true, name: 'May mắn' },
    { id: 1, label: '🍡', color: '#F97316', isLose: false, name: '+1 Xiên' },
    { id: 2, label: '🍀', color: '#8B5CF6', isLose: true, name: 'May mắn' },
    { id: 3, label: '💰', color: '#FBBF24', isLose: false, name: '10K' },
    { id: 4, label: '🍀', color: '#10B981', isLose: true, name: 'May mắn' },
    { id: 5, label: '🥤', color: '#3B82F6', isLose: false, name: '1 Ly nước' },
    { id: 6, label: '🍀', color: '#EC4899', isLose: true, name: 'May mắn' },
    { id: 7, label: '🍡', color: '#EF4444', isLose: false, name: '+1 Xiên' },
];

const PRIZE_WEIGHTS = { 0: 20, 1: 12, 2: 20, 3: 6, 4: 20, 5: 10, 6: 20, 7: 12 };

export default function MiniGameModal({ isOpen, onClose }) {
    const [phone, setPhone] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [availableTickets, setAvailableTickets] = useState(0);
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
        for (let i = 0; i < 8; i++) { random -= PRIZE_WEIGHTS[i]; if (random <= 0) return i; }
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
                body: JSON.stringify({ phone })
            });
            const data = await res.json();
            if (data.error) { setError(data.error); setIsSpinning(false); return; }

            const prizeIndex = data.prizeIndex !== undefined ? data.prizeIndex % 8 : selectPrizeIndex();
            const prize = WHEEL_SEGMENTS[prizeIndex];

            // Wheel top is 0deg, segment 0 is at top-right (0-45deg from top)
            // To land on segment i, we need pointer (at top) to point to segment i
            const segmentAngle = 45; // 360/8
            const targetSegmentCenter = prizeIndex * segmentAngle + segmentAngle / 2;
            const spins = 5 + Math.floor(Math.random() * 3);
            const finalRotation = rotation + spins * 360 + (360 - targetSegmentCenter);

            setRotation(finalRotation);

            setTimeout(() => {
                setCurrentPrize(prize);
                setShowResult(true);
                setIsSpinning(false);
                setAvailableTickets(data.availableTickets);
                setPrizeHistory(prev => [{ prize, time: new Date().toLocaleTimeString('vi-VN') }, ...prev].slice(0, 5));
            }, 4000);
        } catch (e) {
            setError('Lỗi kết nối');
            setIsSpinning(false);
        }
    };

    useEffect(() => {
        if (!isOpen) { setPhone(''); setIsVerified(false); setError(''); setShowResult(false); setCurrentPrize(null); }
    }, [isOpen]);

    if (!isOpen) return null;

    // Pre-calculate segment positions for emoji placement
    const getEmojiPosition = (index) => {
        const angle = (index * 45 + 22.5) * Math.PI / 180; // center of segment
        const radius = 75; // distance from center
        return {
            x: 140 + radius * Math.sin(angle),
            y: 140 - radius * Math.cos(angle)
        };
    };

    return (
        <div className="modal-overlay active">
            <div className="modal-content minigame-modal" style={{ maxWidth: '400px', padding: '1.25rem' }}>
                <button className="modal-close" onClick={onClose}>&times;</button>

                <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '900', background: 'linear-gradient(135deg, #ff6b35, #ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        🎡 VÒNG QUAY MAY MẮN
                    </h2>
                </div>

                {!isVerified ? (
                    <form onSubmit={handleVerify}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                            <p style={{ color: '#ffcc00', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.5rem', background: 'rgba(255,204,0,0.1)', borderRadius: '8px' }}>💡 Mỗi 3 phần = 1 lượt quay!</p>
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Số điện thoại" style={{ width: '100%', padding: '0.8rem', fontSize: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#fff', marginBottom: '0.75rem' }} />
                            {error && <p style={{ color: '#ff4444', marginBottom: '0.5rem', fontSize: '0.85rem' }}>❌ {error}</p>}
                            <button type="submit" disabled={isLoading || phone.length !== 10} style={{ width: '100%', padding: '0.8rem', background: phone.length === 10 ? 'linear-gradient(135deg, #ff6b35, #f7931e)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', cursor: phone.length === 10 ? 'pointer' : 'not-allowed' }}>
                                {isLoading ? '⏳...' : '🎡 VÀO CHƠI'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,210,106,0.1)', border: '1px solid #00d26a', borderRadius: '8px', padding: '0.4rem 0.6rem', marginBottom: '0.75rem' }}>
                            <span style={{ color: '#00d26a', fontSize: '0.8rem' }}>✅ {phone}</span>
                            <span style={{ background: '#ffcc00', color: '#000', padding: '0.15rem 0.5rem', borderRadius: '50px', fontWeight: '800', fontSize: '0.8rem' }}>🎟️ {availableTickets}</span>
                        </div>

                        {error && <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid #ff4444', borderRadius: '8px', padding: '0.4rem', marginBottom: '0.5rem', textAlign: 'center', color: '#ff4444', fontSize: '0.8rem' }}>❌ {error}</div>}

                        {/* Wheel */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '-5px', left: '50%', transform: 'translateX(-50%)', zIndex: 20, fontSize: '1.3rem' }}>▼</div>

                            <div style={{ width: '280px', height: '280px', position: 'relative' }}>
                                {/* Outer glow ring */}
                                <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', background: 'linear-gradient(135deg, #ffd700, #ff8c00, #ffd700)', padding: '4px' }}>
                                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#1a1a2e' }}></div>
                                </div>

                                {/* Spinning wheel */}
                                <svg width="280" height="280" style={{ position: 'absolute', top: 0, left: 0, transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.05, 0.99)' : 'none' }}>
                                    {/* Pie segments */}
                                    {WHEEL_SEGMENTS.map((seg, i) => {
                                        const startAngle = i * 45 - 90;
                                        const endAngle = (i + 1) * 45 - 90;
                                        const startRad = startAngle * Math.PI / 180;
                                        const endRad = endAngle * Math.PI / 180;
                                        const x1 = 140 + 130 * Math.cos(startRad);
                                        const y1 = 140 + 130 * Math.sin(startRad);
                                        const x2 = 140 + 130 * Math.cos(endRad);
                                        const y2 = 140 + 130 * Math.sin(endRad);

                                        const emojiPos = getEmojiPosition(i);

                                        return (
                                            <g key={i}>
                                                <path d={`M140,140 L${x1},${y1} A130,130 0 0,1 ${x2},${y2} Z`} fill={seg.color} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                                                <text x={emojiPos.x} y={emojiPos.y + 5} textAnchor="middle" fontSize="28">{seg.label}</text>
                                            </g>
                                        );
                                    })}

                                    {/* Center circle */}
                                    <circle cx="140" cy="140" r="30" fill="#1a1a2e" stroke="#ffd700" strokeWidth="4" />
                                    <text x="140" y="148" textAnchor="middle" fontSize="24">🎡</text>
                                </svg>

                                {/* Decorative lights */}
                                {[...Array(12)].map((_, i) => {
                                    const angle = i * 30 * Math.PI / 180;
                                    return (
                                        <div key={i} style={{
                                            position: 'absolute',
                                            width: '8px', height: '8px',
                                            borderRadius: '50%',
                                            background: '#ffd700',
                                            left: `${140 + 136 * Math.sin(angle) - 4}px`,
                                            top: `${140 - 136 * Math.cos(angle) - 4}px`,
                                            boxShadow: '0 0 6px #ffd700'
                                        }} />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Result */}
                        {showResult && currentPrize && (
                            <div style={{ background: currentPrize.isLose ? 'rgba(100,100,100,0.2)' : 'rgba(255,215,0,0.15)', border: `2px solid ${currentPrize.isLose ? '#666' : '#ffd700'}`, borderRadius: '10px', padding: '0.6rem', marginBottom: '0.6rem', textAlign: 'center' }}>
                                <span style={{ fontSize: '1.8rem' }}>{currentPrize.label}</span>
                                <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: currentPrize.isLose ? '#aaa' : '#ffd700' }}>
                                    {currentPrize.isLose ? 'Chúc may mắn lần sau!' : `🎉 ${currentPrize.name}`}
                                </div>
                                {!currentPrize.isLose && <p style={{ color: '#00d26a', fontSize: '0.7rem', margin: '0.2rem 0 0' }}>📸 Chụp màn hình nhận quà!</p>}
                            </div>
                        )}

                        {/* Spin Button */}
                        <button onClick={spinWheel} disabled={availableTickets <= 0 || isSpinning} style={{ width: '100%', padding: '0.85rem', background: availableTickets > 0 && !isSpinning ? 'linear-gradient(135deg, #ff6b35, #f7931e)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '1rem', cursor: availableTickets > 0 && !isSpinning ? 'pointer' : 'not-allowed' }}>
                            {isSpinning ? '⏳ Đang quay...' : availableTickets > 0 ? '🎡 QUAY NGAY' : '❌ Hết lượt'}
                        </button>

                        {prizeHistory.length > 0 && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.3rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {prizeHistory.map((h, i) => <span key={i} style={{ fontSize: '1rem' }}>{h.prize.label}</span>)}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
