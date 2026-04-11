import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  User,
  Mail,
  MapPin,
  Wallet,
  Clock3,
  CheckCircle2,
  BarChart3,
  Edit3,
  X,
  Loader2,
  TrendingUp,
  Camera,
  Building2,
  CreditCard,
  CalendarDays,
} from 'lucide-react';
import '../../styles/WaiterPages.css';
import { salaryRecordAPI, staffAPI } from '../../api/managerApi';
import { staffApi } from '../../api/staffApi';

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
    if (!Number.isNaN(d.getTime())) return `T${d.getMonth() + 1}`;
  }

  return `T${index + 1}`;
}

/** GET /Staff/sum-workshift-thismonth | sum-timework-thismonth — body is JSON number */
function parseStaffMonthSum(axiosRes) {
  const d = axiosRes?.data;
  if (typeof d === 'number') return d;
  if (d != null && typeof d === 'object' && typeof d.data === 'number') return d.data;
  const n = Number(d);
  return Number.isFinite(n) ? n : 0;
}

/** GET /SalaryRecord/last-six-months — { averageSalary, months: [...] } */
function unwrapLastSixMonths(axiosRes) {
  const raw = axiosRes?.data;
  if (!raw || typeof raw !== 'object') return { averageSalary: 0, months: [] };
  const months = Array.isArray(raw.months) ? raw.months : [];
  const avg = Number(raw.averageSalary ?? 0);
  return {
    averageSalary: Number.isFinite(avg) ? avg : 0,
    months,
  };
}

const WaiterProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({
    fullname: 'Nhân viên',
    phone: '---',
    address: '---',
    email: '---',
    role: 'Phục vụ/Bếp',
    avatarUrl: '',
    dob: '',
    gender: '',
    bankName: '',
    bankAccountNumber: '',
  });

  const [salaryStats, setSalaryStats] = useState({
    estimatedSalary: 0,
    totalHours: 0,
    completedShifts: 0,
  });

  const [salaryTrend, setSalaryTrend] = useState([]);
  const [sixMonthAverageSalary, setSixMonthAverageSalary] = useState(0);
  const [salaryDetailNote, setSalaryDetailNote] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    fullname: '',
    phone: '',
    email: '',
    gender: '',
    dob: '',
    address: '',
    avatarUrl: '',
    bankAccountNumber: '',
    bankName: '',
  });

  const cloudName = 'dgjkqvbhm';
  const uploadPreset = 'unsigned_preset';

  const handleAvatarUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setEditForm((prev) => ({ ...prev, avatarUrl: data.secure_url }));
      }
    } catch (err) {
      alert('Lỗi upload ảnh đại diện!');
    }
  }, []);

  const fetchProfilePageData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      setSalaryDetailNote('');
      const [profileRes, monthDetailRes, sixMonthsRes, monthHoursRes, monthShiftsRes] = await Promise.allSettled([
        staffApi.getProfile(),
        salaryRecordAPI.getCurrentMonthDetail(),
        salaryRecordAPI.getLastSixMonths(),
        staffAPI.getSumTimeworkThisMonth(),
        staffAPI.getSumWorkshiftThisMonth(),
      ]);

      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value?.data?.data ?? profileRes.value?.data ?? {};
        const mapped = {
          fullname: pick(p, ['fullname', 'fullName', 'name'], 'Nhân viên'),
          phone: pick(p, ['phone', 'phoneNumber'], '---'),
          address: pick(p, ['address'], '---'),
          email: pick(p, ['email'], '---'),
          role: pick(p, ['position', 'role'], 'Phục vụ/Bếp'),
          avatarUrl: pick(p, ['avatarUrl', 'avatar', 'imageUrl'], ''),
          dob: pick(p, ['dob', 'dateOfBirth'], ''),
          gender: pick(p, ['gender'], ''),
          bankName: pick(p, ['bankName'], ''),
          bankAccountNumber: pick(p, ['bankAccountNumber'], ''),
        };
        setProfile(mapped);
        setEditForm({
          fullname: mapped.fullname || '',
          phone: mapped.phone === '---' ? '' : mapped.phone,
          email: mapped.email === '---' ? '' : mapped.email,
          gender: mapped.gender || '',
          dob: mapped.dob ? String(mapped.dob).slice(0, 10) : '',
          address: mapped.address === '---' ? '' : mapped.address,
          avatarUrl: mapped.avatarUrl || '',
          bankAccountNumber: mapped.bankAccountNumber || '',
          bankName: mapped.bankName || '',
        });
      }

      let detail = {};
      if (monthDetailRes.status === 'fulfilled') {
        detail = monthDetailRes.value?.data?.data ?? monthDetailRes.value?.data ?? {};
      } else {
        const status = monthDetailRes.reason?.response?.status;
        const msg = monthDetailRes.reason?.response?.data?.message;
        if (status === 404 && msg) {
          setSalaryDetailNote(String(msg));
        } else if (msg) {
          setSalaryDetailNote(String(msg));
        }
      }

      const totalHours = monthHoursRes.status === 'fulfilled'
        ? parseStaffMonthSum(monthHoursRes.value)
        : 0;
      const completedShifts = monthShiftsRes.status === 'fulfilled'
        ? parseStaffMonthSum(monthShiftsRes.value)
        : 0;

      const estimatedSalary = Number(
        pick(detail, ['estimatedSalary', 'actualSalary', 'salary', 'totalSalary'], 0)
      );

      setSalaryStats({
        estimatedSalary: Number.isFinite(estimatedSalary) ? estimatedSalary : 0,
        totalHours: Number.isFinite(totalHours) ? totalHours : 0,
        completedShifts: Number.isFinite(completedShifts) ? completedShifts : 0,
      });

      const { averageSalary: avgSix, months: trendItemsRaw } = sixMonthsRes.status === 'fulfilled'
        ? unwrapLastSixMonths(sixMonthsRes.value)
        : { averageSalary: 0, months: [] };
      setSixMonthAverageSalary(Number.isFinite(avgSix) ? avgSix : 0);

      const trend = trendItemsRaw.map((item, index) => {
        const salary = Number(pick(item, ['actualSalary', 'salary', 'totalSalary', 'income'], 0));
        return {
          month: normalizeMonthLabel(item, index),
          value: Number.isFinite(salary) ? salary : 0,
        };
      });

      setSalaryTrend(trend);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu hồ sơ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfilePageData();
  }, [fetchProfilePageData]);

  const maxSalary = useMemo(() => {
    if (!salaryTrend.length) return 1;
    return Math.max(...salaryTrend.map((x) => x.value), 1);
  }, [salaryTrend]);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await staffApi.updateProfile({
        fullname: editForm.fullname || null,
        phone: editForm.phone || null,
        email: editForm.email || null,
        gender: editForm.gender || null,
        dob: editForm.dob || null,
        address: editForm.address || null,
        avatar: editForm.avatarUrl || null, // Đổi thành avatar để backend nhận đúng
        bankAccountNumber: editForm.bankAccountNumber || null,
        bankName: editForm.bankName || null,
      });

      setShowEditModal(false);
      await fetchProfilePageData();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="waiter-orders-container waiter-profile-page">
      <header className="waiter-page-header">
        <div>
          <h2 className="waiter-page-title">Hồ sơ & Lương</h2>
          <p className="waiter-page-subtitle">
            Quản lý thông tin cá nhân và theo dõi thu nhập hàng tháng của bạn
          </p>
        </div>
      </header>

      {!!error && <div className="waiter-schedule-error">{error}</div>}

      {loading ? (
        <div className="waiter-profile-loading">
          <Loader2 size={20} className="waiter-spin" />
          Đang tải hồ sơ...
        </div>
      ) : (
        <>
          <section className="waiter-profile-card">
            <div className="waiter-profile-avatar-wrap">
              <img
                src={profile.avatarUrl || `https://i.pravatar.cc/320?u=${encodeURIComponent(profile.email || profile.fullname)}`}
                alt={profile.fullname}
              />
              <span className="waiter-profile-verified">
                <CheckCircle2 size={14} />
              </span>
            </div>

            <div className="waiter-profile-info-grid">
              <div>
                <p>Họ và tên</p>
                 <strong>{typeof profile.fullname === 'string' ? profile.fullname : (profile.fullname?.toString?.() || 'Đang tải...')}</strong>
              </div>
              <div> 
                <p>Số điện thoại</p>
                <strong>{typeof profile.phone === 'string' ? profile.phone : (profile.phone?.toString?.() || '---')}</strong>
              </div>
              <div className="full-row">
                <p>Địa chỉ thường trú</p>
                <strong>{profile.address}</strong>
              </div>
            </div>

            <button className="waiter-profile-edit-btn" type="button" onClick={() => setShowEditModal(true)}>
              <Edit3 size={16} />
              Cập nhật hồ sơ
            </button>
          </section>

          <section className="waiter-profile-stats-grid">
            <article className="waiter-profile-stat-card">
              <div className="icon orange"><Wallet size={18} /></div>
              <p>Lương dự tính (Tháng này)</p>
              <h4>{formatCurrency(salaryStats.estimatedSalary)}</h4>
              {salaryDetailNote ? (
                <span className="waiter-profile-stat-note">{salaryDetailNote}</span>
              ) : (
                <span className="trend muted"><TrendingUp size={12} /> Tháng hiện tại</span>
              )}
            </article>

            <article className="waiter-profile-stat-card">
              <div className="icon blue"><Clock3 size={18} /></div>
              <p>Tổng giờ làm (tháng này)</p>
              <h4>{salaryStats.totalHours} giờ</h4>
              <span className="trend muted">Theo ca đã đăng ký</span>
            </article>

            <article className="waiter-profile-stat-card">
              <div className="icon green"><CheckCircle2 size={18} /></div>
              <p>Số ca hoàn thành (tháng này)</p>
              <h4>{salaryStats.completedShifts} ca</h4>
              <span className="trend muted">Trong tháng hiện tại</span>
            </article>
          </section>

          <section className="waiter-profile-chart-card">
            <div className="waiter-profile-chart-head">
              <h3>
                <BarChart3 size={18} />
                Xu hướng lương 6 tháng gần nhất
              </h3>
              <div className="legend">
                <span className="dot"></span>
                <small>
                  Lương thực nhận
                  {sixMonthAverageSalary > 0 && (
                    <> · TB: {formatCurrency(sixMonthAverageSalary)}</>
                  )}
                </small>
              </div>
            </div>

            {salaryTrend.length === 0 ? (
              <p className="waiter-profile-chart-empty">Chưa có dữ liệu lương 6 tháng gần nhất.</p>
            ) : (
              <div
                className="waiter-salary-bars"
                style={{
                  gridTemplateColumns: `repeat(${salaryTrend.length}, minmax(0, 1fr))`,
                }}
              >
                {salaryTrend.map((item, index) => {
                  const height = Math.max((item.value / maxSalary) * 100, 8);
                  const isCurrent = index === salaryTrend.length - 1;
                  return (
                    <div key={`${item.month}-${index}`} className="waiter-salary-bar-col">
                      <div className={`waiter-salary-bar ${isCurrent ? 'is-current' : ''}`} style={{ height: `${height}%` }}>
                        <span>{(item.value / 1000000).toFixed(1)}M</span>
                      </div>
                      <p className={isCurrent ? 'is-current' : ''}>{item.month}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      {showEditModal && (
        <div className="waiter-profile-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="waiter-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="waiter-profile-modal-head">
              <h3>Cập nhật thông tin cá nhân</h3>
              <button type="button" onClick={() => setShowEditModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form className="waiter-profile-form" onSubmit={handleSaveProfile}>
              <div className="waiter-profile-form-content">
                <aside className="waiter-profile-form-avatar-panel">
                  <div className="waiter-profile-form-avatar">
                    <img
                      src={editForm.avatarUrl || profile.avatarUrl || `https://i.pravatar.cc/320?u=${encodeURIComponent(editForm.email || profile.email || profile.fullname)}`}
                      alt={profile.fullname}
                    />
                    <label className="waiter-profile-avatar-camera-btn" title="Chọn ảnh mới">
                      <Camera size={16} />
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                    </label>
                  </div>
                  <p>Ảnh đại diện</p>
                </aside>

                <div className="waiter-profile-form-sections">
                  <section className="waiter-profile-form-section">
                    <h4>
                      <User size={16} />
                      Thông tin cơ bản
                    </h4>

                    <div className="waiter-profile-form-grid">
                      <label>
                        <span>Họ và tên</span>
                        <input value={editForm.fullname} onChange={(e) => setEditForm((p) => ({ ...p, fullname: e.target.value }))} />
                      </label>

                      <label>
                        <span>Số điện thoại</span>
                        <input value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} />
                      </label>

                      <label className="full-row">
                        <span><Mail size={14} /> Email</span>
                        <input value={editForm.email} onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))} />
                      </label>

                      <label>
                        <span>Giới tính</span>
                        <select value={editForm.gender} onChange={(e) => setEditForm((p) => ({ ...p, gender: e.target.value }))}>
                          <option value="">Chọn giới tính</option>
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </label>

                      <label>
                        <span><CalendarDays size={14} /> Ngày sinh</span>
                        <input type="date" value={editForm.dob} onChange={(e) => setEditForm((p) => ({ ...p, dob: e.target.value }))} />
                      </label>

                      <label className="full-row">
                        <span><MapPin size={14} /> Địa chỉ thường trú</span>
                        <textarea rows={2} value={editForm.address} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}></textarea>
                      </label>

                      <label className="full-row">
                        <span>Avatar URL</span>
                        <input value={editForm.avatarUrl} onChange={(e) => setEditForm((p) => ({ ...p, avatarUrl: e.target.value }))} />
                      </label>
                    </div>
                  </section>

                  <section className="waiter-profile-form-section salary-block">
                    <h4>
                      <Building2 size={16} />
                      Thông tin nhận lương
                    </h4>
                    <div className="waiter-profile-form-grid">
                      <label>
                        <span><CreditCard size={14} /> Số tài khoản</span>
                        <input value={editForm.bankAccountNumber} onChange={(e) => setEditForm((p) => ({ ...p, bankAccountNumber: e.target.value }))} />
                      </label>

                      <label>
                        <span>Tên ngân hàng</span>
                        <input value={editForm.bankName} onChange={(e) => setEditForm((p) => ({ ...p, bankName: e.target.value }))} />
                      </label>
                    </div>
                  </section>
                </div>
              </div>

              <div className="waiter-profile-form-actions">
                <button type="button" className="ghost" onClick={() => setShowEditModal(false)}>Hủy</button>
                <button type="submit" className="primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="waiter-spin" /> : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterProfilePage;
