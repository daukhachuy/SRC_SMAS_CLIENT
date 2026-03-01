import React from 'react';
import '../styles/Footer.css';
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone, Send } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Cột 1: Logo & Giới thiệu */}
          <div className="footer-column-main">
            <div className="logo-group">
              <img src="https://res.cloudinary.com/dmzuier4p/image/upload/v1772344074/image_nxgnsu.webp" alt="Logo" className="footer-logo-img" />
              <span className="logo-text">
                <span className="text-white">Nhà Hàng</span>
                {" "}
                <span className="text-primary">FPT</span>
              </span>
            </div>
            <p className="footer-text intro-text">
              Tinh hoa ẩm thực lẩu nướng trong không gian hiện đại. 
              Chúng tôi cam kết mang đến trải nghiệm hải sản tươi sống chất lượng nhất.
            </p>
            <div className="social-row">
              <div className="social-icon"><Facebook size={18} /></div>
              <div className="social-icon"><Instagram size={18} /></div>
              <div className="social-icon"><Twitter size={18} /></div>
              <div className="social-icon"><Mail size={18} /></div>
            </div>
          </div>

          {/* Cột 2: Khám phá */}
          <div className="footer-column">
            <h4 className="footer-heading">KHÁM PHÁ</h4>
            <ul className="footer-list">
              <li className="footer-list-item">Thực đơn chính</li>
              <li className="footer-list-item">Ưu đãi Combo</li>
              <li className="footer-list-item">Đặt bàn ngay</li>
              <li className="footer-list-item">Tuyển dụng</li>
            </ul>
          </div>

          {/* Cột 3: Bản tin & Liên hệ */}
          <div className="footer-column">
            <h4 className="footer-heading">LIÊN HỆ</h4>
            <div className="contact-info">
              <p className="footer-text"><MapPin size={16} className="icon-orange" /> 123 Võ Nguyên Giáp, Đà Nẵng</p>
              <p className="footer-text"><Phone size={16} className="icon-orange" /> +84 905 123 456</p>
              <h4 className="footer-heading small-heading">BẢN TIN</h4>
              <div className="newsletter-box">
                <input type="email" placeholder="Email của bạn..." className="newsletter-input" />
                <button className="newsletter-btn"><Send size={16} /></button>
              </div>
            </div>
          </div>

          {/* Cột 4: Bản đồ (Map) - Điểm nhấn cho màn hình 15.6 */}
          <div className="footer-column footer-map-column">
            <h4 className="footer-heading">VỊ TRÍ CHÚNG TÔI</h4>
            <div className="footer-map-wrap">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.103936603058!2d108.2435!3d16.0544!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTbCsDAzJzE1LjgiTiAxMDjCsDE0JzM2LjYiRQ!5e0!3m2!1svi!2s!4v1630000000000!5m2!1svi!2s" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy"
                title="Google Map"
              ></iframe>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Ocean Grill. All rights reserved. Designed for Premium Experience.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;