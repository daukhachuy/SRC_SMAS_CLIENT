import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { FaUser, FaPhone, FaCalendarAlt, FaClock, FaUserFriends, FaMapMarkerAlt, FaUtensils, FaCheckCircle, FaChair, FaWineGlassAlt, FaRegSmileBeam } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Header from '../components/layout/Header';
import Footer from '../components/Footer';
import '../styles/ReservationPage.css';

const ReservationPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '19:00',
    guests: 2,
    tableType: 'indoor',
    specialRequest: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [reservationId, setReservationId] = useState('');

  const availableTimes = [
    '11:00', '11:30', '12:00', '12:30', '13:00', 
    '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  const tableTypes = [
    { id: 'indoor', name: 'Trong nhà', icon: <FaUtensils />, description: 'Không gian sang trọng, điều hòa mát lạnh' },
    { id: 'outdoor', name: 'Ngoài trời', icon: <FaRegSmileBeam />, description: 'View đẹp, không gian thoáng đãng' },
    { id: 'vip', name: 'Phòng VIP', icon: <FaWineGlassAlt />, description: 'Riêng tư, đẳng cấp' },
    { id: 'family', name: 'Gia đình', icon: <FaUserFriends />, description: 'Rộng rãi, tiện nghi' }
  ];

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (!formData.date) {
      setFormData(prev => ({ ...prev, date: today }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'guests' ? parseInt(value) : value
    }));
  };

  const handleTableTypeSelect = (type) => {
    setFormData(prev => ({ ...prev, tableType: type }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeStep < 2) {
      setActiveStep(prev => prev + 1);
      return;
    }
    
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const newReservationId = 'RSV-' + Date.now().toString(36).toUpperCase();
      setReservationId(newReservationId);
      
      const reservationData = {
        id: newReservationId,
        ...formData,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      const existingReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
      localStorage.setItem('reservations', JSON.stringify([...existingReservations, reservationData]));
      
      setIsSuccess(true);
      setActiveStep(3);
    } catch (error) {
      console.error('Lỗi khi đặt bàn:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (activeStep === 1 && (!formData.name || !formData.email || !formData.phone)) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    setActiveStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setActiveStep(prev => Math.max(prev - 1, 1));
  };

  const renderStep1 = () => (
    <div className="reservation-step">
      <h3>Thông tin cá nhân</h3>
      <div className="form-group">
        <label>Họ và tên <span className="required">*</span></label>
        <div className="input-group">
          <span className="input-icon"><FaUser /></span>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nhập họ và tên"
            required
          />
        </div>
      </div>
      
      <div className="form-row">
        <div className="form-group">
          <label>Email <span className="required">*</span></label>
          <div className="input-group">
            <span className="input-icon">@</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Số điện thoại <span className="required">*</span></label>
          <div className="input-group">
            <span className="input-icon"><FaPhone /></span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Nhập số điện thoại"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="reservation-step">
      <h3>Chi tiết đặt bàn</h3>
      
      <div className="form-row">
        <div className="form-group">
          <label>Ngày <span className="required">*</span></label>
          <div className="input-group">
            <span className="input-icon"><FaCalendarAlt /></span>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Giờ <span className="required">*</span></label>
          <div className="input-group">
            <span className="input-icon"><FaClock /></span>
            <select
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            >
              {availableTimes.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="form-group">
        <label>Số lượng khách <span className="required">*</span></label>
        <div className="guests-selector">
          <button 
            type="button" 
            className="guest-btn"
            onClick={() => setFormData(prev => ({
              ...prev,
              guests: Math.max(1, prev.guests - 1)
            }))}
          >
            -
          </button>
          <span className="guest-count">{formData.guests} người</span>
          <button 
            type="button" 
            className="guest-btn"
            onClick={() => setFormData(prev => ({
              ...prev,
              guests: Math.min(20, prev.guests + 1)
            }))}
          >
            +
          </button>
        </div>
      </div>
      
      <div className="form-group">
        <label>Loại bàn <span className="required">*</span></label>
        <div className="table-type-grid">
          {tableTypes.map(type => (
            <div 
              key={type.id}
              className={`table-type-option ${formData.tableType === type.id ? 'active' : ''}`}
              onClick={() => handleTableTypeSelect(type.id)}
            >
              <div className="table-type-icon">{type.icon}</div>
              <div className="table-type-info">
                <span className="table-type-name">{type.name}</span>
                <span className="table-type-desc">{type.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="form-group">
        <label>Yêu cầu đặc biệt</label>
        <textarea
          name="specialRequest"
          value={formData.specialRequest}
          onChange={handleChange}
          placeholder="Ví dụ: Chỗ ngồi gần cửa sổ, kỷ niệm sinh nhật..."
          rows="3"
        />
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="reservation-success">
      <motion.div 
        className="success-icon-container"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <FaCheckCircle className="success-icon" />
      </motion.div>
      <h2>Đặt bàn thành công!</h2>
      <p className="success-message">
        Cảm ơn bạn đã đặt bàn tại nhà hàng chúng tôi.
      </p>
      
      <div className="reservation-details">
        <h4>Thông tin đặt bàn</h4>
        <div className="detail-row">
          <span className="detail-label">Mã đặt bàn:</span>
          <span className="detail-value">{reservationId}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Họ tên:</span>
          <span className="detail-value">{formData.name}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Thời gian:</span>
          <span className="detail-value">
            {new Date(formData.date).toLocaleDateString('vi-VN')} lúc {formData.time}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Số khách:</span>
          <span className="detail-value">{formData.guests} người</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Loại bàn:</span>
          <span className="detail-value">
            {tableTypes.find(t => t.id === formData.tableType)?.name}
          </span>
        </div>
      </div>
      
      <div className="success-actions">
        <button 
          className="btn btn-secondary"
          onClick={() => {
            setActiveStep(1);
            setIsSuccess(false);
            setFormData({
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              date: new Date().toISOString().split('T')[0],
              time: '19:00',
              guests: 2,
              tableType: 'indoor',
              specialRequest: ''
            });
          }}
        >
          Đặt bàn mới
        </button>
        <button className="btn btn-primary">Xem chi tiết</button>
      </div>
    </div>
  );

  return (
    <div className="reservation-page">
      <Helmet>
        <title>Đặt bàn | Nhà hàng 5 sao</title>
        <meta name="description" content="Đặt bàn tại nhà hàng 5 sao của chúng tôi. Trải nghiệm ẩm thực đẳng cấp với không gian sang trọng và phục vụ tận tâm." />
      </Helmet>
      
      
      <main className="reservation-container">
        <div className="reservation-header">
          <h1>Đặt bàn</h1>
          <p>Điền thông tin bên dưới để đặt bàn tại nhà hàng chúng tôi</p>
        </div>
        
        <div className="reservation-progress">
          <div className={`progress-step ${activeStep >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Thông tin</div>
          </div>
          <div className={`progress-connector ${activeStep >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${activeStep >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Chi tiết</div>
          </div>
          <div className={`progress-connector ${activeStep >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${activeStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Hoàn tất</div>
          </div>
        </div>
        
        <div className="reservation-card">
          {!isSuccess ? (
            <form onSubmit={handleSubmit}>
              {activeStep === 1 && renderStep1()}
              {activeStep === 2 && renderStep2()}
              
              <div className="form-actions">
                {activeStep > 1 && (
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={prevStep}
                    disabled={isSubmitting}
                  >
                    Quay lại
                  </button>
                )}
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={nextStep}
                  disabled={isSubmitting}
                >
                  {activeStep < 2 ? 'Tiếp tục' : 'Xác nhận đặt bàn'}
                </button>
              </div>
            </form>
          ) : (
            renderSuccessStep()
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ReservationPage;