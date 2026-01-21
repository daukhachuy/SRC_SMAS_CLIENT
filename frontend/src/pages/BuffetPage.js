import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BuffetPage.css';
import { ChevronDown, Bell, User, MessageSquare } from 'lucide-react';

const Header = () => {
  const navigate = useNavigate();
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="logo-group">
          <img src="/images/LOGO.png" className="logo-img" alt="Logo" />
          <span className="logo-text">
            <span style={{color: '#fff'}}>OCEAN</span>
            <span style={{color: '#FF7A21'}}>GRILL</span>
          </span>
        </div>
        <div className="nav-links">
          {['THỰC ĐƠN', 'KHUYẾN MÃI', 'DỊCH VỤ', 'VỀ CHÚNG TÔI'].map(item => (
            <span key={item} className="nav-item" style={{cursor: 'pointer'}}>{item}</span>
          ))}
        </div>
        <div className="nav-right">
          <div className="icon-circle">
            <Bell size={20} color="#fff" />
            <span className="badge" style={{backgroundColor: '#FF4D4F'}}>5</span>
          </div>
          <div className="icon-circle">
            <MessageSquare size={20} color="#fff" />
            <span className="badge">3</span>
          </div>
          <div className="icon-circle" style={{border: '2px solid #FF7A21', cursor: 'pointer'}} onClick={() => navigate('/auth')}>
            <User size={20} color="#fff" />
          </div>
        </div>
      </div>
    </nav>
  );
};

const FloatingChat = () => (
  <div className="fixed-chat">
    <MessageSquare size={28} color="white" />
    <span className="online-status"></span>
  </div>
);

const BuffetPage = () => {
  const navigate = useNavigate();
  const [expandCategory, setExpandCategory] = useState(true);
  const [expandPrice, setExpandPrice] = useState(true);

  const buffetMenu = [
    'Cá diêu hồng phi lê',
    'Cá diêu hồng phi lê',
    'Cá diêu hồng phi lê',
    'Cá diêu hồng phi lê',
    'Cá diêu hồng phi lê',
    'Cá diêu hồng phi lê',
  ];

  const buffetOptions = [
    {
      id: 1,
      name: 'Buffet Trưa Ngày Thường',
      price: 749000,
      period: 'Áp dụng cho mọi suất ăn từ trưa',
    },
    {
      id: 2,
      name: 'Buffet Tối Ngày Thường & Cuối tuần',
      price: 799000,
      period: 'Áp dụng cho mọi suất ăn từ tối',
    },
    {
      id: 3,
      name: 'Lẩu Tất & Cơm Lẩu Tết',
      price: 699000,
      period: 'Áp dụng cho mọi suất ăn các ngày lễ, Tết và các ngày định lễ',
    },
    {
      id: 4,
      name: 'Buffet Trẻ Em',
      price: 299000,
      period: 'Áp dụng cho mọi suất ăn dành cho trẻ em dưới 12 tuổi',
    },
  ];

  return (
    <div className="app">
      <Header />
      
      <div className="buffet-page-container">
        <div className="buffet-nav-tabs">
          <button className="nav-tab" onClick={() => navigate('/menu')}>MENU</button>
          <button className="nav-tab" onClick={() => navigate('/combo')}>COMBO</button>
          <button className="nav-tab active">BUFFET</button>
        </div>

        <div className="buffet-content">
          <aside className="sidebar">
            <div className="filter-section-main">
              <h3 className="filter-title">Lọc sản phẩm</h3>
              
              <div className="filter-group">
                <div className="filter-header" onClick={() => setExpandCategory(!expandCategory)}>
                  <h4>Loại sản phẩm</h4>
                  <ChevronDown size={18} style={{transform: expandCategory ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s'}} />
                </div>
                {expandCategory && (
                  <ul className="filter-list">
                    <li><input type="checkbox" /> Buffet</li>
                    <li><input type="checkbox" /> Lẩu</li>
                    <li><input type="checkbox" /> Nướng</li>
                    <li><input type="checkbox" checked /> Lẩu Nướng</li>
                  </ul>
                )}
              </div>

              <div className="filter-group">
                <div className="filter-header" onClick={() => setExpandPrice(!expandPrice)}>
                  <h4>Theo giá</h4>
                  <ChevronDown size={18} style={{transform: expandPrice ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s'}} />
                </div>
                {expandPrice && (
                  <ul className="filter-list">
                    <li><input type="radio" name="price" /> 249,000 - 299,000 VND</li>
                    <li><input type="radio" name="price" /> 449,000 - 499,000 VND</li>
                    <li><input type="radio" name="price" checked /> 749,000 - 799,000 VND</li>
                  </ul>
                )}
              </div>
            </div>
          </aside>

          <main className="buffet-main">
            <div className="buffet-header">
              <h1>Buffet lẩu</h1>
            </div>

            <div className="buffet-showcase">
              <div className="buffet-menu-card">
                <h3>Menu 39 Món</h3>
                <ul className="buffet-menu-list">
                  {buffetMenu.map((item, idx) => (
                    <li key={idx}>
                      <span className="menu-icon">🍽️</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="buffet-image">
                <img src="https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&q=80&w=600" alt="Buffet" />
              </div>
            </div>

            <div className="buffet-prices">
              <h2>Giá Trong Tuần</h2>
              <div className="price-list">
                {buffetOptions.map(option => (
                  <div key={option.id} className="price-item">
                    <div className="price-info-left">
                      <h4 className="price-name">{option.name}</h4>
                      <p className="price-description">{option.period}</p>
                    </div>
                    <div className="price-value">
                      {(option.price / 1000).toFixed(0)},000 đ
                    </div>
                  </div>
                ))}
              </div>
              <button className="book-btn">Đặt Ngay</button>
            </div>
          </main>
        </div>

        <footer className="buffet-footer">
          <h2 className="footer-title">Nhà Hàng Lẩu Nướng Số 1</h2>
          <div className="footer-content">
            <div className="footer-column">
              <h4 className="footer-heading">VỀ CHÚNG TÔI</h4>
              <ul className="footer-list">
                <li><a href="#">https://www.facebook.com</a></li>
                <li><a href="#">https://www.facebook.com</a></li>
                <li><a href="#">0123456789</a></li>
                <li><a href="#">https://www.facebook.com</a></li>
                <li><a href="#">https://www.facebook.com</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4 className="footer-heading">CÁC DỊCH VỤ</h4>
              <ul className="footer-list">
                <li>Đặt bàn trực tuyến</li>
                <li>Đặt tiệc, sự kiện</li>
                <li>Xem thực đơn</li>
                <li>Xem các combo hot</li>
                <li>Giao hàng tận nơi</li>
              </ul>
            </div>
            <div className="footer-column map-section">
              <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400" alt="Map" className="map-image" />
              <div className="chat-box">
                <input type="text" placeholder="Chat với cửa hàng" className="chat-input" />
                <button className="chat-btn">Gửi</button>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <FloatingChat />
    </div>
  );
};

export default BuffetPage;
