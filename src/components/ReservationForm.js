import React, { useState, useEffect } from 'react';
import { FaUser, FaPhone, FaCalendarAlt, FaClock, FaUserFriends, FaUtensils, FaCheckCircle } from 'react-icons/fa';
import '../styles/reservation.css';

export default function ReservationForm() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '19:00',
    guests: 2,
    specialRequest: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([
    '11:00', '11:30', '12:00', '12:30', '13:00', '17:30', 
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ]);

  useEffect(() => {
    // Set minimum date to today
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Simple validation
    if (!formData.name || !formData.phone || !formData.date || !formData.time) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const payload = { 
        id: Date.now().toString(36), 
        ...formData, 
        createdAt: new Date().toISOString(),
        status: 'confirmed'
      };
      
      // Save to localStorage
      const raw = localStorage.getItem('reservations');
      const arr = raw ? JSON.parse(raw) : [];
      arr.push(payload);
      localStorage.setItem('reservations', JSON.stringify(arr));
      
      setIsSuccess(true);
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          name: '',
          phone: '',
          date: new Date().toISOString().split('T')[0],
          time: '19:00',
          guests: 2,
          specialRequest: ''
        });
        setIsSuccess(false);
      }, 5000);
    } catch (err) {
      setError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      console.error('Error submitting reservation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate time options
  const timeOptions = availableTimes.map(time => (
    <option key={time} value={time}>
      {time}
    </option>
  ));

  if (isSuccess) {
    return (
      <section id="reservation" className="section reservation-section">
        <div className="container">
          <div className="reservation-success">
            <FaCheckCircle className="success-icon" />
            <h2>Đặt bàn thành công!</h2>
            <p>Cảm ơn bạn đã đặt bàn tại nhà hàng chúng tôi.</p>
            <p>Mã đặt bàn của bạn là: <strong>{Date.now().toString(36).toUpperCase()}</strong></p>
            <p>Chúng tôi sẽ liên hệ với bạn để xác nhận đơn đặt bàn trong thời gian sớm nhất.</p>
            <button 
              className="btn mt-3"
              onClick={() => setIsSuccess(false)}
            >
              Đặt bàn mới
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="reservation" className="section reservation-section">
      <div className="container">
        <div className="reservation-container">
          <div className="reservation-info">
            <h2 className="section-title">Đặt bàn trực tuyến</h2>
            <p className="reservation-subtitle">
              Điền thông tin đặt bàn của bạn và chúng tôi sẽ liên hệ để xác nhận trong thời gian sớm nhất.
            </p>
            
            <div className="reservation-features">
              <div className="feature-item">
                <div className="feature-icon">
                  <FaUtensils />
                </div>
                <div>
                  <h4>Đặt bàn nhanh chóng</h4>
                  <p>Chỉ mất 1 phút để hoàn tất</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <FaUserFriends />
                </div>
                <div>
                  <h4>Ưu đãi đặc biệt</h4>
                  <p>Giảm 10% cho khách đặt bàn trước</p>
                </div>
              </div>
            </div>
          </div>

          <div className="reservation-form-container">
            <form onSubmit={handleSubmit} className="reservation-form">
              {error && <div className="alert alert-danger">{error}</div>}
              
              <div className="form-group">
                <label htmlFor="name">Họ và tên <span className="required">*</span></label>
                <div className="input-group">
                  <span className="input-icon"><FaUser /></span>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone">Số điện thoại <span className="required">*</span></label>
                <div className="input-group">
                  <span className="input-icon"><FaPhone /></span>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Ngày <span className="required">*</span></label>
                  <div className="input-group">
                    <span className="input-icon"><FaCalendarAlt /></span>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="time">Giờ <span className="required">*</span></label>
                  <div className="input-group">
                    <span className="input-icon"><FaClock /></span>
                    <select
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                    >
                      {timeOptions}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="guests">Số lượng khách <span className="required">*</span></label>
                <div className="input-group">
                  <span className="input-icon"><FaUserFriends /></span>
                  <select
                    id="guests"
                    name="guests"
                    value={formData.guests}
                    onChange={handleChange}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'Trên 10 người'].map(num => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'người' : 'người'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="specialRequest">Yêu cầu đặc biệt (tùy chọn)</label>
                <textarea
                  id="specialRequest"
                  name="specialRequest"
                  value={formData.specialRequest}
                  onChange={handleChange}
                  placeholder="Ví dụ: Bàn gần cửa sổ, không có đậu phộng, kỷ niệm sinh nhật..."
                  rows="3"
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="btn btn-block"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xử lý...' : 'ĐẶT BÀN NGAY'}
              </button>

              <p className="form-note">
                <small>Bằng cách nhấn nút "ĐẶT BÀN NGÀY", bạn đồng ý với <a href="/terms">Điều khoản dịch vụ</a> của chúng tôi.</small>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}