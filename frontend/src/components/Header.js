import React from 'react';
import { Bell, ShoppingBag, User } from 'lucide-react';

const Header = ({ navigate }) => {
  const primaryOrange = '#FF9F43'; // Màu cam nhạt sang trọng

  return (
    <nav className="navbar" style={{
      height: '85px',            // Chiều cao cố định thanh header
      backgroundColor: '#000',
      display: 'flex',
      alignItems: 'center',      // CĂN GIỮA THEO CHIỀU DỌC (Quan trọng nhất)
      justifyContent: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      borderBottom: '1px solid #1A1A1A',
      width: '100%'
    }}>
      <div className="nav-container" style={{
        width: '94%',
        maxWidth: '1750px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',    // Căn giữa các nhóm Logo, Menu, Icons
        height: '100%'
      }}>
        
        {/* NHÓM LOGO - Đã sửa lỗi sát đỉnh */}
        <div className="logo-group" 
             onClick={() => navigate('/')} 
             style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
          
          <img src="/images/LOGO.png" alt="Logo" style={{
            height: '52px',
            width: '52px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: `2px solid #222`
          }} />

          {/* Wrapper cho text để không bị lệch hàng */}
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
            <span style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: '500', letterSpacing: '2px' }}>
              NHÀ HÀNG
            </span>
            <span style={{ color: primaryOrange, fontSize: '22px', fontWeight: '900', marginTop: '-2px' }}>
              LẨU NƯỚNG
            </span>
          </div>
        </div>

        {/* MENU CHÍNH */}
        <div className="nav-links" style={{ display: 'flex', gap: '40px' }}>
          {['THỰC ĐƠN', 'KHUYẾN MÃI', 'DỊCH VỤ', 'VỀ CHÚNG TÔI'].map(item => (
            <span key={item} style={{
              color: '#fff',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              letterSpacing: '0.5px'
            }}>{item}</span>
          ))}
        </div>

        {/* CỤM ICON BÊN PHẢI */}
        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Bell size={22} color="#fff" />
            <span style={{
              position: 'absolute', top: '-5px', right: '-5px',
              backgroundColor: '#FF4D4F', color: '#fff',
              fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold'
            }}>5</span>
          </div>
          
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <ShoppingBag size={22} color="#fff" />
            <span style={{
              position: 'absolute', top: '-5px', right: '-5px',
              backgroundColor: primaryOrange, color: '#000',
              fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold'
            }}>3</span>
          </div>

          {/* Avatar User */}
          <div onClick={() => navigate('/auth')} style={{
            width: '42px', height: '42px', borderRadius: '50%',
            backgroundColor: primaryOrange, display: 'flex',
            justifyContent: 'center', alignItems: 'center', cursor: 'pointer'
          }}>
            <User size={20} color="#000" />
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Header;