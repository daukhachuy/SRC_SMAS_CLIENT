import React, { useState, useEffect } from 'react';
import '../styles/Home.css';
import { 
  User, Bell, ShoppingBag, MessageSquare, 
  ChevronLeft, ChevronRight,
  Facebook, Instagram, Twitter, 
  Phone, MapPin, Star, Quote, Mail, Heart, Clock,
  Calendar, Truck, PartyPopper
} from 'lucide-react';

// --- DATA ---
const HERO_DATA = [
  { id: 1, title: "Cá Mú Hoa Hấp Dưa", tag: "Best Seller", desc: "Tinh hoa biển cả với thớ cá trắng ngần, quyện cùng vị chua thanh của dưa cải, tạo nên bản giao hương vị khó cưỡng.", img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=1000" },
  { id: 2, title: "Lẩu Nướng Hải Sản", tag: "Signature", desc: "Sự kết hợp hoàn hảo giữa các loại hải sản tươi sống và nước lẩu đặc trưng, mang lại hương vị truyền thống tinh tế.", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1000" },
  { id: 3, title: "Combo Family", tag: "Promotion", desc: "Trọn vẹn niềm vui sum vầy với set ăn đầy đủ dinh dưỡng, được thiết kế riêng cho những khoảnh khắc ấm áp bên gia đình.", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000" }
];

const BEST_SELLERS_DATA = [
  { id: 1, name: "Tôm Hùm Bỏ Lò", price: "890k", img: "https://file.hstatic.net/200000441267/file/cach-lam-tom-hum-sot-bo-toi-an-la-ghien-04_dfab10dfd2cc43deb08e034d061cb237_grande.jpg", desc: "Tôm hùm xanh tươi sống kết hợp phô mai Mozzarella tan chảy." },
  { id: 2, name: "Cua Hoàng Đế", price: "2.4tr", img: "https://images.unsplash.com/photo-1599458252573-56ae36120de1?q=80&w=500", desc: "Cua hoàng đế hấp rượu vang trắng giữ trọn vị ngọt thanh khiết." },
  { id: 3, name: "Cá Hồi Áp Chảo", price: "450k", img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=500", desc: "Sốt chanh dây thanh mát kết hợp măng tây giòn ngọt." },
  { id: 4, name: "Mực Trứng Nướng", price: "320k", img: "https://haisancoto.com/uploads/images/muc-trung-nuong-muoi-ot.jpg", desc: "Mực trứng tươi nướng muối ớt cay nồng hấp dẫn." },
  { id: 5, name: "Hàu Nướng Mỡ Hành", price: "150k", img: "https://cdn.tgdd.vn/Files/2018/12/20/1139386/cong-thuc-cach-lam-hau-nuong-mo-hanh-bang-lo-vi-song-cuc-ngon-7-760x367.jpg", desc: "Hàu sữa béo ngậy cùng mỡ hành thơm nức." },
  { id: 6, name: "Bào Ngư Sốt Dầu Hào", price: "680k", img: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=500", desc: "Bào ngư thượng hạng hầm nấm đông cô đậm đà." },
  { id: 7, name: "Ốc Hương Cam Muối", price: "280k", img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500", desc: "Ốc hương giòn sần sật quyện sốt trứng muối cam." },
  { id: 8, name: "Lẩu Thái Hải Sản", price: "550k", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=500", desc: "Nước dùng chua cay đậm đà với tôm, mực, nghêu." },
  { id: 9, name: "Sashimi Tổng Hợp", price: "790k", img: "https://spartabeerclub.vn/media/images/article/252/cach-lam-ca-hoi-sashimi-4.jpg", desc: "Các loại cá tươi sống thái lát chuẩn phong cách Nhật." },
  { id: 10, name: "Cơm Chiên Hải Sản", price: "180k", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=500", desc: "Cơm chiên tơi xốp với tôm, mực và rau củ." },
];

const COMBOS_DATA = [
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

const DISCOUNTS_DATA = [
  { id: 1, name: "Tôm hùm baby sốt bơ tỏi", oldPrice: "300k", newPrice: "199k", discount: "-35%", img: "https://images.unsplash.com/photo-1553247407-23251ce81f59?auto=format&fit=crop&q=80&w=800", left: 5 },
  { id: 2, name: "Cua Cà Mau hấp nước dừa", oldPrice: "450k", newPrice: "315k", discount: "-30%", img: "https://images.unsplash.com/photo-1599458252573-56ae36120de1?auto=format&fit=crop&q=80&w=800", left: 8 },
  { id: 3, name: "Hàu nướng phô mai Pháp", oldPrice: "180k", newPrice: "120k", discount: "-33%", img: "https://images.unsplash.com/photo-1599249300675-c39f1dd2d6be?auto=format&fit=crop&q=80&w=800", left: 12 },
  { id: 4, name: "Lẩu Cá Đuối đặc sản", oldPrice: "350k", newPrice: "245k", discount: "-30%", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800", left: 3 },
  { id: 5, name: "Mực lá câu hấp hành gừng", oldPrice: "280k", newPrice: "199k", discount: "-28%", img: "https://haisancoto.com/uploads/images/muc-trung-nuong-muoi-ot.jpg", left: 15 },
  { id: 6, name: "Sò huyết cháy tỏi", oldPrice: "150k", newPrice: "99k", discount: "-34%", img: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=500", left: 20 },
];

const SERVICES_DATA = [
  { title: 'Đặt Bàn Trực Tuyến', desc: 'Không gian thoáng mát với ẩm thực phong phú đa dạng kết hợp nhiều tiện ích cho bữa ăn hấp dẫn.', icon: <Calendar size={32} color="#FF7A21" />, img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400', btn: 'Đặt Bàn' },
  { title: 'Giao Hàng Tận Nơi', desc: 'Chúng tôi cung cấp dịch vụ đóng gói và vận chuyển chuyên nghiệp không làm mất đi vị ngon của món ăn.', icon: <Truck size={32} color="#FF7A21" />, img: 'https://images.unsplash.com/photo-1526367790999-0150786486a2?auto=format&fit=crop&q=80&w=400', btn: 'Giao Hàng' },
  { title: 'Sự Kiện', desc: 'Nếu bạn cần một không gian trang trí nhiều màu sắc kết hợp âm nhạc, hãy đến với chúng tôi để trải nghiệm.', icon: <PartyPopper size={32} color="#FF7A21" />, img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=400', btn: 'Xem Sự Kiện' }
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

const Header = () => (
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
          <span key={item} className="nav-item">{item}</span>
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
        <div className="icon-circle" style={{border: '2px solid #FF7A21'}}>
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

const ProductCard = ({ name, price, desc, img, isCombo = false }) => (
  <div className="product-card">
    <div className="product-img-container">
      <img src={img} alt={name} className="product-img" loading="lazy" />
      <div className="product-price-tag">{price}</div>
      <div className="heart-icon">
        <Heart size={18} fill="#FF7A21" color="#FF7A21" />
      </div>
    </div>
    <div className="product-body">
      <h4 className="product-name">{name}</h4>
      <p className="product-text">{desc}</p>
      <button 
        className={`add-to-cart-btn ${isCombo ? 'btn-combo-active' : ''}`}
        style={{
          backgroundColor: isCombo ? '#FF7A21' : '#F5F5F5', 
          color: isCombo ? '#fff' : '#1A1A1A',
          transition: '0.3s'
        }}
      >
        {isCombo ? 'ĐẶT COMBO' : 'THÊM VÀO GIỎ'}
      </button>
    </div>
  </div>
);

const SectionDivider = ({ topColor = "#ffffff", bottomColor = "#ffffff" }) => (
  <div 
    className="section-divider-container" 
    style={{ 
      background: `linear-gradient(to bottom, ${topColor} 50%, ${bottomColor} 50%)`,
      margin: 0,
      padding: 0,
      border: 'none',
      height: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 5
    }}
  >
    <div className="section-divider"></div>
  </div>
);

const ServiceHighlight = () => (
  <section className="section-padding" style={{backgroundColor: '#F9FAFB', paddingBottom: 0}}>
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
            <button className="service-btn">{s.btn}</button>
          </div>
        </div>
      ))}
    </div>
  </section>
);

const DiscountAndInfo = () => {
  const [discountIdx, setDiscountIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(9910);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setDiscountIdx(prev => (prev === DISCOUNTS_DATA.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const current = DISCOUNTS_DATA[discountIdx];

  return (
    <section className="info-section" style={{ backgroundColor: '#ffffff', paddingTop: '20px' }}>
      <div className="info-grid">
        <div className="discount-card-new">
          <div className="card-header">
            <h2 className="info-title-left">ƯU ĐÃI GIỜ VÀNG 🔥</h2>
            <div className="timer-badge">Hết hạn sau: {formatTime(timeLeft)}</div>
          </div>
          <div className="discount-dish-layout">
            <div className="discount-img-part">
              <button className="mini-circle-nav" style={{left: 10}} onClick={() => setDiscountIdx(p => p === 0 ? DISCOUNTS_DATA.length - 1 : p - 1)}>
                <ChevronLeft size={20}/>
              </button>
              <img src={current.img} alt={current.name} className="discount-img-new" />
              <button className="mini-circle-nav" style={{right: 10}} onClick={() => setDiscountIdx(p => p === DISCOUNTS_DATA.length - 1 ? 0 : p + 1)}>
                <ChevronRight size={20}/>
              </button>
              <div className="discount-badge">{current.discount}</div>
            </div>
            <div className="discount-info-part">
              <h3 className="discount-name-new">{current.name}</h3>
              <div className="price-container-new">
                <span className="old-price-new">{current.oldPrice}</span>
                <span className="new-price-new">{current.newPrice}</span>
              </div>
              <div className="stock-level">
                <div className="stock-bar">
                  <div className="stock-fill" style={{width: `${(current.left/25)*100}%`}}></div>
                </div>
                <span className="stock-text">Còn lại: {current.left} suất</span>
              </div>
              <button className="btn-order-now">SĂN NGAY</button>
              <div className="discount-dots">
                {DISCOUNTS_DATA.map((_, i) => (
                  <div key={i} className="mini-dot" style={{backgroundColor: discountIdx === i ? '#FF7A21' : '#ddd', width: discountIdx === i ? 20 : 8}} />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="restaurant-card-new">
          <h2 className="main-title" style={{color: '#fff', textAlign: 'left', marginBottom: 25, fontSize: 32}}>THÔNG TIN NHÀ HÀNG</h2>
          <div className="res-content-new">
            <div className="res-image-wrap-new">
              <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600" alt="Restaurant" className="res-img-new" />
              <div className="rating-overlay">
                <Star size={14} fill="#FF7A21" color="#FF7A21" />
                <span style={{fontWeight: 800, marginLeft: 5, color: '#1A1A1A'}}>4.9 (1.2k Đánh giá)</span>
              </div>
            </div>
            <div className="res-info-list">
              <div className="info-item">
                <div className="info-icon-box"><MapPin size={18} color="#FF7A21" /></div>
                <div><p className="info-label">Địa chỉ</p><p className="info-value">123 Võ Nguyên Giáp, Đà Nẵng</p></div>
              </div>
              <div className="info-item">
                <div className="info-icon-box"><Clock size={18} color="#FF7A21" /></div>
                <div><p className="info-label">Giờ mở cửa</p><p className="info-value">10:00 - 23:30 (Hàng ngày)</p></div>
              </div>
              <div className="info-item">
                <div className="info-icon-box"><Phone size={18} color="#FF7A21" /></div>
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
  const [heroIdx, setHeroIdx] = useState(0);
  const [bestIdx, setBestIdx] = useState(0);
  const [comboIdx, setComboIdx] = useState(COMBOS_DATA.length); 
  
  const [isBestTransition, setIsBestTransition] = useState(true);
  const [isComboTransition, setIsComboTransition] = useState(true);
  const [reviewOffset, setReviewOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const BEST_EXTENDED = [...BEST_SELLERS_DATA, ...BEST_SELLERS_DATA];
  const COMBO_EXTENDED = [...COMBOS_DATA, ...COMBOS_DATA, ...COMBOS_DATA];

  useEffect(() => {
    const timer = setInterval(() => {
      setIsBestTransition(true);
      setBestIdx(prev => prev + 1);
      
      setIsComboTransition(true);
      setComboIdx(prev => prev - 1); 

      setIsTransitioning(true);
      setReviewOffset(p => p + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (bestIdx >= BEST_SELLERS_DATA.length) {
      setTimeout(() => { 
        setIsBestTransition(false); 
        setBestIdx(0); 
      }, 800);
    }
    if (comboIdx <= 0) {
      setTimeout(() => { 
        setIsComboTransition(false); 
        setComboIdx(COMBOS_DATA.length); 
      }, 800);
    }
    if (reviewOffset === 10) {
      setTimeout(() => { setIsTransitioning(false); setReviewOffset(0); }, 1200); 
    }
  }, [bestIdx, comboIdx, reviewOffset]);

  useEffect(() => {
    const timer = setInterval(() => setHeroIdx(p => (p + 1) % HERO_DATA.length), 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="app">
      <Header />
      
      <section className="hero-section" style={{ backgroundColor: '#ffffff' }}>
        <div className="hero-main">
          <div className="hero-info">
            <div style={{ position: 'relative', minHeight: '350px' }}>
              {HERO_DATA.map((item, i) => (
                <div key={item.id} style={{
                  position: i === 0 ? 'relative' : 'absolute',
                  top: 0, left: 0, width: '100%',
                  opacity: heroIdx === i ? 1 : 0,
                  transition: 'opacity 1.5s ease-in-out',
                  pointerEvents: heroIdx === i ? 'auto' : 'none'
                }}>
                  <span className="hero-tag">{item.tag}</span>
                  <h1 className="hero-title">{item.title}</h1>
                  <p className="hero-desc">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="hero-actions">
              <button className="btn-primary">ĐẶT MÓN NGAY</button>
              <button className="btn-secondary">XEM THỰC ĐƠN</button>
            </div>
          </div>

          <div className="hero-image-wrap">
            {HERO_DATA.map((item, i) => (
              <img 
                key={item.id} 
                src={item.img} 
                className="hero-img"
                style={{
                  position: i === 0 ? 'relative' : 'absolute',
                  top: 0, left: 0,
                  opacity: heroIdx === i ? 1 : 0,
                  transform: heroIdx === i ? 'scale(1)' : 'scale(1.05)',
                  transition: 'opacity 1.5s ease-in-out, transform 1.5s ease-in-out',
                }} 
                alt="banner" 
              />
            ))}
            <div className="slider-dots">
              {HERO_DATA.map((_, i) => (
                <div key={i} onClick={() => setHeroIdx(i)} className="dot" style={{width: heroIdx === i ? 40 : 10, backgroundColor: heroIdx === i ? '#FF7A21' : '#ccc'}}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <SectionDivider topColor="#ffffff" bottomColor="#F9FAFB" />
      <ServiceHighlight />
      <SectionDivider topColor="#F9FAFB" bottomColor="#ffffff" />

      {/* CAROUSEL 1: CHẠY TIẾN */}
      <section className="section-padding" style={{ backgroundColor: '#ffffff' }}>
        <div className="category-heading">
          <div>
            <h2 className="main-title">MÓN ĂN BÁN CHẠY 🔥</h2>
            <p style={{color: '#666', marginTop: 5}}>Top 10 hương vị đại dương được yêu thích nhất</p>
          </div>
          <div className="line"></div>
        </div>
        <div className="carousel-container">
          <button className="carousel-nav" style={{left: -25}} onClick={() => setBestIdx(p => p - 1)}><ChevronLeft /></button>
          <div className="carousel-window">
            <div className="carousel-track" style={{
                transform: `translateX(-${bestIdx * 25}%)`,
                transition: isBestTransition ? 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            }}>
              {BEST_EXTENDED.map((item, idx) => (
                <div key={idx} className="carousel-item"><ProductCard {...item} /></div>
              ))}
            </div>
          </div>
          <button className="carousel-nav" style={{right: -25}} onClick={() => setBestIdx(p => p + 1)}><ChevronRight /></button>
        </div>
      </section>

      <SectionDivider topColor="#ffffff" bottomColor="#F9FAFB" />

      {/* CAROUSEL 2: CHẠY LÙI */}
      <section className="section-padding" style={{ backgroundColor: '#F9FAFB', paddingBottom: '20px' }}>
        <div className="category-heading">
          <div className="line"></div>
          <div style={{ textAlign: 'right' }}>
            <h2 className="main-title">COMBO SIÊU LỜI 🍱</h2>
            <p style={{ color: '#FF7A21', fontWeight: 700 }}>ƯU ĐÃI ĐẾN 30% KHI ĐẶT TRƯỚC</p>
          </div>
        </div>
        <div className="carousel-container">
          <button className="carousel-nav" style={{ left: -25, backgroundColor: '#1A1A1A', color: '#fff' }} onClick={() => setComboIdx(p => p - 1)}><ChevronLeft /></button>
          <div className="carousel-window">
            <div className="carousel-track" style={{
                transform: `translateX(-${comboIdx * 25}%)`,
                transition: isComboTransition ? 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            }}>
              {COMBO_EXTENDED.map((item, idx) => (
                <div key={idx} className="carousel-item"><ProductCard {...item} isCombo={true} /></div>
              ))}
            </div>
          </div>
          <button className="carousel-nav" style={{ right: -25, backgroundColor: '#1A1A1A', color: '#fff' }} onClick={() => setComboIdx(p => p + 1)}><ChevronRight /></button>
        </div>
      </section>

      <SectionDivider topColor="#F9FAFB" bottomColor="#ffffff" />
      <DiscountAndInfo />
      <SectionDivider topColor="#ffffff" bottomColor="#0D0D0D" />

      <section className="review-section" style={{ backgroundColor: '#0D0D0D' }}>
        <div className="review-header-layout">
          <div>
            <Quote size={50} color="#FF7A21" style={{opacity: 0.5, marginBottom: 15}} />
            <h2 className="main-title" style={{color: '#FFFFFF', fontSize: '56px'}}>
              Khách hàng nói gì <br/> 
              về <span style={{color: '#FF7A21'}}>chúng tôi?</span>
            </h2>
            <div style={{display: 'flex', alignItems: 'center', marginTop: 30}}>
              <span style={{color: '#FF7A21', fontSize: '75px', fontWeight: 950}}>4.9</span>
              <div style={{marginLeft: 20}}>
                <div style={{display: 'flex', gap: 3}}>
                  {[1,2,3,4,5].map(s => <Star key={s} size={20} fill="#FF7A21" color="#FF7A21" />)}
                </div>
                <p style={{fontSize: 14, color: '#888', marginTop: 5, fontWeight: 600}}>1,500+ ĐÁNH GIÁ THỰC TẾ</p>
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
                    <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
                      <img src={item.avatar} className="real-avatar" alt="avatar" />
                      <div>
                        <p style={{fontWeight: 700, fontSize: 16, color: '#fff'}}>{item.name}</p>
                        <p style={{fontSize: 12, color: '#FF7A21'}}>Thực khách hài lòng</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="review-column">
              <div className="review-track" style={{
                transform: `translateY(-${(9 - reviewOffset) * 310}px)`,
                transition: isTransitioning ? 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
              }}>
                {REVIEWS_DATA.slice(10, 20).concat(REVIEWS_DATA.slice(10, 20)).map((item, i) => (
                  <div key={i} className="feedback-card">
                    <p className="feedback-text">"{item.text}"</p>
                    <div style={{display: 'flex', alignItems: 'center', gap: 15}}>
                      <img src={item.avatar} className="real-avatar" alt="avatar" />
                      <div>
                        <p style={{fontWeight: 700, fontSize: 16, color: '#fff'}}>{item.name}</p>
                        <p style={{fontSize: 12, color: '#FF7A21'}}>Thực khách hài lòng</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <FloatingChat />
      
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div>
              <div className="logo-group" style={{marginBottom: 20}}>
                <span style={{ fontSize: 26, fontWeight: 900 }}>
                  <span style={{color: '#FFFFFF'}}>OCEAN</span>
                  <span style={{color: '#FF7A21'}}>GRILL</span>
                </span>
              </div>
              <p className="footer-text">Tinh hoa ẩm thực biển khơi trong không gian sang trọng.</p>
              <div className="social-row">
                {[Facebook, Instagram, Twitter, Mail].map((Icon, i) => (
                  <div key={i} className="social-icon"><Icon size={18} /></div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="footer-heading">KHÁM PHÁ</h4>
              <ul className="footer-list">
                {['Thực đơn chính', 'Hải sản tươi sống', 'Đặt tiệc & Sự kiện', 'Ưu đãi'].map(item => (
                  <li key={item} className="footer-list-item">{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="footer-heading">LIÊN HỆ</h4>
              <p className="footer-text"><MapPin size={16} color="#FF7A21" /> 123 Võ Nguyên Giáp, Đà Nẵng</p>
              <p className="footer-text"><Phone size={16} color="#FF7A21" /> +84 905 123 456</p>
            </div>
            <div>
              <h4 className="footer-heading">BẢN TIN</h4>
              <div className="newsletter-box">
                <input placeholder="Email của bạn..." className="newsletter-input" />
                <button className="newsletter-btn">GỬI</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;