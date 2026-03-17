import React, { useEffect, useMemo, useState } from 'react';
import { Bell, ShoppingBag, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import NotificationDropdown from './NotificationDropdown';
import '../styles/Header.css';

const MENU_ITEMS = [
  { label: 'THỰC ĐƠN', path: '/menu', id: 'menu' },
  { label: 'KHUYẾN MÃI', path: '/promotion', id: 'promotion' },
  { label: 'DỊCH VỤ', path: '/services', id: 'services' },
  { label: 'VỀ CHÚNG TÔI', path: '/about', id: 'about' }
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeId, setActiveId] = useState('');
  const [shrink, setShrink] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  
  // --- THÊM STATE ĐỂ LƯU TỔNG SỐ LƯỢNG GIỎ HÀNG ---
  const [cartCount, setCartCount] = useState(0);

  // Hàm tính toán tổng số lượng từ localStorage
  const updateCartBadge = () => {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    // Tính tổng tất cả quantity của các item trong giỏ
    const total = savedCart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    setCartCount(total);
  };

  useEffect(() => {
    // Chạy lần đầu khi component mount
    updateCartBadge();

    // Lắng nghe sự kiện 'storage' (khi tab khác thay đổi localStorage)
    // và custom event từ chính ứng dụng (khi cùng 1 tab thay đổi giỏ hàng)
    window.addEventListener('storage', updateCartBadge);
    
    // Cleanup
    return () => {
      window.removeEventListener('storage', updateCartBadge);
    };
  }, []);

  // Map path -> id
  const pathToId = useMemo(() => {
    const map = new Map();
    MENU_ITEMS.forEach(i => map.set(i.path, i.id));
    return map;
  }, []);

  /* ================= FUNCTION: Handle User Icon Click ================= */
  const handleUserIconClick = () => {
    const token = localStorage.getItem('authToken');
    
    // Nếu chưa login → redirect to login page
    if (!token) {
      navigate('/auth');
      return;
    }

    // Luôn vào trang Profile.js
    navigate('/profile');
  };

  /* ================= ULTRA++: SHRINK + ACTIVE BY SCROLL ================= */
  useEffect(() => {
    let ticking = false;

    const pickActiveByScroll = () => {
      setShrink(window.scrollY > 80);
      const focusY = 120;

      for (const item of MENU_ITEMS) {
        const el = document.getElementById(item.id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        if (rect.top <= focusY && rect.bottom >= focusY) {
          setActiveId(item.id);
          return;
        }
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        pickActiveByScroll();
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    pickActiveByScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ================= ULTRA++: ACTIVE BY ROUTE (PRIMARY) ================= */
  useEffect(() => {
    if (location.pathname === '/') {
      return; 
    }

    if (location.state?.isInternalNav && location.pathname !== '/menu') {
      setActiveId('menu');
      return;
    }

    const exact = pathToId.get(location.pathname);
    if (exact) {
      setActiveId(exact);
      return;
    }

    const matched = MENU_ITEMS.find(item =>
      location.pathname.startsWith(item.path)
    );
    if (matched) {
      setActiveId(matched.id);
      return;
    } else {
      setActiveId(''); 
    }
  }, [location.pathname, location.state, pathToId]);

  return (
    <nav className={`hd-wrapper ${shrink ? 'is-shrink' : ''}`}>
      <div className="hd-container">

        {/* LOGO */}
        <div
          className="hd-logo-section"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
        >
          <img
            className="hd-logo-img"
            src="https://res.cloudinary.com/dmzuier4p/image/upload/v1772344074/image_nxgnsu.webp"
            alt="Logo"
          />

          <div className="hd-brand-text">
            <span className="hd-brand-sub">NHÀ HÀNG</span>
            <span className="hd-brand-main">FPT</span>
          </div>
        </div>

        {/* NAV */}
        <div className="hd-nav">
          {MENU_ITEMS.map((item) => {
            const isActive = activeId === item.id;

            return (
              <div
                key={item.id}
                className={`hd-nav-link ${isActive ? 'is-active' : ''}`}
                onClick={() => {
                  if (item.id !== 'combo' && item.id !== 'buffet') {
                    navigate(item.path);
                  } else {
                    setActiveId(item.id);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {item.label}

                {isActive && (
                  <>
                    <motion.div
                      layoutId="hd-underline"
                      className="hd-underline"
                      transition={{ type: 'spring', stiffness: 520, damping: 32 }}
                    />
                    <div className="hd-glow" />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* ACTIONS */}
        <div className="hd-actions">
          <div
            className="hd-icon-wrap"
            title="Thông báo"
            style={{ cursor: 'pointer' }}
            onClick={() => setNotificationOpen((prev) => !prev)}
          >
            <Bell size={22} />
            <span className="hd-badge badge-red">5</span>
          </div>

          <div 
            className="hd-icon-wrap" 
            title="Giỏ hàng"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/cart')}
          >
            <ShoppingBag size={22} />
            {cartCount > 0 && (
                <span className="hd-badge badge-orange">{cartCount}</span>
            )}
          </div>

          <div
            className="hd-user-btn"
            onClick={handleUserIconClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleUserIconClick()}
            title="Tài khoản"
          >
            <User size={20} />
          </div>
        </div>

        <NotificationDropdown
          isOpen={notificationOpen}
          onClose={() => setNotificationOpen(false)}
        />

      </div>
    </nav>
  );
};

export default Header;