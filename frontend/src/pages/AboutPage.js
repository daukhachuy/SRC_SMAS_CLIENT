import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { feedbackAPI } from '../api/feedbackApi';
import '../styles/AboutPage.css';

const AboutPage = () => {
  const navigate = useNavigate();
  const [reviewCards, setReviewCards] = useState([
    { id: 1, name: 'Lan Anh', text: '"Món cua sốt trứng muối rất đậm đà, nhân viên phục vụ 10 điểm."', avatar: 'https://i.pravatar.cc/100?u=lan-anh', rating: 5 },
    { id: 2, name: 'Bích Ngọc', text: '"Lẩu hải sản vị thanh ngọt tự nhiên, gia đình tôi rất thích."', avatar: 'https://i.pravatar.cc/100?u=bich-ngoc', rating: 5 },
    { id: 3, name: 'Hoàng Nam', text: '"View biển đẹp, đồ ăn ra nhanh và nóng hổi. Rất đáng tiền!"', avatar: 'https://i.pravatar.cc/100?u=hoang-nam', rating: 5 },
    { id: 4, name: 'Thanh Tùng', text: '"Không gian đẹp, phục vụ chuyên nghiệp và cực kỳ thân thiện."', avatar: 'https://i.pravatar.cc/100?u=thanh-tung', rating: 5 }
  ]);

  const services = [
    {
      id: 1,
      icon: '⊞⊞',
      title: 'Đặt Bàn Trực Tuyến',
      description: 'Không gian thoáng mát với tinh thực phong pháp cơ có kết hợp với nhiều loại nước uống giải khát ở quán có ở địa điểm tận nơi bạn cần.',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=500',
      buttonText: 'Đặt Bàn'
    },
    {
      id: 2,
      icon: '🚚',
      title: 'Giao Hàng Tận Nơi',
      description: 'Chúng tôi cung cấp dịch vụ đóng gói và vận chuyển chuyên nghiệp không làm ảnh hưởng đến chất lượng từng món ăn',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=500',
      buttonText: 'Giao Hàng'
    },
    {
      id: 3,
      icon: '🎉',
      title: 'Sự Kiến',
      description: 'Nếu như bạn cần một không gian trang trí thiều mẫu sắc kết hợp với nhiều loại...hãy đến với cửa hàng của chúng tôi và trải nghiệm',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=500',
      buttonText: 'Đặt Sự Kiến'
    }
  ];

  const galleryImages = [
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1567521464027-f127ff144326?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600',
  ];

  useEffect(() => {
    const API_ORIGIN = String(
      process.env.REACT_APP_API_URL || 'https://smas-afbhfnduadasbuhr.southeastasia-01.azurewebsites.net/api'
    ).replace(/\/api\/?$/i, '');

    const toAvatarUrl = (fullname, rawAvatar) => {
      const avatar = String(rawAvatar || '').trim();
      if (avatar && avatar.toLowerCase() !== 'string') {
        if (/^https?:\/\//i.test(avatar)) return avatar;
        return `${API_ORIGIN}${avatar.startsWith('/') ? '' : '/'}${avatar}`;
      }
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=fff3e8&color=e56600&bold=true`;
    };

    const loadFeedbacks = async () => {
      try {
        const rows = await feedbackAPI.getFeedbackLists();
        const mapped = (Array.isArray(rows) ? rows : [])
          .map((item, idx) => {
            const fullname = String(item?.fullname || '').trim() || `Khách hàng ${idx + 1}`;
            const rating = Math.max(1, Math.min(5, Number(item?.rating) || 0)) || 5;
            const commentRaw = String(item?.comment || '').trim();
            const comment = commentRaw || `Khách hàng đã đánh giá ${rating} sao cho trải nghiệm tại nhà hàng.`;
            return {
              id: Number(item?.feedbackId) || idx + 1,
              name: fullname,
              text: `"${comment}"`,
              avatar: toAvatarUrl(fullname, item?.avatar),
              rating,
            };
          })
          .filter((x) => x.name && x.text);
        if (mapped.length > 0) {
          setReviewCards(mapped.slice(0, 8));
        }
      } catch (err) {
        console.warn('About feedback load error:', err?.response?.data || err?.message);
      }
    };

    loadFeedbacks();
  }, []);

  const reviewStats = useMemo(() => {
    const total = reviewCards.length;
    const avg = total > 0
      ? reviewCards.reduce((sum, x) => sum + (Number(x.rating) || 0), 0) / total
      : 4.9;
    return {
      avgText: avg.toFixed(1),
      totalText: `${total.toLocaleString('vi-VN')}+ ĐÁNH GIÁ THỰC TẾ`,
    };
  }, [reviewCards]);

  const getFeedbackStatusLabel = (rating) => {
    const n = Number(rating) || 0;
    if (n >= 5) return 'Thực khách hài lòng';
    if (n >= 4) return 'Thực khách đánh giá tốt';
    if (n >= 3) return 'Thực khách trải nghiệm';
    return 'Thực khách góp ý';
  };

  const branches = [
    {
      name: 'Nhà Hàng Lẩu Nướng Số 1',
      address: '1 abc, phường A, TP Đà Nẵng',
      hours: '10:00 - 23:00',
      phone: '0123456789',
      website: 'http://abc....'
    }
  ];

  return (
    <div className="about-page">
      <Header navigate={navigate} />

      {/* HERO SECTION */}
      <section className="about-hero">
        <div className="about-hero-overlay"></div>
        <div className="about-hero-content">
          <h1 className="about-hero-title">VỀ CHÚNG TÔI</h1>
          <p className="about-hero-subtitle">Khám phá câu chuyện và triết lý ẩm thực của chúng tôi</p>
        </div>
      </section>

      {/* ABOUT INTRO SECTION */}
      <section className="about-intro-section">
        <div className="about-intro-container">
          <div className="about-intro-image">
            <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600" alt="Nhà hàng" />
          </div>
          <div className="about-intro-content">
            <h2 className="about-intro-title">Chủ trọng vào trải nghiệm với dịch vụ tận tình</h2>
            <p className="about-intro-text">
              Nhà hàng của chúng tôi mang đến những món ăn chất lượng trong không gian ấm cúng và thân thiện. Chúng tôi luôn chú trọng trong hương vị, dịch vụ và trải nghiệm để mỗi bữa ăn của khách hàng trở nên trọn vẹn.
            </p>
          </div>
        </div>
      </section>

      {/* TERMS OF SERVICE SECTION */}
      <section className="terms-section">
  <div className="terms-container">
    <div className="terms-header">
      <h2 className="terms-title">Điều Khoản Dịch Vụ</h2>
      <p className="terms-subtitle">Các quy định chung để đảm bảo trải nghiệm tốt nhất cho quý khách</p>
    </div>
    
    <div className="terms-content">
      <div className="terms-item">
        <h3>1. Thời Gian Buffet</h3>
        <p>
          Thời gian tối đa cho một suất Buffet là <strong>120 phút</strong>. 
          Nhà hàng sẽ ngừng nhận gọi món trước 30 phút so với giờ đóng cửa để quý khách kịp hoàn tất bữa ăn.
        </p>
      </div>

      <div className="terms-item">
        <h3>2. Chính Sách Đặt Bàn</h3>
        <p>
          Quý khách vui lòng đặt bàn trước <strong>2 tiếng</strong>. Với đoàn khách trên 10 người hoặc nhu cầu tổ chức sự kiện, 
          vui lòng liên hệ Hotline để được hỗ trợ sắp xếp khu vực riêng và xác nhận đặt cọc.
        </p>
      </div>

      <div className="terms-item">
        <h3>3. Giờ Hoạt Động</h3>
        <p>
          Mở cửa phục vụ từ <strong>{branches[0].hours}</strong> hàng ngày. 
          Dịch vụ giao hàng tận nơi sẽ nhận đơn cuối cùng vào lúc 22:30 để đảm bảo chất lượng món ăn khi vận chuyển.
        </p>
      </div>

      <div className="terms-item">
        <h3>4. Thanh Toán & Thuế</h3>
        <p>
          Hỗ trợ đa dạng phương thức: Tiền mặt, Thẻ, Chuyển khoản. 
          Lưu ý giá trên thực đơn chưa bao gồm VAT. Mọi khiếu nại về hóa đơn vui lòng phản hồi ngay tại quầy thu ngân.
        </p>
      </div>
    </div>
  </div>
</section>

      {/* SERVICES SECTION */}
      <section className="services-section">
        <div className="services-container">
          <h2 className="services-title">Cung cấp nhiều dịch vụ</h2>
          <div className="services-grid">
            {services.map((service) => (
              <div key={service.id} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3 className="service-name">{service.title}</h3>
                <p className="service-description">{service.description}</p>
                <div className="service-image-wrapper">
                  <img src={service.image} alt={service.title} className="service-image" />
                </div>
                <button className="service-button" onClick={() => navigate('/menu')}>
                  {service.buttonText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section className="gallery-section">
        <div className="gallery-container">
          <h2 className="gallery-title">Không gian nhà hàng</h2>
          <p className="gallery-subtitle">
            không gian rộng mở bàn ghế sạch sẽ chúng tôi luôn ưu tiên đẹp về sinh lên hàng đầu
          </p>
          <div className="gallery-grid">
            {galleryImages.map((image, index) => (
              <div 
                key={index} 
                className={`gallery-item ${index === 1 ? 'featured' : ''} ${index === 4 ? 'featured' : ''}`}
              >
                <img src={image} alt={`Không gian ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section className="reviews-section">
        <div className="reviews-container">
          <div className="about-review-layout">
            <div className="about-review-left">
              <div className="about-quote-mark">❞</div>
              <h2 className="reviews-title">
                Khách hàng nói gì <br />
                về chúng tôi?
              </h2>
              <div className="about-big-rating">{reviewStats.avgText}</div>
              <div className="about-stars-row">★★★★★</div>
              <p className="about-total-reviews">{reviewStats.totalText}</p>
            </div>

            <div className="about-review-right">
              {reviewCards.map((item) => (
                <article key={item.id} className="about-feedback-card">
                  <p className="about-feedback-text">{item.text}</p>
                  <div className="about-feedback-user">
                    <img src={item.avatar} className="about-feedback-avatar" alt={item.name} />
                    <div>
                      <p className="about-feedback-name">{item.name}</p>
                      <p className="about-feedback-status">{getFeedbackStatusLabel(item.rating)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
