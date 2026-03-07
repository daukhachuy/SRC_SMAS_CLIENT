import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Home.css';
import { 
  MessageSquare, ChevronLeft, ChevronRight,
  Star, Quote, Heart, Clock, MapPin, Phone,
  Calendar, Truck, PartyPopper
} from 'lucide-react';

import Header from '../components/Header'; 
import Footer from '../components/Footer';

// --- DATA CỐ ĐỊNH ---
const HERO_DATA = [
  { id: 1, title: "Cá Mú Hoa Hấp Dưa", tag: "Best Seller", desc: "Tinh hoa biển cả với thớ cá trắng ngần, quyện cùng vị chua thanh của dưa cải, tạo nên bản giao hương vị khó cưỡng.", img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=1000" },
  { id: 2, title: "Lẩu Nướng Hải Sản", tag: "Signature", desc: "Sự kết hợp hoàn hảo giữa các loại hải sản tươi sống và nước lẩu đặc trưng, mang lại hương vị truyền thống tinh tế.", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1000" },
  { id: 3, title: "Combo Family", tag: "Promotion", desc: "Trọn vẹn niềm vui sum vầy với set ăn đầy đủ dinh dưỡng, được thiết kế riêng cho những khoảnh khắc ấm áp bên gia đình.", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000" }
];

export let BEST_SELLERS_DATA = [];

export const COMBOS_DATA = [
  { id: 1, name: "Set Uyên Ương", price: "599k", img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=500", desc: "Lãng mạn dành cho 2 người với nến và rượu vang." },
  { id: 2, name: "Combo Gia Đình", price: "899k", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=500", desc: "Lẩu hải sản và 3 món nướng cho gia đình 4 người." },
  { id: 3, name: "Tiệc Bạn Bè", price: "1.2tr", img: "https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?q=80&w=500", desc: "Khay hải sản khổng lồ kèm bia tươi mát lạnh." },
  { id: 4, name: "Set Lunch Pro", price: "150k", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=500", desc: "Cơm hải sản cao cấp dành cho dân văn phòng." },
  { id: 5, name: "Combo Đại Dương", price: "2.5tr", img: "https://images.unsplash.com/photo-1599458252573-56ae36120de1?q=80&w=500", desc: "Cua hoàng đế và tôm hùm bỏ lò phô mai." },
  { id: 6, name: "Buffet Hải Sản", price: "499k", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=500", desc: "Ăn không giới hạn các món hải sản tươi sống." },
  { id: 7, name: "Set Healthy", price: "320k", img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=500", desc: "Hải sản hấp thủy nhiệt giữ trọn vị ngọt tự nhiên." },
  { id: 8, name: "Combo Trẻ Em", price: "120k", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=500", desc: "Xúc xích hải sản và cơm cuộn vui nhộn." },
  { id: 9, name: "Set Sashimi King", price: "1.8tr", img: "https://tse2.mm.bing.net/th/id/OIP.bbSXN1SmmXzs16LDvPNIpAHaE8?pid=Api&P=0&h=180", desc: "Đầy đủ các loại cá nhập khẩu cao cấp nhất." },
  { id: 10, name: "Tiệc Ngoài Trời", price: "3.5tr", img: "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=500", desc: "Set nướng BBQ hải sản kèm nhân viên phục vụ tại chỗ." }
];

const SERVICES_DATA = [
  { title: 'Đặt Bàn Trực Tuyến', desc: 'Không gian thoáng mát với ẩm thực phong phú đa dạng kết hợp nhiều tiện ích cho bữa ăn hấp dẫn.', icon: <Calendar size={32} />, img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400', btn: 'Đặt Bàn' },
  { title: 'Giao Hàng Tận Nơi', desc: 'Chúng tôi cung cấp dịch vụ đóng gói và vận chuyển chuyên nghiệp không làm mất đi vị ngon của món ăn.', icon: <Truck size={32} />, img: 'https://images.unsplash.com/photo-1553247407-23251ce81f59?q=80&w=400', btn: 'Giao Hàng' },
  { title: 'Sự Kiện', desc: 'Nếu bạn cần một không gian trang trí nhiều màu sắc kết hợp âm nhạc, hãy đến với chúng tôi để trải nghiệm.', icon: <PartyPopper size={32} />, img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=400', btn: 'Xem Sự Kiện' }
];

const REVIEWS_DATA = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  name: ["Minh Trần", "Lan Anh", "Hoàng Nam", "Thu Thủy", "Quốc Bảo", "Mai Phương", "Đức Anh", "Hạnh Hồng", "Thanh Tùng", "Bích Ngọc"][i % 10],
  text: [
    "Hải sản tươi sống nhất tôi từng thử. Không gian cực kỳ sang trọng.",
    "Món cua sốt trứng muối rất đậm đà, nhân viên phục vụ 10 điểm.",
    "View biển đẹp, đồ ăn ra nhanh và nóng hổi. Rất đáng tiền!",
    "Lẩu hải sản vị thanh ngọt tự nhiên, gia đình tôi rất thích."
  ][i % 4],
  avatar: `https://i.pravatar.cc/150?u=v${i + 50}`
}));

// --- SMALL COMPONENTS ---

const ProductCard = ({ name, price, desc, img, isCombo = false }) => (
  <div className="product-card">
    <div className="product-img-container">
      <img 
        src={img?.startsWith('http') ? img : `https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net${img}`} 
        alt={name} 
        className="product-img" 
        loading="lazy" 
      />
      <div className="product-price-tag">{typeof price === 'number' ? price.toLocaleString() + 'đ' : price}</div>
      <div className="heart-icon">
        <Heart size={18} fill="#FF7A21" color="#FF7A21" />
      </div>
    </div>
    <div className="product-body">
      <h4 className="product-name">{name}</h4>
      <p className="product-text">{desc}</p>
      <button className={`add-to-cart-btn ${isCombo ? 'btn-combo-active' : ''}`}>
        {isCombo ? 'ĐẶT COMBO' : 'THÊM VÀO GIỎ'}
      </button>
    </div>
  </div>
);

const SectionDivider = ({ topColor = "#ffffff", bottomColor = "#ffffff" }) => (
  <div className="section-divider-container" style={{ background: `linear-gradient(to bottom, ${topColor} 50%, ${bottomColor} 50%)` }}>
    <div className="section-divider"></div>
  </div>
);

const ServiceHighlight = ({ navigate }) => (
  <section className="section-padding service-highlight-section">
    <div className="service-vertical-grid">
      {SERVICES_DATA.map((s, i) => (
        <div key={i} className="service-vertical-card">
          <div className="service-img-wrap">
            <img src={s.img} alt={s.title} className="service-vertical-img" />
            <div className="service-icon-overlay">{s.icon}</div>
          </div>
          <div className="service-body">
            <h3 className="service-title-text">{s.title}</h3>
            <p className="service-desc-text">{s.desc}</p>
            <button className="service-btn" onClick={() => {
              if (s.btn === 'Đặt Bàn') navigate('/booking');
              else if (s.btn === 'Giao Hàng') navigate('/delivery');
              else navigate('/events');
            }}>
              {s.btn}
            </button>
          </div>
        </div>
      ))}
    </div>
  </section>
);

// --- UPDATED DISCOUNT SECTION FROM API ---
const DiscountAndInfo = ({ navigate }) => {
  const [discountIdx, setDiscountIdx] = useState(0);
  const [foodDiscounts, setFoodDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const response = await axios.get("https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net/api/food/discount");
        setFoodDiscounts(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Lỗi API Discount:", err);
        setLoading(false);
      }
    };
    fetchDiscounts();
  }, []);

  useEffect(() => {
    if (foodDiscounts.length > 0) {
      const timer = setInterval(() => {
        setDiscountIdx(prev => (prev === foodDiscounts.length - 1 ? 0 : prev + 1));
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [foodDiscounts]);

  if (loading || foodDiscounts.length === 0) return null;

  const current = foodDiscounts[discountIdx];
  const discountPercent = Math.round(((current.price - current.promotionalPrice) / current.price) * 100);

  return (
    <section className="info-section">
      <div className="info-grid">
        <div className="discount-card-new">
          <div className="card-header">
            <h2 className="info-title-left">ƯU ĐÃI GIỜ VÀNG 🔥</h2>
          </div>
          <div className="discount-dish-layout">
            <div className="discount-img-part">
              <button className="mini-circle-nav nav-left" onClick={() => setDiscountIdx(p => p === 0 ? foodDiscounts.length - 1 : p - 1)}>
                <ChevronLeft size={20}/>
              </button>
              <img 
                src={current.image?.startsWith('http') ? current.image : `https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net${current.image}`} 
                alt={current.name} 
                className="discount-img-new" 
              />
              <button className="mini-circle-nav nav-right" onClick={() => setDiscountIdx(p => p === foodDiscounts.length - 1 ? 0 : p + 1)}>
                <ChevronRight size={20}/>
              </button>
              <div className="discount-badge">-{discountPercent}%</div>
            </div>
            <div className="discount-info-part">
              <h3 className="discount-name-new">{current.name}</h3>
              <p style={{fontSize: '0.85rem', color: '#636e72', margin: '5px 0', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                {current.description}
              </p>
              <div className="price-container-new">
                <span className="old-price-new">{current.price.toLocaleString()}đ</span>
                <span className="new-price-new">{current.promotionalPrice.toLocaleString()}đ</span>
              </div>
              <div className="stock-level">
                <div className="stock-bar">
                  <div className="stock-fill" style={{width: '75%'}}></div>
                </div>
                <span className="stock-text">⭐ {current.rating} | {current.viewCount} lượt xem</span>
              </div>
              <button className="btn-order-now" onClick={() => navigate('/menu')}>SĂN NGAY</button>
              <div className="discount-dots">
                {foodDiscounts.map((_, i) => (
                  <div key={i} className={`mini-dot ${discountIdx === i ? 'active' : ''}`} />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="restaurant-card-new">
          <h2 className="main-title info-restaurant-title">THÔNG TIN NHÀ HÀNG</h2>
          <div className="res-content-new">
            <div className="res-image-wrap-new">
              <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600" alt="Restaurant" className="res-img-new" />
              <div className="rating-overlay">
                <Star size={14} fill="#FF7A21" color="#FF7A21" />
                <span className="rating-text">4.9 (1.2k Đánh giá)</span>
              </div>
            </div>
            <div className="res-info-list">
              <div className="info-item">
                <div className="info-icon-box"><MapPin size={18} /></div>
                <div><p className="info-label">Địa chỉ</p><p className="info-value">123 Võ Nguyên Giáp, Đà Nẵng</p></div>
              </div>
              <div className="info-item">
                <div className="info-icon-box"><Clock size={18} /></div>
                <div><p className="info-label">Giờ mở cửa</p><p className="info-value">10:00 - 23:30 (Hàng ngày)</p></div>
              </div>
              <div className="info-item">
                <div className="info-icon-box"><Phone size={18} /></div>
                <div><p className="info-label">Hotline đặt bàn</p><p className="info-value">1900 1234 - 0905 123 xxx</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- MAIN HOME PAGE ---
const Home = () => {
  const navigate = useNavigate();
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [heroIdx, setHeroIdx] = useState(0);
  const [bestIdx, setBestIdx] = useState(0);
  const [comboIdx, setComboIdx] = useState(COMBOS_DATA.length); 
  const [isBestTransition, setIsBestTransition] = useState(true);
  const [isComboTransition, setIsComboTransition] = useState(true);
  const [reviewOffset, setReviewOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const response = await axios.get("https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net/api/food/best-sellers?top=10");
        const mappedData = response.data.map(item => ({
          id: item.foodId,
          name: item.name,
          price: item.price,
          img: item.image,
          desc: item.description || "Thưởng thức hương vị hải sản thượng hạng."
        }));
        setBestSellers(mappedData);
        BEST_SELLERS_DATA = mappedData;
        setLoading(false);
      } catch (err) {
        console.error("Lỗi khi gọi API Best Sellers:", err);
        setLoading(false);
      }
    };
    fetchBestSellers();
  }, []);

  useEffect(() => {
    if (loading || bestSellers.length === 0) return;
    const timer = setInterval(() => {
      setIsBestTransition(true);
      setBestIdx(prev => prev + 1);
      
      setIsComboTransition(true);
      setComboIdx(prev => prev - 1); 

      setIsTransitioning(true);
      setReviewOffset(p => p + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, [loading, bestSellers]);

  useEffect(() => {
    if (bestSellers.length > 0 && bestIdx >= bestSellers.length) {
      setTimeout(() => { setIsBestTransition(false); setBestIdx(0); }, 800);
    }
    if (comboIdx <= 0) {
      setTimeout(() => { setIsComboTransition(false); setComboIdx(COMBOS_DATA.length); }, 800);
    }
    if (reviewOffset === 10) {
      setTimeout(() => { setIsTransitioning(false); setReviewOffset(0); }, 1200); 
    }
  }, [bestIdx, comboIdx, reviewOffset, bestSellers]);

  useEffect(() => {
    const timer = setInterval(() => setHeroIdx(p => (p + 1) % HERO_DATA.length), 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="app">
      <Header navigate={navigate} />
      
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-main">
          <div className="hero-info">
            <div className="hero-content-slider">
              {HERO_DATA.map((item, i) => (
                <div key={item.id} className={`hero-slide-text ${heroIdx === i ? 'active' : ''}`}>
                  <span className="hero-tag">{item.tag}</span>
                  <h1 className="hero-title">{item.title}</h1>
                  <p className="hero-desc">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate('/register')}>ĐẶT MÓN NGAY</button>
              <button className="btn-secondary" onClick={() => navigate('/menu')}>XEM THỰC ĐƠN</button>
            </div>
          </div>
          <div className="hero-image-wrap">
            {HERO_DATA.map((item, i) => (
              <img key={item.id} src={item.img} className={`hero-img ${heroIdx === i ? 'active' : ''}`} alt="banner" />
            ))}
            <div className="slider-dots">
              {HERO_DATA.map((_, i) => (
                <div key={i} onClick={() => setHeroIdx(i)} className={`dot ${heroIdx === i ? 'active' : ''}`}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SectionDivider topColor="#ffffff" bottomColor="#ffffff" />
      <ServiceHighlight navigate={navigate} />
      <SectionDivider topColor="#ffffff" bottomColor="#ffffff" />

      {/* CAROUSEL 1: DÙNG DỮ LIỆU TỪ API */}
      <section className="section-padding mon-an-ban-chay">
        <div className="category-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <h2 className="main-title">MÓN ĂN BÁN CHẠY 🔥</h2>
            <p className="sub-title">Top hương vị đại dương được yêu thích nhất từ API</p>
          </div>
          <button className="view-all-link" onClick={() => navigate('/menu')}>Xem tất cả <ChevronRight size={16} /></button>
        </div>

        <div className="carousel-container">
          <button className="carousel-nav nav-left" onClick={() => setBestIdx(p => p - 1)}><ChevronLeft /></button>
          <div className="carousel-window">
            <div className="carousel-track" style={{
                transform: `translateX(-${bestIdx * 25}%)`,
                transition: isBestTransition ? 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            }}>
              {[...bestSellers, ...bestSellers].map((item, idx) => (
                <div key={idx} className="carousel-item"><ProductCard {...item} /></div>
              ))}
            </div>
          </div>
          <button className="carousel-nav nav-right" onClick={() => setBestIdx(p => p + 1)}><ChevronRight /></button>
        </div>
      </section>

      <SectionDivider topColor="#ffffff" bottomColor="#ffffff" />

      {/* CAROUSEL 2: COMBO */}
      <section className="section-padding combo-section">
        <div className="category-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <button className="view-all-link" onClick={() => navigate('/menu')}> <ChevronLeft size={16} /> Khám phá thêm</button>
          <div style={{ textAlign: 'right' }}>
            <h2 className="main-title">COMBO SIÊU LỜI 🍱</h2>
            <p className="sub-title" style={{ color: '#636E72' }}>Tiết kiệm hơn khi đi cùng nhóm</p>
          </div>
        </div>
        <div className="carousel-container">
          <button className="carousel-nav nav-left dark-nav" onClick={() => setComboIdx(p => p - 1)}><ChevronLeft /></button>
          <div className="carousel-window">
            <div className="carousel-track" style={{
                transform: `translateX(-${comboIdx * 25}%)`,
                transition: isComboTransition ? 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            }}>
              {[...COMBOS_DATA, ...COMBOS_DATA, ...COMBOS_DATA].map((item, idx) => (
                <div key={idx} className="carousel-item"><ProductCard {...item} isCombo={true} /></div>
              ))}
            </div>
          </div>
          <button className="carousel-nav nav-right dark-nav" onClick={() => setComboIdx(p => p + 1)}><ChevronRight /></button>
        </div>
      </section>

      {/* REVIEW SECTION */}
      <SectionDivider topColor="#ffffff" bottomColor="#0D0D0D" />
      <section className="review-section">
        <div className="review-header-layout">
          <div className="review-left">
            <Quote size={50} className="quote-icon" />
            <h2 className="main-title review-main-title">
              Khách hàng nói gì <br/> 
              về <span className="highlight-text">chúng tôi?</span>
            </h2>
            <div className="rating-summary">
              <span className="big-rating">4.9</span>
              <div className="rating-stars-container">
                <div className="stars-row">
                  {[1,2,3,4,5].map(s => <Star key={s} size={20} fill="#FF7A21" color="#FF7A21" />)}
                </div>
                <p className="total-reviews">1,500+ ĐÁNH GIÁ THỰC TẾ</p>
              </div>
            </div>
          </div>
          <div className="review-container">
            <div className="review-column">
              <div className="review-track" style={{
                transform: `translateY(-${reviewOffset * 310}px)`, 
                transition: isTransitioning ? 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
              }}>
                {REVIEWS_DATA.slice(0, 10).concat(REVIEWS_DATA.slice(0, 10)).map((item, i) => (
                  <div key={i} className="feedback-card">
                    <p className="feedback-text">"{item.text}"</p>
                    <div className="feedback-user">
                      <img src={item.avatar} className="real-avatar" alt="avatar" />
                      <div>
                        <p className="user-name">{item.name}</p>
                        <p className="user-status">Thực khách hài lòng</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="review-column">
              <div className="review-track track-reverse" style={{
                transform: `translateY(-${(9 - reviewOffset) * 310}px)`,
                transition: isTransitioning ? 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
              }}>
                {REVIEWS_DATA.slice(10, 20).concat(REVIEWS_DATA.slice(10, 20)).map((item, i) => (
                  <div key={i} className="feedback-card">
                    <p className="feedback-text">"{item.text}"</p>
                    <div className="feedback-user">
                      <img src={item.avatar} className="real-avatar" alt="avatar" />
                      <div>
                        <p className="user-name">{item.name}</p>
                        <p className="user-status">Thực khách hài lòng</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider topColor="#0D0D0D" bottomColor="#ffffff" />
      
      {/* PHẦN ĐÃ SỬA: DÙNG API /api/food/discount */}
      <DiscountAndInfo navigate={navigate} />
      
      <Footer />
    </div>
  );
};

export default Home;