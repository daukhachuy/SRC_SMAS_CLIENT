import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/StaffProfilePage.css';
import { getAllStaff, staffAPI } from '../../api/managerApi';

const FALLBACK_AVATAR = 'https://randomuser.me/api/portraits/men/32.jpg';

const pick = (obj, keys, fallback = null) => {
  for (const key of keys) {
    const val = obj?.[key];
    if (val !== undefined && val !== null && val !== '') return val;
  }
  return fallback;
};

const unwrapResponse = (res) => {
  if (!res) return null;
  if (res.data?.data != null) return res.data.data;
  if (res.data != null) return res.data;
  return res;
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.$values)) return value.$values;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const normalizeIsoString = (value) => {
  const raw = String(value || '').trim();
  if (!raw || raw === '--:--') return null;
  const dt = new Date(raw);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const formatDateVi = (value) => {
  const dt = normalizeIsoString(value);
  if (!dt) return '--/--/----';
  return dt.toLocaleDateString('vi-VN');
};

const formatTimeVi = (value) => {
  const dt = normalizeIsoString(value);
  if (!dt) return '--:--';
  return dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
};

const getMonthKey = (value) => {
  const dt = normalizeIsoString(value);
  if (!dt) return '';
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonthLabel = (monthKey) => {
  const [year, month] = String(monthKey || '').split('-');
  if (!year || !month) return 'Tháng hiện tại';
  return `Tháng ${month}/${year}`;
};

const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getRecentMonthOptions = (count = 12) => {
  const now = new Date();
  return Array.from({ length: count }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - idx, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
};

const toHours = (item) => {
  const hoursRaw = Number(pick(item, ['totalHours', 'workHours', 'hours'], NaN));
  if (Number.isFinite(hoursRaw)) return Number(hoursRaw.toFixed(2));
  const checkIn = normalizeIsoString(pick(item, ['checkInTime', 'checkIn', 'timeIn']));
  const checkOut = normalizeIsoString(pick(item, ['checkOutTime', 'checkOut', 'timeOut']));
  if (!checkIn || !checkOut) return 0;
  const diff = (checkOut.getTime() - checkIn.getTime()) / 36e5;
  return Number.isFinite(diff) && diff > 0 ? Number(diff.toFixed(2)) : 0;
};

const normalizeShiftName = (value) => {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('sáng') || raw.includes('morning')) return 'Sáng';
  if (raw.includes('chiều') || raw.includes('afternoon')) return 'Chiều';
  if (raw.includes('tối') || raw.includes('evening') || raw.includes('night')) return 'Tối';
  return String(value || '---');
};

const normalizeStatus = (item) => {
  const statusRaw = String(pick(item, ['status', 'attendanceStatus', 'workStatus'], '')).toLowerCase();
  const lateMinutes = Number(pick(item, ['lateMinutes', 'minutesLate'], 0));
  if (statusRaw.includes('vắng') || statusRaw.includes('absent') || statusRaw.includes('off')) return 'Vắng';
  if (statusRaw.includes('muộn') || statusRaw.includes('late')) {
    return lateMinutes > 0 ? `Muộn (${lateMinutes}p)` : 'Muộn';
  }
  if (statusRaw.includes('đúng') || statusRaw.includes('on time') || statusRaw.includes('ontime')) return 'Đúng giờ';
  return 'Đúng giờ';
};

const getStatusClassName = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized.includes('vắng')) return 'staff-profile-status-badge staff-profile-status-absent';
  if (normalized.includes('muộn') || normalized.includes('late')) return 'staff-profile-status-badge staff-profile-status-late';
  return 'staff-profile-status-badge staff-profile-status-on-time';
};

