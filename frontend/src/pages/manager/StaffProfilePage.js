import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/StaffProfilePage.css';

const MOCK = {
  name: 'Nguyễn Văn An',
  code: 'NV001',
  role: 'Đầu bếp',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  totalShifts: 24,
  totalShiftsChange: 2,
  totalHours: 192.5,
  totalAbsent: 0,
  details: [
    { date: '15/03/2024', shift: 'Sáng', checkIn: '07.55', checkOut: '16.05', hours: 8.0, status: 'Đúng giờ' },
    { date: '14/03/2024', shift: 'Tối', checkIn: '17.15', checkOut: '22.00', hours: 4.75, status: 'Muộn (15p)' },
    { date: '13/03/2024', shift: 'Chiều', checkIn: '12.00', checkOut: '20.00', hours: 8.0, status: 'Đúng giờ' },
    { date: '12/03/2024', shift: 'Sáng', checkIn: '--:--', checkOut: '--:--', hours: 0.0, status: 'Vắng' },
  ],
};

const STATUS_STYLES = {
  'Đúng giờ': 'staff-profile-status-badge staff-profile-status-on-time',
  'Muộn (15p)': 'staff-profile-status-badge staff-profile-status-late',
  'Vắng': 'staff-profile-status-badge staff-profile-status-absent',
};

const StaffProfilePage = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [month, setMonth] = useState('03/2024');
  const [page, setPage] = useState(1);
  const pageSize = 4;
  const totalRows = MOCK.details.length;
  const totalPages = 2;

  return (
    <div className="staff-profile-bg">
      <div className="staff-profile-card">
        {/* Header */}
        <div className="staff-profile-header">
          <div className="staff-profile-header-info">
            <div className="staff-profile-avatar">
              <img alt={MOCK.name} src={MOCK.avatar} onError={e => {e.target.onerror=null;e.target.src='/images/default-avatar.png'}} />
            </div>
            <div>
              <div className="staff-profile-header-title">
                Lịch sử ca làm việc <span className="highlight">— {MOCK.name}</span>
              </div>
              <div className="staff-profile-header-meta">
                Mã NV: <span>{MOCK.code}</span> • Vị trí: <span>{MOCK.role}</span>
              </div>
            </div>
          </div>
          <button aria-label="Đóng" className="staff-profile-close-btn" onClick={() => navigate(-1)}>
            <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>
        </div>

        {/* Stats */}
        <div className="staff-profile-stats">
          <div className="staff-profile-stat-card">
            <div className="staff-profile-stat-label">Tổng số ca (Tháng này)</div>
            <div>
              <span className="staff-profile-stat-value">{MOCK.totalShifts}</span>
              <span className="staff-profile-stat-change">↑ {MOCK.totalShiftsChange} ca</span>
            </div>
          </div>
          <div className="staff-profile-stat-card">
            <div className="staff-profile-stat-label">Tổng giờ làm</div>
            <div>
              <span className="staff-profile-stat-value">{MOCK.totalHours}</span>
              <span style={{fontSize:'1rem',color:'#888',marginLeft:8}}>giờ</span>
            </div>
          </div>
          <div className="staff-profile-stat-card">
            <div className="staff-profile-stat-label">Số ca vắng</div>
            <div>
              <span className="staff-profile-stat-value staff-profile-stat-absent">{MOCK.totalAbsent}</span>
              <span style={{fontSize:'1rem',color:'#888',marginLeft:8}}>ca</span>
            </div>
          </div>
        </div>

        {/* Table & Filter */}
        <div className="staff-profile-table-section">
          <div className="staff-profile-table-header">
            <div className="staff-profile-table-title">Chi tiết lịch sử ca làm</div>
            <div className="staff-profile-table-filter">
              <span>THÁNG:</span>
              <select value={month} onChange={e => setMonth(e.target.value)}>
                <option>Tháng 03/2024</option>
                <option>Tháng 02/2024</option>
              </select>
            </div>
          </div>
          <div className="staff-profile-table-container">
            <table className="staff-profile-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Ca làm</th>
                  <th>Giờ vào</th>
                  <th>Giờ ra</th>
                  <th className="center">Tổng giờ</th>
                  <th className="right">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {MOCK.details.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.date}</td>
                    <td>{row.shift}</td>
                    <td>{row.checkIn}</td>
                    <td>{row.checkOut}</td>
                    <td className="center">{row.hours}</td>
                    <td className="right">
                      <span className={STATUS_STYLES[row.status] || 'staff-profile-status-badge'}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="staff-profile-pagination">
              <div className="staff-profile-pagination-info">Hiển thị 1 - 4 trên 24 ca làm</div>
              <div className="staff-profile-pagination-controls">
                <button className="staff-profile-pagination-btn" disabled={page === 1} onClick={()=>setPage(p=>Math.max(1,p-1))}>&lt;</button>
                {[1,2,3].map(p=>(
                  <button key={p} className={`staff-profile-pagination-btn${p===page?' active':''}`} onClick={()=>setPage(p)}>{p}</button>
                ))}
                <button className="staff-profile-pagination-btn" disabled={page === totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>&gt;</button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="staff-profile-footer">
          <button className="staff-profile-export-btn">
            Xuất PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffProfilePage;
