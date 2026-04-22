import React, { useEffect, useState } from 'react';
import { 
  User, Calendar, Phone, 
  TrendingUp, Award, Utensils, 
  XCircle, Camera, X, Lock, CreditCard 
} from 'lucide-react';
import { salaryRecordAPI, staffAPI } from '../../api/managerApi';
import { staffApi } from '../../api/staffApi';
import '../../styles/ManagerSalaryPage.css';

const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.$values)) return payload.$values;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.$values)) return payload.data.$values;
  if (Array.isArray(payload?.items)) return payload.items;
  return null;
};

const pickFirstNonEmptyArray = (...candidates) => {
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) return candidate;
  }
  return [];
};

const pick = (obj, keys, fallback = undefined) => {
  for (const key of keys) {
    const val = obj?.[key];
    if (val !== undefined && val !== null && val !== '') return val;
  }
  return fallback;
};

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const toDateText = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('vi-VN');
};

const toMonthLabel = (rawMonth, fallbackIndex = 0) => {
  const monthNum = Number(rawMonth);
  if (Number.isFinite(monthNum) && monthNum >= 1 && monthNum <= 12) {
    return `T.${monthNum}`;
  }
  return `T.${fallbackIndex + 1}`;
};

/** GET /Staff/sum-workshift-thismonth | sum-timework-thismonth — body có thể là number hoặc envelope */
const parseStaffMonthSum = (axiosRes) => {
  const d = axiosRes?.data;
  if (typeof d === 'number') return d;
  if (d != null && typeof d === 'object' && typeof d.data === 'number') return d.data;
  const n = Number(d);
  return Number.isFinite(n) ? n : 0;
};

/** GET /SalaryRecord/last-six-months — hỗ trợ nhiều shape payload */
const unwrapLastSixMonths = (axiosRes) => {
  const raw = axiosRes?.data;
  if (!raw || typeof raw !== 'object') return { averageSalary: 0, months: [] };
  const months =
    asArray(raw.months) ||
    asArray(raw.data?.months) ||
    asArray(raw.lastSixMonths) ||
    asArray(raw.data?.lastSixMonths) ||
    asArray(raw.salaryRecords) ||
    [];
  const avg = Number(raw.averageSalary ?? raw.data?.averageSalary ?? 0);
  return {
    averageSalary: Number.isFinite(avg) ? avg : 0,
    months,
  };
};

const formatSalaryStatusVi = (rawStatus) => {
  const key = String(rawStatus || '').trim().toLowerCase();
  if (!key) return '';
  const map = {
    paid: 'Đã thanh toán',
    completed: 'Đã quyết toán',
    settled: 'Đã quyết toán',
    pending: 'Đang chờ duyệt',
    processing: 'Đang xử lý',
  };
  return map[key] || String(rawStatus);
};

const formatMonthTitle = (month, year) => {
  const m = Number(month);
  const y = Number(year);
  if (Number.isFinite(m) && m >= 1 && m <= 12 && Number.isFinite(y) && y > 1900) {
    return `${String(m).padStart(2, '0')}/${y}`;
  }
  if (Number.isFinite(m) && m >= 1 && m <= 12) {
    return `${String(m).padStart(2, '0')}/${new Date().getFullYear()}`;
  }
  return '';
};

