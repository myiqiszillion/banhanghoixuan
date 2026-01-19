'use client';

import { useEffect, useState, useCallback } from 'react';
import LuckyWheel from './LuckyWheel';

const SEGMENTS = [
    { emoji: '🧧', name: 'Chúc may mắn', color: '#FFF7ED', textCol: '#C2410C', isLose: true }, // Light Cream
    { emoji: '🍡', name: '01 Xiên', color: '#DC2626', textCol: '#FEF3C7', isLose: false }, // Red
    { emoji: '🧧', name: 'Chúc may mắn', color: '#FFF7ED', textCol: '#C2410C', isLose: true },
    { emoji: '💰', name: '10K Tiền mặt', color: '#DC2626', textCol: '#FEF3C7', isLose: false }, // Red
    { emoji: '🧧', name: 'Chúc may mắn', color: '#FFF7ED', textCol: '#C2410C', isLose: true },
    { emoji: '🥤', name: '01 Ly nước', color: '#DC2626', textCol: '#FEF3C7', isLose: false },  // Red
    { emoji: '🧧', name: 'Chúc may mắn', color: '#FFF7ED', textCol: '#C2410C', isLose: true },
    { emoji: '🍡', name: '01 Xiên', color: '#DC2626', textCol: '#FEF3C7', isLose: false }, // Red
];

export default function MiniGameModal({ isOpen, onClose }) {
    const [phone, setPhone] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [tickets, setTickets] = useState(0);

    // Wheel state
    const [spinning, setSpinning] = useState(false);
    const [prize, setPrize] = useState(null);
    const [showResult, setShowResult] = useState(false);

    // Initial Load
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

    // Verify Phone
    const verify = async (e) => {
        e.preventDefault();
        setError('');
        if (phone.length !== 10) { setError('Nhập đúng 10 số'); return; }
        if (await load(phone)) setIsVerified(true);
    };

    // Spin Action
    const spin = async () => {
        if (tickets <= 0 || spinning) return;

        setError('');
        setShowResult(false);

        try {
            // 1. Call API
            const r = await fetch('/api/minigame', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
            const d = await r.json();

            if (d.error) {
                setError(d.error);
                return;
            }

            // 2. Determine prize
            let idx = d.prizeIndex;
            if (idx === undefined || idx < 0) idx = 0;

            // 3. Start Wheel
            setPrize(SEGMENTS[idx]);
            setTickets(d.availableTickets);
            setSpinning(true);

        } catch (e) {
            console.error(e);
            setError('Lỗi kết nối');
        }
    };

    // Callback when animation stops
    const handleSpinStop = () => {
        setSpinning(false);
        setShowResult(true);
    };

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setPhone('');
            setIsVerified(false);
            setError('');
            setShowResult(false);
            setPrize(null);
            setSpinning(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active">
            <div className="modal-content" style={{ maxWidth: '400px', padding: '1.5rem', background: 'linear-gradient(180deg, #1e1e30 0%, #0f0f1a 100%)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <button className="modal-close" onClick={spinning ? undefined : onClose} style={{ opacity: spinning ? 0.5 : 1 }}>&times;</button>

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

                        {/* NEW WHEEL COMPONENT */}
                        <div className="mb-6 relative flex justify-center">
                            <LuckyWheel
                                segments={SEGMENTS}
                                spinning={spinning}
                                prizeIndex={prize ? SEGMENTS.indexOf(prize) : null}
                                onStop={handleSpinStop}
                            />
                        </div>

                        {/* Result */}
                        {showResult && prize && (
                            <div style={{ background: prize.isLose ? 'rgba(75,85,99,0.2)' : 'linear-gradient(90deg, rgba(251,191,36,0.15), rgba(249,115,22,0.15))', border: `2px solid ${prize.isLose ? '#6b7280' : '#fbbf24'}`, borderRadius: '12px', padding: '1rem', marginBottom: '1rem', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.3rem' }}>{prize.emoji}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: prize.isLose ? '#9ca3af' : '#fbbf24' }}>{prize.isLose ? 'Chúc may mắn lần sau!' : `🎉 Bạn nhận được: ${prize.name}`}</div>
                                {!prize.isLose && <p style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.3rem' }}>📸 Chụp màn hình → Nhận quà tại gian hàng 10.11</p>}
                            </div>
                        )}

                        {/* Spin button */}
                        <button onClick={spin} disabled={tickets <= 0 || spinning} style={{ width: '100%', padding: '1rem', background: tickets > 0 && !spinning ? 'linear-gradient(90deg, #f97316, #ea580c)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '700', fontSize: '1.1rem', cursor: tickets > 0 && !spinning ? 'pointer' : 'not-allowed', boxShadow: tickets > 0 && !spinning ? '0 4px 20px rgba(249,115,22,0.4)' : 'none', marginBottom: '1rem', opacity: spinning ? 0.8 : 1 }}>
                            {spinning ? '⏳ Đang quay...' : tickets > 0 ? '🎡 QUAY NGAY!' : '❌ Hết lượt - Mua thêm nhé!'}
                        </button>

                        {/* Prize Info Table */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem' }}>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fbbf24', marginBottom: '0.75rem', textAlign: 'center' }}>🎁 BẢNG GIẢI THƯỞNG</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(202,138,4,0.15)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(202,138,4,0.3)' }}>
                                    <span style={{ fontSize: '1.3rem' }}>💰</span>
                                    <span style={{ fontSize: '0.8rem', color: '#fde047' }}>10K tiền mặt</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37,99,235,0.15)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(37,99,235,0.3)' }}>
                                    <span style={{ fontSize: '1.3rem' }}>🥤</span>
                                    <span style={{ fontSize: '0.8rem', color: '#93c5fd' }}>1 Ly nước</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(234,88,12,0.15)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(234,88,12,0.3)' }}>
                                    <span style={{ fontSize: '1.3rem' }}>🍡</span>
                                    <span style={{ fontSize: '0.8rem', color: '#fdba74' }}>+1 Xiên miễn phí</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(185,28,28,0.2)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid rgba(185,28,28,0.4)' }}>
                                    <span style={{ fontSize: '1.3rem' }}>🧧</span>
                                    <span style={{ fontSize: '0.8rem', color: '#FCA5A5' }}>Chúc may mắn</span>
                                </div>
                            </div>
                            <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#6b7280', marginTop: '0.8rem', fontStyle: 'italic' }}>⚡ Mua 3 phần = 1 lượt • 100% có quà!</p>
                        </div>
                    </>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
