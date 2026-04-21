import React, { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import { orderAPI, staffAPI } from '../../api/managerApi';
import { ArrowUpRight, ArrowDownRight, AlertCircle, RefreshCw } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

/**
 * Hàm format tiền tệ VNĐ
 */
const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Hàm format ngày từ ISO string sang dd/mm/yyyy
 */
const formatDate = (isoString) => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Hàm format giờ từ ISO string sang HH:mm
 */
const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Lấy màu nền theo position
 */
const getPositionBg = (position) => {
  if (!position) return '#f3f4f6';
  const pos = position.toLowerCase();
  if (pos.includes('manager') || pos.includes('quản lý')) return '#dbeafe';
  if (pos.includes('chef') || pos.includes('bếp') || pos.includes('kitchen')) return '#fed7aa';
  if (pos.includes('cash') || pos.includes('thu ngân')) return '#d1fae5';
  if (pos.includes('waiter') || pos.includes('phục vụ')) return '#e0e7ff';
  return '#f3f4f6';
};

/**
 * Lấy màu chữ theo position
 */
const getPositionColor = (position) => {
  if (!position) return '#6b7280';
  const pos = position.toLowerCase();
  if (pos.includes('manager') || pos.includes('quản lý')) return '#1d4ed8';
  if (pos.includes('chef') || pos.includes('bếp') || pos.includes('kitchen')) return '#c2410c';
  if (pos.includes('cash') || pos.includes('thu ngân')) return '#047857';
  if (pos.includes('waiter') || pos.includes('phục vụ')) return '#4338ca';
  return '#6b7280';
};

const ManagerDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [stats, setStats] = useState([]);
  const [error, setError] = useState('');

  // State cho API doanh thu 7 ngày
  const [revenueData, setRevenueData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState('');

  // State cho API đơn mới nhất
  const [newestOrders, setNewestOrders] = useState([]);
  const [newestOrdersLoading, setNewestOrdersLoading] = useState(true);
  const [newestOrdersError, setNewestOrdersError] = useState('');

  // Gọi API đếm số bàn còn trống (khai báo trước để dùng trong fetchAll)
  const [emptyTableCount, setEmptyTableCount] = useState(null);
  const [emptyTableLoading, setEmptyTableLoading] = useState(true);

  // State cho danh sách nhân viên hôm nay
  const [staffList, setStaffList] = useState([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState('');

  useEffect(() => {
    const fetchEmptyTables = async () => {
      setEmptyTableLoading(true);
      try {
        const res = await api.get('/table/empty');
        const raw = res?.data ?? res;
        let total = 0;
        if (raw?.total != null) {
          total = Number(raw.total) || 0;
        } else {
          const timeSlots = Array.isArray(raw?.timeSlots) ? raw.timeSlots : [];
          total = timeSlots.reduce((sum, slot) => sum + (Number(slot?.total) || 0), 0);
        }
        setEmptyTableCount(Number.isFinite(total) && total >= 0 ? total : 0);
      } catch (err) {
        setEmptyTableCount(0);
      } finally {
        setEmptyTableLoading(false);
      }
    };
    fetchEmptyTables();
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const [ordersRes, revenueRes] = await Promise.allSettled([
          orderAPI.getToday(),
          orderAPI.getRevenueSevenDays(),
        ]);

        // Lấy tổng đơn hôm nay từ /order/orders-today → { total: number }
        let todayOrders = 0;
        if (ordersRes.status === 'fulfilled') {
          const raw = ordersRes.value?.data ?? ordersRes.value;
          todayOrders = Number(raw?.total ?? raw?.totalOrdersToday ?? raw?.todayOrders ?? 0);
        }

        // Lấy doanh thu ngày từ /order/revenue-previous-seven-days
        let todayRevenue = 0;
        if (revenueRes.status === 'fulfilled') {
          const raw = revenueRes.value?.data ?? revenueRes.value;
          const days = raw?.days ?? [];
          const todayEntry = days.find(d => d.isToday);
          todayRevenue = todayEntry ? (Number(todayEntry.revenue) || 0) : (Number(raw?.revenueToday ?? raw?.todayRevenue) || 0);
        }

        setStats([
          {
            title: 'Tổng đơn hôm nay',
            value: todayOrders > 0 ? todayOrders.toLocaleString('vi-VN') : '0 đơn',
            delta: '—',
            trend: 'flat',
          },
          {
            title: 'Doanh thu ngày',
            value: formatCurrency(todayRevenue),
            delta: '—',
            trend: 'flat',
          },
          {
            title: 'Bàn còn trống',
            value: emptyTableLoading ? '…' : (emptyTableCount != null ? emptyTableCount.toString() : '—'),
            delta: '—',
            trend: 'flat',
          },
        ]);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError('Không tải được dữ liệu dashboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [emptyTableCount, emptyTableLoading]);

  // Gọi API doanh thu 7 ngày
  useEffect(() => {
    const fetchRevenue = async () => {
      setRevenueLoading(true);
      setRevenueError('');
      try {
        const response = await orderAPI.getRevenueSevenDays();
        const raw = response?.data ?? response;
        setRevenueData(raw.days ?? []);
        setTotalRevenue(raw.totalRevenue ?? 0);
      } catch (err) {
        console.warn('Revenue API error:', err.message);
        setRevenueError('Không tải được dữ liệu doanh thu.');
      } finally {
        setRevenueLoading(false);
      }
    };

    fetchRevenue();
  }, []);

  // Gọi API đơn mới nhất (4 đơn)
  useEffect(() => {
    const fetchNewestOrders = async () => {
      setNewestOrdersLoading(true);
      setNewestOrdersError('');
      try {
        const response = await orderAPI.getFourNewest();
        setNewestOrders(response.data || []);
      } catch (err) {
        console.warn('Newest orders API error:', err.message);
        setNewestOrdersError('Không tải được đơn mới nhất.');
        setNewestOrders([]);
      } finally {
        setNewestOrdersLoading(false);
      }
    };

    fetchNewestOrders();
  }, []);

  // Gọi API lấy danh sách nhân viên hôm nay
  useEffect(() => {
    const fetchStaffToday = async () => {
      setStaffLoading(true);
      setStaffError('');
      try {
        const response = await staffAPI.getStaffsToday();
        const raw = response?.data ?? response;
        // API trả về mảng trực tiếp hoặc { data: [...] }
        const list = Array.isArray(raw) ? raw : (raw?.data ?? raw ?? []);
        setStaffList(list);
      } catch (err) {
        console.warn('Staff today API error:', err.message);
        setStaffError('Không tải được dữ liệu nhân viên.');
        setStaffList([]);
      } finally {
        setStaffLoading(false);
      }
    };

    fetchStaffToday();
  }, []);

  // Cập nhật stats khi emptyTableCount thay đổi
  useEffect(() => {
    setStats((prevStats) => {
      if (!prevStats.length) return prevStats;
      return prevStats.map((stat) =>
        stat.title === 'Bàn còn trống'
          ? { ...stat, value: emptyTableLoading ? '…' : (emptyTableCount != null ? emptyTableCount.toString() : '—') }
          : stat
      );
    });
  }, [emptyTableCount, emptyTableLoading]);

  const getStatusPill = (s) => {
    const str = (s || '').toLowerCase();
    if (str.includes('chuẩn bị') || str.includes('cooking') || str.includes('đang')) return 'cooking';
    if (str.includes('hủy') || str.includes('cancelled')) return 'cancelled';
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
        {/* Revenue chart + table */}
        <article className="manager-card">
          <div className="manager-card-head">
            <h2>Doanh thu 7 ngày</h2>
            {totalRevenue > 0 && (
              <span style={{ color: '#059669', fontWeight: 600 }}>
                Tổng: {formatCurrency(totalRevenue)}
              </span>
            )}
          </div>

          {/* Loading state */}
          {revenueLoading && (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af' }}>
              <RefreshCw size={20} className="spin" /> Đang tải dữ liệu...
            </div>
          )}

          {/* Error state */}
          {revenueError && (
            <div style={{ padding: '0.75rem', background: '#fee2e2', color: '#dc2626', borderRadius: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
              <AlertCircle size={16} style={{ display: 'inline', marginRight: 6 }} />
              {revenueError}
            </div>
          )}

          {/* Bảng doanh thu */}
          {!revenueLoading && !revenueError && (
            <>
              <div className="manager-chart" style={{ height: 320, minHeight: 320 }}>
                <ResponsiveContainer width="100%" height="100%" debounce={500}>
                  <BarChart
                    data={revenueData}
                    margin={{ top: 20, right: 20, left: 10, bottom: 0 }}
                    barSize={40}
                  >
                    <XAxis
                      dataKey="dayLabel"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 500 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#9ca3af' }}
                      tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val}
                      domain={[0, 'dataMax']}
                      width={45}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          const d = payload[0].payload;
                          return `${d.dayLabel} — ${formatDate(d.date)}`;
                        }
                        return label;
                      }}
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: 13,
                      }}
                      cursor={{ fill: '#f3f4f6' }}
                    />
                    <ReferenceLine y={0} stroke="#e5e7eb" />
                    <Bar dataKey="revenue" radius={[8, 8, 0, 0]} animationDuration={800}>
                      {revenueData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={Number(entry.revenue) > 0 ? '#f97316' : '#e5e7eb'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

            </>
          )}
        </article>

        {/* Đơn mới nhất */}
        <article className="manager-card">
          <div className="manager-card-head">
            <h2>Đơn mới nhất</h2>
            <a href="/manager/orders">Xem tất cả</a>
          </div>
          <div className="manager-list">
            {newestOrdersLoading
              ? [0, 1, 2].map((i) => (
                  <div key={i} className="manager-list-item" style={{ opacity: 0.5 }}>
                    <div style={{ width: 36, height: 36, background: '#e5e7eb', borderRadius: 6 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 14, background: '#e5e7eb', borderRadius: 4, width: '70%', marginBottom: 6 }} />
                      <div style={{ height: 11, background: '#e5e7eb', borderRadius: 4, width: '50%' }} />
                    </div>
                  </div>
                ))
              : newestOrdersError
                ? <div style={{ padding: '1rem', textAlign: 'center', color: '#dc2626', fontSize: '0.875rem' }}>{newestOrdersError}</div>
                : newestOrders.length === 0
                  ? <div style={{ padding: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>Không có đơn hàng.</div>
                  : newestOrders.slice(0, 3).map((order, idx) => (
                      <div key={`${order.orderId ?? order.id ?? idx}`} className="manager-list-item">
                        <div className="manager-table-code">
                          {order.tableName ?? order.tableNumber ?? order.tableCode ?? order.table ?? '#'}
                        </div>
                        <div>
                          {order.orderCode && <span style={{ fontSize: '0.75rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{order.orderCode}</span>}
                          <strong>{order.items?.[0]?.name ?? order.itemName ?? order.item ?? order.productName ?? '—'}</strong>
                          <p>
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                              : '--:--'}
                            {' — '}
                            {order.orderType ?? order.type ?? 'Tại bàn'}
                          </p>
                        </div>
                        <div style={{ textAlign: 'center', fontWeight: 600, color: '#1f2937' }}>
                          {order.totalAmount != null
                            ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.totalAmount)
                            : order.total != null
                              ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)
                              : '0 đ'}
                        </div>
                        <span className={`manager-pill ${getStatusPill(order.status ?? order.orderStatus)}`}>
                          {order.status ?? order.orderStatus ?? 'Chờ xử lý'}
                        </span>
                      </div>
                    ))}
          </div>
        </article>
      </div>
      {/* Transaction history */}
      <article className="manager-card">
        <div className="manager-card-head">
          <h2>Trạng thái nhân viên</h2>
          <span>{staffList.length > 0 ? `${staffList.length} nhân viên` : ''}</span>
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
                <th>Nhân viên</th>
                <th>Vai trò</th>
                <th>Giờ vào</th>
                <th>Ca Làm</th>
                <th>Giờ Ra</th>
              </tr>
            </thead>
            <tbody>
              {staffLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>
                    Đang tải...
                  </td>
                </tr>
              ) : staffError ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#dc2626', padding: '1rem' }}>
                    {staffError}
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#9ca3af', padding: '1rem' }}>
                    Chưa có dữ liệu nhân viên
                  </td>
                </tr>
              ) : (
                staffList.map((staff, idx) => (
                  <tr key={staff.userId ?? staff.id ?? staff.staffId ?? idx}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#f97316',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                          flexShrink: 0
                        }}>
                          {(staff.fullname || staff.name || 'NV').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>
                          {staff.fullname || staff.name || '—'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        background: getPositionBg(staff.position),
                        color: getPositionColor(staff.position)
                      }}>
                        {staff.position || '—'}
                      </span>
                    </td>
                    <td>{formatTime(staff.checkInTime) || '—'}</td>
                    <td>{staff.shiftName || '—'}</td>
                    <td>{formatTime(staff.checkOutTime) || '—'}</td>
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
