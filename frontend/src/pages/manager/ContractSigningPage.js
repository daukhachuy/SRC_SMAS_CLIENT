import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoleSectionBasePath } from '../../hooks/useRoleSectionBasePath';
import { 
  ArrowLeft, FileText, ShieldCheck, Building2, User,
  CheckCircle, Download, Edit3
} from 'lucide-react';
import '../../styles/ContractSigningPage.css';

const ContractSigningPage = () => {
  const { base, homePath } = useRoleSectionBasePath();
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [isSignaturePadOpen, setIsSignaturePadOpen] = useState(false);

  // Contract data
  const contractData = {
    contractId: 'EVT-2023-0815',
    status: 'pending_signature',
    statusText: 'Chờ ký kết',
    
    // Party A (Restaurant)
    partyA: {
      name: 'Nhà hàng Gourmet Luxury',
      address: '123 Đường Lê Lợi, Q.1, TP. HCM',
      representative: 'Nguyễn Văn A',
      position: 'Quản lý',
      signed: true,
      signedDate: '24/10/2023'
    },
    
    // Party B (Customer)
    partyB: {
      name: 'Trần Thị B',
      phone: '0901234567',
      email: 'tran.thib@gmail.com',
      signed: false,
      signedDate: null
    },
    
    // Event details
    event: {
      name: 'Tiệc Cưới Minh & Vy',
      date: '22/12/2023',
      time: '18:00',
      tables: 50,
      guestsPerTable: 10
    },
    
    // Menu items
    menu: [
      { name: 'Súp Bào Ngư Vi Cá Hoàng Gia', category: 'Món khai vị' },
      { name: 'Tôm Hùm Bỏ Lò Phô Mai Pháp', category: 'Món chính' },
      { name: 'Bò Wagyu Nướng Đá Muối', category: 'Món chính' }
    ],
    
    // Payment
    payment: {
      total: 500000000,
      depositPercent: 30,
      deposit: 150000000
    },
    
    // Cancellation policy
    cancellation: [
      'Trước 30 ngày: Hoàn trả 100% tiền cọc.',
      'Từ 15-30 ngày: Phạt 50% số tiền đặt cọc.',
      'Dưới 15 ngày: Phạt 100% số tiền đặt cọc.'
    ]
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
  };

  const handleSignContract = () => {
    // Open signature pad modal
    setIsSignaturePadOpen(true);
  };

  const handleDownloadPDF = () => {
    alert('Tính năng tải PDF đang được phát triển');
  };

  return (
    <div className="contract-signing-page">
      {/* Breadcrumb & Header */}
      <nav className="contract-breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate(homePath)}>
          Trang chủ
        </span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-link" onClick={() => navigate(`${base}/reservations`)}>
          Lịch đặt bàn
        </span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">Ký hợp đồng điện tử</span>
      </nav>

      {/* Top Header Bar */}
      <div className="contract-header-bar">
        <div className="header-info">
          <h1 className="contract-title">KÝ HỢP ĐỒNG SỰ KIỆN</h1>
          <div className="contract-badges">
            <span className="badge badge-primary">
              Mã: {contractData.contractId}
            </span>
            <span className="badge badge-warning">
              Trạng thái: {contractData.statusText}
            </span>
          </div>
        </div>
        <div className="header-actions">
          <button 
            className="btn-back"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={18} />
            Quay lại
          </button>
          <button 
            className="btn-download-pdf"
            onClick={handleDownloadPDF}
          >
            <Download size={18} />
            Tải bản nháp PDF
          </button>
        </div>
      </div>

      {/* Contract Document */}
      <div className="contract-document">
        {/* Document Header */}
        <div className="document-header">
          <div className="header-icon">
            <ShieldCheck size={40} className="icon-shield" />
          </div>
          <p className="header-country">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
          <p className="header-motto">Độc lập - Tự do - Hạnh phúc</p>
          <div className="header-divider"></div>
          <h2 className="document-title">HỢP ĐỒNG DỊCH VỤ TỔ CHỨC SỰ KIỆN</h2>
          <p className="document-subtitle">
            Căn cứ vào nhu cầu và khả năng của hai bên, chúng tôi thống nhất các điều khoản sau đây:
          </p>
        </div>

        {/* Parties Information */}
        <div className="parties-section">
          {/* Party A */}
          <div className="party-box">
            <h3 className="party-title">
              <Building2 size={16} />
              Bên A (Nhà hàng)
            </h3>
            <div className="party-details">
              <div className="detail-row">
                <span className="detail-label">Tên đơn vị:</span>
                <span className="detail-value">{contractData.partyA.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Địa chỉ:</span>
                <span className="detail-value">{contractData.partyA.address}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Đại diện:</span>
                <span className="detail-value representative">
                  {contractData.partyA.representative} - {contractData.partyA.position}
                </span>
              </div>
            </div>
          </div>

          {/* Party B */}
          <div className="party-box">
            <h3 className="party-title">
              <User size={16} />
              Bên B (Khách hàng)
            </h3>
            <div className="party-details">
              <div className="detail-row">
                <span className="detail-label">Họ và tên:</span>
                <span className="detail-value">{contractData.partyB.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Số điện thoại:</span>
                <span className="detail-value">{contractData.partyB.phone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{contractData.partyB.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Content */}
        <div className="contract-content">
          {/* Section 1: Event Details */}
          <section className="contract-section">
            <h4 className="section-title">
              <span className="section-number">1</span>
              Chi tiết dịch vụ & Sự kiện
            </h4>
            <div className="event-details-grid">
              <div className="event-detail-card">
                <p className="card-label">Tên sự kiện</p>
                <p className="card-value">{contractData.event.name}</p>
              </div>
              <div className="event-detail-card">
                <p className="card-label">Thời gian</p>
                <p className="card-value">{contractData.event.time} - {contractData.event.date}</p>
              </div>
              <div className="event-detail-card">
                <p className="card-label">Số lượng bàn</p>
                <p className="card-value">
                  {contractData.event.tables} Bàn ({contractData.event.guestsPerTable} người/bàn)
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Menu */}
          <section className="contract-section">
            <h4 className="section-title">
              <span className="section-number">2</span>
              Thực đơn đã chọn
            </h4>
            <div className="menu-table-wrapper">
              <table className="menu-table">
                <thead>
                  <tr>
                    <th>Món ăn</th>
                    <th>Loại món</th>
                  </tr>
                </thead>
                <tbody>
                  {contractData.menu.map((item, index) => (
                    <tr key={index}>
                      <td className="menu-item-name">{item.name}</td>
                      <td className="menu-item-category">{item.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Payment */}
          <section className="contract-section">
            <h4 className="section-title">
              <span className="section-number">3</span>
              Chi phí & Đặt cọc
            </h4>
            <div className="payment-grid">
              <div className="payment-box">
                <div className="payment-total">
                  <span className="payment-label">Tổng chi phí:</span>
                  <span className="payment-amount">{formatCurrency(contractData.payment.total)}</span>
                </div>
                <div className="payment-deposit">
                  <span className="deposit-label">
                    Tiền đặt cọc ({contractData.payment.depositPercent}%):
                  </span>
                  <span className="deposit-amount">{formatCurrency(contractData.payment.deposit)}</span>
                </div>
              </div>

              <div className="cancellation-policy">
                <p className="policy-title">Quy định hủy bỏ:</p>
                {contractData.cancellation.map((policy, index) => (
                  <p key={index} className="policy-item">• {policy}</p>
                ))}
              </div>
            </div>
          </section>

          {/* Section 4: Signatures */}
          <section className="contract-section signature-section">
            <h4 className="signature-header">Khu vực chữ ký số</h4>
            <div className="signatures-grid">
              {/* Party A Signature */}
              <div className="signature-box">
                <p className="signature-title">Bên A (Nhà hàng)</p>
                <div className="signature-area signed">
                  <div className="signature-content">
                    {contractData.partyA.representative}
                  </div>
                  <div className="signature-timestamp">
                    Digital Signed: {contractData.partyA.signedDate}
                  </div>
                  <CheckCircle className="signature-check" size={20} />
                </div>
                <p className="signatory-name">{contractData.partyA.representative}</p>
              </div>

              {/* Party B Signature */}
              <div className="signature-box">
                <p className="signature-title">Bên B (Khách hàng)</p>
                <div 
                  className="signature-area unsigned"
                  onClick={handleSignContract}
                >
                  <Edit3 className="signature-icon" size={24} />
                  <p className="signature-prompt">Ký tên tại đây</p>
                </div>
                <p className="signatory-name unsigned-text">Chưa ký</p>
              </div>
            </div>
          </section>
        </div>

        {/* Action Footer */}
        <div className="contract-footer">
          <button 
            className="btn-sign-contract"
            onClick={handleSignContract}
          >
            <Edit3 size={20} />
            XÁC NHẬN KÝ KẾT
          </button>
        </div>
      </div>

      {/* Legal Notice */}
      <p className="legal-notice">
        Bản hợp đồng này có giá trị pháp lý theo Luật Giao dịch điện tử. <br/>
        © 2023 Gourmet POS - Hệ thống quản lý nhà hàng.
      </p>

      {/* Signature Pad Modal (placeholder) */}
      {isSignaturePadOpen && (
        <div className="signature-modal-overlay" onClick={() => setIsSignaturePadOpen(false)}>
          <div className="signature-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Chữ ký điện tử</h3>
            <p>Tính năng ký điện tử đang được phát triển...</p>
            <button 
              className="btn-close-modal"
              onClick={() => setIsSignaturePadOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractSigningPage;
