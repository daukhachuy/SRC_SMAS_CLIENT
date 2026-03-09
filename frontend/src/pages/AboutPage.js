import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/AboutPage.css';

const AboutPage = () => {
  const navigate = useNavigate();

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

  const reviewCards = [
    { id: 1, name: 'Lan Anh', text: '"Món cua sốt trứng muối rất đậm đà, nhân viên phục vụ 10 điểm."', avatar: 'https://i.pravatar.cc/100?u=lan-anh' },
    { id: 2, name: 'Bích Ngọc', text: '"Lẩu hải sản vị thanh ngọt tự nhiên, gia đình tôi rất thích."', avatar: 'https://i.pravatar.cc/100?u=bich-ngoc' },
    { id: 3, name: 'Hoàng Nam', text: '"View biển đẹp, đồ ăn ra nhanh và nóng hổi. Rất đáng tiền!"', avatar: 'https://i.pravatar.cc/100?u=hoang-nam' },
    { id: 4, name: 'Thanh Tùng', text: '"Không gian đẹp, phục vụ chuyên nghiệp và cực kỳ thân thiện."', avatar: 'https://i.pravatar.cc/100?u=thanh-tung' }
  ];

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
              <div className="about-big-rating">4.9</div>
              <div className="about-stars-row">★★★★★</div>
              <p className="about-total-reviews">1,500+ ĐÁNH GIÁ THỰC TẾ</p>
            </div>

            <div className="about-review-right">
              {reviewCards.map((item) => (
                <article key={item.id} className="about-feedback-card">
                  <p className="about-feedback-text">{item.text}</p>
                  <div className="about-feedback-user">
                    <img src={item.avatar} className="about-feedback-avatar" alt={item.name} />
                    <div>
                      <p className="about-feedback-name">{item.name}</p>
                      <p className="about-feedback-status">Thực khách hài lòng</p>
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
