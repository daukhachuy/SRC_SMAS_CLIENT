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
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [menuDishes, setMenuDishes] = useState([
    { id: 1, type: 'Menu', name: 'Cá điều hồng hấp', quantity: 1, price: 150000, notes: '', subtotal: 150000 },
    { id: 2, type: 'Combo', name: 'Combo FPT', quantity: 2, price: 150000, notes: 'Cho ít cay', subtotal: 300000 }
  ]);
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [newDishForm, setNewDishForm] = useState({
    type: 'Menu',
    name: '',
    quantity: 1,
    notes: '',
    price: 0
  });

  // Menu và Combo options
  const menuOptions = [
    { type: 'Menu', name: 'Cá điều hồng hấp', price: 150000 },
    { type: 'Menu', name: 'Tôm sú hấp', price: 180000 },
    { type: 'Menu', name: 'Mực nướng', price: 200000 },
    { type: 'Combo', name: 'Combo FPT', price: 150000 },
    { type: 'Combo', name: 'Combo VIP', price: 250000 },
    { type: 'Combo', name: 'Combo Family', price: 350000 }
  ];

  // Event Types
  const eventTypes = [
    { id: 1, name: 'Đám cưới' },
    { id: 2, name: 'Sinh nhật' },
    { id: 3, name: 'Hội họp công tác' },
    { id: 4, name: 'Tiệc tất niên' },
    { id: 5, name: 'Tiệc kỷ niệm' },
    { id: 6, name: 'Sự kiện khác' }
  ];

  // Service items for event
  const eventServices = [
    { 
      id: 1, 
      name: 'MC Tố Châu',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
      description: 'MC tổ chức có chuyên môn cao, dẫn dắt sự kiện chuyên nghiệp',
      price: 100000,
      category: 'mc',
      categoryLabel: 'Dẫn Dắt Sự Kiện'
    },
    { 
      id: 2, 
      name: 'MC Minh Hạ',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      description: 'MC nổi tiếng với phong cách dẫn dắt hài hước và cuốn hút',
      price: 100000,
      category: 'mc',
      categoryLabel: 'Dẫn Dắt Sự Kiện'
    },
    { 
      id: 3, 
      name: 'Backdrop Tiêu Chuẩn',
      image: 'https://images.unsplash.com/photo-1519671482677-76ce3692eb04?auto=format&fit=crop&q=80&w=200',
      description: 'Backdrop trang trí cơ bản với các mẫu tiêu chuẩn',
      price: 2000000,
      category: 'backdrop',
      categoryLabel: 'Trang Trí'
    },
    { 
      id: 4, 
      name: 'Backdrop VIP',
      image: 'https://images.unsplash.com/photo-1537904904737-13fc2b3560a1?auto=format&fit=crop&q=80&w=200',
      description: 'Backdrop cao cấp với thiết kế riêng, trang trí sang trọng',
      price: 5000000,
      category: 'backdrop',
      categoryLabel: 'Trang Trí'
    },
    { 
      id: 5, 
      name: 'Âm thanh & Âm nhạc',
      image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&q=80&w=200',
      description: 'Hệ thống âm thanh chuyên nghiệp, DJ live để làm nóng không khí',
      price: 3000000,
      category: 'sound',
      categoryLabel: 'Âm Thanh & Âm Nhạc'
    },
    { 
      id: 6, 
      name: 'Chụp Ảnh & Video',
      image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&q=80&w=200',
      description: 'Chụp ảnh và quay phim chuyên nghiệp suốt sự kiện',
      price: 2500000,
      category: 'photo',
      categoryLabel: 'Ghi Hình'
    },
    { 
      id: 7, 
      name: 'Lighting LED',
      image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?auto=format&fit=crop&q=80&w=200',
      description: 'Hệ thống đèn LED hiện đại tạo không khí sôi động',
      price: 2000000,
      category: 'lighting',
      categoryLabel: 'Trang Trí'
    },
    { 
      id: 8, 
      name: 'Hoa trang trí',
      image: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&q=80&w=200',
      description: 'Hoa tươi và trang trí hoa cao cấp cho sự kiện',
      price: 1500000,
      category: 'flower',
      categoryLabel: 'Trang Trí'
    }
  ];

  // Function to toggle service selection
  const toggleService = (serviceId) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Calculate total service cost
  const calculateServiceTotal = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = eventServices.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

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

              {/* STEP 2: SERVICES */}
              {eventStep === 2 && (
                <div className="event-form-step">
                  <button className="primary-gold-btn event-back-btn-top" onClick={() => setEventStep(1)} style={{marginBottom: '25px', alignSelf: 'flex-start'}}>
                    ← Quay lại
                  </button>
                  <div className="event-services-wrapper">
                    {/* Event Type Selector */}
                    <div className="services-section">
                      <label className="services-label">Sự kiện :</label>
                      <select 
                        className="event-type-dropdown"
                        value={selectedEvent}
                        onChange={(e) => setSelectedEvent(e.target.value)}
                      >
                        <option value="">Chọn loại sự kiện</option>
                        {eventTypes.map(event => (
                          <option key={event.id} value={event.name}>
                            {event.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Service Cards Grid - Grouped by Category */}
                    <div className="services-section-cards">
                      {(() => {
                        // Group services by category
                        const groupedServices = eventServices.reduce((acc, service) => {
                          if (!acc[service.category]) {
                            acc[service.category] = [];
                          }
                          acc[service.category].push(service);
                          return acc;
                        }, {});

                        const categoryOrder = ['mc', 'sound', 'photo', 'backdrop', 'lighting', 'flower'];
                        
                        return categoryOrder.map(category => 
                          groupedServices[category] ? (
                            <div key={category} className="service-category-group">
                              <h4 className="service-category-title">
                                {groupedServices[category][0].categoryLabel}
                              </h4>
                              <div className="services-grid-2col">
                                {groupedServices[category].map(service => (
                                  <div 
                                    key={service.id} 
                                    className={`service-card-horizontal ${selectedServices.includes(service.id) ? 'selected' : ''}`}
                                    onClick={() => toggleService(service.id)}
                                  >
                                    <div className="service-card-img-small">
                                      <img src={service.image} alt={service.name} />
                                    </div>
                                    <div className="service-card-text">
                                      <h5 className="service-card-title">{service.name}</h5>
                                      <p className="service-card-desc">{service.description}</p>
                                      <p className="service-card-price-small">{formatCurrency(service.price)}</p>
                                    </div>
                                    <button 
                                      className={`service-select-check ${selectedServices.includes(service.id) ? 'active' : ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleService(service.id);
                                      }}
                                    >
                                      ✓
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null
                        );
                      })()}
                    </div>

                    {/* Selected Services Summary */}
                    {selectedServices.length > 0 && (
                      <div className="selected-services-summary">
                        <h4 className="summary-title">📋 Dịch vụ đã chọn ({selectedServices.length})</h4>
                        <div className="selected-items-list">
                          {selectedServices.map(serviceId => {
                            const service = eventServices.find(s => s.id === serviceId);
                            return (
                              <div key={service.id} className="selected-item">
                                <span className="item-name">{service.name}</span>
                                <span className="item-price">{formatCurrency(service.price)}</span>
                                <button 
                                  className="item-remove-btn"
                                  onClick={() => toggleService(service.id)}
                                >
                                  ✕
                                </button>
                              </div>
                            );
                          })}
                        </div>
                        <div className="summary-total" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 15px', backgroundColor: 'linear-gradient(135deg, #fff0e6, #ffe8d6)', borderRadius: '10px', marginTop: '16px', borderTop: '2px solid #FFE8D6'}}>
                          <span style={{fontWeight: 700, fontSize: '15px', color: 'var(--deep-black)'}}>Tổng dịch vụ:</span>
                          <span style={{fontWeight: 700, fontSize: '16px', color: 'var(--primary-orange)'}}>{formatCurrency(calculateServiceTotal())}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '40px'}}>
                    <button className="primary-gold-btn event-next-btn" onClick={() => setEventStep(3)} style={{width: '100%', maxWidth: '400px'}}>
                      Tiếp Tục → Chọn Sự Kiện
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: MENU - Placeholder */}
              {eventStep === 3 && (
                <div className="event-form-step">
                  <button className="primary-gold-btn event-back-btn-top" onClick={() => setEventStep(2)} style={{marginBottom: '25px', alignSelf: 'flex-start'}}>
                    ← Quay lại
                  </button>

                  {/* Edit Menu Section */}
                  {isEditingMenu && (
                    <div className="edit-menu-section">
                      <h4 className="edit-menu-title">Thêm Món</h4>
                      <div className="add-dish-form">
                        <div className="form-row-edit">
                          <div className="form-group">
                            <label>Loại</label>
                            <select 
                              value={newDishForm.type}
                              onChange={(e) => setNewDishForm({...newDishForm, type: e.target.value})}
                              className="dropdown-dish-type"
                              title="Loại"
                            >
                              <option value="Menu">Menu</option>
                              <option value="Combo">Combo</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Tên Món</label>
                            <select 
                              value={newDishForm.name}
                              onChange={(e) => {
                                const selected = menuOptions.find(opt => opt.name === e.target.value && opt.type === newDishForm.type);
                                setNewDishForm({
                                  ...newDishForm, 
                                  name: e.target.value,
                                  price: selected?.price || 0
                                });
                              }}
                              className="dropdown-dish-name"
                              title="Tên Món"
                            >
                              <option value="">Chọn món</option>
                              {menuOptions.filter(opt => opt.type === newDishForm.type).map(opt => (
                                <option key={opt.name} value={opt.name}>{opt.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Ghi chú</label>
                            <input 
                              type="text" 
                              value={newDishForm.notes}
                              onChange={(e) => setNewDishForm({...newDishForm, notes: e.target.value})}
                              placeholder="Ghi chú..."
                              className="input-notes-edit"
                            />
                          </div>

                          <div className="form-group-qty">
                            <label>SL</label>
                            <div className="qty-control">
                              <button 
                                className="qty-btn minus"
                                onClick={() => setNewDishForm({...newDishForm, quantity: Math.max(1, newDishForm.quantity - 1)})}
                                title="Giảm"
                              >−</button>
                              <input 
                                type="number" 
                                min="1"
                                value={newDishForm.quantity}
                                onChange={(e) => setNewDishForm({...newDishForm, quantity: parseInt(e.target.value) || 1})}
                                className="input-qty"
                                placeholder="1"
                              />
                              <button 
                                className="qty-btn plus"
                                onClick={() => setNewDishForm({...newDishForm, quantity: newDishForm.quantity + 1})}
                                title="Tăng"
                              >+</button>
                            </div>
                          </div>

                          <div className="price-display">
                            <span className="price-label">Giá:</span>
                            <span className="price-value">{formatCurrency(newDishForm.price)}</span>
                          </div>

                          <button 
                            className="btn-save-dish"
                            onClick={() => {
                              if (newDishForm.name) {
                                const newDish = {
                                  id: Math.max(...menuDishes.map(d => d.id), 0) + 1,
                                  type: newDishForm.type,
                                  name: newDishForm.name,
                                  quantity: newDishForm.quantity,
                                  price: newDishForm.price,
                                  notes: newDishForm.notes,
                                  subtotal: newDishForm.quantity * newDishForm.price
                                };
                                setMenuDishes([...menuDishes, newDish]);
                                setNewDishForm({ type: 'Menu', name: '', quantity: 1, notes: '', price: 0 });
                              }
                            }}
                          >
                            Lưu
                          </button>

                          <button 
                            className="btn-delete-dish"
                            onClick={() => setIsEditingMenu(false)}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Menu Header */}
                  <div className="menu-header">
                    <h4 className="menu-title">Các món ăn trên mỗi bàn</h4>
                    <p className="menu-description">Nếu khách hàng không muốn đặt món trước xin bỏ qua</p>
                  </div>

                  {/* Menu Table */}
                  <div className="menu-table-container">
                    <table className="menu-table">
                      <thead>
                        <tr>
                          <th className="col-stt">STT</th>
                          <th className="col-loai">Loại</th>
                          <th className="col-tenmon">Tên Món</th>
                          <th className="col-soluong">Số Lượng</th>
                          <th className="col-gia">Giá</th>
                          <th className="col-ghichu">Ghi chú</th>
                          <th className="col-tong">Tổng</th>
                          <th className="col-action">Xóa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {menuDishes.map((dish, idx) => (
                          <tr key={dish.id} className="menu-row">
                            <td className="col-stt">{idx + 1}</td>
                            <td className="col-loai">{dish.type}</td>
                            <td className="col-tenmon">{dish.name}</td>
                            <td className="col-soluong">
                              <input 
                                type="number" 
                                min="1" 
                                value={dish.quantity}
                                onChange={(e) => {
                                  const newQty = parseInt(e.target.value) || 1;
                                  const newDishes = [...menuDishes];
                                  newDishes[idx].quantity = newQty;
                                  newDishes[idx].subtotal = newQty * newDishes[idx].price;
                                  setMenuDishes(newDishes);
                                }}
                                className="input-number"
                              />
                            </td>
                            <td className="col-gia">{formatCurrency(dish.price)}</td>
                            <td className="col-ghichu">
                              <input 
                                type="text" 
                                value={dish.notes}
                                onChange={(e) => {
                                  const newDishes = [...menuDishes];
                                  newDishes[idx].notes = e.target.value;
                                  setMenuDishes(newDishes);
                                }}
                                placeholder="Ghi chú..."
                                className="input-notes"
                              />
                            </td>
                            <td className="col-tong">{formatCurrency(dish.subtotal)}</td>
                            <td className="col-action">
                              <button 
                                className="btn-remove-row"
                                onClick={() => setMenuDishes(menuDishes.filter(d => d.id !== dish.id))}
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Menu Total */}
                  <div className="menu-footer">
                    <div className="menu-footer-left">
                      <div className="menu-total">
                        <span className="total-label">Tổng giá mỗi bàn :</span>
                        <span className="total-amount">{formatCurrency(menuDishes.reduce((sum, dish) => sum + dish.subtotal, 0))} đ</span>
                      </div>
                      <a href="#" onClick={(e) => { e.preventDefault(); setIsEditingMenu(!isEditingMenu); }} className="edit-menu-link">
                        {isEditingMenu ? 'Đóng' : 'Lấy món trong giỏ hàng'}
                      </a>
                    </div>
                    <button className="primary-gold-btn event-booking-btn" onClick={() => setIsEditingMenu(false)}>
                      Hoàn Thành Thực Đơn
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