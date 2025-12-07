import React, { useEffect } from 'react';
import { FaAward, FaUtensils, FaLeaf, FaUsers, FaMapMarkerAlt, FaPhone, FaClock, FaStar, FaQuoteLeft, FaDirections } from 'react-icons/fa';
import { GiChefToque, GiFishingBoat, GiMeal } from 'react-icons/gi';
import { IoRestaurantSharp } from 'react-icons/io5';
import { motion } from 'framer-motion';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import '../styles/AboutPage.css';

const AboutPage = () => {
  useEffect(() => {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
          behavior: 'smooth'
        });
      });
    });
  }, []);

  const features = [
    {
      icon: <GiChefToque className="feature-icon" />,
      title: 'Đầu Bếp Chuyên Nghiệp',
      description: 'Đội ngũ đầu bếp tài năng với nhiều năm kinh nghiệm từ các nhà hàng 5 sao',
      delay: 0.1
    },
    {
      icon: <FaLeaf className="feature-icon" />,
      title: 'Nguyên Liệu Tươi Sống',
      description: 'Nguyên liệu được chọn lọc kỹ lưỡng, đảm bảo tươi ngon và an toàn',
      delay: 0.2
    },
    {
      icon: <GiFishingBoat className="feature-icon" />,
      title: 'Hải Sản Tươi Sống',
      description: 'Hải sản được đánh bắt và vận chuyển tươi sống mỗi ngày',
      delay: 0.3
    },
    {
      icon: <FaUsers className="feature-icon" />,
      title: 'Phục Vụ Tận Tâm',
      description: 'Đội ngũ nhân viên chuyên nghiệp, phục vụ tận tình chu đáo',
      delay: 0.4
    }
  ];

  const stats = [
    { number: '10+', label: 'Năm Kinh Nghiệm', icon: <FaAward /> },
    { number: '50+', label: 'Món Ăn Đặc Sản', icon: <GiMeal /> },
    { number: '10K+', label: 'Khách Hàng Hài Lòng', icon: <FaUsers /> },
    { number: '98%', label: 'Đánh Giá Tốt', icon: <FaStar /> }
  ];

  const testimonials = [
    {
      name: 'Chị Hương',
      role: 'Khách hàng thân thiết',
      content: 'Không gian sang trọng, đồ ăn ngon, phục vụ chu đáo. Tôi rất hài lòng với trải nghiệm tại đây!',
      rating: 5
    },
    {
      name: 'Anh Minh',
      role: 'Food Blogger',
      content: 'Hương vị đặc biệt, nguyên liệu tươi ngon. Chắc chắn sẽ quay lại!',
      rating: 5
    }
  ];

  const renderStars = (count) => {
    return Array(5).fill(0).map((_, i) => (
      <FaStar key={i} className={i < count ? 'star filled' : 'star'} />
    ));
  };

  // Map configuration
  const mapContainerStyle = {
    width: '100%',
    height: '400px'
  };

  const center = {
    lat: 10.8231,  // Replace with your restaurant's latitude
    lng: 106.6297  // Replace with your restaurant's longitude
  };

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Về Chúng Tôi
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Khám phá câu chuyện và triết lý ẩm thực của chúng tôi
          </motion.p>
          <motion.a 
            href="#about-content" 
            className="cta-button"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Khám Phá Ngay
          </motion.a>
        </div>
        <div className="scroll-down">
          <span>Cuộn xuống</span>
          <div className="arrow-down"></div>
        </div>
      </section>

      {/* About Content */}
      <section id="about-content" className="about-intro">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Giới Thiệu</span>
            <h2 className="section-title">Nhà Hàng Hải Sản Cao Cấp</h2>
            <div className="divider">
              <span></span>
              <IoRestaurantSharp className="divider-icon" />
              <span></span>
            </div>
          </div>

          <div className="about-content">
            <motion.div 
              className="about-text"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p>Được thành lập từ năm 2010, chúng tôi tự hào là một trong những nhà hàng hải sản hàng đầu tại Việt Nam. Với triết lý "Chất lượng tạo nên thương hiệu", mỗi món ăn của chúng tôi đều là tâm huyết của cả đội ngũ.</p>
              <p>Chúng tôi cam kết mang đến cho thực khách những trải nghiệm ẩm thực độc đáo, kết hợp giữa hương vị truyền thống và phong cách phục vụ chuyên nghiệp.</p>
              
              <div className="features-highlight">
                <div className="feature-item">
                  <div className="feature-icon"><FaLeaf /></div>
                  <div className="feature-text">
                    <h4>Nguyên Liệu Tươi Sống</h4>
                    <p>Đảm bảo tươi ngon mỗi ngày</p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon"><GiChefToque /></div>
                  <div className="feature-text">
                    <h4>Đầu Bếp Chuyên Nghiệp</h4>
                    <p>Kinh nghiệm dày dặn</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="about-image"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="image-main">
                <div className="restaurant-placeholder">
                  <FaUtensils className="restaurant-icon" />
                  <span>Không Gian Nhà Hàng</span>
                </div>
              </div>
              <div className="experience-badge">
                <FaAward className="award-icon" />
                <div>
                  <span className="years">10+</span>
                  <p>Năm Kinh Nghiệm</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Điểm Nổi Bật</span>
            <h2 className="section-title">Tại Sao Chọn Chúng Tôi</h2>
            <div className="divider">
              <span></span>
              <IoRestaurantSharp className="divider-icon" />
              <span></span>
            </div>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: feature.delay }}
              >
                <div className="feature-icon-wrapper">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="feature-decoration"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="stat-item"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="stat-icon">{stat.icon}</div>
                <h3>{stat.number}</h3>
                <p>{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="location-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Vị Trí</span>
            <h2 className="section-title">Đến Thăm Quán Của Chúng Tôi</h2>
            <div className="divider">
              <span></span>
              <IoRestaurantSharp className="divider-icon" />
              <span></span>
            </div>
          </div>

          <motion.div 
            className="map-container"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <LoadScript googleMapsApiKey="YOUR_GOOGLE_MAPS_API_KEY">
              <GoogleMap
                mapContainerClassName="google-map"
                center={center}
                zoom={16}
                options={{
                  styles: [
                    {
                      featureType: "poi",
                      elementType: "labels",
                      stylers: [{ visibility: "off" }]
                    }
                  ]
                }}
              >
                <Marker 
                  position={center} 
                  icon={{
                    url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                  }}
                />
              </GoogleMap>
            </LoadScript>
            
            <div className="location-info">
              <h3>Địa chỉ nhà hàng</h3>
              <p><FaMapMarkerAlt className="info-icon" /> 123 Đường ABC, Quận 1, TP.HCM</p>
              <p><FaPhone className="info-icon" /> +84 123 456 789</p>
              <p><FaClock className="info-icon" /> Mở cửa: 10:00 - 22:00 (Thứ 2 - CN)</p>
              <a 
                href="https://maps.google.com?q=123+Đường+ABC,+Quận+1,+TP.HCM" 
                target="_blank" 
                rel="noopener noreferrer"
                className="direction-button"
              >
                <FaDirections className="button-icon" /> Chỉ đường
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Đánh Giá</span>
            <h2 className="section-title">Khách Hàng Nói Gì Về Chúng Tôi</h2>
            <div className="divider">
              <span></span>
              <IoRestaurantSharp className="divider-icon" />
              <span></span>
            </div>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <motion.div 
                key={index} 
                className="testimonial-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <div className="quote-icon"><FaQuoteLeft /></div>
                <p className="testimonial-text">{testimonial.content}</p>
                <div className="testimonial-rating">
                  {renderStars(testimonial.rating)}
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="author-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="contact-info-section">
        <div className="container">
          <div className="section-header">
            <span className="section-subtitle">Liên Hệ</span>
            <h2 className="section-title">Đặt Bàn Ngay Hôm Nay</h2>
            <div className="divider">
              <span></span>
              <IoRestaurantSharp className="divider-icon" />
              <span></span>
            </div>
          </div>

          <div className="contact-grid">
            <motion.div 
              className="contact-item"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="contact-icon">
                <FaMapMarkerAlt />
              </div>
              <h3>Địa Chỉ</h3>
              <p>123 Đường ABC, Quận 1, TP.HCM</p>
            </motion.div>

            <motion.div 
              className="contact-item"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="contact-icon">
                <FaPhone />
              </div>
              <h3>Điện Thoại</h3>
              <p>+84 123 456 789</p>
              <p>+84 987 654 321</p>
            </motion.div>

            <motion.div 
              className="contact-item"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="contact-icon">
                <FaClock />
              </div>
              <h3>Giờ Mở Cửa</h3>
              <p>Thứ 2 - Thứ 6: 10:00 - 22:00</p>
              <p>Thứ 7 - Chủ Nhật: 09:00 - 23:00</p>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;