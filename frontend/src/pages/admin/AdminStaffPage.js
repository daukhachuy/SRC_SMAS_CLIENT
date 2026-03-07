import React from 'react';

const staff = [
  { name: 'Lê Thị Mai', role: 'Bếp chính', shift: '06:00 - 14:00', phone: '0905 111 222', score: 'A' },
  { name: 'Nguyễn Văn An', role: 'Phục vụ', shift: '08:00 - 16:00', phone: '0905 333 444', score: 'B+' },
  { name: 'Trần Thị Hoa', role: 'Thu ngân', shift: 'Nghỉ', phone: '0905 555 666', score: 'A-' },
  { name: 'Phạm Gia Bảo', role: 'Bếp phụ', shift: '10:00 - 18:00', phone: '0905 777 888', score: 'B' }
];

const AdminStaffPage = () => {
  return (
    <div className="admin-page-grid">
      <div className="admin-page-header">
        <h1>Quản lý nhân viên</h1>
        <p>Danh sách nhân sự, ca trực và đánh giá hiệu quả theo tuần.</p>
      </div>

      <article className="admin-card">
        <div className="admin-card-head">
          <h2>Bảng nhân sự</h2>
          <button className="admin-secondary-btn">Thêm nhân viên</button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên</th>
                <th>Vai trò</th>
                <th>Ca trực</th>
                <th>Số điện thoại</th>
                <th>Xếp loại</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>{s.role}</td>
                  <td>{s.shift}</td>
                  <td>{s.phone}</td>
                  <td>{s.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
};

export default AdminStaffPage;
