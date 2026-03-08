import React from 'react';
import { User } from 'lucide-react';
import '../../styles/WaiterPages.css';

const WaiterProfilePage = () => {
  return (
    <div className="waiter-orders-container">
      <header className="waiter-page-header">
        <div>
          <h2 className="waiter-page-title">Hồ sơ cá nhân</h2>
          <p className="waiter-page-subtitle">
            Quản lý thông tin cá nhân và cài đặt tài khoản
          </p>
        </div>
      </header>

      <div className="sidebar-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <User size={64} style={{ color: '#ff6d1f', margin: '0 auto 20px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '12px', color: '#23160f' }}>
            Hồ sơ cá nhân
          </h3>
          <p style={{ fontSize: '15px', color: '#7a6f66', marginBottom: '24px' }}>
            Tính năng hồ sơ cá nhân đang được phát triển
          </p>
        </div>
      </div>
    </div>
  );
};

export default WaiterProfilePage;
