'use client';

import { useEffect, useState, useCallback } from 'react';

const SEGMENTS = [
    { emoji: '🍀', name: 'May mắn', color: '#6B7280', isLose: true },
    { emoji: '🍡', name: '+1 Xiên', color: '#F97316', isLose: false },
    { emoji: '🍀', name: 'May mắn', color: '#8B5CF6', isLose: true },
    { emoji: '💰', name: '10K', color: '#FBBF24', isLose: false },
    { emoji: '🍀', name: 'May mắn', color: '#10B981', isLose: true },
    { emoji: '🥤', name: '1 Ly nước', color: '#3B82F6', isLose: false },
    { emoji: '🍀', name: 'May mắn', color: '#EC4899', isLose: true },
    { emoji: '🍡', name: '+1 Xiên', color: '#EF4444', isLose: false },
];

const WEIGHTS = [20, 12, 20, 6, 20, 10, 20, 12];

export default function MiniGameModal({ isOpen, onClose }) {
    const [phone, setPhone] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [tickets, setTickets] = useState(0);
    const [spinning, setSpinning] = useState(false);
    const [deg, setDeg] = useState(0);
    const [prize, setPrize] = useState(null);
    const [showResult, setShowResult] = useState(false);

    const load = useCallback(async (p) => {
        try {
            setIsLoading(true);
            const r = await fetch(`/api/minigame?phone=${encodeURIComponent(p)}`);
            const d = await r.json();
            if (d.error) { setError(d.error); return false; }
            setTickets(d.availableTickets || 0);
            return true;
        } catch { setError('Lỗi kết nối'); return false; }
        finally { setIsLoading(false); }
    }, []);

    const verify = async (e) => {
        e.preventDefault();
        setError('');
        if (phone.length !== 10) { setError('Nhập đúng 10 số'); return; }
        if (await load(phone)) setIsVerified(true);
    };

    const spin = async () => {
        if (tickets <= 0 || spinning) return;
        setSpinning(true); setShowResult(false); setError('');

        try {
            const r = await fetch('/api/minigame', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
            const d = await r.json();
            if (d.error) { setError(d.error); setSpinning(false); return; }

            // Get prize index
            let idx = d.prizeIndex !== undefined ? d.prizeIndex % 8 : (() => {
                let total = WEIGHTS.reduce((a, b) => a + b, 0), rnd = Math.random() * total;
                for (let i = 0; i < 8; i++) { rnd -= WEIGHTS[i]; if (rnd <= 0) return i; }
                return 0;
            })();

            // Calculate rotation: segment size is 45deg, we want to land on segment idx
            // Pointer is at top (0deg). Segment 0 starts at 0deg and spans to 45deg.
            // Center of segment idx is at idx*45 + 22.5 degrees
            const segCenter = idx * 45 + 22.5;
            const spins = 5 + Math.floor(Math.random() * 3);
            // To make segment idx land at top, we rotate wheel so that segCenter aligns with 0deg
            // That means rotating by (360 - segCenter) to bring it to top
            const target = deg + spins * 360 + (360 - segCenter);
            setDeg(target);

            setTimeout(() => {
                setPrize(SEGMENTS[idx]);
                setShowResult(true);
                setSpinning(false);
                setTickets(d.availableTickets);
            }, 4000);
        } catch { setError('Lỗi'); setSpinning(false); }
    };

    useEffect(() => { if (!isOpen) { setPhone(''); setIsVerified(false); setError(''); setShowResult(false); setPrize(null); } }, [isOpen]);
    if (!isOpen) return null;

    // Create conic-gradient string
    const conicGradient = SEGMENTS.map((s, i) => `${s.color} ${i * 45}deg ${(i + 1) * 45}deg`).join(', ');

    return (
        <div className="modal-overlay active">
            <div className="modal-content" style={{ maxWidth: '380px', padding: '1.25rem', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '20px' }}>
                <button className="modal-close" onClick={onClose}>&times;</button>

                <h2 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: '900', background: 'linear-gradient(90deg, #ff6b35, #ffd700)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem' }}>🎡 VÒNG QUAY MAY MẮN</h2>

                {!isVerified ? (
                    <form onSubmit={verify} style={{ textAlign: 'center' }}>
                        <p style={{ color: '#ffcc00', fontSize: '0.8rem', marginBottom: '0.75rem', background: 'rgba(255,204,0,0.1)', padding: '0.4rem', borderRadius: '8px' }}>💡 Mỗi 3 phần = 1 lượt quay</p>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="SĐT (10 số)" style={{ width: '100%', padding: '0.75rem', textAlign: 'center', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '10px', color: '#fff', marginBottom: '0.5rem', fontSize: '1rem' }} />
                        {error && <p style={{ color: '#ff4444', fontSize: '0.8rem', marginBottom: '0.5rem' }}>❌ {error}</p>}
                        <button type="submit" disabled={isLoading || phone.length !== 10} style={{ width: '100%', padding: '0.75rem', background: phone.length === 10 ? 'linear-gradient(90deg, #ff6b35, #f7931e)' : '#333', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', cursor: phone.length === 10 ? 'pointer' : 'not-allowed' }}>{isLoading ? '...' : '🎡 VÀO CHƠI'}</button>
                    </form>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,210,106,0.1)', border: '1px solid #00d26a', borderRadius: '8px', padding: '0.3rem 0.6rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                            <span style={{ color: '#00d26a' }}>✅ {phone}</span>
                            <span style={{ background: '#ffcc00', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '20px', fontWeight: '800' }}>🎟️ {tickets}</span>
                        </div>

                        {error && <p style={{ color: '#ff4444', fontSize: '0.8rem', textAlign: 'center', marginBottom: '0.5rem' }}>❌ {error}</p>}

                        {/* WHEEL */}
                        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: '0.75rem' }}>
                            {/* Pointer */}
                            <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', zIndex: 10, fontSize: '1.5rem' }}>🔻</div>

                            {/* Wheel container */}
                            <div style={{ width: '260px', height: '260px', borderRadius: '50%', padding: '6px', background: 'linear-gradient(135deg, #ffd700, #ff8c00)', boxShadow: '0 0 30px rgba(255,215,0,0.5)' }}>
                                {/* Inner wheel that rotates */}
                                <div style={{
                                    width: '100%', height: '100%', borderRadius: '50%', position: 'relative',
                                    background: `conic-gradient(from 0deg, ${conicGradient})`,
                                    transform: `rotate(${deg}deg)`,
                                    transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.05, 0.99)' : 'none',
                                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.3)'
                                }}>
                                    {/* Segment lines */}
                                    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                                        <div key={i} style={{
                                            position: 'absolute', left: '50%', top: '50%', width: '50%', height: '2px',
                                            background: 'rgba(255,255,255,0.4)', transformOrigin: 'left center',
                                            transform: `rotate(${i * 45}deg)`
                                        }} />
                                    ))}

                                    {/* Emojis - positioned in center of each segment */}
                                    {SEGMENTS.map((s, i) => {
                                        const angle = i * 45 + 22.5; // center of segment in degrees
                                        const rad = (angle - 90) * Math.PI / 180; // -90 to start from top
                                        const r = 85; // radius from center
                                        const x = r * Math.cos(rad);
                                        const y = r * Math.sin(rad);
                                        return (
                                            <div key={i} style={{
                                                position: 'absolute',
                                                left: '50%', top: '50%',
                                                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                                                fontSize: '1.8rem'
                                            }}>{s.emoji}</div>
                                        );
                                    })}

                                    {/* Center button */}
                                    <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '50px', height: '50px', borderRadius: '50%', background: '#1a1a2e', border: '4px solid #ffd700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', boxShadow: '0 0 15px rgba(0,0,0,0.5)' }}>🎡</div>
                                </div>
                            </div>
                        </div>

                        {/* Result */}
                        {showResult && prize && (
                            <div style={{ background: prize.isLose ? 'rgba(100,100,100,0.2)' : 'rgba(255,215,0,0.15)', border: `2px solid ${prize.isLose ? '#666' : '#ffd700'}`, borderRadius: '10px', padding: '0.6rem', marginBottom: '0.6rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem' }}>{prize.emoji}</div>
                                <div style={{ fontWeight: 'bold', color: prize.isLose ? '#999' : '#ffd700' }}>{prize.isLose ? 'Chúc may mắn lần sau!' : `🎉 ${prize.name}`}</div>
                                {!prize.isLose && <p style={{ color: '#00d26a', fontSize: '0.7rem', marginTop: '0.2rem' }}>📸 Chụp màn hình nhận quà!</p>}
                            </div>
                        )}

                        {/* Spin button */}
                        <button onClick={spin} disabled={tickets <= 0 || spinning} style={{ width: '100%', padding: '0.8rem', background: tickets > 0 && !spinning ? 'linear-gradient(90deg, #ff6b35, #f7931e)' : '#333', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', fontSize: '1rem', cursor: tickets > 0 && !spinning ? 'pointer' : 'not-allowed' }}>
                            {spinning ? '⏳ Đang quay...' : tickets > 0 ? '🎡 QUAY' : '❌ Hết lượt'}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
