import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/MenuPage.css';
import { ShoppingCart, MessageSquare, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getAllCategories } from '../api/categoryApi';
// Import helper kiểm tra đăng nhập từ file auth của bạn
import { isAuthenticated } from '../api/authApi'; 

const FloatingChat = () => (
  <div className="fixed-chat">
    <MessageSquare size={28} color="white" />
    <span className="online-status"></span>
  </div>
);

const MenuPage = () => {
  const navigate = useNavigate();
  const BASE_URL = "https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net";

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: null, max: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // 1. FETCH CATEGORIES (Giữ nguyên logic của bạn)
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getAllCategories();
        let categoryData = [];
        if (Array.isArray(res)) categoryData = res;
        else if (Array.isArray(res?.$values)) categoryData = res.$values;
        else if (Array.isArray(res?.data)) categoryData = res.data;
        else if (Array.isArray(res?.data?.$values)) categoryData = res.data.$values;
        setCategories(categoryData);
      } catch (err) {
        setCategories([]);
      }
    };
    fetchCats();
  }, []);

  // 2. FETCH FOOD (Giữ nguyên logic filter của bạn)
  useEffect(() => {
    const loadFilteredFoods = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        selectedCategoryIds.forEach(id => params.append('CategoryIds', id));
        if (priceRange.min !== null) params.append('MinPrice', priceRange.min);
        if (priceRange.max !== null) params.append('MaxPrice', priceRange.max);

        const response = await axios.get(`${BASE_URL}/api/food/filter?${params.toString()}`);
        const foodArray = Array.isArray(response.data) ? response.data : response.data?.$values || [];

        const mapped = foodArray.map(item => ({
          id: item.foodId,
          name: item.name,
          price: item.price,
          oldPrice: item.promotionalPrice,
          image: item.image?.startsWith('http') ? item.image : `${BASE_URL}${item.image}`,
          categoryName: item.categories?.[0]?.name || "Món ăn"
        }));

        setMenuItems(mapped);
        setCurrentPage(1);
      } catch (err) {
        setError("Không thể tải dữ liệu món ăn.");
      } finally {
        setLoading(false);
      }
    };
    loadFilteredFoods();
  }, [selectedCategoryIds, priceRange]);

  // ==========================================
  // 3. HÀM THÊM VÀO GIỎ HÀNG (THEO YÊU CẦU)
  // ==========================================
  const addToCart = (item) => {
    // Kiểm tra đăng nhập qua helper (check authToken)
    if (!isAuthenticated()) {
      alert("Vui lòng đăng nhập để thêm món vào giỏ hàng!");
      navigate('/login');
      return;
    }

    // Xử lý giỏ hàng trong LocalStorage
    const existingCart = JSON.parse(localStorage.getItem('cart')) || [];
    const itemIndex = existingCart.findIndex(cartItem => cartItem.id === item.id);

    if (itemIndex > -1) {
      existingCart[itemIndex].quantity += 1;
    } else {
      existingCart.push({
        ...item,
        quantity: 1,
        isCombo: false // Món lẻ
      });
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    
    // Bắn event để Header cập nhật số lượng badge
    window.dispatchEvent(new Event('storage')); 
    alert(`Đã thêm ${item.name} vào giỏ hàng!`);
  };

  const handleCategoryChange = (id) => {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePriceChange = (min, max) => {
    setPriceRange({ min, max });
  };

  const filteredBySearch = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBySearch.length / itemsPerPage);
  const displayedItems = filteredBySearch.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  return (
    <div className="app">
      <Header />

      <div className="menu-page-container">
        <div className="menu-control-bar">
          <div className="control-left">
            <button className="nav-tab active">MENU</button>
            <button className="nav-tab" onClick={() => navigate('/combo')}>COMBO</button>
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
              <h3 className="filter-title">Lọc sản phẩm</h3>
              <div className="filter-group">
                <div className="filter-header"><h4>DANH MỤC MÓN ĂN</h4></div>
                <ul className="filter-list">
                  <li>
                    <label>
                      <input type="checkbox" checked={selectedCategoryIds.length === 0} onChange={() => setSelectedCategoryIds([])} /> Tất cả
                    </label>
                  </li>
                  {categories.map(cat => (
                    <li key={cat.categoryId}>
                      <label>
                        <input type="checkbox" checked={selectedCategoryIds.includes(cat.categoryId)} onChange={() => handleCategoryChange(cat.categoryId)} /> {cat.name}
                      </label>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="filter-group">
                <div className="filter-header"><h4>THEO GIÁ (VNĐ)</h4></div>
                <ul className="filter-list">
                  <li><label><input type="radio" name="price" onChange={() => handlePriceChange(null, null)} defaultChecked /> Tất cả</label></li>
                  <li><label><input type="radio" name="price" onChange={() => handlePriceChange(0, 50000)} /> 0 - 50k</label></li>
                  <li><label><input type="radio" name="price" onChange={() => handlePriceChange(50000, 100000)} /> 50k - 100k</label></li>
                  <li><label><input type="radio" name="price" onChange={() => handlePriceChange(100000, 200000)} /> 100k - 200k</label></li>
                  <li><label><input type="radio" name="price" onChange={() => handlePriceChange(200000, null)} /> Trên 200k</label></li>
                </ul>
              </div>
            </div>
          </aside>

          <main className="main-content">
            <div className="search-row-container">
                <div className="search-container-new">
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm sản phẩm..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="search-icon-btn"><Search size={18}/></button>
                </div>
                <button className="btn-tim-kiem">Tìm Kiếm</button>
            </div>

            {loading ? (
              <p className="status-msg">Đang chuẩn bị món ăn...</p>
            ) : error ? (
              <p className="status-msg error">{error}</p>
            ) : (
              <>
                <div className="menu-grid">
                  {displayedItems.map(item => (
                    <div key={item.id} className="menu-item">
                      <div className="item-image-container">
                        <img className="item-image" src={item.image} alt={item.name} 
                             onError={(e) => e.target.src = "https://picsum.photos/300/200"} />
                      </div>
                      <span className="item-category">{item.categoryName}</span>
                      <h3 className="item-name">{item.name}</h3>
                      <div className="price-info">
                        <div className="price-box">
                          {item.oldPrice && <span className="old-price">{item.oldPrice.toLocaleString()}đ</span>}
                          <span className="new-price">{item.price.toLocaleString()}đ</span>
                        </div>
                        {/* THÊM SỰ KIỆN CLICK VÀO ICON GIỎ HÀNG */}
                        <ShoppingCart 
                          size={20} 
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
                    <div className="pagination-info">Hiển thị {displayedItems.length} / {filteredBySearch.length} món</div>
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

export default MenuPage;