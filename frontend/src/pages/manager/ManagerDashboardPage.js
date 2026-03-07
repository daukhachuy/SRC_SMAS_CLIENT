import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

const stats = [
  { title: 'Số đơn hôm nay', value: '128', delta: '+12%', trend: 'up' },
  { title: 'Doanh thu ngày', value: '45.200.000đ', delta: '-5%', trend: 'down' },
  { title: 'Bàn còn trống', value: '12 / 40', delta: 'Đúng tiến độ', trend: 'flat' }
];

const recentOrders = [
  { table: 'B12', item: 'Gỏi cuốn tôm thịt', time: '08:45', type: 'Mang về', status: 'Đang chuẩn bị' },
  { table: 'B05', item: 'Combo lẩu Thái', time: '08:30', type: 'Tại bàn', status: 'Chờ xử lý' },
  { table: 'B21', item: 'Phở bò đặc biệt', time: '08:22', type: 'Tại bàn', status: 'Đang chuẩn bị' },
  { table: 'B08', item: 'Cà phê sữa đá x2', time: '08:15', type: 'Mang về', status: 'Chờ xử lý' }
];

const staffRows = [
  { name: 'Lê Thị Mai', role: 'Đầu bếp chính', shift: '06:00', status: 'Đang làm việc', perf: 90 },
  { name: 'Nguyễn Văn An', role: 'Phục vụ', shift: '08:00', status: 'Đang làm việc', perf: 75 },
  { name: 'Trần Thị Hoa', role: 'Thu ngân', shift: '--:--', status: 'Nghỉ phép', perf: 0 }
];

const ManagerDashboardPage = () => {
  return (
    <div className="manager-page-grid">
      <div className="manager-page-header">
        <h1>Tổng quan hệ thống</h1>
        <p>Bức tranh kinh doanh hôm nay, cập nhật theo ca trực.</p>
      </div>

      <div className="manager-stats-grid">
        {stats.map((card) => (
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

        <article className="manager-card">
          <div className="manager-card-head">
            <h2>Đơn mới nhất</h2>
            <a href="/manager/orders">Xem tất cả</a>
          </div>
          <div className="manager-list">
            {recentOrders.map((order) => (
              <div key={`${order.table}-${order.time}`} className="manager-list-item">
                <div className="manager-table-code">{order.table}</div>
                <div>
                  <strong>{order.item}</strong>
                  <p>{order.time} - {order.type}</p>
                </div>
                <span className={`manager-pill ${order.status.includes('Cho') ? 'pending' : 'cooking'}`}>
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        </article>
      </div>

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
              {staffRows.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.role}</td>
                  <td>{row.shift}</td>
                  <td>{row.status}</td>
                  <td>
                    <div className="manager-progress">
                      <span style={{ width: `${row.perf}%` }} />
                    </div>
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

export default ManagerDashboardPage;
