import React, { useMemo, useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, Calendar, ChefHat, ClipboardList, LogOut, Menu, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../../components/NotificationDropdown';
import { getProfile } from '../../api/userApi';
import { mapNotificationToUI, notificationAPI } from '../../api/managerApi';
import '../../styles/KitchenLayout.css';
import '../../styles/KitchenPages.css';

const KitchenLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userInfo, setUserInfo] = useState({
    fullname: 'Nhân viên bếp',
    email: 'kitchen@fptres.vn',
    position: 'Bếp'
  });

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
        fullname: 'Nhân viên bếp',
        email: 'kitchen@fptres.vn',
        role: 'Kitchen'
      };

      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          fallbackUser = {
            fullname: user.fullname || 'Nhân viên bếp',
            email: user.email || 'kitchen@fptres.vn',
            role: user.role || 'Kitchen'
          };
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }

      if (isMounted) {
        setUserInfo({
          fullname: fallbackUser.fullname,
          email: fallbackUser.email,
          position: fallbackUser.role === 'Kitchen' ? 'Bếp' : 'Nhân viên'
        });
      }

      try {
        const profile = await getProfile();
        const apiFullname = profile?.fullname || profile?.fullName || fallbackUser.fullname;
        const apiEmail = profile?.email || fallbackUser.email;
        const apiRole = profile?.role || fallbackUser.role;

        if (!isMounted) return;

        setUserInfo({
          fullname: apiFullname,
          email: apiEmail,
          position: apiRole === 'Kitchen' ? 'Bếp' : 'Nhân viên'
        });

        if (userStr) {
          try {
            const localUser = JSON.parse(userStr);
            localStorage.setItem('user', JSON.stringify({
              ...localUser,
              fullname: apiFullname,
              email: apiEmail,
              role: apiRole || localUser.role
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
        console.error('Không tải được thông báo kitchen:', error);
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
      { to: '/kitchen/orders', label: 'Đơn hàng', icon: ClipboardList },
      { to: '/kitchen/schedule', label: 'Lịch làm việc', icon: Calendar },
      { to: '/kitchen/profile', label: 'Hồ sơ', icon: User }
    ],
    []
  );

  return (
    <div className="kitchen-shell">
      <aside className={`kitchen-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="kitchen-brand">
          <div className="kitchen-brand-icon">
            <ChefHat size={24} />
          </div>
          <div>
            <h2>KDS Bếp</h2>
            <p>Kitchen Display System</p>
          </div>
        </div>

        <nav className="kitchen-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `kitchen-nav-item ${isActive ? 'active' : ''}`
                }
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="kitchen-sidebar-footer">
          <div className="kitchen-avatar">
            <ChefHat size={24} />
          </div>
          <div>
            <strong>{typeof userInfo.fullname === 'string' ? userInfo.fullname : (userInfo.fullname?.toString?.() || 'Đang tải...')}</strong>
            <p>{userInfo.position}</p>
          </div>
        </div>

        <button className="kitchen-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Đăng xuất</span>
        </button>
      </aside>

      {/* Mobile Menu Button */}
      <button
        className="kitchen-menu-btn"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Toggle kitchen menu"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {menuOpen && <div className="kitchen-overlay" onClick={() => setMenuOpen(false)} />}

      <main className="kitchen-main">
        <section className="kitchen-content">
          <Outlet />
        </section>
      </main>

      {/* Floating Notification Button */}
      <button 
        className="kitchen-floating-notification" 
        aria-label="Notifications"
        onClick={() => setNotificationOpen(!notificationOpen)}
      >
        <Bell size={20} />
        {unreadNotificationCount > 0 && (
          <span className="kitchen-notification-badge">{unreadNotificationCount}</span>
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

export default KitchenLayout;
