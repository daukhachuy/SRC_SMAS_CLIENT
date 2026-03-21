import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Activity,
  Camera,
  CheckCircle,
  Clock,
  CreditCard,
  Edit3,
  User,
  X,
  AlertCircle,
  Loader2,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { staffApi, fetchStaffProfile } from '../../api/staffApi';
import { salaryRecordAPI, staffAPI } from '../../api/managerApi';

const API_BASE_ORIGIN = (process.env.REACT_APP_API_URL || '')
  .replace(/\/api\/?$/i, '')
  .replace(/\/$/, '');

function resolveAvatarUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const base = API_BASE_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

function normalizeDob(raw) {
  if (!raw) return '';
  const s = String(raw);
  return s.includes('T') ? s.split('T')[0] : s.slice(0, 10);
}

function formatVnDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('vi-VN');
}

function mapGenderFromApi(g) {
  const x = String(g || '').trim().toLowerCase();
  if (x === 'male' || x === 'nam' || x === 'm') return 'Nam';
  if (x === 'female' || x === 'nữ' || x === 'nu' || x === 'f') return 'Nữ';
  return 'Khác';
}

/**
 * PUT /api/Staff/staff-profile (Swagger)
 * Body: fullname, phone, email, gender, dob, address, avatarUrl, bankAccountNumber, bankName
 * @see https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/swagger/index.html
 */
function buildStaffProfilePutBody(profileData) {
  const dobRaw = (profileData.birthDate || '').trim();
  const body = {
    fullname: (profileData.fullName || '').trim(),
    phone: (profileData.phone || '').trim(),
    email: (profileData.email || '').trim(),
    /** Chuỗi — gửi Nam/Nữ/Khác khớp GET (ví dụ "Nam") */
    gender: (profileData.gender || 'Khác').trim(),
    address: (profileData.address || '').trim(),
    bankAccountNumber: (profileData.bankAccount || '').trim(),
    bankName: (profileData.bankName || '').trim()
  };
  if (dobRaw) {
    body.dob = dobRaw.length >= 10 ? dobRaw.slice(0, 10) : dobRaw;
  }
  const av = profileData.avatarUrl;
  if (av && !String(av).startsWith('blob:')) {
    body.avatarUrl = String(av).trim();
  }
  return body;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

function unwrapResponse(response) {
  if (!response) return [];
  const d = response.data?.data ?? response.data ?? response;
  return asArray(d);
}

function pick(obj, keys, fallback = null) {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null && obj?.[key] !== '') return obj[key];
  }
  return fallback;
}

function formatCurrency(v) {
  const value = Number(v || 0);
  if (!Number.isFinite(value)) return '0đ';
  return `${value.toLocaleString('vi-VN')}đ`;
}

function normalizeMonthLabel(item, index) {
  const month = pick(item, ['month', 'monthNumber'], null);
  const year = pick(item, ['year'], null);
  if (month && year) return `T${month}/${String(year).slice(-2)}`;
  if (month) return `T${month}`;
  const dateStr = pick(item, ['createdAt', 'date', 'salaryDate'], null);
  if (dateStr) {
    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) return `Tháng ${d.getMonth() + 1}`;
  }
  return `T${index + 1}`;
}

