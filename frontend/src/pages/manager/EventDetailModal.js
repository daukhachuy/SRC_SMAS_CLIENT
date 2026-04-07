import React, { useState } from 'react';
import {
  X,
  UtensilsCrossed,
  Plus,
  User,
  FileText,
  CreditCard,
  Eye,
  CheckCircle,
  Receipt,
} from 'lucide-react';
import EventContractModal from './EventContractModal';

// Reusable row component
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-500 font-medium">{label}</span>
    <span className="text-slate-900 dark:text-white font-bold">{value}</span>
  </div>
);

// Menu items table component
const EventMenuTable = ({ items }) => (
  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-100/50 dark:bg-slate-800">
          <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">
            Tên món ăn
          </th>
          <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-center">
            SL
          </th>
          <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">
            Đơn giá
          </th>
          <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest text-right">
            Thành tiền
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
        {items.map((item, idx) => (
          <tr key={idx}>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg bg-cover bg-center shrink-0 shadow-sm"
                  style={{ backgroundImage: `url('${item.image}')` }}
                />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {item.name}
                </span>
              </div>
            </td>
            <td className="px-6 py-4 text-center text-sm font-bold">{item.quantity}</td>
            <td className="px-6 py-4 text-right text-sm font-medium">{item.unitPrice}</td>
            <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white">
              {item.totalPrice}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="bg-primary/5">
          <td
            className="px-6 py-4 text-right text-sm font-black text-slate-500 uppercase"
            colSpan="3"
          >
            Tổng cộng thực đơn:
          </td>
          <td className="px-6 py-4 text-right text-lg font-black text-primary">
            {items.reduce((sum, item) => {
              const totalPrice = parseInt(item.totalPrice.replace(/\D/g, ''));
              return sum + totalPrice;
            }, 0).toLocaleString('vi-VN')}
            đ
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
);

// Customer info section
const CustomerInfoSection = ({ customer }) => (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <User className="w-5 h-5 text-blue-500" />
      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
        Thông tin khách hàng
      </h3>
    </div>
    <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
          <User className="w-6 h-6 text-slate-400" />
        </div>
        <div className="flex flex-col">
          <p className="text-base font-bold text-slate-900 dark:text-white">{typeof customer.name === 'string' ? customer.name : (customer.name?.toString?.() || '---')}</p>
          <p className="text-xs text-slate-500">{typeof customer.type === 'string' ? customer.type : (customer.type?.toString?.() || '---')}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Điện thoại
          </span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {typeof customer.phone === 'string' ? customer.phone : (customer.phone?.toString?.() || '---')}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Loại tiệc
          </span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {typeof customer.eventType === 'string' ? customer.eventType : (customer.eventType?.toString?.() || '---')}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Ngày tổ chức
          </span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {typeof customer.eventDate === 'string' ? customer.eventDate : (customer.eventDate?.toString?.() || '---')}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Số lượng khách
          </span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {typeof customer.guestCount === 'string' || typeof customer.guestCount === 'number' ? customer.guestCount : (customer.guestCount?.toString?.() || '---')}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Contract status section
const ContractStatusSection = ({ contractStatus, onViewContract, onConfirmMenu }) => (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <FileText className="w-5 h-5 text-emerald-500" />
      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
        Trạng thái Hợp đồng
      </h3>
    </div>
    <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-[11px] font-black uppercase tracking-wider">
          {contractStatus.status}
        </span>
        <span className="text-sm font-bold text-slate-500">{contractStatus.code}</span>
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={onViewContract}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Eye className="w-5 h-5" />
          Xem chi tiết hợp đồng
        </button>
        <button
          onClick={onConfirmMenu}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
        >
          <CheckCircle className="w-5 h-5" />
          Xác nhận thực đơn
        </button>
      </div>
    </div>
  </div>
);

// Payment info section
const PaymentInfoSection = ({ paymentInfo, onProceedPayment }) => (
  <div>
    <div className="flex items-center gap-2 mb-4">
      <CreditCard className="w-5 h-5 text-amber-500" />
      <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
        Thông tin thanh toán
      </h3>
    </div>
    <div className="p-6 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-5">
      <div className="space-y-2">
        <InfoRow label="Tổng thực đơn:" value={paymentInfo.menuTotal} />
        <div className="flex justify-between items-center text-sm pb-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-slate-500 font-medium">Đã đặt cọc:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            - {paymentInfo.deposit}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2">
          <span className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Cần thanh toán:
          </span>
          <span className="text-2xl font-black text-primary">{paymentInfo.remaining}</span>
        </div>
      </div>
      <button
        onClick={onProceedPayment}
        className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white rounded-xl font-black text-base shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all"
      >
        <Receipt className="w-5 h-5" />
        TIẾN HÀNH THANH TOÁN
      </button>
    </div>
  </div>
);

// Main modal component
const EventDetailModal = ({ isOpen, event, onClose, onSave }) => {
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  
  if (!isOpen || !event) return null;

  const menuItems = event.menuItems || [];
  // Flatten customer info for CustomerInfoSection
  const customer = (event.customer && typeof event.customer === 'object' && !Array.isArray(event.customer))
    ? {
        name: event.customer.fullname || event.customer.name || event.customer.fullName || '',
        type: event.customer.type || event.eventType || '',
        phone: event.customer.phone || '',
        eventType: event.eventType || '',
        eventDate: event.eventDate || '',
        guestCount: event.guestCount || '',
      }
    : {
        name: event.customer || '',
        type: event.eventType || '',
        phone: '',
        eventType: event.eventType || '',
        eventDate: event.eventDate || '',
        guestCount: event.guestCount || '',
      };
  const contractStatus = event.contractStatus || {};
  const paymentInfo = event.paymentInfo || {};

  const handleViewContract = () => {
    setIsContractModalOpen(true);
  };

  const handleConfirmMenu = () => {
    console.log('Confirm menu:', event.id);
  };

  const handleProceedPayment = () => {
    console.log('Proceed payment:', event.id);
  };

  return (
    <div className="event-modal-overlay">
      <div className="event-modal-container">
        {/* Modal Header */}
        <div className="event-modal-header">
          <div className="flex items-center gap-4">
            <div className="event-modal-icon">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div>
              <h2 className="event-modal-title">Chi tiết sự kiện #{event.id}</h2>
              <p className="event-modal-subtitle">Cập nhật lần cuối: 15 phút trước</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="event-modal-close"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="event-modal-content">
          <div className="event-modal-grid">
            {/* Left Column - Menu */}
            <div className="event-modal-left">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                  <h3 className="event-modal-section-title">Thực đơn sự kiện</h3>
                </div>
                <button className="event-modal-add-btn">
                  <Plus className="w-4 h-4" />
                  Thêm món
                </button>
              </div>
              <EventMenuTable items={menuItems} />
            </div>

            {/* Right Column - Info Sections */}
            <div className="event-modal-right">
              <CustomerInfoSection customer={customer} />
              <ContractStatusSection
                contractStatus={contractStatus}
                onViewContract={handleViewContract}
                onConfirmMenu={handleConfirmMenu}
              />
              <PaymentInfoSection
                paymentInfo={paymentInfo}
                onProceedPayment={handleProceedPayment}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="event-modal-footer">
          <button onClick={onClose} className="event-modal-btn-secondary">
            Đóng
          </button>
          <button onClick={onSave} className="event-modal-btn-primary">
            Lưu thay đổi
          </button>
        </div>
      </div>

      {/* Event Contract Modal */}
      <EventContractModal
        isOpen={isContractModalOpen}
        onClose={() => setIsContractModalOpen(false)}
        contractData={event.contractData}
      />
    </div>
  );
};

export default EventDetailModal;
