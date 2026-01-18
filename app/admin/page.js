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
    const [transactions, setTransactions] = useState([]);
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'transactions'
    const [filter, setFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(false);

    // Initial check (session based? simple state for now)

    useEffect(() => {
        if (isAuthenticated) {
            fetchOrders();
            fetchTransactions();
            const interval = setInterval(() => {
                fetchOrders();
                if (activeTab === 'transactions') fetchTransactions();
            }, 2000); // Auto refresh every 2 seconds (Near Real-time)
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, activeTab]);

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

    const fetchTransactions = async () => {
        try {
            const res = await fetch(`/api/admin/transactions?password=${CONFIG.admin.password}&t=${Date.now()}`);
            const data = await res.json();
            if (data.transactions) {
                setTransactions(data.transactions);
            }
        } catch (e) {
            console.error('Failed to fetch transactions', e);
        }
    };

    const handleExport = () => {
        if (orders.length === 0) return alert('Không có dữ liệu!');

        const headers = ['Mã đơn', 'Họ tên', 'SĐT', 'Lớp', 'Số lượng', 'Tổng tiền', 'Vé mini game', 'Tặng thêm', 'Trạng thái', 'Thời gian'];
        const formatDateTime = (iso) => new Date(iso).toLocaleString('vi-VN');

        const rows = orders.map(o => [
            o.orderCode,
            o.name,
            o.phone,
            o.class,
            o.quantity,
            o.total,
            o.tickets || 0,
            o.freePortions || 0,
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
    const filteredOrders = orders.filter(o => {
        if (filter === 'all') return true;
        if (filter === 'pending') return o.status === 'pending';
        if (filter === 'paid') return o.status === 'paid';
        if (filter === 'delivered') return o.delivered === true; // New filter
        if (filter === 'undelivered') return !o.delivered; // New filter
        return true;
    }).sort((a, b) => {
        // Chưa giao (delivered=false) lên trước, đã giao (delivered=true) xuống sau
        if (a.delivered === b.delivered) return 0;
        return a.delivered ? 1 : -1;
    });

    // Toggle Delivery
    const toggleDelivery = async (orderCode, currentStatus) => {
        const newStatus = !currentStatus;
        // Optimistic UI update
        const oldOrders = [...orders];
        setOrders(orders.map(o => o.orderCode === orderCode ? { ...o, delivered: newStatus } : o));

        try {
            const res = await fetch('/api/orders/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderCode, delivered: newStatus })
            });
            if (!res.ok) throw new Error('Failed to update');
        } catch (e) {
            alert('Lỗi cập nhật trạng thái');
            setOrders(oldOrders); // Revert
        }
    };

    // Delete Single
    const handleDelete = async (orderCode) => {
        if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này? Không thể khôi phục!')) return;

        try {
            const res = await fetch('/api/orders/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderCode })
            });
            if (res.ok) {
                setOrders(orders.filter(o => o.orderCode !== orderCode));
            } else {
                alert('Lỗi khi xóa đơn hàng');
            }
        } catch (e) {
            console.error(e);
            alert('Lỗi hệ thống');
        }
    };

    // Clear All
    const handleClearAll = async () => {
        if (!confirm('⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa TẤT CẢ đơn hàng?\nHành động này không thể khôi phục!')) return;
        if (!confirm('Xác nhận lần 2: Xóa toàn bộ dữ liệu?')) return;

        try {
            const res = await fetch('/api/orders/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ all: true })
            });
            if (res.ok) {
                setOrders([]);
                alert('Đã xóa tất cả dữ liệu');
            } else {
                alert('Lỗi khi xóa dữ liệu');
            }
        } catch (e) {
            console.error(e);
            alert('Lỗi hệ thống');
        }
    };

    // Stats
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        paid: orders.filter(o => o.status === 'paid').length,
        delivered: orders.filter(o => o.delivered).length // New stat
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>🔐 QUẢN LÝ ĐƠN HÀNG</h1>
                    <button onClick={() => setIsAuthenticated(false)} className="clear-btn" style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}>Thoát</button>
                </div>

                {/* TABS */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`filter-btn ${activeTab === 'orders' ? 'active' : ''}`}
                        style={{ fontSize: '1.2rem', padding: '0.8rem 1.5rem', flex: 1 }}
                    >
                        📦 Đơn Hàng
                    </button>
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={`filter-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                        style={{ fontSize: '1.2rem', padding: '0.8rem 1.5rem', flex: 1 }}
                    >
                        💸 Lịch Sử Giao Dịch
                    </button>
                </div>

                {activeTab === 'orders' ? (
                    <>
                        {/* Stats */}
                        <div className="admin-stats">
                            <div className="stat-card">
                                <div className="stat-value total">{stats.total}</div>
                                <div className="stat-label">Tổng đơn</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-value paid">{stats.paid}</div>
                                <div className="stat-label">Đã thu tiền</div>
                            </div>
                            <div className="stat-card" style={{ border: '1px solid #00d26a' }}>
                                <div className="stat-value" style={{ color: '#00d26a' }}>{stats.delivered}</div>
                                <div className="stat-label">Đã giao hàng</div>
                            </div>
                        </div>

                        {/* Filters & Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div className="admin-filters" style={{ marginBottom: 0 }}>
                                <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tất cả</button>
                                <button className={`filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Chờ thanh toán</button>
                                <button className={`filter-btn ${filter === 'paid' ? 'active' : ''}`} onClick={() => setFilter('paid')}>Đã thanh toán</button>
                                <button className={`filter-btn ${filter === 'delivered' ? 'active' : ''}`} onClick={() => setFilter('delivered')}>✅ Đã giao</button>

                                <button
                                    className="filter-btn"
                                    style={{ background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444', border: '1px solid currentColor' }}
                                    onClick={handleClearAll}
                                >
                                    🗑️ XÓA TẤT CẢ
                                </button>
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
                                <div key={order.orderCode} className="order-card" style={{ borderLeft: order.delivered ? '4px solid #00d26a' : '4px solid rgba(255,255,255,0.1)' }}>
                                    <div className="order-header">
                                        <div>
                                            <span className="order-code">{order.orderCode}</span>
                                            <span style={{ marginLeft: '1rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                                                {new Date(order.timestamp).toLocaleString('vi-VN')}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <span className={`order-status ${order.status}`}>
                                                {order.status === 'paid' ? 'Đã Thanh Toán' : 'Chờ Thanh Toán'}
                                            </span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(order.orderCode); }}
                                                style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', padding: '0.2rem' }}
                                                title="Xóa đơn hàng"
                                            >
                                                ❌
                                            </button>
                                        </div>
                                    </div>

                                    <div className="order-details">
                                        <div className="order-detail">
                                            <span className="detail-label">👤</span>
                                            <span className="detail-value">{order.name} - {order.phone}</span>
                                        </div>
                                        <div className="order-detail">
                                            <span className="detail-label">🍡</span>
                                            <span className="detail-value">{order.quantity} phần ({order.class})</span>
                                        </div>
                                        {order.tickets > 0 && (
                                            <div className="order-detail">
                                                <span className="detail-label">🎟️</span>
                                                <span className="detail-value" style={{ color: '#667eea', fontWeight: 'bold' }}>{order.tickets} vé</span>
                                            </div>

                                        )}
                                        {order.freePortions > 0 && (
                                            <div className="order-detail">
                                                <span className="detail-label">🎁</span>
                                                <span className="detail-value" style={{ color: '#ffcc00', fontWeight: 'bold' }}>+{order.freePortions} phần tặng</span>
                                            </div>
                                        )}
                                        <div className="order-detail" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(255,255,255,0.1)', justifyContent: 'space-between', width: '100%' }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ffcc00' }}>{formatCurrency(order.total)}</span>

                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.8rem', borderRadius: '50px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={!!order.delivered}
                                                    onChange={() => toggleDelivery(order.orderCode, order.delivered)}
                                                    style={{ width: '18px', height: '18px' }}
                                                />
                                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: order.delivered ? '#00d26a' : 'rgba(255,255,255,0.6)' }}>
                                                    {order.delivered ? 'ĐÃ GIAO HÀNG' : 'CHƯA GIAO'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    // TRANSACTIONS TAB
                    <div className="orders-list">
                        <div style={{ marginBottom: '1rem', color: '#aaa', fontStyle: 'italic' }}>
                            * Hiển thị 50 giao dịch gần nhất từ SePay
                        </div>
                        {transactions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💸</div>
                                <p>Không có giao dịch nào</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                            <th style={{ padding: '1rem' }}>Thời gian</th>
                                            <th style={{ padding: '1rem' }}>Số tiền</th>
                                            <th style={{ padding: '1rem' }}>Nội dung</th>
                                            <th style={{ padding: '1rem' }}>Số tham chiếu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions.map(tx => (
                                            <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                                                <td style={{ padding: '1rem', color: '#aaa' }}>{tx.transaction_date}</td>
                                                <td style={{ padding: '1rem', color: '#00d26a', fontWeight: 'bold' }}>+{formatCurrency(tx.amount_in)}</td>
                                                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{tx.transaction_content}</td>
                                                <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#aaa' }}>{tx.reference_number}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <Footer />
        </main >
    );
}
