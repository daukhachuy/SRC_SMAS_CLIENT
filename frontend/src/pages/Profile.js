import React, { useState, useEffect, useRef } from 'react';
import '../styles/Profile.css';
import { getProfile, updateProfile, changePassword } from '../api/userApi';
import { myOrderAPI } from '../api/myOrderApi';
import { formatCurrency } from '../api/managerApi';

/** Chuẩn hóa dob từ API → yyyy-mm-dd (tránh lệch ngày do timezone) */
function normalizeDobFromApi(dob) {
  if (dob == null || dob === '') return '';
  if (typeof dob !== 'string') return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(dob)) return dob.split('T')[0];
  const m = dob.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d = m[1].padStart(2, '0');
    const mo = m[2].padStart(2, '0');
    const y = m[3];
    return `${y}-${mo}-${d}`;
  }
  return '';
}

/** yyyy-mm-dd → hiển thị dd/mm/yyyy */
function isoToDdMmYyyy(iso) {
  if (!iso || typeof iso !== 'string') return '';
  const s = iso.includes('T') ? iso.split('T')[0] : iso;
  const parts = s.split('-');
  if (parts.length !== 3) return '';
  const [y, m, day] = parts;
  if (!y || !m || !day) return '';
  return `${String(day).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

/** Chuỗi gõ (có hoặc không có /) → yyyy-mm-dd nếu hợp lệ */
function parseDdMmYyyyToIso(input) {
  if (!input || typeof input !== 'string') return '';
  const digits = input.replace(/\D/g, '');
  if (digits.length !== 8) return '';
  const d = parseInt(digits.slice(0, 2), 10);
  const mo = parseInt(digits.slice(2, 4), 10);
  const y = parseInt(digits.slice(4, 8), 10);
  if (y < 1900 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return '';
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return '';
  return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Mask khi gõ: dd/mm/yyyy */
function maskDobInput(value) {
  const d = value.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/**
 * Số điện thoại VN: 10 số bắt đầu bằng 0 (di động 03/05/07/08/09 hoặc cố định 02…)
 */
function isValidVietnamPhone(digits) {
  if (!digits || typeof digits !== 'string') return false;
  const d = digits.replace(/\D/g, '');
  if (!/^0\d{9}$/.test(d)) return false;
  const second = d.charAt(1);
  if (second === '0' || second === '1') return false;
  return true;
}

const Profile = () => {
  const [userInfo, setUserInfo] = useState({
    fullname: '',
    gender: 'Nam',
    phone: '',
    email: '',
    address: '',
    dob: ''
  });

  // ── Lịch sử đặt sự kiện ──
  const [eventOrders, setEventOrders] = useState([]);
  const [eventOrdersLoading, setEventOrdersLoading] = useState(false);
  const [eventOrdersError, setEventOrdersError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [dobInput, setDobInput] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ phone: '', dob: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const profileData = await getProfile();
        const fullname = (profileData.fullname && profileData.fullname !== 'string') ? profileData.fullname : '';
        const phone = (profileData.phone && profileData.phone !== 'string') ? (profileData.phone || '').replace('+84', '0') : '';
        const address = (profileData.address && profileData.address !== 'string') ? profileData.address : '';
        const dob = normalizeDobFromApi(profileData.dob);
        const gender = (profileData.gender && profileData.gender !== 'string') ? profileData.gender : 'Nam';

        setUserInfo({
          fullname,
          gender: gender === 'Nữ' ? 'Nữ' : 'Nam',
          phone,
          email: profileData.email || '',
          address,
          dob
        });
        setDobInput(isoToDdMmYyyy(dob));
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Không thể tải thông tin cá nhân. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Lấy lịch sử đặt sự kiện từ GET /api/book-event/history
  useEffect(() => {
    const fetchEventOrders = async () => {
      setEventOrdersLoading(true);
      setEventOrdersError('');
      try {
        const data = await myOrderAPI.getMyEvents();
        const list = Array.isArray(data) ? data : [];
        // Map raw data → UI-friendly shape
        const mapped = list.map(item => {
          const code = item.bookEventCode ?? item.eventCode ?? item.code ?? `EV-${item.id ?? ''}`;
          const date = item.bookingDate ?? item.eventDate ?? item.createdAt;
          const dateObj = date ? new Date(date) : null;
          const dateStr = dateObj && !Number.isNaN(dateObj.getTime())
            ? dateObj.toLocaleDateString('vi-VN') : '—';
          const timeStr = dateObj && !Number.isNaN(dateObj.getTime())
            ? dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
          const statusRaw = (item.status ?? item.contractStatus ?? '').toLowerCase();
          const statusMap = {
            pending:      { label: 'Chờ xác nhận',  cls: 'status-pending' },
            confirmed:    { label: 'Đã xác nhận',    cls: 'status-confirmed' },
            signed:       { label: 'Đã ký hợp đồng', cls: 'status-signed' },
            deposit:      { label: 'Chờ đặt cọc',    cls: 'status-deposit' },
            cancelled:    { label: 'Đã hủy',          cls: 'status-cancelled' },
            cancel:       { label: 'Đã hủy',          cls: 'status-cancelled' },
          };
          const st = statusMap[statusRaw] ?? { label: item.status ?? 'Chờ xác nhận', cls: 'status-pending' };
          return {
            id: item.bookEventId ?? item.eventId ?? item.id,
            code,
            eventType: item.eventType ?? '—',
            guestName: item.fullName ?? item.guestName ?? item.customerName ?? '—',
            phone: item.phone ?? '—',
            dateStr,
            timeStr,
            numberOfGuests: item.numberOfGuests ?? item.numberGuest ?? 0,
            numberOfTables: item.numberTable ?? item.numberOfTables ?? 0,
            totalAmount: item.totalAmount ?? item.estimatedRevenue ?? 0,
            status: st.label,
            statusCls: st.cls,
            services: item.services ?? [],
            menuItems: item.menuItems ?? item.foods ?? [],
            raw: item,
          };
        });
        setEventOrders(mapped);
      } catch (err) {
        console.warn('[Profile] Failed to load event orders:', err);
        setEventOrdersError('Không thể tải lịch sử đặt sự kiện.');
      } finally {
        setEventOrdersLoading(false);
      }
    };
    fetchEventOrders();
  }, []);

  const handleDobChange = (e) => {
    const masked = maskDobInput(e.target.value);
    setDobInput(masked);
    setFieldErrors((prev) => ({ ...prev, dob: '' }));
    const iso = parseDdMmYyyyToIso(masked);
    if (iso) {
      setUserInfo((prev) => ({ ...prev, dob: iso }));
    } else if (masked.replace(/\D/g, '').length === 0) {
      setUserInfo((prev) => ({ ...prev, dob: '' }));
    }
  };

  const handleDobBlur = () => {
    const digits = dobInput.replace(/\D/g, '');
    if (digits.length === 0) {
      setFieldErrors((prev) => ({ ...prev, dob: '' }));
      return;
    }
    const iso = parseDdMmYyyyToIso(dobInput);
    if (!iso) {
      setFieldErrors((prev) => ({
        ...prev,
        dob: 'Ngày sinh không hợp lệ. Dùng định dạng DD/MM/YYYY (ví dụ 20/10/2020).'
      }));
    } else {
      setFieldErrors((prev) => ({ ...prev, dob: '' }));
      setUserInfo((prev) => ({ ...prev, dob: iso }));
      setDobInput(isoToDdMmYyyy(iso));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      setFieldErrors((prev) => ({ ...prev, phone: '' }));
      setUserInfo({ ...userInfo, [name]: digits });
    } else {
      setUserInfo({ ...userInfo, [name]: value });
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!userInfo.fullname.trim()) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!userInfo.phone.trim()) {
      setError('Vui lòng nhập số điện thoại.');
      setFieldErrors((prev) => ({ ...prev, phone: 'Vui lòng nhập số điện thoại.' }));
      return;
    }
    // Xử lý ngày sinh - lấy từ userInfo.dob (đã được xử lý bởi handleDobChange/handleDobBlur)
    const dobFinal = userInfo.dob;
    if (!dobFinal) {
      const msg = 'Vui lòng nhập ngày sinh đúng định dạng DD/MM/YYYY.';
      setError(msg);
      setFieldErrors((prev) => ({ ...prev, dob: msg }));
      return;
    }
    if (!isValidVietnamPhone(userInfo.phone)) {
      const msg =
        'Số điện thoại không hợp lệ. Dùng 10 số (bắt đầu bằng 0), ví dụ: 0901234567 hoặc 0281234567.';
      setError(msg);
      setFieldErrors((prev) => ({ ...prev, phone: msg }));
      return;
    }
    const phone = userInfo.phone.startsWith('0') ? '+84' + userInfo.phone.slice(1) : userInfo.phone;
    try {
      setIsSubmitting(true);
      await updateProfile({
        ...userInfo,
        dob: dobFinal,
        phone,
      });
      setSuccessMessage('Cập nhật thông tin thành công!');
    } catch (err) {
      setError(err.message || 'Cập nhật thông tin thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    // Validation mật khẩu hiện tại
    if (!currentPassword || currentPassword.trim() === '') {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (currentPassword.length < 6) {
      setPasswordError('Mật khẩu hiện tại phải có ít nhất 6 ký tự.');
      return;
    }

    // Validation mật khẩu mới
    if (!newPassword || newPassword.length < 8) {
      setPasswordError('Mật khẩu mới phải dài ít nhất 8 ký tự.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Xác nhận mật khẩu không khớp.');
      return;
    }

    try {
      setChangingPassword(true);
      const response = await changePassword(currentPassword, newPassword);
      
      // Kiem tra response tu backend
      if (response && response.success === false) {
        const msg = response.message || response.error || '';
        if (msg.toLowerCase().includes('current') || msg.toLowerCase().includes('wrong') || msg.toLowerCase().includes('sai') || msg.toLowerCase().includes('incorrect')) {
          setPasswordError('Mật khẩu hiện tại không đúng. Vui lòng thử lại.');
          return;
        }
        setPasswordError(msg || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
        return;
      }
      
      // Thanh cong
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSuccess('Đổi mật khẩu thành công!');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err) {
      // Parse error tu response
      const errorData = err?.response?.data || {};
      const errorMsg = errorData.message || err.message || '';
      const status = err?.status || err?.response?.status;
      
      // Kiem tra cac truong hop loi cu the
      if (status === 400 || errorMsg.toLowerCase().includes('current') || errorMsg.toLowerCase().includes('wrong') || errorMsg.toLowerCase().includes('sai') || errorMsg.toLowerCase().includes('incorrect') || errorMsg.toLowerCase().includes('không đúng') || errorMsg.toLowerCase().includes('password')) {
        setPasswordError('Mật khẩu hiện tại không đúng. Vui lòng thử lại.');
      } else if (status === 401) {
        setPasswordError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else if (status === 403) {
        setPasswordError('Bạn không có quyền thực hiện thao tác này.');
      } else {
        setPasswordError(errorMsg || 'Đổi mật khẩu thất bại. Vui lòng thử lại.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  useEffect(() => {
    if (successMessage || error) {
      const t = setTimeout(() => { setSuccessMessage(''); setError(''); }, 5000);
      return () => clearTimeout(t);
    }
  }, [successMessage, error]);

  if (loading) {
    return (
      <div className="Profile-New-Wrapper">
        <div className="Profile-New-Card">
          <p className="Profile-Loading">Đang tải thông tin cá nhân...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="Profile-New-Wrapper">
      {error && <div className="Profile-Alert error">{error}</div>}
      {successMessage && <div className="Profile-Alert success">{successMessage}</div>}

      {/* 1. Thông tin cá nhân */}
      <section className="Profile-Section">
        <h2 className="Profile-Section-Title">
          <i className="fa-solid fa-user Profile-Section-Icon"></i>
          Thông tin cá nhân
        </h2>
        <form onSubmit={handleSaveProfile} className="Profile-Form-Block">
          <div className="Profile-Form-Grid">
            <div className="Profile-Field">
              <label>Họ và tên</label>
              <input type="text" name="fullname" value={typeof userInfo.fullname === 'string' ? userInfo.fullname : (userInfo.fullname?.toString?.() || '')} onChange={handleInputChange} placeholder="Họ và tên" />
            </div>
            <div className="Profile-Field">
              <label>Ngày sinh</label>
              <div className="Profile-Date-Input-Wrap">
                <input
                  type="text"
                  name="dob"
                  value={dobInput}
                  onChange={handleDobChange}
                  onBlur={handleDobBlur}
                  placeholder="DD/MM/YYYY"
                  maxLength={10}
                  className={`Profile-Date-Text-Input ${fieldErrors.dob ? 'Profile-Input-Error' : ''}`}
                  aria-invalid={!!fieldErrors.dob}
                />
                <button
                  type="button"
                  className="Profile-Date-Picker-Btn"
                  onClick={() => {
                    console.log('📅 Calendar button clicked');
                    try {
                      // Tạo input date tạm
                      const input = document.createElement('input');
                      input.type = 'date';
                      input.style.position = 'absolute';
                      input.style.left = '-9999px';
                      input.style.top = '-9999px';
                      input.style.opacity = '0';
                      document.body.appendChild(input);

                      console.log('📅 Picker created, focusing...');
                      input.focus();

                      // Timeout để đảm bảo focus đã được set
                      setTimeout(() => {
                        if (document.activeElement === input) {
                          console.log('📅 Input focused, showing picker');
                        } else {
                          console.log('📅 Input not focused, trying click');
                          input.click();
                        }
                      }, 100);

                      input.addEventListener('change', (e) => {
                        const val = e.target.value;
                        console.log('📅 Date selected:', val);
                        if (val) {
                          setUserInfo((prev) => ({ ...prev, dob: val }));
                          setDobInput(isoToDdMmYyyy(val));
                        }
                        setFieldErrors((prev) => ({ ...prev, dob: '' }));
                        document.body.removeChild(input);
                      });

                      input.addEventListener('blur', () => {
                        console.log('📅 Picker blurred');
                        if (document.body.contains(input)) {
                          document.body.removeChild(input);
                        }
                      });
                    } catch (err) {
                      console.error('📅 Error showing picker:', err);
                    }
                  }}
                  title="Chọn ngày từ lịch"
                >
                  <i className="fa-regular fa-calendar"></i>
                </button>
              </div>
              {fieldErrors.dob && <p className="Profile-Field-Error">{fieldErrors.dob}</p>}
            </div>
            <div className="Profile-Field">
              <label>Địa chỉ</label>
              <input
                type="text"
                name="address"
                autoComplete="street-address"
                value={typeof userInfo.address === 'string' ? userInfo.address : (userInfo.address?.toString?.() || '')}
                onChange={handleInputChange}
                placeholder="Ví dụ: 123 Nguyễn Huệ, Quận 1, TP.HCM"
                maxLength={200}
              />
            </div>
            <div className="Profile-Field">
              <label>Giới tính</label>
              <div className="Profile-Radio-Group">
                <label className={userInfo.gender === 'Nam' ? 'active' : ''}>
                  <input type="radio" name="gender" checked={userInfo.gender === 'Nam'} onChange={() => setUserInfo({ ...userInfo, gender: 'Nam' })} />
                  Nam
                </label>
                <label className={userInfo.gender === 'Nữ' ? 'active' : ''}>
                  <input type="radio" name="gender" checked={userInfo.gender === 'Nữ'} onChange={() => setUserInfo({ ...userInfo, gender: 'Nữ' })} />
                  Nữ
                </label>
              </div>
            </div>
            <div className="Profile-Field">
              <label>Số điện thoại</label>
              <input
                type="text"
                name="phone"
                inputMode="numeric"
                autoComplete="tel"
                value={typeof userInfo.phone === 'string' ? userInfo.phone : (userInfo.phone?.toString?.() || '')}
                onChange={handleInputChange}
                placeholder="Số điện thoại"
                maxLength={11}
                className={fieldErrors.phone ? 'Profile-Input-Error' : ''}
                aria-invalid={!!fieldErrors.phone}
              />
              {fieldErrors.phone && <p className="Profile-Field-Error">{fieldErrors.phone}</p>}
              <p className="Profile-Field-Hint">10 số, bắt đầu bằng 0 (di động hoặc cố định).</p>
            </div>
            <div className="Profile-Field Profile-Field-Full">
              <label>Email</label>
              <input type="email" value={typeof userInfo.email === 'string' ? userInfo.email : (userInfo.email?.toString?.() || '')} readOnly className="Profile-Input-Readonly" />
            </div>
            <div className="Profile-Field-Compact">
              <button type="button" className="Profile-Link-Edit" onClick={() => setShowPasswordModal(true)}>
                <i className="fa-solid fa-key"></i> Đổi mật khẩu
              </button>
            </div>
          </div>
          <div className="Profile-Form-Actions">
            <button type="submit" className="Profile-Btn Primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </section>

      {/* Modal Đổi mật khẩu */}
      {showPasswordModal && (
        <div className="AddressModal-Overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="PasswordModal-Box" onClick={(e) => e.stopPropagation()}>
            <div className="PasswordModal-Header">
              <button type="button" className="AddressModal-Back" onClick={() => setShowPasswordModal(false)} aria-label="Đóng">
                <i className="fa-solid fa-xmark"></i>
              </button>
              <h2 className="AddressModal-Title">Đổi mật khẩu</h2>
              <div style={{ width: 40 }}></div>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="PasswordModal-Body">
                {passwordError && <p className="PasswordModal-Message PasswordModal-Error">{passwordError}</p>}
                {passwordSuccess && <p className="PasswordModal-Message PasswordModal-Success">{passwordSuccess}</p>}
                <div className="PasswordModal-Field">
                  <label>Mật khẩu hiện tại</label>
                  <div className="PasswordModal-InputWrap">
                    <i className="fa-solid fa-lock"></i>
                    <input type={showPass.current ? 'text' : 'password'} placeholder="Nhập mật khẩu hiện tại" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
                    <button type="button" className="PasswordModal-PassToggle" onClick={() => setShowPass({ ...showPass, current: !showPass.current })}><i className={`fa-solid ${showPass.current ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                  </div>
                </div>
                <div className="PasswordModal-Field">
                  <label>Mật khẩu mới</label>
                  <div className="PasswordModal-InputWrap">
                    <i className="fa-solid fa-key"></i>
                    <input type={showPass.new ? 'text' : 'password'} placeholder="Nhập mật khẩu mới" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
                    <button type="button" className="PasswordModal-PassToggle" onClick={() => setShowPass({ ...showPass, new: !showPass.new })}><i className={`fa-solid ${showPass.new ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                  </div>
                </div>
                <div className="PasswordModal-Field">
                  <label>Xác nhận mật khẩu mới</label>
                  <div className="PasswordModal-InputWrap">
                    <i className="fa-solid fa-key"></i>
                    <input type={showPass.confirm ? 'text' : 'password'} placeholder="Nhập lại mật khẩu mới" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required />
                    <button type="button" className="PasswordModal-PassToggle" onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}><i className={`fa-solid ${showPass.confirm ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                  </div>
                </div>
              </div>
              <div className="PasswordModal-Footer">
                <button type="button" className="PasswordModal-BtnCancel" onClick={() => setShowPasswordModal(false)}>Hủy</button>
                <button type="submit" className="PasswordModal-BtnSave" disabled={changingPassword}>{changingPassword ? 'Đang xử lý...' : 'Xác nhận'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
