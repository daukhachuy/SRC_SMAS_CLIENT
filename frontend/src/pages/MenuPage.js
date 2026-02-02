import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MenuPage.css';
import { ShoppingCart, ChevronDown, Heart, Bell, User, MessageSquare } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FloatingChat = () => (
  <div className="fixed-chat">
    <MessageSquare size={28} color="white" />
    <span className="online-status"></span>
  </div>
);

const MenuPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [expandCategory, setExpandCategory] = useState(true);
  const [expandPrice, setExpandPrice] = useState(true);
  const [expandRating, setExpandRating] = useState(true);
  const [activeTab, setActiveTab] = useState('menu');

  const menuItems = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    name: 'Tôm sú cuốn',
    category: 'Món hấp',
    price: 120000,
    oldPrice: 200000,
    img: 'https://images.unsplash.com/photo-1553247407-23251ce81f59?auto=format&fit=crop&q=80&w=500',
    rating: 4.8
  }));

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPrice = priceFilter ? item.price <= priceFilter.split('-')[1] : true;
    return matchesSearch && matchesPrice;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="app">
      <Header />
      
      <div className="menu-page-container">
        <div className="menu-nav-tabs">
          <button className={`nav-tab active`} onClick={() => navigate('/menu')}>MENU</button>
          <button className={`nav-tab`} onClick={() => navigate('/combo', { state: { isInternalNav: true } })}>COMBO</button>
          <button className={`nav-tab`} onClick={() => navigate('/buffet', { state: { isInternalNav: true } })}>BUFFET</button>
        </div>

        <div className="menu-content">
          <aside className="sidebar">
            <div className="filter-section-main">
              <h3 className="filter-title">Lọc sản phẩm</h3>
              
              <div className="filter-group">
                <div className="filter-header" onClick={() => setExpandCategory(!expandCategory)}>
                  <h4>Danh mục món ăn</h4>
                  <ChevronDown size={18} style={{transform: expandCategory ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s'}} />
                </div>
                {expandCategory && (
                  <ul className="filter-list">
                    <li><input type="checkbox" /> Tất cả</li>
                    <li><input type="checkbox" /> Món chiên</li>
                    <li><input type="checkbox" /> Món xào</li>
                    <li><input type="checkbox" /> Lẩu</li>
                    <li><input type="checkbox" /> Cay</li>
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
                    <li><input type="radio" name="price" /> 0 - 50000</li>
                    <li><input type="radio" name="price" /> 50000 - 100000</li>
                    <li><input type="radio" name="price" checked /> 100000 - 150000</li>
                    <li><input type="radio" name="price" /> 150000 - 200000</li>
                    <li><input type="radio" name="price" /> Lớn hơn 200000</li>
                  </ul>
                )}
              </div>

              <div className="filter-group">
                <div className="filter-header" onClick={() => setExpandRating(!expandRating)}>
                  <h4>Đánh giá</h4>
                  <ChevronDown size={18} style={{transform: expandRating ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s'}} />
                </div>
                {expandRating && (
                  <ul className="filter-list">
                    <li><input type="checkbox" /> Gọi nhiều</li>
                    <li><input type="checkbox" /> Giảm giá</li>
                    <li><input type="checkbox" /> Hot trend</li>
                  </ul>
                )}
              </div>
            </div>
          </aside>

          <main className="main-content">
            <div className="search-section">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm"
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-btn">Tìm Kiếm</button>
              <div className="sort-section">
                <span className="sort-label">Xấp xếp :</span>
                <span className="sort-text">Tăng dần</span>
              </div>
            </div>

            <div className="menu-grid">
              {displayedItems.map(item => (
                <div key={item.id} className="menu-item">
                  <div className="item-image-container">
                    <img src={item.img} alt={item.name} className="item-image" />
                  </div>
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-category">{item.category}</p>
                  <div className="price-info">
                    <span className="old-price">{item.oldPrice.toLocaleString()}</span>
                    <span className="new-price">{item.price.toLocaleString()} đ/a</span>
                    <ShoppingCart size={18} className="cart-icon" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pagination">
              <span className="pagination-text">Hiển thị <strong>12</strong> Tổng <strong>{filteredItems.length}</strong></span>
              <div className="pagination-controls">
                <button className="page-btn active">1</button>
                <button className="page-btn">2</button>
                <button className="page-btn">3</button>
                <span className="pagination-dots">...</span>
                <button className="page-btn">5</button>
                <button className="page-btn next-btn">›</button>
              </div>
            </div>
          </main>
        </div>

        <Footer />
      </div>

      <FloatingChat />
    </div>
  );
};

export default MenuPage;