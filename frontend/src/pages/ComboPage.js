import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/ComboPage.css'; 
import { ShoppingCart, MessageSquare, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
// Import helper kiểm tra đăng nhập
import { isAuthenticated } from '../api/authApi'; 

const FloatingChat = () => (
  <div className="fixed-chat">
    <MessageSquare size={28} color="white" />
    <span className="online-status"></span>
  </div>
);

const ComboPage = () => {
  const navigate = useNavigate();
  const FIXED_PRODUCT_IMAGE = 'https://res.cloudinary.com/dmzuier4p/image/upload/v1773138906/OIP_devlp6.jpg';

  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // 1. FETCH COMBOS
  useEffect(() => {
    const fetchCombos = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BASE_URL}/api/combo`);
        
        const data = Array.isArray(response.data) 
          ? response.data 
          : response.data?.$values || [];

        const mapped = data.map(item => ({
          id: item.comboId || item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: FIXED_PRODUCT_IMAGE
        }));

        setCombos(mapped);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu combo:", err);
        setError("Không thể tải dữ liệu combo lúc này.");
      } finally {
        setLoading(false);
      }
    };
    fetchCombos();
  }, []);

  // ==========================================
  // 2. HÀM THÊM COMBO VÀO GIỎ HÀNG
  // ==========================================
  const addToCart = (combo) => {
    // Kiểm tra đăng nhập qua token (authToken)
    if (!isAuthenticated()) {
      alert("Vui lòng đăng nhập để đặt Combo!");
      navigate('/login');
      return;
    }

    const existingCart = JSON.parse(localStorage.getItem('cart')) || [];
    // Tìm kiếm xem combo này đã có trong giỏ chưa (check ID và cờ isCombo)
    const itemIndex = existingCart.findIndex(item => item.id === combo.id && item.isCombo === true);

    if (itemIndex > -1) {
      existingCart[itemIndex].quantity += 1;
    } else {
      existingCart.push({
        id: combo.id,
        name: combo.name,
        price: combo.price,
        image: combo.image,
        quantity: 1,
        isCombo: true // Đánh dấu đây là COMBO để Backend xử lý riêng nếu cần
      });
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    
    // Đồng bộ số lượng trên Header
    window.dispatchEvent(new Event('storage')); 
    alert(`Đã thêm "${combo.name}" vào giỏ hàng!`);
  };

  // Logic Tìm kiếm
  const filteredCombos = combos.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Logic Phân trang
  const totalPages = Math.ceil(filteredCombos.length / itemsPerPage);
  const displayedItems = filteredCombos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  return (
    <div className="app">
      <Header />

      <div className="menu-page-container">
        <div className="menu-control-bar">
          <div className="control-left">
            <button className="nav-tab" onClick={() => navigate('/menu')}>MENU</button>
            <button className="nav-tab active" onClick={() => navigate('/combo')}>COMBO</button>
            <button className="nav-tab" onClick={() => navigate('/buffet')}>BUFFET</button>
          </div>

          <div className="control-right">
            <span className="sort-dropdown-label">Sắp xếp: </span>
            <select className="sort-dropdown">
              <option>Mặc định</option>
              <option>Giá thấp đến cao</option>
              <option>Giá cao đến thấp</option>
            </select>
          </div>
        </div>

        <div className="menu-content">
          <aside className="sidebar">
            <div className="filter-section-main">
              <h3 className="filter-title">Lọc Combo</h3>
              <div className="filter-group">
                <div className="filter-header"><h4>NHÓM COMBO</h4></div>
                <ul className="filter-list">
                  <li><label><input type="checkbox" defaultChecked /> Tất cả Combo</label></li>
                  <li><label><input type="checkbox" /> Combo 2 người</label></li>
                  <li><label><input type="checkbox" /> Combo Gia đình</label></li>
                  <li><label><input type="checkbox" /> Combo Tiết kiệm</label></li>
                </ul>
              </div>

              <div className="filter-group">
                <div className="filter-header"><h4>KHOẢNG GIÁ</h4></div>
                <ul className="filter-list">
                  <li><label><input type="radio" name="price" defaultChecked /> Tất cả</label></li>
                  <li><label><input type="radio" name="price" /> Dưới 200k</label></li>
                  <li><label><input type="radio" name="price" /> 200k - 500k</label></li>
                  <li><label><input type="radio" name="price" /> Trên 500k</label></li>
                </ul>
              </div>
            </div>
          </aside>

          <main className="main-content">
            <div className="search-row-container">
              <div className="search-container-new">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm combo hấp dẫn..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="search-icon-btn"><Search size={18}/></button>
              </div>
              <button className="btn-tim-kiem">Tìm Kiếm</button>
            </div>

            {loading ? (
              <p className="status-msg">Đang chuẩn bị các combo hấp dẫn...</p>
            ) : error ? (
              <p className="status-msg error">{error}</p>
            ) : (
              <>
                <div className="menu-grid">
                  {displayedItems.map(item => (
                    <div key={item.id} className="menu-item">
                      <div className="item-image-container">
                        <img 
                          className="item-image" 
                          src={item.image} 
                          alt={item.name} 
                          onError={(e) => e.target.src = FIXED_PRODUCT_IMAGE}
                        />
                      </div>
                      <span className="item-category">Combo Đặc Biệt</span>
                      <h3 className="item-name">{item.name}</h3>
                      <p style={{ fontSize: '12px', color: '#666', height: '32px', overflow: 'hidden', marginBottom: '10px', lineHeight: '1.4' }}>
                        {item.description}
                      </p>
                      <div className="price-info">
                        <div className="price-box">
                          <span className="new-price">{item.price?.toLocaleString()}đ</span>
                        </div>
                        {/* THÊM CLICK ĐỂ CHẠY HÀM addToCart */}
                        <ShoppingCart 
                          size={22} 
                          className="cart-icon" 
                          style={{ cursor: 'pointer' }}
                          onClick={() => addToCart(item)}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination-wrapper">
                    <div className="pagination-info">Hiển thị {displayedItems.length} / {filteredCombos.length} combo</div>
                    <div className="pagination-btns">
                      <button className="p-btn" onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}><ChevronLeft size={16}/></button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button key={i} className={`p-btn ${currentPage === i+1 ? 'active' : ''}`} onClick={() => handlePageChange(i+1)}>{i+1}</button>
                      ))}
                      <button className="p-btn" onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}><ChevronRight size={16}/></button>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      <Footer />
      <FloatingChat />
    </div>
  );
};

export default ComboPage;