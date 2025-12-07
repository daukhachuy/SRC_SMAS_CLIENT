import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowDown, FiCalendar, FiClock } from 'react-icons/fi';
import '../styles/hero.css';

export default function HeroBanner({ title, subtitle, image, onReserve }) {
  const scrollToReservation = () => {
    const reservationSection = document.getElementById('reservation');
    if (reservationSection) {
      reservationSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero" style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${image})` }}>
      <div className="hero-content">
        <span className="hero-subtitle">Chào mừng đến với</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
        
        <div className="hero-buttons">
          <button 
            onClick={onReserve} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FiCalendar size={18} />
            Đặt bàn ngay
          </button>
          <Link 
            to="/menu" 
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FiClock size={18} />
            Xem thực đơn
          </Link>
        </div>

        <div className="hero-info mt-4" style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '3rem' }}>
          <div className="info-item" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>15+</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Năm kinh nghiệm</div>
          </div>
          <div className="info-item" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>50+</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Đầu bếp chuyên nghiệp</div>
          </div>
          <div className="info-item" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>100+</div>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Món ăn đặc sắc</div>
          </div>
        </div>
      </div>

      <div className="hero-scroll" onClick={scrollToReservation}>
        <FiArrowDown />
      </div>
    </section>
  );
}
