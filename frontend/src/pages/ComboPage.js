import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, MessageSquare, ChevronDown } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/ComboPage.css';

const ComboPage = () => {
  const navigate = useNavigate();
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // GỌI API THẬT
  useEffect(() => {
    const fetchCombos = async () => {
      try {
        setLoading(true);
        // URL lấy từ hình ảnh Swagger bạn cung cấp
        const response = await axios.get('https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net/api/combo');
        
        // Kiểm tra nếu dữ liệu trả về là mảng
        if (Array.isArray(response.data)) {
          setCombos(response.data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu combo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCombos();
  }, []);

  // Logic tìm kiếm
  const filteredCombos = combos.filter(combo =>
    combo.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app">
      <Header />

      <div className="combo-page-container">
        {/* Điều hướng Tabs */}
        <div className="combo-nav-tabs">
          <button className="nav-tab" onClick={() => navigate('/menu')}>MENU</button>
          <button className="nav-tab active" onClick={() => navigate('/combo')}>COMBO</button>
          <button className="nav-tab" onClick={() => navigate('/buffet')}>BUFFET</button>
        </div>

        <div className="combo-content">
          {/* Sidebar Bộ lọc */}
          <aside className="sidebar">
            <h3 className="filter-title">Lọc sản phẩm</h3>
            <div className="filter-group">
              <div className="filter-header">
                <h4>Loại Combo</h4>
                <ChevronDown size={16} />
              </div>
              <ul className="filter-list">
                <li><input type="checkbox" /> Combo Gia Đình</li>
                <li><input type="checkbox" /> Combo 2 Người</li>
                <li><input type="checkbox" /> Combo Tiết Kiệm</li>
              </ul>
            </div>
          </aside>

          {/* Nội dung chính */}
          <main className="main-content" style={{ flex: 1 }}>
            <div className="search-section">
              <input 
                type="text" 
                className="search-input" 
                placeholder="Tìm kiếm combo..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-btn">
                <Search size={20} color="white" />
              </button>
            </div>

            {loading ? (
              <div className="loading">Đang tải dữ liệu...</div>
            ) : (
              <div className="combo-grid">
                {filteredCombos.map((combo) => (
                  <div key={combo.id} className="combo-item">
                    <div className="item-image-container">
                      <img 
                        src={combo.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'} 
                        alt={combo.name} 
                        className="item-image" 
                      />
                    </div>
                    <h3 className="item-name">{combo.name}</h3>
                    <p className="item-description">{combo.description}</p>
                    <div className="price-info">
                      <span className="new-price">
                        {combo.price?.toLocaleString()}đ
                      </span>
                      <ShoppingCart className="cart-icon" size={24} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination mẫu */}
            <div className="pagination">
              <span>Hiển thị {filteredCombos.length} kết quả</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="page-btn active">1</button>
                <button className="page-btn">2</button>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Nút Chat cố định */}
      <div className="fixed-chat">
        <MessageSquare size={28} color="white" />
        <span className="online-status"></span>
      </div>

      <Footer />
    </div>
  );
};

export default ComboPage;