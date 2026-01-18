'use client';

import { useEffect, useState, useCallback } from 'react';
import { CONFIG } from '@/lib/config';
import { removeVietnameseAccents, formatCurrency } from '@/lib/utils';
import clsx from 'clsx';

const PAYMENT_TIMEOUT_MINUTES = 15;

export default function PaymentModal({ isOpen, onClose, orderData, onSuccess }) {
    const [isLoading, setIsLoading] = useState(true);
    const [qrUrl, setQrUrl] = useState('');
    const [timeLeft, setTimeLeft] = useState(PAYMENT_TIMEOUT_MINUTES * 60); // seconds
    const [isExpired, setIsExpired] = useState(false);

    // Calculate time left based on order timestamp
    const calculateTimeLeft = useCallback(() => {
        if (!orderData?.timestamp) return PAYMENT_TIMEOUT_MINUTES * 60;

        const orderTime = new Date(orderData.timestamp).getTime();
        const expiryTime = orderTime + (PAYMENT_TIMEOUT_MINUTES * 60 * 1000);
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));

        return remaining;
    }, [orderData]);

    // Initialize and countdown timer
    useEffect(() => {
        if (isOpen && orderData) {
            const initialTime = calculateTimeLeft();
            setTimeLeft(initialTime);
            setIsExpired(initialTime <= 0);

            if (initialTime <= 0) return;

            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setIsExpired(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [isOpen, orderData, calculateTimeLeft]);

    // Generate QR and poll for payment
    useEffect(() => {
        if (isOpen && orderData && !isExpired) {
            setIsLoading(true);

            const rawContent = `1011 ${orderData.orderCode} ${removeVietnameseAccents(orderData.name || '')}`;
            const transferContent = rawContent.trim();
            const url = `${CONFIG.sepay.qrUrl}?acc=${CONFIG.bankInfo.accountNumber}&bank=${CONFIG.bankInfo.bankCode}&amount=${orderData.total}&des=${encodeURIComponent(transferContent)}`;
            setQrUrl(url);

            // Poll for payment status
            const interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/check-payment?code=${orderData.orderCode}`);
                    const data = await res.json();
                    if (data.paid) {
                        clearInterval(interval);
                        onSuccess();
                    }
                } catch (e) {
                    console.error('Payment check failed', e);
                }
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [isOpen, orderData, onSuccess, isExpired]);

    // Prevent body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !orderData) return null;

    const transferContent = `1011 ${orderData.orderCode} ${removeVietnameseAccents(orderData.name || '')}`;

    // Format time display
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const isUrgent = timeLeft < 120; // Less than 2 minutes

    return (
        <div className={clsx("modal-overlay", { active: isOpen })}>
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>&times;</button>

                <div className="modal-header">
                    <h2>💳 THANH TOÁN</h2>
                    <p>Quét mã QR để thanh toán</p>
                </div>

                {/* COUNTDOWN TIMER */}
                <div style={{
                    background: isExpired ? 'rgba(255, 68, 68, 0.2)' : isUrgent ? 'rgba(255, 153, 0, 0.2)' : 'rgba(0, 210, 106, 0.1)',
                    border: `2px solid ${isExpired ? '#ff4444' : isUrgent ? '#ff9900' : '#00d26a'}`,
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        fontSize: '0.8rem',
                        color: isExpired ? '#ff4444' : isUrgent ? '#ff9900' : '#00d26a',
                        fontWeight: '600',
                        marginBottom: '0.25rem'
                    }}>
                        {isExpired ? '⚠️ ĐÃ HẾT THỜI GIAN' : '⏱️ THỜI GIAN CÒN LẠI'}
                    </div>
                    <div style={{
                        fontSize: '1.8rem',
                        fontWeight: '900',
                        color: isExpired ? '#ff4444' : isUrgent ? '#ff9900' : '#00d26a',
                        fontFamily: 'monospace'
                    }}>
                        {isExpired ? 'HẾT HẠN' : timeDisplay}
                    </div>
                    {isExpired && (
                        <p style={{ fontSize: '0.85rem', color: '#ff4444', marginTop: '0.5rem' }}>
                            Đơn hàng đã bị hủy. Vui lòng đặt lại!
                        </p>
                    )}
                </div>

                {!isExpired && (
                    <>
                        {/* WARNING SECTION */}
                        <div style={{
                            background: 'rgba(255, 68, 68, 0.1)',
                            border: '2px solid #ff4444',
                            borderRadius: '12px',
                            padding: '1rem',
                            marginBottom: '1rem',
                            textAlign: 'center'
                        }}>
                            <p style={{
                                color: '#ff4444',
                                fontWeight: '800',
                                fontSize: '1rem',
                                marginBottom: '0.5rem',
                                textTransform: 'uppercase'
                            }}>
                                ⚠️ CẢNH BÁO QUAN TRỌNG
                            </p>
                            <p style={{ color: '#fff', fontSize: '0.9rem' }}>
                                NỘI DUNG CHUYỂN KHOẢN PHẢI CHÍNH XÁC:<br />
                                <strong style={{ color: '#ffcc00', fontSize: '1.1rem', fontFamily: 'monospace' }}>
                                    {transferContent}
                                </strong>
                            </p>
                            <p style={{ color: '#ff4444', fontWeight: 'bold', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                                SAI NỘI DUNG = MẤT TIỀN! ❌
                            </p>
                        </div>

                        <div className="qr-container">
                            <div className="qr-wrapper">
                                {qrUrl && (
                                    <img
                                        src={qrUrl}
                                        alt="Mã QR Thanh Toán"
                                        onLoad={() => setIsLoading(false)}
                                        style={{ opacity: isLoading ? 0.3 : 1, transition: 'opacity 0.3s' }}
                                    />
                                )}
                                {isLoading && (
                                    <div className="qr-loading">
                                        <p style={{ color: '#333', position: 'absolute' }}>Đang tạo QR...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="payment-info">
                            <div className="info-row">
                                <span className="info-label">Ngân hàng</span>
                                <span className="info-value">{CONFIG.bankInfo.bankName}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Chủ tài khoản</span>
                                <span className="info-value">{CONFIG.bankInfo.accountHolder}</span>
                            </div>
                            <div className="info-row">
                                <span className="info-label">Số tiền</span>
                                <span className="info-value amount">{formatCurrency(orderData.total)}</span>
                            </div>
                        </div>

                        <div className="payment-status">
                            <div className="status-pending">
                                <span className="pulse-dot"></span>
                                Đang chờ thanh toán...
                            </div>
                        </div>
                    </>
                )}

                {isExpired && (
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            fontWeight: '700',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            marginTop: '1rem'
                        }}
                    >
                        ĐÓNG VÀ ĐẶT LẠI
                    </button>
                )}
            </div>
        </div>
    );
}
