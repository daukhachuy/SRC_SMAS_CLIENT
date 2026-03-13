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
  { title: 'Tổng doanh thu', value: '1.2 tỷ VND', sparkline: [10, 15, 8, 25, 18, 22] },
  { title: 'Chi phí nhập kho', value: '450tr VND', sparkline: [20, 10, 25, 15, 30, 20] },
  { title: 'Hợp đồng mới', value: '12', sparkline: [5, 20, 15, 25, 10, 30] },
  { title: 'Khách hàng mới', value: '156', sparkline: [12, 18, 14, 28, 20, 25] }
];

const revenueCostLabels = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'];
const revenueData = [800, 950, 700, 1200, 1100, 1400];
const costData = [400, 450, 380, 500, 480, 600];

const orderStructureData = {
  labels: ['Tại chỗ', 'Mang về', 'Giao hàng', 'Sự kiện'],
  values: [45, 20, 25, 10]
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
      position: 'top',
      align: 'end'
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f3f4f6' }
    },
    x: {
      grid: { display: false }
    }
  }
};

const Sparkline = ({ data }) => {
  const sparklineData = useMemo(() => ({
    labels: new Array(data.length).fill(''),
    datasets: [{
      data: data,
      borderColor: '#FF6C1F',
      borderWidth: 2,
      pointRadius: 0,
      fill: false,
      tension: 0.4
    }]
  }), [data]);

  return (
    <div className="stat-card-sparkline">
      <Chart
        type="line"
        data={sparklineData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } }
        }}
      />
    </div>
  );
};

const AdminDashboard = () => {
  const revenueCostChartData = useMemo(
    () => ({
      labels: revenueCostLabels,
      datasets: [
        {
          label: 'Doanh thu',
          data: revenueData,
          backgroundColor: '#FF6C1F',
          borderRadius: 6,
          order: 2
        },
        {
          label: 'Chi phí',
          data: costData,
          type: 'line',
          borderColor: '#2D3748',
          backgroundColor: 'rgba(45, 55, 72, 0.1)',
          fill: false,
          tension: 0.4,
          order: 1
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
          backgroundColor: ['#FF6C1F', '#FF8F50', '#FFB281', '#FFD4B3'],
          borderWidth: 2,
          hoverOffset: 4
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
      <header className="dashboard-header">
        <div>
          <h1>Tổng quan hệ thống</h1>
          <p>Chào mừng quay trở lại, đây là dữ liệu mới nhất hôm nay.</p>
        </div>
        <button type="button" className="admin-export-btn" onClick={handleExportReport}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          Xuất báo cáo
        </button>
      </header>

      <section className="stats-grid">
        {statCards.map((card) => (
          <div key={card.title} className="stat-card custom-shadow">
            <div className="flex flex-col">
              <span className="stat-card-title">{card.title}</span>
              <h3 className="stat-card-value">{card.value}</h3>
              <Sparkline data={card.sparkline} />
            </div>
          </div>
        ))}
      </section>

      <section className="charts-row">
        <div className="chart-card custom-shadow">
          <div className="chart-card-header">
            <h3>Biểu đồ Doanh thu &amp; Chi phí</h3>
            <span className="chart-card-sub">Dữ liệu 6 tháng gần nhất</span>
          </div>
          <div className="chart-wrapper">
            <Chart type="bar" data={revenueCostChartData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card custom-shadow">
          <div className="chart-card-header">
            <h3>Cơ cấu đơn hàng</h3>
            <select className="chart-select">
              <option>Tháng này</option>
              <option>Tháng trước</option>
            </select>
          </div>
          <div className="donut-wrapper">
            <Chart
              type="doughnut"
              data={orderStructureChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                cutout: '70%'
              }}
            />
          </div>
        </div>
      </section>

      <section className="table-card custom-shadow">
        <div className="table-card-header">
          <h3>Giao dịch nhập kho gần đây</h3>
          <a href="/admin/inventory">Xem tất cả</a>
        </div>
        <div className="table-wrapper">
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
                  <td className="font-medium">{row.code}</td>
                  <td>{row.supplier}</td>
                  <td className="amount">{row.amount}</td>
                  <td>
                    <span className={`status-badge status-${row.statusClass}`}>
                      {row.status}
                    </span>
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
