import React, { useState, useEffect } from 'react';
import {
  X,
  ShoppingBag,
  User,
  Phone,
  MapPin,
  Calendar,
  Utensils,
  ChevronRight,
  Info,
  Star,
  Truck,
  Package,
  Headphones,
  Tag,
  CheckCircle,
} from 'lucide-react';
import { myOrderAPI } from '../api/myOrderApi';
import { createOrUpdateFeedback } from '../api/feedbackApi';
import { resolveOrderVatAndGrandTotal } from '../constants/orderPricing';
import '../styles/OrderDetailModal.css';

const FEEDBACK_TAGS = [
  { value: 'Chất lượng món', Icon: Utensils },
  { value: 'Giao hàng', Icon: Truck },
  { value: 'Đóng gói', Icon: Package },
  { value: 'Dịch vụ', Icon: Headphones },
  { value: 'Giá cả', Icon: Tag },
];

const RATING_LABELS = ['', 'Rất không hài lòng', 'Không hài lòng', 'Bình thường', 'Hài lòng', 'Rất tuyệt vời'];

const normalizeLineItem = (item) => {
  const qty = Number(item.quantity) || 0;
  const unit = Number(item.unitPrice ?? item.price ?? 0);
  const line =
    item.subtotal != null
      ? Number(item.subtotal)
      : item.lineTotal != null
        ? Number(item.lineTotal)
        : item.subTotal != null
          ? Number(item.subTotal)
          : qty * unit;
  const name = item.itemName ?? item.foodName ?? item.name ?? '—';
  return { ...item, itemName: name, quantity: qty, unitPrice: unit, lineTotal: line };
};

