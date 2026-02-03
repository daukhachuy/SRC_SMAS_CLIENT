import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Menu.css';
import { 
  User, Bell, ShoppingBag, MessageSquare,
  ChevronDown, Heart, Star
} from 'lucide-react';
import Footer from '../components/Footer';

// --- MENU DATA ---
const MENU_ITEMS = [
  // Tôm sú cuốn
  { id: 1, name: 'Tôm sú cuốn', price: 120000, category: 'Món hấp', desc: 'Tôm sú tươi cuốn trong lá chuối', img: 'https://images.unsplash.com/photo-1553247407-23251ce81f59?auto=format&fit=crop&q=80&w=500', rating: 4.8 },
  { id: 2, name: 'Tôm sú cuốn', price: 120000, category: 'Món hấp', desc: 'Tôm sú tươi cuốn trong lá chuối', img: 'https://images.unsplash.com/photo-1553247407-23251ce81f59?auto=format&fit=crop&q=80&w=500', rating: 4.8 },
  { id: 3, name: 'Tôm sú cuốn', price: 120000, category: 'Món hấp', desc: 'Tôm sú tươi cuốn trong lá chuối', img: 'https://images.unsplash.com/photo-1553247407-23251ce81f59?auto=format&fit=crop&q=80&w=500', rating: 4.8 },
  { id: 4, name: 'Tôm sú cuốn', price: 120000, category: 'Món hấp', desc: 'Tôm sú tươi cuốn trong lá chuối', img: 'https://images.unsplash.com/photo-1553247407-23251ce81f59?auto=format&fit=crop&q=80&w=500', rating: 4.8 },
  
  // Tôm hùm
  { id: 5, name: 'Tôm hùm bỏ lò', price: 150000, category: 'Nướng', desc: 'Tôm hùm nướng với phô mai', img: 'https://file.hstatic.net/200000441267/file/cach-lam-tom-hum-sot_dfab10dfd2cc43deb08e034d061cb237_grande.jpg', rating: 4.9 },
  { id: 6, name: 'Tôm hùm sốt bơ tỏi', price: 140000, category: 'Nướng', desc: 'Tôm hùm xanh tươi sốt bơ', img: 'https://images.unsplash.com/photo-1564489969458-b5b3b6ddfb42?auto=format&fit=crop&q=80&w=500', rating: 4.7 },
  
  // Cua
  { id: 7, name: 'Cua hoàng đế hấp rượu vang', price: 200000, category: 'Hấp', desc: 'Cua hoàng đế hấp với rượu vang trắng', img: 'https://images.unsplash.com/photo-1599458252573-56ae36120de1?q=80&w=500', rating: 4.9 },
  { id: 8, name: 'Cua cà mau hấp nước dừa', price: 180000, category: 'Hấp', desc: 'Cua Cà Mau hấp nước dừa ngọt', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500', rating: 4.8 },
  
  // Cá
  { id: 9, name: 'Cá hồi áp chảo', price: 160000, category: 'Chiên Xào', desc: 'Cá hồi áp chảo vàng giòn', img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=500', rating: 4.7 },
  { id: 10, name: 'Cá mú hoa hấp dưa', price: 140000, category: 'Hấp', desc: 'Cá mú hoa hấp dưa cải thanh', img: 'https://images.unsplash.com/photo-1580959375944-abd7e991f971?q=80&w=500', rating: 4.8 },
  
  // Mực
  { id: 11, name: 'Mực trứng nướng muối ớt', price: 120000, category: 'Nướng', desc: 'Mực trứng tươi nướng muối ớt cay', img: 'https://haisancoto.com/uploads/images/muc-trung-nuong-muoi-ot.jpg', rating: 4.6 },
  { id: 12, name: 'Mực lá câu hấp gừng', price: 130000, category: 'Hấp', desc: 'Mực lá câu hấp với hành gừng', img: 'https://images.unsplash.com/photo-1614707267537-b85faf00021a?q=80&w=500', rating: 4.7 },
  
  // Hàu
  { id: 13, name: 'Hàu nướng mỡ hành', price: 100000, category: 'Nướng', desc: 'Hàu sữa nướng với mỡ hành thơm', img: 'https://cdn.tgdd.vn/Files/2018/12/20/1139386/cong-thuc-cach-lam-hau-nuong-mo_760x367.jpg', rating: 4.8 },
  { id: 14, name: 'Hàu nướng phô mai Pháp', price: 110000, category: 'Nướng', desc: 'Hàu nướng phô mai Pháp tan chảy', img: 'https://images.unsplash.com/photo-1599249300675-c39f1dd2d6be?q=80&w=500', rating: 4.9 },
  
  // Bào ngư
  { id: 15, name: 'Bào ngư sốt dầu hào', price: 180000, category: 'Hấp', desc: 'Bào ngư thượng hạng sốt dầu hào', img: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=500', rating: 4.9 },
  
  // Ốc
  { id: 16, name: 'Ốc hương cam muối', price: 90000, category: 'Chiên Xào', desc: 'Ốc hương giòn sần sật với trứng muối', img: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500', rating: 4.7 },
  
  // Lẩu
  { id: 17, name: 'Lẩu thái hải sản', price: 200000, category: 'Lẩu', desc: 'Lẩu thái chua cay với hải sản tươi', img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=500', rating: 4.8 },
  { id: 18, name: 'Lẩu cá đuối đặc sản', price: 190000, category: 'Lẩu', desc: 'Lẩu cá đuối thơm bùi', img: 'https://images.unsplash.com/photo-1546527868-ccded7ee8dfe?q=80&w=500', rating: 4.6 },
  
  // Sashimi
  { id: 19, name: 'Sashimi tổng hợp', price: 250000, category: 'Sashimi', desc: 'Sashimi các loại cá tươi sống', img: 'https://spartabeerclub.vn/media/images/article/252/cach_lam_ca_hoi_sashimi_4.jpg', rating: 4.9 },
  
  // Cơm chiên
  { id: 20, name: 'Cơm chiên hải sản', price: 80000, category: 'Chiên Xào', desc: 'Cơm chiên tơi xốp với hải sản', img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=500', rating: 4.7 },
];

const CATEGORIES = [
  'Tất cả',
  'Món chiên',
  'Món xào',
  'Lẩu',
  'Cay',
  'Món nướng',
  'Món nấu',
  'Bia',
  'Nước ngọt'
];

const PRICE_RANGES = [
  { label: 'Tất cả', min: 0, max: Infinity },
  { label: '0 - 50.000', min: 0, max: 50000 },
  { label: '50.000 - 100.000', min: 50000, max: 100000 },
  { label: '100.000 - 150.000', min: 100000, max: 150000 },
  { label: '150.000 - 200.000', min: 150000, max: 200000 },
  { label: 'Lớn hơn 200.000', min: 200000, max: Infinity }
];

const RATINGS = [
  { label: 'Gợi nhiều', min: 4.5 },
  { label: 'Giảm giá', min: 4.0 },
  { label: 'Hót Trend', min: 3.5 }
];

// --- COMPONENTS ---

const Header = ({ navigate }) => (
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
          <ShoppingBag size={20} color="#fff" />
          <span className="badge">3</span>
        </div>
        <div className="icon-circle" style={{border: '2px solid #FF7A21', cursor: 'pointer'}} onClick={() => navigate('/auth')}>
          <User size={20} color="#fff" />
        </div>
      </div>
    </div>
  </nav>
);

const FloatingChat = () => (
  <div className="fixed-chat">
    <MessageSquare size={28} color="white" />
    <span className="online-status"></span>
  </div>
);

const ProductCard = ({ name, price, img, rating, category }) => (
  <div className="product-card">
    <div className="product-img-container">
      <img src={img} alt={name} className="product-img" loading="lazy" />
      <div className="product-price-tag">{(price / 1000).toFixed(0)}k đ/a</div>
      <div className="heart-icon">
        <Heart size={18} fill="#FF7A21" color="#FF7A21" />
      </div>
    </div>
    <div className="product-body">
      <h4 className="product-name">{name}</h4>
      <p className="product-category">{category}</p>
      <button className="add-to-cart-btn">THÊM VÀO GIỎ</button>
    </div>
  </div>
);

const SidebarFilter = ({ 
  selectedCategory, 
  onCategoryChange,
  selectedPrice,
  onPriceChange,
  selectedRating,
  onRatingChange
}) => {
  const [expandCategory, setExpandCategory] = useState(true);
  const [expandPrice, setExpandPrice] = useState(true);
  const [expandRating, setExpandRating] = useState(true);

  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Lọc sản phẩm</h2>

      {/* Danh mục món ăn */}
      <div className="filter-section">
        <div 
          className="filter-title-toggle"
          onClick={() => setExpandCategory(!expandCategory)}
        >
          <span>Danh mục món ăn</span>
          <ChevronDown 
            size={20} 
            style={{
              transform: expandCategory ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.3s'
            }}
            color="#FF7A21"
          />
        </div>
        {expandCategory && (
          <div className="filter-options-grid">
            {CATEGORIES.map(cat => (
              <label key={cat} className="filter-checkbox-item">
                <input 
                  type="checkbox" 
                  checked={selectedCategory.includes(cat)}
                  onChange={() => {
                    if (cat === 'Tất cả') {
                      onCategoryChange(['Tất cả']);
                    } else {
                      let newCats = selectedCategory.filter(c => c !== 'Tất cả');
                      if (newCats.includes(cat)) {
                        newCats = newCats.filter(c => c !== cat);
                      } else {
                        newCats.push(cat);
                      }
                      onCategoryChange(newCats.length === 0 ? ['Tất cả'] : newCats);
                    }
                  }}
                />
                <span>{cat}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Theo giá */}
      <div className="filter-section">
        <div 
          className="filter-title-toggle"
          onClick={() => setExpandPrice(!expandPrice)}
        >
          <span>Theo giá</span>
          <ChevronDown 
            size={20} 
            style={{
              transform: expandPrice ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.3s'
            }}
            color="#FF7A21"
          />
        </div>
        {expandPrice && (
          <div className="filter-options">
            {PRICE_RANGES.map((range, idx) => (
              <label key={idx} className="filter-checkbox-item">
                <input 
                  type="radio" 
                  name="price"
                  checked={selectedPrice === idx}
                  onChange={() => onPriceChange(idx)}
                />
                <span>{range.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Đánh giá */}
      <div className="filter-section">
        <div 
          className="filter-title-toggle"
          onClick={() => setExpandRating(!expandRating)}
        >
          <span>Đánh giá</span>
          <ChevronDown 
            size={20} 
            style={{
              transform: expandRating ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.3s'
            }}
            color="#FF7A21"
          />
        </div>
        {expandRating && (
          <div className="filter-options">
            {RATINGS.map((rat, idx) => (
              <label key={idx} className="filter-checkbox-item">
                <input 
                  type="radio" 
                  name="rating"
                  checked={selectedRating === idx}
                  onChange={() => onRatingChange(idx)}
                />
                <span>{rat.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN MENU PAGE ---
const Menu = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(['Tất cả']);
  const [selectedPrice, setSelectedPrice] = useState(0);
  const [selectedRating, setSelectedRating] = useState(null);

  // Filter products based on selections
  const filteredProducts = useMemo(() => {
    let result = MENU_ITEMS;

    // Category filter
    if (!selectedCategory.includes('Tất cả')) {
      result = result.filter(item => selectedCategory.includes(item.category));
    }

    // Price filter
    const priceRange = PRICE_RANGES[selectedPrice];
    result = result.filter(item => item.price >= priceRange.min && item.price <= priceRange.max);

    // Rating filter
    if (selectedRating !== null) {
      const minRating = RATINGS[selectedRating].min;
      result = result.filter(item => item.rating >= minRating);
    }

    return result;
  }, [selectedCategory, selectedPrice, selectedRating]);

  return (
    <div className="app">
      <Header navigate={navigate} />
      
      {/* Menu Tabs */}
      <div className="menu-tabs-section">
        <div className="menu-tabs-container">
          <button className="menu-tab active">MENU</button>
          <button className="menu-tab">COMBO</button>
          <button className="menu-tab">BUFFET</button>
        </div>
      </div>
      
      <section className="menu-section">
        <div className="menu-container">
          {/* Sidebar */}
          <SidebarFilter 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedPrice={selectedPrice}
            onPriceChange={setSelectedPrice}
            selectedRating={selectedRating}
            onRatingChange={setSelectedRating}
          />

          {/* Main Content */}
          <div className="menu-main">
            {/* Header */}
            <div className="menu-header">
              <div className="search-bar-container">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm sản phẩm" 
                  className="search-input"
                />
                <button className="search-btn">Tìm Kiếm</button>
              </div>
              <div className="sort-controls">
                <span className="sort-text">Xắp xếp: <span className="sort-highlight">Tăng dần</span></span>
              </div>
            </div>

            {/* Products Grid */}
            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            {/* Pagination */}
            <div className="pagination">
              <span className="pagination-info">Hiển thị <strong>12</strong> Tổng <strong>{filteredProducts.length}</strong></span>
              <div className="pagination-dots">
                <button className="pagination-btn active">1</button>
                <button className="pagination-btn">2</button>
                <button className="pagination-btn">3</button>
                <span className="pagination-ellipsis">...</span>
                <button className="pagination-btn">5</button>
                <button className="pagination-btn pagination-next">›</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Restaurant Info Section */}
      <section className="restaurant-info-section">
        <h2 className="info-section-title">Nhà Hàng Lẩu Nướng Số 1</h2>
        <div className="restaurant-info-grid">
          <div className="info-column">
            <h4 className="info-column-title">VỀ CHÚNG TÔI</h4>
            <ul className="info-list">
              <li><a href="#facebook">https://www.facebook.com</a></li>
              <li><a href="#tiktok">https://www.facebook.com</a></li>
              <li className="info-phone">0123456789</li>
              <li><a href="#email">https://www.facebook.com</a></li>
              <li><a href="#location">https://www.facebook.com</a></li>
            </ul>
          </div>
          <div className="info-column">
            <h4 className="info-column-title">CÁC DỊCH VỤ</h4>
            <ul className="info-list">
              <li>Đặt bàn trực tuyến</li>
              <li>Đặt tiệc, sự kiện</li>
              <li>Xem thực đơn</li>
              <li>Xem các combo hot</li>
              <li>Giao hàng tận nơi</li>
            </ul>
          </div>
          <div className="info-column map-column">
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400" 
              alt="Map" 
              className="map-image"
            />
            <input 
              type="text" 
              placeholder="Chat với cửa hàng" 
              className="chat-input"
            />
            <button className="chat-btn">Gửi</button>
          </div>
        </div>
      </section>

      <FloatingChat />

      <Footer />
    </div>
  );
};

export default Menu;
