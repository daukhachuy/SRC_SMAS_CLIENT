import React, { useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Bell, Calendar, ClipboardList, Menu, User, X } from 'lucide-react';
import NotificationDropdown from '../../components/NotificationDropdown';
import '../../styles/WaiterLayout.css';
import '../../styles/WaiterPages.css';

const WaiterLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

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
          <div className="waiter-avatar">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsYEghUw4sjdjjQrXFODjj7DBMQpkmQmzjjkWzTK4DjWrjxIlmbJymlrgzYU2K9yJ2QYVkJ2Q2eQ4_Gu6b_k-67lFWwxvfdOmE3iPb14HN-Bf1o1eKvo5EcpyIQ15lSIr0EyTF4VsTvq05ZgPQCovguWlqYoiilvZD7BDzrkshZkxGXZY0DLt0sfZWuRjLqY7bBIgWPa-MJ-b3yAqxt5ZH5UYFKcxNCttX3ciEUD5m-ZLRtgqX2_Nj420Lc9KvY1aqP_U1n0l8skA" 
              alt="Nhân viên phục vụ"
            />
          </div>
          <div>
            <strong>Nguyễn Văn An</strong>
            <p>ID: NV082</p>
          </div>
        </div>
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
