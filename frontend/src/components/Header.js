import React, { useEffect, useMemo, useState } from 'react';
import { Bell, ShoppingBag, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import NotificationDropdown from './NotificationDropdown';
import CustomerConversationWidget from './CustomerConversationWidget';
import { getAllNotifications, getUnreadNotifications, normalizeNotificationList } from '../api/notificationApi';
import '../styles/Header.css';

const MENU_ITEMS = [
  { label: 'THỰC ĐƠN', path: '/menu', id: 'menu' },
  { label: 'KHUYẾN MÃI', path: '/promotion', id: 'promotion' },
  { label: 'DỊCH VỤ', path: '/services', id: 'services' },
  { label: 'VỀ CHÚNG TÔI', path: '/about', id: 'about' }
];

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const getStoredUserRole = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem('user') || '{}');
    return normalizeRole(parsed?.role);
  } catch {
    return '';
  }
};

const getNotificationId = (item, idx = 0) => {
  const id = item?.id ?? item?.notificationId ?? item?.notificationID ?? item?.Id ?? item?.NotificationId;
  return id != null ? String(id) : `fallback-${idx}`;
};

const timeAgoVi = (value) => {
  if (!value) return 'Vừa xong';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày trước`;
};

const mapNotificationType = (type) => {
  const t = String(type || '').toLowerCase();
  if (t.includes('warn') || t.includes('error')) return 'warning';
  if (t.includes('book')) return 'booking';
  if (t.includes('promo') || t.includes('discount')) return 'promotion';
  if (t.includes('order')) return 'order';
  return 'system';
};

const mapNotificationItem = (item, idx) => ({
  id: item?.id || item?.notificationId || idx + 1,
  type: mapNotificationType(item?.type || item?.notificationType),
  title: item?.title || item?.subject || item?.message || `Thông báo #${idx + 1}`,
  message: item?.message || item?.content || item?.description || 'Bạn có thông báo mới.',
  time: timeAgoVi(item?.createdAt || item?.time || item?.sentAt),
  isRead: Boolean(item?.isRead ?? item?.read ?? item?.isSeen ?? false),
});

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeId, setActiveId] = useState('');
  const [shrink, setShrink] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
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

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const [allPayload, unreadPayload] = await Promise.all([
          getAllNotifications(),
          getUnreadNotifications(),
        ]);

        const allRows = normalizeNotificationList(allPayload);
        const unreadRows = normalizeNotificationList(unreadPayload);
        const unreadIds = new Set(
          unreadRows
            .map((item, idx) => getNotificationId(item, idx))
            .filter(Boolean)
        );

        const hasExplicitReadFlag = allRows.some(
          (item) => item?.isRead != null || item?.read != null || item?.isSeen != null
        );
        const hasAnyReadInAll = allRows.some((item) =>
          Boolean(item?.isRead ?? item?.read ?? item?.isSeen ?? false)
        );
        const unreadSourceLooksBroken =
          allRows.length > 0 &&
          unreadIds.size === allRows.length &&
          hasExplicitReadFlag &&
          hasAnyReadInAll;

        const mapped = allRows.map((item, idx) => {
          const mappedItem = mapNotificationItem(item, idx);
          const rowId = getNotificationId(item, idx);
          const isMarkedUnreadByEndpoint = !unreadSourceLooksBroken && unreadIds.has(rowId);
          return {
            ...mappedItem,
            id: rowId,
            isRead: isMarkedUnreadByEndpoint ? false : mappedItem.isRead,
          };
        });

        if (mounted) {
          setNotifications(mapped);
        }
      } catch (error) {
        console.error('Load notifications failed:', error);
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
  const shouldShowCustomerConversation = useMemo(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
    if (!token) return false;
    const role = getStoredUserRole();
    return !['manager', 'waiter', 'kitchen', 'admin'].includes(role);
  }, [location.pathname]);

  // Map path -> id
  const pathToId = useMemo(() => {
    const map = new Map();
    MENU_ITEMS.forEach(i => map.set(i.path, i.id));
    return map;
  }, []);

  /* ================= FUNCTION: Handle User Icon Click ================= */
  const handleUserIconClick = () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/profile');
      return;
    }

    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const role = normalizeRole(user?.role);

      if (role === 'manager') {
        navigate('/manager/profile');
        return;
      }
      if (role === 'waiter') {
        navigate('/waiter/profile');
        return;
      }
      if (role === 'kitchen') {
        navigate('/kitchen/profile');
        return;
      }
    } catch (error) {
      console.error('Cannot parse user role in header:', error);
    }

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
    <>
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
            <span className="hd-brand-main">SMAS</span>
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
            {unreadNotificationCount > 0 && (
              <span className="hd-badge badge-red">{unreadNotificationCount}</span>
            )}
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
          notifications={notifications}
          onNotificationsChange={setNotifications}
        />

      </div>
    </nav>
    {shouldShowCustomerConversation ? <CustomerConversationWidget /> : null}
    </>
  );
};

export default Header;