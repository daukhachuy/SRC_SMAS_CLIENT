import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  Share2,
  UtensilsCrossed,
  Clock,
  DollarSign,
  FileText,
  Edit,
} from 'lucide-react';
import PaymentModal from '../../components/PaymentModal';
import { orderAPI } from '../../api/managerApi';
import { downloadInvoicePdf, getPdfErrorMessage } from '../../api/pdfExportApi';
import '../../styles/DineInOrderDetailPage.css';

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.$values)) return value.$values;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.data?.$values)) return value.data.$values;
  return [];
};

const mapOrderStatusLabel = (status) => {
  const s = String(status || '').trim().toLowerCase();
  if (s === 'pending') return { label: 'Chờ xử lý', css: 'pending' };
  if (s === 'preparing' || s === 'processing') return { label: 'Đang chuẩn bị', css: 'preparing' };
  if (s === 'ready') return { label: 'Sẵn sàng', css: 'ready' };
  if (s === 'completed' || s === 'done') return { label: 'Hoàn thành', css: 'completed' };
  if (s === 'cancelled' || s === 'canceled') return { label: 'Đã hủy', css: 'cancelled' };
  return { label: status || '---', css: 'pending' };
};

const normalizeDetailOrder = (raw, fallbackCode) => {
  const items = asArray(raw?.items || raw?.orderItems).map((item) => {
    const unitPrice = Number(item?.unitPrice ?? item?.price ?? 0) || 0;
    const quantity = Number(item?.quantity ?? 0) || 0;
    const totalPrice = Number(item?.subtotal ?? item?.totalPrice ?? unitPrice * quantity) || 0;
    return {
      name: item?.itemName || item?.foodName || item?.name || '---',
      unitPrice,
      quantity,
      totalPrice,
      note: item?.note || '',
    };
  });

  const derivedSubtotal = items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);

  const statusMapped = mapOrderStatusLabel(raw?.orderStatus || raw?.status);
  const tables = asArray(raw?.tables);
  const mainTable = tables.find((t) => t?.isMainTable) || tables[0];

  return {
    ...raw,
    code: raw?.orderCode || raw?.code || fallbackCode,
    status: statusMapped.label,
    statusClass: statusMapped.css,
    items,
    subtotal: Number(raw?.subTotal ?? raw?.subtotal ?? derivedSubtotal) || 0,
    discount: Number(raw?.discountAmount ?? raw?.discount ?? 0) || 0,
    total: Number(raw?.totalAmount ?? raw?.total ?? (derivedSubtotal - (Number(raw?.discountAmount ?? raw?.discount ?? 0) || 0))) || 0,
    tableName: mainTable?.tableName || raw?.tableName || raw?.tableNumber || '',
    orderTime: raw?.createdAt
      ? new Date(raw.createdAt).toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : (raw?.orderTime || ''),
    waiter: raw?.servedBy?.fullname || raw?.waiter || '',
    waiterImage: raw?.servedBy?.avatar || raw?.waiterImage || '',
    customerNote: raw?.note || raw?.customerNote || '',
  };
};

const pickItemsFromAny = (payload) => {
  const direct = asArray(payload?.items || payload?.orderItems || payload);
  return direct;
};

const findOrderInCollection = (rows, orderCode, orderId) => {
  const code = String(orderCode || '').trim();
  const idNum = Number(orderId || 0);
  return (rows || []).find((row) => {
    const rowCode = String(row?.orderCode || row?.code || '').trim();
    const rowId = Number(row?.orderId || row?.id || 0);
    return (code && rowCode === code) || (idNum > 0 && rowId === idNum);
  });
};

function DineInOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get order ID from URL
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [invoicePdfLoading, setInvoicePdfLoading] = useState(false);


  // Decode the ID if it contains encoded characters
  const orderId = id ? decodeURIComponent(id) : null;
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    let mounted = true;

    const loadDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const detailRes = await orderAPI.getByCode(orderId);
        const detailData = detailRes?.data?.data || detailRes?.data || detailRes;

        let merged = detailData;
        const currentItems = asArray(detailData?.items || detailData?.orderItems);
        if (currentItems.length === 0) {
          let itemRows = [];

          try {
            const itemsRes = await orderAPI.getItems(orderId);
            const itemsData = itemsRes?.data?.data || itemsRes?.data || itemsRes;
            itemRows = pickItemsFromAny(itemsData);
          } catch {
            // Thu tiep endpoint items voi orderId so
          }

          if (itemRows.length === 0) {
            const numericOrderId = Number(detailData?.orderId || detailData?.id || 0);
            if (numericOrderId > 0) {
              try {
                const itemsResById = await orderAPI.getItems(numericOrderId);
                const itemsDataById = itemsResById?.data?.data || itemsResById?.data || itemsResById;
                itemRows = pickItemsFromAny(itemsDataById);
              } catch {
                // tiep tuc fallback history
              }
            }
          }

          if (itemRows.length === 0) {
            try {
              const [activeRes, historyRes] = await Promise.allSettled([
                orderAPI.getActive(),
                orderAPI.getHistory(),
              ]);

              const activeRows = activeRes.status === 'fulfilled'
                ? asArray(activeRes.value?.data?.data || activeRes.value?.data?.items || activeRes.value?.data || [])
                : [];

              const historyRows = historyRes.status === 'fulfilled'
                ? asArray(historyRes.value?.data?.data || historyRes.value?.data?.items || historyRes.value?.data || [])
                : [];

              const matched =
                findOrderInCollection(activeRows, orderId, detailData?.orderId || detailData?.id) ||
                findOrderInCollection(historyRows, orderId, detailData?.orderId || detailData?.id);

              if (matched) {
                itemRows = asArray(matched?.items || matched?.orderItems);
                merged = {
                  ...detailData,
                  ...matched,
                  items: itemRows,
                };
              }
            } catch {
              // bo qua neu history khong kha dung
            }
          }

          if (itemRows.length > 0) {
            merged = {
              ...merged,
              items: itemRows,
            };
          }
        }

        if (mounted) {
          setOrderData(normalizeDetailOrder(merged, orderId));
        }
      } catch (err) {
        if (mounted) {
          setError('Không thể tải chi tiết đơn hàng.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDetail();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('₫', 'đ');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleInvoicePdf = async () => {
    const code = String(orderData?.code || orderData?.orderCode || '').trim();
    if (!code) {
      window.alert('Không có mã đơn để tải PDF.');
      return;
    }
    setInvoicePdfLoading(true);
    try {
      await downloadInvoicePdf(code);
    } catch (e) {
      window.alert((await getPdfErrorMessage(e)) || 'Tải PDF thất bại.');
    } finally {
      setInvoicePdfLoading(false);
    }
  };

  if (loading) {
    return <div className="dinein-detail-page-wrapper"><div style={{padding: 40, textAlign: 'center'}}>Đang tải chi tiết đơn hàng...</div></div>;
  }
  if (error) {
    return <div className="dinein-detail-page-wrapper"><div style={{padding: 40, color: 'red', textAlign: 'center'}}>{error}</div></div>;
  }
  if (!orderData) {
    return <div className="dinein-detail-page-wrapper"><div style={{padding: 40, color: 'red', textAlign: 'center'}}>Không có dữ liệu đơn hàng.</div></div>;
  }

  return (
    <div className="dinein-detail-page-wrapper">
      {/* Header */}
      <header className="dinein-detail-header">
        <div className="dinein-detail-header-content">
          <div className="dinein-detail-header-left">
            <button className="dinein-detail-back-btn" onClick={handleGoBack}>
              <ArrowLeft size={18} />
              <span>Quay lại</span>
            </button>
            <div className="dinein-detail-divider"></div>
            <div>
              <div className="dinein-detail-title-group">
                <h1>Chi tiết đơn hàng {orderData.code || orderData.orderCode || orderId}</h1>
                <span className={`dinein-detail-status-badge status-${orderData.statusClass || orderData.status || ''}`}>
                  {orderData.status || '---'}
                </span>
              </div>
            </div>
          </div>
          <div className="dinein-detail-header-actions">
            <button
              type="button"
              className="dinein-detail-icon-btn"
              title="Tải PDF hóa đơn"
              disabled={invoicePdfLoading}
              onClick={handleInvoicePdf}
            >
              <Printer size={18} />
            </button>
            <button className="dinein-detail-icon-btn">
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dinein-detail-main">
        <div className="dinein-detail-container">
          {/* Left Column */}
          <div className="dinein-detail-left-column">
            {/* Menu Items Section */}
            <div className="dinein-detail-card">
              <div className="dinein-detail-card-header">
                <h3 className="dinein-detail-card-title">
                  <UtensilsCrossed size={18} />
                  Danh sách món ăn
                </h3>
                <span className="dinein-detail-items-count">
                  {orderData.items?.length || 0} Món • {(orderData.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0)} Phần
                </span>
              </div>
              <div className="dinein-detail-table-wrapper">
                <table className="dinein-detail-table">
                  <thead>
                    <tr>
                      <th>Tên món</th>
                      <th className="text-right">Đơn giá</th>
                      <th className="text-center">Số lượng</th>
                      <th className="text-right">Thành tiền</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(orderData.items || []).length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>
                          Chưa có món trong đơn hoặc dữ liệu món chưa đồng bộ.
                        </td>
                      </tr>
                    )}
                    {(orderData.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="dinein-detail-item-name">{item.name || item.foodName}</td>
                        <td className="text-right">{formatCurrency(item.unitPrice || item.price || 0)}</td>
                        <td className="text-center font-bold">{item.quantity || 0}</td>
                        <td className="text-right font-black">{formatCurrency(item.totalPrice || (item.price * item.quantity) || 0)}</td>
                        <td className="dinein-detail-item-note">{item.note || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Processing Stages */}
            <div className="dinein-detail-card">
              <h3 className="dinein-detail-card-title">
                <Clock size={18} />
                Trạng thái chế biến
              </h3>
              <div className="dinein-detail-stages">
                {(orderData.processingStages || []).length === 0 && (
                  <div className="dinein-detail-stages-empty">
                    Chưa có dữ liệu trạng thái chế biến cho đơn này.
                  </div>
                )}
                {(orderData.processingStages || []).map((stage, idx) => (
                  <div
                    key={idx}
                    className={`dinein-detail-stage ${stage.completed ? 'completed' : 'pending'}`}
                  >
                    <p className="dinein-detail-stage-label">{stage.label}</p>
                    <p className="dinein-detail-stage-time">
                      {stage.time || '--:--'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="dinein-detail-right-column">
            {/* General Info */}
            <div className="dinein-detail-card">
              <h3 className="dinein-detail-card-title">
                <FileText size={18} />
                Thông tin chung
              </h3>
              <div className="dinein-detail-info-group">
                <div className="dinein-detail-info-row">
                  <span>Loại đơn</span>
                  <span className="dinein-detail-info-value">
                    {`Ăn tại chỗ${orderData.tableNumber || orderData.tableName ? ` - ${orderData.tableNumber || orderData.tableName}` : ''}`}
                  </span>
                </div>
                <div className="dinein-detail-info-row">
                  <span>Thời gian gọi món</span>
                  <span className="dinein-detail-info-value">{orderData.orderTime || orderData.createdAt || ''}</span>
                </div>
                <div className="dinein-detail-info-row">
                  <span>Nhân viên phục vụ</span>
                  <div className="dinein-detail-waiter-info">
                    {orderData.waiterImage ? (
                      <img
                        src={orderData.waiterImage}
                        alt={orderData.waiter || ''}
                        className="dinein-detail-waiter-image"
                      />
                    ) : null}
                    <span>{orderData.waiter || ''}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="dinein-detail-card">
              <h3 className="dinein-detail-card-title">
                <DollarSign size={18} />
                Tóm tắt thanh toán
              </h3>
              <div className="dinein-detail-payment-summary">
                <div className="dinein-detail-payment-row">
                  <span>Tạm tính</span>
                  <span className="dinein-detail-payment-value">{formatCurrency(orderData.subtotal || 0)}</span>
                </div>
                <div className="dinein-detail-payment-row">
                  <span>Giảm giá</span>
                  <span className="dinein-detail-payment-discount">{formatCurrency(orderData.discount || 0)}</span>
                </div>
                <div className="dinein-detail-payment-total">
                  <span>Tổng cộng</span>
                  <span className="dinein-detail-total-amount">{formatCurrency(orderData.total || 0)}</span>
                </div>
              </div>
              <div className="dinein-detail-payment-buttons">
                <button
                  type="button"
                  className="dinein-detail-secondary-btn"
                  disabled={invoicePdfLoading}
                  onClick={handleInvoicePdf}
                >
                  <Printer size={16} />
                  {invoicePdfLoading ? 'Đang tải PDF…' : 'Tải PDF hóa đơn'}
                </button>
                <button className="dinein-detail-secondary-btn">
                  <Edit size={16} />
                  Chỉnh sửa
                </button>
              </div>
              <button
                className="dinein-detail-primary-btn"
                onClick={() => setIsPaymentModalOpen(true)}
              >
                THANH TOÁN
              </button>
            </div>

            {/* Customer Note */}
            {orderData.customerNote && (
              <div className="dinein-detail-customer-note">
                <p className="dinein-detail-note-label">Ghi chú từ khách hàng</p>
                <p className="dinein-detail-note-text">"{orderData.customerNote}"</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        orderData={orderData}
      />
    </div>
  );
}

export default DineInOrderDetailPage;
