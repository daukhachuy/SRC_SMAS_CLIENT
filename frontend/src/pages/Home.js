import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Home.css';
import { FIXED_PRODUCT_IMAGE } from '../api/foodApi';
import { ChevronLeft, ChevronRight, MapPin, Clock, Phone, Calendar, ShoppingCart } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AuthRequiredModal from '../components/AuthRequiredModal';
import { isAuthenticated } from '../api/authApi';

// Pool ảnh món ăn đa dạng cho design
const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80', // seafood platter
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80', // lobster
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', // food dish
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80', // colorful dish
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80', // grilled food
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&q=80', // food plate
  'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&q=80', // seafood
  'https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&q=80', // shrimp
];

const REVIEWS_DATA = [
  { id: 1, initials: 'MA', name: 'Nguyễn Minh Anh', role: 'Reviewer Ẩm Thực', text: '"Không gian quán cực kỳ chill và thoáng đãng. Nhân viên phục vụ rất chuyên nghiệp và chu đáo."', stars: 5 },
  { id: 2, initials: 'VH', name: 'Trần Văn Hùng', role: 'Doanh Nhân', text: '"Đã đến đây nhiều lần cho buổi tiệc công ty. Đồ ăn ổn định, decor sang trọng, rất đáng tiền."', stars: 4 },
  { id: 3, initials: 'TL', name: 'Lê Thùy Linh', role: 'Khách Hàng Thân Thiết', text: '"Mình rất thích các món hải sản ở đây. Tươi ngon và chế biến tinh tế. Chắc chắn sẽ quay lại."', stars: 5 },
];

