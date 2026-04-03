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
import { fetchAdminDashboardAll, ORDER_STRUCTURE_LABELS } from '../../api/adminDashboardApi';
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

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [bundle, setBundle] = useState(null);
  const [period, setPeriod] = useState(currentPeriod);
  const [revenueChartMonths, setRevenueChartMonths] = useState(6);
  const [orderPeriod, setOrderPeriod] = useState({ month: currentPeriod().month, year: currentPeriod().year });
  const [summaryOffset, setSummaryOffset] = useState(0);
  const summaryTotal = 4; // doanh thu, chi phí, hợp đồng, khách hàng

  const handleSummaryNext = () => {
    setSummaryOffset((o) => (o + 1) % summaryTotal);
  };
  const handleSummaryPrev = () => {
    setSummaryOffset((o) => (o - 1 + summaryTotal) % summaryTotal);
  };

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
        <button
          type="button"
          className="summary-nav summary-nav--prev"
          onClick={handleSummaryPrev}
          aria-label="Trước"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <div className="summary-viewport">
          <div
            className="summary-track"
            style={{
              transform: `translateX(calc(-${summaryOffset} * ((100cqi - 2 * var(--summary-gap)) / 3.08 + var(--summary-gap))))`,
            }}
          >
            {/* 8 cards: 4 + 4 lặp — mỗi bước next dịch 1 thẻ + gap (đồng bộ CSS .summary-card) */}
            {[...Array(8)].map((_, i) => {
              const idx = i % summaryTotal;
              const cards = [
                {
                  label: 'Tổng doanh thu',
                  value: summary?.totalRevenueDisplay ?? '—',
                  spark: summary && (
                    <Line key={`sp-rev-${i}`} data={sparkData(summary.revenueSparkline)} options={sparkOptions} />
                  ),
                },
                {
                  label: 'Chi phí nhập kho',
                  value: summary?.warehouseCostsDisplay ?? '—',
                  spark: summary && (
                    <Line key={`sp-cost-${i}`} data={sparkData(summary.costsSparkline)} options={sparkOptions} />
                  ),
                },
                {
                  label: 'Hợp đồng mới',
                  value: formatSummaryCount(summary?.newContracts),
                  spark: summary && (
                    <Line key={`sp-ctr-${i}`} data={sparkData(summary.contractsSparkline)} options={sparkOptions} />
                  ),
                },
                {
                  label: 'Khách hàng mới',
                  value: formatSummaryCount(summary?.newCustomers),
                  spark: summary && (
                    <Line key={`sp-cus-${i}`} data={sparkData(summary.customersSparkline)} options={sparkOptions} />
                  ),
                },
              ];
              const c = cards[idx];
              return (
                <div key={i} className="summary-card">
                  <span className="stat-card-title">{c.label}</span>
                  <p className="stat-card-value">{c.value}</p>
                  <div className="stat-card-sparkline">{c.spark}</div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          className="summary-nav summary-nav--next"
          onClick={handleSummaryNext}
          aria-label="Sau"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
          </svg>
        </button>
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
    </div>
  );
};

export default AdminDashboard;
