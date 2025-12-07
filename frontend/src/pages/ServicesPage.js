import React from 'react';
import { Link } from 'react-router-dom';
import { FaWineGlassAlt, FaCrown, FaUtensils, FaConciergeBell, FaUserTie,FaClock } from 'react-icons/fa';
import '../styles/ServicesPage.css';

const ServicesPage = () => {
  const services = [
    {
      id: 1,
      icon: <FaWineGlassAlt className="service-icon" />,
      title: 'Tiệc Riêng Tư',
      description: 'Tổ chức tiệc riêng tư sang trọng với không gian riêng biệt, thực đơn đặc biệt và phục vụ tận tâm.'
    },
    {
      id: 2,
      icon: <FaCrown className="service-icon" />,
      title: 'Bàn VIP',
      description: 'Trải nghiệm ẩm thực đẳng cấp tại khu vực VIP với view đẹp và dịch vụ chuyên nghiệp.'
    },
    {
      id: 3,
      icon: <FaUtensils className="service-icon" />,
      title: 'Menu Mùa',
      description: 'Thưởng thức các món ăn đặc sản theo mùa, được chế biến từ nguyên liệu tươi ngon nhất.'
    },
    {
      id: 4,
      icon: <FaConciergeBell className="service-icon" />,
      title: 'Phục Vụ Tận Bàn',
      description: 'Đội ngũ phục vụ chuyên nghiệp, tận tâm, mang đến trải nghiệm ẩm thực hoàn hảo.'
    },
    {
      id: 5,
      icon: <FaUserTie className="service-icon" />,
      title: 'Tư Vấn Ẩm Thực',
      description: 'Đầu bếp chuyên nghiệp tư vấn thực đơn phù hợp với sở thích và yêu cầu đặc biệt của bạn.'
    }, 
    {
      id: 6,
      icon: <FaClock className="service-icon" />,
      title: 'Hỗ trợ khách hàng 24/7',
      description: 'Luôn sẵn sàng giải đáp thắc mắc và hỗ trợ khách hàng mọi lúc, mọi nơi.'
    }
    
  ];

  return (
    <div className="services-page">
      {/* Hero Section */}
      <div className="services-hero">
        <div className="hero-content">
          <h1>Dịch Vụ Cao Cấp</h1>
          <p>Trải nghiệm ẩm thực đỉnh cao với những dịch vụ đặc biệt dành riêng cho quý khách</p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="services-container">
        <div className="section-header">
          <span className="section-subtitle"></span>
          <h2 className="section-title">Trải Nghiệm Đẳng Cấp</h2>
          <div className="divider"></div>
        </div>

        <div className="services-grid">
          {services.map((service) => (
            <div key={service.id} className="service-card">
              <div className="service-icon-wrapper">
                {service.icon}
              </div>
              <div className="service-content">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <Link to="/contact" className="service-button">Đặt Ngay</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="cta-content">
          <h2>Đặt Bàn Ngay Hôm Nay</h2>
          <p>Để trải nghiệm dịch vụ đẳng cấp 5 sao</p>
          <Link to="/reservation" className="cta-button">Đặt Bàn</Link>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;