'use client';

import { useEffect, useState, useCallback } from 'react';

const SEGMENTS = [
    { emoji: '🍀', name: 'May mắn lần sau', color: '#4B5563', isLose: true },
    { emoji: '🍡', name: '+1 Xiên', color: '#EA580C', isLose: false },
    { emoji: '🍀', name: 'May mắn lần sau', color: '#9333EA', isLose: true },
    { emoji: '💰', name: '10K', color: '#CA8A04', isLose: false },
    { emoji: '🍀', name: 'May mắn lần sau', color: '#059669', isLose: true },
    { emoji: '🥤', name: '1 Ly nước', color: '#2563EB', isLose: false },
    { emoji: '🍀', name: 'May mắn lần sau', color: '#DB2777', isLose: true },
    { emoji: '🍡', name: '+1 Xiên', color: '#DC2626', isLose: false },
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

            let idx = d.prizeIndex !== undefined ? d.prizeIndex % 8 : (() => {
                let total = WEIGHTS.reduce((a, b) => a + b, 0), rnd = Math.random() * total;
                for (let i = 0; i < 8; i++) { rnd -= WEIGHTS[i]; if (rnd <= 0) return i; }
                return 0;
            })();

            const segCenter = idx * 45 + 22.5;
            const spins = 5 + Math.floor(Math.random() * 3);
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

    const conicGradient = SEGMENTS.map((s, i) => `${s.color} ${i * 45}deg ${(i + 1) * 45}deg`).join(', ');

    return (
        <div className="modal-overlay active">
            <div className="modal-content" style={{ maxWidth: '400px', padding: '1.5rem', background: 'linear-gradient(180deg, #1e1e30 0%, #0f0f1a 100%)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button className="modal-close" onClick={onClose}>&times;</button>

                <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: '900', background: 'linear-gradient(90deg, #fbbf24, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem' }}>🎡 VÒNG QUAY MAY MẮN</h2>

                {!isVerified ? (
                    <form onSubmit={verify} style={{ textAlign: 'center' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem' }}>
                            <p style={{ color: '#fbbf24', fontSize: '0.9rem', marginBottom: '1rem' }}>💡 Mỗi 3 phần Tuyết Sơn = 1 lượt quay</p>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="Nhập số điện thoại" style={{ width: '100%', padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.05)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: '12px', color: '#fff', marginBottom: '0.75rem', fontSize: '1.1rem', fontFamily: 'monospace' }} />
                            {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.5rem' }}>❌ {error}</p>}
                            <button type="submit" disabled={isLoading || phone.length !== 10} style={{ width: '100%', padding: '1rem', background: phone.length === 10 ? 'linear-gradient(90deg, #f97316, #ea580c)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '700', fontSize: '1rem', cursor: phone.length === 10 ? 'pointer' : 'not-allowed' }}>{isLoading ? '⏳ Đang kiểm tra...' : '🎡 VÀO CHƠI'}</button>
                        </div>
                    </form>
                ) : (
                    <>
                        {/* Info bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(90deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '0.6rem 1rem', marginBottom: '1rem' }}>
                            <span style={{ color: '#10b981', fontSize: '0.9rem', fontWeight: '600' }}>✅ {phone}</span>
                            <div style={{ background: 'linear-gradient(90deg, #fbbf24, #f97316)', padding: '0.3rem 0.8rem', borderRadius: '50px', fontWeight: '800', fontSize: '0.9rem', color: '#000' }}>🎟️ {tickets} lượt</div>
                        </div>

                        {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', marginBottom: '0.5rem' }}>❌ {error}</p>}

                        {/* Wheel */}
                        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: '1rem' }}>
                            {/* Pointer */}
                            <div style={{ position: 'absolute', top: '-2px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
                                <div style={{ width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '20px solid #fbbf24', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}></div>
                            </div>

                            {/* Outer ring with lights */}
                            <div style={{ width: '270px', height: '270px', borderRadius: '50%', padding: '8px', background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 50%, #fbbf24 100%)', boxShadow: '0 0 40px rgba(251,191,36,0.4), inset 0 0 20px rgba(0,0,0,0.3)', position: 'relative' }}>

                                {/* Light bulbs */}
                                {[...Array(16)].map((_, i) => {
                                    const angle = i * 22.5 * Math.PI / 180;
                                    const x = 127 + 127 * Math.sin(angle);
                                    const y = 127 - 127 * Math.cos(angle);
                                    return <div key={i} style={{ position: 'absolute', left: x - 5, top: y - 5, width: '10px', height: '10px', borderRadius: '50%', background: spinning ? (i % 2 === (Math.floor(Date.now() / 200) % 2) ? '#fff' : '#fbbf24') : '#fff', boxShadow: '0 0 8px rgba(255,255,255,0.8)' }} />;
                                })}

                                {/* Inner wheel */}
                                <div style={{
                                    width: '100%', height: '100%', borderRadius: '50%', position: 'relative', overflow: 'hidden',
                                    background: `conic-gradient(from 0deg, ${conicGradient})`,
                                    transform: `rotate(${deg}deg)`,
                                    transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.05, 0.99)' : 'none',
                                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4)'
                                }}>
                                    {/* Segment dividers */}
                                    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                                        <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', width: '50%', height: '3px', background: 'linear-gradient(90deg, rgba(255,255,255,0.8), rgba(255,255,255,0.2))', transformOrigin: 'left center', transform: `translateY(-50%) rotate(${i * 45}deg)` }} />
                                    ))}

                                    {/* Emojis */}
                                    {SEGMENTS.map((s, i) => {
                                        const angle = i * 45 + 22.5;
                                        const rad = (angle - 90) * Math.PI / 180;
                                        const r = 85;
                                        const x = r * Math.cos(rad);
                                        const y = r * Math.sin(rad);
                                        return (
                                            <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`, fontSize: '2rem', filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))' }}>{s.emoji}</div>
                                        );
                                    })}

                                    {/* Center */}
                                    <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: '55px', height: '55px', borderRadius: '50%', background: 'linear-gradient(135deg, #1e1e30, #2d2d44)', border: '4px solid #fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>🎡</div>
                                </div>
                            </div>
                        </div>

                        {/* Result */}
                        {showResult && prize && (
                            <div style={{ background: prize.isLose ? 'rgba(75,85,99,0.2)' : 'linear-gradient(90deg, rgba(251,191,36,0.15), rgba(249,115,22,0.15))', border: `2px solid ${prize.isLose ? '#6b7280' : '#fbbf24'}`, borderRadius: '12px', padding: '1rem', marginBottom: '1rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.3rem' }}>{prize.emoji}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: prize.isLose ? '#9ca3af' : '#fbbf24' }}>{prize.isLose ? 'Chúc may mắn lần sau!' : `🎉 Bạn nhận được: ${prize.name}`}</div>
                                {!prize.isLose && <p style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.3rem' }}>📸 Chụp màn hình → Nhận quà tại gian hàng 10.11</p>}
                            </div>
                        )}

                        {/* Spin button */}
                        <button onClick={spin} disabled={tickets <= 0 || spinning} style={{ width: '100%', padding: '1rem', background: tickets > 0 && !spinning ? 'linear-gradient(90deg, #f97316, #ea580c)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '700', fontSize: '1.1rem', cursor: tickets > 0 && !spinning ? 'pointer' : 'not-allowed', boxShadow: tickets > 0 && !spinning ? '0 4px 20px rgba(249,115,22,0.4)' : 'none', marginBottom: '1rem' }}>
                            {spinning ? '⏳ Đang quay...' : tickets > 0 ? '🎡 QUAY NGAY!' : '❌ Hết lượt - Mua thêm nhé!'}
                        </button>

                        {/* Prize Info Table */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fbbf24', marginBottom: '0.75rem', textAlign: 'center' }}>🎁 BẢNG GIẢI THƯỞNG</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(202,138,4,0.15)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(202,138,4,0.3)' }}>
                                    <span style={{ fontSize: '1.3rem' }}>💰</span>
                                    <span style={{ color: '#fbbf24', fontWeight: '600', fontSize: '0.85rem' }}>10K tiền mặt</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37,99,235,0.15)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(37,99,235,0.3)' }}>
                                    <span style={{ fontSize: '1.3rem' }}>🥤</span>
                                    <span style={{ color: '#60a5fa', fontWeight: '600', fontSize: '0.85rem' }}>1 Ly nước</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(234,88,12,0.15)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(234,88,12,0.3)' }}>
                                    <span style={{ fontSize: '1.3rem' }}>🍡</span>
                                    <span style={{ color: '#fb923c', fontWeight: '600', fontSize: '0.85rem' }}>+1 Xiên miễn phí</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(75,85,99,0.15)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(75,85,99,0.3)' }}>
                                    <span style={{ fontSize: '1.3rem' }}>🍀</span>
                                    <span style={{ color: '#9ca3af', fontWeight: '600', fontSize: '0.85rem' }}>May mắn lần sau</span>
                                </div>
                            </div>
                            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.75rem' }}>💡 Mua 3 phần = 1 lượt • 100% có quà!</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
