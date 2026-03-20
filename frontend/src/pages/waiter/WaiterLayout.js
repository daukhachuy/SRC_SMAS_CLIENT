import React, { useMemo, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Calendar, ClipboardList, LogOut, Menu, User, X, QrCode } from 'lucide-react';
import NotificationDropdown from '../../components/NotificationDropdown';
import { getProfile } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import '../../styles/WaiterLayout.css';
import '../../styles/WaiterPages.css';

const WaiterLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({
    fullname: 'Nhân viên',
    email: 'waiter@fptres.vn',
    userId: 'NV000',
    initials: 'NV'
  });

  const getInitials = (name) => {
    if (!name) return 'NV';
    const words = String(name).trim().split(' ').filter(Boolean);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  };

  // Load user info và ưu tiên dữ liệu thật từ Profile API
  useEffect(() => {
    let isMounted = true;

    const loadUserInfo = async () => {
      let fallbackUser = {
        fullname: 'Nhân viên',
        email: 'waiter@fptres.vn',
        userId: null
      };

      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          fallbackUser = {
            fullname: user.fullname || 'Nhân viên',
            email: user.email || 'waiter@fptres.vn',
            userId: user.userId || null
          };
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      if (isMounted) {
        setUserInfo({
          fullname: fallbackUser.fullname,
          email: fallbackUser.email,
          userId: fallbackUser.userId ? `NV${String(fallbackUser.userId).padStart(3, '0')}` : 'NV000',
          initials: getInitials(fallbackUser.fullname)
        });
      }

      try {
        const profile = await getProfile();
        const apiFullname = profile?.fullname || profile?.fullName || fallbackUser.fullname;
        const apiEmail = profile?.email || fallbackUser.email;
        const apiUserId = profile?.userId || fallbackUser.userId;

        if (!isMounted) return;

        setUserInfo({
          fullname: apiFullname,
          email: apiEmail,
          userId: apiUserId ? `NV${String(apiUserId).padStart(3, '0')}` : 'NV000',
          initials: getInitials(apiFullname)
        });

        if (userStr) {
          try {
            const localUser = JSON.parse(userStr);
            localStorage.setItem('user', JSON.stringify({
              ...localUser,
              fullname: apiFullname,
              email: apiEmail,
              userId: apiUserId || localUser.userId
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

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const navItems = useMemo(
    () => [
      { to: '/waiter/orders', label: 'Đơn hàng', icon: ClipboardList },
      { to: '/waiter/qr-scanner', label: 'Mở bàn', icon: QrCode },
      { to: '/waiter/schedule', label: 'Lịch làm việc', icon: Calendar },
      { to: '/waiter/profile', label: 'Hồ sơ', icon: User }
    ],
    []
  );

  return (
    <div className="waiter-shell">
      <aside className={`waiter-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="waiter-brand">
          <div className="waiter-brand-icon">F</div>
          <div>
            <h2>Quản lý Phục vụ</h2>
            <p>Nhân viên phục vụ</p>
          </div>
        </div>

        <nav className="waiter-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `waiter-nav-item ${isActive ? 'active' : ''}`
                }
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="waiter-sidebar-footer">
          <div className="waiter-avatar">{userInfo.initials}</div>
          <div>
            <strong>{userInfo.fullname}</strong>
            <p>{userInfo.email || `ID: ${userInfo.userId}`}</p>
          </div>
        </div>

        <button className="waiter-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </aside>

      {/* Mobile Menu Button */}
      <button
        className="waiter-menu-btn"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Toggle waiter menu"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {menuOpen && <div className="waiter-overlay" onClick={() => setMenuOpen(false)} />}

      <main className="waiter-main">
        <section className="waiter-content">
          <Outlet />
        </section>
      </main>

      {/* Floating Notification Button */}
      <button 
        className="waiter-floating-notification" 
        aria-label="Notifications"
        onClick={() => setNotificationOpen(!notificationOpen)}
      >
        <Bell size={20} />
        <span className="waiter-notification-badge" />
      </button>

      {/* Notification Dropdown */}
      <NotificationDropdown 
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </div>
  );
};

export default WaiterLayout;
