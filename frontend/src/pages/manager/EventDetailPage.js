import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRoleSectionBasePath } from '../../hooks/useRoleSectionBasePath';
import { contractAPI, eventBookingAPI } from '../../api/managerApi';
import { 
  Calendar, CheckCircle, FileText, 
  ChevronRight, DollarSign,
  UtensilsCrossed, Scale
} from 'lucide-react';
import '../../styles/EventDetailPage.css';
import TransactionHistoryModal from '../../components/TransactionHistoryModal';
import { ORDER_VAT_RATE } from '../../constants/orderPricing';

/** Cùng logic đặt sự kiện (Services): VAT 10% trên (thực đơn + phí dịch vụ), không tính trên decoration. */

const createEmptyEventData = (eventId) => ({
  id: eventId || '',
  bookingCode: '',
  title: 'Chưa có dữ liệu sự kiện',
  venue: 'Chưa cập nhật',
  date: '--/--/----',
  time: '--:--',
  tables: 0,
  status: 'pending',
  operationStatus: 'pending',
  statusText: 'Chưa có hợp đồng',
  comboName: 'Chưa cập nhật',
  menu: [],
  policies: [],
  services: [],
  contractId: 0,
  contractCode: '',
  hasTransactions: false,
  hasContractLink: false,
  showConfirmPayment2: false,
  payment: {
    pricePerTable: 0,
    quantity: 0,
    subtotal: 0,
    serviceVAT: 0,
    decoration: 0,
    vatAmount: 0,
    total: 0,
    deposit: 0,
    remaining: 0,
  },
});

