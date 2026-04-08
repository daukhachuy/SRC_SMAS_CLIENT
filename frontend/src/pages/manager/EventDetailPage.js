import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoleSectionBasePath } from '../../hooks/useRoleSectionBasePath';
import { 
  Calendar, Users, CheckCircle, FileText, 
  ChevronRight, Home, FileCheck, DollarSign,
  UtensilsCrossed, Scale, Flower2, Music
} from 'lucide-react';
import '../../styles/EventDetailPage.css';
import TransactionHistoryModal from '../../components/TransactionHistoryModal';

const EventDetailPage = () => {
  const { base } = useRoleSectionBasePath();
  const navigate = useNavigate();
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Event data
  const eventData = {
    id: 'SK-2024-001',
    title: 'Tiệc cưới Thành Nam & Khánh Huyền',
    venue: 'Sảnh A Cao Cấp',
    date: '15/12/2024',
    time: '18:00',
    tables: 50,
    guests: 500,
    status: 'confirmed',
    statusText: 'Đã xác nhận',
    comboName: 'Combo Tiệc Cưới VIP',
    
    menu: [
      {
        category: 'Khai vị',
        items: [
          {
            name: 'Súp hải sản tóc tiên',
            description: 'Hải sản tươi, nấm linh chi',
            price: 450000,
            note: 'Phục vụ nóng, ít tiêu'
          },
          {
            name: 'Gỏi ngó sen tôm thịt',
            description: 'Tôm đất, thịt ba chỉ, bánh phồng tôm',
            price: 380000,
            note: 'Độ cay vừa phải'
          }
        ]
      },
      {
        category: 'Món chính',
        items: [
          {
            name: 'Bò hầm rượu vang & Bánh mì',
            description: 'Thăn bò Úc, vang đỏ Bordeaux',
            price: 850000,
            note: 'Thịt mềm, không quá nhừ'
          },
          {
            name: 'Cá chẽm hấp Hong Kong',
            description: 'Cá tươi sống, nước tương đặc biệt',
            price: 620000,
            note: 'Trang trí hành gừng tươi'
          }
        ]
      },
      {
        category: 'Tráng miệng & Đồ uống',
        items: [
          {
            name: 'Chè tổ yến hạt sen',
            description: '',
            price: 250000,
            note: 'Độ ngọt thanh'
          },
          {
            name: 'Gói bia Heineken & Nước ngọt',
            description: 'Phục vụ không giới hạn trong 2 giờ',
            price: 1200000,
            note: 'Luôn ướp lạnh, kèm đá sạch'
          }
        ]
      }
    ],

    policies: [
      'Đặt cọc 30% giá trị tiệc ngay khi ký hợp đồng.',
      'Hủy tiệc trước 30 ngày: Hoàn trả 50% tiền cọc.',
      'Thay đổi số lượng bàn (+/- 10%) báo trước 7 ngày.'
    ],

    services: [
      'Trang trí hoa tươi bàn tiệc',
      'Hệ thống âm thanh & Ánh sáng',
      'Màn hình LED 500 inch',
      'MC & Ban nhạc Acoustic'
    ],

    payment: {
      pricePerTable: 3750000,
      quantity: 50,
      subtotal: 187500000,
      serviceVAT: 18750000,
      decoration: 15000000,
      total: 221250000,
      deposit: 66375000,
      remaining: 154875000
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  return (
    <div className="event-detail-page">
      {/* Breadcrumb & Header */}
      <div className="event-detail-header">
        <div className="breadcrumb">
          <span className="breadcrumb-item">Hệ thống</span>
          <ChevronRight size={14} />
          <span className="breadcrumb-item">Quản lý sự kiện</span>
          <ChevronRight size={14} />
          <span className="breadcrumb-item active">#{eventData.id}</span>
        </div>
        <h1 className="event-title">Chi tiết Sự kiện #{eventData.id}</h1>
        <p className="event-subtitle">{eventData.title} - {eventData.venue}</p>
      </div>

      {/* Info Cards */}
      <div className="event-info-cards">
        <div className="info-card">
          <div className="info-card-header">
            <Calendar className="info-card-icon" size={20} />
            <span className="info-card-label">Ngày giờ</span>
          </div>
          <p className="info-card-value">{eventData.date} | {eventData.time}</p>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <UtensilsCrossed className="info-card-icon" size={20} />
            <span className="info-card-label">Số lượng bàn</span>
          </div>
          <p className="info-card-value">{eventData.tables} bàn tiệc</p>
        </div>

        <div className="info-card">
          <div className="info-card-header">
            <Users className="info-card-icon" size={20} />
            <span className="info-card-label">Khách dự kiến</span>
          </div>
          <p className="info-card-value">{eventData.guests} khách mời</p>
        </div>

        <div className="info-card status-card">
          <div className="info-card-header">
            <CheckCircle className="info-card-icon" size={20} />
            <span className="info-card-label">Trạng thái</span>
          </div>
          <p className="info-card-value status-confirmed">{eventData.statusText.toUpperCase()}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="event-content-grid">
        {/* Left Column - Menu & Terms */}
        <div className="event-left-column">
          {/* Menu Section */}
          <section className="event-section menu-section">
            <div className="section-header">
              <h3 className="section-title">
                <FileText size={20} />
                Danh sách Thực đơn được chọn
              </h3>
              <span className="combo-badge">{eventData.comboName}</span>
            </div>

            <div className="menu-table-container">
              <table className="menu-table">
                <thead>
                  <tr>
                    <th>Món ăn / Phân loại</th>
                    <th>Đơn giá</th>
                    <th>Ghi chú chế biến</th>
                  </tr>
                </thead>
                <tbody>
                  {eventData.menu.map((category, catIndex) => (
                    <React.Fragment key={catIndex}>
                      <tr className="category-row">
                        <td colSpan="3">{category.category}</td>
                      </tr>
                      {category.items.map((item, itemIndex) => (
                        <tr key={itemIndex}>
                          <td>
                            <div className="menu-item-name">{item.name}</div>
                            {item.description && (
                              <div className="menu-item-desc">{item.description}</div>
                            )}
                          </td>
                          <td className="menu-price">{formatCurrency(item.price)}</td>
                          <td className="menu-note">{item.note}</td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Terms & Services Section */}
          <section className="event-section terms-section">
            <h3 className="section-title">
              <Scale size={20} />
              Điều khoản & Dịch vụ đi kèm
            </h3>

            <div className="terms-grid">
              {/* Policies */}
              <div className="terms-column">
                <h4 className="terms-subtitle">Chính sách & Quy định</h4>
                <ul className="policy-list">
                  {eventData.policies.map((policy, index) => (
                    <li key={index} className="policy-item">
                      <CheckCircle size={16} className="policy-icon" />
                      {policy}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Services */}
              <div className="terms-column">
                <h4 className="terms-subtitle">Dịch vụ đi kèm</h4>
                <div className="services-grid">
                  {eventData.services.map((service, index) => (
                    <div key={index} className="service-badge">
                      {service}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Payment */}
        <div className="event-right-column">
          <section className="event-section payment-section">
            <h3 className="section-title">
              <DollarSign size={20} />
              Thanh toán dự kiến
            </h3>

            <div className="payment-details">
              <div className="payment-row">
                <span>Đơn giá thực đơn (/bàn)</span>
                <span className="payment-value">{formatCurrency(eventData.payment.pricePerTable)}</span>
              </div>
              <div className="payment-row">
                <span>Số lượng ({eventData.payment.quantity} bàn)</span>
                <span className="payment-value">{formatCurrency(eventData.payment.subtotal)}</span>
              </div>
              <div className="payment-row">
                <span>Phí dịch vụ</span>
                <span className="payment-value">{formatCurrency(eventData.payment.serviceVAT)}</span>
              </div>
              <div className="payment-row">
                <span>Trang trí & Âm thanh</span>
                <span className="payment-value">{formatCurrency(eventData.payment.decoration)}</span>
              </div>

              <hr className="payment-divider" />

              <div className="payment-row payment-total">
                <span>Tổng cộng</span>
                <span className="payment-total-value">{formatCurrency(eventData.payment.total)}</span>
              </div>

              <div className="payment-status-box">
                <div className="payment-deposit">
                  <span>Tiền cọc đã đóng (30%)</span>
                  <span className="deposit-amount">- {formatCurrency(eventData.payment.deposit)}</span>
                </div>
                <div className="payment-remaining">
                  <span>Còn lại cần thanh toán</span>
                  <span className="remaining-amount">{formatCurrency(eventData.payment.remaining)}</span>
                </div>
              </div>

              <div className="payment-actions">
                <button className="btn-confirm-payment">
                  Xác nhận thanh toán đợt 2
                </button>
                <button 
                  className="btn-transaction-history"
                  onClick={() => setShowTransactionModal(true)}
                >
                  Lịch sử giao dịch
                </button>
                <button 
                  className="btn-transaction-history"
                  onClick={() => navigate(`${base}/reservations/${eventData.id}/contract`)}
                >
                  Xem hợp đồng
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="event-footer">
        <p>© 2024 Gourmet POS System. Phát triển cho Dịch vụ Tiệc Cao cấp.</p>
      </footer>

      {/* Transaction History Modal */}
      {showTransactionModal && (
        <TransactionHistoryModal 
          eventId={eventData.id}
          onClose={() => setShowTransactionModal(false)}
        />
      )}
    </div>
  );
};

export default EventDetailPage;
