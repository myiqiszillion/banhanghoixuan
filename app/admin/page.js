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
    const [gameStats, setGameStats] = useState([]);
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'transactions' | 'minigame'
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Initial check (session based? simple state for now)

    useEffect(() => {
        if (isAuthenticated) {
            // Initial fetches
            fetchOrders();
            fetchTransactions();
            fetchGameStats();

            // Auto-check pending payments on load
            autoCheckPayments();

            // 1. Data Refresh Loop (Fast - 2s)
            const dataInterval = setInterval(() => {
                fetchOrders();
                if (activeTab === 'transactions') fetchTransactions();
                if (activeTab === 'minigame') fetchGameStats();
            }, 2000);

            // 2. Auto-Check Payments Loop (10s) - check pending orders against SePay
            const autoCheckInterval = setInterval(() => {
                autoCheckPayments();
            }, 10000);

            return () => {
                clearInterval(dataInterval);
                clearInterval(autoCheckInterval);
            };
        }
    }, [isAuthenticated, activeTab]);

    // Auto-check pending payments against SePay transactions
    const autoCheckPayments = async () => {
        try {
            const res = await fetch('/api/orders/auto-check');
            const data = await res.json();
            if (data.updated > 0) {
                console.log(`[Auto-Check] Updated ${data.updated} orders:`, data.updatedOrders);
                fetchOrders(); // Refresh orders list
            }
        } catch (e) {
            console.error("[Auto-Check] Failed:", e);
        }
    };

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

    const fetchGameStats = async () => {
        try {
            const res = await fetch(`/api/admin/minigame-stats?password=${CONFIG.admin.password}`);
            const data = await res.json();
            if (data.stats) {
                setGameStats(data.stats);
            }
        } catch (e) {
            console.error('Failed to fetch game stats', e);
        }
    };

    const handleAddTickets = async (phone, amount = null) => {
        const ticketsToAdd = amount || prompt(`Nhập số vé muốn thêm cho ${phone}:`, '1');
        if (!ticketsToAdd || isNaN(ticketsToAdd) || parseInt(ticketsToAdd) <= 0) return;

        try {
            const res = await fetch('/api/admin/add-tickets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: CONFIG.admin.password,
                    phone,
                    tickets: parseInt(ticketsToAdd)
                })
            });
            const data = await res.json();
            if (data.success) {
                alert(`✅ ${data.message}`);
                fetchGameStats();
            } else {
                alert(`❌ Lỗi: ${data.error}`);
            }
        } catch (e) {
            alert('❌ Lỗi kết nối');
        }
    };

    const handleExport = () => {
        // Filter only PAID orders for Google Sheet export
        const paidOrders = orders.filter(o => o.status === 'paid');

        if (paidOrders.length === 0) return alert('Chưa có đơn hàng nào đã thanh toán!');

        // Columns: Tên | SĐT | Lớp | Số phần + số phần tặng thêm nếu có | Trạng thái giao
        const headers = ['Tên', 'SĐT', 'Lớp', 'Số phần', 'Trạng thái giao'];

        const rows = paidOrders.map(o => {
            // Format quantity: e.g. "5 (+1 tặng)"
            let quantityStr = `${o.quantity}`;
            if (o.freePortions > 0) {
                quantityStr += ` (+${o.freePortions} tặng)`;
            }

            return [
                o.name,
                `'${o.phone}`, // Add quote to force string in Excel/Sheets (preserve leading zero)
                o.class,
                quantityStr,
                o.delivered ? 'Đã giao' : 'Chưa giao'
            ];
        });

        const BOM = '\uFEFF';
        const csvContent = BOM + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Danh_Sach_Hoi_Xuan_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    // Filter Logic
    const filteredOrders = orders.filter(o => {
        // Search Filter
        if (searchQuery) {
            const lowerSearch = searchQuery.toLowerCase();
            const matchName = o.name?.toLowerCase().includes(lowerSearch);
            const matchPhone = o.phone?.includes(lowerSearch);
            if (!matchName && !matchPhone) return false;
        }

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

    // Delete Game State
    const handleDeleteGameState = async (phone) => {
        if (!confirm(`Bạn có chắc muốn XÓA dữ liệu game của SĐT ${phone}?`)) return;

        try {
            const res = await fetch('/api/admin/minigame-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password: CONFIG.admin.password })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                alert('Đã xóa dữ liệu game thành công!');
                setGameStats(gameStats.filter(s => s.phone !== phone));
            } else {
                alert('Lỗi xóa dữ liệu: ' + (data.error || 'Unknown'));
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



    // Google Sheet Sync


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
                    <button
                        onClick={() => setActiveTab('minigame')}
                        className={`filter-btn ${activeTab === 'minigame' ? 'active' : ''}`}
                        style={{ fontSize: '1.2rem', padding: '0.8rem 1.5rem', flex: 1 }}
                    >
                        🎮 Mini Game
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            {/* Search Bar */}
                            <input
                                type="text"
                                placeholder="🔍 Tìm kiếm theo tên hoặc số điện thoại..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    padding: '0.8rem',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#fff',
                                    fontSize: '1rem',
                                    width: '100%'
                                }}
                            />

                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                                <div className="admin-filters" style={{ marginBottom: 0 }}>
                                    <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Tất cả</button>
                                    <button className={`filter-btn ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Chờ thanh toán</button>
                                    <button className={`filter-btn ${filter === 'paid' ? 'active' : ''}`} onClick={() => setFilter('paid')}>Đã thanh toán</button>
                                    <button className={`filter-btn ${filter === 'delivered' ? 'active' : ''}`} onClick={() => setFilter('delivered')}>✅ Đã giao</button>
                                    <button className={`filter-btn ${filter === 'undelivered' ? 'active' : ''}`} onClick={() => setFilter('undelivered')} style={{ background: filter === 'undelivered' ? 'rgba(255, 165, 0, 0.3)' : 'rgba(255, 165, 0, 0.1)', border: '1px solid #ffa500', color: '#ffa500' }}>📦 Chưa giao</button>

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
                                        {order.note && (
                                            <div className="order-detail" style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                                                <span className="detail-label">📝</span>
                                                <span className="detail-value" style={{ color: '#ffa500', fontStyle: 'italic' }}>{order.note}</span>
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
                ) : activeTab === 'transactions' ? (
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
                ) : (
                    // MINIGAME TAB
                    <div className="orders-list">
                        {/* Manual Add Tickets Form */}
                        <div style={{ background: 'rgba(0,210,106,0.1)', border: '1px solid rgba(0,210,106,0.3)', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                            <h4 style={{ color: '#00d26a', marginBottom: '0.75rem', fontSize: '0.95rem' }}>➕ Thêm vé thủ công</h4>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <input
                                    type="tel"
                                    id="addTicketPhone"
                                    placeholder="Số điện thoại"
                                    style={{ flex: '1', minWidth: '150px', padding: '0.6rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff' }}
                                />
                                <input
                                    type="number"
                                    id="addTicketAmount"
                                    placeholder="Số vé"
                                    defaultValue="1"
                                    min="1"
                                    style={{ width: '80px', padding: '0.6rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#fff', textAlign: 'center' }}
                                />
                                <button
                                    onClick={() => {
                                        const phone = document.getElementById('addTicketPhone').value;
                                        const amount = document.getElementById('addTicketAmount').value;
                                        if (phone && phone.length === 10) {
                                            handleAddTickets(phone, parseInt(amount) || 1);
                                            document.getElementById('addTicketPhone').value = '';
                                        } else {
                                            alert('Nhập đúng 10 số điện thoại!');
                                        }
                                    }}
                                    style={{ padding: '0.6rem 1.2rem', background: 'linear-gradient(90deg, #00d26a, #059669)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                                >
                                    ➕ Thêm vé
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem', color: '#aaa', fontStyle: 'italic' }}>
                            * Danh sách người chơi và trạng thái vé
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                                        <th style={{ padding: '1rem' }}>SĐT</th>
                                        <th style={{ padding: '1rem' }}>Tổng vé</th>
                                        <th style={{ padding: '1rem' }}>Đã dùng</th>
                                        <th style={{ padding: '1rem' }}>Còn lại</th>
                                        <th style={{ padding: '1rem' }}>Thẻ đang có</th>
                                        <th style={{ padding: '1rem' }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {gameStats.map(stat => (
                                        <tr key={stat.phone} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 'bold' }}>{stat.phone}</td>
                                            <td style={{ padding: '1rem' }}>{stat.totalTickets}</td>
                                            <td style={{ padding: '1rem' }}>{stat.usedTickets}</td>
                                            <td style={{ padding: '1rem', color: stat.remainingTickets > 0 ? '#00d26a' : '#aaa', fontWeight: stat.remainingTickets > 0 ? 'bold' : 'normal' }}>
                                                {stat.remainingTickets}
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                {stat.collectedCards.length}/11
                                                {stat.collectedCards.length === 11 && <span style={{ marginLeft: '10px' }}>👑 ĐÃ XONG</span>}
                                            </td>
                                            <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleAddTickets(stat.phone)}
                                                    style={{ background: 'rgba(0, 210, 106, 0.2)', border: '1px solid #00d26a', color: '#00d26a', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}
                                                    title="Thêm vé"
                                                >
                                                    ➕ Vé
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteGameState(stat.phone)}
                                                    style={{ background: 'rgba(255, 68, 68, 0.2)', border: '1px solid #ff4444', color: '#ff4444', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}
                                                    title="Xóa dữ liệu game"
                                                >
                                                    ❌ Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {gameStats.length === 0 && (
                                        <tr>
                                            <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: '#aaa' }}>Chưa có dữ liệu chơi game</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </main >
    );
}
