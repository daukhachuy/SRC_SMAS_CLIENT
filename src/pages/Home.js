import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Bell, ShoppingBag, MessageSquare, 
  ChevronLeft, ChevronRight,
  Facebook, Instagram, Twitter, 
  Phone, MapPin, Star, Quote, Mail, Heart, Clock, Globe,
  Calendar, Truck, PartyPopper, 
  CreditCard 
} from 'lucide-react';

// --- DATA (Giữ nguyên) ---
const HERO_DATA = [
  { id: 1, title: "Cá Mú Hoa Hấp Dưa", tag: "Best Seller", desc: "Tinh hoa biển cả với thớ cá trắng ngần, quyện cùng vị chua thanh của dưa cải, tạo nên bản giao hưởng vị khó cưỡng.", img: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=1000" },
  { id: 2, title: "Lẩu Nướng Hải Sản", tag: "Signature", desc: "Sự kết hợp hoàn hảo giữa các loại hải sản tươi sống và nước lẩu đặc trưng, mang lại hương vị truyền thống tinh tế.", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1000" },
  { id: 3, title: "Combo Family", tag: "Promotion", desc: "Trọn vẹn niềm vui sum vầy với set ăn đầy đủ dinh dưỡng, được thiết kế riêng cho những khoảnh khắc ấm áp bên gia đình.", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1000" }
];

const BEST_SELLERS_DATA = [
  { id: 1, name: "Tôm Hùm Bỏ Lò", price: "890k", img: "https://images.unsplash.com/photo-1559740038-1914a93e6df8?q=80&w=500", desc: "Tôm hùm xanh tươi sống kết hợp phô mai Mozzarella tan chảy." },
  { id: 2, name: "Cua Hoàng Đế", price: "2.4tr", img: "https://images.unsplash.com/photo-1599458252573-56ae36120de1?q=80&w=500", desc: "Hấp rượu vang trắng giữ trọn vị ngọt thanh khiết." },
  { id: 3, name: "Cá Hồi Áp Chảo", price: "450k", img: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=500", desc: "Sốt chanh dây thanh mát kết hợp măng tây giòn ngọt." },
  { id: 4, name: "Mực Trứng Nướng", price: "320k", img: "https://images.unsplash.com/photo-1534080355125-27abc49a2159?q=80&w=500", desc: "Mực trứng tươi nướng muối ớt cay nồng hấp dẫn." },
  { id: 5, name: "Hàu Nướng Mỡ Hành", price: "150k", img: "https://images.unsplash.com/photo-1599249300675-c39f1dd2d6be?q=80&w=500", desc: "Hàu sữa béo ngậy cùng mỡ hành thơm nức." },
  { id: 6, name: "Bào Ngư Sốt Dầu Hào", price: "680k", img: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=500", desc: "Bào ngư thượng hạng hầm nấm đông cô đậm đà." },
  { id: 7, name: "Ốc Hương Cam Muối", price: "280k", img: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=500", desc: "Ốc hương giòn sần sật quyện sốt trứng muối cam." },
  { id: 8, name: "Lẩu Thái Hải Sản", price: "550k", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=500", desc: "Nước dùng chua cay đậm đà với tôm, mực, nghêu." },
  { id: 9, name: "Sashimi Tổng Hợp", price: "790k", img: "https://images.unsplash.com/photo-1534422298391-e4f8c170db06?q=80&w=500", desc: "Các loại cá tươi sống thái lát chuẩn phong cách Nhật." },
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
  { id: 9, name: "Set Sashimi King", price: "1.8tr", img: "https://images.unsplash.com/photo-1534422298391-e4f8c170db06?q=80&w=500", desc: "Đầy đủ các loại cá nhập khẩu cao cấp nhất." },
  { id: 10, name: "Tiệc Ngoài Trời", price: "3.5tr", img: "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=500", desc: "Set nướng BBQ hải sản kèm nhân viên phục vụ tại chỗ." }
];

const DISCOUNTS_DATA = [
  { id: 1, name: "Tôm hùm baby sốt bơ tỏi", oldPrice: "300k", newPrice: "199k", discount: "-35%", img: "https://images.unsplash.com/photo-1553247407-23251ce81f59?auto=format&fit=crop&q=80&w=800", left: 5 },
  { id: 2, name: "Cua Cà Mau hấp nước dừa", oldPrice: "450k", newPrice: "315k", discount: "-30%", img: "https://images.unsplash.com/photo-1599458252573-56ae36120de1?auto=format&fit=crop&q=80&w=800", left: 8 },
  { id: 3, name: "Hàu nướng phô mai Pháp", oldPrice: "180k", newPrice: "120k", discount: "-33%", img: "https://images.unsplash.com/photo-1599249300675-c39f1dd2d6be?auto=format&fit=crop&q=80&w=800", left: 12 },
  { id: 4, name: "Lẩu Cá Đuối đặc sản", oldPrice: "350k", newPrice: "245k", discount: "-30%", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800", left: 3 },
  { id: 5, name: "Mực lá câu hấp hành gừng", oldPrice: "280k", newPrice: "199k", discount: "-28%", img: "https://images.unsplash.com/photo-1534080355125-27abc49a2159?auto=format&fit=crop&q=80&w=800", left: 15 },
  { id: 6, name: "Sò huyết cháy tỏi", oldPrice: "150k", newPrice: "99k", discount: "-34%", img: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&q=80&w=800", left: 20 },
];

const SERVICES_DATA = [
  { title: 'Đặt Bàn Trực Tuyến', desc: 'Không gian thoáng mát với ẩm thực phong phú đa dạng kết hợp nhiều tiện ích cho bữa ăn hấp dẫn.', icon: <Calendar size={32} color="#FF7A21" />, img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400', btn: 'Đặt Bàn' },
  { title: 'Giao Hàng Tận Nơi', desc: 'Chúng tôi cung cấp dịch vụ đóng gói và vận chuyển chuyên nghiệp không làm mất đi vị ngon của món ăn.', icon: <Truck size={32} color="#FF7A21" />, img: '/images/Ship.jpg', btn: 'Giao Hàng' },
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

// --- MAIN COMPONENTS (Giữ nguyên) ---

const Header = () => (
  <nav style={styles.navbar}>
    <div style={styles.navContainer}>
      <div style={styles.navLeft}>
        <div style={styles.logoGroup}>
          <img 
    src="/images/LOGO.png"  // <--- Thay link ảnh hoặc path file vào đây
    style={styles.logoImg} 
    alt="Logo" 
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
        <div style={styles.iconCircle}><Bell size={20} color="#fff" /><span style={{...styles.badge, backgroundColor: '#FF4D4F'}}>5</span></div>
        <div style={styles.iconCircle}><ShoppingBag size={20} color="#fff" /><span style={styles.badge}>3</span></div>
        <div style={{...styles.iconCircle, border: '2px solid #FF7A21'}}><User size={20} color="#fff" /></div>
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
  
const ProductCard = ({ name, price, desc, img, isCombo = false }) => (
    <div style={styles.productCard}>
      <div style={styles.productImgContainer}>
        <img src={img} alt={name} style={styles.productImg} />
        <div style={styles.productPriceTag}>{price}</div>
        <div style={styles.heartIcon}><Heart size={18} fill="#FF7A21" color="#FF7A21" /></div>
      </div>
      <div style={styles.productBody}>
        <h4 style={styles.productName}>{name}</h4>
        <p style={styles.productText}>{desc}</p>
        <button style={{...styles.addToCartBtn, backgroundColor: isCombo ? '#FF7A21' : '#F5F5F5', color: isCombo ? '#fff' : '#1A1A1A'}}>
          {isCombo ? 'ĐẶT COMBO' : 'THÊM VÀO GIỎ'}
        </button>
      </div>
    </div>
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
        <section style={styles.infoSection}>
          <div style={styles.infoGrid}>
            <div style={styles.discountCardNew}>
              <div style={styles.cardHeader}>
                <h2 style={styles.infoTitleLeft}>ƯU ĐÃI GIỜ VÀNG 🔥</h2>
                <div style={styles.timerBadge}>Hết hạn sau: {formatTime(timeLeft)}</div>
              </div>
              <div style={styles.discountDishLayout}>
                <div style={styles.discountImgPart}>
                  <button onClick={() => setDiscountIdx(p => p === 0 ? DISCOUNTS_DATA.length - 1 : p - 1)} style={{...styles.miniCircleNav, left: 10}}><ChevronLeft size={20}/></button>
                  <img src={current.img} alt={current.name} style={styles.discountImgNew} />
                  <button onClick={() => setDiscountIdx(p => p === DISCOUNTS_DATA.length - 1 ? 0 : p + 1)} style={{...styles.miniCircleNav, right: 10}}><ChevronRight size={20}/></button>
                  <div style={styles.discountBadge}>{current.discount}</div>
                </div>
                <div style={styles.discountInfoPart}>
                  <h3 style={styles.discountNameNew}>{current.name}</h3>
                  <div style={styles.priceContainerNew}>
                    <span style={styles.oldPriceNew}>{current.oldPrice}</span>
                    <span style={styles.newPriceNew}>{current.newPrice}</span>
                  </div>
                  <div style={styles.stockLevel}>
                    <div style={styles.stockBar}><div style={{...styles.stockFill, width: `${(current.left/25)*100}%`}}></div></div>
                    <span style={styles.stockText}>Còn lại: {current.left} suất</span>
                  </div>
                  <button style={styles.btnOrderNow}>SĂN NGAY</button>
                  <div style={styles.discountDots}>
                    {DISCOUNTS_DATA.map((_, i) => (
                      <div key={i} style={{...styles.miniDot, backgroundColor: discountIdx === i ? '#FF7A21' : '#ddd', width: discountIdx === i ? 20 : 8}} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={styles.restaurantCardNew}>
              <h2 style={{...styles.infoTitle, color: '#fff', textAlign: 'left', marginBottom: 25}}>THÔNG TIN NHÀ HÀNG</h2>
              <div style={styles.resContentNew}>
                <div style={styles.resImageWrapNew}>
                  <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600" alt="Restaurant" style={styles.resImgNew} />
                  <div style={styles.ratingOverlay}>
                    <Star size={14} fill="#FF7A21" color="#FF7A21" />
                    <span style={{fontWeight: 800, marginLeft: 5, color: '#1A1A1A'}}>4.9 (1.2k Đánh giá)</span>
                  </div>
                </div>
                <div style={styles.resInfoList}>
                  <div style={styles.infoItem}><div style={styles.infoIconBox}><MapPin size={18} color="#FF7A21" /></div><div><p style={styles.infoLabel}>Địa chỉ</p><p style={styles.infoValue}>123 Võ Nguyên Giáp, Đà Nẵng</p></div></div>
                  <div style={styles.infoItem}><div style={styles.infoIconBox}><Clock size={18} color="#FF7A21" /></div><div><p style={styles.infoLabel}>Giờ mở cửa</p><p style={styles.infoValue}>10:00 - 23:30 (Hàng ngày)</p></div></div>
                  <div style={styles.infoItem}><div style={styles.infoIconBox}><Phone size={18} color="#FF7A21" /></div><div><p style={styles.infoLabel}>Hotline đặt bàn</p><p style={styles.infoValue}>1900 1234 - 0905 123 xxx</p></div></div>
                </div>
              </div>
            </div>
          </div>
        </section>
    );
};
  
const ReviewsSection = ({ reviewOffset, isTransitioning }) => {
  return (
    <section style={styles.reviewSection}>
      <div style={styles.reviewHeaderLayout}>
        <div style={styles.reviewTitleBox}>
          <Quote size={50} color="#FF7A21" style={{opacity: 0.5, marginBottom: 15}} />
          <h2 style={{...styles.mainTitle, color: '#FFFFFF', fontSize: '56px', fontWeight: 950}}>
            Khách hàng nói gì <br/> 
            về <span style={{color: '#FF7A21'}}>chúng tôi?</span>
          </h2>
          <div style={styles.ratingInfo}>
            <span style={{...styles.ratingBig, color: '#FF7A21', fontSize: '75px', fontWeight: 950}}>4.9</span>
            <div style={{marginLeft: 15}}>
              <div style={{display: 'flex', gap: 3}}>
                {[1,2,3,4,5].map(s => <Star key={s} size={20} fill="#FF7A21" color="#FF7A21" />)}
              </div>
              <p style={{fontSize: 14, color: '#888', marginTop: 5, fontWeight: 600}}>1,500+ ĐÁNH GIÁ THỰC TẾ</p>
            </div>
          </div>
        </div>

        <div style={styles.reviewContainer}>
          <div style={styles.reviewColumn}>
            <div style={{
              ...styles.reviewTrack,
              transform: `translateY(-${reviewOffset * 310}px)`, 
              transition: isTransitioning ? 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            }}>
              {REVIEWS_DATA.slice(0, 10).concat(REVIEWS_DATA.slice(0, 10)).map((item, i) => (
                <div key={i} style={styles.feedbackCard}>
                  <p style={styles.feedbackText}>"{item.text}"</p>
                  <div style={styles.feedbackUser}>
                    <img src={item.avatar} style={styles.realAvatar} alt="avatar" />
                    <div>
                      <p style={{fontWeight: 700, fontSize: 16, color: '#fff'}}>{item.name}</p>
                      <p style={{fontSize: 12, color: '#FF7A21'}}>Thực khách hài lòng</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.reviewColumn}>
            <div style={{
              ...styles.reviewTrack,
              transform: `translateY(-${(9 - reviewOffset) * 310}px)`,
              transition: isTransitioning ? 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            }}>
              {REVIEWS_DATA.slice(10, 20).concat(REVIEWS_DATA.slice(10, 20)).map((item, i) => (
                <div key={i} style={styles.feedbackCard}>
                  <p style={styles.feedbackText}>"{item.text}"</p>
                  <div style={styles.feedbackUser}>
                    <img src={item.avatar} style={styles.realAvatar} alt="avatar" />
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
  );
};

// --- HOME PAGE ---
const Home = () => {
  const [heroIdx, setHeroIdx] = useState(0);
  const itemsPerPage = 4;
  
  const [bestIdx, setBestIdx] = useState(0);
  const [comboIdx, setComboIdx] = useState(0);
  const [isBestTransition, setIsBestTransition] = useState(true);
  const [isComboTransition, setIsComboTransition] = useState(true);

  const [reviewOffset, setReviewOffset] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);

  const BEST_EXTENDED = [...BEST_SELLERS_DATA, ...BEST_SELLERS_DATA];
  const COMBO_EXTENDED = [...COMBOS_DATA, ...COMBOS_DATA];

  useEffect(() => {
    const timer = setInterval(() => {
      setIsBestTransition(true);
      setBestIdx(prev => prev + 1);
      setIsComboTransition(true);
      setComboIdx(prev => prev + 1);
      setIsTransitioning(true);
      setReviewOffset(p => p + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (bestIdx === BEST_SELLERS_DATA.length) {
      setTimeout(() => {
        setIsBestTransition(false);
        setBestIdx(0);
      }, 800);
    }
    if (comboIdx === COMBOS_DATA.length) {
      setTimeout(() => {
        setIsComboTransition(false);
        setComboIdx(0);
      }, 800);
    }
    if (reviewOffset === 10) {
        setTimeout(() => {
          setIsTransitioning(false);
          setReviewOffset(0);
        }, 1200); 
      }
  }, [bestIdx, comboIdx, reviewOffset]);

  const moveBest = (dir) => {
    setIsBestTransition(true);
    if (dir === 'next') setBestIdx(p => p + 1);
    else setBestIdx(p => p <= 0 ? BEST_SELLERS_DATA.length - 1 : p - 1);
  };

  const moveCombo = (dir) => {
    setIsComboTransition(true);
    if (dir === 'next') setComboIdx(p => p + 1);
    else setComboIdx(p => p <= 0 ? COMBOS_DATA.length - 1 : p - 1);
  };

  // Hero change Auto
  useEffect(() => {
    const timer = setInterval(() => setHeroIdx(p => (p + 1) % HERO_DATA.length), 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.app}>
      <Header />
      
      {/* HERO SECTION - SOFT CROSS-FADE UPDATE */}
      <section style={styles.heroSection}>
        <div style={styles.heroMain}>
          <div style={styles.heroInfo}>
            <div style={{ position: 'relative', minHeight: '350px' }}>
              {HERO_DATA.map((item, i) => (
                <div key={item.id} style={{
                  position: i === 0 ? 'relative' : 'absolute',
                  top: 0, left: 0, width: '100%',
                  opacity: heroIdx === i ? 1 : 0,
                  transition: 'opacity 1.5s ease-in-out',
                  pointerEvents: heroIdx === i ? 'auto' : 'none'
                }}>
                  <span style={styles.heroTag}>{item.tag}</span>
                  <h1 style={styles.heroTitle}>{item.title}</h1>
                  <p style={styles.heroDesc}>{item.desc}</p>
                </div>
              ))}
            </div>
            <div style={styles.heroActions}>
              <button style={styles.btnPrimary}>ĐẶT MÓN NGAY</button>
              <button style={styles.btnSecondary}>XEM THỰC ĐƠN</button>
            </div>
          </div>

          <div style={styles.heroImageWrap}>
            {HERO_DATA.map((item, i) => (
              <img 
                key={item.id} 
                src={item.img} 
                style={{
                  ...styles.heroImg, 
                  position: i === 0 ? 'relative' : 'absolute',
                  top: 0, left: 0,
                  opacity: heroIdx === i ? 1 : 0,
                  transform: heroIdx === i ? 'scale(1)' : 'scale(1.05)',
                  transition: 'opacity 1.5s ease-in-out, transform 1.5s ease-in-out',
                }} 
                alt="banner" 
              />
            ))}
            <div style={styles.sliderDots}>
              {HERO_DATA.map((_, i) => (
                <div key={i} onClick={() => setHeroIdx(i)} style={{...styles.dot, width: heroIdx === i ? 40 : 10, backgroundColor: heroIdx === i ? '#FF7A21' : '#ccc'}}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ServiceHighlight />

      <section style={styles.sectionPadding}>
        <div style={styles.categoryHeading}>
          <div>
            <h2 style={styles.mainTitle}>MÓN ĂN BÁN CHẠY 🔥</h2>
            <p style={{color: '#666', marginTop: 5}}>Top 10 hương vị đại dương được yêu thích nhất</p>
          </div>
          <div style={styles.line}></div>
        </div>
        <div style={styles.carouselContainer}>
          <button onClick={() => moveBest('prev')} style={{...styles.carouselNav, left: -25}}><ChevronLeft /></button>
          <div style={styles.carouselWindow}>
            <div style={{
                ...styles.carouselTrack, 
                transform: `translateX(-${bestIdx * (100 / itemsPerPage)}%)`,
                transition: isBestTransition ? 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            }}>
              {BEST_EXTENDED.map((item, idx) => (
                <div key={idx} style={styles.carouselItem}><ProductCard {...item} /></div>
              ))}
            </div>
          </div>
          <button onClick={() => moveBest('next')} style={{...styles.carouselNav, right: -25}}><ChevronRight /></button>
        </div>
      </section>

      <section style={{...styles.sectionPadding, backgroundColor: '#F9FAFB'}}>
        <div style={styles.categoryHeading}>
            <div style={styles.line}></div>
            <div style={{textAlign: 'right'}}>
                <h2 style={styles.mainTitle}>COMBO SIÊU LỜI 🍱</h2>
                <p style={{color: '#FF7A21', fontWeight: 700}}>ƯU ĐÃI ĐẾN 30% KHI ĐẶT TRƯỚC</p>
            </div>
        </div>
        <div style={styles.carouselContainer}>
          <button onClick={() => moveCombo('prev')} style={{...styles.carouselNav, left: -25, backgroundColor: '#1A1A1A', color: '#fff'}}><ChevronLeft /></button>
          <div style={styles.carouselWindow}>
            <div style={{
                ...styles.carouselTrack, 
                transform: `translateX(-${(COMBOS_DATA.length - comboIdx) * (100 / itemsPerPage)}%)`,
                transition: isComboTransition ? 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            }}>
              {COMBO_EXTENDED.map((item, idx) => (
                <div key={idx} style={styles.carouselItem}><ProductCard {...item} isCombo={true} /></div>
              ))}
            </div>
          </div>
          <button onClick={() => moveCombo('next')} style={{...styles.carouselNav, right: -25, backgroundColor: '#1A1A1A', color: '#fff'}}><ChevronRight /></button>
        </div>
      </section>

      <DiscountAndInfo />
      <ReviewsSection reviewOffset={reviewOffset} isTransitioning={isTransitioning} />
      <FloatingChat />
      
      <footer style={styles.footer}>
        <div style={styles.footerContainer}>
          <div style={styles.footerGrid}>
            <div style={styles.footerColumn}>
              <div style={{...styles.logoGroup, marginBottom: 20}}>
                <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: -1 }}>
                  <span style={{color: '#FFFFFF'}}>OCEAN</span>
                  <span style={{color: '#FF7A21'}}>GRILL</span>
                </span>
              </div>
              <p style={styles.footerText}>Tinh hoa ẩm thực biển khơi trong không gian sang trọng.</p>
              <div style={styles.socialRow}>
                {[Facebook, Instagram, Twitter, Mail].map((Icon, i) => (
                  <div key={i} style={styles.socialIcon}><Icon size={18} /></div>
                ))}
              </div>
            </div>
            <div style={styles.footerColumn}>
              <h4 style={styles.footerHeading}>KHÁM PHÁ</h4>
              <ul style={styles.footerList}>
                {['Thực đơn chính', 'Hải sản tươi sống', 'Đặt tiệc & Sự kiện', 'Ưu đãi'].map(item => (
                  <li key={item} style={styles.footerListItem}>{item}</li>
                ))}
              </ul>
            </div>
            <div style={styles.footerColumn}>
              <h4 style={styles.footerHeading}>LIÊN HỆ</h4>
              <p style={styles.footerText}><MapPin size={16} color="#FF7A21" /> 123 Võ Nguyên Giáp, Đà Nẵng</p>
              <p style={styles.footerText}><Phone size={16} color="#FF7A21" /> +84 905 123 456</p>
            </div>
            <div style={styles.footerColumn}>
              <h4 style={styles.footerHeading}>BẢN TIN</h4>
              <div style={styles.newsletterBox}>
                <input placeholder="Email của bạn..." style={styles.newsletterInput} />
                <button style={styles.newsletterBtn}>GỬI</button>
              </div>
            </div>
          </div>
          <div style={styles.footerBottomLine}>
            <p>© 2026 OceanGrill Restaurant. Luxury Dining Experience.</p>
            <p>Designed by <span style={{color: '#FF7A21'}}>Gemini Luxury</span></p>
          </div>
        </div>
      </footer>
    </div>
  );
};


// --- STYLES (Giữ nguyên các thuộc tính quan trọng) ---
const styles = {
  app: { backgroundColor: '#fff', color: '#1A1A1A', fontFamily: 'system-ui', overflowX: 'hidden' },
  navbar: { height: 90, display: 'flex', justifyContent: 'center', backgroundColor: '#000', position: 'sticky', top: 0, zIndex: 1000 },
  navContainer: { width: '92%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logoGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
  logoImg: { height: 45, width: 45, borderRadius: '50%', backgroundColor: '#FF7A21', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 900 },
  logoText: { fontSize: 26, fontWeight: 900 },
  navLinks: { display: 'flex', gap: 40 },
  navItem: { fontWeight: 700, fontSize: 15, cursor: 'pointer', color: '#fff' }, 
  navRight: { display: 'flex', alignItems: 'center', gap: 15 },
  iconCircle: { width: 45, height: 45, borderRadius: '50%', border: '1px solid #333', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', cursor: 'pointer' },
  badge: { position: 'absolute', top: 0, right: 0, color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 10 },
  fixedChat: { position: 'fixed', bottom: 30, right: 30, width: 60, height: 60, backgroundColor: '#FF7A21', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 },
  onlineStatus: { position: 'absolute', top: 5, right: 5, width: 12, height: 12, backgroundColor: '#44DD44', borderRadius: '50%', border: '2px solid white' },
  
  // Hero Styles
  heroSection: { padding: '40px 4%', minHeight: '750px' },
  heroMain: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 60, alignItems: 'center' },
  heroTag: { backgroundColor: '#FFF0E6', color: '#FF7A21', padding: '8px 20px', borderRadius: 30, fontWeight: 800, display: 'inline-block' },
  heroTitle: { fontSize: 75, fontWeight: 950, lineHeight: 1.1, margin: '20px 0' },
  heroDesc: { fontSize: 20, color: '#666', marginBottom: 40, lineHeight: 1.6 },
  heroActions: { display: 'flex', gap: 15, marginTop: 20 },
  btnPrimary: { backgroundColor: '#FF7A21', color: '#fff', padding: '20px 40px', borderRadius: 20, border: 'none', fontWeight: 800, cursor: 'pointer' },
  btnSecondary: { backgroundColor: '#1A1A1A', color: '#fff', padding: '20px 40px', borderRadius: 20, border: 'none', fontWeight: 800, cursor: 'pointer' },
  heroImageWrap: { position: 'relative', height: 600, width: '100%' },
  heroImg: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: 50 },
  sliderDots: { position: 'absolute', bottom: 40, left: 40, display: 'flex', gap: 10, zIndex: 10 },
  dot: { height: 10, borderRadius: 5, cursor: 'pointer', transition: '0.4s' },

  // Service Styles
  serviceVerticalGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 35, width: '92%', margin: '0 auto' },
  serviceVerticalCard: { backgroundColor: '#fff', borderRadius: 35, overflow: 'hidden', border: '1px solid #f2f2f2' },
  serviceImgWrap: { position: 'relative', height: 400 },
  serviceVerticalImg: { width: '100%', height: '100%', objectFit: 'cover' },
  serviceIconOverlay: { position: 'absolute', bottom: -25, right: 30, width: 70, height: 70, backgroundColor: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
  serviceBody: { padding: '60px 30px 40px', textAlign: 'center' },
  serviceTitleText: { fontSize: 24, fontWeight: 800 },
  serviceDescText: { color: '#666', marginBottom: 30, minHeight: 70 },
  serviceBtn: { width: '100%', padding: '18px', borderRadius: 18, border: 'none', backgroundColor: '#FF7A21', color: '#fff', fontWeight: 800 },
  
  // Product Styles
  productCard: { borderRadius: 25, backgroundColor: '#fff', border: '1px solid #f0f0f0', overflow: 'hidden' },
  productImgContainer: { position: 'relative', height: 260 },
  productImg: { width: '100%', height: '100%', objectFit: 'cover' },
  productPriceTag: { position: 'absolute', bottom: 15, left: 15, backgroundColor: '#fff', padding: '6px 15px', borderRadius: 12, fontWeight: 900, color: '#FF7A21' },
  heartIcon: { position: 'absolute', top: 15, right: 15, backgroundColor: '#fff', width: 35, height: 35, borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  productBody: { padding: 20 },
  productName: { fontSize: 18, fontWeight: 800, marginBottom: 8 },
  productText: { color: '#666', fontSize: 13, marginBottom: 15, height: 40, overflow: 'hidden' },
  addToCartBtn: { width: '100%', padding: '12px', borderRadius: 12, border: 'none', fontWeight: 800, cursor: 'pointer' },

  // Layout General
  sectionPadding: { padding: '100px 4%' },
  mainTitle: { fontSize: 45, fontWeight: 950 },
  categoryHeading: { display: 'flex', alignItems: 'center', gap: 30, marginBottom: 50 },
  line: { flex: 1, height: 2, backgroundColor: '#F0F0F0' },
  carouselContainer: { position: 'relative', display: 'flex', alignItems: 'center' },
  carouselWindow: { overflow: 'hidden', width: '100%' },
  carouselTrack: { display: 'flex' },
  carouselItem: { minWidth: '25%', padding: '0 12px', boxSizing: 'border-box' },
  carouselNav: { width: 50, height: 50, borderRadius: '50%', backgroundColor: '#fff', border: '1px solid #eee', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'absolute', zIndex: 10, cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.05)' },

  // --- SECTION: DISCOUNT & INFO (ĐÃ ĐỒNG BỘ BACKGROUND VỚI SERVICE) ---
  infoSection: { 
    padding: '100px 4%', 
    backgroundColor: '#F9FAFB' // Đồng bộ với nền Service
  },
  infoGrid: { 
    display: 'grid', 
    gridTemplateColumns: '1.2fr 1fr', 
    gap: 40 
  },
  
  // Card Discount nổi bật
  discountCardNew: { 
    backgroundColor: '#FFFFFF', // Giữ card màu trắng để nổi lên trên nền xám nhạt
    borderRadius: 40, 
    padding: 35,
    border: '1px solid #E9ECEF', 
    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
    position: 'relative',
    overflow: 'hidden'
  },
  
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  infoTitleLeft: { fontSize: 28, fontWeight: 900, color: '#1A1A1A', margin: 0 },
  timerBadge: { backgroundColor: '#1A1A1A', color: '#FF7A21', padding: '10px 18px', borderRadius: 14, fontWeight: 800, fontSize: 13 },
  discountDishLayout: { display: 'flex', gap: 35, alignItems: 'center' },
  discountImgPart: { flex: 1.1, position: 'relative', height: 320, borderRadius: 30, overflow: 'hidden' },
  discountImgNew: { width: '100%', height: '100%', objectFit: 'cover' },
  discountBadge: { position: 'absolute', top: 20, left: 20, backgroundColor: '#FF7A21', color: '#fff', padding: '10px 18px', borderRadius: 15, fontWeight: 900, fontSize: 20 },
  discountInfoPart: { flex: 1 },
  discountNameNew: { fontSize: 28, fontWeight: 900, color: '#1A1A1A', marginBottom: 15 },
  priceContainerNew: { display: 'flex', alignItems: 'center', gap: 15, marginBottom: 20 },
  newPriceNew: { fontSize: 38, color: '#FF7A21', fontWeight: 950 },
  oldPriceNew: { fontSize: 20, color: '#ADB5BD', textDecoration: 'line-through' },
  stockLevel: { marginBottom: 25 },
  stockBar: { width: '100%', height: 12, backgroundColor: '#DEE2E6', borderRadius: 6, marginBottom: 10, overflow: 'hidden' },
  stockFill: { height: '100%', backgroundColor: '#FF7A21', transition: '0.8s ease' },
  stockText: { fontSize: 13, color: '#666', fontWeight: 600 },
  btnOrderNow: { width: '100%', padding: '20px', backgroundColor: '#FF7A21', color: '#fff', border: 'none', borderRadius: 20, fontWeight: 900, cursor: 'pointer' },
  discountDots: { display: 'flex', gap: 6, marginTop: 25 },
  miniDot: { height: 8, borderRadius: 4, transition: '0.3s' },
  miniCircleNav: { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', zIndex: 5 },

  // Card Thông tin nhà hàng (Dark mode luxury)
  restaurantCardNew: { backgroundColor: '#1A1A1A', borderRadius: 40, padding: 35, color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
  resImageWrapNew: { position: 'relative', marginBottom: 25 },
  resImgNew: { width: '100%', height: 160, objectFit: 'cover', borderRadius: 20, opacity: 0.8 },
  ratingOverlay: { position: 'absolute', bottom: 12, right: 12, backgroundColor: '#fff', padding: '5px 12px', borderRadius: 10, display: 'flex', alignItems: 'center' },
  resInfoList: { display: 'flex', flexDirection: 'column', gap: 18 },
  infoItem: { display: 'flex', gap: 15, alignItems: 'center' },
  infoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,122,33,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  infoLabel: { fontSize: 12, color: '#888', textTransform: 'uppercase', margin: 0 },
  infoValue: { fontSize: 15, fontWeight: 600, margin: 0 },

  // Reviews & Footer
  reviewSection: { padding: '100px 4%', backgroundColor: '#0D0D0D', overflow: 'hidden' },
  reviewHeaderLayout: { display: 'grid', gridTemplateColumns: '380px 1fr', gap: '40px', alignItems: 'center' },
  reviewContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', height: '750px', overflow: 'hidden' },
  reviewColumn: { overflow: 'hidden', position: 'relative', maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)' },
  feedbackCard: { backgroundColor: '#161616', padding: '40px', borderRadius: '40px', height: '290px', border: '1px solid #222', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  feedbackText: { color: '#ccc', fontSize: 18, fontStyle: 'italic', marginBottom: 25, lineHeight: 1.6 },
  realAvatar: { width: 55, height: 55, borderRadius: '50%', border: '2px solid #FF7A21', objectFit: 'cover' },
  reviewTrack: { display: 'flex', flexDirection: 'column', gap: '20px' },
  
 // --- FOOTER TỐI ƯU MỚI ---
 footer: { 
    backgroundColor: '#0A0A0A', 
    padding: '100px 0 50px', 
    borderTop: '1px solid #1A1A1A',
    width: '100%',
    color: '#FFFFFF'
  },
  
  // ĐIỀU CHỈNH: Tăng width lên 96% để đẩy nội dung ra sát lề trái/phải
  footerContainer: { 
    width: '96%', 
    margin: '0 auto',
    maxWidth: '1800px' // Tăng giới hạn tối đa để phù hợp với màn hình lớn
  },

  footerGrid: { 
    display: 'grid', 
    gridTemplateColumns: '1.5fr 0.8fr 1fr 1.2fr', 
    gap: '40px', // Giảm gap lại một chút để các cột có chỗ giãn ra
    marginBottom: '80px'
  },

  footerHeading: { 
    color: '#FFF', 
    fontSize: '20px', 
    fontWeight: '900', 
    marginBottom: '30px',
    letterSpacing: '0.5px'
  },

  footerText: { 
    color: '#A0A0A0', 
    fontSize: '15px', 
    lineHeight: '1.8', 
    marginBottom: '15px', 
    display: 'flex', 
    alignItems: 'flex-start', 
    gap: '12px' 
  },

  footerList: { 
    listStyle: 'none', 
    padding: 0, 
    margin: 0 
  },

  footerListItem: { 
    color: '#A0A0A0', 
    marginBottom: '14px', 
    fontSize: '15px', 
    cursor: 'pointer',
    display: 'block'
  },

  socialRow: { 
    display: 'flex', 
    gap: '12px', 
    marginTop: '30px' 
  },

  socialIcon: { 
    width: '45px', 
    height: '45px', 
    borderRadius: '14px', 
    backgroundColor: '#161616', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    color: '#FF7A21', 
    border: '1px solid #222'
  },

  newsletterBox: { 
    display: 'flex', 
    borderRadius: '16px', 
    overflow: 'hidden', 
    border: '1px solid #222',
    backgroundColor: '#111',
    padding: '6px', 
    marginTop: '20px'
  },

  newsletterInput: { 
    flex: 1, 
    padding: '12px 15px', 
    backgroundColor: 'transparent', 
    border: 'none', 
    color: '#fff', 
    outline: 'none'
  },

  newsletterBtn: { 
    backgroundColor: '#FF7A21', 
    color: '#fff', 
    padding: '0 25px', 
    border: 'none', 
    borderRadius: '12px', 
    fontWeight: '800',
    cursor: 'pointer'
  },

  footerBottomLine: { 
    paddingTop: '30px', 
    borderTop: '1px solid #1A1A1A', 
    display: 'flex', 
    justifyContent: 'space-between', // Đẩy bản quyền sang trái, link phụ sang phải
    alignItems: 'center',
    color: '#666', 
    fontSize: '14px' 
  }
};

export default Home;