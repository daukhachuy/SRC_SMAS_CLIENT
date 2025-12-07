import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUser } from 'react-icons/fa';
import './Header.css';

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="logo">
          <Link to="/">TÊN NHÀ HÀNG</Link>
        </div>

        <nav className="main-nav">
          <ul>
            <li><Link to="/">Trang chủ</Link></li>
            <li><Link to="/menu">Thực đơn</Link></li>
            <li><Link to="/services">Dịch Vụ </Link></li>
            <li><Link to="/about">Về chúng tôi</Link></li>
          </ul>
        </nav>

        <div className="auth-buttons">
          <Link to="/login" className="login-button">
            <FaUser className="icon" />
            <span>Đăng Nhập</span>
          </Link>
        </div>

        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </div>

        <div className={`mobile-menu ${menuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Trang chủ</Link>
          <Link to="/menu" onClick={() => setMenuOpen(false)}>Thực đơn</Link>
          <Link to="/services" onClick={() => setMenuOpen(false)}>Dịch vụ</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}>Về chúng tôi</Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
