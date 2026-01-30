import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/Services.css';

import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, 
  isBefore, startOfToday 
} from 'date-fns';
import { vi } from 'date-fns/locale';

const Services = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMenuModal, setShowMenuModal] = useState(false);
  
  const [menuQty, setMenuQty] = useState(1);
  const [comboQty, setComboQty] = useState(1);

  // Giả sử đây là dữ liệu từ API của bạn (có 10 món)
  const [selectedItems, setSelectedItems] = useState([
    { id: 1, type: 'Menu', name: 'Cá diêu hồng hấp Hồng Kông', qty: 1, note: 'Ít cay, nhiều hành' },
    { id: 2, type: 'Combo', name: 'Combo FPT Luxury', qty: 1, note: 'Thêm 2 coca' },
    { id: 3, type: 'Menu', name: 'Gà đông tảo ủ muối', qty: 2, note: '' },
    { id: 4, type: 'Menu', name: 'Lẩu hải sản chua cay', qty: 1, note: 'Nhiều rau muống' },
    { id: 5, type: 'Combo', name: 'Combo Gia Đình 1', qty: 1, note: 'Không lấy khăn lạnh' },
    { id: 6, type: 'Menu', name: 'Bò tơ Tây Ninh nướng', qty: 2, note: 'Thịt mềm' },
    { id: 7, type: 'Menu', name: 'Tôm hùm bỏ lò phô mai', qty: 1, note: 'Ăn nóng' },
    { id: 8, type: 'Combo', name: 'Combo Tiệc Cưới Gold', qty: 1, note: 'Trang trí hoa tươi' },
    { id: 9, type: 'Menu', name: 'Mì xào hải sản', qty: 3, note: 'Cho trẻ em' },
    { id: 10, type: 'Menu', name: 'Nộm ngó sen tôm thịt', qty: 1, note: '' },
  ]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

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
        
        {/* SECTION 1: ĐẶT BÀN */}
        <section className="service-card-section">
          <h2 className="service-title-gold">ĐẶT BÀN TRẢI NGHIỆM TẠI CHỖ</h2>
          <div className="glass-card booking-container">
            <div className="booking-left">
              <div className="calendar-ui">
                <div className="calendar-month">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="nav-month-btn">❮</button>
                  <span style={{ textTransform: 'capitalize' }}>{format(currentMonth, 'MMMM yyyy', { locale: vi })}</span>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="nav-month-btn">❯</button>
                </div>
                <div className="calendar-weekdays">
                  <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
                </div>
                <div className="calendar-numbers">
                  {calendarDays.map((day, idx) => {
                    const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);
                    const isPast = isBefore(day, startOfToday());
                    return (
                      <span key={idx} 
                        className={`${!isCurrentMonth ? 'empty' : ''} ${isSameDay(day, selectedDate) ? 'day-active' : ''} ${isToday(day) ? 'is-today' : ''} ${isPast && isCurrentMonth ? 'day-past' : ''}`}
                        onClick={() => !isPast && isCurrentMonth && setSelectedDate(day)}>
                        {format(day, 'd')}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="time-grid">
                {['09:00', '11:00', '13:00', '15:00', '17:00', '10:00', '12:00', '14:00', '16:00', '18:00'].map(t => (
                  <button key={t} className="time-slot-btn">{t}</button>
                ))}
              </div>
            </div>
            <div className="vertical-divider"></div>
            <div className="booking-right">
              {['Họ và tên', 'Số điện thoại', 'Email'].map(label => (
                <div className="input-group-row" key={label}>
                  <label>{label}:</label>
                  <input type="text" placeholder={`Nhập ${label.toLowerCase()}...`} />
                </div>
              ))}
              <div className="input-group-row"><label>Số lượng khách:</label><input type="number" defaultValue="1" /></div>
              <div className="input-group-row">
                <label>Khu vực:</label>
                <select><option>Trong nhà (Máy lạnh)</option><option>Ngoài trời (Sân vườn)</option></select>
              </div>
              <div className="input-group-row"><label>Ghi chú:</label><textarea placeholder="Yêu cầu đặc biệt..."></textarea></div>
              <button className="primary-gold-btn">ĐẶT BÀN NGAY</button>
            </div>
          </div>
        </section>

        {/* SECTION 2: ĐẶT SỰ KIỆN */}
        <section className="service-card-section">
          <h2 className="service-title-gold">ĐẶT LỊCH SỰ KIỆN</h2>
          <p className="service-subtitle">Sự kiện dành cho 30 người trở lên bắt buộc phải ký hợp đồng</p>
          <div className="glass-card event-container">
            <div className="event-grid">
              <div className="event-inputs">
                {['Họ và tên', 'Số điện thoại', 'Email', 'Số lượng khách', 'Số lượng bàn'].map(label => (
                  <div className="input-group-row" key={label}><label>{label}:</label><input type="text" /></div>
                ))}
                <div className="input-group-row"><label>Ghi chú:</label><textarea rows="4"></textarea></div>
              </div>
              <div className="event-menu-preview">
                <div className="table-header-info">
                  <h4>Các món ăn trên mỗi bàn</h4>
                  <p>Nếu không đặt món trước xin bỏ qua</p>
                </div>
                {/* ĐÃ SỬA: Bỏ .slice(0,5) để hiện đầy đủ 10 món từ API */}
                <div className="menu-table-wrapper">
                  <table>
                    <thead><tr><th>STT</th><th>Loại</th><th>Tên Món</th><th>SL</th><th>Giá</th></tr></thead>
                    <tbody>
                      {selectedItems.map((item, idx) => (
                        <tr key={item.id}>
                          <td>{idx + 1}</td>
                          <td><span className={`badge-${item.type.toLowerCase()}`}>{item.type}</span></td>
                          <td>{item.name}</td>
                          <td>{item.qty}</td>
                          <td>150k</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="edit-menu-text" onClick={() => setShowMenuModal(true)}>Chỉnh sửa thực đơn</div>
              </div>
            </div>
            <button className="primary-gold-btn large-wide">ĐẶT LỊCH NGAY</button>
          </div>
        </section>

        {/* SECTION 3: DELIVERY */}
        <section className="service-card-section delivery-section">
          <h2 className="service-title-gold">ĐẶT HÀNG TRỰC TUYẾN</h2>
          <div className="glass-card delivery-container">
            <div className="delivery-steps-modern">
              <div className="step-card">
                <div className="step-img-box"><img src="/images/ShipFast.png" alt="Ship" /></div>
                <h3>Giao nhanh</h3><p>30 phút</p>
              </div>
              <div className="step-card">
                <div className="step-img-box"><img src="/images/Food.png" alt="Food" /></div>
                <h3>Đảm bảo</h3><p>tươi ngon</p>
              </div>
              <div className="step-card">
                <div className="step-img-box"><img src="/images/Pay.png" alt="Pay" /></div>
                <h3>Thanh toán</h3><p>tiện lợi</p>
              </div>
            </div>
            <button className="primary-gold-btn extra-large">ĐẶT HÀNG NGAY</button>
          </div>
        </section>
      </div>

      {/* MODAL THÊM MÓN & COMBO */}
      {showMenuModal && (
        <div className="modal-overlay">
          <div className="menu-modal-content">
            <div className="modal-header-flex">
              <h3>Thêm Món Ăn & Combo</h3>
              <span className="close-icon" onClick={() => setShowMenuModal(false)}>✖</span>
            </div>
            <div className="modal-body">
              <div className="form-row-flex">
                <div className="input-col">
                  <label>Menu</label>
                  <select><option>Chọn món từ thực đơn...</option></select>
                  <div className="qty-control">
                    <button className="qty-btn-minus" onClick={() => setMenuQty(Math.max(1, menuQty-1))}>-</button>
                    <span className="qty-display">{menuQty}</span>
                    <button className="qty-btn-plus" onClick={() => setMenuQty(menuQty+1)}>+</button>
                  </div>
                </div>
                <div className="note-col">
                    <label>Ghi chú :</label>
                    <textarea placeholder="Không hành, ít cay..."></textarea>
                </div>
                <div className="action-col">
                    <button className="save-item-btn">Lưu món</button>
                </div>
              </div>

              <div className="form-row-flex" style={{marginTop: '15px'}}>
                <div className="input-col">
                  <label>Combo</label>
                  <select><option>Chọn combo tiệc...</option></select>
                  <div className="qty-control">
                    <button className="qty-btn-minus" onClick={() => setComboQty(Math.max(1, comboQty-1))}>-</button>
                    <span className="qty-display">{comboQty}</span>
                    <button className="qty-btn-plus" onClick={() => setComboQty(comboQty+1)}>+</button>
                  </div>
                </div>
                <div className="note-col">
                    <label>Ghi chú :</label>
                    <textarea placeholder="Thêm nước ngọt, đổi món..."></textarea>
                </div>
                <div className="action-col">
                    <button className="save-item-btn">Lưu combo</button>
                </div>
              </div>

              <div className="modal-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th style={{width: '50px'}}>STT</th>
                      <th style={{width: '80px'}}>Loại</th>
                      <th>Tên Món</th>
                      <th style={{width: '60px'}}>SL</th>
                      <th style={{width: '180px'}}>Ghi chú</th>
                      <th style={{width: '180px'}}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td><span className={`badge-${item.type.toLowerCase()}`}>{item.type}</span></td>
                        <td style={{ fontWeight: '800', textAlign: 'left' }}>{item.name}</td>
                        <td>{item.qty}</td>
                        <td className="note-cell-truncate">{item.note || '---'}</td>
                        <td>
                          {/* ĐÃ SỬA: Class nhận màu từ CSS */}
                          <div className="btn-action-group">
                            <button className="btn-mini-edit">Sửa</button>
                            <button className="btn-mini-delete" style={{ marginLeft: '8px' }}>Xóa</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="finish-menu-btn" onClick={() => setShowMenuModal(false)}>Xác nhận & Hoàn thành</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default Services;