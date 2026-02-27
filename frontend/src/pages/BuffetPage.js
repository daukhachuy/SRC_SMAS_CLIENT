import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BuffetPage.css';
import { ChevronDown, MessageSquare, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getBuffetLists } from '../api/foodApi'; // Sử dụng hàm gọi API Buffet thực tế

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
  const [buffetItems, setBuffetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = "https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net";

  useEffect(() => {
    const loadBuffetData = async () => {
      try {
        setLoading(true);
        const data = await getBuffetLists(); // Gọi API /api/Buffer/lists
        setBuffetItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Lỗi khi tải danh sách buffet:', err);
        setError("Không thể tải dữ liệu Buffet từ máy chủ.");
      } finally {
        setLoading(false);
      }
    };
    loadBuffetData();
  }, []);

  // Dữ liệu menu chi tiết (vì API chưa trả về mảng món ăn con nên ta để demo hoặc dùng description)
  const defaultFeatures = [
    "Hải sản tươi sống mỗi ngày", "Bò Mỹ nhập khẩu", "Nước lẩu độc quyền",
    "Quầy line hơn 30 món", "Tráng miệng đa dạng", "Không giới hạn thời gian"
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
                  <ChevronDown size={18} style={{transform: expandCategory ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s'}} />
                </div>
                {expandCategory && (
                  <ul className="filter-list">
                    <li><input type="checkbox" defaultChecked /> Tất cả Buffet</li>
                  </ul>
                )}
              </div>
            </div>
          </aside>

          <main className="buffet-main">
            {loading ? (
              <div className="loading-state">Đang tải dữ liệu buffet...</div>
            ) : error ? (
              <div className="error-state">{error}</div>
            ) : buffetItems.length === 0 ? (
              <div className="empty-state">Hiện chưa có chương trình Buffet nào.</div>
            ) : (
              buffetItems.map((item) => (
                <div key={item.buffetId} className="buffet-item-section" style={{ marginBottom: '80px' }}>
                  <div className="buffet-header">
                    <h1>{item.name}</h1>
                  </div>

                  <div className="buffet-showcase">
                    <div className="buffet-menu-card">
                      <h3>Đặc Điểm Nổi Bật</h3>
                      <p className="item-desc-text" style={{ color: '#ccc', marginBottom: '20px', fontSize: '14px' }}>
                        {item.description}
                      </p>
                      <ul className="buffet-menu-list">
                        {defaultFeatures.map((feature, idx) => (
                          <li key={idx}>
                            <CheckCircle size={16} color="#FF7A21" /> {feature}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="buffet-image">
                      <img 
                        src={`${BASE_URL}${item.image}`} 
                        alt={item.name} 
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1567521464027-f127ff144326?q=80&w=800"; }}
                      />
                    </div>
                  </div>

                  <div className="buffet-prices">
                    <h2>Bảng Giá Chi Tiết</h2>
                    <div className="price-list">
                      {/* Giá người lớn */}
                      <div className="price-item">
                        <div className="price-info-left">
                          <h4 className="price-name">Suất Người Lớn</h4>
                          <p className="price-description">Áp dụng cho khách hàng cao trên 1m3</p>
                        </div>
                        <div className="price-value">{item.mainPrice?.toLocaleString()} đ</div>
                      </div>

                      {/* Giá trẻ em */}
                      <div className="price-item">
                        <div className="price-info-left">
                          <h4 className="price-name">Suất Trẻ Em</h4>
                          <p className="price-description">Chiều cao từ 1m đến 1m3</p>
                        </div>
                        <div className="price-value">{item.childrenPrice?.toLocaleString()} đ</div>
                      </div>

                      {/* Giá Side (Ngày lễ/Dịch vụ thêm) */}
                      {item.sidePrice > 0 && (
                        <div className="price-item">
                          <div className="price-info-left">
                            <h4 className="price-name">Phụ thu / Dịch vụ kèm</h4>
                            <p className="price-description">Tùy chọn bổ sung hoặc ngày lễ</p>
                          </div>
                          <div className="price-value">{item.sidePrice?.toLocaleString()} đ</div>
                        </div>
                      )}
                    </div>
                    <button className="book-btn">ĐẶT BÀN NGAY</button>
                  </div>
                </div>
              ))
            )}
          </main>
        </div>
        <Footer />
      </div>
      <FloatingChat />
    </div>
  );
};

export default BuffetPage;