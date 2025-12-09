import React from 'react';

import '../styles/footer.css';

export default function Footer({ info }) {
  return (
    <footer aria-labelledby="footer-heading">
      <div className="footer-cols">
        <div className="footer-col" aria-label="contact">
          <h3 id="footer-heading" style={{ marginTop: 0 }}>{info?.name ?? 'Nhà hàng của chúng tôi'}</h3>
          <address style={{ marginTop: 8, fontStyle: 'normal' }}>{info?.address}</address>
          <div style={{ marginTop: 6 }}>{info?.phone}</div>
        </div>

        <div className="footer-col" aria-label="hours">
          <h4>Giờ mở cửa</h4>
          <div>Thứ Hai - Thứ Sáu: 09:00 - 22:00</div>
          <div>Thứ Bảy - Chủ Nhật: 08:00 - 23:00</div>
        </div>

        <div className="footer-col newsletter" aria-label="newsletter">
          <h4>Bản tin</h4>
          <p>Đăng ký để nhận tin tức và ưu đãi</p>
          <form onSubmit={(e) => { e.preventDefault(); /* noop - integrate API here */ }} aria-label="newsletter form">
            <div style={{ display: 'flex', gap: 8 }}>
              <input aria-label="email" type="email" placeholder="Nhập email của bạn" />
              <button className="btn" type="submit">Đăng ký</button>
            </div>
          </form>
        </div>
      </div>
      <div style={{ maxWidth: 'var(--container-width)', margin: '18px auto 0', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,0.65)' }}>
        <div>&copy; {new Date().getFullYear()} {info?.name ?? 'Nhà hàng của chúng tôi'}. All rights reserved.</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="/privacy" style={{ color: 'inherit' }}>Chính sách</a>
          <a href="/terms" style={{ color: 'inherit' }}>Điều khoản</a>
        </div>
      </div>
    </footer>
  );
}
