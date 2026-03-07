import React, { useState } from 'react';
import {
  X,
  Truck,
  Receipt,
  User,
  Phone,
  MapPin,
  Map,
  UserCog,
  Send,
  XCircle,
  Clock,
  UtensilsCrossed,
  ChevronDown
} from 'lucide-react';
import '../../styles/DeliveryDetailModal.css';

const DeliveryDetailModal = ({ isOpen, onClose, deliveryData }) => {
  const [selectedDriver, setSelectedDriver] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  if (!isOpen) return null;

  // Default delivery data with proper structure
  const defaultData = {
    orderId: 'VC003',
    customerName: 'Nguyễn Văn An',
    phone: '090 123 4567',
    address: '123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    distance: '4.8 km',
    status: 'Đang chế biến',
    statusColor: 'orange',
    orderTime: '10:30',
    
    menuItems: [
      {
        name: 'Phở Bò Đặc Biệt',
        quantity: 2,
        price: '95.000đ',
        total: '190.000đ'
      },
      {
        name: 'Gỏi Cuốn Tôm Thịt',
        quantity: 1,
        price: '65.000đ',
        total: '65.000đ'
      },
      {
        name: 'Trà Đào Cam Sả',
        quantity: 2,
        price: '45.000đ',
        total: '90.000đ'
      }
    ],
    
    payment: {
      subtotal: '345.000đ',
      shippingFee: '20.000đ',
      discount: '-15.000đ',
      total: '350.000đ'
    },
    
    drivers: [
      { id: '1', name: 'Trần Minh Tâm', status: 'Đang rảnh', available: true },
      { id: '2', name: 'Lê Hoàng Nam', status: 'Đang giao 1 đơn', available: false },
      { id: '3', name: 'Phạm Quốc Việt', status: 'Đang rảnh', available: true }
    ],
    
    assignedDriver: {
      id: '1',
      name: 'Trần Minh Tâm',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAW5hIHVeyhf-1JxlUvB6fEgJ4-n_gimrxjv0LKNu9qhxJNInpr1Z4mNmimAx37BW1qgwEPveIp7TTKBR5epmLVJmB-pZ5wsQ5AbT9SLIT9yemNkVwBAoVL0kg533FEr5dUupuzV_7Gg5CTmXKS9luJeT9aLF5WXACSsDhKsxvrj8UMGsa1w84FdJJ6mSBOeGmGzjbWen5hUQLTy8OJBu3kGmD5R1oOL6cL7wr4Om2MN8Q88Bal78flDc9JXyw-UrJaDO3MVUoA1yM',
      status: 'Sẵn sàng'
    }
  };

  // Merge deliveryData with defaults to ensure all required properties exist
  const delivery = {
    ...defaultData,
    ...deliveryData,
    orderId: deliveryData?.code || defaultData.orderId,
    customerName: deliveryData?.title || defaultData.customerName,
    status: deliveryData?.status || defaultData.status,
    menuItems: deliveryData?.menuItems || defaultData.menuItems,
    payment: deliveryData?.payment || defaultData.payment,
    drivers: deliveryData?.drivers || defaultData.drivers,
    assignedDriver: deliveryData?.assignedDriver || defaultData.assignedDriver,
    // Map statusClass to statusColor
    statusColor: deliveryData?.statusClass === 'shipping' ? 'blue' :
                 deliveryData?.statusClass === 'preparing' ? 'orange' :
                 deliveryData?.statusClass === 'ready' ? 'green' :
                 deliveryData?.statusClass === 'pending' ? 'gray' :
                 deliveryData?.statusColor || 'gray'
  };

  const handleDriverChange = (e) => {
    setSelectedDriver(e.target.value);
  };

  const handleCancelOrder = () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) {
      console.log('Cancel order:', delivery.orderId, 'Reason:', cancelReason);
      // TODO: Implement cancel order API call
      onClose();
    }
  };

  const handleConfirmDelivery = () => {
    if (!selectedDriver && !delivery.assignedDriver) {
      alert('Vui lòng chọn nhân viên giao hàng');
      return;
    }
    console.log('Confirm delivery:', delivery.orderId, 'Driver:', selectedDriver);
    // TODO: Implement confirm delivery API call
    onClose();
  };

  const getStatusBadgeClass = () => {
    switch (delivery.statusColor) {
      case 'orange':
        return 'delivery-status-orange';
      case 'blue':
        return 'delivery-status-blue';
      case 'green':
        return 'delivery-status-green';
      case 'gray':
      default:
        return 'delivery-status-gray';
    }
  };

  return (
    <div className="delivery-modal-overlay" onClick={onClose}>
      <div className="delivery-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="delivery-modal-header">
          <div className="delivery-header-content">
            <div className="delivery-header-icon">
              <Truck size={32} />
            </div>
            <div className="delivery-header-info">
              <div className="delivery-header-title-row">
                <h2 className="delivery-modal-title">
                  Chi tiết đơn vận chuyển #{delivery.orderId}
                </h2>
                <span className={`delivery-status-badge ${getStatusBadgeClass()}`}>
                  {delivery.status}
                </span>
              </div>
            </div>
          </div>
          <button className="delivery-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="delivery-modal-body">
          {/* Left Column - Menu Items */}
          <div className="delivery-left-column">
            {/* Menu Items Section */}
            <div className="delivery-section">
              <h3 className="delivery-section-title">
                <Receipt size={20} />
                Danh sách món ăn
              </h3>
              <div className="delivery-menu-table-wrapper">
                <table className="delivery-menu-table">
                  <thead>
                    <tr>
                      <th>Tên món</th>
                      <th className="text-center">SL</th>
                      <th className="text-right">Đơn giá</th>
                      <th className="text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delivery.menuItems.map((item, index) => (
                      <tr key={index}>
                        <td className="delivery-menu-item-name">{item.name}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right">{item.price}</td>
                        <td className="text-right delivery-menu-item-total">{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="delivery-payment-summary">
              <div className="delivery-payment-row">
                <span className="delivery-payment-label">Tạm tính</span>
                <span className="delivery-payment-value">{delivery.payment.subtotal}</span>
              </div>
              <div className="delivery-payment-row">
                <span className="delivery-payment-label">Phí ship</span>
                <span className="delivery-payment-value">{delivery.payment.shippingFee}</span>
              </div>
              <div className="delivery-payment-row">
                <span className="delivery-payment-label">Giảm giá</span>
                <span className="delivery-payment-value delivery-payment-discount">
                  {delivery.payment.discount}
                </span>
              </div>
              <div className="delivery-payment-total-row">
                <span className="delivery-payment-total-label">Tổng cộng</span>
                <span className="delivery-payment-total-amount">{delivery.payment.total}</span>
              </div>
            </div>
          </div>

          {/* Right Column - Customer Info & Delivery */}
          <div className="delivery-right-column">
            {/* Customer Information */}
            <div className="delivery-section">
              <h3 className="delivery-section-title">
                <User size={20} />
                Thông tin khách hàng
              </h3>
              <div className="delivery-customer-info">
                <div className="delivery-info-item">
                  <User size={20} className="delivery-info-icon" />
                  <div className="delivery-info-content">
                    <p className="delivery-info-label">Tên khách hàng</p>
                    <p className="delivery-info-value">{delivery.customerName}</p>
                  </div>
                </div>
                <div className="delivery-info-item">
                  <Phone size={20} className="delivery-info-icon" />
                  <div className="delivery-info-content">
                    <p className="delivery-info-label">Số điện thoại</p>
                    <p className="delivery-info-value">{delivery.phone}</p>
                  </div>
                </div>
                <div className="delivery-info-item">
                  <MapPin size={20} className="delivery-info-icon" />
                  <div className="delivery-info-content">
                    <p className="delivery-info-label">Địa chỉ giao hàng</p>
                    <p className="delivery-info-value delivery-address">{delivery.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Assignment */}
            <div className="delivery-section">
              <h3 className="delivery-section-title">
                <UserCog size={20} />
                Điều phối & Giao hàng
              </h3>
              <div className="delivery-assignment-section">
                <div className="delivery-form-group">
                  <label className="delivery-form-label">Nhân viên giao hàng</label>
                  <div className="delivery-select-wrapper">
                    <select
                      className="delivery-select"
                      value={selectedDriver}
                      onChange={handleDriverChange}
                    >
                      <option value="">Chọn nhân viên...</option>
                      {delivery.drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} ({driver.status})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={20} className="delivery-select-icon" />
                  </div>

                  {/* Assigned Driver Display */}
                  {delivery.assignedDriver && (
                    <div className="delivery-assigned-driver">
                      <div className="delivery-driver-avatar">
                        <img src={delivery.assignedDriver.avatar} alt={delivery.assignedDriver.name} />
                      </div>
                      <div className="delivery-driver-info">
                        <p className="delivery-driver-name">{delivery.assignedDriver.name}</p>
                        <p className="delivery-driver-status">
                          <span className="delivery-status-dot"></span>
                          {delivery.assignedDriver.status}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="delivery-form-group">
                  <label className="delivery-form-label">Lý do hủy đơn (nếu có)</label>
                  <textarea
                    className="delivery-textarea"
                    placeholder="Nhập lý do nếu cần hủy đơn hàng này..."
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="delivery-modal-footer">
          <button 
            className="delivery-btn-cancel-order"
            onClick={handleCancelOrder}
          >
            <XCircle size={20} />
            Hủy đơn hàng
          </button>
          <div className="delivery-footer-actions">
            <button className="delivery-btn-close" onClick={onClose}>
              Đóng
            </button>
            <button 
              className="delivery-btn-confirm"
              onClick={handleConfirmDelivery}
            >
              <Send size={20} />
              Xác nhận & Giao hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetailModal;
