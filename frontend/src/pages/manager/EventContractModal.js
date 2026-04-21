import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download 
} from 'lucide-react';
import { downloadContractPdf, getPdfErrorMessage } from '../../api/pdfExportApi';
import { useManagerToast } from '../../context/ManagerToastContext';
import '../../styles/EventContractModal.css';

const EventContractModal = ({ isOpen, onClose, contractData }) => {
  const { showToast } = useManagerToast();
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  if (!isOpen) return null;

  // Default contract data
  const contract = contractData || {
    contractId: 'HD001',
    contractNumber: '001/HĐ-NH/2023',
    eventName: 'Tiệc Workshop Công nghệ',
    eventDate: '24/10/2023',
    eventTime: '18:00 - 22:00',
    venue: 'Sảnh VIP 1',
    guestCount: 50,
    duration: '4 giờ',
    
    // Party A - Service Provider
    providerName: 'Hệ Thống Nhà Hàng Gourmet',
    providerTaxCode: '0102345678',
    providerAddress: 'Quận 1, TP. Hồ Chí Minh',
    providerPhone: '1900 6789',
    providerRepresentative: 'Trần Văn An',
    
    // Party B - Customer
    customerName: 'Nguyễn Hoàng Nam',
    customerIdCard: '079088001234',
    customerAddress: 'Bình Thạnh, TP. HCM',
    customerPhone: '090 123 4567',
    
    // Service details
    serviceDescription: 'Bên A đồng ý cung cấp dịch vụ tổ chức tiệc Workshop cho Bên B tại sảnh VIP 1 với số lượng khách dự kiến là 50 người. Thực đơn bao gồm 15 món ăn tự chọn và đồ uống phục vụ không giới hạn trong 4 giờ.',
    serviceItems: [
      'Thời gian: 18:00 - 22:00 ngày 24/10/2023',
      'Trang thiết bị: Âm thanh, máy chiếu, màn hình LED.',
      'Nhân viên phục vụ: 04 nhân viên chuyên trách.'
    ],
    
    // Payment details
    totalAmount: '25.000.000đ',
    depositAmount: '10.000.000đ',
    remainingAmount: '15.000.000đ',
    
    // Signature status
    providerSigned: true,
    customerSigned: true,
    providerSignatureUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkwgH-x_cpubhqT7wytSUn_NAdqZGh8y0GJP29AM0Ld-h8n4O-4uvW30yV5Uc1adQsUfwbX2213C-vzrsrQITGyiBPqZ5fFKRbLxAs83dYv3O_zX7gwaPbB0mOUb_xNrqsxMDwrHdbHYZfPTgYrcUeMVMYT-OuLh5aPeEHBzOtrNRKTd2Je_eF9Q8EWfEp4s6l-xHg3QfgOrBKo8GL9dOwjIKsgYOonx8ubXo1hkD-JDv_E6AQJAY--jBOL5WXh1bAN0cD6BUbn9s',
    customerSignatureUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkwgH-x_cpubhqT7wytSUn_NAdqZGh8y0GJP29AM0Ld-h8n4O-4uvW30yV5Uc1adQsUfwbX2213C-vzrsrQITGyiBPqZ5fFKRbLxAs83dYv3O_zX7gwaPbB0mOUb_xNrqsxMDwrHdbHYZfPTgYrcUeMVMYT-OuLh5aPeEHBzOtrNRKTd2Je_eF9Q8EWfEp4s6l-xHg3QfgOrBKo8GL9dOwjIKsgYOonx8ubXo1hkD-JDv_E6AQJAY--jBOL5WXh1bAN0cD6BUbn9s',
    
    contractStatus: 'HỢP ĐỒNG ĐÃ KÝ',
    statusColor: 'green'
  };

  const handleDownloadPDF = async () => {
    const code = String(contract.contractNumber || contract.contractId || '').trim();
    if (!code) {
      showToast('Chưa có mã hợp đồng để tải PDF.', 'error');
      return;
    }
    setDownloadingPdf(true);
    try {
      await downloadContractPdf(code);
    } catch (e) {
      const msg = await getPdfErrorMessage(e);
      showToast(msg || 'Tải PDF thất bại.', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="contract-modal-overlay" onClick={onClose}>
      <div className="contract-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="contract-modal-header">
          <div className="contract-header-left">
            <div className="contract-icon-box">
              <FileText size={32} className="contract-icon" />
            </div>
            <div className="contract-header-info">
              <h2 className="contract-title">
                Hợp đồng sự kiện - #{contract.contractId}
              </h2>
              <p className="contract-subtitle">
                {contract.eventName} • {contract.eventDate}
              </p>
            </div>
          </div>
          <button className="contract-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Contract Content */}
        <div className="contract-modal-body">
          <div className="contract-content">
            {/* Header Section */}
            <div className="contract-document-header">
              <h3 className="contract-country-header">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </h3>
              <p className="contract-motto">Độc lập - Tự do - Hạnh phúc</p>
              <div className="contract-divider"></div>
              <h4 className="contract-main-title">
                HỢP ĐỒNG DỊCH VỤ ĂN UỐNG & SỰ KIỆN
              </h4>
              <p className="contract-number">Số: {contract.contractNumber}</p>
            </div>

            {/* Party Information */}
            <div className="contract-parties-grid">
              {/* Party A - Service Provider */}
              <div className="contract-party-section">
                <h5 className="contract-party-title">Bên A: Bên Cung Cấp</h5>
                <div className="contract-party-details">
                  <div className="contract-detail-row">
                    <span className="contract-detail-label">Đại diện:</span>
                    <span className="contract-detail-value">{contract.providerName}</span>
                  </div>
                  <div className="contract-detail-row">
                    <span className="contract-detail-label">Mã số thuế:</span>
                    <span className="contract-detail-value">{contract.providerTaxCode}</span>
                  </div>
                  <div className="contract-detail-row">
                    <span className="contract-detail-label">Địa chỉ:</span>
                    <span className="contract-detail-value contract-detail-align-right">
                      {contract.providerAddress}
                    </span>
                  </div>
                  <div className="contract-detail-row">
                    <span className="contract-detail-label">Điện thoại:</span>
                    <span className="contract-detail-value">{contract.providerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Party B - Customer */}
              <div className="contract-party-section">
                <h5 className="contract-party-title">Bên B: Bên Khách Hàng</h5>
                <div className="contract-party-details">
                  <div className="contract-detail-row">
                    <span className="contract-detail-label">Khách hàng:</span>
                    <span className="contract-detail-value">{contract.customerName}</span>
                  </div>
                  <div className="contract-detail-row">
                    <span className="contract-detail-label">Số CMND/CCCD:</span>
                    <span className="contract-detail-value">{contract.customerIdCard}</span>
                  </div>
                  <div className="contract-detail-row">
                    <span className="contract-detail-label">Địa chỉ:</span>
                    <span className="contract-detail-value contract-detail-align-right">
                      {contract.customerAddress}
                    </span>
                  </div>
                  <div className="contract-detail-row">
                    <span className="contract-detail-label">Điện thoại:</span>
                    <span className="contract-detail-value">{contract.customerPhone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Article 1 - Service Content */}
            <div className="contract-article-section">
              <h5 className="contract-article-title">Điều 1: Nội dung dịch vụ</h5>
              <div className="contract-article-content">
                <p className="contract-article-text">{contract.serviceDescription}</p>
                <ul className="contract-article-list">
                  {contract.serviceItems.map((item, index) => (
                    <li key={index}>
                      {typeof item === 'object' && item !== null
                        ? `${item.fullname || ''} ${item.phone ? '- ' + item.phone : ''} ${item.email ? '- ' + item.email : ''}`.trim()
                        : item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Article 2 - Payment Details */}
            <div className="contract-article-section">
              <h5 className="contract-article-title">Điều 2: Giá trị hợp đồng & Thanh toán</h5>
              <div className="contract-payment-grid">
                <div className="contract-payment-card contract-payment-total">
                  <p className="contract-payment-label">Tổng giá trị</p>
                  <p className="contract-payment-amount">{contract.totalAmount}</p>
                </div>
                <div className="contract-payment-card contract-payment-deposit">
                  <p className="contract-payment-label">Tiền đặt cọc</p>
                  <p className="contract-payment-amount">{contract.depositAmount}</p>
                </div>
                <div className="contract-payment-card contract-payment-remaining">
                  <p className="contract-payment-label">Số tiền còn lại</p>
                  <p className="contract-payment-amount">{contract.remainingAmount}</p>
                </div>
              </div>
            </div>

            {/* Signature Section */}
            <div className="contract-signature-section">
              <h5 className="contract-signature-title">Chữ ký điện tử</h5>
              <div className="contract-signature-grid">
                {/* Provider Signature */}
                <div className="contract-signature-box">
                  <p className="contract-signature-label">Đại diện Bên A</p>
                  <div className="contract-signature-frame">
                    {contract.providerSigned && (
                      <>
                        <img 
                          src={contract.providerSignatureUrl} 
                          alt="Signature A" 
                          className="contract-signature-img"
                        />
                        <div className="contract-signature-badge">Đã ký</div>
                      </>
                    )}
                  </div>
                  <p className="contract-signature-name">{contract.providerRepresentative}</p>
                </div>

                {/* Customer Signature */}
                <div className="contract-signature-box">
                  <p className="contract-signature-label">Đại diện Bên B</p>
                  <div className="contract-signature-frame">
                    {contract.customerSigned && (
                      <>
                        <img 
                          src={contract.customerSignatureUrl} 
                          alt="Signature B" 
                          className="contract-signature-img"
                        />
                        <div className="contract-signature-badge">Đã ký</div>
                      </>
                    )}
                  </div>
                  <p className="contract-signature-name">{contract.customerName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="contract-modal-footer">
          <div className="contract-status-indicator">
            <span className={`contract-status-dot contract-status-${contract.statusColor}`}></span>
            <span className="contract-status-text">
              TRẠNG THÁI: {contract.contractStatus}
            </span>
          </div>
          <div className="contract-footer-actions">
            <button
              type="button"
              className="contract-download-btn"
              disabled={downloadingPdf}
              onClick={handleDownloadPDF}
            >
              <Download size={18} />
              {downloadingPdf ? 'Đang tải…' : 'Tải xuống PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventContractModal;
