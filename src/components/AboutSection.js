import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { FiMapPin, FiClock, FiPhone } from 'react-icons/fi';
import { FaLeaf, FaUsers } from 'react-icons/fa';
import { GiChefToque, GiFishingBoat } from 'react-icons/gi';
import '../styles/AboutSection.css';

export default function AboutSection({ name, address, openHours }) {
  const { t } = useLanguage();
  
  const features = [
    { 
      icon: <GiChefToque className="feature-icon" />, 
      title: 'Đầu bếp chuyên nghiệp', 
      description: 'Đội ngũ đầu bếp giàu kinh nghiệm, tốt nghiệp từ các trường đào tạo ẩm thực hàng đầu' 
    },
    { 
      icon: <FaLeaf className="feature-icon" />, 
      title: 'Nguyên liệu tươi sống', 
      description: 'Nguồn thực phẩm sạch, đảm bảo an toàn vệ sinh thực phẩm' 
    },
    { 
      icon: <GiFishingBoat className="feature-icon" />, 
      title: 'Hải sản tươi sống', 
      description: 'Hải sản được đánh bắt và vận chuyển tươi sống mỗi ngày' 
    },
    { 
      icon: <FaUsers className="feature-icon" />, 
      title: 'Phục vụ tận tâm', 
      description: 'Đội ngũ nhân viên chuyên nghiệp, phục vụ tận tình chu đáo' 
    }
  ];

  const stats = [
    { number: '10+', label: 'Năm kinh nghiệm' },
    { number: '50+', label: 'Món ăn đặc sản' },
    { number: '10.000+', label: 'Khách hàng hài lòng' },
    { number: '98%', label: 'Đánh giá 5 sao' }
  ];

  return (
    <section id="about" className="about-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Về Nhà Hàng Chúng Tôi</h2>
          <p className="section-subtitle">Khám phá câu chuyện và triết lý ẩm thực của chúng tôi</p>
          <div className="divider"></div>
        </div>

        <div className="about-content">
          <div className="about-image">
            <div className="main-image">
              <img src="/images/about/restaurant-interior.jpg" alt="Không gian nhà hàng" />
            </div>
            <div className="image-grid">
              <div className="small-image">
                <img src="/images/about/chef.jpg" alt="Đầu bếp" />
              </div>
              <div className="small-image">
                <img src="/images/about/ingredients.jpg" alt="Nguyên liệu" />
              </div>
            </div>
            <div className="experience-badge">
              <span>10+</span>
              <p>Năm Kinh Nghiệm</p>
            </div>
          </div>

          <div className="about-details">
            <div className="about-description">
              <p>Chào mừng đến với {name} - điểm đến ẩm thực đẳng cấp với không gian sang trọng và ấm cúng. Chúng tôi tự hào mang đến những trải nghiệm ẩm thực độc đáo, kết hợp tinh hoa ẩm thực truyền thống với nét sáng tạo hiện đại.</p>
              <p>Với đội ngũ đầu bếp tài năng và nhiệt huyết, mỗi món ăn tại {name} đều là một tác phẩm nghệ thuật, được chế biến từ những nguyên liệu tươi ngon nhất, đảm bảo an toàn vệ sinh thực phẩm.</p>
            </div>

            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <div className="feature-icon-wrapper">
                    {feature.icon}
                  </div>
                  <div className="feature-text">
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <h3>{stat.number}</h3>
                  <p>{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="contact-info">
              <div className="contact-item">
                <FiMapPin className="contact-icon" />
                <div>
                  <h4>Địa chỉ</h4>
                  <p>{address || '123 Đường Ẩm Thực, Quận 1, TP.HCM'}</p>
                </div>
              </div>
              <div className="contact-item">
                <FiClock className="contact-icon" />
                <div>
                  <h4>Giờ mở cửa</h4>
                  <p>{openHours || '10:00 - 22:00 hàng ngày'}</p>
                </div>
              </div>
              <div className="contact-item">
                <FiPhone className="contact-icon" />
                <div>
                  <h4>Đặt bàn</h4>
                  <p>0909 123 456</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}