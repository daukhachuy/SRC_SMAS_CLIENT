import React, { useEffect, useState, useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { myOrderAPI } from '../../api/myOrderApi';
import { fetchTransactionHistory } from '../../api/adminDashboardApi';

const PAGE_SIZE = 10;
const EMPTY_TX_FILTERS = {
  orderCode: '',
  paymentMethod: '',
  paymentStatus: '',
  fromDate: '',
  toDate: '',
};

const ManagerDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [stats, setStats] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsTotalItems, setTransactionsTotalItems] = useState(0);
  const [transactionsTotalPages, setTransactionsTotalPages] = useState(1);
  const [txFilterForm, setTxFilterForm] = useState(EMPTY_TX_FILTERS);
  const [txFilters, setTxFilters] = useState(EMPTY_TX_FILTERS);
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

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoadingTransactions(true);
      try {
        // Lấy nhiều bản ghi để FE tự phân trang ổn định (phòng trường hợp BE bỏ qua page/pageSize).
        const toIsoDate = (value, endOfDay = false) => {
          if (!value) return undefined;
          const d = new Date(value);
          if (Number.isNaN(d.getTime())) return undefined;
          if (endOfDay) d.setHours(23, 59, 59, 999);
          else d.setHours(0, 0, 0, 0);
          return d.toISOString();
        };

        const res = await fetchTransactionHistory({
          page: 1,
          pageSize: 1000,
          orderCode: txFilters.orderCode || undefined,
          paymentMethod: txFilters.paymentMethod || undefined,
          paymentStatus: txFilters.paymentStatus || undefined,
          fromDate: toIsoDate(txFilters.fromDate, false),
          toDate: toIsoDate(txFilters.toDate, true),
        });
        const rows = Array.isArray(res?.data) ? res.data : [];
        setTransactions(rows);
        setTransactionsTotalItems(rows.length);
        setTransactionsTotalPages(Math.max(1, Math.ceil(rows.length / PAGE_SIZE)));
      } catch (err) {
        console.error('Transaction history error:', err);
        setTransactions([]);
        setTransactionsTotalItems(0);
        setTransactionsTotalPages(1);
      } finally {
        setLoadingTransactions(false);
      }
    };

    fetchTransactions();
  }, [txFilters]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(allOrders.length / PAGE_SIZE)), [allOrders.length]);
  const pagedOrders = useMemo(
    () => allOrders.slice((ordersPage - 1) * PAGE_SIZE, ordersPage * PAGE_SIZE),
    [allOrders, ordersPage]
  );
  const visibleTransactions = useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    const start = (transactionsPage - 1) * PAGE_SIZE;
    return transactions.slice(start, start + PAGE_SIZE);
  }, [transactions, transactionsPage]);

  const handleApplyTxFilters = (e) => {
    e.preventDefault();
    setTransactionsPage(1);
    setTxFilters({
      orderCode: String(txFilterForm.orderCode || '').trim(),
      paymentMethod: txFilterForm.paymentMethod || '',
      paymentStatus: txFilterForm.paymentStatus || '',
      fromDate: txFilterForm.fromDate || '',
      toDate: txFilterForm.toDate || '',
    });
  };

  const handleResetTxFilters = () => {
    setTransactionsPage(1);
    setTxFilterForm(EMPTY_TX_FILTERS);
    setTxFilters(EMPTY_TX_FILTERS);
  };

  const getStatusPill = (s) => {
    const str = (s || '').toLowerCase();
    if (str.includes('chuẩn bị') || str.includes('cooking') || str.includes('đang')) return 'cooking';
    if (str.includes('hủy') || str.includes('cancelled') || str.includes('cancel')) return 'cancelled';
    if (str.includes('xong') || str.includes('done') || str.includes('hoàn thành') || str.includes('completed')) return 'done';
    return 'pending';
  };

  const getPaymentStatusPill = (s) => {
    const str = String(s || '').toLowerCase();
    if (str.includes('paid') || str.includes('thành công') || str.includes('success')) return 'done';
    if (str.includes('pending') || str.includes('đang')) return 'pending';
    if (str.includes('failed') || str.includes('cancel') || str.includes('hủy')) return 'cancelled';
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

      {/* Transaction history */}
      <article className="manager-card">
        <div className="manager-card-head">
          <h2>Lịch sử giao dịch</h2>
        </div>
        <form onSubmit={handleApplyTxFilters} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto auto', gap: 8, marginBottom: 10 }}>
          <input
            type="text"
            placeholder="Tìm theo mã đơn..."
            value={txFilterForm.orderCode}
            onChange={(e) => setTxFilterForm((prev) => ({ ...prev, orderCode: e.target.value }))}
            style={{ height: 34, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 10px' }}
          />
          <select
            value={txFilterForm.paymentMethod}
            onChange={(e) => setTxFilterForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
            style={{ height: 34, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 8px' }}
          >
            <option value="">Phương thức</option>
            <option value="Cash">Tiền mặt</option>
            <option value="PayOS">PayOS</option>
          </select>
          <select
            value={txFilterForm.paymentStatus}
            onChange={(e) => setTxFilterForm((prev) => ({ ...prev, paymentStatus: e.target.value }))}
            style={{ height: 34, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 8px' }}
          >
            <option value="">Trạng thái</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
          </select>
          <input
            type="date"
            value={txFilterForm.fromDate}
            onChange={(e) => setTxFilterForm((prev) => ({ ...prev, fromDate: e.target.value }))}
            style={{ height: 34, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 10px' }}
          />
          <input
            type="date"
            value={txFilterForm.toDate}
            onChange={(e) => setTxFilterForm((prev) => ({ ...prev, toDate: e.target.value }))}
            style={{ height: 34, border: '1px solid #e5e7eb', borderRadius: 8, padding: '0 10px' }}
          />
          <button type="submit" className="manager-orders-page-btn" style={{ minWidth: 82 }}>
            Tìm kiếm
          </button>
          <button type="button" className="manager-orders-page-btn" onClick={handleResetTxFilters} style={{ minWidth: 74 }}>
            Xóa lọc
          </button>
        </form>
        <div className="manager-table-wrap">
          <table className="manager-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>Số tiền</th>
                <th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {loadingTransactions && visibleTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>
                    Đang tải lịch sử giao dịch...
                  </td>
                </tr>
              ) : visibleTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>
                    Chưa có dữ liệu giao dịch
                  </td>
                </tr>
              ) : (
                visibleTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.orderCode || '—'}</td>
                    <td>{tx.customerName || 'Khách lẻ'}</td>
                    <td>{tx.paymentMethodDisplay || tx.paymentMethod || '—'}</td>
                    <td>
                      <span className={`manager-pill ${getPaymentStatusPill(tx.paymentStatus || tx.statusLabel)}`}>
                        {tx.statusLabel || tx.paymentStatus || '—'}
                      </span>
                    </td>
                    <td>{tx.amountDisplay || '—'}</td>
                    <td>
                      {tx.paidAt
                        ? new Date(tx.paidAt).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {transactionsTotalPages > 1 && (
          <div className="manager-orders-pagination" style={{ marginTop: '0.75rem' }}>
            <span className="manager-orders-pagination-info">
              {transactionsTotalItems > 0
                ? `${(transactionsPage - 1) * PAGE_SIZE + 1}–${Math.min(transactionsPage * PAGE_SIZE, transactionsTotalItems)} / ${transactionsTotalItems}`
                : ''}
            </span>
            <div className="manager-orders-pagination-controls">
              <button
                type="button"
                className="manager-orders-page-btn"
                disabled={transactionsPage <= 1}
                onClick={() => setTransactionsPage((p) => p - 1)}
              >
                ‹
              </button>
              {Array.from({ length: transactionsTotalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === transactionsTotalPages || Math.abs(p - transactionsPage) <= 2)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && arr[i - 1] !== p - 1) acc.push('…');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '…' ? (
                    <span key={`tx-e-${i}`} className="manager-orders-ellipsis">…</span>
                  ) : (
                    <button
                      key={`tx-${p}`}
                      type="button"
                      className={`manager-orders-page-btn${transactionsPage === p ? ' active' : ''}`}
                      onClick={() => setTransactionsPage(p)}
                    >
                      {p}
                    </button>
                  )
                )}
              <button
                type="button"
                className="manager-orders-page-btn"
                disabled={transactionsPage >= transactionsTotalPages}
                onClick={() => setTransactionsPage((p) => p + 1)}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </article>
    </div>
  );
};

export default ManagerDashboardPage;
