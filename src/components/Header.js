import React, { useEffect, useMemo, useState } from 'react';
import { Bell, ShoppingBag, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  // Map path -> id
  const pathToId = useMemo(() => {
    const map = new Map();
    MENU_ITEMS.forEach(i => map.set(i.path, i.id));
    return map;
  }, []);

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
      setActiveId(''); // Reset active nếu không khớp menu chính (ví dụ vào trang /cart)
    }
  }, [location.pathname, location.state, pathToId]);

  return (
    <nav className={`custom-header ${shrink ? 'is-shrink' : ''}`}>
      <div className="header-container">

        {/* LOGO */}
        <div
          className="header-logo-section"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/')}
        >
          <img
            className="header-logo-img"
            src="/images/LOGO.png"
            alt="Logo"
          />

          <div className="header-brand-text">
            <span className="brand-sub">NHÀ HÀNG</span>
            <span className="brand-main">FPT</span>
          </div>
        </div>

        {/* NAV */}
        <div className="header-nav">
          {MENU_ITEMS.map((item) => {
            const isActive = activeId === item.id;

            return (
              <div
                key={item.id}
                className={`nav-link-item ${isActive ? 'is-active' : ''}`}
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
                      layoutId="ultra-underline"
                      className="nav-underline"
                      transition={{ type: 'spring', stiffness: 520, damping: 32 }}
                    />
                    <div className="nav-glow" />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* ACTIONS */}
        <div className="header-actions">
          <div className="action-icon-wrap" title="Thông báo">
            <Bell size={22} />
            <span className="action-badge badge-red">5</span>
          </div>

          {/* SỬA TẠI ĐÂY: Thêm onClick điều hướng tới trang Cart */}
          <div 
            className="action-icon-wrap" 
            title="Giỏ hàng"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/cart')}
          >
            <ShoppingBag size={22} />
            <span className="action-badge badge-orange">3</span>
          </div>

          <div
            className="user-avatar-btn"
            onClick={() => navigate('/profile')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/profile')}
            title="Tài khoản"
          >
            <User size={20} />
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Header;