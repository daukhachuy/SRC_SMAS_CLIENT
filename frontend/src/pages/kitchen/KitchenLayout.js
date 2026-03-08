import React, { useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Bell, Calendar, ChefHat, ClipboardList, Menu, User, X } from 'lucide-react';
import NotificationDropdown from '../../components/NotificationDropdown';
import '../../styles/KitchenLayout.css';
import '../../styles/KitchenPages.css';

const KitchenLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

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
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOB91kHRbJkeI0YuZVJj5eXkR18MqBl32ffD5qC7DCC9cJUbZILvolUei_wJ3clw7xaM5wHQTx4YQ4q0mUPMQQoz29eyMBAm73fOhn1tsbbKy8UHwNvl7YGENQOBSAoy68TGbe_dqA3ff3QiT17SdPGyuLsAwH9gzWI6WgDTRWnZmxVEWSuJ8QOF5KiIA56SFW4ri9DZMw8o9_f_XOGB6W-u2lZKhjaal12UajP4qq4a8vrAN7xe-ke7gk0cGCdKrjd_GuX512cwk" 
              alt="Nhân viên bếp"
            />
          </div>
          <div>
            <strong>Trần Văn Bếp</strong>
            <p>Bếp trưởng</p>
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
