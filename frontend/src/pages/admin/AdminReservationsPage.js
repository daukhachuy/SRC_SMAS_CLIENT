import React from 'react';

const bookings = [
  { code: 'BK-201', guest: 'Trần Văn Đạt', people: 6, slot: '18:30', area: 'Sân vườn', note: 'Sinh nhật' },
  { code: 'BK-202', guest: 'Mỹ Linh', people: 2, slot: '19:00', area: 'Phòng VIP', note: 'Kỷ niệm' },
  { code: 'BK-203', guest: 'Nhật Minh', people: 10, slot: '20:00', area: 'Tầng 2', note: 'Tiếp đối tác' }
];

const AdminReservationsPage = () => {
  return (
    <div className="admin-page-grid">
      <div className="admin-page-header">
        <h1>Đặt bàn và sự kiện</h1>
        <p>Quản lý lịch đặt, khu vực và nhắc nhở trước giờ đón khách.</p>
      </div>

      <div className="admin-stats-grid compact">
        <article className="admin-card stat-card">
          <p>Đặt bàn hôm nay</p>
          <h3>24</h3>
        </article>
        <article className="admin-card stat-card">
          <p>Sự kiện sắp tới</p>
          <h3>3</h3>
        </article>
        <article className="admin-card stat-card">
          <p>Tỉ lệ lấp đầy</p>
          <h3>78%</h3>
        </article>
      </div>

      <article className="admin-card">
        <div className="admin-card-head">
          <h2>Lịch hôm nay</h2>
          <button className="admin-secondary-btn">Thêm lịch</button>
        </div>
        <div className="admin-list">
          {bookings.map((b) => (
            <div className="admin-list-item reservation" key={b.code}>
              <div>
                <strong>{b.code}</strong>
                <p>{b.guest} - {b.people} khách</p>
              </div>
              <div>
                <strong>{b.slot}</strong>
                <p>{b.area}</p>
              </div>
              <span className="admin-pill pending">{b.note}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
};

export default AdminReservationsPage;
