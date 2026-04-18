import React, { useState, useEffect } from 'react';
import '../styles/Profile.css';
import { getProfile, updateProfile } from '../api/userApi';
import { myOrderAPI } from '../api/myOrderApi';
import { formatCurrency } from '../api/managerApi';
import CustomerNoticeModal from '../components/CustomerNoticeModal';

/** Strips legacy "|@lat,lng" suffix if present (old saved addresses). */
function stripLegacyGpsSuffix(text) {
  return String(text || '').replace(/\|@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\s*$/, '').trim();
}

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

  const [addresses, setAddresses] = useState([]);

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
  /** Hiển thị ngày sinh dạng DD/MM/YYYY khi gõ (đồng bộ với userInfo.dob dạng ISO) */
  const [dobInput, setDobInput] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ phone: '', dob: '' });
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [customerNotice, setCustomerNotice] = useState(null);
  const [newAddress, setNewAddress] = useState({
    street: '',
    district: '',
    city: '',
    addressType: 'Nhà riêng',
    memorableName: '',
    phone: '',
    setAsDefault: false
  });
  const [provinceOptions, setProvinceOptions] = useState([]);
  const [districtOptions, setDistrictOptions] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        const profileData = await getProfile();
        const fullname = (profileData.fullname && profileData.fullname !== 'string') ? profileData.fullname : '';
        const phone = (profileData.phone && profileData.phone !== 'string') ? (profileData.phone || '').replace('+84', '0') : '';
        const address = (profileData.address && profileData.address !== 'string') ? profileData.address : '';
        const addressDisplay = stripLegacyGpsSuffix(address);
        const dob = normalizeDobFromApi(profileData.dob);
        const gender = (profileData.gender && profileData.gender !== 'string') ? profileData.gender : 'Nam';

        setUserInfo({
          fullname,
          gender: gender === 'Nữ' ? 'Nữ' : 'Nam',
          phone,
          email: profileData.email || '',
          address: addressDisplay,
          dob
        });
        setDobInput(isoToDdMmYyyy(dob));

        if (address || phone) {
          setAddresses([
            { id: 'default', label: 'Nhà riêng', address: address || '—', phone: phone || '—', isDefault: true }
          ]);
        } else {
          setAddresses([]);
        }
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
            pending:      { label: 'Chờ duyệt',       cls: 'status-pending' },
            approved:     { label: 'Đã duyệt',        cls: 'status-confirmed' },
            rejected:     { label: 'Đã từ chối',      cls: 'status-cancelled' },
            active:       { label: 'Đang hoạt động',  cls: 'status-signed' },
            completed:    { label: 'Hoàn thành',      cls: 'status-signed' },
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
            numberOfTables:
              item.numberTable ?? item.numberOfTables ?? item.numberOfGuests ?? item.numberGuest ?? 0,
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
    const dobFinal = parseDdMmYyyyToIso(dobInput) || userInfo.dob;
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
    const defaultAddr = addresses.find(a => a.isDefault);
    try {
      setIsSubmitting(true);
      await updateProfile({
        ...userInfo,
        dob: dobFinal,
        phone,
        address: defaultAddr ? defaultAddr.address : userInfo.address
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
    setError('');
    setSuccessMessage('');
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!newPassword || newPassword.length < 8) {
      setError('Mật khẩu mới phải dài ít nhất 8 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }
    try {
      setIsPasswordSubmitting(true);
      await updateProfile({
        ...userInfo,
        oldPassword: currentPassword,
        confirmPassword: newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccessMessage('Cập nhật mật khẩu thành công!');
    } catch (err) {
      setError(err.message || 'Cập nhật mật khẩu thất bại.');
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  const normalizeAddressText = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .toLowerCase()
      .trim();

  const getMatchedProvinceName = (raw, options = provinceOptions) => {
    const normalizedRaw = normalizeAddressText(raw);
    if (!normalizedRaw) return '';

    const direct = options.find((p) => normalizeAddressText(p.name) === normalizedRaw);
    if (direct) return direct.name;

    const byContains = options.find((p) => {
      const n = normalizeAddressText(p.name);
      return normalizedRaw.includes(n) || n.includes(normalizedRaw);
    });
    if (byContains) return byContains.name;

    // fallback các cách ghi phổ biến
    if (normalizedRaw.includes('hcm') || normalizedRaw.includes('ho chi minh')) return 'Thành phố Hồ Chí Minh';
    if (normalizedRaw.includes('ha noi')) return 'Thành phố Hà Nội';
    if (normalizedRaw.includes('da nang')) return 'Thành phố Đà Nẵng';
    return '';
  };

  useEffect(() => {
    if (!showAddAddressModal || provinceOptions.length > 0) return;

    const fetchProvinces = async () => {
      try {
        const res = await fetch('https://provinces.open-api.vn/api/p/');
        const data = await res.json();
        const rows = Array.isArray(data) ? data : [];
        const mapped = rows
          .map((p) => ({ code: Number(p.code), name: String(p.name || '').trim() }))
          .filter((p) => p.code > 0 && p.name);
        if (mapped.length > 0) {
          setProvinceOptions(mapped);
          return;
        }
      } catch (err) {
        console.warn('Không tải được danh sách tỉnh/thành từ API:', err);
      }
      setProvinceOptions([
        { code: 79, name: 'Thành phố Hồ Chí Minh' },
        { code: 1, name: 'Thành phố Hà Nội' },
        { code: 48, name: 'Thành phố Đà Nẵng' },
      ]);
    };

    fetchProvinces();
  }, [showAddAddressModal, provinceOptions.length]);

  useEffect(() => {
    if (!showAddAddressModal || !newAddress.city) {
      setDistrictOptions([]);
      return;
    }

    const province = provinceOptions.find((p) => p.name === newAddress.city);
    if (!province?.code) {
      setDistrictOptions([]);
      return;
    }

    const fetchDistricts = async () => {
      try {
        const res = await fetch(`https://provinces.open-api.vn/api/p/${province.code}?depth=2`);
        const data = await res.json();
        const districts = Array.isArray(data?.districts) ? data.districts : [];
        const mapped = districts
          .map((d) => String(d?.name || '').trim())
          .filter(Boolean);
        setDistrictOptions(mapped);
      } catch (err) {
        console.warn('Không tải được danh sách quận/huyện:', err);
        setDistrictOptions([]);
      }
    };

    fetchDistricts();
  }, [showAddAddressModal, newAddress.city, provinceOptions]);

  const handleAddAddress = () => {
    setEditingAddressId(null);
    setNewAddress({
      street: '',
      district: '',
      city: '',
      addressType: 'Nhà riêng',
      memorableName: '',
      phone: userInfo.phone || '',
      setAsDefault: false
    });
    setShowAddAddressModal(true);
  };

  const handleCloseAddAddressModal = () => {
    setShowAddAddressModal(false);
    setEditingAddressId(null);
  };

  const handleEditAddress = (id) => {
    const target = addresses.find((a) => String(a.id) === String(id));
    if (!target) return;
    const textClean = stripLegacyGpsSuffix(target.address);
    const parts = String(textClean || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
    const cityRaw = parts.length > 0 ? parts[parts.length - 1] : '';
    const cityNormalized = getMatchedProvinceName(cityRaw);
    const district = parts.length > 1 ? parts[parts.length - 2] : '';
    const street = parts.length > 2 ? parts.slice(0, -2).join(', ') : (parts[0] || '');
    setEditingAddressId(target.id);
    setNewAddress({
      street,
      district,
      city: cityNormalized || '',
      addressType: target.label === 'Văn phòng' || target.label === 'Khác' ? target.label : 'Nhà riêng',
      memorableName:
        target.label === 'Nhà riêng' || target.label === 'Văn phòng' || target.label === 'Khác'
          ? ''
          : String(target.label || ''),
      phone: String(target.phone || '').replace(/\D/g, ''),
      setAsDefault: !!target.isDefault
    });
    setShowAddAddressModal(true);
  };

  const handleSaveNewAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.city) {
      setError('Vui lòng chọn Thành phố/Tỉnh.');
      return;
    }
    if (!newAddress.district) {
      setError('Vui lòng chọn Quận/Huyện.');
      return;
    }
    const fullAddress = [newAddress.street, newAddress.district, newAddress.city].filter(Boolean).join(', ');
    const label = newAddress.addressType;
    const name = newAddress.memorableName.trim() || label;
    const isDefault = newAddress.setAsDefault || addresses.length === 0;
    let next = [...addresses];
    if (isDefault) next = next.map(a => ({ ...a, isDefault: false }));
    const updatedAddress = {
      id: editingAddressId ?? Date.now(),
      label: name,
      address: fullAddress.trim() ? fullAddress : '—',
      phone: newAddress.phone || userInfo.phone || '—',
      isDefault
    };
    if (editingAddressId != null) {
      next = next.map((a) => (String(a.id) === String(editingAddressId) ? updatedAddress : a));
    } else {
      next.push(updatedAddress);
    }
    const defaultAddr = next.find((a) => a.isDefault) || updatedAddress;
    const phone = userInfo.phone.startsWith('0') ? '+84' + userInfo.phone.slice(1) : userInfo.phone;

    try {
      setIsSubmitting(true);
      await updateProfile({
        ...userInfo,
        phone,
        address: defaultAddr?.address || userInfo.address || ''
      });
      setAddresses(next);
      setUserInfo((prev) => ({
        ...prev,
        address: stripLegacyGpsSuffix(defaultAddr?.address || prev.address),
      }));
      setShowAddAddressModal(false);
      setEditingAddressId(null);
      setSuccessMessage(editingAddressId != null ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ mới.');
    } catch (err) {
      setError(err.message || 'Không thể lưu địa chỉ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setDefaultAddress = (id) => {
    setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));
  };

  const removeAddress = (id) => {
    const next = addresses.filter(a => a.id !== id);
    if (next.length === 0) return;
    const hadDefault = addresses.find(a => a.id === id)?.isDefault;
    if (hadDefault && next.length > 0) next[0].isDefault = true;
    setAddresses(next);
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
          <i className="fa-solid fa-location-dot Profile-Section-Icon"></i>
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
              <div className="Profile-Input-With-Icon">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="bday"
                  name="dob"
                  value={dobInput}
                  onChange={handleDobChange}
                  onBlur={handleDobBlur}
                  placeholder="DD/MM/YYYY"
                  maxLength={10}
                  className={fieldErrors.dob ? 'Profile-Input-Error' : ''}
                  aria-invalid={!!fieldErrors.dob}
                />
                <i className="fa-regular fa-calendar Profile-Field-Icon"></i>
              </div>
              {fieldErrors.dob && <p className="Profile-Field-Error">{fieldErrors.dob}</p>}
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
          </div>
          <div className="Profile-Form-Actions">
            <button type="submit" className="Profile-Btn Primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </section>

      {/* 2. Địa chỉ giao hàng */}
      <section className="Profile-Section">
        <div className="Profile-Section-Header">
          <h2 className="Profile-Section-Title">
            <i className="fa-solid fa-location-dot Profile-Section-Icon"></i>
            Địa chỉ giao hàng
          </h2>
          <button type="button" className="Profile-Link-Add" onClick={handleAddAddress}>
            <i className="fa-solid fa-location-dot"></i> Thêm địa chỉ mới
          </button>
        </div>
        <div className="Profile-Address-List">
          {addresses.map((addr) => (
            <div key={addr.id} className={`Profile-Address-Card ${addr.isDefault ? 'Default' : ''}`}>
              <div className="Profile-Address-Icon">
                <i className={addr.label === 'Văn phòng' ? 'fa-solid fa-briefcase' : addr.label === 'Khác' ? 'fa-solid fa-location-dot' : 'fa-solid fa-house'}></i>
              </div>
              <div className="Profile-Address-Body">
                <div className="Profile-Address-Row">
                  <span className="Profile-Address-Label">{addr.label}</span>
                  {addr.isDefault && <span className="Profile-Address-Default">MẶC ĐỊNH</span>}
                </div>
                <p className="Profile-Address-Text">{stripLegacyGpsSuffix(addr.address)}</p>
                <p className="Profile-Address-Phone">SĐT: {typeof addr.phone === 'string' ? addr.phone : (addr.phone?.toString?.() || '---')}</p>
              </div>
              <div className="Profile-Address-Actions">
                <button type="button" className="Profile-Address-Action" title="Sửa" onClick={() => handleEditAddress(addr.id)}><i className="fa-solid fa-pencil"></i></button>
                <button type="button" className="Profile-Address-Action" title="Xóa" onClick={() => removeAddress(addr.id)}><i className="fa-regular fa-trash-can"></i></button>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* 4. Đổi mật khẩu */}
      <section className="Profile-Section">
        <h2 className="Profile-Section-Title">
          <i className="fa-solid fa-lock Profile-Section-Icon"></i>
          Đổi mật khẩu
        </h2>
        <form onSubmit={handleChangePassword} className="Profile-Form-Block">
          <div className="Profile-Password-Fields">
            <div className="Profile-Field">
              <label>Mật khẩu hiện tại</label>
              <div className="Profile-Input-With-Icon">
                <input
                  type={showPass.current ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="********"
                />
                <i className={`fa-solid ${showPass.current ? 'fa-eye' : 'fa-eye-slash'} Profile-TogglePass`} onClick={() => setShowPass({ ...showPass, current: !showPass.current })}></i>
              </div>
            </div>
            <div className="Profile-Field">
              <label>Mật khẩu mới</label>
              <div className="Profile-Input-With-Icon">
                <input
                  type={showPass.new ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="********"
                />
                <i className={`fa-solid ${showPass.new ? 'fa-eye' : 'fa-eye-slash'} Profile-TogglePass`} onClick={() => setShowPass({ ...showPass, new: !showPass.new })}></i>
              </div>
            </div>
            <div className="Profile-Field">
              <label>Xác nhận mật khẩu</label>
              <div className="Profile-Input-With-Icon">
                <input
                  type={showPass.confirm ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="********"
                />
                <i className={`fa-solid ${showPass.confirm ? 'fa-eye' : 'fa-eye-slash'} Profile-TogglePass`} onClick={() => setShowPass({ ...showPass, confirm: !showPass.confirm })}></i>
              </div>
            </div>
          </div>
          <p className="Profile-Password-Hint">Mật khẩu phải dài ít nhất 8 ký tự, bao gồm chữ cái và số.</p>
          <div className="Profile-Form-Actions">
            <button type="submit" className="Profile-Btn Primary" disabled={isPasswordSubmitting}>
              {isPasswordSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </div>
        </form>
      </section>

      {/* Modal Thêm địa chỉ mới - layout rộng cho máy tính */}
      {showAddAddressModal && (
        <div className="AddressModal-Overlay" onClick={handleCloseAddAddressModal}>
          <div className="AddressModal-Box" onClick={(e) => e.stopPropagation()}>
            <div className="AddressModal-Header">
              <button type="button" className="AddressModal-Back" onClick={handleCloseAddAddressModal} aria-label="Đóng">
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <h2 className="AddressModal-Title">{editingAddressId != null ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>
              <button type="button" className="AddressModal-Help">Trợ giúp</button>
            </div>
            <form onSubmit={handleSaveNewAddress}>
              <div className="AddressModal-Body">
                <div className="AddressModal-FormCol">
                  <div className="AddressModal-Field">
                    <label>SỐ NHÀ, TÊN ĐƯỜNG</label>
                    <div className="AddressModal-InputWrap">
                      <i className="fa-solid fa-house AddressModal-InputIcon"></i>
                      <input
                        type="text"
                        placeholder="Ví dụ: 123 Nguyễn Huệ"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="AddressModal-Row">
                    <div className="AddressModal-Field">
                      <label>THÀNH PHỐ</label>
                      <select
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value, district: '' })}
                      >
                        <option value="">Chọn Thành phố</option>
                        {provinceOptions.map((province) => (
                          <option key={province.code} value={province.name}>{province.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="AddressModal-Field">
                      <label>QUẬN / HUYỆN</label>
                      <select
                        value={newAddress.district}
                        onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                        disabled={!newAddress.city}
                      >
                        <option value="">{newAddress.city ? 'Chọn Quận/Huyện' : 'Chọn Thành phố trước'}</option>
                        {districtOptions.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="AddressModal-Field">
                    <label>TÊN ĐỊA CHỈ</label>
                    <div className="AddressModal-TypeGroup">
                      <button
                        type="button"
                        className={`AddressModal-TypeBtn ${newAddress.addressType === 'Nhà riêng' ? 'active' : ''}`}
                        onClick={() => setNewAddress({ ...newAddress, addressType: 'Nhà riêng' })}
                      >
                        <i className="fa-solid fa-house"></i> Nhà riêng
                      </button>
                      <button
                        type="button"
                        className={`AddressModal-TypeBtn ${newAddress.addressType === 'Văn phòng' ? 'active' : ''}`}
                        onClick={() => setNewAddress({ ...newAddress, addressType: 'Văn phòng' })}
                      >
                        <i className="fa-solid fa-briefcase"></i> Văn phòng
                      </button>
                      <button
                        type="button"
                        className={`AddressModal-TypeBtn ${newAddress.addressType === 'Khác' ? 'active' : ''}`}
                        onClick={() => setNewAddress({ ...newAddress, addressType: 'Khác' })}
                      >
                        <i className="fa-solid fa-plus"></i> Khác
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Tên gợi nhớ (Ví dụ: Nhà nội, Studio...)"
                      value={newAddress.memorableName}
                      onChange={(e) => setNewAddress({ ...newAddress, memorableName: e.target.value })}
                      className="AddressModal-InputNoIcon"
                    />
                  </div>
                  <div className="AddressModal-Field">
                    <label>SỐ ĐIỆN THOẠI NGƯỜI NHẬN</label>
                    <div className="AddressModal-InputWrap">
                      <i className="fa-solid fa-phone AddressModal-InputIcon"></i>
                      <input
                        type="text"
                        placeholder="09xx xxx xxx"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value.replace(/\D/g, '') })}
                        maxLength={11}
                      />
                    </div>
                    <p className="AddressModal-Hint">
                      Tài xế sẽ liên hệ số này khi giao hàng
                    </p>
                  </div>
                  <label className="AddressModal-Checkbox">
                    <input
                      type="checkbox"
                      checked={newAddress.setAsDefault}
                      onChange={(e) => setNewAddress({ ...newAddress, setAsDefault: e.target.checked })}
                    />
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>
              </div>
              <div className="AddressModal-Footer">
                <button type="button" className="AddressModal-BtnCancel" onClick={handleCloseAddAddressModal}>
                  Hủy bỏ
                </button>
                <button type="submit" className="AddressModal-BtnSave">
                  {editingAddressId != null ? 'Lưu thay đổi' : 'Lưu địa chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CustomerNoticeModal
        config={customerNotice}
        onRequestClose={() => setCustomerNotice(null)}
      />
    </div>
  );
};

export default Profile;