const OrderDetailModal = ({ order: orderProp, onClose, loading: loadingProp = false, error: errorProp = '' }) => {
  const [displayOrder, setDisplayOrder] = useState(orderProp);
  const [detailLoading, setDetailLoading] = useState(() => Boolean(orderProp?.orderCode));
  const [fetchError, setFetchError] = useState('');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackTag, setFeedbackTag] = useState(FEEDBACK_TAGS[0].value);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    if (!orderProp?.orderCode) {
      setDisplayOrder(orderProp);
      setDetailLoading(false);
      setFetchError('');
      return;
    }
    setDisplayOrder(orderProp);
    setFetchError('');
    setDetailLoading(true);
    let cancelled = false;
    const type = orderProp.orderType || 'Delivery';
    (async () => {
      try {
        const [fromFilter, fromGet, items] = await Promise.all([
          myOrderAPI.getOrderByCodeViaFilter(orderProp.orderCode, type).catch(() => null),
          myOrderAPI.getOrderByOrderCode(orderProp.orderCode).catch(() => null),
          myOrderAPI.getOrderItemsByOrderCode(orderProp.orderCode).catch(() => []),
        ]);
        if (cancelled) return;
        const itemList = Array.isArray(items) ? items : [];
        const merged = {
          ...orderProp,
          ...(fromGet && typeof fromGet === 'object' ? fromGet : {}),
          ...(fromFilter && typeof fromFilter === 'object' ? fromFilter : {}),
          items:
            itemList.length > 0
              ? itemList
              : fromFilter?.items ||
                fromFilter?.orderItems ||
                fromGet?.items ||
                orderProp.items ||
                [],
          orderStatus:
            fromFilter?.orderStatus ??
            fromGet?.orderStatus ??
            orderProp.orderStatus ??
            orderProp.displayStatus,
          status:
            fromFilter?.orderStatus ??
            fromGet?.orderStatus ??
            orderProp.status ??
            orderProp.displayStatus,
        };
        setDisplayOrder(merged);
      } catch (e) {
        if (!cancelled) {
          setFetchError(
            e?.response?.data?.message ||
              e?.response?.data?.title ||
              e?.message ||
              'Không tải được chi tiết đơn.'
          );
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderProp?.orderCode, orderProp?.orderType]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (!orderProp) return null;

  const order = displayOrder ?? orderProp;
  const loading = detailLoading || loadingProp;
  const error = fetchError || errorProp;

  // Chuyển ISO UTC → giờ Việt Nam (UTC+7)
  const toVietnamTime = (isoStr) => {
    if (!isoStr) return null;
    const m = String(isoStr).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (!m) {
      const d = new Date(isoStr);
      return isNaN(d.getTime()) ? null : d;
    }
    const [, y, mo, d, h, mi, s] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(h) + 7, Number(mi), Number(s));
  };

  const fmtVN = (date) => {
    if (!date) return '—';
    return date.toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const items = (order.items || []).map(normalizeLineItem);
  const orderDate = fmtVN(toVietnamTime(order.createdAt));

  const sumFromLines = items.reduce(
    (sum, item) => sum + (item.lineTotal ?? item.quantity * item.unitPrice),
    0
  );
  const apiSub = order.subTotal != null ? Number(order.subTotal) : null;
  const subtotal =
    apiSub != null && !Number.isNaN(apiSub) ? apiSub : sumFromLines;

  const deliveryFee =
    Number(
      order.deliveryPrice ??
        order.deliveryFee ??
        order.shippingFee ??
        order.delivery?.fee ??
        order.delivery?.shippingFee ??
        0
    ) || 0;
  const discountAmount = Number(order.discountAmount ?? order.discount ?? 0) || 0;
  const billing = resolveOrderVatAndGrandTotal({
    subtotal,
    deliveryFee,
    discountAmount,
    apiTotalAmount: order.totalAmount,
    apiTaxAmount: order.taxAmount ?? order.vatAmount ?? order.VatAmount,
  });
  const taxAmount = billing.vat;
  const grandTotal = billing.grand;

  const toVietnameseOrderStatus = (rawStatus) => {
    const s = String(rawStatus ?? '').trim().toLowerCase();
    if (!s) return 'Đang xử lý';
    if (s === 'pending') return 'Chờ xác nhận';
    if (s === 'confirmed') return 'Đã xác nhận';
    if (s === 'processing') return 'Đang xử lý';
    if (s === 'shipping' || s === 'delivering') return 'Đang giao';
    if (s === 'completed' || s === 'complete') return 'Hoàn thành';
    if (s === 'cancelled' || s === 'canceled' || s === 'cancel') return 'Đã hủy';
    if (s === 'seated') return 'Đã đến';
    return String(rawStatus || 'Đang xử lý');
  };

  const statusLabel = toVietnameseOrderStatus(
    order.orderStatus || order.status || order.displayStatus || 'Đang xử lý'
  );
  /** Hiện nút đánh giá: đúng `order.status === 'Completed'` hoặc backend trả orderStatus/COMPLETED */
  const rawForCompleted = String(order.status ?? order.orderStatus ?? order.displayStatus ?? '').trim();
  const isCompleted =
    order.status === 'Completed' ||
    order.orderStatus === 'Completed' ||
    rawForCompleted.toLowerCase() === 'completed' ||
    rawForCompleted.toLowerCase() === 'complete';

  const fmtMoney = (amount) => (amount ?? 0).toLocaleString();

  const openFeedbackModal = () => {
    setFeedbackRating(5);
    setFeedbackTag(FEEDBACK_TAGS[0].value);
    setFeedbackComment('');
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    const code = order.orderCode;
    if (!code) {
      setToast({ type: 'error', message: 'Thiếu mã đơn hàng.' });
      return;
    }
    setFeedbackSubmitting(true);
    try {
      await createOrUpdateFeedback({
        orderCode: String(code),
        rating: feedbackRating,
        comment: (feedbackComment || '').trim(),
        feedbackType: feedbackTag,
      });
      setShowFeedbackModal(false);
      setFeedbackSubmitted(true);
      setToast({ type: 'success', message: 'Cảm ơn bạn đã đánh giá dịch vụ!' });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.title ||
        e?.message ||
        'Gửi đánh giá thất bại. Vui lòng thử lại.';
      setToast({ type: 'error', message: msg });
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const getStatusClass = (status) => {
    const s = String(status ?? '').toLowerCase();
    if (s === 'pending' || s.includes('chờ')) return 'od-status-orange';
    if (s === 'shipping' || s === 'delivering' || s.includes('đang giao')) return 'od-status-blue';
    if (s === 'completed' || s === 'complete' || s.includes('hoàn thành') || s.includes('thành công') || s.includes('đã xác nhận')) return 'od-status-green';
    if (s === 'cancelled' || s === 'canceled' || s === 'cancel' || s.includes('đã hủy')) return 'od-status-gray';
    return 'od-status-gray';
  };

  return (
    <div className="od-modal-overlay" onClick={(e) => e.target.className === 'od-modal-overlay' && onClose()}>
      <div className="od-modal-container" style={{ position: 'relative' }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              background: 'rgba(255,255,255,0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'inherit',
            }}
          >
            <span style={{ fontSize: '0.95rem', color: '#64748b' }}>Đang tải chi tiết…</span>
          </div>
        )}
        
        {/* HEADER SECTION */}
        <div className="od-modal-header">
          <div className="od-header-main">
            <div className="od-icon-wrapper">
              <ShoppingBag size={24} />
            </div>
            <div className="od-title-area">
              <div className="od-title-row">
                <h2 className="od-modal-title">Chi tiết đơn hàng</h2>
                <span className={`od-status-badge ${getStatusClass(statusLabel)}`}>
                  {statusLabel}
                </span>
              </div>
              <p className="od-subtitle">Mã đơn: <strong>#{order.orderCode}</strong></p>
            </div>
          </div>
          <button className="od-close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {error ? (
          <div
            style={{
              margin: '0 24px 12px',
              padding: '10px 12px',
              background: '#fef2f2',
              color: '#b91c1c',
              borderRadius: 8,
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        ) : null}

        {/* BODY SECTION */}
        <div className="od-modal-body">
          
          {/* CỘT TRÁI: DANH SÁCH MÓN & TỔNG TIỀN */}
          <div className="od-content-left">
            <div className="od-section">
              <h3 className="od-section-label">
                <Utensils size={18} /> Món ăn đã đặt
              </h3>
              <div className="od-table-container">
                <table className="od-items-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th className="text-center">SL</th>
                      <th className="text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 && !loading && (
                      <tr>
                        <td colSpan={3} style={{ color: '#64748b', fontSize: '0.9rem' }}>
                          Không có dòng món chi tiết (API không trả danh sách).
                        </td>
                      </tr>
                    )}
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="od-item-info">
                            <span className="od-item-name">{item.itemName}</span>
                            <span className="od-item-unit">{fmtMoney(item.unitPrice)}đ</span>
                          </div>
                        </td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-right od-item-price">
                          {fmtMoney(item.lineTotal ?? item.quantity * item.unitPrice)}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="od-billing-card">
              <div className="od-billing-row">
                <span>Tạm tính</span>
                <span>{fmtMoney(subtotal)}đ</span>
              </div>
              {taxAmount > 0 && (
                <div className="od-billing-row">
                  <span>VAT (10%)</span>
                  <span>+{fmtMoney(taxAmount)}đ</span>
                </div>
              )}
              <div className="od-billing-row">
                <span>Phí vận chuyển</span>
                <span>{deliveryFee > 0 ? `+${fmtMoney(deliveryFee)}đ` : 'Miễn phí'}</span>
              </div>
              {discountAmount > 0 && (
                <div className="od-billing-row" style={{ color: '#16a34a' }}>
                  <span>Giảm giá</span>
                  <span>-{fmtMoney(discountAmount)}đ</span>
                </div>
              )}
              <div className="od-billing-total">
                <span className="od-total-label">TỔNG CỘNG</span>
                <span className="od-total-amount">{fmtMoney(grandTotal)}đ</span>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: THÔNG TIN GIAO NHẬN */}
          <div className="od-content-right">
            <div className="od-section">
              <h3 className="od-section-label">Thông tin giao nhận</h3>
              <div className="od-details-list">
                <div className="od-detail-item">
                  <User size={16} className="od-detail-icon" />
                  <div className="od-detail-text">
                    <label>Khách hàng</label>
                    <p>
                      {order.delivery?.recipientName ||
                        order.customer?.fullName ||
                        order.customer?.fullname ||
                        'Khách hàng'}
                    </p>
                  </div>
                </div>
                <div className="od-detail-item">
                  <Phone size={16} className="od-detail-icon" />
                  <div className="od-detail-text">
                    <label>Số điện thoại</label>
                    <p>
                      {order.delivery?.phone ||
                        order.customer?.phone ||
                        order.delivery?.recipientPhone ||
                        'Chưa cập nhật'}
                    </p>
                  </div>
                </div>
                <div className="od-detail-item">
                  <MapPin size={16} className="od-detail-icon" />
                  <div className="od-detail-text">
                    <label>Địa chỉ nhận</label>
                    <p className="od-address-text">{order.delivery?.address || 'Tại nhà hàng'}</p>
                  </div>
                </div>
                <div className="od-detail-item">
                  <Calendar size={16} className="od-detail-icon" />
                  <div className="od-detail-text">
                    <label>Thời gian đặt</label>
                    <p>{orderDate}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="od-note-box">
              <div style={{ display: 'flex', gap: '8px', color: '#64748b' }}>
                <Info size={16} />
                <p style={{ fontSize: '0.85rem', margin: 0 }}>
                  {isCompleted
                    ? feedbackSubmitted
                      ? 'Cảm ơn bạn đã gửi đánh giá.'
                      : 'Đơn đã hoàn thành — bạn có thể đánh giá dịch vụ bằng nút bên dưới.'
                    : 'Bạn chỉ có thể đánh giá dịch vụ sau khi đơn hàng đã hoàn thành.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER SECTION */}
        <div className="od-modal-footer">
          <div className="od-modal-footer-left">
            {isCompleted && !feedbackSubmitted && (
              <button
                type="button"
                className="od-btn-feedback"
                onClick={openFeedbackModal}
                disabled={!!loading}
              >
                Đánh giá dịch vụ
              </button>
            )}
            {feedbackSubmitted && (
              <span className="od-feedback-sent-label">Đã gửi đánh giá</span>
            )}
          </div>
          <div className="od-modal-footer-actions">
            <button type="button" className="od-btn-secondary" onClick={onClose}>
              Đóng
            </button>
            <button type="button" className="od-btn-primary" onClick={onClose}>
              Xác nhận <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {showFeedbackModal && (
          <div
            className="od-feedback-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="od-feedback-order-label"
            onClick={() => !feedbackSubmitting && setShowFeedbackModal(false)}
          >
            <div className="od-feedback-modal" onClick={(e) => e.stopPropagation()}>
              <div className="od-feedback-head">
                <div className="od-feedback-head-icon" aria-hidden>
                  <ShoppingBag size={22} />
                </div>
                <div className="od-feedback-head-text">
                  <span id="od-feedback-order-label" className="od-feedback-order-label">
                    Mã đơn hàng
                  </span>
                  <strong className="od-feedback-order-code">Order #{order.orderCode}</strong>
                </div>
                <button
                  type="button"
                  className="od-close-button od-feedback-close"
                  onClick={() => !feedbackSubmitting && setShowFeedbackModal(false)}
                  aria-label="Đóng"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="od-feedback-body">
                <div>
                  <p className="od-feedback-section-title">Đánh giá chung</p>
                  <div className="od-feedback-stars" role="group" aria-label="Chọn từ 1 đến 5 sao">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`od-feedback-star-btn ${n <= feedbackRating ? 'od-feedback-star-btn--on' : ''}`}
                        onClick={() => setFeedbackRating(n)}
                        aria-label={`${n} sao`}
                        aria-pressed={n <= feedbackRating}
                      >
                        <Star size={32} strokeWidth={1.25} fill={n <= feedbackRating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <p className="od-feedback-rating-label">{RATING_LABELS[feedbackRating]}</p>
                </div>

                <div>
                  <p className="od-feedback-tags-title">Bạn hài lòng về điều gì?</p>
                  <div className="od-feedback-tags">
                    {FEEDBACK_TAGS.map(({ value, Icon }) => (
                      <button
                        key={value}
                        type="button"
                        className={`od-feedback-tag ${feedbackTag === value ? 'od-feedback-tag--selected' : ''}`}
                        onClick={() => setFeedbackTag(value)}
                      >
                        <Icon size={16} />
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="od-feedback-label-comment" htmlFor="od-feedback-comment">
                    Chia sẻ thêm cảm nhận
                  </label>
                  <textarea
                    id="od-feedback-comment"
                    className="od-feedback-textarea"
                    placeholder="Món ăn rất vừa miệng, nóng hổi khi đến nơi. Tôi rất hài lòng!"
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    maxLength={2000}
                    rows={5}
                  />
                </div>
              </div>

              <div className="od-feedback-footer">
                <button
                  type="button"
                  className="od-feedback-btn-submit"
                  disabled={feedbackSubmitting}
                  onClick={handleSubmitFeedback}
                >
                  {feedbackSubmitting ? (
                    'Đang gửi…'
                  ) : (
                    <>
                      <span className="od-feedback-submit-icon-wrap">
                        <CheckCircle size={14} strokeWidth={2.5} />
                      </span>
                      Xác nhận
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="od-feedback-btn-close"
                  disabled={feedbackSubmitting}
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className={`od-toast od-toast--${toast.type}`} role="status">
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailModal;