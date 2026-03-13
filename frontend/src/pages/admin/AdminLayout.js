import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarRange,
  LayoutGrid,
  UtensilsCrossed,
  Boxes,
  Users,
  Home,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getProfile } from '../../api/userApi';
import '../../styles/AdminLayout.css';

const navItems = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList },
  { to: '/admin/reservations', label: 'Đặt chỗ & Sự kiện', icon: CalendarRange },
  { to: '/admin/tables', label: 'Sơ đồ bàn', icon: LayoutGrid },
  { to: '/admin/menu', label: 'Thực đơn', icon: UtensilsCrossed },
  { to: '/admin/inventory', label: 'Kho hàng', icon: Boxes },
  { to: '/admin/staff', label: 'Nhân viên', icon: Users },
  { to: '/admin/restaurant', label: 'Nhà hàng', icon: Home }
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({
    fullname: 'Admin User',
    initials: 'AD',
    avatarUrl: null
  });

  const getInitials = (name) => {
    if (!name) return 'AD';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return words.map(w => w[0]).join('').toUpperCase();
  };

  useEffect(() => {
    let isMounted = true;
    const loadUserInfo = async () => {
      let fallback = { fullname: 'Admin User' };
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          fallback = { fullname: user.fullname || 'Admin User' };
        }
      } catch (e) {
        console.error('Error parsing user:', e);
      }
      try {
        const profile = await getProfile();
        const name = profile?.fullname || profile?.fullName || fallback.fullname;
        const avatarUrl = profile?.avatarUrl || profile?.avatar || profile?.picture || null;
        if (isMounted) setUserInfo({ fullname: name, initials: getInitials(name), avatarUrl });
      } catch {
        if (isMounted) setUserInfo({ fullname: fallback.fullname, initials: getInitials(fallback.fullname), avatarUrl: null });
      }
    };
    loadUserInfo();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="admin-shell">
      <button
        type="button"
        className="admin-menu-btn"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Toggle admin menu"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {menuOpen && <div className="admin-menu-overlay" onClick={() => setMenuOpen(false)} aria-hidden />}

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
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={20} className="admin-nav-icon" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-row">
            <div className="admin-avatar">
              {userInfo.avatarUrl ? (
                <img src={userInfo.avatarUrl} alt="" />
              ) : (
                <span>{userInfo.initials}</span>
              )}
            </div>
            <div className="admin-user-info">
              <strong>{userInfo.fullname}</strong>
              <p>Quản trị viên</p>
            </div>
          </div>
          <button
            type="button"
            className="admin-logout-btn"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