const MENU_HIGHLIGHTS = [
  { id: 1, name: 'Lẩu Thái Hải Sản', price: '285.000đ', desc: 'Nước dùng chua cay đặc trưng kết hợp hải sản tươi sống từ biển.', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80', featured: true },
  { id: 2, name: 'Tôm Hùm Nướng', price: '950k', img: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&q=80' },
  { id: 3, name: 'Cua Rang Muối', price: '450k', img: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=600&q=80' },
  { id: 4, name: 'Set Gia Đình', price: '899k', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80', wide: true },
];

export let BEST_SELLERS_DATA = [];

export const COMBOS_DATA = [
  { id: 1, name: "Set Uyên Ương", price: "599k", img: FIXED_PRODUCT_IMAGE, desc: "Lãng mạn dành cho 2 người với nến và rượu vang." },
  { id: 2, name: "Combo Gia Đình", price: "899k", img: FIXED_PRODUCT_IMAGE, desc: "Lẩu hải sản và 3 món nướng cho gia đình 4 người." },
  { id: 3, name: "Tiệc Bạn Bè", price: "1.2tr", img: FIXED_PRODUCT_IMAGE, desc: "Khay hải sản khổng lồ kèm bia tươi mát lạnh." },
  { id: 4, name: "Set Lunch Pro", price: "150k", img: FIXED_PRODUCT_IMAGE, desc: "Cơm hải sản cao cấp dành cho dân văn phòng." },
  { id: 5, name: "Combo Đại Dương", price: "2.5tr", img: FIXED_PRODUCT_IMAGE, desc: "Cua hoàng đế và tôm hùm bỏ lò phô mai." },
  { id: 6, name: "Buffet Hải Sản", price: "499k", img: FIXED_PRODUCT_IMAGE, desc: "Ăn không giới hạn các món hải sản tươi sống." },
  { id: 7, name: "Set Healthy", price: "320k", img: FIXED_PRODUCT_IMAGE, desc: "Hải sản hấp thủy nhiệt giữ trọn vị ngọt tự nhiên." },
  { id: 8, name: "Combo Trẻ Em", price: "120k", img: FIXED_PRODUCT_IMAGE, desc: "Xúc xích hải sản và cơm cuộn vui nhộn." },
  { id: 9, name: "Set Sashimi King", price: "1.8tr", img: FIXED_PRODUCT_IMAGE, desc: "Đầy đủ các loại cá nhập khẩu cao cấp nhất." },
  { id: 10, name: "Tiệc Ngoài Trời", price: "3.5tr", img: FIXED_PRODUCT_IMAGE, desc: "Set nướng BBQ hải sản kèm nhân viên phục vụ tại chỗ." }
];

// --- MAIN HOME PAGE ---
const Home = () => {
  const navigate = useNavigate();
  const [bestSellers, setBestSellers] = useState([]);
  const [hotStart, setHotStart] = useState(0);
  const [discounts, setDiscounts] = useState([]);
  const [dealStart, setDealStart] = useState(0);
  const [dealVisibleCount, setDealVisibleCount] = useState(4);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('19:00');
  const [bookingGuests, setBookingGuests] = useState(2);
  const [toast, setToast] = useState(null); // { name, img }
  const [showAuthRequired, setShowAuthRequired] = useState(false);

  useEffect(() => {
    axios.get('https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api/food/best-sellers?top=8')
      .then(res => {
        const mapped = res.data.map(item => ({
          id: item.foodId,
          name: item.name,
          price: item.price,
          oldPrice: item.originalPrice || null,
          img: item.image,
          desc: item.description || 'Thưởng thức hương vị hải sản thượng hạng.',
          rating: item.rating || 4.8,
        }));
        setBestSellers(mapped);
        BEST_SELLERS_DATA = mapped;
      })
      .catch(err => console.error('Best sellers error:', err));

    axios.get('https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api/food/discount')
      .then(res => setDiscounts(res.data))
      .catch(err => console.error('Discounts error:', err));
  }, []);

  useEffect(() => {
    const updateDealVisibleCount = () => {
      const width = window.innerWidth;
      if (width <= 480) {
        setDealVisibleCount(1);
        return;
      }
      if (width <= 768) {
        setDealVisibleCount(2);
        return;
      }
      if (width <= 1024) {
        setDealVisibleCount(2);
        return;
      }
      setDealVisibleCount(4);
    };

    updateDealVisibleCount();
    window.addEventListener('resize', updateDealVisibleCount);
    return () => window.removeEventListener('resize', updateDealVisibleCount);
  }, []);

  const showToast = (item) => {
    setToast(item);
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddToCart = (item) => {
    if (!isAuthenticated()) {
      setShowAuthRequired(true);
      return;
    }
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ id: item.id, name: item.name, price: item.price, img: item.img, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    showToast(item);
  };

  const handleBooking = (e) => {
    e.preventDefault();
    navigate('/services');
  };

  const reviewColumnA = [...REVIEWS_DATA, ...REVIEWS_DATA, ...REVIEWS_DATA];
  const reviewColumnB = [...REVIEWS_DATA].reverse();
  const reviewColumnBLoop = [...reviewColumnB, ...reviewColumnB, ...reviewColumnB];
  const HOT_VISIBLE_COUNT = 4;
  const canSlideHot = bestSellers.length > HOT_VISIBLE_COUNT;

  const hotDishes = bestSellers.length > 0
    ? Array.from({ length: Math.min(HOT_VISIBLE_COUNT, bestSellers.length) }, (_, offset) => {
        const index = (hotStart + offset) % bestSellers.length;
        return {
          item: bestSellers[index],
          rank: index + 1,
          slot: offset,
        };
      })
    : Array.from({ length: HOT_VISIBLE_COUNT }, (_, offset) => ({
        item: null,
        rank: offset + 1,
        slot: offset,
      }));

  const hotNext = () => {
    if (!canSlideHot) return;
    setHotStart(prev => (prev + HOT_VISIBLE_COUNT) % bestSellers.length);
  };

  const hotPrev = () => {
    if (!canSlideHot) return;
    setHotStart(prev => (prev - HOT_VISIBLE_COUNT + bestSellers.length) % bestSellers.length);
  };

  const canSlideDeals = discounts.length > dealVisibleCount;
  const visibleDeals = discounts.length > 0
    ? Array.from({ length: Math.min(dealVisibleCount, discounts.length) }, (_, offset) => {
        const index = (dealStart + offset) % discounts.length;
        return discounts[index];
      })
    : [];

  const dealNext = () => {
    if (!canSlideDeals) return;
    setDealStart(prev => (prev + dealVisibleCount) % discounts.length);
  };

  const dealPrev = () => {
    if (!canSlideDeals) return;
    setDealStart(prev => (prev - dealVisibleCount + discounts.length) % discounts.length);
  };

  return (
    <div className="h-page">
      <Header navigate={navigate} />

      {/* ── HERO ── */}
      <section className="h-hero">
        <div className="h-hero-inner">
          <div className="h-hero-left">
            <span className="h-badge">Nhà Hàng Hải Sản Cao Cấp</span>
            <h1 className="h-hero-title">
              Tinh Hoa<br />
              <span className="h-accent">Đại Dương</span><br />
              Trên Bàn Tiệc
            </h1>
            <p className="h-hero-sub">
              Trải nghiệm ẩm thực hải sản tươi sống được chế biến bởi
              các đầu bếp hàng đầu trong không gian sang trọng, tinh tế.
            </p>
            <div className="h-hero-actions">
              <button className="h-btn-primary" onClick={() => navigate('/menu')}>
                <ShoppingCart size={18} /> Đặt Món Ngay
              </button>
              <button className="h-btn-outline" onClick={() => navigate('/services')}>
                <Calendar size={18} /> Đặt Bàn
              </button>
            </div>
            <div className="h-stats">
              <div className="h-stat"><span className="h-stat-num">15+</span><span className="h-stat-label">Năm kinh nghiệm</span></div>
              <div className="h-stat-divider" />
              <div className="h-stat"><span className="h-stat-num">50+</span><span className="h-stat-label">Món đặc sản</span></div>
              <div className="h-stat-divider" />
              <div className="h-stat"><span className="h-stat-num">10K+</span><span className="h-stat-label">Khách hài lòng</span></div>
            </div>
          </div>
          <div className="h-hero-right">
            <div className="h-hero-img-wrap">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=85"
                alt="Nhà hàng hải sản cao cấp"
                className="h-hero-img"
              />
              <div className="h-open-sticker" aria-label="Đang mở cửa">
                <span className="h-open-dot" />
                Đang Mở Cửa
              </div>
              <div className="h-promo-tape" aria-hidden="true">🎉 Ưu đãi hôm nay −20%</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOT DISHES ── */}
      <section className="h-section h-hot-section">
        <div className="h-section-inner">
          <div className="h-section-head">
            <div>
              <p className="h-eyebrow h-hot-eyebrow">Được Yêu Thích Nhất</p>
              <h2 className="h-section-title h-hot-title">
                Món Ăn Bán Chạy
                <span className="h-title-sticker h-title-sticker-live">Trending 🔥</span>
              </h2>
            </div>
            <button className="h-link-btn" onClick={() => navigate('/menu')}>
              Xem tất cả <ChevronRight size={16} />
            </button>
          </div>
          <div className="h-hot-slider-shell" aria-label="Điều hướng món bán chạy">
            <button className="h-hot-nav-btn h-hot-nav-btn-side h-hot-nav-left" onClick={hotPrev} disabled={!canSlideHot} aria-label="Hiển thị 4 món trước">
              <ChevronLeft size={24} />
            </button>
            <div className="h-grid-4">
            {hotDishes.map(({ item, rank, slot }) => (
              <div key={item ? item.id : `empty-${slot}`} className="h-dish-card">
                <div className="h-dish-img-wrap">
                  <img
                    src={item ? item.img : FIXED_PRODUCT_IMAGE}
                    alt={item ? item.name : ''}
                    className="h-dish-img"
                    loading="lazy"
                    onError={e => { e.target.src = FIXED_PRODUCT_IMAGE; }}
                  />
                  <span className="h-rank-sticker">#{rank}</span>
                  {slot === 0 && <div className="h-ribbon-corner h-ribbon-hot">🔥 HOT</div>}
                  {slot === 1 && <div className="h-ribbon-corner h-ribbon-new">✨ NEW</div>}
                  {item?.oldPrice && (
                    <span className="h-dish-badge">
                      -{Math.round(((item.oldPrice - item.price) / item.oldPrice) * 100)}%
                    </span>
                  )}
                </div>
                <div className="h-dish-body">
                  <h4 className="h-dish-name">{item ? item.name : <span className="h-skeleton" />}</h4>
                  <p className="h-dish-desc">{item ? item.desc : ''}</p>
                  <div className="h-dish-footer">
                    <div>
                      <span className="h-dish-price">{item ? (typeof item.price === 'number' ? item.price.toLocaleString() + 'đ' : item.price) : ''}</span>
                      {item?.oldPrice && <span className="h-dish-old">{item.oldPrice.toLocaleString()}đ</span>}
                    </div>
                    <button className="h-add-btn" onClick={() => item && handleAddToCart(item)} aria-label="Thêm vào giỏ">
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
            <button className="h-hot-nav-btn h-hot-nav-btn-side h-hot-nav-right" onClick={hotNext} disabled={!canSlideHot} aria-label="Hiển thị 4 món tiếp theo">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </section>

      {/* ── DEALS / GIẢM GIÁ ── */}
      {discounts.length > 0 && (
        <section className="h-section h-section-light h-deals-section">
          <div className="h-section-inner">
            <div className="h-section-head">
              <div>
                <p className="h-eyebrow h-deals-eyebrow">Đang Giảm Giá</p>
                <h2 className="h-section-title h-deals-title">
                  Ưu Đãi Hôm Nay 🔥
                  <span className="h-deals-ping" aria-hidden="true" />
                </h2>
              </div>
              <button className="h-link-btn" onClick={() => navigate('/menu')}>
                Xem tất cả <ChevronRight size={16} />
              </button>
            </div>
            <div className="h-hot-slider-shell" aria-label="Điều hướng ưu đãi hôm nay">
              <button
                className="h-hot-nav-btn h-hot-nav-btn-side h-hot-nav-left"
                onClick={dealPrev}
                disabled={!canSlideDeals}
                aria-label="Hiển thị ưu đãi trước"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="h-grid-4 h-deals-grid">
              {visibleDeals.map((item) => {
                const pct = item.price > 0
                  ? Math.round(((item.price - item.promotionalPrice) / item.price) * 100)
                  : 0;
                return (
                  <div key={item.foodId || item.id} className="h-deal-card">
                    <div className="h-deal-img-wrap">
                      <img
                        src={item.image || FIXED_PRODUCT_IMAGE}
                        alt={item.name}
                        className="h-deal-img"
                        loading="lazy"
                        onError={e => { e.target.src = FIXED_PRODUCT_IMAGE; }}
                      />
                      {pct > 0 && <span className="h-deal-badge">-{pct}%</span>}
                    </div>
                    <div className="h-deal-body">
                      <h4 className="h-deal-name">{item.name}</h4>
                      <p className="h-deal-desc">{item.description}</p>
                      <div className="h-deal-footer">
                        <div className="h-deal-prices">
                          <span className="h-deal-old">{item.price?.toLocaleString()}đ</span>
                          <span className="h-deal-new">{item.promotionalPrice?.toLocaleString()}đ</span>
                        </div>
                        <button className="h-add-btn" onClick={() => navigate('/menu')} aria-label="Đặt ngay">
                          <ShoppingCart size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>

              <button
                className="h-hot-nav-btn h-hot-nav-btn-side h-hot-nav-right"
                onClick={dealNext}
                disabled={!canSlideDeals}
                aria-label="Hiển thị ưu đãi tiếp theo"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── SERVICES / BOOKING & EVENT ── */}
      <section className="h-section h-services-showcase">
        <div className="h-section-inner">
          <div className="h-section-head">
            <div>
              <p className="h-eyebrow">Dịch Vụ Nổi Bật</p>
              <h2 className="h-section-title">Đặt Bàn & Đặt Sự Kiện</h2>
            </div>
          </div>

          <div className="h-service-highlights" aria-label="Lợi ích dịch vụ nổi bật">
            <span className="h-service-pill">⚡ Xác nhận nhanh dưới 30 phút</span>
            <span className="h-service-pill">🎁 Ưu đãi nhóm từ 10 khách</span>
            <span className="h-service-pill">🛎️ Hỗ trợ setup theo yêu cầu</span>
          </div>

          <div className="h-service-grid">
            <article className="h-service-card h-service-card-booking">
              <div className="h-service-live-badge">ĐANG HOT</div>
              <div className="h-service-tag">Ưu Tiên Chỗ Đẹp</div>
              <h3 className="h-service-title">Đặt Bàn Nhanh</h3>
              <p className="h-service-desc">
                Chọn khung giờ yêu thích và giữ chỗ trong vài giây.
                Đội ngũ xác nhận nhanh để bạn yên tâm lên lịch.
              </p>
              <div className="h-service-meta">
                <span><Clock size={15} /> Xác nhận trong 30 phút</span>
                <span><MapPin size={15} /> View đẹp theo số lượng khách</span>
              </div>
              <div className="h-service-stats">
                <span><strong>98%</strong> khách hài lòng</span>
                <span><strong>5K+</strong> lượt đặt bàn/tháng</span>
              </div>
              <button className="h-service-btn" onClick={() => navigate('/services')}>
                <Calendar size={16} /> Đặt Bàn Ngay
              </button>
            </article>

            <article className="h-service-card h-service-card-event">
              <div className="h-service-live-badge">TRENDING</div>
              <div className="h-service-tag">Trang Trí Theo Chủ Đề</div>
              <h3 className="h-service-title">Đặt Sự Kiện</h3>
              <p className="h-service-desc">
                Tổ chức sinh nhật, liên hoan, kỷ niệm với không gian riêng,
                setup âm thanh - trang trí theo concept bạn muốn.
              </p>
              <div className="h-service-meta">
                <span>🎉 Hỗ trợ từ 10 đến 120 khách</span>
                <span>🎵 Setup sân khấu mini, backdrop, MC</span>
              </div>
              <div className="h-service-stats">
                <span><strong>120+</strong> sự kiện/tháng</span>
                <span><strong>4.9★</strong> đánh giá dịch vụ</span>
              </div>
              <button className="h-service-btn" onClick={() => navigate('/services')}>
                ✨ Tư Vấn Sự Kiện
              </button>
            </article>
          </div>
        </div>
      </section>

      {/* ── SIGNATURE MENU (BENTO) ── */}
      <section className="h-section h-section-light">
        <div className="h-section-inner">
          <div className="h-section-head">
            <div>
              <p className="h-eyebrow">Đặc Sản Nhà Hàng</p>
              <h2 className="h-section-title">Thực Đơn Signature</h2>
            </div>
            <button className="h-link-btn" onClick={() => navigate('/menu')}>
              Khám phá thêm <ChevronRight size={16} />
            </button>
          </div>
          <div className="h-bento">
            {MENU_HIGHLIGHTS.map(item => (
              <div
                key={item.id}
                className={`h-bento-item${item.featured ? ' h-bento-featured' : ''}${item.wide ? ' h-bento-wide' : ''}`}
              >
                <img src={item.img} alt={item.name} className="h-bento-img" loading="lazy" />
                {item.featured && <div className="h-chef-stamp" aria-label="Chef's Choice">Chef's<br/>Choice<br/>✨</div>}
                <div className="h-bento-overlay">
                  <h3 className="h-bento-name">{item.name}</h3>
                  {item.desc && <p className="h-bento-desc">{item.desc}</p>}
                  <span className="h-bento-price">{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="h-section h-reviews-showcase">
        <div className="h-section-inner h-reviews-layout">
          <div className="h-reviews-left">
            <div className="h-review-quote-mark">❞</div>
            <h2 className="h-reviews-title">Khách hàng nói gì<br />về chúng tôi?</h2>
            <div className="h-reviews-score">4.9</div>
            <div className="h-reviews-stars">★★★★★</div>
            <p className="h-reviews-count">1,500+ ĐÁNH GIÁ THỰC TẾ</p>
          </div>

          <div className="h-reviews-right" aria-label="Đánh giá khách hàng tự động cuộn">
            <div className="h-reviews-col">
              <div className="h-reviews-track h-track-up">
                {reviewColumnA.map((r, idx) => (
                  <article key={`col-a-${idx}`} className="h-review-flow-card">
                    <p className="h-review-flow-text">{r.text}</p>
                    <div className="h-review-flow-user">
                      <div className="h-avatar">{r.initials}</div>
                      <div>
                        <p className="h-review-name">{r.name}</p>
                        <p className="h-review-role">{r.role}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="h-reviews-col">
              <div className="h-reviews-track h-track-down">
                {reviewColumnBLoop.map((r, idx) => (
                  <article key={`col-b-${idx}`} className="h-review-flow-card">
                    <p className="h-review-flow-text">{r.text}</p>
                    <div className="h-review-flow-user">
                      <div className="h-avatar">{r.initials}</div>
                      <div>
                        <p className="h-review-name">{r.name}</p>
                        <p className="h-review-role">{r.role}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="h-section h-section-light">
        <div className="h-section-inner">
          <div className="h-about-wrap">
            <div className="h-about-img-wrap">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80"
                alt="Nhà hàng"
                className="h-about-img"
              />
              <div className="h-est-badge" aria-label="Thành lập năm 2009">
                <span className="h-est-since">Since</span>
                <span className="h-est-year">2009</span>
                <span className="h-est-sub">★ Uy tín ★</span>
              </div>
            </div>
            <div className="h-about-content">
              <p className="h-eyebrow">Câu Chuyện Của Chúng Tôi</p>
              <h2 className="h-section-title">Hơn 15 Năm<br />Tinh Hoa Ẩm Thực</h2>
              <p className="h-about-text">
                Từ năm 2009, nhà hàng chúng tôi đã phục vụ những món hải sản tươi sống
                nhất từ ngư dân địa phương, kết hợp với kỹ thuật nấu ăn tinh tế để tạo
                ra những hương vị độc đáo mà thực khách không thể tìm thấy ở nơi nào khác.
              </p>
              <div className="h-about-items">
                <div className="h-about-item">
                  <div className="h-about-icon"><MapPin size={20} /></div>
                  <div>
                    <p className="h-about-item-title">Vị Trí Đắc Địa</p>
                    <p className="h-about-item-text">123 Võ Nguyên Giáp, view biển Đà Nẵng</p>
                  </div>
                </div>
                <div className="h-about-item">
                  <div className="h-about-icon"><Clock size={20} /></div>
                  <div>
                    <p className="h-about-item-title">Giờ Phục Vụ</p>
                    <p className="h-about-item-text">10:00 – 23:30, 365 ngày/năm</p>
                  </div>
                </div>
                <div className="h-about-item">
                  <div className="h-about-icon"><Phone size={20} /></div>
                  <div>
                    <p className="h-about-item-title">Liên Hệ</p>
                    <p className="h-about-item-text">1900 1234 · 0905 123 456</p>
                  </div>
                </div>
              </div>
              <button className="h-btn-primary" onClick={() => navigate('/about')}>
                Tìm Hiểu Thêm <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div className="h-toast" role="status">
          <img src={toast.img} alt={toast.name} className="h-toast-img" onError={e => { e.target.src = FIXED_PRODUCT_IMAGE; }} />
          <div className="h-toast-body">
            <span className="h-toast-title">Đã thêm vào giỏ hàng ✅</span>
            <span className="h-toast-name">{toast.name}</span>
          </div>
          <button className="h-toast-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      <AuthRequiredModal
        isOpen={showAuthRequired}
        onClose={() => setShowAuthRequired(false)}
      />

      <Footer />
    </div>
  );
};

export default Home;