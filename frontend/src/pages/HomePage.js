// src/pages/HomePage.js

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

import bgImage from '../assets/images/about/restaurant-interior.jpg';
import AboutImage from '../assets/images/about/Untitled-12.jpg';

import {
  FaUtensils,
  FaClock,
  FaWineGlassAlt,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaTiktok
} from 'react-icons/fa';

import '../styles/HomePage.css';

const HomePage = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const galleryImages = [
    { id: 1, src: 'https://via.placeholder.com/600x400/FF6B6B/FFFFFF?text=Không+gian+nhà+hàng', alt: 'Không gian nhà hàng' },
    { id: 2, src: 'https://via.placeholder.com/600x400/4ECDC4/FFFFFF?text=Món+ăn+đặc+biệt', alt: 'Món ăn đặc biệt' },
    { id: 3, src: 'https://via.placeholder.com/600x400/45B7D1/FFFFFF?text=Đầu+bếp+chuyên+nghiệp', alt: 'Đầu bếp chuyên nghiệp' },
    { id: 4, src: 'https://via.placeholder.com/600x400/96CEB4/FFFFFF?text=Sự+kiện+đặc+biệt', alt: 'Sự kiện tại nhà hàng' }
  ];

  const testimonials = [
    {
      id: 1,
      name: 'Chị Ngọc Anh',
      comment: 'Hải sản tươi ngon, không gian sang trọng, nhân viên phục vụ nhiệt tình. Chắc chắn sẽ quay lại!',
      rating: 5,
      date: '15/11/2023'
    },
    {
      id: 2,
      name: 'Anh Minh Đức',
      comment: 'Món ăn ngon, giá cả hợp lý. Đặc biệt thích món lẩu hải sản ở đây.',
      rating: 4,
      date: '10/11/2023'
    }
  ];

  return (
    <div className="home-page">

      {/* HERO */}
      <section
        className={`hero-section ${isScrolled ? 'scrolled' : ''}`}
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container">
          <div className="hero-content">
            <h1>Nhà Hàng Hải Sản Tươi Sống</h1>
            <p>Hương vị biển cả tươi ngon nhất</p>

            <div className="hero-buttons">
              <Link to="/dat-ban" className="btn btn-primary">
                Đặt bàn ngay
              </Link>
              <Link to="/menu" className="btn btn-outline">
                Xem thực đơn
              </Link>
            </div>
          </div>
        </div>
      </section>



      {/* ABOUT SECTION */}
      <section className="about-section">

        {/* WELCOME TITLE */}
        <div className="about-top-title">
          <h1>
            Welcome to{" "}
            <span className="brand-highlight">
              <FaUtensils className="icon-utensils" /> Nhà Hàng Hải Sản
            </span>
          </h1>
        </div>

        {/* TWO COLUMNS */}
        <div className="about-container">

          {/* LEFT TEXT */}
          <div className="about-left">
            <p className="about-text">
              Chúng tôi cam kết mang đến những món hải sản tươi ngon, được lựa chọn
              kỹ càng và chế biến bởi đội ngũ đầu bếp giàu kinh nghiệm.
            </p>
            <p className="about-text">
              Không gian sang trọng, phục vụ tận tâm và trải nghiệm ẩm thực đẳng cấp
              là lời hứa của chúng tôi dành cho quý khách.
            </p>
            <Link to="/about" className="about-btn">
              READ MORE
            </Link>
          </div>

          {/* RIGHT IMAGE */}
          <div className="about-right">
            <img src={AboutImage} alt="Về chúng tôi" />
          </div>

        </div>

      </section>

      {/* GALLERY */}
      <section className="gallery-section">
        <div className="container">
          <div className="section-header">
            <h2>Thực đơn</h2>
            <p>Khám phá không gian và ẩm thực của chúng tôi</p>
          </div>

          <div className="gallery-grid">
            {galleryImages.map(img => (
              <div key={img.id} className="gallery-item">
                <img src={img.src} alt={img.alt} />
                <div className="gallery-overlay">
                  <div className="gallery-content">
                    <h3>{img.alt}</h3>
                    <p>Xem thêm</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SERVICES */}
      <section className="services-section">
        <div className="container">
          <div className="section-header">
            <h2>Dịch vụ nổi bật</h2>
            <p>Những dịch vụ giúp trải nghiệm tại nhà hàng tuyệt vời hơn</p>
          </div>

          <div className="services-grid">
            <div className="service-item">
              <FaUtensils className="service-icon" />
              <h5>Đặt bàn trực tuyến</h5>
              <p>Dễ dàng đặt bàn trước để đảm bảo trải nghiệm trọn vẹn.</p>
            </div>

            <div className="service-item">
              <FaWineGlassAlt className="service-icon" />
              <h5>Thực đơn đa dạng</h5>
              <p>Món hải sản tươi mới, chế biến tinh tế.</p>
            </div>

            <div className="service-item">
              <FaUtensils className="service-icon" />
              <h5>Giao món tận nhà</h5>
              <p>Đặt món online và giao tận nơi.</p>
            </div>

            <div className="service-item">
              <FaClock className="service-icon" />
              <h5>Hỗ trợ 24/7</h5>
              <p>Luôn sẵn sàng đồng hành cùng khách hàng.</p>
            </div>

          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>Khách hàng nói gì</h2>
            <p>Những đánh giá chân thực từ khách hàng</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map(t => (
              <div key={t.id} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < t.rating ? 'active' : ''}>★</span>
                  ))}
                </div>

                <p className="testimonial-text">"{t.comment}"</p>

                <div className="testimonial-author">
                  <div className="author-avatar">{t.name.charAt(0)}</div>
                  <div className="author-info">
                    <h4>{t.name}</h4>
                    <span>{t.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* RESERVATION */}
      <section
        className="reservation-section"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.8), rgba(0,0,0,0.8)), 
            url(https://via.placeholder.com/1920x1080/2C3E50/FFFFFF?text=Nhà+Hàng)
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="container">
          <div className="reservation-grid">

            <div className="reservation-info">
              <h2>Đặt bàn ngay</h2>
              <p>Để có trải nghiệm ẩm thực tuyệt vời nhất</p>

              <div className="contact-info">
                <div className="contact-item">
                  <FaMapMarkerAlt className="contact-icon" />
                  <div>
                    <h4>Địa chỉ</h4>
                    <p>123 Đường Biển, Quận 1, TP.HCM</p>
                  </div>
                </div>

                <div className="contact-item">
                  <FaPhone className="contact-icon" />
                  <div>
                    <h4>Điện thoại</h4>
                    <p>0909 123 456</p>
                  </div>
                </div>

                <div className="contact-item">
                  <FaEnvelope className="contact-icon" />
                  <div>
                    <h4>Email</h4>
                    <p>info@nhahanghaisan.com</p>
                  </div>
                </div>
              </div>

              <div className="social-links">
                <a href="#"><FaFacebookF /></a>
                <a href="#"><FaInstagram /></a>
                <a href="#"><FaYoutube /></a>
                <a href="#"><FaTiktok /></a>
              </div>
            </div>

            {/* FORM */}
            <div className="reservation-form">
              <h3>Đặt bàn trực tuyến</h3>
              <form>
                <div className="form-group">
                  <input type="text" placeholder="Họ và tên" required />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Email" required />
                </div>
                <div className="form-group">
                  <input type="tel" placeholder="Số điện thoại" required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <input type="date" required />
                  </div>

                  <div className="form-group">
                    <select required>
                      <option value="">Giờ</option>
                      {Array.from({ length: 13 }, (_, i) => (
                        <option key={i} value={`${i + 10}:00`}>
                          {i + 10}:00
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <select required>
                      <option value="">Số người</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                        <option key={n} value={n}>{n} người</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <textarea rows="4" placeholder="Yêu cầu đặc biệt"></textarea>
                </div>

                <button className="btn btn-primary btn-block" type="submit">
                  Đặt bàn ngay
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