const EventDetailPage = () => {
  const { base } = useRoleSectionBasePath();
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [loadingAwaitingPayment, setLoadingAwaitingPayment] = useState(false);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [eventData, setEventData] = useState(() => createEmptyEventData(eventId));

  const statusLabelMap = {
    pending: 'Chờ duyệt / Chờ xử lý',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    confirmed: 'Đã xác nhận',
    active: 'Đang diễn ra',
    inprogress: 'Đang diễn ra',
    'in-progress': 'Đang diễn ra',
    awaitingfinalpayment: 'Chờ tất toán',
    'awaiting-final-payment': 'Chờ tất toán',
    cancelled: 'Đã hủy',
    canceled: 'Đã hủy',
    completed: 'Đã hoàn thành',
    draft: 'Nháp',
    sent: 'Đã gửi ký / Chờ khách ký',
    signed: 'Đã ký',
    deposited: 'Đã đặt cọc',
  };

  const toDateTime = (dateStr, timeStr) => {
    if (!dateStr) return { date: '--/--/----', time: '--:--' };
    const raw = /^\d{4}-\d{2}-\d{2}$/.test(String(dateStr))
      ? `${dateStr}T${timeStr || '00:00:00'}`
      : dateStr;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return { date: '--/--/----', time: '--:--' };
    return {
      date: date.toLocaleDateString('vi-VN'),
      time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const pickField = (obj, keys, fallback = null) => {
    for (const key of keys) {
      const value = obj?.[key];
      if (value !== undefined && value !== null && value !== '') return value;
    }
    return fallback;
  };

  const toNum = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const sumFoodLinesAmount = (foods) => {
    if (!Array.isArray(foods)) return 0;
    return foods.reduce((sum, m) => {
      const line = toNum(pickField(m, ['subtotal', 'lineTotal', 'total', 'Subtotal', 'LineTotal']), 0);
      if (line > 0) return sum + line;
      const qty = toNum(pickField(m, ['quantity', 'qty', 'Quantity']), 1);
      const unit = toNum(pickField(m, ['unitPrice', 'price', 'Price', 'UnitPrice']), 0);
      return sum + unit * qty;
    }, 0);
  };

  const sumServiceLinesAmount = (svcs) => {
    if (!Array.isArray(svcs)) return 0;
    return svcs.reduce((sum, s) => {
      const line = toNum(pickField(s, ['subtotal', 'total', 'Subtotal', 'Total']), 0);
      if (line > 0) return sum + line;
      const qty = toNum(pickField(s, ['quantity', 'Quantity']), 1);
      const unit = toNum(pickField(s, ['unitPrice', 'price', 'UnitPrice', 'Price']), 0);
      return sum + unit * qty;
    }, 0);
  };

  useEffect(() => {
    if (!actionNotice) return;
    const t = setTimeout(() => setActionNotice(''), 3200);
    return () => clearTimeout(t);
  }, [actionNotice]);

  useEffect(() => {
    const loadDetail = async () => {
      if (!eventId) {
        setLoading(false);
        setLoadError('Thiếu mã sự kiện.');
        return;
      }

      setLoading(true);
      setLoadError('');
      try {
        const res = await eventBookingAPI.getDetailById(eventId);
        const body = res?.data;
        const payload = body?.data?.data ?? body?.data ?? body;
        const detail = Array.isArray(payload) ? payload[0] : payload;

        if (!detail || typeof detail !== 'object') {
          setEventData(createEmptyEventData(eventId));
          return;
        }

        const customer = detail?.customer || {};
        const eventInfo = detail?.eventInfo || {};
        const contract = detail?.contract || {};
        const paymentData = detail?.payment || {};

        // Trạng thái hiển thị tổng quát (ưu tiên BookEvent, fallback Contract).
        const statusRaw = String(
          pickField(
            {
              bookEventStatus: detail?.bookEventStatus,
              eventStatus: detail?.eventStatus,
              status: detail?.status,
              bookingStatus: detail?.bookingStatus,
              contractStatus: contract?.status,
            },
            ['bookEventStatus', 'eventStatus', 'status', 'bookingStatus', 'contractStatus'],
            'pending'
          )
        ).toLowerCase();

        // Trạng thái vận hành để quyết định nút hành động (CHỈ lấy từ BookEvent, không lấy contractStatus).
        const operationStatusRaw = String(
          pickField(
            {
              bookEventStatus: detail?.bookEventStatus,
              eventStatus: detail?.eventStatus,
              status: detail?.status,
              bookingStatus: detail?.bookingStatus,
            },
            ['bookEventStatus', 'eventStatus', 'status', 'bookingStatus'],
            'pending'
          )
        ).toLowerCase();
        const dt = toDateTime(
          pickField(eventInfo, ['reservationDate', 'eventDate', 'date'])
            ?? pickField(detail, ['reservationDate', 'eventDate', 'date']),
          pickField(eventInfo, ['reservationTime', 'eventTime', 'time'])
            ?? pickField(detail, ['reservationTime', 'eventTime', 'time'])
        );

        let total = toNum(
          pickField(paymentData, ['totalAmount', 'total', 'grandTotal', 'GrandTotal'], 0)
            || pickField(detail, ['totalAmount', 'TotalAmount', 'grandTotal', 'GrandTotal'], 0),
          0
        );
        const deposit = toNum(pickField(paymentData, ['depositAmount', 'depositedAmount', 'deposit'], 0));
        const paidAmount = toNum(pickField(paymentData, ['paidAmount'], 0));
        const remainingRaw = pickField(paymentData, ['remainingAmount', 'remainAmount']);

        const explicitTables = pickField(eventInfo, ['numberOfTables', 'tableCount', 'tables'])
          ?? pickField(detail, ['numberOfTables', 'tableCount', 'tables']);
        const legacyTableCount = toNum(
          pickField(eventInfo, ['numberOfGuests', 'guestCount', 'guests'])
            ?? pickField(detail, ['numberOfGuests', 'guestCount', 'guests'], 0)
        );

        const explicitTableCount = toNum(explicitTables, 0);
        const quantity = explicitTableCount > 0 ? explicitTableCount : legacyTableCount;

        const menuItems = pickField(detail, ['foods', 'menuItems', 'items'], []);
        const computedServiceTotal = sumServiceLinesAmount(detail?.services);
        let computedFoodTotal = sumFoodLinesAmount(menuItems);
        if (
          quantity > 1 &&
          Array.isArray(menuItems) &&
          menuItems.length === 1 &&
          computedFoodTotal > 0
        ) {
          const m = menuItems[0];
          const lineQty = toNum(pickField(m, ['quantity', 'qty', 'Quantity']), 1);
          if (lineQty === 1) {
            const scaled = computedFoodTotal * quantity;
            if (
              Math.abs(total - scaled - computedServiceTotal) <=
                Math.abs(total - computedFoodTotal - computedServiceTotal) ||
              (total <= 0 && scaled > computedFoodTotal)
            ) {
              computedFoodTotal = scaled;
            }
          }
        }

        const rawPricePerTable = pickField(paymentData, ['pricePerTable', 'unitPrice', 'menuPricePerTable'])
          ?? pickField(detail, ['pricePerTable', 'unitPrice', 'menuPricePerTable'], null);
        let pricePerTable = toNum(rawPricePerTable, 0);
        if (pricePerTable <= 0 && quantity > 0 && computedFoodTotal > 0) {
          pricePerTable = Math.round(computedFoodTotal / quantity);
        }

        const rawMenuSub = pickField(paymentData, ['subtotal', 'subTotal', 'foodSubtotal', 'menuSubtotal']);
        let menuSubtotalAll = toNum(rawMenuSub, NaN);
        if (!Number.isFinite(menuSubtotalAll) || menuSubtotalAll <= 0) {
          menuSubtotalAll = computedFoodTotal > 0
            ? computedFoodTotal
            : (pricePerTable > 0 && quantity > 0 ? pricePerTable * quantity : 0);
        }

        const rawServiceFee = pickField(paymentData, [
          'serviceVAT', 'serviceFee', 'serviceTotal', 'servicesTotal', 'vat',
        ]);
        let serviceFee = toNum(rawServiceFee, NaN);
        if (!Number.isFinite(serviceFee) || serviceFee <= 0) {
          serviceFee = computedServiceTotal;
        }

        const rawDecoration = pickField(paymentData, ['decorationFee', 'decoration', 'extraFee', 'audioVisualFee']);
        let decoration = toNum(rawDecoration, NaN);
        if (!Number.isFinite(decoration) || decoration < 0) {
          decoration = 0;
        }

        const preVatForVat = menuSubtotalAll + serviceFee;
        const vatFromApi = toNum(pickField(paymentData, ['vatAmount', 'VatAmount']), NaN);
        const beforeVatFromApi = toNum(
          pickField(paymentData, ['amountBeforeVat', 'AmountBeforeVat']),
          NaN
        );
        let vatUiAmount = 0;
        let displayTotal = total;
        if (Number.isFinite(beforeVatFromApi) && beforeVatFromApi > 0 && Number.isFinite(vatFromApi) && vatFromApi > 0) {
          vatUiAmount = Math.round(vatFromApi);
          displayTotal = Math.round(beforeVatFromApi + vatUiAmount + decoration);
        } else if (preVatForVat > 0) {
          vatUiAmount = Math.round(preVatForVat * ORDER_VAT_RATE);
          const sumNoVat = menuSubtotalAll + serviceFee + decoration;
          const withVat = preVatForVat + vatUiAmount + decoration;
          if (total <= 0 || Math.abs(total - sumNoVat) <= 1) {
            displayTotal = withVat;
          } else if (total >= withVat - 2) {
            displayTotal = total;
            vatUiAmount = Math.max(0, Math.round(total - sumNoVat));
          }
        }

        const effectiveDeposit = Math.max(deposit, paidAmount);
        const remaining =
          remainingRaw !== null && remainingRaw !== undefined && String(remainingRaw).trim() !== ''
            ? toNum(remainingRaw, 0)
            : Math.max(displayTotal - effectiveDeposit, 0);

        const subtotal = menuSubtotalAll;
        const menu = Array.isArray(menuItems) && menuItems.length
          ? [{
            category: 'Thực đơn',
            items: menuItems.map((m) => ({
              name: pickField(m, ['name', 'dishName', 'foodName'], 'Món ăn'),
              description: pickField(m, ['description', 'note'], ''),
              price: toNum(pickField(m, ['subtotal'], toNum(pickField(m, ['price', 'unitPrice'], 0)))),
              note: pickField(m, ['note', 'cookingNote'], ''),
            })),
          }]
          : [];

        const services = Array.isArray(detail?.services)
          ? detail.services.map((s) => {
            const name = pickField(s, ['name', 'serviceName'], 'Dịch vụ');
            const qty = toNum(pickField(s, ['quantity', 'Quantity'], 0), 1);
            const line = toNum(pickField(s, ['subtotal', 'lineTotal', 'total', 'Subtotal']), 0);
            const unit = toNum(pickField(s, ['unitPrice', 'price', 'UnitPrice']), 0);
            const value = line > 0 ? line : unit * (qty || 1);
            if (qty > 0 && value > 0) return `${name} x${qty} - ${new Intl.NumberFormat('vi-VN').format(value)}đ`;
            if (qty > 0) return `${name} x${qty}`;
            return name;
          })
          : [];

        const terms = pickField(contract, ['termsAndConditions', 'terms', 'note'], '');
        const policies = terms
          ? String(terms)
            .split(/\r?\n|\.|;/)
            .map((x) => x.trim())
            .filter(Boolean)
          : [];

        const contractIdNum = toNum(
          pickField(contract, ['contractId', 'id', 'ContractId']),
          0
        );
        const contractCodeStr = String(
          pickField(contract, ['contractCode', 'code', 'ContractNumber']) || ''
        ).trim();
        const bookingCodeStr = String(
          pickField(detail, ['bookingCode', 'bookEventCode', 'eventCode', 'code']) || ''
        ).trim();
        const hasContractLink = contractIdNum > 0 || Boolean(contractCodeStr);

        const rawTx =
          detail?.transactions ??
          detail?.payment?.transactions ??
          detail?.paymentHistory ??
          detail?.payment?.history;
        const transactionsList = Array.isArray(rawTx)
          ? rawTx
          : Array.isArray(rawTx?.$values)
            ? rawTx.$values
            : [];
        const hasTransactions = transactionsList.length > 0;

        const showConfirmPayment2 =
          displayTotal > 0 && remaining > 0 && effectiveDeposit > 0;

        setEventData({
          id: pickField(detail, ['bookEventId', 'bookingCode', 'id'], eventId),
          bookingCode: bookingCodeStr,
          title: pickField(detail, ['eventTitle', 'eventName', 'title'], pickField(eventInfo, ['title', 'eventTitle'], `Sự kiện ${pickField(detail, ['bookingCode'], '')}`)),
          venue: pickField(detail, ['venue', 'hallName', 'location'], 'Chưa cập nhật'),
          date: dt.date,
          time: dt.time,
          tables: quantity,
          status: statusRaw,
          operationStatus: operationStatusRaw,
          statusText: statusLabelMap[statusRaw] || pickField(detail, ['status', 'contractStatus'], 'Chưa có hợp đồng'),
          comboName: pickField(detail, ['comboName', 'packageName', 'menuPackageName'], pickField(eventInfo, ['note'], 'Chưa cập nhật')),
          menu,
          policies,
          services,
          contractId: contractIdNum,
          contractCode: contractCodeStr,
          hasTransactions,
          hasContractLink,
          payment: {
            pricePerTable,
            quantity,
            subtotal,
            serviceVAT: serviceFee,
            decoration,
            vatAmount: vatUiAmount,
            total: displayTotal,
            deposit: effectiveDeposit,
            remaining,
          },
          showConfirmPayment2,
        });
      } catch (err) {
        console.error('Lỗi tải chi tiết đặt sự kiện:', err);
        setLoadError(err?.response?.data?.message || 'Không tải được chi tiết sự kiện.');
      } finally {
        setLoading(false);
      }
    };

    loadDetail();
  }, [eventId, refreshSeed]);

  const handleConfirmCheckout = async () => {
    const idNum = Number(eventData?.id || eventId);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      setActionNotice('Không tìm thấy mã sự kiện hợp lệ để xác nhận hoàn thành.');
      return;
    }
    try {
      setCheckingOut(true);
      setActionNotice('');
      const res = await eventBookingAPI.checkOut(idNum);
      const msg = res?.data?.message || 'Checkout thành công.';
      setActionNotice(msg);
      setRefreshSeed((v) => v + 1);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể xác nhận hoàn thành sự kiện.';
      setActionNotice(msg);
    } finally {
      setCheckingOut(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const normalizedOperationStatus = String(eventData?.operationStatus || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, '');
  const canConfirmComplete = normalizedOperationStatus === 'inprogress';
  const isAwaitingFinalPayment = normalizedOperationStatus === 'awaitingfinalpayment';
  const isClosedEventStatus =
    normalizedOperationStatus === 'completed' ||
    normalizedOperationStatus === 'cancelled' ||
    normalizedOperationStatus === 'canceled';
  const canConfirmInProgress = !canConfirmComplete && !isAwaitingFinalPayment && !isClosedEventStatus;

  const handleConfirmInProgress = () => {
    const params = new URLSearchParams();
    if (eventData?.bookingCode) params.set('bookingCode', String(eventData.bookingCode));
    if (Number(eventData?.tables) > 0) params.set('requiredTables', String(eventData.tables));
    const q = params.toString();
    navigate(`${base}/reservations/${eventData.id}/table-selection${q ? `?${q}` : ''}`);
  };

  const handleLoadAwaitingFinalPayment = async () => {
    const contractId = Number(eventData?.contractId || 0);
    if (!Number.isFinite(contractId) || contractId <= 0) {
      setActionNotice('Chưa có mã hợp đồng để lấy thông tin tất toán.');
      return;
    }
    try {
      setLoadingAwaitingPayment(true);
      setActionNotice('');
      const res = await contractAPI.getPaymentsByContractId(contractId);
      const payload = res?.data?.data ?? res?.data ?? {};
      const totalAmount = Number(payload?.totalAmount ?? payload?.contractTotal ?? 0);
      const paidAmount = Number(payload?.paidAmount ?? payload?.paidTotal ?? 0);
      const outstandingAmount = Number(
        payload?.outstandingAmount ?? payload?.remainingAmount ?? Math.max(totalAmount - paidAmount, 0)
      );
      setActionNotice(
        `Đã thu: ${formatCurrency(paidAmount)} / Tổng: ${formatCurrency(totalAmount)} / Còn lại: ${formatCurrency(Math.max(outstandingAmount, 0))}`
      );
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể lấy thông tin chờ tất toán.';
      setActionNotice(msg);
    } finally {
      setLoadingAwaitingPayment(false);
    }
  };

  if (loading) {
    return <div className="event-detail-page" style={{ padding: 24 }}>Đang tải chi tiết sự kiện...</div>;
  }

  if (loadError) {
    return <div className="event-detail-page" style={{ padding: 24, color: '#b91c1c' }}>{loadError}</div>;
  }

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
        <p className="event-subtitle">{eventData.title}{eventData.venue ? ` - ${eventData.venue}` : ''}</p>
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
                  {eventData.menu.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8', padding: '14px 0' }}>
                        Chưa có dữ liệu thực đơn từ hệ thống.
                      </td>
                    </tr>
                  )}
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
                  {eventData.policies.length === 0 && (
                    <li className="policy-item" style={{ color: '#94a3b8' }}>Chưa có điều khoản.</li>
                  )}
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
                  {eventData.services.length === 0 && (
                    <div className="service-badge" style={{ color: '#94a3b8' }}>Chưa có dịch vụ đi kèm.</div>
                  )}
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
              {eventData.payment.pricePerTable > 0 && (
                <div className="payment-row">
                  <span>Đơn giá thực đơn (/bàn)</span>
                  <span className="payment-value">{formatCurrency(eventData.payment.pricePerTable)}</span>
                </div>
              )}
              {eventData.payment.subtotal > 0 && (
                <div className="payment-row">
                  <span>Số lượng ({eventData.payment.quantity} bàn)</span>
                  <span className="payment-value">{formatCurrency(eventData.payment.subtotal)}</span>
                </div>
              )}
              {eventData.payment.serviceVAT > 0 && (
                <div className="payment-row">
                  <span>Phí dịch vụ</span>
                  <span className="payment-value">{formatCurrency(eventData.payment.serviceVAT)}</span>
                </div>
              )}
              {eventData.payment.decoration > 0 && (
                <div className="payment-row">
                  <span>Trang trí & Âm thanh</span>
                  <span className="payment-value">{formatCurrency(eventData.payment.decoration)}</span>
                </div>
              )}
              {eventData.payment.vatAmount > 0 && (
                <div className="payment-row">
                  <span>VAT (10%)</span>
                  <span className="payment-value">{formatCurrency(eventData.payment.vatAmount)}</span>
                </div>
              )}

              <hr className="payment-divider" />

              <div className="payment-row payment-total">
                <span>Tổng cộng</span>
                <span className="payment-total-value">{formatCurrency(eventData.payment.total)}</span>
              </div>

              <div className="payment-status-box">
                {eventData.payment.deposit > 0 && (
                  <div className="payment-deposit">
                    <span>Tiền cọc đã đóng (30%)</span>
                    <span className="deposit-amount">- {formatCurrency(eventData.payment.deposit)}</span>
                  </div>
                )}
                <div className="payment-remaining">
                  <span>Còn lại cần thanh toán</span>
                  <span className="remaining-amount">{formatCurrency(eventData.payment.remaining)}</span>
                </div>
              </div>

              {(eventData.showConfirmPayment2 ||
                eventData.hasTransactions ||
                eventData.hasContractLink) && (
                <div className="payment-actions">
                  {actionNotice && (
                    <div style={{
                      marginBottom: 8,
                      borderRadius: 10,
                      padding: '8px 10px',
                      border: '1px solid #ffd8bf',
                      background: '#fff7ed',
                      color: '#9a3412',
                      fontWeight: 600,
                      fontSize: 13,
                    }}>
                      {actionNotice}
                    </div>
                  )}
                  {eventData.showConfirmPayment2 && (
                    <button
                      type="button"
                      className="btn-confirm-payment"
                      onClick={
                        canConfirmComplete
                          ? handleConfirmCheckout
                          : isAwaitingFinalPayment
                            ? handleLoadAwaitingFinalPayment
                            : handleConfirmInProgress
                      }
                      disabled={checkingOut || loadingAwaitingPayment || isClosedEventStatus}
                    >
                      {checkingOut || loadingAwaitingPayment
                        ? (checkingOut ? 'Đang xác nhận...' : 'Đang tải công nợ...')
                        : canConfirmComplete
                          ? 'Xác nhận hoàn thành'
                          : canConfirmInProgress
                            ? 'Xác nhận diễn ra'
                            : isAwaitingFinalPayment
                              ? 'Đang chờ tất toán'
                              : 'Sự kiện đã hoàn tất'}
                    </button>
                  )}
                  {eventData.hasTransactions && (
                    <button
                      type="button"
                      className="btn-transaction-history"
                      onClick={() => setShowTransactionModal(true)}
                    >
                      Lịch sử giao dịch
                    </button>
                  )}
                  {eventData.hasContractLink && (
                    <button
                      type="button"
                      className="btn-transaction-history"
                      onClick={() => {
                        const code = eventData.contractCode || eventData.bookingCode;
                        const q = code ? `?bookingCode=${encodeURIComponent(code)}` : '';
                        navigate(`${base}/reservations/${eventData.id}/contract${q}`);
                      }}
                    >
                      Xem hợp đồng
                    </button>
                  )}
                </div>
              )}
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
