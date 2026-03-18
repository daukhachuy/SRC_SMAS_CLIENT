import React, { useMemo, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Boxes, Calendar, CalendarRange, CreditCard, LayoutDashboard, LogOut, Menu, ShoppingCart, Users, X } from 'lucide-react';
import NotificationDropdown from '../../components/NotificationDropdown';
import { useAuth } from '../../context/AuthContext';
import { getProfile } from '../../api/userApi';
import '../../styles/ManagerLayout.css';
import '../../styles/ManagerPages.css';

const ManagerLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({
    fullname: 'Manager',
    email: 'manager@fptres.vn',
    initials: 'MG'
  });

  const getInitials = (name) => {
    if (!name) return 'MG';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return words.map(w => w[0]).join('').toUpperCase();
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
          initials: getInitials(fallbackUser.fullname)
        });
      }

      try {
        const profile = await getProfile();
        const apiFullname = profile?.fullname || profile?.fullName || fallbackUser.fullname;
        const apiEmail = profile?.email || fallbackUser.email;

        if (!isMounted) return;

        setUserInfo({
          fullname: apiFullname,
          email: apiEmail,
          initials: getInitials(apiFullname)
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

  const navItems = useMemo(
    () => [
      { to: '/manager/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      { to: '/manager/orders', label: 'Đơn hàng', icon: ShoppingCart },
      { to: '/manager/tables', label: 'Bàn', icon: Calendar },
      { to: '/manager/reservations', label: 'Đặt bàn', icon: CalendarRange },
      { to: '/manager/staff', label: 'Nhân viên', icon: Users },
      { to: '/manager/inventory', label: 'Kho hàng', icon: Boxes },
      { to: '/manager/salary', label: 'Lương', icon: CreditCard }
    ],
    []
  );

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="manager-shell">
      <aside className={`manager-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="manager-brand">
          <div className="manager-brand-icon">F</div>
          <div>
            <h2>Nhà Hàng FPT</h2>
            <p>Hệ thống quản trị</p>
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
          <div className="manager-avatar">{userInfo.initials}</div>
          <div>
            <strong>{userInfo.fullname}</strong>
            <p>{userInfo.email}</p>
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
        <span className="manager-notification-badge" />
      </button>

      {/* Notification Dropdown */}
      <NotificationDropdown 
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </div>
  );
};

export default ManagerLayout;
