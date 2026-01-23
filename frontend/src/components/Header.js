import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, User, Search } from 'lucide-react';
import '../styles/Header.css';

const Header = () => {
  const navigate = useNavigate();

  const menuItems = [
    { name: 'THỰC ĐƠN', path: '/menu' },
    { name: 'KHUYẾN MÃI', path: '/promotions' },
    { name: 'DỊCH VỤ', path: '/services' },
    { name: 'VỀ CHÚNG TÔI', path: '/about' }
  ];

  return (
    <nav className="header-navbar">
      <div className="header-container">
        
        {/* LOGO */}
        <div className="header-logo-group" onClick={() => navigate('/')}>
          <img src="/images/LOGO.png" alt="Logo" className="header-logo-img" />
          <div className="header-brand-text">
            <span className="text-white-sub">NHÀ HÀNG</span>
            <span className="text-primary-main">LẨU NƯỚNG</span>
          </div>
        </div>

        {/* MENU CHÍNH */}
        <div className="header-nav-links">
          {menuItems.map((item) => (
            <span 
              key={item.name} 
              className="header-link-item"
              onClick={() => navigate(item.path)}
            >
              {item.name}
            </span>
          ))}
        </div>

        {/* NHÓM ICON BÊN PHẢI - ĐÃ VỨT CHỮ TÀI KHOẢN */}
        <div className="header-nav-right">
          {/* Thông báo */}
          <div className="header-icon-wrapper">
            <Bell size={22} />
            <span className="header-badge badge-red">5</span>
          </div>

          {/* Giỏ hàng */}
          <div className="header-icon-wrapper" onClick={() => navigate('/cart')}>
            <ShoppingBag size={22} />
            <span className="header-badge badge-orange">3</span>
          </div>

          {/* Chỉ giữ lại Icon User tròn */}
          <div className="header-user-avatar" onClick={() => navigate('/auth')}>
            <User size={20} />
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Header;