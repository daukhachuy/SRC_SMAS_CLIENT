import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BuffetPage.css';
import { Search, MessageSquare, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getBuffetLists, getBuffetDetail } from '../api/foodApi'; // Đảm bảo import cả 2 hàm này

const BuffetPage = () => {
  const navigate = useNavigate();
  const [buffetItems, setBuffetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadBuffetData = async () => {
      try {
        setLoading(true);
        // 1. Lấy danh sách buffet cơ bản
        const data = await getBuffetLists();
        const baseList = Array.isArray(data) ? data : data?.$values || [];

        // 2. Lấy chi tiết từng buffet để lấy mảng foods (chứa foodName)
        const detailedItems = await Promise.all(
          baseList.map(async (item) => {
            try {
              const detail = await getBuffetDetail(item.buffetId);
              return { ...item, foods: detail?.foods || [] };
            } catch {
              return { ...item, foods: [] };
            }
          })
        );
        setBuffetItems(detailedItems);
      } catch (err) {
        console.error('Lỗi tải dữ liệu:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBuffetData();
  }, []);

  return (
    <div className="app">
      <Header />
      
      <div className="menu-page-container">
        {/* THANH ĐIỀU KHIỂN */}
        <div className="menu-control-bar">
          <div className="control-left">
            <button className="nav-tab" onClick={() => navigate('/menu')}>Menu</button>
            <button className="nav-tab" onClick={() => navigate('/combo')}>Combo</button>
            <button className="nav-tab active">Buffet</button>
          </div>
          
          <div className="control-right">
            <span className="sort-dropdown-label">Sắp xếp theo:</span>
            <select className="sort-dropdown">
              <option>Mặc định</option>
              <option>Giá: Thấp đến Cao</option>
              <option>Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        <div className="menu-content">
          {/* SIDEBAR */}
          <aside className="sidebar">
            <h3 className="filter-title">Bộ lọc Buffet</h3>
            <div className="filter-group">
              <div className="filter-header">
                <h4>Loại sản phẩm</h4>
              </div>
              <ul className="filter-list">
                <li>
                  <label>
                    <input type="checkbox" defaultChecked />
                    <span>Tất cả Buffet</span>
                  </label>
                </li>
              </ul>
            </div>
          </aside>

          <main className="buffet-main-area">
            {/* THANH TÌM KIẾM */}
            <div className="search-row-container">
              <div className="search-container-new">
                <Search size={20} color="#888" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm gói buffet cực phẩm..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="btn-tim-kiem">TÌM KIẾM</button>
            </div>

            {loading ? (
              <div className="status-msg">Đang chuẩn bị buffet...</div>
            ) : (
              <div className="buffet-list">
                {buffetItems.map((item) => (
                  <div key={item.buffetId} className="buffet-item-wrapper">
                    <div className="buffet-header">
                      <h1>{item.name}</h1>
                    </div>

                    <div className="buffet-showcase">
                      {/* CỘT TRÁI: MÔ TẢ */}
                      <div className="buffet-menu-card">
                        <h3>Đặc Điểm Nổi Bật</h3>
                        <p>{item.description}</p>
                        <ul className="buffet-feature-list">
                          {["Hải sản tươi sống", "Bò Mỹ nhập khẩu", "Phục vụ tại bàn"].map((f, i) => (
                            <li key={i}>
                              <CheckCircle size={16} color="var(--primary-orange)" /> 
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* CỘT PHẢI: LIST FOODNAME (THAY CHO ẢNH) */}
                      <div className="buffet-food-container-box">
                        <h3 className="food-list-title">Thực đơn bao gồm:</h3>
                        <div className="food-names-grid">
                          {(item.foods?.$values || item.foods || []).map((food, idx) => (
                            <div key={idx} className="food-name-tag">
                              <span className="dot">•</span>
                              <span className="text">{food.foodName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="buffet-prices">
                      <h2 className="price-title">Bảng Giá Chi Tiết</h2>
                      <div className="price-grid-custom">
                        <div className="price-box-custom">
                          <div className="price-info-custom">
                            <h4>Suất Người Lớn</h4>
                            <p>Dành cho khách trên 1m3</p>
                          </div>
                          <span className="price-num-custom">{item.mainPrice?.toLocaleString()} đ</span>
                        </div>
                        <div className="price-box-custom">
                          <div className="price-info-custom">
                            <h4>Suất Trẻ Em</h4>
                            <p>Khách hàng từ 1m - 1m3</p>
                          </div>
                          <span className="price-num-custom">{item.childrenPrice?.toLocaleString()} đ</span>
                        </div>
                      </div>
                      <button className="btn-order-now">ĐẶT BÀN NGAY</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
      
      <div className="fixed-chat">
        <MessageSquare size={28} color="white" />
        <div className="online-status"></div>
      </div>
      <Footer />
    </div>
  );
};

export default BuffetPage;