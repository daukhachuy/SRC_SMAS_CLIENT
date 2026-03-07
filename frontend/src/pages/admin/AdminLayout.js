import React, { useMemo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Bell, Boxes, CalendarRange, CreditCard, LayoutDashboard, Menu, Search, ShoppingCart, Users, X } from 'lucide-react';
import '../../styles/AdminLayout.css';
import '../../styles/AdminPages.css';

const AdminLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { to: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
      { to: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart },
      { to: '/admin/reservations', label: 'Đặt bàn', icon: CalendarRange },
      { to: '/admin/staff', label: 'Nhân viên', icon: Users },
      { to: '/admin/inventory', label: 'Kho hàng', icon: Boxes },
      { to: '/admin/payroll', label: 'Lương', icon: CreditCard }
    ],
    []
  );

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-icon">F</div>
          <div>
            <h2>Nhà Hàng FPT</h2>
            <p>Hệ thống quản trị</p>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `admin-nav-item ${isActive ? 'active' : ''}`
                }
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-avatar">MH</div>
          <div>
            <strong>Minh Hoàng</strong>
            <p>manager@fptres.vn</p>
          </div>
        </div>
      </aside>

      {menuOpen && <div className="admin-overlay" onClick={() => setMenuOpen(false)} />}

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              className="admin-menu-btn"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle admin menu"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div className="admin-search">
              <Search size={16} />
              <input placeholder="Tìm kiếm đơn hàng, nhân viên, bàn..." type="text" />
            </div>
          </div>

          <div className="admin-topbar-right">
            <button className="admin-icon-btn" aria-label="Notifications">
              <Bell size={16} />
              <span className="admin-dot" />
            </button>
            <button className="admin-primary-btn">Tạo đơn mới</button>
          </div>
        </header>

        <section className="admin-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AdminLayout;
