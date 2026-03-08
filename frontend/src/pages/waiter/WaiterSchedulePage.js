import React from 'react';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import '../../styles/WaiterPages.css';

const WaiterSchedulePage = () => {
  return (
    <div className="waiter-orders-container">
      <header className="waiter-page-header">
        <div>
          <h2 className="waiter-page-title">Lịch làm việc</h2>
          <p className="waiter-page-subtitle">
            Xem và quản lý lịch làm việc của bạn
          </p>
        </div>
      </header>

      <div className="sidebar-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <CalendarIcon size={64} style={{ color: '#ff6d1f', margin: '0 auto 20px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#23160f' }}>
            Lịch làm việc
          </h3>
          <p style={{ fontSize: '15px', color: '#7a6f66', marginBottom: '24px' }}>
            Tính năng lịch làm việc đang được phát triển
          </p>
        </div>
      </div>
    </div>
  );
};

export default WaiterSchedulePage;
