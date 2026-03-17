import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarRange,
  LayoutGrid,
  UtensilsCrossed,
  Boxes,
  Home,
  LogOut,
  Menu,
  X,
  UserCircle,
  Pencil,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/AdminLayout.css';

const navItems = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList },
  { to: '/admin/reservations', label: 'Đặt chỗ & Sự kiện', icon: CalendarRange },
  { to: '/admin/tables', label: 'Sơ đồ bàn', icon: LayoutGrid },
  { to: '/admin/menu', label: 'Thực đơn', icon: UtensilsCrossed },
  { to: '/admin/inventory', label: 'Kho hàng', icon: Boxes },
  { to: '/admin/accounts', label: 'Quản lý Tài khoản', icon: UserCircle },
  { to: '/admin/restaurant', label: 'Nhà hàng', icon: Home }
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({
    fullname: 'Admin User',
    initials: 'AD',
    email: 'admin.an@restaurant.vn',
    phone: '0987 654 321',
    gender: 'male',
    address: '123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh',
  });
  const [adminProfileOpen, setAdminProfileOpen] = useState(false);
  const [adminProfileForm, setAdminProfileForm] = useState({
    fullname: '',
    email: '',
    phone: '',
    gender: 'male',
    address: '',
    newPassword: '',
    confirmPassword: '',
  });

  const getInitials = (name) => {
    if (!name) return 'AD';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return words.map(w => w[0]).join('').toUpperCase();
  };

  useEffect(() => {
    // Không bắt buộc đăng nhập - lấy từ localStorage nếu có
    const loadUserInfo = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user?.fullname) {
            setUserInfo((prev) => ({
              ...prev,
              fullname: user.fullname,
              initials: getInitials(user.fullname),
              email: user.email || prev.email,
              phone: user.phone || prev.phone,
              address: user.address || prev.address,
              gender: user.gender || prev.gender,
            }));
          }
        }
      } catch (e) {
        console.log('Admin - không cần đăng nhập');
      }
    };
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (adminProfileOpen) {
      setAdminProfileForm({
        fullname: userInfo.fullname,
        email: userInfo.email || '',
        phone: userInfo.phone || '',
        gender: userInfo.gender || 'male',
        address: userInfo.address || '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [adminProfileOpen, userInfo.fullname, userInfo.email, userInfo.phone, userInfo.gender, userInfo.address]);

  const handleSaveAdminProfile = (e) => {
    e.preventDefault();
    setUserInfo((prev) => ({
      ...prev,
      fullname: adminProfileForm.fullname,
      initials: getInitials(adminProfileForm.fullname),
      email: adminProfileForm.email,
      phone: adminProfileForm.phone,
      gender: adminProfileForm.gender,
      address: adminProfileForm.address,
    }));
    setAdminProfileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="admin-shell">
      <button
        className="admin-menu-btn"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Toggle admin menu"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {menuOpen && <div className="admin-menu-overlay" onClick={() => setMenuOpen(false)} />}

      <aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-icon">R</div>
          <span className="admin-brand-text">RESTO ADMIN</span>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? false}
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''} ${item.to === '/admin/accounts' ? 'admin-nav-accounts' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <button type="button" className="admin-user-row admin-user-row-btn" onClick={() => setAdminProfileOpen(true)}>
            <div className="admin-avatar">
              <span className="text-sm font-semibold text-gray-600">{userInfo.initials}</span>
            </div>
            <div className="admin-user-info">
              <strong>{userInfo.fullname}</strong>
              <p>Quản trị viên</p>
            </div>
          </button>
          <button
            type="button"
            className="admin-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-content">
          <Outlet />
        </div>
      </main>

      {adminProfileOpen && (
        <div className="admin-profile-overlay" onClick={() => setAdminProfileOpen(false)}>
          <div className="admin-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-profile-modal-head">
              <h2 className="admin-profile-modal-title">Thông tin tài khoản Admin</h2>
              <button type="button" className="admin-profile-close" onClick={() => setAdminProfileOpen(false)} aria-label="Đóng"><X size={20} /></button>
            </div>
            <div className="admin-profile-avatar-wrap">
              <div className="admin-profile-avatar-box">
                <div className="admin-profile-avatar">
                  <User size={40} strokeWidth={1.5} />
                </div>
                <span className="admin-profile-avatar-edit" aria-hidden><Pencil size={14} /></span>
              </div>
              <p className="admin-profile-avatar-hint">Nhấn vào biểu tượng để thay đổi ảnh đại diện</p>
            </div>
            <form onSubmit={handleSaveAdminProfile} className="admin-profile-form">
              <div className="admin-profile-fields">
                <div className="admin-profile-field">
                  <label>Họ và Tên</label>
                  <input type="text" value={adminProfileForm.fullname} onChange={(e) => setAdminProfileForm((f) => ({ ...f, fullname: e.target.value }))} />
                </div>
                <div className="admin-profile-field">
                  <label>Email</label>
                  <input type="email" value={adminProfileForm.email} onChange={(e) => setAdminProfileForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="admin-profile-field">
                  <label>Số điện thoại</label>
                  <input type="text" value={adminProfileForm.phone} onChange={(e) => setAdminProfileForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="admin-profile-field">
                  <label>Giới tính</label>
                  <select value={adminProfileForm.gender} onChange={(e) => setAdminProfileForm((f) => ({ ...f, gender: e.target.value }))}>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div className="admin-profile-field admin-profile-field-full">
                  <label>Địa chỉ</label>
                  <input type="text" value={adminProfileForm.address} onChange={(e) => setAdminProfileForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
              </div>
              <h3 className="admin-profile-section-title">Đổi mật khẩu</h3>
              <div className="admin-profile-fields">
                <div className="admin-profile-field">
                  <label>Mật khẩu mới</label>
                  <input type="password" value={adminProfileForm.newPassword} onChange={(e) => setAdminProfileForm((f) => ({ ...f, newPassword: e.target.value }))} placeholder="••••••••" />
                </div>
                <div className="admin-profile-field">
                  <label>Nhập lại mật khẩu mới</label>
                  <input type="password" value={adminProfileForm.confirmPassword} onChange={(e) => setAdminProfileForm((f) => ({ ...f, confirmPassword: e.target.value }))} placeholder="••••••••" />
                </div>
              </div>
              <div className="admin-profile-actions">
                <button type="button" className="admin-profile-btn admin-profile-btn-cancel" onClick={() => setAdminProfileOpen(false)}>Hủy</button>
                <button type="submit" className="admin-profile-btn admin-profile-btn-save">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
