'use client';

import { useState } from 'react';
import { CONFIG } from '@/lib/config';
import { formatCurrency, generateOrderCode } from '@/lib/utils';
import PaymentModal from './PaymentModal';

export default function OrderForm() {
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        class: '',
        quantity: 1,
        note: ''
    });

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);
    const [successModalOpen, setSuccessModalOpen] = useState(false);

    // Derived values
    const total = formData.quantity * CONFIG.product.price;
    const tickets = formData.quantity >= CONFIG.promo.minQuantityForTicket
        ? Math.floor(formData.quantity / CONFIG.promo.minQuantityForTicket) * CONFIG.promo.ticketsPerPromo
        : 0;

    const freePortions = Math.floor(formData.quantity / CONFIG.promo.buyXGet1Free);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const orderCode = generateOrderCode();
        const orderPayload = {
            ...formData,
            orderCode,
            total,
            tickets,
            freePortions,
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        try {
            // Save order to DB (Server)
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload)
            });

            if (!res.ok) throw new Error('Failed to create order');

            setCurrentOrder(orderPayload);
            setPaymentModalOpen(true);
        } catch (error) {
            alert('Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePaymentSuccess = () => {
        setPaymentModalOpen(false);
        setSuccessModalOpen(true);

        // Save to local storage
        if (currentOrder) {
            import('@/lib/storage').then(({ saveOrderLocally }) => {
                // Ensure status is up to date (paid) if it came from payment modal success
                const orderToSave = { ...currentOrder, status: 'paid' };
                saveOrderLocally(orderToSave);
            });
        }
    };

    const closeSuccessModal = () => {
        setSuccessModalOpen(false);
        setFormData({ name: '', phone: '', class: '', quantity: 1, note: '' });
        setCurrentOrder(null);
    };

    return (
        <section className="order-section">
            <div className="order-container">
                <h2 className="section-title">
                    <span className="title-icon">🎟️</span>
                    ĐẶT VÉ NGAY
                </h2>

                <form className="order-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>
                            <span className="label-icon">👤</span> Họ và tên
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Nhập họ tên của bạn"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <span className="label-icon">📞</span> Số điện thoại
                        </label>
                        <input
                            type="tel"
                            required
                            placeholder="Nhập số điện thoại"
                            pattern="[0-9]{10}"
                            title="Vui lòng nhập đúng 10 số điện thoại"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                        <p style={{
                            color: '#ffcc00',
                            fontSize: '0.75rem',
                            marginTop: '0.5rem',
                            padding: '0.5rem',
                            background: 'rgba(255,204,0,0.1)',
                            borderRadius: '6px'
                        }}>
                            💡 Lưu ý: Dùng đúng SĐT này để chơi Mini Game nhận vé!
                        </p>
                    </div>

                    <div className="form-group">
                        <label>
                            <span className="label-icon">🏫</span> Lớp
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ví dụ: 10.11"
                            value={formData.class}
                            onChange={e => setFormData({ ...formData, class: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>
                            <span className="label-icon">🔢</span> Số lượng
                        </label>
                        <div className="quantity-selector">
                            <button type="button" className="qty-btn" onClick={() => setFormData(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}>-</button>
                            <input
                                type="number"
                                min="1"
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                            />
                            <button type="button" className="qty-btn" onClick={() => setFormData(prev => ({ ...prev, quantity: prev.quantity + 1 }))}>+</button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>
                            <span className="label-icon">📝</span> Ghi chú
                        </label>
                        <textarea
                            placeholder="Lời nhắn cho chúng mình..."
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                        ></textarea>
                    </div>

                    {/* Order Summary */}
                    <div className="order-summary">
                        <div className="summary-row">
                            <span>Số lượng:</span>
                            <span id="summaryQty">{formData.quantity} phần</span>
                        </div>
                        {tickets > 0 && (
                            <div className="summary-row promo-row">
                                <span>🎁 Quà tặng:</span>
                                <span className="promo-tickets">+{tickets} vé mini game</span>
                            </div>
                        )}
                        {freePortions > 0 && (
                            <div className="summary-row promo-row">
                                <span>🎁 Tặng thêm:</span>
                                <span className="promo-tickets">+{freePortions} phần</span>
                            </div>
                        )}
                        <div className="summary-divider"></div>
                        <div className="summary-row total-row">
                            <span>TỔNG CỘNG:</span>
                            <span className="total-amount">{formatCurrency(total)}</span>
                        </div>
                    </div>

                    <button type="submit" className="submit-btn" disabled={isSubmitting}>
                        {isSubmitting ? 'ĐANG XỬ LÝ...' : <>
                            <span className="btn-icon">💳</span>
                            <span className="btn-text">XÁC NHẬN ĐẶT VÉ</span>
                            <span className="btn-arrow">→</span>
                        </>}
                    </button>
                </form>
            </div>

            <PaymentModal
                isOpen={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                orderData={currentOrder}
                onSuccess={handlePaymentSuccess}
            />

            {/* Success Modal */}
            <div className={`modal-overlay ${successModalOpen ? 'active' : ''}`}>
                <div className="modal-content success-modal">
                    <button className="modal-close" onClick={closeSuccessModal}>&times;</button>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>THANH TOÁN THÀNH CÔNG!</h2>
                        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
                            Cảm ơn <strong>{currentOrder?.name}</strong> đã ủng hộ!<br />
                            Đơn hàng <strong>{currentOrder?.orderCode}</strong> đã được xác nhận.
                        </p>
                        {currentOrder?.tickets > 0 && (
                            <div style={{ background: 'rgba(102, 126, 234, 0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(102, 126, 234, 0.3)', marginBottom: '1.5rem' }}>
                                <p style={{ color: '#fff', fontWeight: 'bold' }}>🎁 BẠN NHẬN ĐƯỢC {currentOrder.tickets} VÉ MINI GAME</p>
                                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Hãy chụp màn hình này lại để đổi vé nhé!</p>
                            </div>
                        )}
                        {currentOrder?.freePortions > 0 && (
                            <div style={{ background: 'rgba(255, 107, 53, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 107, 53, 0.3)', marginBottom: '1.5rem' }}>
                                <p style={{ color: '#fff', fontWeight: 'bold' }}>🎁 BẠN ĐƯỢC TẶNG THÊM {currentOrder.freePortions} PHẦN ĂN</p>
                                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Mua 10 tặng 1 - Quá hời!</p>
                            </div>
                        )}
                        <button className="submit-btn" style={{ width: '100%', marginTop: 0 }} onClick={closeSuccessModal}>ĐÓNG</button>
                    </div>
                </div>
            </div>
        </section>
    );
}
