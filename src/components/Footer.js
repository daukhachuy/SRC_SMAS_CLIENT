import React from 'react';
import { Facebook, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: 'white', padding: '50px 60px', borderTop: '1px solid #eee', marginTop: '50px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
        <div>
          <h4 style={{ fontWeight: 'bold' }}>VỀ CHÚNG TÔI</h4>
          <p><Facebook size={14}/> facebook.com/nhahang</p>
          <p><Phone size={14}/> 0123456789</p>
        </div>
        <div>
          <h4 style={{ fontWeight: 'bold' }}>CÁC DỊCH VỤ</h4>
          <p>• Đặt bàn trực tuyến</p>
          <p>• Giao hàng tận nơi</p>
        </div>
        <div>
          <input placeholder="Chat với cửa hàng" style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ddd', width: '70%' }} />
          <button style={{ backgroundColor: '#FF7A21', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', marginLeft: '5px' }}>Gửi</button>
        </div>
      </div>
    </footer>
  );
};

// DÒNG QUAN TRỌNG NHẤT: Phải có dòng này ở cuối file
export default Footer;