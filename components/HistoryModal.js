'use client';

import { useEffect, useState } from 'react';
import { getLocalOrders } from '@/lib/storage';
import { formatCurrency } from '@/lib/utils';
import { CONFIG } from '@/lib/config';

export default function HistoryModal({ isOpen, onClose }) {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (isOpen) {
            const localOrders = getLocalOrders();
            setOrders(localOrders);
        }
    }, [isOpen]);

    const refreshStatus = async () => {
        // Option to re-fetch status from API for each order
        // For MVP, just show what's local
        const localOrders = getLocalOrders();
        setOrders(localOrders);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay active">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <button className="modal-close" onClick={onClose}>&times;</button>
                <div className="modal-header">
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>🕒 LỊCH SỬ ĐẶT HÀNG</h2>
                </div>

                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {orders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.5)' }}>
                            <p>Bạn chưa có đơn hàng nào được lưu trên máy này.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {orders.map((order, index) => (
                                <div key={index} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 'bold', color: '#ffcc00' }}>#{order.orderCode}</span>
                                        <span style={{
                                            // Simple status color 
                                            color: order.status === 'paid' ? '#00d26a' : '#ff9900',
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            fontSize: '0.8rem'
                                        }}>
                                            {order.status === 'paid' ? 'Đã Thanh Toán' : 'Chờ Thanh Toán'}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                                        <span>{order.quantity} phần ({order.class})</span>
                                        <span>{formatCurrency(order.total)}</span>
                                    </div>
                                    {order.tickets > 0 && (
                                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)', color: '#667eea', fontSize: '0.9rem' }}>
                                            🎁 {order.tickets} Vé Mini Game
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
