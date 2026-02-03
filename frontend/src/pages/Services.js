import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Services.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Services = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [serviceCarouselIndex, setServiceCarouselIndex] = useState(0);
  const [addOnCarouselIndex, setAddOnCarouselIndex] = useState(0);
  const [bookingTab, setBookingTab] = useState('booking'); // 'booking' or 'event'
  const [eventStep, setEventStep] = useState(1); // 1: Info, 2: Services, 3: Menu
  const [eventForm, setEventForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    numTables: '',
    numGuests: '',
    location: '',
    note: ''
  });

  // FAQ Data
  const faqItems = [
    {
      id: 1,
      question: 'Nhà hàng có dịch vụ ăn uống tại nhà hay không?',
      answer: 'Có, chúng tôi cung cấp dịch vụ catering trọn gói cho các buổi tiệc, sự kiện tại nhà với menu đa dạng và chất lượng cao.'
    },
    {
      id: 2,
      question: 'Nhà hàng có dịch vụ ăn uống tại nhà hay không?',
      answer: 'Có, chúng tôi cung cấp dịch vụ catering trọn gói cho các buổi tiệc, sự kiện tại nhà với menu đa dạng và chất lượng cao.'
    },
    {
      id: 3,
      question: 'Nhà hàng có dịch vụ ăn uống tại nhà hay không?',
      answer: 'Có, chúng tôi cung cấp dịch vụ catering trọn gói cho các buổi tiệc, sự kiện tại nhà với menu đa dạng và chất lượng cao.'
    },
    {
      id: 4,
      question: 'Nhà hàng có dịch vụ ăn uống tại nhà hay không?',
      answer: 'Có, chúng tôi cung cấp dịch vụ catering trọn gói cho các buổi tiệc, sự kiện tại nhà với menu đa dạng và chất lượng cao.'
    },
    {
      id: 5,
      question: 'Nhà hàng có dịch vụ ăn uống tại nhà hay không?',
      answer: 'Có, chúng tôi cung cấp dịch vụ catering trọn gói cho các buổi tiệc, sự kiện tại nhà với menu đa dạng và chất lượng cao.'
    },
    {
      id: 6,
      question: 'Nhà hàng có dịch vụ ăn uống tại nhà hay không?',
      answer: 'Có, chúng tôi cung cấp dịch vụ catering trọn gói cho các buổi tiệc, sự kiện tại nhà với menu đa dạng và chất lượng cao.'
    }
  ];

  // Service Items for Carousel
  const serviceItems = [
    { id: 1, name: 'Tiệc sinh nhật', image: 'https://images.unsplash.com/photo-1551632786-de41ec6a05ae?auto=format&fit=crop&q=80&w=400', desc: 'Lợi chủ tự ăn tại chỗ' },
    { id: 2, name: 'Tiệc sinh nhật', image: 'https://images.unsplash.com/photo-1504674900861-b72b27e84530?auto=format&fit=crop&q=80&w=400', desc: 'Nơi lành lẽ, không khí sạch sẽ' },
    { id: 3, name: 'Tiệc sinh nhật', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=400', desc: 'Lợi chủ tự ăn tại chỗ' },
    { id: 4, name: 'Tiệc sinh nhật', image: 'https://images.unsplash.com/photo-1552566239-4a8c54ef0eaa?auto=format&fit=crop&q=80&w=400', desc: 'Lợi chủ tự ăn tại chỗ' }
  ];

  // Add-on Services
  const addOnServices = [
    { 
      id: 1, 
      name: 'Bánh Sinh Nhật', 
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400', 
      description: 'Cá mú được tẩm bột tỏi hành và chiên trong ngập đầu ăn sẽ tạo cảm giác như ở trên mây',
      price: '250.000 vnđ' 
    },
    { 
      id: 2, 
      name: 'MC', 
      image: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?auto=format&fit=crop&q=80&w=400', 
      description: 'Cá mú được tẩm bột tỏi hành và chiên trong ngập đầu ăn sẽ tạo cảm giác như ở trên mây',
      price: '250.000 vnđ' 
    },
    { 
      id: 3, 
      name: 'Cá mú đủ', 
      image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=400', 
      description: 'Cá mú được tẩm bột tỏi hành và chiên trong ngập đầu ăn sẽ tạo cảm giác như ở trên mây',
      price: '250.000 vnđ' 
    }
  ];

  // Online delivery options
  const deliveryOptions = [
    { id: 1, title: 'Giao nhanh', subtitle: '30 phút', image: '/images/ShipFast.png' },
    { id: 2, title: 'Tươi ngon', subtitle: 'đảm bảo', image: '/images/Food.png' },
    { id: 3, title: 'Thanh toán', subtitle: 'tiện lợi', image: '/images/Pay.png' }
  ];

  return (
    <div className="services-page-wrapper">
      <Header />

      <section className="services-hero-banner">
        <div className="hero-content">
          <span className="hero-tag">DỊCH VỤ ĐẲNG CẤP</span>
          <h1>TINH HOA ẨM THỰC - PHỤC VỤ ĐẲNG CẤP</h1>
          <p className="hero-desc">Nơi hội tụ những bữa tiệc đáng nhớ</p>
        </div>
      </section>

      <div className="services-main-content">
        
        {/* SECTION 1: ĐẶT BÀN & ĐẶT SỰ KIỆN */}
        <section className="service-card-section">
          <h2 className="service-title-gold">ĐẶT BÀN TRẢI NGHIỆM TẠI CHỖ</h2>
          
          {/* TABS */}
          <div className="booking-tabs">
            <button 
              className={`tab-button ${bookingTab === 'booking' ? 'active' : ''}`}
              onClick={() => setBookingTab('booking')}
            >
              Đặt Bàn
            </button>
            <button 
              className={`tab-button ${bookingTab === 'event' ? 'active' : ''}`}
              onClick={() => setBookingTab('event')}
            >
              Đặt Sự Kiện
            </button>
          </div>

          {/* BOOKING FORM */}
          {bookingTab === 'booking' && (
            <div className="glass-card booking-container">
              <div className="booking-left">
                <div className="calendar-ui">
                  <div className="calendar-month">
                    <span style={{ textTransform: 'capitalize' }}>Tháng 12 2025</span>
                  </div>
                  <div className="calendar-weekdays">
                    <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
                  </div>
                  <div className="calendar-numbers">
                    {[9, 10, 11, 12, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((day, idx) => (
                      <span key={idx} className={`${day === 5 || day === 6 ? 'day-highlighted' : ''} ${idx === 3 ? 'day-active' : ''}`}>
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="time-grid">
                  {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'].map((t, idx) => (
                    idx < 10 && <button key={t} className="time-slot-btn">{t}</button>
                  ))}
                </div>
              </div>
              <div className="vertical-divider"></div>
              <div className="booking-right">
                <div className="input-group-row">
                  <label>Họ và tên:</label>
                  <input type="text" placeholder="" />
                </div>
                <div className="input-group-row">
                  <label>Số điện thoại:</label>
                  <input type="text" placeholder="" />
                </div>
                <div className="input-group-row">
                  <label>Email :</label>
                  <input type="text" placeholder="" />
                </div>
                <div className="input-group-row">
                  <label>Số lượng khách:</label>
                  <input type="number" defaultValue="1" placeholder="" />
                </div>
                <div className="input-group-row">
                  <label>Khu vực:</label>
                  <select>
                    <option>Trong nhà (Máy lạnh)</option>
                    <option>Ngoài trời (Sân vườn)</option>
                  </select>
                </div>
                <div className="input-group-row">
                  <label>Ghi chú:</label>
                  <textarea placeholder="Yêu cầu đặc biệt, ghi chú sự kiên..."></textarea>
                </div>
                <button className="primary-gold-btn">ĐẶT BÀN NGAY</button>
              </div>
            </div>
          )}

          {/* EVENT FORM - Placeholder for now */}
          {bookingTab === 'event' && (
            <div className="glass-card event-booking-container">
              <div className="event-header">
                <h3 className="event-title">Đặt lịch Sự Kiện</h3>
                <p className="event-subtitle">Sự kiện dành cho 30 người trở lên bắt buộc phải ký hợp đồng</p>
              </div>

              {/* PROGRESS STEPS */}
              <div className="event-progress-steps">
                <div className={`progress-step ${eventStep >= 1 ? 'active' : ''}`}>
                  <div className="step-circle">
                    <span>✓</span>
                  </div>
                  <p className="step-label">Thông Tin</p>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${eventStep >= 2 ? 'active' : ''}`}>
                  <div className="step-circle">
                    <span>✓</span>
                  </div>
                  <p className="step-label">Sự kiện & Dịch vụ</p>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${eventStep >= 3 ? 'active' : ''}`}>
                  <div className="step-circle">
                    <span>✓</span>
                  </div>
                  <p className="step-label">Lên thực đơn</p>
                </div>
              </div>

              {/* STEP 1: INFO */}
              {eventStep === 1 && (
                <div className="event-form-step">
                  <div className="form-row-two-col">
                    <div className="form-col">
                      <label>Họ và tên:</label>
                      <input 
                        type="text" 
                        value={eventForm.fullName}
                        onChange={(e) => setEventForm({...eventForm, fullName: e.target.value})}
                      />
                    </div>
                    <div className="form-col">
                      <label>Số điện thoại:</label>
                      <input 
                        type="text" 
                        value={eventForm.phone}
                        onChange={(e) => setEventForm({...eventForm, phone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-row-two-col">
                    <div className="form-col">
                      <label>Email :</label>
                      <input 
                        type="email" 
                        value={eventForm.email}
                        onChange={(e) => setEventForm({...eventForm, email: e.target.value})}
                      />
                    </div>
                    <div className="form-col">
                      <label>Số lượng khách:</label>
                      <input 
                        type="number" 
                        value={eventForm.numGuests}
                        onChange={(e) => setEventForm({...eventForm, numGuests: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-row-two-col">
                    <div className="form-col">
                      <label>Số Lượng bàn:</label>
                      <input 
                        type="number" 
                        value={eventForm.numTables}
                        onChange={(e) => setEventForm({...eventForm, numTables: e.target.value})}
                      />
                    </div>
                    <div className="form-col">
                      <label>Khu vực:</label>
                      <select 
                        value={eventForm.location}
                        onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                      >
                        <option>Trong nhà (Máy lạnh)</option>
                        <option>Ngoài trời (Sân vườn)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row-full">
                    <label>Ghi chú:</label>
                    <textarea 
                      rows="5"
                      value={eventForm.note}
                      onChange={(e) => setEventForm({...eventForm, note: e.target.value})}
                      placeholder="Ghi chú thêm về sự kiện..."
                    ></textarea>
                  </div>

                  <button className="primary-gold-btn event-next-btn" onClick={() => setEventStep(2)}>
                    Tiếp Tục → Chọn Sự Kiện
                  </button>
                </div>
              )}

              {/* STEP 2: SERVICES - Placeholder */}
              {eventStep === 2 && (
                <div className="event-form-step">
                  <p style={{textAlign: 'center', color: '#999', padding: '40px'}}>
                    Bước 2: Chọn dịch vụ sẽ được cập nhật...
                  </p>
                  <div style={{display: 'flex', gap: '20px', justifyContent: 'center'}}>
                    <button className="primary-gold-btn event-back-btn" onClick={() => setEventStep(1)} style={{width: '150px'}}>
                      ← Quay lại
                    </button>
                    <button className="primary-gold-btn event-next-btn" onClick={() => setEventStep(3)} style={{width: '200px'}}>
                      Tiếp Tục → Lên Thực Đơn
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: MENU - Placeholder */}
              {eventStep === 3 && (
                <div className="event-form-step">
                  <p style={{textAlign: 'center', color: '#999', padding: '40px'}}>
                    Bước 3: Lên thực đơn sẽ được cập nhật...
                  </p>
                  <div style={{display: 'flex', gap: '20px', justifyContent: 'center'}}>
                    <button className="primary-gold-btn event-back-btn" onClick={() => setEventStep(2)} style={{width: '150px'}}>
                      ← Quay lại
                    </button>
                    <button className="primary-gold-btn" style={{width: '200px'}}>
                      Xác Nhận Đặt Sự Kiện
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* SECTION 2: FAQ */}
        <section className="service-card-section">
          <h2 className="service-title-gold">NHỮNG CÂU HỎI PHỔ BIẾN NHẤT</h2>
          <div className="faq-grid">
            {faqItems.map((item, idx) => (
              <div key={item.id} className="faq-item">
                <div className="faq-icon">?</div>
                <p className="faq-question">{item.question}</p>
                <p className="faq-answer">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: SERVICE CAROUSEL */}
        <section className="service-card-section">
          <h2 className="service-title-gold">ĐẦY ĐỦ CÁC SỰ KIỆN</h2>
          <div className="carousel-container">
            <button className="carousel-nav prev" onClick={() => setServiceCarouselIndex(Math.max(0, serviceCarouselIndex - 1))}>
              <ChevronLeft size={24} />
            </button>
            <div className="carousel-content">
              {serviceItems.slice(serviceCarouselIndex, serviceCarouselIndex + 4).map(item => (
                <div key={item.id} className="carousel-item">
                  <img src={item.image} alt={item.name} />
                  <h4>{item.name}</h4>
                  <p className="carousel-item-desc">{item.desc}</p>
                </div>
              ))}
            </div>
            <button className="carousel-nav next" onClick={() => setServiceCarouselIndex(Math.min(serviceItems.length - 4, serviceCarouselIndex + 1))}>
              <ChevronRight size={24} />
            </button>
          </div>
        </section>

        {/* SECTION 4: ADD-ON SERVICES */}
        <section className="service-card-section">
          <h2 className="service-title-gold">DỊCH VỤ KÈM THEO</h2>
          <div className="addon-carousel-container">
            <button className="addon-carousel-nav prev" onClick={() => setAddOnCarouselIndex(Math.max(0, addOnCarouselIndex - 1))}>
              <ChevronLeft size={32} />
            </button>
            <div className="addon-carousel-content">
              {addOnServices.slice(addOnCarouselIndex, addOnCarouselIndex + 3).map(item => (
                <div key={item.id} className="addon-item-card">
                  <div className="addon-item-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="addon-item-info">
                    <h4 className="addon-item-name">{item.name}</h4>
                    <p className="addon-item-description">{item.description}</p>
                    <p className="addon-item-price">{item.price}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="addon-carousel-nav next" onClick={() => setAddOnCarouselIndex(Math.min(addOnServices.length - 3, addOnCarouselIndex + 1))}>
              <ChevronRight size={32} />
            </button>
          </div>
        </section>

        {/* SECTION 5: ONLINE DELIVERY */}
        <section className="service-card-section">
          <h2 className="service-title-gold">ĐẶT HÀNG TRỰC TUYẾN</h2>
          <div className="delivery-container">
            {deliveryOptions.map(option => (
              <div key={option.id} className="delivery-item">
                <div className="delivery-icon">
                  <img src={option.image} alt={option.title} />
                </div>
                <h4>{option.title}</h4>
                <p>{option.subtitle}</p>
              </div>
            ))}
          </div>
          <button className="primary-gold-btn large-btn">ĐẶT HÀNG NGAY</button>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Services;