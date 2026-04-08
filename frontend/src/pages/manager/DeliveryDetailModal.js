import React, { useState, useEffect } from 'react';
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

import { orderAPI, getWorkingStaffToday } from '../../api/managerApi';
import '../../styles/DeliveryDetailModal.css';

const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.$values)) return payload.$values;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.data?.$values)) return payload.data.data.$values;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.$values)) return payload.data.$values;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.items?.$values)) return payload.data.items.$values;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.items?.$values)) return payload.items.$values;
  return [];
};

const isWaiterStaff = (staff) => {
  const role = String(staff?.role || staff?.staffRole || '').toLowerCase();
  const position = String(staff?.position || staff?.positionName || staff?.jobTitle || '').toLowerCase();
  return role.includes('waiter') || position.includes('waiter') || position.includes('phuc vu') || position.includes('phục vụ');
};

const mapDriver = (staff) => ({
  id: staff?.staffId ?? staff?.userId ?? staff?.id ?? staff?.workStaffId,
  staffId: staff?.staffId ?? staff?.userId ?? staff?.id ?? staff?.workStaffId,
  name: staff?.name || staff?.fullname || staff?.fullName || staff?.staffName || 'Nhân viên',
  status: staff?.status || 'Đang làm việc',
});

const uniqueById = (list) => {
  const seen = new Set();
  return list.filter((x) => {
    const key = String(x.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const extractApiErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof data?.title === 'string' && data.title.trim()) return data.title;

  const errors = data?.errors;
  if (errors && typeof errors === 'object') {
    const firstError = Object.values(errors)
      .flatMap((x) => (Array.isArray(x) ? x : [x]))
      .map((x) => String(x || '').trim())
      .find(Boolean);
    if (firstError) return firstError;
  }

  if (typeof error?.message === 'string' && error.message.trim()) return error.message;
  return fallback;
};

const DeliveryDetailModal = ({ isOpen, onClose, deliveryData, onUpdated, onNotify }) => {
  const [selectedDriver, setSelectedDriver] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [drivers, setDrivers] = useState([]);

  // Khi mở modal, fetch chi tiết đơn hàng nếu có orderId/code
  useEffect(() => {
    if (!isOpen) return;
    const orderCode = deliveryData?.code || deliveryData?.orderId;
    if (!orderCode) return;
    setLoading(true);
    setError('');
    orderAPI.getByCode(orderCode)
      .then(res => {
        const data = res?.data?.data || res?.data || res;
        setOrderDetail(data);
      })
      .catch(() => setError('Không thể tải chi tiết đơn hàng.'))
      .finally(() => setLoading(false));

    // Fetch drivers: chỉ lấy từ API "Nhân viên đang làm việc"
    (async () => {
      try {
        const allStaffRes = await getWorkingStaffToday();
        const waiterCandidates = asArray(allStaffRes?.data ?? allStaffRes).filter(isWaiterStaff);
        const mappedWaiters = uniqueById(waiterCandidates.map(mapDriver).filter((s) => s.id != null));
        setDrivers(mappedWaiters);
      } catch {
        setDrivers([]);
      }
    })();
  }, [isOpen, deliveryData]);

  if (!isOpen) return null;

  // Nếu đang loading hoặc lỗi
  if (loading) {
    return <div className="delivery-modal-overlay"><div className="delivery-modal-container"><div style={{padding: 40, textAlign: 'center'}}>Đang tải chi tiết đơn hàng...</div></div></div>;
  }
  if (error) {
    return <div className="delivery-modal-overlay"><div className="delivery-modal-container"><div style={{padding: 40, color: 'red', textAlign: 'center'}}>{error}</div></div></div>;
  }

  // Nếu có dữ liệu thực tế từ API thì ưu tiên render, nếu không fallback về dữ liệu mẫu
  const delivery = orderDetail ? {
    orderId: orderDetail.orderCode || orderDetail.code || orderDetail.id || '',
    customerName: orderDetail.delivery?.recipientName || orderDetail.customerName || orderDetail.title || '',
    phone: orderDetail.delivery?.recipientPhone || orderDetail.phone || '',
    address: orderDetail.delivery?.address || orderDetail.address || '',
    distance: orderDetail.distance || '',
    status: orderDetail.status || '',
    statusColor: orderDetail.statusClass === 'shipping' ? 'blue' :
                 orderDetail.statusClass === 'preparing' ? 'orange' :
                 orderDetail.statusClass === 'ready' ? 'green' :
                 orderDetail.statusClass === 'pending' ? 'gray' :
                 orderDetail.statusColor || 'gray',
    orderTime: orderDetail.orderTime || orderDetail.createdAt || '',
    menuItems: Array.isArray(orderDetail.items)
      ? orderDetail.items.map(item => ({
          name: item.itemName || item.foodName || item.name || '',
          quantity: item.quantity,
          price: item.unitPrice || item.price,
          total: item.totalPrice || item.subtotal || (item.quantity && (item.unitPrice || item.price) ? item.quantity * (item.unitPrice || item.price) : ''),
        }))
      : [],
    payment: {
      subtotal: orderDetail.subTotal ?? orderDetail.subtotal ?? orderDetail.totalBeforeDiscount ?? '',
      shippingFee: orderDetail.deliveryPrice ?? orderDetail.shippingFee ?? orderDetail.deliveryFee ?? orderDetail.feeShip ?? '',
      discount: orderDetail.discountAmount ?? orderDetail.discount ?? '',
      total: orderDetail.totalAmount ?? orderDetail.total ?? '',
    },
    drivers: drivers,
    assignedDriver: orderDetail.assignedDriver || null,
  } : {
    ...deliveryData,
    menuItems: Array.isArray(deliveryData?.menuItems) ? deliveryData.menuItems : [],
    payment: deliveryData?.payment || {},
    drivers: Array.isArray(deliveryData?.drivers) ? deliveryData.drivers : [],
  };

  const handleDriverChange = (e) => {
    setSelectedDriver(e.target.value);
  };

  const notify = (message) => {
    if (typeof onNotify === 'function') {
      onNotify(message);
      return;
    }
    alert(message);
  };

  const handleCancelOrder = async () => {
    const accepted = window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này?');
    if (!accepted) return;

    const orderCode = String(orderDetail?.orderCode || deliveryData?.code || delivery?.orderId || '').trim();
    if (!orderCode) {
      notify('Không xác định được mã đơn hàng để hủy.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = cancelReason.trim() ? { reason: cancelReason.trim() } : {};
      await orderAPI.deleteOrderDelivery(orderCode, payload);
      notify('Hủy đơn giao hàng thành công.');
      if (typeof onUpdated === 'function') onUpdated();
      onClose();
    } catch (e) {
      const message = extractApiErrorMessage(e, 'Không thể hủy đơn giao hàng. Vui lòng thử lại.');
      notify(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!selectedDriver && !delivery.assignedDriver) {
      notify('Vui lòng chọn nhân viên giao hàng');
      return;
    }

    const orderCode = String(orderDetail?.orderCode || deliveryData?.code || delivery?.orderId || '').trim();
    const assignedDriverId =
      delivery?.assignedDriver?.staffId ??
      delivery?.assignedDriver?.userId ??
      delivery?.assignedDriver?.id ??
      null;
    const staffIdValue = selectedDriver || assignedDriverId;
    const staffId = Number(staffIdValue);

    if (!orderCode) {
      notify('Không xác định được mã đơn hàng để giao.');
      return;
    }

    if (!Number.isFinite(staffId) || staffId <= 0) {
      notify('Mã nhân viên giao hàng không hợp lệ.');
      return;
    }

    try {
      setSubmitting(true);
      await orderAPI.chooseStaffDelivery(orderCode, staffId);
      await orderAPI.changeStatus(orderCode);
      notify('Xác nhận giao hàng thành công.');
      if (typeof onUpdated === 'function') onUpdated();
      onClose();
    } catch (e) {
      const message = extractApiErrorMessage(e, 'Không thể xác nhận giao hàng. Vui lòng thử lại.');
      notify(message);
    } finally {
      setSubmitting(false);
    }
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
                    {(delivery.menuItems || []).map((item, index) => (
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
                <span className="delivery-payment-value">{delivery.payment?.subtotal || ''}</span>
              </div>
              <div className="delivery-payment-row">
                <span className="delivery-payment-label">Phí ship</span>
                <span className="delivery-payment-value">{delivery.payment?.shippingFee || ''}</span>
              </div>
              <div className="delivery-payment-row">
                <span className="delivery-payment-label">Giảm giá</span>
                <span className="delivery-payment-value delivery-payment-discount">
                  {delivery.payment?.discount || ''}
                </span>
              </div>
              <div className="delivery-payment-total-row">
                <span className="delivery-payment-total-label">Tổng cộng</span>
                <span className="delivery-payment-total-amount">{delivery.payment?.total || ''}</span>
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
                      {(delivery.drivers || []).map((driver) => (
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
            disabled={submitting}
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
              disabled={submitting}
              onClick={handleConfirmDelivery}
            >
              <Send size={20} />
              {submitting ? 'Đang xử lý...' : 'Xác nhận & Giao hàng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetailModal;
