import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MenuPage.css';
import { ShoppingCart, ChevronDown, Heart, Bell, User, MessageSquare } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getFoodCategories } from '../api/foodApi';

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
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // URL gốc để hiển thị hình ảnh từ server
  const IMAGE_BASE_URL = "https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net";

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        setLoading(true);
        const data = await getFoodCategories();
        
        // Mapping dữ liệu từ API thật sang cấu trúc của Component
        const mappedItems = data.map(item => ({
          id: item.foodId, // API dùng foodId
          name: item.name,
          // Lấy tên category đầu tiên trong mảng categories
          category: item.categories?.[0]?.name || 'Món ăn', 
          price: item.price,
          oldPrice: item.promotionalPrice, // API dùng promotionalPrice làm giá cũ/giảm
          image: item.image?.startsWith('http') ? item.image : `${IMAGE_BASE_URL}${item.image}`,
          rating: item.rating || 5.0
        }));

        setMenuItems(mappedItems);
      } catch (err) {
        console.error('Error loading menu items:', err);
        setError(err?.message || 'Failed to load menu items');
      } finally {
        setLoading(false);
      }
    };

    loadMenuItems();
  }, []);

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
                    <li><input type="radio" name="price" /> 100000 - 150000</li>
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

            {loading ? (
              <p>Đang tải dữ liệu...</p>
            ) : error ? (
              <p style={{ color: 'red' }}>{error}</p>
            ) : (
              <div className="menu-grid">
                {displayedItems.map(item => (
                  <div key={item.id} className="menu-item">
                    <div className="item-image-container">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="item-image" 
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                      />
                    </div>
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-category">{item.category}</p>
                    <div className="price-info">
                      {/* Hiển thị giá cũ nếu có */}
                      <span className="old-price">
                        {item.oldPrice ? `${item.oldPrice.toLocaleString()} đ` : ''}
                      </span>
                      <span className="new-price">{item.price?.toLocaleString()} đ/a</span>
                      <ShoppingCart size={18} className="cart-icon" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pagination">
              <span className="pagination-text">Hiển thị <strong>{displayedItems.length}</strong> Tổng <strong>{filteredItems.length}</strong></span>
              <div className="pagination-controls">
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i} 
                    className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
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