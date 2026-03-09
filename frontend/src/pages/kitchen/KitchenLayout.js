import React, { useMemo, useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Bell, Calendar, ChefHat, ClipboardList, Menu, User, X } from 'lucide-react';
import NotificationDropdown from '../../components/NotificationDropdown';
import '../../styles/KitchenLayout.css';
import '../../styles/KitchenPages.css';

const KitchenLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userInfo, setUserInfo] = useState({
    fullname: 'Nhân viên bếp',
    position: 'Bếp'
  });

  // Load user info từ localStorage
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserInfo({
          fullname: user.fullname || 'Nhân viên bếp',
          position: user.role === 'Kitchen' ? 'Bếp' : 'Nhân viên'
        });
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

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
            <strong>{userInfo.fullname}</strong>
            <p>{userInfo.position}</p>
          </div>
        </div>
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
        <span className="kitchen-notification-badge" />
      </button>

      {/* Notification Dropdown */}
      <NotificationDropdown 
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
      />
    </div>
  );
};

export default KitchenLayout;
