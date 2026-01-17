'use client';

import { useEffect, useState } from 'react';
import { getLocalOrders } from '@/lib/storage';

export default function MiniGameModal({ isOpen, onClose }) {
    const [totalTickets, setTotalTickets] = useState(0);

    useEffect(() => {
        if (isOpen) {
            const orders = getLocalOrders();
            // Count tickets from all orders (assuming paid or pending count, user gets ticket physically anyway usually if confirmed)
            // But let's sum them up.
            const tickets = orders.reduce((acc, curr) => acc + (curr.tickets || 0), 0);
            setTotalTickets(tickets);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active">
            <div className="modal-content" style={{ maxWidth: '500px', textAlign: 'center' }}>
                <button className="modal-close" onClick={onClose}>&times;</button>
                <div className="modal-header">
                    <h2 style={{
                        fontSize: '2rem',
                        fontWeight: '900',
                        background: 'linear-gradient(135deg, #ff4444 0%, #ffcc00 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem'
                    }}>
                        MINI GAME
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>Vòng Quay May Mắn - Hội Xuân 2026</p>
                </div>

                <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '2rem',
                    borderRadius: '20px',
                    border: '2px solid #ffcc00',
                    marginBottom: '2rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <p style={{ fontSize: '1rem', color: '#fff', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Số vé bạn đang có</p>
                        <div style={{ fontSize: '4rem', fontWeight: '900', color: '#ffcc00', lineHeight: 1 }}>{totalTickets}</div>
                        <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>Vé (Tính trên máy này)</p>
                    </div>
                </div>

                <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#ff4444' }}>📝 THỂ LỆ:</h3>
                    <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem', color: 'rgba(255,255,255,0.8)' }}>
                        <li>Mỗi <strong>3 phần Tuyết Sơn</strong> = <strong>1 Vé Mini Game</strong>.</li>
                        <li>Mang mã đơn hàng (đã lưu trong Lịch Sử) đến quầy thanh toán để đổi vé cứng.</li>
                        <li>Tham gia vòng quay may mắn tại gian hàng 10.11 để nhận quà khủng!</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
