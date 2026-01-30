import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/AboutPage.css';

const AboutPage = () => {
  const navigate = useNavigate();
  const [activeReviewIdx, setActiveReviewIdx] = useState(0);
  const [selectedGalleryIdx, setSelectedGalleryIdx] = useState(0);

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

  const reviews = [
    {
      id: 1,
      name: 'Phương Uyên',
      rating: 5,
      comment: 'Dồ ăn ngon phục vụ nhiệt tình rất tốt để ghé thăm',
      image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=300'
    },
  ];

  const ratingStats = {
    average: 4.5,
    total: 100,
    breakdown: [
      { stars: 5, count: 87 },
      { stars: 4, count: 7 },
      { stars: 3, count: 5 },
      { stars: 2, count: 1 },
      { stars: 1, count: 0 }
    ]
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

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveReviewIdx(prev => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
          <h2 className="reviews-title">Đánh giá khách hàng</h2>
          <p className="reviews-subtitle">
            Chúng tôi luôn sẵn sàng lắng nghe những đánh giá của khách hàng để cải thiện nhà hàng hàng ngày
          </p>

          <div className="reviews-content">
            <div className="reviews-stats">
              <div className="reviews-rating">
                <div className="rating-score">
                  <span className="rating-number">{ratingStats.average.toFixed(1)}</span>
                  <span className="rating-slash"> / </span>
                  <span className="rating-total">5</span>
                </div>
                <div className="rating-stars">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.floor(ratingStats.average) ? 'star-filled' : 'star-empty'}>★</span>
                  ))}
                </div>
                <p className="rating-count">{ratingStats.total} lượt đánh giá</p>
              </div>

              <div className="reviews-breakdown">
                {ratingStats.breakdown.map((item) => (
                  <div key={item.stars} className="breakdown-item">
                    <span className="breakdown-stars">{item.stars} ★</span>
                    <div className="breakdown-bar">
                      <div 
                        className="breakdown-fill"
                        style={{ width: `${(item.count / ratingStats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="breakdown-count">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="reviews-list">
              <h3 className="reviews-list-title">Được đánh giá bởi các khách hàng thân thiết</h3>
              <p className="reviews-list-subtitle">
                Đây chính là sự ghi nhận lớn nhất đối với đội của chúng tôi có động lực cải tiến không ngừng nghỉ và dem đến trải nghiệm tốt nhất cho từng khách hàng
              </p>

              <div className="review-card">
                <div className="review-header">
                  <h4 className="review-name">{reviews[activeReviewIdx].name}</h4>
                  <span className="review-rating">Đã đánh giá {reviews[activeReviewIdx].rating} ★</span>
                </div>
                <p className="review-comment">{reviews[activeReviewIdx].comment}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESTAURANT INFO SECTION */}
      <section className="restaurant-info-section">
        <div className="restaurant-info-container">
          <h2 className="info-section-title">Thông tin về nhà hàng</h2>

          <div className="info-content">
            <div className="info-details">
              <div className="info-item-box">
                <div className="info-item-icon">🍽️</div>
                <div className="info-item-content">
                  <h3>{branches[0].name}</h3>
                  <ul className="info-list">
                    <li><strong>Địa chỉ:</strong> {branches[0].address}</li>
                    <li><strong>Thời gian mở cửa:</strong> {branches[0].hours}</li>
                    <li><strong>Liên hệ:</strong> {branches[0].phone}</li>
                    <li><strong>Liên kết:</strong> {branches[0].website}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="info-map">
              <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600" 
                alt="Map location" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* BRANCHES & FOOTER INFO */}
      <section className="branches-section">
        <div className="branches-container">
          <div className="social-icons">
            <span className="social-label">Theo dõi chúng tôi</span>
          </div>

          <h3 className="branches-title">Nhà Hàng Lẩu Nướng Số 1</h3>

          <div className="branches-grid">
            <div className="branch-column">
              <h4>VỀ CHÚNG TÔI</h4>
              <ul>
                <li><a href="#about">Về chúng tôi</a></li>
                <li><a href="#contact">Liên hệ</a></li>
              </ul>
            </div>

            <div className="branch-column">
              <h4>CÁC DỊCH VỤ</h4>
              <ul>
                <li><a href="#booking">Đặt bàn trực tuyến</a></li>
                <li><a href="#delivery">Đặt tiệc, sự kiến</a></li>
                <li><a href="#menu">Xem thực đơn</a></li>
                <li><a href="#combo">Xem các combo hot</a></li>
                <li><a href="#delivery">Giao hàng tận nơi</a></li>
              </ul>
            </div>

            <div className="branch-column contact-column">
              <div className="branch-map-small">
                <img 
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400" 
                  alt="Location"
                />
              </div>
              <p className="branch-chat-text">Chat với cửa hàng</p>
              <button className="branch-button" onClick={() => navigate('/auth')}>
                Gửi
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
