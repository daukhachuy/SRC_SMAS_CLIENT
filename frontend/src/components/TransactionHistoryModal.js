import React from 'react';
import { X, CreditCard, Banknote, Building2, Printer } from 'lucide-react';
import '../styles/TransactionHistoryModal.css';

const TransactionHistoryModal = ({ eventId, onClose }) => {
  // Transaction data
  const transactions = [
    {
      id: 1,
      date: '10/10/2024 14:30',
      description: 'Đặt cọc giữ chỗ (30%)',
      method: 'cash',
      methodText: 'Tiền mặt',
      amount: 66375000,
      status: 'success',
      statusText: 'Thành công'
    },
    {
      id: 2,
      date: '15/11/2024 09:15',
      description: 'Thanh toán đợt 1',
      method: 'transfer',
      methodText: 'Chuyển khoản',
      amount: 50000000,
      status: 'success',
      statusText: 'Thành công'
    },
    {
      id: 3,
      date: '01/12/2024 16:45',
      description: 'Thanh toán đợt 2',
      method: 'card',
      methodText: 'Thẻ (VISA)',
      amount: 40000000,
      status: 'success',
      statusText: 'Thành công'
    }
  ];

  // Calculate totals
  const totalPaid = transactions.reduce((sum, t) => sum + t.amount, 0);
  const remaining = 221250000 - totalPaid; // Total event cost - paid

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'cash':
        return <Banknote size={16} />;
      case 'transfer':
        return <Building2 size={16} />;
      case 'card':
        return <CreditCard size={16} />;
      default:
        return <CreditCard size={16} />;
    }
  };

  return (
    <div className="transaction-modal-overlay" onClick={onClose}>
      <div 
        className="transaction-modal-container" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="transaction-modal-header">
          <div>
            <h2 className="transaction-modal-title">
              Lịch sử giao dịch - #{eventId}
            </h2>
            <p className="transaction-modal-subtitle">
              Chi tiết các đợt thanh toán cho sự kiện
            </p>
          </div>
          <button 
            className="transaction-modal-close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="transaction-modal-content">
          {/* Transaction Table */}
          <div className="transaction-table-wrapper">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Ngày giao dịch</th>
                  <th>Nội dung</th>
                  <th>Phương thức</th>
                  <th>Số tiền</th>
                  <th className="text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="transaction-date">{transaction.date}</td>
                    <td className="transaction-desc">{transaction.description}</td>
                    <td className="transaction-method">
                      <span className="method-wrapper">
                        {getPaymentIcon(transaction.method)}
                        {transaction.methodText}
                      </span>
                    </td>
                    <td className="transaction-amount">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className="text-center">
                      <span className={`status-badge status-${transaction.status}`}>
                        {transaction.statusText}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Box */}
          <div className="transaction-summary">
            <div className="summary-box">
              <div className="summary-row">
                <span className="summary-label">Tổng đã thanh toán</span>
                <span className="summary-value paid">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="summary-row summary-row-divider">
                <span className="summary-label">Số dư còn lại</span>
                <span className="summary-value remaining">{formatCurrency(remaining)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="transaction-modal-footer">
          <button className="btn-print">
            <Printer size={18} />
            In lịch sử
          </button>
          <button className="btn-close-modal" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionHistoryModal;
