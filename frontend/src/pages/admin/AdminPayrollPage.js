import React from 'react';

const payrollRows = [
  { emp: 'Lê Thị Mai', role: 'Bếp chính', month: '03/2026', shifts: 26, salary: '18.500.000đ', status: 'Đã duyệt' },
  { emp: 'Nguyễn Văn An', role: 'Phục vụ', month: '03/2026', shifts: 24, salary: '10.200.000đ', status: 'Đã duyệt' },
  { emp: 'Trần Thị Hoa', role: 'Thu ngân', month: '03/2026', shifts: 22, salary: '11.000.000đ', status: 'Chờ duyệt' }
];

const AdminPayrollPage = () => {
  return (
    <div className="admin-page-grid">
      <div className="admin-page-header">
        <h1>Lương và chấm công</h1>
        <p>Tổng hợp công, thưởng phạt và phiếu thanh toán theo tháng.</p>
      </div>

      <div className="admin-stats-grid compact">
        <article className="admin-card stat-card">
          <p>Quỹ lương tháng</p>
          <h3>248.000.000đ</h3>
        </article>
        <article className="admin-card stat-card">
          <p>Nhân viên đã duyệt</p>
          <h3>21 / 24</h3>
        </article>
        <article className="admin-card stat-card">
          <p>Đang chờ duyệt</p>
          <h3>3</h3>
        </article>
      </div>

      <article className="admin-card">
        <div className="admin-card-head">
          <h2>Bảng lương gần đây</h2>
          <button className="admin-secondary-btn">Xuất file</button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nhân viên</th>
                <th>Vai trò</th>
                <th>Tháng</th>
                <th>Số ca</th>
                <th>Lương</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {payrollRows.map((r) => (
                <tr key={r.emp}>
                  <td>{r.emp}</td>
                  <td>{r.role}</td>
                  <td>{r.month}</td>
                  <td>{r.shifts}</td>
                  <td>{r.salary}</td>
                  <td>
                    <span className={`admin-pill ${r.status === 'Đã duyệt' ? 'done' : 'pending'}`}>
                      {r.status}
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

export default AdminPayrollPage;
