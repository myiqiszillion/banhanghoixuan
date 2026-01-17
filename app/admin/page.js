'use client';

import { useState, useEffect } from 'react';
import { CONFIG } from '@/lib/config';
import { formatCurrency } from '@/lib/utils';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(false);

    // Initial check (session based? simple state for now)

    useEffect(() => {
        if (isAuthenticated) {
            fetchOrders();
            const interval = setInterval(fetchOrders, 10000); // Auto refresh
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === CONFIG.admin.password) {
            setIsAuthenticated(true);
        } else {
            alert('Sai mật khẩu!');
        }
    };

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/orders');
            const data = await res.json();
            if (Array.isArray(data)) {
                setOrders(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExport = () => {
        if (orders.length === 0) return alert('Không có dữ liệu!');

        const headers = ['Mã đơn', 'Họ tên', 'SĐT', 'Lớp', 'Số lượng', 'Tổng tiền', 'Vé mini game', 'Trạng thái', 'Thời gian'];
        const formatDateTime = (iso) => new Date(iso).toLocaleString('vi-VN');

        const rows = orders.map(o => [
            o.orderCode,
            o.name,
            o.phone,
            o.class,
            o.quantity,
            o.total,
            o.tickets || 0,
            o.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán',
            formatDateTime(o.timestamp)
        ]);

        const BOM = '\uFEFF';
        const csvContent = BOM + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `donhang_1011_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    // Filter Logic
    const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

    // Stats
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        paid: orders.filter(o => o.status === 'paid').length
    };

    if (!isAuthenticated) {
        return (
            <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header />
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '100px' }}>
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>🔐 ADMIN LOGIN</h2>
                        <form onSubmit={handleLogin} className="form-group">
                            <input
                                type="password"
                                placeholder="Nhập mật khẩu quản trị"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                autoFocus
                            />
                            <button type="submit" className="submit-btn" style={{ marginTop: '1rem' }}>
                                ĐĂNG NHẬP
                            </button>
                        </form>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main style={{ minHeight: '100vh' }}>
            <Header />
            <div style={{ padding: '120px 2rem 60px', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>🔐 QUẢN LÝ ĐƠN HÀNG</h1>
                    <button onClick={() => setIsAuthenticated(false)} className="clear-btn" style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}>Thoát</button>
                </div>

                {/* Stats */}
                <div className="admin-stats">
                    <div className="stat-card">
                        <div className="stat-value total">{stats.total}</div>
                        <div className="stat-label">Tổng đơn hàng</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value pending">{stats.pending}</div>
                        <div className="stat-label">Chờ thanh toán</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value paid">{stats.paid}</div>
                        <div className="stat-label">Đã thanh toán</div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="admin-filters" style={{ marginBottom: 0 }}>
                        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tất cả</button>
                        <button className={`filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Chờ thanh toán</button>
                        <button className={`filter-btn ${filter === 'paid' ? 'active' : ''}`} onClick={() => setFilter('paid')}>Đã thanh toán</button>
                    </div>
                    <button className="admin-btn export-btn" onClick={handleExport} style={{ maxWidth: '200px' }}>
                        📥 Xuất Excel
                    </button>
                </div>

                {/* List */}
                <div className="orders-list" style={{ maxHeight: '600px' }}>
                    {filteredOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                            <p>Không có đơn hàng nào</p>
                        </div>
                    ) : filteredOrders.map(order => (
                        <div key={order.orderCode} className="order-card">
                            <div className="order-header">
                                <span className="order-code">{order.orderCode}</span>
                                <span className={`order-status ${order.status}`}>
                                    {order.status === 'paid' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                                </span>
                            </div>
                            <div className="order-details">
                                <div className="order-detail">
                                    <span className="detail-label">👤</span>
                                    <span className="detail-value">{order.name}</span>
                                </div>
                                <div className="order-detail">
                                    <span className="detail-label">📞</span>
                                    <span className="detail-value">{order.phone}</span>
                                </div>
                                <div className="order-detail">
                                    <span className="detail-label">🏫</span>
                                    <span className="detail-value">{order.class}</span>
                                </div>
                                <div className="order-detail">
                                    <span className="detail-label">🍡</span>
                                    <span className="detail-value">{order.quantity} phần - {formatCurrency(order.total)}</span>
                                </div>
                                {order.tickets > 0 && (
                                    <div className="order-detail">
                                        <span className="detail-label">🎮</span>
                                        <span className="detail-value">{order.tickets} vé mini game</span>
                                    </div>
                                )}
                            </div>
                            <div className="order-time" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
                                🕐 {new Date(order.timestamp).toLocaleString('vi-VN')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </main>
    );
}