const StaffProfilePage = () => {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [month, setMonth] = useState(getCurrentMonthKey());
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({
    name: 'Nhân viên',
    code: '---',
    role: '---',
    avatar: FALLBACK_AVATAR,
  });
  const [historyRows, setHistoryRows] = useState([]);

  const pageSize = 4;
  const monthOptions = useMemo(() => getRecentMonthOptions(12), []);
  const filteredRows = historyRows;

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, totalRows);
  const pagedRows = filteredRows.slice(start, end);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const monthlyHours = filteredRows.reduce((sum, row) => sum + Number(row.hours || 0), 0);
  const monthlyAbsent = filteredRows.filter((row) => String(row.status).toLowerCase().includes('vắng')).length;
  const totalShiftsChange = 0;

  useEffect(() => {
    const loadProfile = async () => {
      setError('');
      try {
        const staffListRes = await getAllStaff();
        const staffList = asArray(unwrapResponse(staffListRes));
        const target = staffList.find((x) => Number(pick(x, ['userId', 'id', 'staffId'], 0)) === Number(staffId));
        setProfile({
          name: pick(target, ['fullName', 'fullname', 'name', 'staffName'], 'Nhân viên'),
          code: pick(target, ['staffCode', 'code', 'employeeCode'], `NV${String(staffId || '').padStart(3, '0')}`),
          role: pick(target, ['position', 'role', 'staffRole'], 'Nhân viên'),
          avatar: pick(target, ['avatarUrl', 'avatar', 'imageUrl'], FALLBACK_AVATAR),
        });
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Không tải được thông tin nhân viên.');
      }
    };
    loadProfile();
  }, [staffId]);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const [yearRaw, monthRaw] = String(month || '').split('-');
        const queryMonth = Number(monthRaw);
        const queryYear = Number(yearRaw);
        const historyRes = await staffAPI.getStaffWorkHistory(Number(staffId), {
          month: queryMonth,
          year: queryYear,
        });
        const rawHistory = asArray(unwrapResponse(historyRes));
        const mapped = rawHistory
          .map((item) => {
            const workDate = pick(item, ['workDate', 'date', 'createdAt', 'shiftDate']);
            return {
              date: formatDateVi(workDate),
              monthKey: getMonthKey(workDate),
              shift: normalizeShiftName(pick(item, ['shiftName', 'shift', 'name'], '---')),
              checkIn: formatTimeVi(pick(item, ['checkInTime', 'checkIn', 'timeIn'])),
              checkOut: formatTimeVi(pick(item, ['checkOutTime', 'checkOut', 'timeOut'])),
              hours: toHours(item),
              status: normalizeStatus(item),
              dateSort: normalizeIsoString(workDate)?.getTime?.() || 0,
            };
          })
          .sort((a, b) => b.dateSort - a.dateSort);

        setHistoryRows(mapped);
        setPage(1);
      } catch (err) {
        setHistoryRows([]);
        setError(err?.response?.data?.message || err?.message || 'Không tải được lịch sử ca làm việc.');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [staffId, month]);

  useEffect(() => {
    setPage(1);
  }, [month]);

  return (
    <div className="staff-profile-bg">
      <div className="staff-profile-card">
        <div className="staff-profile-header">
          <div className="staff-profile-header-info">
            <div className="staff-profile-avatar">
              <img alt={profile.name} src={profile.avatar} onError={e => {e.target.onerror=null;e.target.src='/images/default-avatar.png'}} />
            </div>
            <div>
              <div className="staff-profile-header-title">
                Lịch sử ca làm việc <span className="highlight">— {profile.name}</span>
              </div>
              <div className="staff-profile-header-meta">
                Mã NV: <span>{profile.code}</span> • Vị trí: <span>{profile.role}</span> • ID: <span>{staffId}</span>
              </div>
            </div>
          </div>
          <button aria-label="Đóng" className="staff-profile-close-btn" onClick={() => navigate(-1)}>
            <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path></svg>
          </button>
        </div>

        <div className="staff-profile-stats">
          <div className="staff-profile-stat-card">
            <div className="staff-profile-stat-label">Tổng số ca (Tháng này)</div>
            <div className="staff-profile-stat-main">
              <span className="staff-profile-stat-value">{filteredRows.length}</span>
              <span className="staff-profile-stat-change">{totalShiftsChange >= 0 ? '↑' : '↓'} {Math.abs(totalShiftsChange)} ca</span>
            </div>
          </div>
          <div className="staff-profile-stat-card">
            <div className="staff-profile-stat-label">Tổng giờ làm</div>
            <div className="staff-profile-stat-main">
              <span className="staff-profile-stat-value">{Number(monthlyHours.toFixed(2))}</span>
              <span className="staff-profile-stat-unit">giờ</span>
            </div>
          </div>
          <div className="staff-profile-stat-card">
            <div className="staff-profile-stat-label">Số ca vắng</div>
            <div className="staff-profile-stat-main">
              <span className="staff-profile-stat-value staff-profile-stat-absent">{monthlyAbsent}</span>
              <span className="staff-profile-stat-unit">ca</span>
            </div>
          </div>
        </div>

        {!!error && (
          <div style={{ margin: '10px 16px 0', padding: '10px 12px', borderRadius: 10, background: '#fff1f2', color: '#9f1239', fontWeight: 600 }}>
            {error}
          </div>
        )}

        <div className="staff-profile-table-section">
          <div className="staff-profile-table-header">
            <div className="staff-profile-table-title">Chi tiết lịch sử ca làm</div>
            <div className="staff-profile-table-filter">
              <label htmlFor="staff-profile-month">Tháng:</label>
              <select
                id="staff-profile-month"
                value={month}
                onChange={e => {
                  setMonth(e.target.value);
                }}
                disabled={loading}
              >
                {monthOptions.map((m) => (
                  <option key={m} value={m}>{formatMonthLabel(m)}</option>
                ))}
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
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#6b7280', padding: 18 }}>Đang tải dữ liệu...</td>
                  </tr>
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#6b7280', padding: 18 }}>Không có dữ liệu ca làm cho tháng đã chọn.</td>
                  </tr>
                ) : pagedRows.map((row, idx) => (
                  <tr key={`${row.date}-${row.shift}-${idx}`}>
                    <td>{row.date}</td>
                    <td>{row.shift}</td>
                    <td>{row.checkIn}</td>
                    <td>{row.checkOut}</td>
                    <td className="center">{row.hours}</td>
                    <td className="right">
                      <span className={getStatusClassName(row.status)}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="staff-profile-pagination">
              <div className="staff-profile-pagination-info">
                Hiển thị {totalRows === 0 ? 0 : start + 1} - {end} trên {totalRows} ca làm
              </div>
              <div className="staff-profile-pagination-controls">
                <button
                  type="button"
                  className="staff-profile-pagination-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ‹
                </button>
                {pages.map((p) => (
                  <button
                    type="button"
                    key={p}
                    className={`staff-profile-pagination-btn${p === page ? ' active' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="staff-profile-pagination-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  ›
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="staff-profile-footer">
          <button type="button" className="staff-profile-export-btn">
            Xuất PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffProfilePage;
