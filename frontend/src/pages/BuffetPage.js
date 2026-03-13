import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BuffetPage.css';
import { Search, MessageSquare, CheckCircle, ShoppingCart } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { getBuffetLists, getBuffetDetail } from '../api/foodApi'; // Đảm bảo import cả 2 hàm này
import { isAuthenticated } from '../api/authApi';

const BuffetPage = () => {
  const navigate = useNavigate();
  const [buffetItems, setBuffetItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [showAuthRequired, setShowAuthRequired] = useState(false);
  const FIXED_PRODUCT_IMAGE = 'https://res.cloudinary.com/dmzuier4p/image/upload/v1773138906/OIP_devlp6.jpg';

  const showToast = (item) => {
    setToast(item);
    setTimeout(() => setToast(null), 3000);
  };

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

  const filteredBuffetItems = buffetItems.filter((item) => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;

    const buffetName = (item.name || '').toLowerCase();
    const foodNames = (item.foods?.$values || item.foods || [])
      .map((food) => (food.foodName || '').toLowerCase())
      .join(' ');

    return buffetName.includes(keyword) || foodNames.includes(keyword);
  });

  const addBuffetToCart = (item) => {
    if (!isAuthenticated()) {
      setShowAuthRequired(true);
      return;
    }

    const existingCart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartId = `buffet-${item.buffetId}`;
    const itemIndex = existingCart.findIndex((cartItem) => cartItem.id === cartId && cartItem.isBuffet === true);

    if (itemIndex > -1) {
      existingCart[itemIndex].quantity += 1;
    } else {
      existingCart.push({
        id: cartId,
        name: item.name,
        price: item.mainPrice,
        image: item.image || FIXED_PRODUCT_IMAGE,
        quantity: 1,
        isBuffet: true,
      });
    }

    localStorage.setItem('cart', JSON.stringify(existingCart));
    window.dispatchEvent(new Event('storage'));
    showToast({ name: item.name, image: item.image || FIXED_PRODUCT_IMAGE });
  };

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
        </div>

        <div className="buffet-content">
          <main className="buffet-main-area">
            {/* THANH TÌM KIẾM */}
            <div className="buffet-toolbar">
              <div className="buffet-search-wrapper">
                <Search size={17} className="buffet-search-icon" />
                <input 
                  type="text" 
                  className="buffet-search-input"
                  placeholder="Tìm kiếm gói buffet..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="buffet-toolbar-right">
                <p className="buffet-result-text">Tổng {filteredBuffetItems.length} gói</p>
              </div>
            </div>

            {loading ? (
              <div className="status-msg">Đang chuẩn bị buffet...</div>
            ) : (
              <div className="buffet-list">
                {filteredBuffetItems.map((item) => (
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
                      <button className="btn-order-now" onClick={() => navigate('/services')}>ĐẶT BÀN NGAY</button>
                      <button className="btn-add-buffet-cart" onClick={() => addBuffetToCart(item)}>
                        <ShoppingCart size={18} />
                        <span>THÊM VÀO GIỎ</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {toast && (
        <div className="buffet-toast" role="status">
          <img
            src={toast.image || FIXED_PRODUCT_IMAGE}
            alt={toast.name}
            className="buffet-toast-img"
            onError={(e) => {
              e.target.src = FIXED_PRODUCT_IMAGE;
            }}
          />
          <div className="buffet-toast-body">
            <span className="buffet-toast-title">Đã thêm vào giỏ hàng ✅</span>
            <span className="buffet-toast-name">{toast.name}</span>
          </div>
          <button className="buffet-toast-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      <AuthRequiredModal
        isOpen={showAuthRequired}
        onClose={() => setShowAuthRequired(false)}
      />
      
      <div className="fixed-chat">
        <MessageSquare size={28} color="white" />
        <div className="online-status"></div>
      </div>
      <Footer />
    </div>
  );
};

export default BuffetPage;