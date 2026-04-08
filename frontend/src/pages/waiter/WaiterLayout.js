import React, { useMemo, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Calendar, ClipboardList, LogOut, Menu, User, X } from 'lucide-react';
import NotificationDropdown from '../../components/NotificationDropdown';
import { getProfile } from '../../api/userApi';
import { notificationAPI, mapNotificationToUI } from '../../api/managerApi';
import { useAuth } from '../../context/AuthContext';
import '../../styles/WaiterLayout.css';
import '../../styles/WaiterPages.css';

const WaiterLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
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

  const asArray = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.data?.$values)) return payload.data.$values;
    if (Array.isArray(payload?.$values)) return payload.$values;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.notifications)) return payload.notifications;
    return [];
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

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const res = await notificationAPI.getAll();
        const rows = asArray(res?.data);
        const mapped = rows.map((item, idx) => mapNotificationToUI(item, idx));
        if (mounted) {
          setNotifications(mapped);
        }
      } catch (error) {
        console.error('Không tải được thông báo:', error);
        if (mounted) {
          setNotifications([]);
        }
      }
    };

    loadNotifications();
    return () => {
      mounted = false;
    };
  }, []);

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const navItems = useMemo(
    () => [
      { to: '/waiter/orders', label: 'Đơn hàng', icon: ClipboardList },
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
            <strong>{typeof userInfo.fullname === 'string' ? userInfo.fullname : (userInfo.fullname?.toString?.() || 'Đang tải...')}</strong>
            <p>{typeof userInfo.email === 'string' ? userInfo.email : (userInfo.email?.toString?.() || `ID: ${typeof userInfo.userId === 'string' || typeof userInfo.userId === 'number' ? userInfo.userId : (userInfo.userId?.toString?.() || '---')}`)}</p>
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
        {unreadNotificationCount > 0 && (
          <span className="waiter-notification-badge">{unreadNotificationCount}</span>
        )}
      </button>

      {/* Notification Dropdown */}
      <NotificationDropdown 
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        notifications={notifications}
        onNotificationsChange={setNotifications}
      />
    </div>
  );
};

export default WaiterLayout;
