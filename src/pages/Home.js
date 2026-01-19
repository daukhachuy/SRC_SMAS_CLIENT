import React, { useState, useEffect } from 'react';
import { 
  User, Bell, ShoppingBag, MessageSquare, 
  ChevronLeft, ChevronRight,
  Facebook, Phone, MapPin, Star, Quote, Mail, ArrowRight, Heart, Clock, Globe,
  Calendar, Truck, PartyPopper
} from 'lucide-react';

// --- DATA ---
const HERO_DATA = [
  { id: 1, title: "Cá Mú Hoa Hấp Dưa", tag: "Best Seller", desc: "Tinh hoa biển cả với thớ cá trắng ngần, quyện cùng vị chua thanh của dưa cải, tạo nên bản giao hương vị khó cưỡng.", img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=1000" },
  { id: 2, title: "Lẩu Nướng Hải Sản", tag: "Signature", desc: "Sự kết hợp hoàn hảo giữa các loại hải sản tươi sống và nước lẩu đặc trưng, mang lại hương vị truyền thống tinh tế.", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1000" },
  { id: 3, title: "Combo Family", tag: "Promotion", desc: "Trọn vẹn niềm vui sum vầy với set ăn đầy đủ dinh dưỡng, được thiết kế riêng cho những khoảnh khắc ấm áp bên gia đình.", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000" }
];

const SERVICES_DATA = [
  { title: 'Đặt Bàn Trực Tuyến', desc: 'Không gian thoáng mát với ẩm thực phong phú đa dạng kết hợp nhiều tiện ích cho bữa ăn hấp dẫn.', icon: <Calendar size={32} color="#FF7A21" />, img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400', btn: 'Đặt Bàn' },
  { title: 'Giao Hàng Tận Nơi', desc: 'Chúng tôi cung cấp dịch vụ đóng gói và vận chuyển chuyên nghiệp không làm mất đi vị ngon của món ăn.', icon: <Truck size={32} color="#FF7A21" />, img: '/images/Ship.jpg', btn: 'Giao Hàng' },
  { title: 'Sự Kiện', desc: 'Nếu bạn cần một không gian trang trí nhiều màu sắc kết hợp âm nhạc, hãy đến với chúng tôi để trải nghiệm.', icon: <PartyPopper size={32} color="#FF7A21" />, img: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=400', btn: 'Xem Sự Kiện' }
];

// --- MAIN COMPONENTS ---

const Header = () => (
  <nav style={styles.navbar}>
    <div style={styles.navContainer}>
      <div style={styles.navLeft}>
        <div style={styles.logoGroup}>
          <img 
            src="/images/lOGO.png" 
            alt="Logo" 
            style={styles.logoImg} 
            onError={(e) => { e.target.src = 'https://via.placeholder.com/50'; }}
          />
          <span style={styles.logoText}>
            <span style={{color: '#fff'}}>OCEAN</span>
            <span style={{color: '#FF7A21'}}>GRILL</span>
          </span>
        </div>
      </div>
      <div style={styles.navLinks}>
        {['THỰC ĐƠN', 'KHUYẾN MÃI', 'DỊCH VỤ', 'VỀ CHÚNG TÔI'].map(item => (
          <span key={item} style={styles.navItem}>{item}</span>
        ))}
      </div>
      <div style={styles.navRight}>
        <div style={styles.iconCircle}>
          <Bell size={20} color="#fff" />
          <span style={{...styles.badge, backgroundColor: '#FF4D4F'}}>5</span>
        </div>
        <div style={styles.iconCircle}>
          <ShoppingBag size={20} color="#fff" /> 
          <span style={styles.badge}>3</span>
        </div>
        <div style={{...styles.iconCircle, border: '2px solid #FF7A21'}}>
          <User size={20} color="#fff" />
        </div>
      </div>
    </div>
  </nav>
);

const FloatingChat = () => (
  <div style={styles.fixedChat}>
    <MessageSquare size={28} color="white" />
    <span style={styles.onlineStatus}></span>
  </div>
);

const ServiceHighlight = () => (
    <section style={{...styles.sectionPadding, backgroundColor: '#F9FAFB', paddingTop: 120, position: 'relative'}}>
      <div style={styles.topDividerLine}></div>
      <div style={styles.serviceVerticalGrid}>
        {SERVICES_DATA.map((s, i) => (
          <div key={i} style={styles.serviceVerticalCard}>
            <div style={styles.serviceImgWrap}>
              <img src={s.img} alt={s.title} style={styles.serviceVerticalImg} />
              <div style={styles.serviceIconOverlay}>{s.icon}</div>
            </div>
            <div style={styles.serviceBody}>
              <h3 style={styles.serviceTitleText}>{s.title}</h3>
              <p style={styles.serviceDescText}>{s.desc}</p>
              <button style={styles.serviceBtn}>{s.btn}</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
  
  const ProductCard = ({ name, price, desc, img }) => (
    <div style={styles.productCard}>
      <div style={styles.productImgContainer}>
        <img 
          src={img} 
          alt={name} 
          style={styles.productImg} 
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1553247407-23251ce81f59?q=80&w=500'; }}
        />
        <div style={styles.productPriceTag}>{price}</div>
        <div style={styles.heartIcon}><Heart size={18} fill="#FF7A21" color="#FF7A21" /></div>
      </div>
      <div style={styles.productBody}>
        <h4 style={styles.productName}>{name}</h4>
        <p style={styles.productText}>{desc}</p>
        <button style={styles.addToCartBtn}>THÊM VÀO GIỎ</button>
      </div>
    </div>
  );
  
  const ComboSection = () => (
    <section style={{...styles.sectionPadding, backgroundColor: '#F9FAFB'}}>
      <div style={styles.categoryHeading}>
        <div>
          <h2 style={styles.mainTitle}>COMBO SIÊU LỜI 🔥</h2>
          <p style={{color: '#FF7A21', fontWeight: 700}}>ƯU ĐÃI ĐẾN 30% KHI ĐẶT TRƯỚC</p>
        </div>
        <div style={styles.line}></div>
      </div>
      <div style={styles.comboGrid}>
        <div style={styles.comboCardMain}>
          <div style={styles.comboBadge}>BEST VALUE</div>
          <div style={styles.comboContent}>
            <h3 style={styles.comboTitleLarge}>Gia Đình Sum Vầy</h3>
            <p style={{fontSize: 18, color: '#666', marginBottom: 20}}>Lẩu hải sản (L), 2 món nướng tự chọn, Gỏi hải sản & Nước ngọt đại gia đình.</p>
            <div style={styles.comboPriceRow}>
              <span style={styles.oldPrice}>1.200.000đ</span>
              <span style={styles.newPrice}>899.000đ</span>
            </div>
            <button style={styles.btnPrimary}>ĐẶT NGAY</button>
          </div>
          <img src="https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=600" style={styles.comboImgMain} alt="combo" />
        </div>
        <div style={styles.comboSubCol}>
          <div style={styles.comboCardSmall}>
            <div style={{flex: 1}}>
              <h4 style={styles.comboTitleSmall}>Set Couple</h4>
              <div style={styles.newPriceSmall}>450.000đ</div>
            </div>
            <img src="https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&q=80&w=200" style={styles.comboImgSmall} alt="combo small" />
          </div>
          <div style={{...styles.comboCardSmall, backgroundColor: '#1A1A1A', color: '#fff'}}>
            <div style={{flex: 1}}>
              <h4 style={styles.comboTitleSmall}>Tiệc Nhậu</h4>
              <div style={{...styles.newPriceSmall, color: '#FF7A21'}}>1.590.000đ</div>
            </div>
            <img src="https://images.unsplash.com/photo-1511071333322-5844240a4e40?auto=format&fit=crop&q=80&w=200" style={styles.comboImgSmall} alt="combo small" />
          </div>
        </div>
      </div>
    </section>
  );
  
  const DiscountAndInfo = () => (
    <section style={styles.infoSection}>
      <div style={styles.infoGrid}>
        <div style={styles.discountCard}>
          <h2 style={styles.infoTitle}>Các Món Đang Giảm Giá</h2>
          <div style={styles.discountContent}>
            <img src="https://images.unsplash.com/photo-1553247407-23251ce81f59?auto=format&fit=crop&q=80&w=800" alt="Tôm hùm baby" style={styles.discountImg} />
            <h3 style={styles.discountName}>Tôm hùm baby sốt bơ tỏi</h3>
            <div style={styles.priceRow}>
              <span style={styles.oldPriceInfo}>300.000đ</span>
              <span style={styles.newPriceInfo}>199.000đ</span>
            </div>
            <p style={styles.discountDesc}>Tôm hùm baby tươi sống được chế biến theo công thức đặc biệt, nướng trên bếp than hồng thơm nức.</p>
            <button style={styles.btnAction}>XEM CHI TIẾT</button>
          </div>
        </div>
        <div style={styles.restaurantCard}>
          <h2 style={styles.infoTitle}>Thông tin nhà hàng</h2>
          <div style={styles.resContent}>
            <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600" alt="Nhà hàng" style={styles.resImg} />
            <div style={styles.resBody}>
              <h3 style={styles.resName}>Ocean Grill Seafood Restaurant</h3>
              <div style={styles.stars}>{[1,2,3,4,5].map(i => <Star key={i} size={14} fill="#FF7A21" color="#FF7A21" />)}</div>
              <div style={styles.resDetail}>
                <p><MapPin size={14} /> 123 Võ Nguyên Giáp, Đà Nẵng</p>
                <p><Clock size={14} /> Mở cửa: 10:00 - 23:00</p>
                <p><Phone size={14} /> Hotline: 1900 1234</p>
                <p><Globe size={14} /> Web: oceangrill.vn</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
  
  const ReviewsSection = () => {
    const [active, setActive] = useState(0);
    const reviews = [
      { name: "Lê Minh", job: "Food Blogger", text: "Hải sản tươi sống nhất mà tôi từng thử. Không gian sang trọng và nhân viên chuyên nghiệp." },
      { name: "Thanh Hương", job: "Doanh nhân", text: "Vị nước lẩu rất đặc biệt, thanh ngọt tự nhiên không gắt. Rất phù hợp tiếp khách." }
    ];
    return (
      <section style={styles.reviewSection}>
        <div style={styles.reviewBox}>
          <div>
            <Quote size={80} color="#FF7A21" style={{opacity: 0.2}} />
            <h2 style={{fontSize: 50, fontWeight: 900, marginBottom: 40}}>Khách hàng tin tưởng chúng tôi</h2>
            <div style={styles.ratingBig}>
              <span style={{fontSize: 70, fontWeight: 900}}>4.9</span>
              <div>
                <div style={{display: 'flex', color: '#FF7A21'}}>{[1,2,3,4,5].map(i => <Star key={i} size={24} fill="#FF7A21" />)}</div>
                <p style={{color: '#999'}}>1,200+ đánh giá 5 sao</p>
              </div>
            </div>
          </div>
          <div style={styles.testimonialCard}>
            <p style={styles.testimonialText}>"{reviews[active].text}"</p>
            <div style={styles.testimonialUser}>
              <div style={styles.userAvatar}></div>
              <div>
                <h4 style={{margin: 0, fontSize: 20}}>{reviews[active].name}</h4>
                <p style={{margin: 0, color: '#FF7A21', fontWeight: 700}}>{reviews[active].job}</p>
              </div>
              <div style={styles.navButtons}>
                <button onClick={() => setActive(0)} style={styles.miniNav}><ChevronLeft size={20} /></button>
                <button onClick={() => setActive(1)} style={styles.miniNav}><ChevronRight size={20} /></button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

const Home = () => {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex(p => (p + 1) % HERO_DATA.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.app}>
      <Header />
      <section style={styles.heroSection}>
        <div style={styles.heroMain}>
          <div style={styles.heroInfo}>
            <span style={styles.heroTag}>{HERO_DATA[index].tag}</span>
            <h1 style={styles.heroTitle}>{HERO_DATA[index].title}</h1>
            <p style={styles.heroDesc}>{HERO_DATA[index].desc}</p>
            <div style={styles.heroActions}>
              <button style={styles.btnPrimary}>ĐẶT MÓN NGAY</button>
              <button style={styles.btnSecondary}>XEM THỰC ĐƠN</button>
            </div>
          </div>
          <div style={styles.heroImageWrap}>
            <img src={HERO_DATA[index].img} style={styles.heroImg} alt="banner" />
            <div style={styles.sliderDots}>
              {HERO_DATA.map((_, i) => (
                <div key={i} onClick={() => setIndex(i)} style={{...styles.dot, width: index === i ? 40 : 10, backgroundColor: index === i ? '#FF7A21' : '#ccc'}}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dùng HR hoặc DIV để kẻ line chia khoảng cách */}
      <div style={styles.sectionDivider}></div>

      <ServiceHighlight />

      <div style={styles.sectionDivider}></div>

      <section style={styles.sectionPadding}>
        <div style={styles.categoryHeading}>
          <h2 style={styles.mainTitle}>MÓN ĂN BÁN CHẠY</h2>
          <div style={styles.line}></div>
          <button style={styles.viewAll}>TẤT CẢ <ArrowRight size={16} /></button>
        </div>
        <div style={styles.productGrid}>
          <ProductCard name="Tôm Hùm Bỏ Lò" price="890k" img="https://nhahanghaisanlangchai.com/upload/images/cua_gach_sot_singapore.png" desc="Tôm hùm xanh tươi sống kết hợp phô mai Mozzarella tan chảy nướng bếp than." />
          <ProductCard name="Cua Hoàng Đế" price="2.4tr" img="https://images.unsplash.com/photo-1599458252573-56ae36120de1?auto=format&fit=crop&q=80&w=500" desc="Hấp rượu vang trắng giữ trọn vị ngọt thanh khiết từ đại dương xanh." />
          <ProductCard name="Cá Hồi Áp Chảo" price="450k" img="https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&q=80&w=500" desc="Sốt chanh dây thanh mát kết hợp măng tây giòn ngọt cho người ăn kiêng." />
        </div>
      </section>

      <div style={styles.sectionDivider}></div>

      <ComboSection />

      <div style={styles.sectionDivider}></div>

      <DiscountAndInfo />
      
      <div style={styles.sectionDivider}></div>

      <ReviewsSection />
      <FloatingChat />
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerGrid}>
            <div style={{gridColumn: 'span 2'}}>
              <h2 style={styles.footerBrand}><span style={{color: '#fff'}}>OCEAN</span><span style={{color: '#FF7A21'}}>GRILL</span></h2>
              <p style={styles.footerAbout}>Tự hào mang đến những trải nghiệm ẩm thực biển tinh tế nhất. Mỗi món ăn là một câu chuyện về tình yêu đại dương.</p>
              <div style={styles.socialRow}>
                {[Facebook, Mail, Phone].map((Icon, i) => <div key={i} style={styles.socialIcon}><Icon size={20} /></div>)}
              </div>
            </div>
            <div>
              <h4 style={styles.footerTitle}>KHÁM PHÁ</h4>
              <ul style={styles.footerList}>
                {['Thực đơn', 'Combo gia đình', 'Khuyến mãi', 'Sự kiện'].map(l => <li key={l}>{l}</li>)}
              </ul>
            </div>
            <div>
              <h4 style={styles.footerTitle}>BẢN TIN</h4>
              <p style={{color: '#999', marginBottom: 20}}>Nhận ưu đãi 20% cho lần đầu đặt bàn.</p>
              <div style={styles.footerInputGroup}>
                <input placeholder="Email..." style={styles.footerInput} />
                <button style={styles.footerSubmit}>GỬI</button>
              </div>
            </div>
          </div>
          <div style={styles.footerBottom}>© 2024 OceanGrill. Luxury Dining Experience.</div>
        </div>
      </footer>
    </div>
  );
};

// --- STYLES ---
const styles = {
  app: { backgroundColor: '#fff', color: '#1A1A1A', fontFamily: '"Segoe UI", Roboto, sans-serif' },
  navbar: { 
    height: 90, 
    display: 'flex', 
    justifyContent: 'center', 
    backgroundColor: '#000', 
    position: 'sticky', 
    top: 0, 
    zIndex: 1000, 
    borderBottom: '1px solid #222' 
  },
  navContainer: { width: '92%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoGroup: { display: 'flex', alignItems: 'center', gap: 15 },
  
  // LOGO BO TRÒN (Border Radius)
  logoImg: { 
    height: 55, 
    width: 55, 
    objectFit: 'cover', 
    borderRadius: '50%', // Làm logo hình tròn
    border: '2px solid #FF7A21', // Thêm viền màu cam cho nổi bật
    backgroundColor: '#fff'
  },
  
  logoText: { fontSize: 28, fontWeight: 900, letterSpacing: -1 },
  navLinks: { display: 'flex', gap: 40 },
  navItem: { fontWeight: 700, fontSize: 15, cursor: 'pointer', color: '#fff' }, 
  navRight: { display: 'flex', alignItems: 'center', gap: 15 },
  iconCircle: { width: 45, height: 45, borderRadius: '50%', border: '1px solid #333', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', cursor: 'pointer' },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#FF7A21', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10 },
  
  // KẺ LINE CHIA KHOẢNG CÁCH (Section Divider)
  sectionDivider: {
    width: '100%',
    height: '1px',
    backgroundColor: '#EEEEEE',
    margin: '0 auto',
    maxWidth: '92%'
  },
  
  topDividerLine: {
    width: '60px', 
    height: '4px', 
    backgroundColor: '#FF7A21', 
    position: 'absolute', 
    top: 0, 
    left: '50%', 
    transform: 'translateX(-50%)',
    borderRadius: '0 0 10px 10px'
  },

  fixedChat: {
    position: 'fixed', bottom: 30, right: 30, width: 60, height: 60,
    backgroundColor: '#FF7A21', borderRadius: '50%',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    boxShadow: '0 10px 30px rgba(255,122,33,0.4)', cursor: 'pointer', zIndex: 9999
  },
  onlineStatus: {
    position: 'absolute', top: 5, right: 5, width: 12, height: 12,
    backgroundColor: '#44DD44', borderRadius: '50%', border: '2px solid white'
  },
  heroSection: { padding: '40px 4% 60px', overflow: 'hidden' },
  heroMain: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 60, alignItems: 'center', minHeight: 600 },
  heroTag: { backgroundColor: '#FFF0E6', color: '#FF7A21', padding: '8px 20px', borderRadius: 30, fontWeight: 800 },
  heroTitle: { fontSize: 75, fontWeight: 950, lineHeight: 1, margin: '20px 0' },
  heroDesc: { fontSize: 20, color: '#666', lineHeight: 1.6, marginBottom: 40 },
  heroActions: { display: 'flex', gap: 20 },
  btnPrimary: { backgroundColor: '#FF7A21', color: '#fff', padding: '20px 40px', borderRadius: 20, border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 15px 30px rgba(255,122,33,0.3)' },
  btnSecondary: { backgroundColor: '#1A1A1A', color: '#fff', padding: '20px 40px', borderRadius: 20, border: 'none', fontWeight: 800, cursor: 'pointer' },
  heroImageWrap: { position: 'relative' },
  heroImg: { width: '100%', height: 650, objectFit: 'cover', borderRadius: 50 },
  sliderDots: { position: 'absolute', bottom: 40, left: 40, display: 'flex', gap: 10 },
  dot: { height: 10, borderRadius: 5, cursor: 'pointer', transition: '0.4s' },
  serviceVerticalGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 35, width: '92%', margin: '0 auto' },
  serviceVerticalCard: { backgroundColor: '#fff', borderRadius: 35, overflow: 'hidden', boxShadow: '0 15px 50px rgba(0,0,0,0.06)', border: '1px solid #f2f2f2' },
  serviceImgWrap: { position: 'relative', height: 700 },
  serviceVerticalImg: { width: '100%', height: '100%', objectFit: 'cover' },
  serviceIconOverlay: { position: 'absolute', bottom: -25, right: 30, width: 70, height: 70, backgroundColor: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  serviceBody: { padding: '60px 30px 40px', textAlign: 'center' },
  serviceTitleText: { fontSize: 24, fontWeight: 800, marginBottom: 15 },
  serviceDescText: { color: '#666', lineHeight: 1.6, fontSize: 15, marginBottom: 30, minHeight: 70 },
  serviceBtn: { width: '100%', padding: '18px', borderRadius: 18, border: 'none', backgroundColor: '#FF7A21', color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer' },
  sectionPadding: { padding: '100px 4%' },
  mainTitle: { fontSize: 45, fontWeight: 900 },
  categoryHeading: { display: 'flex', alignItems: 'center', gap: 30, marginBottom: 50 },
  line: { flex: 1, height: 2, backgroundColor: '#F0F0F0' },
  viewAll: { backgroundColor: '#fff', border: '1px solid #DDD', padding: '12px 25px', borderRadius: 30, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10 },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 35 },
  productCard: { backgroundColor: '#fff', borderRadius: 40, overflow: 'hidden', border: '1px solid #F0F0F0' },
  productImgContainer: { position: 'relative', height: 320 },
  productImg: { width: '100%', height: '100%', objectFit: 'cover' },
  productPriceTag: { position: 'absolute', bottom: 20, left: 20, backgroundColor: '#fff', padding: '8px 18px', borderRadius: 15, fontWeight: 900, fontSize: 18 },
  heartIcon: { position: 'absolute', top: 20, right: 20, backgroundColor: '#fff', width: 40, height: 40, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  productBody: { padding: 30 },
  productName: { fontSize: 24, fontWeight: 800, marginBottom: 10 },
  productText: { color: '#777', fontSize: 15, lineHeight: 1.5, marginBottom: 25, height: 45 },
  addToCartBtn: { width: '100%', padding: 18, borderRadius: 18, border: 'none', backgroundColor: '#F5F5F5', fontWeight: 800, cursor: 'pointer' },
  comboGrid: { display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 30 },
  comboCardMain: { backgroundColor: '#fff', borderRadius: 50, padding: 50, display: 'flex', alignItems: 'center', border: '1px solid #EEE', position: 'relative' },
  comboImgMain: { width: '45%', height: 380, objectFit: 'cover', borderRadius: 40 },
  comboContent: { flex: 1, paddingRight: 40 },
  comboBadge: { position: 'absolute', top: 30, left: 50, backgroundColor: '#FF7A21', color: '#fff', padding: '6px 15px', borderRadius: 10, fontWeight: 900, fontSize: 12 },
  comboTitleLarge: { fontSize: 42, fontWeight: 900, marginBottom: 15 },
  comboPriceRow: { display: 'flex', alignItems: 'center', gap: 20, margin: '20px 0' },
  oldPrice: { textDecoration: 'line-through', color: '#999', fontSize: 22 },
  newPrice: { fontSize: 40, fontWeight: 950, color: '#FF7A21' },
  comboSubCol: { display: 'flex', flexDirection: 'column', gap: 30 },
  comboCardSmall: { flex: 1, backgroundColor: '#fff', borderRadius: 45, padding: 35, display: 'flex', alignItems: 'center', gap: 20, border: '1px solid #EEE' },
  comboImgSmall: { width: 130, height: 130, borderRadius: 30, objectFit: 'cover' },
  comboTitleSmall: { fontSize: 22, fontWeight: 800, marginBottom: 10 },
  newPriceSmall: { fontSize: 26, fontWeight: 950 },
  infoSection: { padding: '60px 4%', backgroundColor: '#fcfcfc' },
  infoGrid: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40 },
  infoTitle: { fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 30 },
  discountCard: { backgroundColor: '#fff', borderRadius: 40, padding: 40, border: '1px solid #F0F0F0' },
  discountImg: { width: '100%', height: 350, objectFit: 'cover', borderRadius: 30, marginBottom: 20 },
  discountName: { fontSize: 24, fontWeight: 800, marginBottom: 10 },
  priceRow: { display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 20 },
  oldPriceInfo: { textDecoration: 'line-through', color: '#999', fontSize: 18 },
  newPriceInfo: { color: '#FF7A21', fontWeight: 900, fontSize: 22 },
  discountDesc: { color: '#666', lineHeight: 1.6, marginBottom: 30, textAlign: 'center' },
  btnAction: { display: 'block', margin: '0 auto', backgroundColor: '#FF7A21', color: '#fff', border: 'none', padding: '15px 40px', borderRadius: 20, fontWeight: 800, cursor: 'pointer' },
  restaurantCard: { backgroundColor: '#fff', borderRadius: 40, padding: 35, border: '1px solid #F0F0F0' },
  resImg: { width: '100%', height: 200, objectFit: 'cover', borderRadius: 25, marginBottom: 20 },
  resName: { fontSize: 20, fontWeight: 800, marginBottom: 10 },
  stars: { display: 'flex', gap: 5, marginBottom: 20 },
  resDetail: { color: '#555', fontSize: 15, lineHeight: 2.2 },
  reviewSection: { padding: '120px 4%', backgroundColor: '#111', color: '#fff' },
  reviewBox: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 100, alignItems: 'center' },
  ratingBig: { display: 'flex', alignItems: 'center', gap: 20 },
  testimonialCard: { backgroundColor: '#1A1A1A', padding: 60, borderRadius: 60 },
  testimonialText: { fontSize: 28, fontStyle: 'italic', lineHeight: 1.5, marginBottom: 40, color: '#DDD' },
  testimonialUser: { display: 'flex', alignItems: 'center', gap: 20 },
  userAvatar: { width: 70, height: 70, borderRadius: '50%', backgroundColor: '#FF7A21', backgroundImage: 'url(https://i.pravatar.cc/100)' },
  navButtons: { marginLeft: 'auto', display: 'flex', gap: 15 },
  miniNav: { width: 55, height: 55, borderRadius: '50%', border: '1px solid #333', color: '#fff', backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' },
  footer: { backgroundColor: '#000', color: '#fff', paddingTop: 100 },
  footerInner: { width: '92%', margin: '0 auto' },
  footerGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 80, paddingBottom: 80 },
  footerBrand: { fontSize: 35, fontWeight: 900, marginBottom: 30 },
  footerAbout: { color: '#888', lineHeight: 1.8 },
  socialRow: { display: 'flex', gap: 15, marginTop: 30 },
  socialIcon: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#111', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  footerTitle: { fontSize: 20, fontWeight: 800, color: '#FF7A21', marginBottom: 30 },
  footerList: { listStyle: 'none', padding: 0, color: '#888', lineHeight: 2.5 },
  footerInputGroup: { display: 'flex', backgroundColor: '#111', padding: 10, borderRadius: 20 },
  footerInput: { flex: 1, backgroundColor: 'transparent', border: 'none', color: '#fff', paddingLeft: 15, outline: 'none' },
  footerSubmit: { backgroundColor: '#FF7A21', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: 15, fontWeight: 800 },
  footerBottom: { padding: '40px 0', borderTop: '1px solid #111', textAlign: 'center', color: '#444' }
};

export default Home;