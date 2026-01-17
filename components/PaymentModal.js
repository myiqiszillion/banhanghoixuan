'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { CONFIG } from '@/lib/config';
import { removeVietnameseAccents, formatCurrency } from '@/lib/utils';
import clsx from 'clsx';

export default function PaymentModal({ isOpen, onClose, orderData, onSuccess }) {
    const [isLoading, setIsLoading] = useState(true);
    const [qrUrl, setQrUrl] = useState('');

    useEffect(() => {
        if (isOpen && orderData) {
            setIsLoading(true);

            // Format: 1011 [CODE] [NAME] (Restored per user request)
            const rawContent = `1011 ${orderData.orderCode} ${removeVietnameseAccents(orderData.name || '')}`;
            const transferContent = rawContent.trim();

            // Generate URL
            // des (description) = transferContent
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
            }, 3000); // Check every 3s

            return () => clearInterval(interval);
        }
    }, [isOpen, orderData, onSuccess]);

    if (!isOpen || !orderData) return null;

    const transferContent = `1011 ${orderData.orderCode} ${removeVietnameseAccents(orderData.name || '')}`;

    return (
        <div className={clsx("modal-overlay", { active: isOpen })}>
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>&times;</button>

                <div className="modal-header">
                    <h2>💳 THANH TOÁN</h2>
                    <p>Quét mã QR để thanh toán</p>
                </div>

                {/* WARNING SECTION */}
                <div style={{
                    background: 'rgba(255, 68, 68, 0.1)',
                    border: '2px solid #ff4444',
                    borderRadius: '12px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    textAlign: 'center'
                }}>
                    <p style={{
                        color: '#ff4444',
                        fontWeight: '800',
                        fontSize: '1.1rem',
                        marginBottom: '0.5rem',
                        textTransform: 'uppercase',
                        animation: 'pulse 1.5s infinite'
                    }}>
                        ⚠️ CẢNH BÁO QUAN TRỌNG
                    </p>
                    <p style={{ color: '#fff', fontSize: '0.95rem' }}>
                        NỘI DUNG CHUYỂN KHOẢN PHẢI CHÍNH XÁC:<br />
                        <strong style={{ color: '#ffcc00', fontSize: '1.2rem', fontFamily: 'monospace' }}>
                            {transferContent}
                        </strong>
                    </p>
                    <p style={{ color: '#ff4444', fontWeight: 'bold', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                        SAI NỘI DUNG SẼ MẤT TIỀN! ❌
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
                                <div className="spinner"></div>
                                {/* Spinner needs css, using inline fallback or text */}
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
            </div>
        </div>
    );
}