const KitchenProfilePage = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    email: '',
    gender: 'Nam',
    birthDate: '',
    address: '',
    bankAccount: '',
    bankName: '',
    avatarUrl: ''
  });

  const [meta, setMeta] = useState({
    position: '',
    experienceLevel: '',
    hireDate: '',
    hireDateReadOnly: '',
    taxId: '',
    role: ''
  });

  const [salaryStats, setSalaryStats] = useState({
    estimatedSalary: 0,
    totalHours: 0,
    completedShifts: 0
  });

  const [salaryTrend, setSalaryTrend] = useState([]);

  const loadAll = useCallback(async () => {
    setMessage({ type: '', text: '' });
    try {
      setLoading(true);

      const [
        profileRes,
        monthDetailRes,
        sixMonthsRes,
        monthHoursRes,
        monthShiftsRes
      ] = await Promise.allSettled([
        fetchStaffProfile(),
        salaryRecordAPI.getCurrentMonthDetail(),
        salaryRecordAPI.getLastSixMonths(),
        staffAPI.getSumTimeworkThisMonth(),
        staffAPI.getSumWorkshiftThisMonth()
      ]);

      if (profileRes.status === 'fulfilled') {
        const data = profileRes.value ?? {};
        setMeta({
          position: data.position || '',
          experienceLevel: data.experienceLevel || '',
          hireDate: data.hireDate || '',
          hireDateReadOnly: data.hireDateReadOnly || '',
          taxId: data.taxId || '',
          role: data.role || ''
        });
        setProfileData({
          fullName: data.fullName || data.fullname || '',
          phone: data.phone || '',
          email: data.email || '',
          gender: mapGenderFromApi(data.gender),
          birthDate: normalizeDob(data.dob),
          address: data.address || '',
          bankAccount: data.bankAccountNumber || '',
          bankName: data.bankName || '',
          avatarUrl: data.avatarUrl || ''
        });
      } else {
        console.error('[KitchenProfile] staff-profile:', profileRes.reason);
        setMessage({
          type: 'error',
          text:
            profileRes.reason?.response?.data?.message ||
            profileRes.reason?.message ||
            'Không tải được hồ sơ (GET /Staff/staff-profile).'
        });
      }

      const detail =
        monthDetailRes.status === 'fulfilled'
          ? monthDetailRes.value?.data?.data ?? monthDetailRes.value?.data ?? {}
          : {};
      const totalHours =
        monthHoursRes.status === 'fulfilled'
          ? Number(monthHoursRes.value?.data?.data ?? monthHoursRes.value?.data ?? 0)
          : 0;
      const completedShifts =
        monthShiftsRes.status === 'fulfilled'
          ? Number(monthShiftsRes.value?.data?.data ?? monthShiftsRes.value?.data ?? 0)
          : 0;

      const estimatedSalary = Number(
        pick(detail, ['estimatedSalary', 'actualSalary', 'salary', 'totalSalary'], 0)
      );

      setSalaryStats({
        estimatedSalary: Number.isFinite(estimatedSalary) ? estimatedSalary : 0,
        totalHours: Number.isFinite(totalHours) ? totalHours : 0,
        completedShifts: Number.isFinite(completedShifts) ? completedShifts : 0
      });

      const trendItemsRaw =
        sixMonthsRes.status === 'fulfilled' ? unwrapResponse(sixMonthsRes.value) : [];
      const trend = trendItemsRaw.map((item, index) => {
        const salary = Number(pick(item, ['actualSalary', 'salary', 'totalSalary', 'income'], 0));
        return {
          month: normalizeMonthLabel(item, index),
          value: Number.isFinite(salary) ? salary : 0
        };
      });

      if (trend.length > 0) {
        setSalaryTrend(trend);
      } else {
        setSalaryTrend([
          { month: 'Tháng 5', value: 13500000 },
          { month: 'Tháng 6', value: 14200000 },
          { month: 'Tháng 7', value: 15800000 },
          { month: 'Tháng 8', value: 15100000 },
          { month: 'Tháng 9', value: 15900000 },
          { month: 'T10 (Nay)', value: 16200000 }
        ]);
      }
    } catch (err) {
      console.error('[KitchenProfile]', err);
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Lỗi tải dữ liệu.'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const maxSalary = useMemo(() => {
    const maxVal = Math.max(...salaryTrend.map((x) => x.value), 1);
    return maxVal;
  }, [salaryTrend]);

  const statDeltas = useMemo(() => {
    const t = salaryTrend;
    let salaryChange = { text: '+5%', type: 'positive' };
    if (t.length >= 2) {
      const a = t[t.length - 1].value;
      const b = t[t.length - 2].value;
      if (b > 0) {
        const p = ((a - b) / b) * 100;
        salaryChange = {
          text: `${p >= 0 ? '+' : ''}${p.toFixed(0)}%`,
          type: p >= 0 ? 'positive' : 'negative'
        };
      }
    }
    return {
      salary: salaryChange,
      hours: { text: '-2%', type: 'negative' },
      shifts: { text: '+10%', type: 'positive' }
    };
  }, [salaryTrend]);

  const cloudName = 'dmzuier4p';
  const uploadPreset = 'Image_profile';
  const folderName = 'image_SEP490';

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage({ type: '', text: '' });
    const localUrl = URL.createObjectURL(file);
    setProfileData((prev) => ({ ...prev, avatarUrl: localUrl }));

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('upload_preset', uploadPreset);
    uploadFormData.append('folder', folderName);

    try {
      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        uploadFormData
      );
      const imageUrl = cloudinaryRes.data.secure_url;
      setProfileData((prev) => ({ ...prev, avatarUrl: imageUrl }));
    } catch (error) {
      console.error('Avatar upload:', error);
      setMessage({ type: 'error', text: 'Không tải được ảnh lên. Thử lại sau.' });
      await loadAll();
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const body = buildStaffProfilePutBody(profileData);
      if (!body.fullname) {
        setMessage({ type: 'error', text: 'Vui lòng nhập họ và tên.' });
        setSaving(false);
        return;
      }
      await staffApi.updateProfile(body);
      setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công.' });
      setShowEditModal(false);
      await loadAll();
    } catch (err) {
      console.error('[KitchenProfile] PUT staff-profile:', err);
      setMessage({
        type: 'error',
        text:
          err?.response?.data?.message ||
          err?.message ||
          'Cập nhật thất bại. Vui lòng thử lại.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const avatarDisplay = resolveAvatarUrl(profileData.avatarUrl);

  if (loading) {
    return (
      <div className="kitchen-profile-container kprofile-page">
        <div className="kprofile-loading">
          <Loader2 size={28} className="kprofile-loading-icon" />
          <p>Đang tải hồ sơ & lương…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kitchen-profile-container kprofile-page">
      <header className="profile-header kprofile-header">
        <h2 className="profile-title">Hồ sơ & Lương</h2>
        <p className="profile-subtitle kprofile-subtitle">
          Quản lý thông tin cá nhân và theo dõi thu nhập hàng tháng của bạn
        </p>
      </header>

      {message.text && (
        <div
          className={`kprofile-alert ${message.type === 'success' ? 'kprofile-alert--ok' : 'kprofile-alert--err'}`}
          role="alert"
        >
          {message.type === 'error' && <AlertCircle size={20} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Thẻ hồ sơ — đầy đủ field từ GET /Staff/staff-profile */}
      <section className="profile-card-main kprofile-card">
        <div className="kprofile-card-row">
          <div className="profile-avatar-section">
            <div className="profile-avatar-wrapper kprofile-avatar">
              <img
                src={avatarDisplay || 'https://placehold.co/160x160/f1f5f9/64748b?text=Chef'}
                alt={profileData.fullName || 'Avatar'}
                className="profile-avatar-img"
              />
              <div className="profile-verified-badge">
                <CheckCircle size={16} />
              </div>
            </div>
          </div>

          <div className="kprofile-info-wrap">
            <div className="profile-info-grid kprofile-grid-primary">
              <div className="profile-info-item">
                <p className="info-label">Họ và tên</p>
                <p className="info-value">{profileData.fullName || '—'}</p>
              </div>
              <div className="profile-info-item">
                <p className="info-label">Số điện thoại</p>
                <p className="info-value">{profileData.phone || '—'}</p>
              </div>
              <div className="profile-info-item full-width">
                <p className="info-label">Địa chỉ thường trú</p>
                <p className="info-value">{profileData.address || '—'}</p>
              </div>
            </div>

            <div className="kprofile-divider" />

            <div className="profile-info-grid kprofile-grid-detail">
              <div className="profile-info-item">
                <p className="info-label">Email</p>
                <p className="info-value kprofile-value-sm">{profileData.email || '—'}</p>
              </div>
              <div className="profile-info-item">
                <p className="info-label">Giới tính</p>
                <p className="info-value">{profileData.gender || '—'}</p>
              </div>
              <div className="profile-info-item">
                <p className="info-label">Ngày sinh</p>
                <p className="info-value">{formatVnDate(profileData.birthDate)}</p>
              </div>
              <div className="profile-info-item">
                <p className="info-label">Vị trí</p>
                <p className="info-value">{meta.position || '—'}</p>
              </div>
              <div className="profile-info-item">
                <p className="info-label">Cấp độ kinh nghiệm</p>
                <p className="info-value">{meta.experienceLevel || '—'}</p>
              </div>
              <div className="profile-info-item">
                <p className="info-label">Vai trò hệ thống</p>
                <p className="info-value">{meta.role || '—'}</p>
              </div>
              <div className="profile-info-item">
                <p className="info-label">Ngày vào làm</p>
                <p className="info-value">{formatVnDate(meta.hireDateReadOnly || meta.hireDate)}</p>
              </div>
              <div className="profile-info-item">
                <p className="info-label">Mã số thuế</p>
                <p className="info-value">{meta.taxId || '—'}</p>
              </div>
              <div className="profile-info-item">
                <p className="info-label">Số tài khoản</p>
                <p className="info-value">{profileData.bankAccount || '—'}</p>
              </div>
              <div className="profile-info-item">
                <p className="info-label">Ngân hàng</p>
                <p className="info-value">{profileData.bankName || '—'}</p>
              </div>
            </div>
          </div>

          <div className="profile-actions kprofile-actions">
            <button type="button" className="profile-edit-btn" onClick={() => setShowEditModal(true)}>
              <Edit3 size={18} />
              Cập nhật hồ sơ
            </button>
          </div>
        </div>
      </section>

      {/* Thống kê — API lương + giờ + ca */}
      <div className="profile-stats-grid kprofile-stats">
        <div className="profile-stat-card">
          <div className="stat-card-header">
            <div className="stat-icon primary">
              <CreditCard size={22} />
            </div>
            <span
              className={`stat-change ${statDeltas.salary.type === 'positive' ? 'positive' : 'negative'}`}
            >
              {statDeltas.salary.type === 'positive' ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}{' '}
              {statDeltas.salary.text}
            </span>
          </div>
          <p className="stat-label">Lương dự tính (Tháng này)</p>
          <p className="stat-value">{formatCurrency(salaryStats.estimatedSalary)}</p>
        </div>

        <div className="profile-stat-card">
          <div className="stat-card-header">
            <div className="stat-icon blue">
              <Clock size={22} />
            </div>
            <span className={`stat-change ${statDeltas.hours.type === 'positive' ? 'positive' : 'negative'}`}>
              {statDeltas.hours.type === 'positive' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{' '}
              {statDeltas.hours.text}
            </span>
          </div>
          <p className="stat-label">Tổng giờ làm</p>
          <p className="stat-value">{salaryStats.totalHours} giờ</p>
        </div>

        <div className="profile-stat-card">
          <div className="stat-card-header">
            <div className="stat-icon green">
              <CheckCircle size={22} />
            </div>
            <span className="stat-change positive">
              <TrendingUp size={14} /> {statDeltas.shifts.text}
            </span>
          </div>
          <p className="stat-label">Số ca hoàn thành</p>
          <p className="stat-value">{salaryStats.completedShifts} ca</p>
        </div>
      </div>

      {/* Biểu đồ 6 tháng — GET /SalaryRecord/last-six-months */}
      <div className="salary-trend-card kprofile-chart-card">
        <div className="salary-trend-header">
          <h3 className="salary-trend-title">
            <Activity size={22} />
            Xu hướng lương 6 tháng gần nhất
          </h3>
          <div className="salary-trend-legend">
            <span className="legend-dot" />
            <span className="legend-label">Lương thực nhận</span>
          </div>
        </div>

        <div className="kprofile-salary-bars">
          {salaryTrend.map((item, index) => {
            const height = Math.max((item.value / maxSalary) * 100, 8);
            const isCurrent = index === salaryTrend.length - 1;
            const mVal = item.value / 1000000;
            return (
              <div key={`${item.month}-${index}`} className="kprofile-bar-col">
                <div
                  className={`kprofile-bar ${isCurrent ? 'kprofile-bar--current' : ''}`}
                  style={{ height: `${height}%` }}
                >
                  <span className="kprofile-bar-tip">{mVal >= 1 ? `${mVal.toFixed(1)}M` : formatCurrency(item.value)}</span>
                </div>
                <span className={`kprofile-bar-label ${isCurrent ? 'is-current' : ''}`}>{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {showEditModal && (
        <div className="kitchen-modal-overlay active" onClick={() => !saving && setShowEditModal(false)}>
          <div className="kitchen-modal profile-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kitchen-modal-header">
              <h3 className="kitchen-modal-title">Cập nhật thông tin cá nhân</h3>
              <button
                type="button"
                className="modal-close-btn"
                disabled={saving}
                onClick={() => setShowEditModal(false)}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile}>
              <div className="kitchen-modal-content">
                <div className="profile-edit-layout">
                  <div className="profile-avatar-edit">
                    <div className="avatar-edit-wrapper" aria-label="Ảnh đại diện">
                      <img
                        src={
                          resolveAvatarUrl(profileData.avatarUrl) ||
                          'https://placehold.co/120x120/e2e8f0/64748b?text=+'
                        }
                        alt=""
                        className="avatar-preview"
                      />
                      <label
                        htmlFor="kitchen-avatar-upload"
                        className="avatar-change-btn"
                        style={{ cursor: uploading || saving ? 'wait' : 'pointer' }}
                      >
                        <Camera size={20} />
                      </label>
                      <input
                        id="kitchen-avatar-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        disabled={uploading || saving}
                        onChange={handleAvatarChange}
                      />
                    </div>
                    <p className="avatar-label">{uploading ? 'Đang tải ảnh…' : 'Ảnh đại diện'}</p>
                  </div>

                  <div className="profile-form-fields">
                    <section className="form-section">
                      <div className="form-section-header">
                        <User size={18} />
                        <h4>Thông tin cơ bản</h4>
                      </div>

                      <div className="form-grid">
                        <div className="kitchen-form-group">
                          <label className="kitchen-form-label">Họ và tên</label>
                          <input
                            type="text"
                            className="kitchen-input"
                            value={profileData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            required
                          />
                        </div>

                        <div className="kitchen-form-group">
                          <label className="kitchen-form-label">Số điện thoại</label>
                          <input
                            type="tel"
                            className="kitchen-input"
                            value={profileData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                          />
                        </div>

                        <div className="kitchen-form-group full-width">
                          <label className="kitchen-form-label">Email</label>
                          <input
                            type="email"
                            className="kitchen-input"
                            value={profileData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                          />
                        </div>

                        <div className="kitchen-form-group">
                          <label className="kitchen-form-label">Giới tính</label>
                          <select
                            className="kitchen-select"
                            value={profileData.gender}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                          >
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                          </select>
                        </div>

                        <div className="kitchen-form-group">
                          <label className="kitchen-form-label">Ngày sinh</label>
                          <input
                            type="date"
                            className="kitchen-input"
                            value={profileData.birthDate}
                            onChange={(e) => handleInputChange('birthDate', e.target.value)}
                          />
                        </div>

                        <div className="kitchen-form-group full-width">
                          <label className="kitchen-form-label">Địa chỉ thường trú</label>
                          <textarea
                            className="kitchen-textarea"
                            rows={2}
                            value={profileData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                          />
                        </div>
                      </div>
                    </section>

                    <section className="form-section">
                      <div className="form-section-header">
                        <CreditCard size={18} />
                        <h4>Thông tin nhận lương</h4>
                      </div>

                      <div className="form-grid bank-info">
                        <div className="kitchen-form-group">
                          <label className="kitchen-form-label">Số tài khoản</label>
                          <input
                            type="text"
                            className="kitchen-input"
                            value={profileData.bankAccount}
                            onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                          />
                        </div>

                        <div className="kitchen-form-group">
                          <label className="kitchen-form-label">Tên ngân hàng</label>
                          <input
                            type="text"
                            className="kitchen-input"
                            value={profileData.bankName}
                            onChange={(e) => handleInputChange('bankName', e.target.value)}
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              <div className="kitchen-modal-footer">
                <button
                  type="button"
                  className="kitchen-btn secondary"
                  disabled={saving}
                  onClick={() => setShowEditModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="kitchen-btn primary" disabled={saving || uploading}>
                  {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenProfilePage;
