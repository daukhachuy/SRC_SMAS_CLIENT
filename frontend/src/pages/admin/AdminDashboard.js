import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart, Line, Doughnut } from 'react-chartjs-2';
import { fetchAdminDashboardAll, fetchTransactionHistory, ORDER_STRUCTURE_LABELS } from '../../api/adminDashboardApi';
import '../../styles/AdminDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

const sparkOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: { x: { display: false }, y: { display: false } },
};

const sparkData = (values) => ({
  labels: values.map(() => ''),
  datasets: [
    {
      data: values,
      borderColor: '#FF6C1F',
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      tension: 0.4,
    },
  ],
});

const DONUT_COLORS = ['#FF6C1F', '#FF8F50', '#FFB281', '#FFD4B3'];

function statusClass(key) {
  if (key === 'pending') return 'status-badge status-pending';
  if (key === 'cancelled') return 'status-badge status-cancelled';
  return 'status-badge status-done';
}

/** Số từ API summary (newContracts / newCustomers); null = chưa có dữ liệu */
function formatSummaryCount(v) {
  if (v == null) return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('vi-VN');
}

const currentPeriod = () => {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
};

const CHART_MONTH_OPTIONS = [3, 6, 12];
const EMPTY_TX_FILTERS = { fromDate: '', toDate: '', orderCode: '', paymentMethod: '', paymentStatus: '' };

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState(null);
  const [period, setPeriod] = useState(currentPeriod);
  const [revenueChartMonths, setRevenueChartMonths] = useState(6);
  const [orderPeriod, setOrderPeriod] = useState({ month: currentPeriod().month, year: currentPeriod().year });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminDashboardAll({
      ...period,
      chartMonths: revenueChartMonths,
      orderMonth: orderPeriod.month,
      orderYear: orderPeriod.year,
    }).then((d) => {
      if (!cancelled) {
        setBundle(d);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [period.month, period.year, revenueChartMonths, orderPeriod.month, orderPeriod.year]);

  // Transaction History state
  const [txFilterForm, setTxFilterForm] = useState(EMPTY_TX_FILTERS);
  const [txFilters, setTxFilters] = useState(EMPTY_TX_FILTERS);
  const [txPage, setTxPage] = useState(1);
  const [txPageSize] = useState(10);
  const [txData, setTxData] = useState({ data: [], totalItems: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
  const [txLoading, setTxLoading] = useState(false);

  const handleTxSearch = () => {
    setTxPage(1);
    setTxFilters({
      fromDate: txFilterForm.fromDate || '',
      toDate: txFilterForm.toDate || '',
      orderCode: String(txFilterForm.orderCode || '').trim(),
      paymentMethod: txFilterForm.paymentMethod || '',
      paymentStatus: txFilterForm.paymentStatus || '',
    });
  };
  const handleTxClear = () => {
    setTxFilterForm(EMPTY_TX_FILTERS);
    setTxFilters(EMPTY_TX_FILTERS);
    setTxPage(1);
  };

  useEffect(() => {
    setTxLoading(true);
    fetchTransactionHistory({
      ...txFilters,
      page: txPage,
      pageSize: txPageSize,
    })
      .then((r) => {
        const rows = Array.isArray(r?.data) ? r.data : [];
        const apiTotalItems = Number(r?.totalItems ?? rows.length);
        const apiTotalPages = Math.max(1, Number(r?.totalPages ?? 1));
        const hasNext = r?.hasNextPage ?? (r?.page < r?.totalPages);
        const hasPrev = r?.hasPreviousPage ?? (r?.page > 1);

        const serverPagedLikely = rows.length <= txPageSize && apiTotalItems > txPageSize;
        if (serverPagedLikely) {
          setTxData({
            data: rows,
            totalItems: apiTotalItems,
            totalPages: apiTotalPages,
            hasNextPage: hasNext,
            hasPreviousPage: hasPrev,
          });
          return;
        }

        const start = (txPage - 1) * txPageSize;
        const pagedRows = rows.slice(start, start + txPageSize);
        setTxData({
          data: pagedRows,
          totalItems: rows.length,
          totalPages: Math.max(1, Math.ceil(rows.length / txPageSize)),
          hasNextPage: rows.length > start + txPageSize,
          hasPreviousPage: txPage > 1,
        });
      })
      .catch(() => setTxData({ data: [], totalItems: 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false }))
      .finally(() => setTxLoading(false));
  }, [txFilters, txPage, txPageSize]);

  const summary = bundle?.summary;
  const revenue = bundle?.revenue;
  const orders = bundle?.orders;
  const txs = bundle?.txs;
  const partialErrors = bundle?.errors?.filter(Boolean) || [];

  const comboData = useMemo(() => {
    if (!revenue) return { labels: [], datasets: [] };
    return {
      labels: revenue.labels,
      datasets: [
        {
          type: 'bar',
          label: 'Doanh thu',
          data: revenue.revenues,
          backgroundColor: '#FF6C1F',
          borderRadius: 6,
          order: 2,
        },
        {
          type: 'line',
          label: 'Chi phí',
          data: revenue.costs,
          borderColor: '#2D3748',
          backgroundColor: 'rgba(45, 55, 72, 0.1)',
          fill: false,
          tension: 0.4,
          order: 1,
        },
      ],
    };
  }, [revenue]);

  const comboOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', align: 'end' },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
        x: { grid: { display: false } },
      },
    }),
    []
  );

  const donutData = useMemo(() => {
    const labels = orders?.labels?.length ? orders.labels : ORDER_STRUCTURE_LABELS;
    const vals = orders?.values?.length ? [...orders.values] : [0, 0, 0, 0];
    while (vals.length < labels.length) vals.push(0);
    const data = vals.slice(0, labels.length);
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: DONUT_COLORS.slice(0, labels.length),
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    };
  }, [orders]);

  const donutOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } },
      cutout: '70%',
    }),
    []
  );

  if (loading && !bundle) {
    return (
      <div className="admin-dashboard" style={{ padding: '2rem', textAlign: 'center' }}>
        Đang tải dữ liệu dashboard…
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {partialErrors.length > 0 && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            fontSize: '0.8125rem',
            color: '#92400e',
            background: '#fef3c7',
            borderRadius: '0.5rem',
          }}
        >
          Một số nguồn dữ liệu không tải được: {partialErrors.join(' · ')}
        </div>
      )}

      <header className="dashboard-header">
        <div>
          <h1>Tổng quan hệ thống</h1>
          <p>Chào mừng quay trở lại, đây là dữ liệu mới nhất hôm nay.</p>
        </div>
        <div className="dashboard-header-actions">
          <label className="dashboard-period-label" htmlFor="dash-month">
            <span className="dashboard-period-text">Kỳ</span>
            <select
              id="dash-month"
              className="chart-select dashboard-period-select"
              value={period.month}
              onChange={(e) => setPeriod((p) => ({ ...p, month: Number(e.target.value) }))}
              aria-label="Tháng"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
            <select
              className="chart-select dashboard-period-select"
              value={period.year}
              onChange={(e) => setPeriod((p) => ({ ...p, year: Number(e.target.value) }))}
              aria-label="Năm"
            >
              {[0, 1, 2].map((offset) => {
                const y = currentPeriod().year - offset;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>
          </label>
        <button type="button" className="admin-export-btn" onClick={() => window.print()}>
          <svg style={{ width: 16, height: 16, marginRight: 8 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Xuất báo cáo
        </button>
        </div>
      </header>

      <section className="summary-row" aria-label="Chỉ số tổng quan">
        <div className="summary-viewport">
          <div className="summary-track">
            {[
              {
                label: 'Tổng doanh thu',
                value: summary?.totalRevenueDisplay ?? '—',
                spark: summary && (
                  <Line key="sp-rev" data={sparkData(summary.revenueSparkline)} options={sparkOptions} />
                ),
              },
              {
                label: 'Hợp đồng mới',
                value: formatSummaryCount(summary?.newContracts),
                spark: summary && (
                  <Line key="sp-ctr" data={sparkData(summary.contractsSparkline)} options={sparkOptions} />
                ),
              },
              {
                label: 'Khách hàng mới',
                value: formatSummaryCount(summary?.newCustomers),
                spark: summary && (
                  <Line key="sp-cus" data={sparkData(summary.customersSparkline)} options={sparkOptions} />
                ),
              },
            ].map((c, i) => (
              <div key={i} className="summary-card">
                <span className="stat-card-title">{c.label}</span>
                <p className="stat-card-value">{c.value}</p>
                <div className="stat-card-sparkline">{c.spark}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="charts-row">
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Biểu đồ Doanh thu &amp; Chi phí</h3>
              <span className="chart-card-sub">
                Năm {period.year} · {revenueChartMonths} tháng gần nhất
              </span>
            </div>
            <select
              className="chart-select"
              aria-label="Số tháng trên biểu đồ doanh thu"
              value={revenueChartMonths}
              onChange={(e) => setRevenueChartMonths(Number(e.target.value))}
            >
              {CHART_MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m} tháng
                </option>
              ))}
            </select>
          </div>
          <div className="chart-wrapper">
            {revenue && comboData.labels.length > 0 ? (
              <Chart type="bar" data={comboData} options={comboOptions} />
            ) : (
              !loading && (
                <div className="chart-empty-hint" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                  Chưa có dữ liệu biểu đồ cho kỳ này hoặc API chưa trả về mảng tháng.
                </div>
              )
            )}
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Cơ cấu đơn hàng</h3>
              <span className="chart-card-sub">
                Tháng {orderPeriod.month}/{orderPeriod.year}
                {orders?.total != null &&
                  ` · Tổng ${Number(orders.total).toLocaleString('vi-VN')} đơn`}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <select
                className="chart-select"
                aria-label="Tháng cơ cấu đơn"
                value={orderPeriod.month}
                onChange={(e) =>
                  setOrderPeriod((p) => ({ ...p, month: Number(e.target.value) }))
                }
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
              <select
                className="chart-select"
                aria-label="Năm cơ cấu đơn"
                value={orderPeriod.year}
                onChange={(e) =>
                  setOrderPeriod((p) => ({ ...p, year: Number(e.target.value) }))
                }
              >
                {[0, 1, 2].map((offset) => {
                  const y = currentPeriod().year - offset;
                  return (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
          <div className="donut-wrapper">
            {!loading &&
            (orders?.values || []).reduce((a, b) => a + Number(b || 0), 0) === 0 ? (
              <div className="chart-empty-hint" style={{ padding: '2rem', textAlign: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                Không có đơn trong kỳ.
              </div>
            ) : (
              <Doughnut data={donutData} options={donutOptions} />
            )}
          </div>
        </div>
      </section>

      <section className="table-card">
        <div className="table-card-header">
          <h3>Giao dịch nhập kho gần đây</h3>
          <Link to="/admin/inventory">Xem tất cả</Link>
        </div>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã giao dịch</th>
                <th>Nhà cung cấp</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {(txs || []).map((row, idx) => (
                <tr key={`${row.code}-${idx}`}>
                  <td style={{ fontWeight: 600, color: '#111827' }}>{row.code}</td>
                  <td>{row.supplier || '—'}</td>
                  <td className="amount">
                    {Number(row.amount || 0).toLocaleString('vi-VN')} đ
                  </td>
                  <td>
                    <span className={statusClass(row.statusKey)}>{row.statusLabel}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Transaction History ─────────────────────────── */}
      <section className="table-card" style={{ marginTop: '2rem' }}>
        <div className="table-card-header">
          <h3>Lịch sử giao dịch thanh toán</h3>
        </div>

        {/* Filter Bar */}
        <div className="tx-filter-bar">
          <div className="tx-filter-row">
            <label className="tx-filter-label">
              <span>Từ ngày</span>
              <input
                type="date"
                className="tx-input"
                value={txFilterForm.fromDate}
                onChange={(e) => setTxFilterForm((f) => ({ ...f, fromDate: e.target.value }))}
              />
            </label>
            <label className="tx-filter-label">
              <span>Đến ngày</span>
              <input
                type="date"
                className="tx-input"
                value={txFilterForm.toDate}
                onChange={(e) => setTxFilterForm((f) => ({ ...f, toDate: e.target.value }))}
              />
            </label>
            <label className="tx-filter-label">
              <span>Mã đơn</span>
              <input
                type="text"
                className="tx-input"
                placeholder="VD: ORD-001"
                value={txFilterForm.orderCode}
                onChange={(e) => setTxFilterForm((f) => ({ ...f, orderCode: e.target.value }))}
              />
            </label>
            <label className="tx-filter-label">
              <span>Phương thức</span>
              <select
                className="tx-input"
                value={txFilterForm.paymentMethod}
                onChange={(e) => setTxFilterForm((f) => ({ ...f, paymentMethod: e.target.value }))}
              >
                <option value="">Tất cả</option>
                <option value="Cash">Tiền mặt</option>
                <option value="PayOS">PayOS</option>
              </select>
            </label>
            <label className="tx-filter-label">
              <span>Trạng thái</span>
              <select
                className="tx-input"
                value={txFilterForm.paymentStatus}
                onChange={(e) => setTxFilterForm((f) => ({ ...f, paymentStatus: e.target.value }))}
              >
                <option value="">Tất cả</option>
                <option value="Paid">Đã thanh toán</option>
                <option value="Pending">Chờ thanh toán</option>
                <option value="Failed">Thất bại</option>
                <option value="Cancelled">Đã hủy</option>
              </select>
            </label>
          </div>
          <div className="tx-filter-actions">
            <button type="button" className="tx-btn tx-btn--search" onClick={handleTxSearch}>
              Tìm kiếm
            </button>
            <button type="button" className="tx-btn tx-btn--clear" onClick={handleTxClear}>
              Xóa lọc
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          {txLoading ? (
            <div className="tx-loading">
              <div className="tx-spinner" />
              <span>Đang tải lịch sử giao dịch…</span>
            </div>
          ) : txData.data.length === 0 ? (
            <div className="tx-empty">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>Không có giao dịch nào phù hợp.</p>
            </div>
          ) : (
            <>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Số tiền</th>
                    <th>Phương thức</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {txData.data.map((row) => (
                    <tr key={row.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {row.paidAt
                          ? new Date(row.paidAt).toLocaleString('vi-VN', {
                              day: '2-digit', month: '2-digit', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td style={{ fontWeight: 600, color: '#111827' }}>{row.orderCode}</td>
                      <td>{row.customerName}</td>
                      <td className="amount" style={{ color: '#059669', fontWeight: 700 }}>
                        {row.amountDisplay}
                      </td>
                      <td>{row.paymentMethodDisplay}</td>
                      <td>
                        <span className={`tx-status-badge tx-status-${row.statusKey}`}>
                          {row.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {txData.totalPages > 1 && (
                <div className="tx-pagination">
                  <span className="tx-pagination-info">
                    Hiển thị {(txPage - 1) * txPageSize + 1}–{Math.min(txPage * txPageSize, txData.totalItems)} / {txData.totalItems.toLocaleString('vi-VN')} giao dịch
                  </span>
                  <div className="tx-pagination-controls">
                    <button
                      type="button"
                      className="tx-page-btn"
                      disabled={txPage <= 1}
                      onClick={() => setTxPage((p) => p - 1)}
                    >
                      ‹
                    </button>
                    {Array.from({ length: txData.totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === txData.totalPages || Math.abs(p - txPage) <= 2)
                      .reduce((acc, p, i, arr) => {
                        if (i > 0 && arr[i - 1] !== p - 1) acc.push('…');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, i) =>
                        p === '…' ? (
                          <span key={`ellipsis-${i}`} className="tx-page-ellipsis">…</span>
                        ) : (
                          <button
                            key={p}
                            type="button"
                            className={`tx-page-btn${txPage === p ? ' active' : ''}`}
                            onClick={() => setTxPage(p)}
                          >
                            {p}
                          </button>
                        )
                      )}
                    <button
                      type="button"
                      className="tx-page-btn"
                      disabled={txPage >= txData.totalPages}
                      onClick={() => setTxPage((p) => p + 1)}
                    >
                      ›
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
