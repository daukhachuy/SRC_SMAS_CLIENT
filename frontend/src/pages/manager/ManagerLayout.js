import React, { useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Bell, Boxes, CalendarRange, CreditCard, LayoutDashboard, Menu, ShoppingCart, Users, X } from 'lucide-react';
import NotificationDropdown from '../../components/NotificationDropdown';
import '../../styles/ManagerLayout.css';
import '../../styles/ManagerPages.css';

const ManagerLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { to: '/manager/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      { to: '/manager/orders', label: 'Đơn hàng', icon: ShoppingCart },
      { to: '/manager/reservations', label: 'Đặt bàn', icon: CalendarRange },
      { to: '/manager/staff', label: 'Nhân viên', icon: Users },
      { to: '/manager/inventory', label: 'Kho hàng', icon: Boxes },
      { to: '/manager/salary', label: 'Lương', icon: CreditCard }
    ],
    []
  );

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

        <div className="manager-sidebar-footer">
          <div className="manager-avatar">MH</div>
          <div>
            <strong>Minh Hoàng</strong>
            <p>manager@fptres.vn</p>
          </div>
        </div>
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
