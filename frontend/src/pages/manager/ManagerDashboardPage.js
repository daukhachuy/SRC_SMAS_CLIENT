import React, { useEffect, useState, useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { myOrderAPI } from '../../api/myOrderApi';

const PAGE_SIZE = 10;

const ManagerDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsRes, orders] = await Promise.allSettled([
          fetch(`${process.env.REACT_APP_API_URL || 'https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api'}/Dashboard/stats`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token') || ''}`,
              'Content-Type': 'application/json',
            },
          }).then((r) => r.json()),
          myOrderAPI.getOrders('All', ['Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled']),
        ]);

        // Stats
        const statsData = statsRes.status === 'fulfilled' ? statsRes.value : null;
        if (statsData) {
          const inner = statsData?.data ?? statsData;
          const todayRevenue = Number(inner?.todayRevenue ?? inner?.today_revenue ?? 0);
          const todayOrders = Number(inner?.todayOrders ?? inner?.today_orders ?? inner?.totalOrdersToday ?? 0);
          const emptyTables = Number(inner?.emptyTables ?? inner?.empty_tables ?? 0);
          const totalTables = Number(inner?.totalTables ?? inner?.total_tables ?? 40);
          setStats([
            {
              title: 'Số đơn hôm nay',
              value: todayOrders > 0 ? todayOrders.toLocaleString('vi-VN') : '—',
              delta: inner?.ordersDelta != null ? `${inner.ordersDelta > 0 ? '+' : ''}${inner.ordersDelta}%` : '—',
              trend: inner?.ordersDelta >= 0 ? 'up' : 'down',
            },
            {
              title: 'Doanh thu ngày',
              value: todayRevenue > 0
                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(todayRevenue)
                : '—',
              delta: inner?.revenueDelta != null ? `${inner.revenueDelta > 0 ? '+' : ''}${inner.revenueDelta}%` : '—',
              trend: inner?.revenueDelta >= 0 ? 'up' : 'down',
            },
            {
              title: 'Bàn còn trống',
              value: `${emptyTables} / ${totalTables}`,
              delta: inner?.tablesDelta || 'Đúng tiến độ',
              trend: 'flat',
            },
          ]);
        } else {
          setStats([
            { title: 'Số đơn hôm nay', value: '—', delta: '—', trend: 'flat' },
            { title: 'Doanh thu ngày', value: '—', delta: '—', trend: 'flat' },
            { title: 'Bàn còn trống', value: '— / —', delta: '—', trend: 'flat' },
          ]);
        }

        // Orders
        const ordersRaw = orders.status === 'fulfilled' ? (orders.value ?? []) : [];
        setAllOrders(ordersRaw);
        setOrdersPage(1);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('Không tải được dữ liệu dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(allOrders.length / PAGE_SIZE)), [allOrders.length]);
  const pagedOrders = useMemo(
    () => allOrders.slice((ordersPage - 1) * PAGE_SIZE, ordersPage * PAGE_SIZE),
    [allOrders, ordersPage]
  );

  const getStatusPill = (s) => {
    const str = (s || '').toLowerCase();
    if (str.includes('chuẩn bị') || str.includes('cooking') || str.includes('đang')) return 'cooking';
    if (str.includes('hủy') || str.includes('cancelled') || str.includes('cancel')) return 'cancelled';
    if (str.includes('xong') || str.includes('done') || str.includes('hoàn thành') || str.includes('completed')) return 'done';
    return 'pending';
  };

  return (
    <div className="manager-page-grid">
      <div className="manager-page-header">
        <h1>Tổng quan hệ thống</h1>
        <p>Bức tranh kinh doanh hôm nay, cập nhật theo ca trực.</p>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: '#fef3c7', color: '#92400e', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="manager-stats-grid">
        {loading && !stats.length
          ? [0, 1, 2].map((i) => (
              <article key={i} className="manager-card stat-card" style={{ opacity: 0.5 }}>
                <p style={{ height: 16, background: '#e5e7eb', borderRadius: 4, width: '60%' }} />
                <h3 style={{ height: 28, background: '#e5e7eb', borderRadius: 4, marginTop: 8, width: '80%' }} />
              </article>
            ))
          : stats.map((card) => (
              <article key={card.title} className="manager-card stat-card">
                <p>{card.title}</p>
                <h3>{card.value}</h3>
                <div className={`manager-badge ${card.trend}`}>
                  {card.trend === 'up' && <ArrowUpRight size={14} />}
                  {card.trend === 'down' && <ArrowDownRight size={14} />}
                  <span>{card.delta}</span>
                </div>
              </article>
            ))}
      </div>

      <div className="manager-two-col">
        {/* Revenue chart placeholder */}
        <article className="manager-card">
          <div className="manager-card-head">
            <h2>Doanh thu 7 ngày</h2>
            <span>Biểu đồ mô phỏng</span>
          </div>
          <div className="manager-chart">
            {[72, 64, 81, 93, 58, 100, 76].map((v, idx) => (
              <div key={`bar-${idx}`} className="manager-chart-col">
                <div style={{ height: `${v}%` }} className="manager-chart-bar" />
                <small>{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][idx]}</small>
              </div>
            ))}
          </div>
        </article>

        {/* Orders with pagination */}
        <article className="manager-card">
          <div className="manager-card-head">
            <h2>Đơn mới nhất</h2>
            <a href="/manager/orders">Xem tất cả</a>
          </div>
          <div className="manager-list">
            {loading && allOrders.length === 0
              ? [0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="manager-list-item" style={{ opacity: 0.5 }}>
                    <div style={{ width: 36, height: 36, background: '#e5e7eb', borderRadius: 6 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 14, background: '#e5e7eb', borderRadius: 4, width: '70%', marginBottom: 6 }} />
                      <div style={{ height: 11, background: '#e5e7eb', borderRadius: 4, width: '50%' }} />
                    </div>
                  </div>
                ))
              : pagedOrders.length === 0
                ? <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>Không có đơn hàng.</div>
                : pagedOrders.map((order, idx) => (
                    <div key={`${order.orderId ?? order.id ?? idx}`} className="manager-list-item">
                      <div className="manager-table-code">
                        {order.tableName ?? order.tableNumber ?? order.tableCode ?? order.table ?? '#'}
                      </div>
                      <div>
                        <strong>{order.items?.[0]?.name ?? order.itemName ?? order.item ?? order.productName ?? '—'}</strong>
                        <p>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                            : '--:--'}
                          {' — '}
                          {order.orderType ?? order.type ?? 'Tại bàn'}
                        </p>
                      </div>
                      <span className={`manager-pill ${getStatusPill(order.status ?? order.orderStatus)}`}>
                        {order.status ?? order.orderStatus ?? 'Chờ xử lý'}
                      </span>
                    </div>
                  ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="manager-orders-pagination">
              <span className="manager-orders-pagination-info">
                {allOrders.length > 0
                  ? `${(ordersPage - 1) * PAGE_SIZE + 1}–${Math.min(ordersPage * PAGE_SIZE, allOrders.length)} / ${allOrders.length}`
                  : ''}
              </span>
              <div className="manager-orders-pagination-controls">
                <button
                  type="button"
                  className="manager-orders-page-btn"
                  disabled={ordersPage <= 1}
                  onClick={() => setOrdersPage((p) => p - 1)}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - ordersPage) <= 2)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && arr[i - 1] !== p - 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`e-${i}`} className="manager-orders-ellipsis">…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        className={`manager-orders-page-btn${ordersPage === p ? ' active' : ''}`}
                        onClick={() => setOrdersPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  type="button"
                  className="manager-orders-page-btn"
                  disabled={ordersPage >= totalPages}
                  onClick={() => setOrdersPage((p) => p + 1)}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </article>
      </div>

      {/* Staff table */}
      <article className="manager-card">
        <div className="manager-card-head">
          <h2>Trạng thái nhân viên</h2>
          <span>Cập nhật theo ca</span>
        </div>
        <div className="manager-table-wrap">
          <table className="manager-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Vai trò</th>
                <th>Giờ vào</th>
                <th>Trạng thái</th>
                <th>Hiệu suất</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>
                  {loading ? 'Đang tải...' : 'Chưa có dữ liệu nhân viên'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
};

export default ManagerDashboardPage;
