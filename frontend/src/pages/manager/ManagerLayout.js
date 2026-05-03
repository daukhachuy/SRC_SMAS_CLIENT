import React, { useMemo, useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Boxes, Calendar, CalendarRange, CreditCard, LayoutDashboard, LogOut, Menu, ShoppingCart, Users, X, User, Camera, IdCard, MessageCircle } from 'lucide-react';
import axios from 'axios';
import NotificationDropdown from '../../components/NotificationDropdown';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile } from '../../api/userApi';
import { staffApi } from '../../api/staffApi';
import { mapNotificationToUI, notificationAPI } from '../../api/managerApi';
import { conversationApi } from '../../api/conversationApi';
import '../../styles/ManagerLayout.css';
import '../../styles/ManagerPages.css';
import { ManagerToastProvider, useManagerToast } from '../../context/ManagerToastContext';
import { useUnreadNotificationSound } from '../../hooks/useUnreadNotificationSound';
import { useNotificationPushReload } from '../../hooks/useNotificationPushReload';

function ManagerLayoutInner() {
  const navigate = useNavigate();
  const { showToast } = useManagerToast();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const reloadNotificationsRef = useRef(() => Promise.resolve());
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [formData, setFormData] = useState({
    fullname: '',
    gender: '',
    dob: '',
    phone: '',
    address: '',
    avatar: ''
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [userInfo, setUserInfo] = useState({
    fullname: 'Manager',
    email: 'manager@fptres.vn',
    initials: 'MG',
    avatarUrl: ''
  });

  const getInitials = (name) => {
    if (!name) return 'MG';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return words.map(w => w[0]).join('').toUpperCase();
  };

  const asArray = (payload) => {
    let source = payload;
    if (typeof source === 'string') {
      try {
        source = JSON.parse(source);
      } catch {
        return [];
      }
    }

    if (Array.isArray(source)) return source;
    if (Array.isArray(source?.data)) return source.data;
    if (Array.isArray(source?.data?.$values)) return source.data.$values;
    if (Array.isArray(source?.$values)) return source.$values;
    if (Array.isArray(source?.items)) return source.items;
    if (Array.isArray(source?.notifications)) return source.notifications;
    if (source?.notificationId != null || source?.id != null) return [source];
    if (source?.data && (source.data.notificationId != null || source.data.id != null)) return [source.data];
    return [];
  };

  const getNotificationId = (item, idx = 0) => {
    const id = item?.id ?? item?.notificationId ?? item?.notificationID ?? item?.Id ?? item?.NotificationId;
    return id != null ? String(id) : `fallback-${idx}`;
  };

  // Cấu hình Cloudinary
  const cloudName = "dmzuier4p";
  const uploadPreset = "Image_profile";
  const folderName = "image_SEP490";

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Hiển thị ảnh tạm thời để người dùng thấy thay đổi ngay lập tức
    const localUrl = URL.createObjectURL(file);
    setFormData({ ...formData, avatar: localUrl });

    // Upload lên Cloudinary
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('upload_preset', uploadPreset);
    formDataUpload.append('folder', folderName);

    try {
      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        formDataUpload
      );

      const imageUrl = cloudinaryRes.data.secure_url;
      setFormData({ ...formData, avatar: imageUrl });
    } catch (error) {
      console.error("Lỗi upload avatar:", error);
      showToast('Không thể tải ảnh lên. Hãy kiểm tra lại kết nối!', 'error');
    }
  };

  // Load user info và ưu tiên email thật từ Profile API
  useEffect(() => {
    let isMounted = true;

    const loadUserInfo = async () => {
      let fallbackUser = {
        fullname: 'Manager',
        email: 'manager@fptres.vn'
      };

      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          fallbackUser = {
            fullname: user.fullname || 'Manager',
            email: user.email || 'manager@fptres.vn'
          };
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      if (isMounted) {
        setUserInfo({
          fullname: fallbackUser.fullname,
          email: fallbackUser.email,
          initials: getInitials(fallbackUser.fullname),
          avatarUrl: ''
        });
      }

      try {
        let apiFullname = fallbackUser.fullname;
        let apiEmail = fallbackUser.email;
        let apiAvatar = '';

        try {
          const res = await staffApi.getProfile();
          const profile = res?.data ?? res;
          apiFullname = profile?.fullName || profile?.fullname || apiFullname;
          apiEmail = profile?.email || apiEmail;
          apiAvatar = profile?.avatarUrl || profile?.avatar || '';
        } catch (staffErr) {
          const profile = await getProfile();
          apiFullname = profile?.fullname || profile?.fullName || apiFullname;
          apiEmail = profile?.email || apiEmail;
          apiAvatar = profile?.avatarUrl || profile?.avatar || '';
        }

        if (!isMounted) return;

        setUserInfo({
          fullname: apiFullname,
          email: apiEmail,
          initials: getInitials(apiFullname),
          avatarUrl: apiAvatar
        });

        if (userStr) {
          try {
            const localUser = JSON.parse(userStr);
            localStorage.setItem('user', JSON.stringify({
              ...localUser,
              fullname: apiFullname,
              email: apiEmail
            }));
          } catch {
            // Ignore localStorage merge errors
          }
        }
      } catch (error) {
        console.warn('Profile API unavailable, fallback to local user info:', error?.message || error);
      }

    };

    loadUserInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const [allRes, unreadRes] = await Promise.all([
          notificationAPI.getAll(),
          notificationAPI.getUnread(),
        ]);
        const allRows = asArray(allRes?.data);
        const unreadRows = asArray(unreadRes?.data);
        const unreadIdSet = new Set(unreadRows.map((item, idx) => getNotificationId(item, idx)));

        const hasExplicitReadFlag = allRows.some(
          (item) => item?.isRead != null || item?.read != null || item?.isSeen != null
        );
        const hasAnyReadInAll = allRows.some((item) =>
          Boolean(item?.isRead ?? item?.read ?? item?.isSeen ?? false)
        );
        const unreadSourceLooksBroken =
          allRows.length > 0 &&
          unreadIdSet.size === allRows.length &&
          hasExplicitReadFlag &&
          hasAnyReadInAll;

        const mapped = allRows.map((item, idx) => {
          const rowId = getNotificationId(item, idx);
          const base = mapNotificationToUI(item, idx);
          const isMarkedUnreadByEndpoint = !unreadSourceLooksBroken && unreadIdSet.has(rowId);
          return {
            ...base,
            id: base.id ?? rowId,
            isRead: isMarkedUnreadByEndpoint ? false : base.isRead,
          };
        });
        if (mounted) {
          setNotifications(mapped);
        }
      } catch (error) {
        console.error('Không tải được thông báo manager:', error);
        if (mounted) {
          setNotifications([]);
        }
      }
    };

    reloadNotificationsRef.current = loadNotifications;
    loadNotifications();
    const poll = window.setInterval(() => {
      void loadNotifications();
    }, 45000);
    return () => {
      mounted = false;
      window.clearInterval(poll);
    };
  }, []);

  useNotificationPushReload(reloadNotificationsRef);

  useEffect(() => {
    let mounted = true;

    const loadChatUnread = async () => {
      try {
        const rows = await conversationApi.getManagerConversationsMy();
        const unread = rows.reduce((sum, item) => sum + (Number(item.unreadCount || 0) || 0), 0);
        if (mounted) setChatUnread(unread);
      } catch {
        if (mounted) setChatUnread(0);
      }
    };

    loadChatUnread();
    const timer = setInterval(loadChatUnread, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const navItems = useMemo(
    () => [
      { to: '/manager/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      { to: '/manager/orders', label: 'Đơn hàng', icon: ShoppingCart },
      { to: '/manager/tables', label: 'Bàn', icon: Calendar },
      { to: '/manager/reservations', label: 'Đặt bàn', icon: CalendarRange },
      { to: '/manager/staff', label: 'Nhân viên', icon: Users },
      { to: '/manager/inventory', label: 'Kho hàng', icon: Boxes },
      { to: '/manager/salary', label: 'Lương', icon: CreditCard },
      { to: '/manager/chat', label: 'Chat khách hàng', icon: MessageCircle, badge: chatUnread }
    ],
    [chatUnread]
  );

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const openProfileModal = async () => {
    setProfileOpen(true);
    setProfileError('');
    setProfileSuccess('');
    setShowPasswordForm(false);
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });

    try {
      const profile = await getProfile();
      setFormData({
        fullname: profile.fullname || profile.fullName || '',
        gender: profile.gender || '',
        dob: profile.dob ? profile.dob.split('T')[0] : '',
        phone: profile.phone || '',
        address: profile.address || '',
        avatar: profile.avatar || ''
      });
    } catch (error) {
      setProfileError('Không tải được thông tin profile');
    }
  };

  const closeProfileModal = () => {
    setProfileOpen(false);
    setProfileError('');
    setProfileSuccess('');
    setShowPasswordForm(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      await updateProfile(formData);
      setProfileSuccess('Cập nhật thông tin thành công!');

      const newInitials = getInitials(formData.fullname);
      setUserInfo((prev) => ({
        ...prev,
        fullname: formData.fullname,
        email: prev.email,
        initials: newInitials,
        avatarUrl: formData.avatar || prev.avatarUrl
      }));

      const userStr = localStorage.getItem('user');
      if (userStr) {
        const localUser = JSON.parse(userStr);
        localStorage.setItem('user', JSON.stringify({ ...localUser, fullname: formData.fullname, avatar: formData.avatar }));
      }

      setTimeout(() => {
        setProfileSuccess('');
      }, 3000);
    } catch (error) {
      setProfileError(error.message || 'Cập nhật thất bại');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setProfileError('Mật khẩu mới không khớp');
      return;
    }

    setProfileLoading(true);
    setProfileError('');

    try {
      await updateProfile({ ...formData, ...passwordData });
      setProfileSuccess('Đổi mật khẩu thành công!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (error) {
      setProfileError(error.message || 'Đổi mật khẩu thất bại');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="manager-shell">
      <aside className={`manager-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="manager-brand">
          <div className="manager-brand-icon">F</div>
          <div>
            <h2>Nhà Hàng SMAS</h2>
            <p>Hệ thống quản lý</p>
          </div>
        </div>

        <nav className="manager-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `manager-nav-item ${isActive ? 'active' : ''}`
                }
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.badge > 0 ? (
                  <span className="manager-nav-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div
          className="manager-sidebar-footer manager-sidebar-footer--clickable"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/manager/profile')}
          title="Xem trang cá nhân"
        >
          <div className="manager-avatar">
            {userInfo.avatarUrl ? (
              <img src={userInfo.avatarUrl} alt="" className="manager-avatar-img" />
            ) : (
              userInfo.initials
            )}
          </div>
          <div>
            <strong>{typeof userInfo.fullname === 'string' ? userInfo.fullname : (userInfo.fullname?.toString?.() || 'Đang tải...')}</strong>
            <p>{typeof userInfo.email === 'string' ? userInfo.email : (userInfo.email?.toString?.() || 'Đang tải...')}</p>
          </div>
        </div>

        <button className="manager-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </aside>

      {/* Mobile Menu Button */}
      <button
        className="manager-menu-btn"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Toggle manager menu"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {menuOpen && <div className="manager-overlay" onClick={() => setMenuOpen(false)} />}

      <main className="manager-main">
        <section className="manager-content">
          <Outlet />
        </section>
      </main>

      {/* Floating Notification Button */}
      <button 
        className="manager-floating-notification" 
        aria-label="Notifications"
        onClick={() => setNotificationOpen(!notificationOpen)}
      >
        <Bell size={20} />
        {unreadNotificationCount > 0 && (
          <span className="manager-notification-badge">{unreadNotificationCount}</span>
        )}
      </button>

      {/* Notification Dropdown */}
      <NotificationDropdown
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        notifications={notifications}
        onNotificationsChange={setNotifications}
      />

      {/* Profile Modal */}
      {profileOpen && (
        <div className="modal-overlay" onClick={closeProfileModal}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h2>
                <IdCard size={20} />
                Hồ sơ cá nhân
              </h2>
              <button className="modal-close" onClick={closeProfileModal}>
                <X size={20} />
              </button>
            </div>

            <div className="profile-modal-body">
              {profileError && <div className="profile-error">{profileError}</div>}
              {profileSuccess && <div className="profile-success">{profileSuccess}</div>}

              {!showPasswordForm ? (
                <form onSubmit={handleUpdateProfile}>
                  <div className="profile-avatar-section">
                    <div className="profile-avatar-large">
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Avatar" />
                      ) : (
                        <span>{formData.fullname ? getInitials(formData.fullname) : 'U'}</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        style={{ display: 'none' }}
                        id="avatar-upload"
                      />
                      <button type="button" className="avatar-camera-btn" onClick={() => document.getElementById('avatar-upload').click()}>
                        <Camera size={14} />
                      </button>
                    </div>
                    <p className="profile-name-display">{formData.fullname || 'Chưa có tên'}</p>
                  </div>

                  <div className="profile-form-grid">
                    <div className="form-group">
                      <label>Họ và tên</label>
                      <input
                        type="text"
                        value={formData.fullname}
                        onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Giới tính</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="Male">Nam</option>
                        <option value="Female">Nữ</option>
                        <option value="Other">Khác</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Ngày sinh</label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label>Số điện thoại</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Địa chỉ</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="profile-modal-actions">
                    <button type="button" className="btn-password" onClick={() => setShowPasswordForm(true)}>
                      Đổi mật khẩu
                    </button>
                    <button type="submit" className="btn-save" disabled={profileLoading}>
                      {profileLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleChangePassword}>
                  <h3 className="password-form-title">Đổi mật khẩu</h3>

                  <div className="password-form-grid">
                    <div className="form-group">
                      <label>Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Mật khẩu mới</label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="form-group">
                      <label>Nhập lại mật khẩu mới</label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="profile-modal-actions">
                    <button type="button" className="btn-cancel" onClick={() => setShowPasswordForm(false)}>
                      Hủy
                    </button>
                    <button type="submit" className="btn-save" disabled={profileLoading}>
                      {profileLoading ? 'Đang lưu...' : 'Xác nhận'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ManagerLayout() {
  return (
    <ManagerToastProvider>
      <ManagerLayoutInner />
    </ManagerToastProvider>
  );
}
