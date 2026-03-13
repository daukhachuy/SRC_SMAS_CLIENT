import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  BarController,
  LineController,
  DoughnutController,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import '../../styles/AdminDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  BarController,
  LineController,
  DoughnutController,
  Tooltip,
  Legend,
  Filler
);

const statCards = [
  { title: 'Tổng doanh thu', value: '1.2 tỷ VND' },
  { title: 'Chi phí nhập kho', value: '450tr VND' },
  { title: 'Hợp đồng mới', value: '12' },
  { title: 'Khách hàng mới', value: '156' }
];

const revenueCostLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
const revenueData = [800, 950, 1100, 1050, 1200, 1150];
const costData = [400, 480, 520, 500, 580, 550];

const orderStructureData = {
  labels: ['Tại chỗ', 'Mang về', 'Giao hàng', 'Sự kiện'],
  values: [45, 25, 20, 10]
};

const recentTransactions = [
  { code: '#TK-9021', supplier: 'Nông trại xanh Đà Lạt', amount: '45,000,000 ₫', status: 'Hoàn thành', statusClass: 'done' },
  { code: '#TK-8942', supplier: 'Thủy hải sản Miền Đông', amount: '32,500,000 ₫', status: 'Chờ thanh toán', statusClass: 'pending' },
  { code: '#TK-8851', supplier: 'CP Food Logistics', amount: '12,800,000 ₫', status: 'Hoàn thành', statusClass: 'done' },
  { code: '#TK-8840', supplier: 'Rượu vang Hoàng Gia', amount: '85,200,000 ₫', status: 'Đã hủy', statusClass: 'cancelled' },
  { code: '#TK-8711', supplier: 'Công ty Bao bì Hợp Nhất', amount: '5,400,000 ₫', status: 'Hoàn thành', statusClass: 'done' }
];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 1400
    }
  }
};

const AdminDashboard = () => {
  const revenueCostChartData = useMemo(
    () => ({
      labels: revenueCostLabels,
      datasets: [
        {
          type: 'bar',
          label: 'Doanh thu',
          data: revenueData,
          backgroundColor: 'rgba(249, 115, 22, 0.8)',
          borderRadius: 6
        },
        {
          type: 'line',
          label: 'Chi phí',
          data: costData,
          borderColor: '#64748b',
          backgroundColor: 'rgba(100, 116, 139, 0.1)',
          fill: true,
          tension: 0.3
        }
      ]
    }),
    []
  );

  const orderStructureChartData = useMemo(
    () => ({
      labels: orderStructureData.labels,
      datasets: [
        {
          data: orderStructureData.values,
          backgroundColor: [
            'rgba(194, 65, 12, 0.9)',
            'rgba(251, 146, 60, 0.9)',
            'rgba(253, 186, 116, 0.9)',
            'rgba(255, 237, 213, 0.95)'
          ],
          borderWidth: 0
        }
      ]
    }),
    []
  );

  const handleExportReport = () => {
    window.alert('Chức năng xuất báo cáo sẽ được tích hợp sau.');
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard-header">
        <div>
          <h1>Tổng quan hệ thống</h1>
          <p className="admin-dashboard-welcome">
            Chào mừng quay trở lại, đây là dữ liệu mới nhất hôm nay.
          </p>
        </div>
        <button type="button" className="admin-export-btn" onClick={handleExportReport}>
          Xuất báo cáo
        </button>
      </header>

      <div className="admin-stats-grid">
        {statCards.map((card) => (
          <article key={card.title} className="admin-stat-card">
            <p className="admin-stat-title">{card.title}</p>
            <h3 className="admin-stat-value">{card.value}</h3>
            <div className="admin-stat-wave" aria-hidden />
          </article>
        ))}
      </div>

      <div className="admin-charts-row">
        <article className="admin-card admin-chart-card">
          <h2>Biểu đồ Doanh thu & Chi phí</h2>
          <p className="admin-card-sub">Dữ liệu 6 tháng gần nhất</p>
          <div className="admin-chart-wrap">
            <Chart type="bar" data={revenueCostChartData} options={chartOptions} />
          </div>
        </article>
        <article className="admin-card admin-doughnut-card">
          <h2>Cơ cấu đơn hàng</h2>
          <p className="admin-card-sub">Tháng này</p>
          <div className="admin-doughnut-wrap">
            <Chart type="doughnut" data={orderStructureChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
          <div className="admin-doughnut-legend">
            {orderStructureData.labels.map((label, i) => (
              <span key={label} className="admin-legend-item">
                <span className="admin-legend-dot" style={{ background: orderStructureChartData.datasets[0].backgroundColor[i] }} />
                {label}
              </span>
            ))}
          </div>
        </article>
      </div>

      <article className="admin-card admin-table-card">
        <div className="admin-card-head">
          <h2>Giao dịch nhập kho gần đây</h2>
          <a href="/admin/inventory">Xem tất cả</a>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>MÃ GIAO DỊCH</th>
                <th>NHÀ CUNG CẤP</th>
                <th>TỔNG TIỀN</th>
                <th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((row) => (
                <tr key={row.code}>
                  <td>{row.code}</td>
                  <td>{row.supplier}</td>
                  <td>{row.amount}</td>
                  <td>
                    <span className={`admin-status admin-status-${row.statusClass}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
};

export default AdminDashboard;