const ManagerSalaryPage = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [salaryChartData, setSalaryChartData] = useState([]);
  const [salaryBreakdown, setSalaryBreakdown] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [salaryTitleMonth, setSalaryTitleMonth] = useState('');
  const [salaryPeriodText, setSalaryPeriodText] = useState('');
  const [salaryStatusText, setSalaryStatusText] = useState('');
  const [salaryApiNotice, setSalaryApiNotice] = useState('');
  const [profileData, setProfileData] = useState({
    fullName: 'Nguyễn Văn A',
    gender: 'Nam',
    dob: '1995-05-15',
    address: '123 Đường ABC, Quận 1, TP. HCM',
    phone: '0901.234.567',
    email: 'vana.nguyen@nha-hang.vn',
    bankName: 'Techcombank',
    bankAccount: '19034567890123',
    // Read-only fields
    role: 'Đầu bếp chính',
    department: 'Bộ phận Bếp',
    joinDate: '01/01/2023',
    taxId: '8492019385'
  });

  const totalSalary = salaryBreakdown.reduce((sum, item) => sum + item.amount, 0);
  const averageSalary = salaryChartData.length
    ? salaryChartData.reduce((sum, item) => sum + item.amount, 0) / salaryChartData.length
    : 0;
  const hasChartData = salaryChartData.length > 0;
  const hasBreakdownData = salaryBreakdown.length > 0;
  const hasHistoryData = salaryHistory.length > 0;
  const hasAnySalaryData = hasChartData || hasBreakdownData || hasHistoryData;

  useEffect(() => {
    let mounted = true;

    const loadSalaryData = async () => {
      try {
        const [profileRes, lastSixRes, monthHoursRes, monthShiftsRes] = await Promise.allSettled([
          staffApi.getProfile(),
          salaryRecordAPI.getLastSixMonths(),
          staffAPI.getSumTimeworkThisMonth(),
          staffAPI.getSumWorkshiftThisMonth(),
        ]);

        let loadedFromApi = false;

        if (profileRes.status === 'fulfilled') {
          const p = profileRes.value?.data?.data ?? profileRes.value?.data ?? {};
          if (mounted && p && typeof p === 'object') {
            setProfileData((prev) => ({
              ...prev,
              fullName: pick(p, ['fullname', 'fullName', 'name'], prev.fullName),
              phone: pick(p, ['phone', 'phoneNumber'], prev.phone),
              address: pick(p, ['address'], prev.address),
              email: pick(p, ['email'], prev.email),
              role: pick(p, ['position', 'role', 'positionName'], prev.role),
              department: pick(p, ['department', 'departmentName'], prev.department),
              joinDate: toDateText(pick(p, ['joinDate', 'startDate', 'createdAt'], prev.joinDate)) || prev.joinDate,
              taxId: pick(p, ['taxId', 'taxCode'], prev.taxId),
              bankName: pick(p, ['bankName'], prev.bankName),
              bankAccount: pick(p, ['bankAccountNumber', 'bankAccount', 'accountNumber'], prev.bankAccount),
            }));
          }
        }

        const totalHours = monthHoursRes.status === 'fulfilled'
          ? parseStaffMonthSum(monthHoursRes.value)
          : 0;
        const completedShifts = monthShiftsRes.status === 'fulfilled'
          ? parseStaffMonthSum(monthShiftsRes.value)
          : 0;

        let latestAmount = 0;
        let latestStatus = '';

        if (lastSixRes.status === 'fulfilled') {
          const { months: rawList } = unwrapLastSixMonths(lastSixRes.value);
          if (rawList.length > 0 && mounted) {
            const chartBase = rawList.map((row, idx) => {
              const amount = toNumber(pick(row, [
                'netSalary', 'totalSalary', 'takeHome', 'actualSalary', 'salary', 'amount', 'totalAmount'
              ], 0));
              const month = toMonthLabel(
                pick(row, ['month', 'salaryMonth', 'monthNumber'], idx + 1),
                idx
              );
              return {
                month,
                amount,
                label: `${(amount / 1000000).toFixed(1)}M`,
                paidDate: toDateText(pick(row, ['paidDate', 'paymentDate', 'createdAt', 'updatedAt'], '')),
                status: String(pick(row, ['status', 'paymentStatus'], 'Xong')),
              };
            });

            const maxAmount = Math.max(...chartBase.map((x) => x.amount), 1);
            const chartMapped = chartBase.map((row, idx) => ({
              ...row,
              height: Math.max(42, Math.round((row.amount / maxAmount) * 100)),
              active: idx === chartBase.length - 2,
              current: idx === chartBase.length - 1,
            }));

            const historyMapped = [...chartMapped]
              .reverse()
              .map((row, idx) => ({
                month: `Tháng ${String(row.month).replace('T.', '').padStart(2, '0')}`,
                amount: row.amount,
                date: row.paidDate || '--/--/----',
                status: row.status || 'Xong',
              }));

            setSalaryChartData(chartMapped);
            setSalaryHistory(historyMapped);
            const latest = chartMapped[chartMapped.length - 1];
            latestAmount = toNumber(latest?.amount);
            latestStatus = String(latest?.status || '');

            if (latest?.month) {
              setSalaryTitleMonth(String(latest.month).replace('T.', '').padStart(2, '0') + '/' + new Date().getFullYear());
            }
            loadedFromApi = true;
          }
        } else {
          console.warn('Salary API last-six-months failed:', lastSixRes.reason);
        }

        if (mounted) {
          const baseSalary = latestAmount;
          const bonus = 0;
          const allowance = 0;
          const deduction = 0;
          const finalNetSalary = latestAmount;

          setSalaryPeriodText('');
          setSalaryStatusText(formatSalaryStatusVi(latestStatus));

          const breakdownRows = [
            {
              id: 1,
              icon: <CreditCard />,
              label: 'Lương cơ bản',
              description: 'Lấy từ tháng gần nhất trong API',
              amount: baseSalary || finalNetSalary,
              type: 'base',
              color: 'slate',
            },
            {
              id: 2,
              icon: <Award />,
              label: 'Số ca đã hoàn thành',
              description: `${Number.isFinite(completedShifts) ? completedShifts : 0} ca hoàn thành`,
              amount: bonus,
              type: 'bonus',
              color: 'green',
            },
            {
              id: 3,
              icon: <XCircle />,
              label: 'Tổng giờ làm',
              description: `${Number.isFinite(totalHours) ? totalHours : 0} giờ làm trong tháng`,
              amount: deduction,
              type: 'deduction',
              color: 'red',
            },
            {
              id: 4,
              icon: <Utensils />,
              label: 'Tham chiếu',
              description: 'Đang dùng dữ liệu tháng gần nhất từ SalaryRecord',
              amount: allowance,
              type: 'allowance',
              color: 'slate',
            },
          ];

          const hasBreakdownData = latestAmount > 0 || totalHours > 0 || completedShifts > 0;
          setSalaryBreakdown(hasBreakdownData ? breakdownRows : []);
        }

        if (mounted) {
          setSalaryApiNotice(
            loadedFromApi
              ? ''
              : 'Chưa lấy được dữ liệu lương từ API.'
          );
          if (!loadedFromApi) {
            setSalaryTitleMonth('');
            setSalaryPeriodText('');
            setSalaryStatusText('');
            setSalaryChartData([]);
            setSalaryHistory([]);
            setSalaryBreakdown([]);
          }
        }
      } catch (error) {
        console.error('Không tải được dữ liệu lương:', error);
        if (mounted) {
          setSalaryApiNotice('Chưa lấy được dữ liệu lương từ API.');
        }
      }
    };

    loadSalaryData();
    return () => {
      mounted = false;
    };
  }, []);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    // TODO: API call to save profile data
    console.log('Saving profile:', profileData);
    setShowEditModal(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(Math.abs(amount));
  };

  return (
    <div className="salary-page">
      {salaryApiNotice && (
        <div style={{ marginBottom: 12, border: '1px solid #fbbf24', background: '#fffbeb', color: '#92400e', borderRadius: 10, padding: '10px 12px', fontWeight: 600 }}>
          {salaryApiNotice}
        </div>
      )}
      {/* Header Section */}
      <header className="salary-header">
        <div className="header-blur-effect"></div>
        <div className="header-content">
          <div className="employee-info-section">
            <div className="employee-avatar-wrapper">
              <div className="avatar-ring">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAm1-h1ClUmJW3IrXjbqlO5r9PKQKeusSi6iu2Itu_X1VeX8xEpTNl1x8ljCCgTNd3Xiox9HikMTcqErOaV52oFeGzKKugPEDLYhMVZPk-6eSAFcnfiNlkNU8AE1ZxIEdozGIgwkBi508H8PnW3QdUWQlDyH9uvixC0mNeIxj5R8HN_MTKFHKuMMRQKp7ifVL-sAXxKyBgvPmooWr48mNCTopAlrRQneKQDnbvnO7ivHzx1QONVKhlm7ebnMhvJTqh4EVYMu_OQAmY"
                  alt={profileData.fullName}
                  className="avatar-img"
                />
              </div>
              <div className="status-indicator"></div>
            </div>
            <div className="employee-details">
              <h2 className="employee-name">{profileData.fullName}</h2>
              <div className="employee-role">
                <Utensils size={18} className="role-icon" />
                <span>{profileData.role} - {profileData.department}</span>
              </div>
              <div className="employee-meta">
                <span className="meta-item">
                  <Phone size={14} />
                  {profileData.phone}
                </span>
                <span className="meta-item">
                  <Calendar size={14} />
                  Vào làm: {profileData.joinDate}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="salary-content-grid">
        {/* Left Column - Charts and Details */}
        <div className="salary-main-column">
          {/* Salary Chart Section */}
          {hasChartData && (
            <section className="salary-chart-section">
              <div className="chart-header">
                <div>
                  <h3 className="section-title">
                    <TrendingUp className="title-icon" />
                    Thu nhập 6 tháng gần nhất
                  </h3>
                  <p className="section-subtitle">Biểu đồ tổng hợp lương thực nhận</p>
                </div>
                <div className="average-display">
                  <p className="average-label">Trung bình</p>
                  <p className="average-amount">
                    {formatCurrency(averageSalary)} <span className="currency">VNĐ</span>
                  </p>
                </div>
              </div>
              <div className="salary-chart">
                {salaryChartData.map((data, index) => (
                  <div key={index} className="chart-bar-wrapper">
                    <div 
                      className={`chart-bar ${data.active ? 'bar-active' : ''} ${data.current ? 'bar-current' : ''}`}
                      style={{ height: `${data.height}%` }}
                    >
                      <div className="bar-tooltip">{data.label}</div>
                    </div>
                    <span className={`chart-label ${data.active ? 'label-active' : ''}`}>
                      {data.month}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Salary Breakdown Section */}
          {hasBreakdownData && (
            <section className="salary-breakdown-section">
              <div className="breakdown-header">
                <div>
                  <h3 className="section-title">Chi tiết lương tháng {salaryTitleMonth || '--/----'}</h3>
                  {salaryPeriodText && <p className="section-subtitle">Kỳ thanh toán: {salaryPeriodText}</p>}
                </div>
                {salaryStatusText && <span className="status-badge status-completed">{salaryStatusText}</span>}
              </div>
              <div className="breakdown-list">
                {salaryBreakdown.map((item) => (
                  <div key={item.id} className={`breakdown-item item-${item.color}`}>
                    <div className="item-left">
                      <div className={`item-icon icon-${item.color}`}>
                        {item.icon}
                      </div>
                      <div className="item-info">
                        <p className={`item-label label-${item.color}`}>{item.label}</p>
                        <p className="item-description">{item.description}</p>
                      </div>
                    </div>
                    <span className={`item-amount amount-${item.color}`}>
                      {item.amount > 0 ? '+' : ''} {formatCurrency(item.amount)} VNĐ
                    </span>
                  </div>
                ))}
              </div>
              <div className="breakdown-total">
                <span className="total-label">Tổng thực lĩnh</span>
                <span className="total-amount">
                  {formatCurrency(totalSalary)} <span className="currency-sm">VNĐ</span>
                </span>
              </div>
            </section>
          )}
          {!hasAnySalaryData && (
            <section className="salary-chart-section">
              <p className="section-subtitle">Chưa có dữ liệu lương từ API.</p>
            </section>
          )}
        </div>

        {/* Right Column - History Sidebar */}
        {hasHistoryData && (
          <aside className="salary-sidebar">
            <div className="sidebar-content">
              <div className="sidebar-header">
                <h3 className="sidebar-title">Lịch sử nhận lương</h3>
                <button className="view-all-btn">Tất cả</button>
              </div>
              <div className="history-list">
                {salaryHistory.map((record, index) => (
                  <div 
                    key={index} 
                    className={`history-card ${index === 0 ? 'card-highlight' : ''}`}
                  >
                    <div className="history-card-header">
                      <span className="history-month">{record.month}</span>
                      <span className="history-status">{record.status}</span>
                    </div>
                    <div className="history-card-body">
                      <p className="history-amount">{formatCurrency(record.amount)}</p>
                      <span className="history-date">{record.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-section">
                <div className="modal-icon">
                  <User />
                </div>
                <div>
                  <h2 className="modal-title">Chỉnh sửa thông tin cá nhân</h2>
                  <p className="modal-subtitle">Cập nhật thông tin định danh và liên hệ của bạn</p>
                </div>
              </div>
              <button 
                className="modal-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                <X />
              </button>
            </div>

            <div className="modal-body">
              {/* Avatar Section */}
              <div className="avatar-section">
                <div className="avatar-preview-wrapper">
                  <div className="avatar-preview">
                    <img 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAm1-h1ClUmJW3IrXjbqlO5r9PKQKeusSi6iu2Itu_X1VeX8xEpTNl1x8ljCCgTNd3Xiox9HikMTcqErOaV52oFeGzKKugPEDLYhMVZPk-6eSAFcnfiNlkNU8AE1ZxIEdozGIgwkBi508H8PnW3QdUWQlDyH9uvixC0mNeIxj5R8HN_MTKFHKuMMRQKp7ifVL-sAXxKyBgvPmooWr48mNCTopAlrRQneKQDnbvnO7ivHzx1QONVKhlm7ebnMhvJTqh4EVYMu_OQAmY"
                      alt="Avatar"
                    />
                  </div>
                </div>
                <div>
                  <h4 className="avatar-title">Ảnh đại diện</h4>
                  <div className="avatar-actions">
                    <button className="btn-upload">
                      <Camera size={16} />
                      Thay đổi ảnh
                    </button>
                    <button className="btn-remove">Gỡ bỏ</button>
                  </div>
                  <p className="avatar-note">
                    Định dạng hỗ trợ: JPG, PNG. Dung lượng tối đa 2MB.
                  </p>
                </div>
              </div>

              {/* Form Grid */}
              <div className="form-grid">
                {/* Basic Information */}
                <div className="form-section">
                  <h3 className="form-section-title">
                    <span className="title-line"></span>
                    Thông tin cơ bản
                  </h3>
                  <div className="form-field">
                    <label className="field-label">Họ và tên</label>
                    <input 
                      type="text" 
                      className="field-input"
                      value={profileData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="field-label">Giới tính</label>
                      <select 
                        className="field-input"
                        value={profileData.gender}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                      >
                        <option>Nam</option>
                        <option>Nữ</option>
                        <option>Khác</option>
                      </select>
                    </div>
                    <div className="form-field">
                      <label className="field-label">Ngày sinh</label>
                      <input 
                        type="date" 
                        className="field-input"
                        value={profileData.dob}
                        onChange={(e) => handleInputChange('dob', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="field-label">Địa chỉ</label>
                    <input 
                      type="text" 
                      className="field-input"
                      value={profileData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </div>
                </div>

                {/* Contact & Payment Information */}
                <div className="form-section">
                  <h3 className="form-section-title">
                    <span className="title-line"></span>
                    Liên hệ & Thanh toán
                  </h3>
                  <div className="form-field">
                    <label className="field-label">Số điện thoại</label>
                    <input 
                      type="tel" 
                      className="field-input"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Email</label>
                    <input 
                      type="email" 
                      className="field-input"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-field">
                      <label className="field-label">Tên ngân hàng</label>
                      <input 
                        type="text" 
                        className="field-input"
                        value={profileData.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label className="field-label">Số tài khoản</label>
                      <input 
                        type="text" 
                        className="field-input"
                        value={profileData.bankAccount}
                        onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Read-Only Admin Section */}
              <div className="admin-section">
                <div className="admin-header">
                  <Lock size={18} className="admin-icon" />
                  <h3 className="admin-title">Thông tin do quản trị viên quản lý</h3>
                </div>
                <div className="admin-fields">
                  <div className="admin-field">
                    <label className="admin-label">Vai trò</label>
                    <input 
                      type="text" 
                      className="admin-input"
                      value={profileData.role}
                      readOnly
                    />
                  </div>
                  <div className="admin-field">
                    <label className="admin-label">Ngày vào làm</label>
                    <input 
                      type="text" 
                      className="admin-input"
                      value={profileData.joinDate}
                      readOnly
                    />
                  </div>
                  <div className="admin-field">
                    <label className="admin-label">Mã số thuế</label>
                    <input 
                      type="text" 
                      className="admin-input"
                      value={profileData.taxId}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel"
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn-save"
                onClick={handleSaveProfile}
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerSalaryPage;
