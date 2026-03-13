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
    initials: 'AD'
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
        if (isMounted) setUserInfo({ fullname: name, initials: getInitials(name) });
      } catch {
        if (isMounted) setUserInfo({ fullname: fallback.fullname, initials: getInitials(fallback.fullname) });
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
    <div className="flex min-h-screen">
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md lg:hidden"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label="Toggle admin menu"
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {menuOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMenuOpen(false)} />}

      <aside className={`w-[260px] bg-white border-r border-gray-100 flex flex-col fixed h-full z-40 transition-transform lg:translate-x-0 ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 pb-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FF6C1F] rounded-lg flex items-center justify-center text-white font-bold text-xl">R</div>
          <span className="font-bold text-xl tracking-tight text-gray-900">RESTO ADMIN</span>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? false}
                className={({ isActive }) => `flex items-center px-4 py-3.5 font-medium transition-all group ${
                  isActive
                    ? 'text-[#FF6C1F] border-l-4 border-[#FF6C1F] bg-orange-50'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#FF6C1F]'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} className="mr-3" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center p-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
              <span className="text-sm font-semibold text-gray-600">{userInfo.initials}</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{userInfo.fullname}</p>
              <p className="text-xs text-gray-500 truncate">Quản trị viên</p>
            </div>
          </div>
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-[260px]">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
