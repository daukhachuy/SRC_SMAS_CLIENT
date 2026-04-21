import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  CreditCard,
  LayoutGrid,
  MapPin,
  Phone,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  TicketPercent,
  Trash2,
  User,
  Users,
  Utensils,
  Printer,
  X,
  ClipboardList,
} from 'lucide-react';
import '../../styles/WaiterPages.css';
import { orderAPI } from '../../api/managerApi';
import {
  createGuestOrder,
  createOrderByReservation,
  createOrderByContact,
  addItemsToOrder,
  getFoodsBufferByOrderCode,
  checkReservationAvailabilityByPhoneOrEmail,
} from '../../api/orderApi';
import { getFoodByFilter, getBuffetLists, getComboLists } from '../../api/foodApi';
import { patchOrderItemServed } from '../../api/orderItemApi';
import { createHubConnection, KITCHEN_HUB } from '../../realtime/signalrClient';
import { apiCancelItem } from '../../api/kitchenOrderApi';
import { createRemainingPaymentQr, payOrderCash } from '../../api/paymentService';
import { getWaiterTables } from '../../api/waiterApiTable';
import { initTableSession } from '../../api/tableSessionApi';
import { getProfile } from '../../api/userApi';
import { ORDER_VAT_RATE, resolveOrderVatAndGrandTotal, roundOrderMoney } from '../../constants/orderPricing';
import { printSalesInvoice } from '../../utils/orderInvoicePrint';
import { downloadInvoicePdf, getPdfErrorMessage } from '../../api/pdfExportApi';
import TableQRCode from '../../components/TableQRCode';
import TableCheckModal from '../../components/TableCheckModal';

// Helper: formatCurrency
const formatCurrency = (value) => {
  const n = Number(value);
  return n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
}
// Helper: getOrderItemsSummary
const getOrderItemsSummary = (order) => {
  if (!order.items || !order.items.length) return 'Không có món';
  return order.items.map((item) => `${item.name} (${item.quantity})`).join(', ');
}

const WaiterOrdersPage = () => {


// Helper: getDishStatus trả về object cho UI trạng thái món ăn
const getDishStatus = (status) => {
  switch (status) {
    case 'ready':
      return { cls: 'dish-status-ready', label: 'Sẵn sàng' };
    case 'served':
      return { cls: 'dish-status-served', label: 'Đã phục vụ' };
    case 'preparing':
      return { cls: 'dish-status-preparing', label: 'Đang làm' };
    case 'cancelled':
      return { cls: 'dish-status-cancelled', label: 'Đã hủy món' };
    case 'pending':
    default:
      return { cls: 'dish-status-pending', label: 'Chờ xử lý' };
  }
}

const getDeliveryActionClass = (label) => {
  const normalized = normalizeStatus(label);
  if (normalized.includes('hoan thanh') || normalized.includes('hoàn thành')) return 'delivery-complete';
  if (normalized.includes('bat dau') || normalized.includes('bắt đầu')) return 'delivery-start';
  if (normalized.includes('cho thanh toan') || normalized.includes('chờ thanh toán')) return 'delivery-wait-pay';
  if (normalized.includes('da giao') || normalized.includes('đã giao')) return 'delivery-done';
  if (normalized.includes('da huy') || normalized.includes('đã hủy')) return 'delivery-cancelled';
  return 'delivery-start';
};

const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.$values)) return payload.$values;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.$values)) return payload.data.$values;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.history)) return payload.history;
  return [];
};

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

const normalizeOrderType = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, '');

const isDineInOrder = (order) => normalizeOrderType(order?.channel || order?.orderType) === 'dinein';

const isDeliveryOrder = (order) => normalizeOrderType(order?.channel || order?.orderType) === 'delivery';

const resolveOrderCode = (order) =>
  String(order?.orderCode || order?.id || order?.code || '')
    .replace(/^#/, '')
    .trim();

const mapOrderStatus = (status) => {
  const s = normalizeStatus(status);
  if (s === 'pending') return { status: 'pending', statusLabel: 'Chờ xử lý' };
  if (s === 'confirmed') return { status: 'pending', statusLabel: 'Chờ xử lý' };
  if (s === 'preparing' || s === 'processing') return { status: 'preparing', statusLabel: 'Đang làm' };
  if (s === 'delivering' || s === 'shipping') return { status: 'delivering', statusLabel: 'Đang giao' };
  if (s === 'ready') return { status: 'ready', statusLabel: 'Sẵn sàng' };
  if (s === 'completed' || s === 'done') return { status: 'completed', statusLabel: 'Hoàn thành' };
  if ([
    'cancelled', 'canceled', 'rejected', 'voided', 'cancel', 'huy', 'đã hủy', 'da huy', 'hủy bàn', 'huy ban'
  ].includes(s)) {
    return { status: 'cancelled', statusLabel: 'Đã hủy bàn' };
  }
  return { status: 'pending', statusLabel: 'Chờ xử lý' };
};

const mapDishStatus = (status) => {
  const s = normalizeStatus(status);
  if (['cancelled', 'canceled', 'void', 'voided'].includes(s)) return 'cancelled';
  if (s === 'ready' || s === 'completed') return 'ready';
  if (s === 'served' || s === 'delivered') return 'served';
  if (s === 'preparing' || s === 'processing' || s === 'cooking') return 'preparing';
  return 'pending';
};

const canStartDeliveryByItems = (order) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (items.length === 0) return false;
  return items.every((item) =>
    ['ready', 'served', 'completed', 'cancelled'].includes(String(item?.dishStatus || '').toLowerCase())
  );
};

/** ID dòng order-item cho API (một dòng UI có thể gộp nhiều orderItemId). */
const resolveOrderItemNumericIds = (item) => {
  const raw = [
    ...(Array.isArray(item?.orderItemIds) ? item.orderItemIds : []),
    item?.id,
    item?.orderItemId,
    item?.itemId,
  ];
  return Array.from(new Set(raw.map((x) => Number(x || 0)).filter((x) => Number.isFinite(x) && x > 0)));
};

const WAITER_CANCEL_ITEM_QUICK_REASONS = [
  'Khách đổi món',
  'Hết nguyên liệu / hết món',
  'Khách hủy món',
  'Nhập nhầm món',
];

const mapDeliveryWorkflowStatus = (status) => {
  const s = normalizeStatus(status);
  if (['pickingup', 'assigned', 'confirmed', 'pending'].includes(s)) {
    return { status: 'pending', statusLabel: 'Chờ lấy hàng', actionLabel: 'BẮT ĐẦU GIAO' };
  }
  if (['delivering', 'shipping', 'onroute', 'intransit'].includes(s)) {
    return { status: 'delivering', statusLabel: 'Đang giao', actionLabel: 'HOÀN THÀNH GIAO' };
  }
  if (['completed', 'done', 'delivered', 'success'].includes(s)) {
    return { status: 'completed', statusLabel: 'Đã giao', actionLabel: 'ĐÃ GIAO' };
  }
  if (['cancelled', 'canceled', 'failed'].includes(s)) {
    return { status: 'cancelled', statusLabel: 'Giao thất bại', actionLabel: 'ĐÃ HỦY' };
  }
  return { status: 'pending', statusLabel: 'Chờ xử lý', actionLabel: 'CẬP NHẬT TRẠNG THÁI' };
};

const PAID_PAYMENT_STATUSES = new Set([
  'paid',
  'success',
  'completed',
  'done',
  'settled',
  'captured',
  'authorized',
  'succeeded',
]);

const isPaidPaymentStatusString = (raw) => {
  const s = normalizeStatus(raw);
  if (!s) return false;
  if (PAID_PAYMENT_STATUSES.has(s)) return true;
  if (s.includes('da thanh toan') || s.includes('đã thanh toán')) return true;
  if (s.includes('thanh toan') && (s.includes('roi') || s.includes('rồi') || s.includes('xong'))) return true;
  return false;
};

const isPaidOrder = (order) => {
  if (!order || typeof order !== 'object') return false;
  if (order.isPaid === true || order.IsPaid === true) return true;

  const paymentObj = order.payment && typeof order.payment === 'object' ? order.payment : null;
  if (paymentObj?.isPaid === true || paymentObj?.IsPaid === true) return true;

  const statusFields = [
    order.paymentStatus,
    order.PaymentStatus,
    order.paymentState,
    order.financialStatus,
    paymentObj?.status,
    paymentObj?.paymentStatus,
    paymentObj?.state,
  ];
  for (const f of statusFields) {
    if (isPaidPaymentStatusString(f)) return true;
  }

  const normalizedOrderStatus = normalizeStatus(order?.orderStatus || order?.status);
  if (['paid', 'completed', 'done', 'closed'].includes(normalizedOrderStatus)) return true;
  if (normalizedOrderStatus.includes('thanh toan') && normalizedOrderStatus.includes('da')) return true;

  if (order.prepaid === true || order.isPrepaid === true || order.Prepaid === true) return true;
  if (order.paidBeforeDelivery === true || order.paidBeforeShip === true) return true;

  const paidAmount = Number(
    order?.paidAmount ?? paymentObj?.paidAmount ?? order?.amountPaid ?? 0
  );
  const totalAmount = Number(
    order?.totalAmount ?? paymentObj?.totalAmount ?? order?.total ?? 0
  );
  if (Number.isFinite(paidAmount) && Number.isFinite(totalAmount) && totalAmount > 0 && paidAmount >= totalAmount) {
    return true;
  }

  const payments = Array.isArray(order?.payments)
    ? order.payments
    : Array.isArray(paymentObj?.payments)
      ? paymentObj.payments
      : [];
  if (
    payments.some((p) => {
      const s = normalizeStatus(p?.status || p?.paymentStatus || p?.state);
      return PAID_PAYMENT_STATUSES.has(s) || s.includes('da thanh toan') || s.includes('đã thanh toán');
    })
  ) {
    return true;
  }

  return false;
};

const toCurrencyNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const isOrderLikeHistoryRow = (item) =>
  Boolean(item?.orderId || item?.orderCode || item?.createdAt || item?.orderStatus || item?.closedAt || item?.items);

const mapServiceHistoryItem = (item, idx) => {
  const rawDate = item?.date || item?.workDate || item?.servedDate || item?.createdAt || item?.day;
  const date = rawDate
    ? new Date(rawDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : `Ngày ${idx + 1}`;

  const totalOrders = Number(
    item?.totalOrders ?? item?.orderCount ?? item?.orders ?? item?.count ?? 0
  );

  const revenueNumber = toCurrencyNumber(
    item?.revenue ?? item?.totalRevenue ?? item?.totalAmount ?? item?.amount ?? 0
  );

  const rawRating = item?.rating ?? item?.avgRating ?? item?.averageRating;
  const rating = rawRating == null || rawRating === '' ? '-' : String(rawRating);

  const status =
    item?.statusLabel ||
    item?.status ||
    (totalOrders > 0 ? 'Hoàn thành' : 'Chưa có dữ liệu');

  return {
    date,
    totalOrders,
    revenue: formatCurrency(revenueNumber),
    rating,
    status,
    statusClass: status === 'Hoàn thành' ? 'history-status-completed' : 'history-status-pending',
  };
};

const aggregateServiceHistoryFromOrders = (orders) => {
  const grouped = new Map();

  (orders || []).forEach((order) => {
    if (!order?.createdAt) return;
    const dateObj = new Date(order.createdAt);
    if (Number.isNaN(dateObj.getTime())) return;

    const key = dateObj.toISOString().slice(0, 10);
    const current = grouped.get(key) || {
      dateObj,
      totalOrders: 0,
      revenueNumber: 0,
      processingCount: 0,
      doneCount: 0,
    };

    current.totalOrders += 1;
    current.revenueNumber += toCurrencyNumber(order?.totalAmount ?? order?.subTotal ?? 0);

    const normalizedOrderStatus = normalizeStatus(order?.orderStatus || order?.status);
    const isDone =
      Boolean(order?.closedAt) ||
      ['completed', 'done', 'paid', 'closed'].includes(normalizedOrderStatus);

    if (isDone) current.doneCount += 1;
    else current.processingCount += 1;

    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .sort((a, b) => b.dateObj - a.dateObj)
    .slice(0, 7)
    .map((row) => {
      const status = row.processingCount > 0 ? 'Đang phục vụ' : 'Hoàn thành';
      return {
        date: row.dateObj.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        totalOrders: row.totalOrders,
        revenue: formatCurrency(row.revenueNumber),
        rating: '-',
        status,
        statusClass: row.processingCount > 0 ? 'history-status-pending' : 'history-status-completed',
      };
    });
};

const normalizeSearchText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const normalizePhoneForDisplay = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  // Convert +84xxxxxxxxx -> 0xxxxxxxxx for waiter-friendly display.
  if (raw.startsWith('+84')) {
    const local = raw.slice(3).replace(/\s+/g, '');
    return local ? `0${local}` : raw;
  }
  return raw;
};

const toOrderItem = (item, idx) => ({
  name: item?.foodName || item?.name || item?.itemName || `Món ${idx + 1}`,
  quantity: Number(item?.quantity || item?.qty || 1),
  price: toCurrencyNumber(item?.unitPrice ?? item?.price ?? item?.totalPrice ?? 0),
  dishStatus: mapDishStatus(item?.status),
  note: item?.note || ''
});

const isBuffetPackageLine = (item) => {
  const name = normalizeSearchText(item?.name || '');
  const buffetId = Number(item?.buffetId || item?.bufferId || item?.idBuffer || 0);
  const foodId = Number(item?.foodId || 0);
  const comboId = Number(item?.comboId || 0);
  const itemType = normalizeSearchText(item?.itemType || item?.type || '');
  const looksBuffetByName = name.startsWith('buffet') || name.includes(' buffet ');
  const looksBuffetByType = itemType.includes('buffet');

  // Dòng đại diện gói buffet: có dấu hiệu buffet nhưng không phải món lẻ trong gói.
  return (looksBuffetByName || looksBuffetByType || buffetId > 0) && foodId <= 0 && comboId <= 0;
};

const mergeDuplicateOrderItems = (items) => {
  const grouped = new Map();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const key = [
      Number(item?.foodId || 0),
      Number(item?.comboId || 0),
      Number(item?.buffetId || 0),
      normalizeSearchText(item?.name || ''),
      Number(item?.price || 0),
      String(item?.dishStatus || ''),
      String(item?.note || ''),
    ].join('|');

    const currentId = item?.id || item?.orderItemId || item?.itemId || item?.foodId;
    const currentIds = [currentId, ...(Array.isArray(item?.orderItemIds) ? item.orderItemIds : [])]
      .map((x) => Number(x || 0))
      .filter((x) => Number.isFinite(x) && x > 0);

    if (!grouped.has(key)) {
      grouped.set(key, {
        ...item,
        quantity: Number(item?.quantity || 0),
        orderItemIds: Array.from(new Set(currentIds)),
      });
      return;
    }

    const existing = grouped.get(key);
    existing.quantity = Number(existing.quantity || 0) + Number(item?.quantity || 0);
    existing.orderItemIds = Array.from(new Set([...(existing.orderItemIds || []), ...currentIds]));
    grouped.set(key, existing);
  });

  return Array.from(grouped.values());
};

const mapApiOrderToWaiter = (order) => {
  // Lấy đúng trường từ API thực tế
  const orderCode = order?.orderCode || order?.code || `DH-${order?.orderId || order?.id || '---'}`;
  const isDelivery = normalizeOrderType(order?.orderType) === 'delivery';
  const deliveryInfo = order?.delivery || order?.deliveryInfo || order?.shipping || {};
  const deliveryFlow = mapDeliveryWorkflowStatus(deliveryInfo?.deliveryStatus || order?.deliveryStatus);
  const mappedStatus = isDelivery
    ? { status: deliveryFlow.status, statusLabel: deliveryFlow.statusLabel }
    : mapOrderStatus(order?.orderStatus || order?.status);
  // Map items đúng trường
  const orderItems = Array.isArray(order?.items)
    ? order.items.map((item, idx) => ({
        name: item.itemName || item.foodName || item.name || `Món ${idx + 1}`,
        quantity: Number(item.quantity || 1),
        price: Number(item.unitPrice || item.price || 0),
        dishStatus: mapDishStatus(item.status),
        note: item.note || '',
        id: item.id || item.orderItemId || item.itemId || item.foodId,
        orderItemId: item.orderItemId,
        itemId: item.itemId,
        foodId: item.foodId,
        comboId: item.comboId,
        buffetId: item.buffetId || item.bufferId || item.idBuffer,
        itemType: item.itemType || item.type,
        orderItemIds: [item.id, item.orderItemId, item.itemId].filter(Boolean),
      }))
      .filter((item) => !isBuffetPackageLine(item))
    : [];
  const mergedOrderItems = mergeDuplicateOrderItems(orderItems);
  const totalAmount = Number(order?.totalAmount || order?.total || 0);
  // Lấy tên bàn chính
  let tableName = '';
  if (Array.isArray(order.tables) && order.tables.length > 0) {
    const mainTable = order.tables.find(t => t.isMainTable) || order.tables[0];
    tableName = mainTable.tableName || mainTable.name || mainTable.code || '';
  } else {
    tableName = order.tableName || order.tableCode || order.tableNumber || '';
  }
  const isDineIn = String(order?.orderType || '').toLowerCase().includes('dine');
  const paid = isPaidOrder(order);
  const finalDeliveryActionLabel = isDelivery && deliveryFlow.actionLabel === 'HOÀN THÀNH GIAO' && !paid
    ? 'CHỜ THANH TOÁN'
    : deliveryFlow.actionLabel;

  const tableCodeValue = Array.isArray(order.tables) && order.tables.length > 0
    ? (
      order.tables.find(t => t.isMainTable)?.tableCode ||
      order.tables.find(t => t.isMainTable)?.code ||
      order.tables.find(t => t.isMainTable)?.tableId ||
      order.tables.find(t => t.isMainTable)?.id ||
      order.tables.find(t => t.isMainTable)?.tableName ||
      order.tables[0]?.tableCode ||
      order.tables[0]?.code ||
      order.tables[0]?.tableId ||
      order.tables[0]?.id ||
      order.tables[0]?.tableName ||
      tableName
    )
    : (order.tableCode || order.tableNumber || tableName);
  const customerName =
    deliveryInfo?.recipientName ||
    order?.receiverName ||
    order?.customer?.fullname ||
    order?.customerName ||
    order?.guestName ||
    (isDineIn ? (tableName ? `Khách tại ${tableName}` : 'Khách tại bàn') : 'Khách hàng');
  const phone = normalizePhoneForDisplay(
    deliveryInfo?.recipientPhone ||
    order?.receiverPhone ||
    order?.phone ||
    order?.customerPhone ||
    order?.customer?.phone ||
    ''
  );
  const address =
    deliveryInfo?.address ||
    deliveryInfo?.deliveryAddress ||
    order?.deliveryAddress ||
    order?.receiverAddress ||
    order?.shippingAddress ||
    order?.address ||
    '';
  const rawGuests = order?.numberOfGuests ?? order?.guestCount ?? order?.guests;
  const guests = rawGuests == null || rawGuests === '' ? null : Number(rawGuests);

  return {
    id: orderCode,
    orderCode,
    orderId: order?.orderId || order?.id || null,
    time: order?.createdAt
      ? new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '--:--',
    status: mappedStatus.status,
    statusLabel: mappedStatus.statusLabel,
    tableNumber: isDineIn ? (tableName || '') : '',
    tableCode: String(tableCodeValue || '').trim(),
    guests: Number.isFinite(guests) ? guests : null,
    customerName,
    channel: isDineIn ? 'dineIn' : order.orderType || '',
    deliveryActionLabel: isDelivery ? finalDeliveryActionLabel : 'THANH TOÁN',
    deliveryWorkflowStatus: normalizeStatus(deliveryInfo?.deliveryStatus || order?.deliveryStatus),
    isPaid: paid,
    items: mergedOrderItems,
    address,
    phone,
    note: order?.note || order?.customerNote || '',
    deliveryFee: Number(order?.deliveryPrice || order?.deliveryFee || 0),
    // Theo yêu cầu nghiệp vụ: đơn giao hàng không áp dụng mã giảm giá.
    discount: isDelivery ? 0 : Number(order?.discountAmount || order?.discount || 0),
    totalAmount,
  };
};



  // Hàm xác nhận thêm món vào đơn hàng (bản chuẩn)
  const handleConfirmAddItems = async () => {
    if (!selectedOrder || !selectedOrder.id || cartItems.length === 0) {
      alert('Chưa chọn đơn hàng hoặc chưa có món để thêm!');
      return;
    }

    const orderCode = String(selectedOrder.id).replace(/^#/, '').trim();
    const payload = cartItems
      .map((item) => {
        const base = {
          quantity: Math.max(1, Number(item.quantity) || 1),
          quantityBufferChildent: Math.max(0, Number(item.quantityBufferChildent) || 0),
          note: item.note || ''
        };

        if (Number(item.foodId) > 0) return { ...base, foodId: Number(item.foodId) };
        if (Number(item.comboId) > 0) return { ...base, comboId: Number(item.comboId) };
        if (Number(item.buffetId) > 0) return { ...base, buffetId: Number(item.buffetId) };
        return null;
      })
      .filter(Boolean);

    const buffetIds = Array.from(
      new Set(
        payload
          .map((x) => Number(x.buffetId || 0))
          .filter((id) => id > 0)
      )
    );

    if (buffetIds.length > 1) {
      alert('Mỗi đơn chỉ được chọn 1 loại buffet. Vui lòng giữ lại một gói buffet duy nhất.');
      return;
    }

    if (lockedBuffetId && buffetIds.length > 0 && buffetIds[0] !== lockedBuffetId) {
      alert('Đơn này đã có một loại buffet khác. Chỉ được thêm cùng loại buffet đã có.');
      return;
    }

    if (payload.length === 0) {
      alert('Giỏ hàng chưa có món hợp lệ để gửi API.');
      return;
    }

    try {
      setIsAddingItems(true);
      console.log('[AddItems] orderCode:', orderCode, 'payload:', payload);
      await addItemsToOrder(orderCode, payload);
      alert('Đã thêm món vào đơn hàng!');

      if (buffetIds.length > 0) {
        setSelectedBuffetIds(buffetIds);
        await loadBuffetFoodsForOrder(orderCode, buffetIds);
        setCartItems((prev) => prev.filter((x) => x.type !== 'buffet'));
        setAddItemCategory('buffet');
      } else {
        setCartItems([]);
        setShowAddItemsModal(false);
      }

      await refreshSelectedOrderDetail(orderCode);
      // Làm mới list đơn ở nền để giao diện không bị khựng.
      void fetchWaiterOrders({ silent: true });
    } catch (err) {
      const data = err?.response?.data;
      const status = err?.response?.status;
      const detail = data?.errors && typeof data.errors === 'object'
        ? Object.entries(data.errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}`)
            .join('\n')
        : '';
      const raw = data && !detail
        ? (typeof data === 'string' ? data : JSON.stringify(data))
        : '';
      const msg = data?.message || data?.title || err?.message || 'Lỗi khi thêm món vào đơn hàng!';
      alert(detail ? `${msg}\n${detail}` : `${msg}${raw ? `\n${raw}` : ''} (HTTP ${status || 'N/A'})`);
      console.error(err);
    } finally {
      setIsAddingItems(false);
    }
  };
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [showTableQrModal, setShowTableQrModal] = useState(false);
  const [showOrderInfoModal, setShowOrderInfoModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTablePickerModal, setShowTablePickerModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [orderItemsState, setOrderItemsState] = useState([]);
  const [addItemCategory, setAddItemCategory] = useState('dish');
  const [activeTab, setActiveTab] = useState('dineIn');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [menuSearch, setMenuSearch] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [receivedMoney, setReceivedMoney] = useState('');
  const [activePaymentMethod, setActivePaymentMethod] = useState('cash');
  const [isPaying, setIsPaying] = useState(false);
  const [isAddingItems, setIsAddingItems] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [itemCancelIndex, setItemCancelIndex] = useState(null);
  const [itemCancelReason, setItemCancelReason] = useState('');
  const [isCancellingItem, setIsCancellingItem] = useState(false);
  const [uiNotice, setUiNotice] = useState('');
  const [tableQrValue, setTableQrValue] = useState('');
  const [tableQrCode, setTableQrCode] = useState('');
  const [tableQrLoading, setTableQrLoading] = useState(false);
  const [tableQrError, setTableQrError] = useState('');

  const normalizeNoticeMessage = (message) => {
    const raw = String(message ?? '').trim();
    if (!raw) return '';

    if (/^request failed with status code\s+400$/i.test(raw)) {
      return 'Yêu cầu không hợp lệ (400). Vui lòng kiểm tra dữ liệu và thử lại.';
    }
    if (/^request failed with status code\s+401$/i.test(raw)) {
      return 'Bạn chưa đăng nhập hoặc phiên đã hết hạn (401). Vui lòng đăng nhập lại.';
    }
    if (/^request failed with status code\s+403$/i.test(raw)) {
      return 'Bạn không có quyền thực hiện thao tác này (403).';
    }
    if (/^request failed with status code\s+404$/i.test(raw)) {
      return 'Không tìm thấy dữ liệu (404).';
    }
    if (/^request failed with status code\s+5\d\d$/i.test(raw)) {
      return 'Hệ thống đang bận. Vui lòng thử lại sau ít phút.';
    }

    const replacements = [
      ['Vui lòng nhập lý do hủy đơn.', 'Please enter a cancellation reason.'],
      ['Không tìm thấy mã đơn để hủy.', 'Order code was not found.'],
      ['Vui lòng chọn hoặc nhập lý do hủy món.', 'Please choose or enter a cancellation reason.'],
      ['Không tìm thấy mã dòng món (orderItemId) để hủy.', 'Order item ID was not found.'],
      ['Không tìm thấy mã đơn giao hàng.', 'Delivery order code was not found.'],
      ['Cần phục vụ xong tất cả món trước khi thanh toán.', 'All dishes must be served before payment.'],
      ['Không xác định được mã đơn để thanh toán.', 'Order code is missing for payment.'],
      ['Không xác định được orderId để thanh toán tiền mặt.', 'orderId is missing for cash payment.'],
      ['Tiền khách đưa phải lớn hơn 0.', 'Cash amount must be greater than 0.'],
      ['Không tạo được QR thanh toán phần còn thiếu.', 'Could not create a QR checkout for the remaining amount.'],
      ['Lỗi thanh toán tiền mặt.', 'Cash payment failed.'],
      ['Lỗi kết nối API thanh toán.', 'Payment API connection failed.'],
      ['Không thể thanh toán: còn món chưa được phục vụ.', 'Cannot proceed to payment: some dishes are not served yet.'],
      ['Đang mở màn hình thanh toán...', 'Opening payment screen...'],
      ['Bếp chưa làm xong món. Chỉ bắt đầu giao khi tất cả món đã sẵn sàng.', 'Kitchen has not finished all dishes. Start delivery only when all dishes are ready.'],
      ['Đơn chưa thanh toán. Cần thanh toán trước khi hoàn thành giao hàng.', 'This order is not paid yet. Please complete payment before finishing delivery.'],
    ];

    for (const [vi, en] of replacements) {
      if (raw === en) return vi;
    }

    return raw;
  };

  const alert = (message) => {
    setUiNotice(normalizeNoticeMessage(message));
  };

  // --- FIX: BỔ SUNG STATE searchInput ---
  const [searchInput, setSearchInput] = useState('');
  const [reservationContactInput, setReservationContactInput] = useState('');
  const [reservationLookupLoading, setReservationLookupLoading] = useState(false);
  const [reservationLookupRows, setReservationLookupRows] = useState([]);
  const [selectedReservationCode, setSelectedReservationCode] = useState('');
  const [reservationTimingNotice, setReservationTimingNotice] = useState(null);
  /** Đã bấm Tiếp tục lần 1 khi có cảnh báo sớm/trễ — lần 2 mới sang bước kế tiếp / hoàn tất đơn */
  const [reservationSoftTimingAck, setReservationSoftTimingAck] = useState(false);

  // --- FIX: BỔ SUNG KHAI BÁO STATE menuLoading, menuError, menuItems ---
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [comboLoading, setComboLoading] = useState(false);
  const [comboError, setComboError] = useState(null);
  const [comboMenus, setComboMenus] = useState([]);
  const [buffetLoading, setBuffetLoading] = useState(false);
  const [buffetError, setBuffetError] = useState(null);
  const [buffetMenus, setBuffetMenus] = useState([]);
  const [buffetFoods, setBuffetFoods] = useState([]);
  const [selectedBuffetIds, setSelectedBuffetIds] = useState([]);
  const [showBuffetFoods, setShowBuffetFoods] = useState(false);
  const [lockedBuffetId, setLockedBuffetId] = useState(null);
  const searchKeyword = normalizeSearchText(menuSearch);

  const filteredMenuItems = useMemo(() => {
    if (!searchKeyword) return menuItems;
    return (menuItems || []).filter((food) =>
      normalizeSearchText(food?.name || food?.foodName || '').includes(searchKeyword)
    );
  }, [menuItems, searchKeyword]);

  const filteredComboMenus = useMemo(() => {
    if (!searchKeyword) return comboMenus;
    return (comboMenus || []).filter((combo) =>
      normalizeSearchText(combo?.comboName || combo?.name || '').includes(searchKeyword)
    );
  }, [comboMenus, searchKeyword]);

  const filteredBuffetMenus = useMemo(() => {
    if (!searchKeyword) return buffetMenus;
    return (buffetMenus || []).filter((buffet) =>
      normalizeSearchText(buffet?.name || buffet?.buffetName || '').includes(searchKeyword)
    );
  }, [buffetMenus, searchKeyword]);

  const filteredBuffetFoods = useMemo(() => {
    if (!searchKeyword) return buffetFoods;
    return (buffetFoods || []).filter((food) =>
      normalizeSearchText(food?.name || food?.foodName || '').includes(searchKeyword)
    );
  }, [buffetFoods, searchKeyword]);

  const buffetFoodIdSet = useMemo(() => {
    return new Set(
      (buffetFoods || [])
        .map((item) => Number(item?.foodId || item?.id || 0))
        .filter((id) => id > 0)
    );
  }, [buffetFoods]);

  const extractFoodIdFromCartItem = (item) => {
    const direct = Number(item?.foodId || 0);
    if (direct > 0) return direct;

    const rawId = String(item?.id || '');
    if (!rawId || rawId.startsWith('combo-') || rawId.startsWith('buffet-')) return 0;

    const match = rawId.match(/(?:food-|buffet-food-)?(\d+)$/);
    return match ? Number(match[1]) : 0;
  };

  const normalizeCartItemsByBuffetFoods = (items) => {
    if (!Array.isArray(items) || items.length === 0) return items;

    const merged = new Map();

    items.forEach((item) => {
      if (item?.type === 'buffet' || item?.type === 'combo') {
        merged.set(`raw:${item.id}`, { ...item });
        return;
      }

      const foodId = extractFoodIdFromCartItem(item);
      const includedInBuffet = foodId > 0 && buffetFoodIdSet.has(foodId);
      const stableId = foodId > 0 ? `food-${foodId}` : String(item.id);
      const key = foodId > 0 ? `food:${foodId}` : `raw:${item.id}`;

      const normalizedItem = {
        ...item,
        id: stableId,
        foodId: foodId > 0 ? foodId : item.foodId,
        price: includedInBuffet ? 0 : Number(item.price || 0)
      };

      const current = merged.get(key);
      if (!current) {
        merged.set(key, normalizedItem);
        return;
      }

      merged.set(key, {
        ...current,
        quantity: Number(current.quantity || 0) + Number(normalizedItem.quantity || 0),
        price: includedInBuffet ? 0 : Number(current.price || 0),
        note: current.note || normalizedItem.note || ''
      });
    });

    return Array.from(merged.values());
  };

  const RESERVATION_EARLY_ARRIVAL_LIMIT_MINUTES = 60;
  const RESERVATION_LATE_ARRIVAL_LIMIT_MINUTES = 30;

  // --- FIX: BỔ SUNG STATE createOrderType ---
  const [createOrderType, setCreateOrderType] = useState('reservation');

  const getReservationCode = (item) =>
    String(item?.reservationCode || item?.bookingCode || item?.orderCode || '').trim();

  const normalizeReservationLookupRows = (data) => {
    const rows =
      Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.data?.items)
            ? data.data.items
            : Array.isArray(data?.data?.$values)
              ? data.data.$values
              : Array.isArray(data?.items)
                ? data.items
                : Array.isArray(data?.$values)
                  ? data.$values
                  : (data && typeof data === 'object')
                    ? [data]
                    : [];
    const uniqueByCode = new Map();
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      const code = getReservationCode(row);
      if (!code || uniqueByCode.has(code)) return;
      uniqueByCode.set(code, row);
    });
    return Array.from(uniqueByCode.values());
  };

  const selectedReservation = useMemo(() => {
    const code = String(selectedReservationCode || '').trim();
    if (!code) return null;
    return reservationLookupRows.find((row) => getReservationCode(row) === code) || null;
  }, [reservationLookupRows, selectedReservationCode]);

  const fillOrderFormFromReservation = (reservation, fallbackCode = '') => {
    if (!reservation) return '';
    const resolvedCode = getReservationCode(reservation) || String(fallbackCode || '').trim();
    const bookingTime = String(reservation.reservationTime || reservation.bookingTime || '').slice(0, 5);
    setOrderForm((prev) => ({
      ...prev,
      orderCode: resolvedCode || prev.orderCode,
      fullName: reservation.fullName || reservation.fullname || reservation.customerName || prev.fullName,
      phone: reservation.phone || prev.phone,
      guests: String(reservation.numberOfGuests || reservation.guests || prev.guests || ''),
      bookingDate: reservation.reservationDate || reservation.bookingDate || prev.bookingDate,
      bookingTime: bookingTime || prev.bookingTime,
      note: reservation.specialRequests || prev.note,
    }));
    if (resolvedCode) {
      setSearchInput(resolvedCode);
      setSelectedReservationCode(resolvedCode);
    }
    return resolvedCode;
  };

  const parseReservationDateTime = (reservation) => {
    const dateRaw = String(reservation?.reservationDate || reservation?.bookingDate || '').trim();
    const timeRaw = String(reservation?.reservationTime || reservation?.bookingTime || '').trim();
    if (!dateRaw || !timeRaw) return null;

    const hhmm = timeRaw.slice(0, 5);
    const parsed = new Date(`${dateRaw}T${hhmm}:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    const dateOnly = new Date(dateRaw);
    if (Number.isNaN(dateOnly.getTime())) return null;
    const [h, m] = hhmm.split(':').map((v) => Number(v || 0));
    return new Date(
      dateOnly.getFullYear(),
      dateOnly.getMonth(),
      dateOnly.getDate(),
      Number.isFinite(h) ? h : 0,
      Number.isFinite(m) ? m : 0,
      0
    );
  };

  const formatMinutesToHourText = (totalMinutes) => {
    const safe = Math.max(0, Number(totalMinutes) || 0);
    const h = Math.floor(safe / 60);
    const m = safe % 60;
    if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
    if (h > 0) return `${h} giờ`;
    return `${m} phút`;
  };

  const isSameCalendarDate = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const validateReservationArrivalWindow = (reservation) => {
    const bookingDateTime = parseReservationDateTime(reservation);
    const dateLabel = String(reservation?.reservationDate || reservation?.bookingDate || '').trim();
    const timeLabel = String(reservation?.reservationTime || reservation?.bookingTime || '').trim().slice(0, 5);
    if (!bookingDateTime) {
      setReservationTimingNotice({
        title: 'Không xác định được thời gian đặt bàn',
        lines: [
          `Mã đặt bàn có dữ liệu thời gian chưa hợp lệ (${dateLabel}${timeLabel ? ` • ${timeLabel}` : ''}).`,
          'Vui lòng chọn mã đặt bàn khác hoặc liên hệ quản lý để kiểm tra dữ liệu đặt chỗ.',
        ],
      });
      return 'block';
    }

    const now = new Date();
    if (!isSameCalendarDate(now, bookingDateTime)) {
      setReservationTimingNotice({
        title: 'Chỉ nhận bàn đúng ngày đặt',
        lines: [
          `Giờ đặt bàn: ${dateLabel}${timeLabel ? ` • ${timeLabel}` : ''}.`,
          'Hôm nay không trùng ngày đặt chỗ. Vui lòng xác nhận lại lịch hẹn với khách.',
        ],
      });
      return 'block';
    }

    const diffMinutes = Math.ceil((bookingDateTime.getTime() - now.getTime()) / 60000);
    if (diffMinutes > RESERVATION_EARLY_ARRIVAL_LIMIT_MINUTES) {
      const waitMore = diffMinutes - RESERVATION_EARLY_ARRIVAL_LIMIT_MINUTES;
      setReservationTimingNotice({
        title: 'Khách đang đến sớm hơn khung nhận bàn',
        lines: [
          `Giờ đặt bàn: ${dateLabel}${timeLabel ? ` • ${timeLabel}` : ''}.`,
          `Nhà hàng khuyến nghị nhận trước tối đa ${RESERVATION_EARLY_ARRIVAL_LIMIT_MINUTES} phút (đang sớm khoảng ${formatMinutesToHourText(waitMore)}).`,
        ],
      });
      return 'warn';
    }

    if (diffMinutes < -RESERVATION_LATE_ARRIVAL_LIMIT_MINUTES) {
      const lateMore = Math.abs(diffMinutes) - RESERVATION_LATE_ARRIVAL_LIMIT_MINUTES;
      setReservationTimingNotice({
        title: 'Khách đã đến trễ quá thời gian cho phép',
        lines: [
          `Giờ đặt bàn: ${dateLabel}${timeLabel ? ` • ${timeLabel}` : ''}.`,
          `Chính sách nhận trễ tối đa ${RESERVATION_LATE_ARRIVAL_LIMIT_MINUTES} phút (đang trễ thêm khoảng ${formatMinutesToHourText(lateMore)}).`,
        ],
      });
      return 'warn';
    }

    setReservationTimingNotice(null);
    return 'ok';
  };

  const handleReservationLookup = async () => {
    const keyword = reservationContactInput.trim();
    if (!keyword) {
      alert('Vui lòng nhập số điện thoại hoặc email để tra cứu mã đặt bàn.');
      return;
    }
    setReservationLookupLoading(true);
    try {
      const data = await checkReservationAvailabilityByPhoneOrEmail(keyword);
      const rows = normalizeReservationLookupRows(data);
      setReservationLookupRows(rows);
      if (rows.length === 0) {
        setSelectedReservationCode('');
        alert('Không tìm thấy mã đặt bàn theo thông tin vừa nhập.');
        return;
      }
      const exact = rows.find((row) => getReservationCode(row).toUpperCase() === keyword.toUpperCase());
      const preferred = exact || rows[0];
      const preferredCode = getReservationCode(preferred);
      setSelectedReservationCode(preferredCode);
      setReservationSoftTimingAck(false);
      fillOrderFormFromReservation(preferred, keyword);
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message || err?.message || 'Không thể tra cứu mã đặt bàn lúc này.';
      alert(`Tra cứu thất bại (${status || 'N/A'}): ${message}`);
      setReservationLookupRows([]);
      setSelectedReservationCode('');
    } finally {
      setReservationLookupLoading(false);
    }
  };

  // Lấy danh sách món ăn thực tế khi mở modal thêm món
  useEffect(() => {
    if (!showAddItemsModal) return;
    setMenuLoading(true);
    setMenuError(null);
    setComboLoading(true);
    setComboError(null);
    setBuffetLoading(true);
    setBuffetError(null);

    const fetchMenu = async () => {
      try {
        const [foods, combos, buffets] = await Promise.all([
          getFoodByFilter(new URLSearchParams()),
          getComboLists(),
          getBuffetLists(),
        ]);

        setMenuItems(Array.isArray(foods) ? foods : []);

        const comboRows = Array.isArray(combos)
          ? combos
          : combos?.$values || combos?.data?.$values || combos?.data || [];
        const availableCombos = (Array.isArray(comboRows) ? comboRows : []).filter(
          (c) => c?.isAvailable === true
        );
        setComboMenus(availableCombos);

        const buffetRows = Array.isArray(buffets)
          ? buffets
          : buffets?.$values || buffets?.data?.$values || buffets?.data || buffets?.items || [];
        const availableBuffets = (Array.isArray(buffetRows) ? buffetRows : []).filter(
          (b) => b?.isAvailable !== false
        );
        setBuffetMenus(availableBuffets);
      } catch (err) {
        setMenuError('Không thể tải dữ liệu món ăn.');
        setMenuItems([]);
        setComboError('Không thể tải danh sách combo.');
        setComboMenus([]);
        setBuffetError('Không thể tải danh sách buffet theo orderCode.');
        setBuffetMenus([]);
      } finally {
        setMenuLoading(false);
        setComboLoading(false);
        setBuffetLoading(false);
      }
    };

    setBuffetFoods([]);
    setSelectedBuffetIds([]);
    setShowBuffetFoods(false);
    setLockedBuffetId(null);
    fetchMenu();
  }, [showAddItemsModal, selectedOrder]);

  // Khi mở modal, kiểm tra order đã có buffet nào chưa để khóa loại buffet khác
  useEffect(() => {
    if (!showAddItemsModal || !selectedOrder?.id) return;

    const orderCode = String(selectedOrder.id).replace(/^#/, '').trim();
    if (!orderCode) return;

    (async () => {
      try {
        const data = await getFoodsBufferByOrderCode(orderCode);
        const rows = Array.isArray(data)
          ? data
          : data?.$values || data?.data?.$values || data?.data || data?.items || [];
        const safeRows = Array.isArray(rows) ? rows : [];

        const ids = Array.from(
          new Set(
            safeRows
              .map((x) => Number(x?.buffetId || x?.bufferId || x?.idBuffer || 0))
              .filter((id) => id > 0)
          )
        );

        // Chỉ cần có món buffet trong order thì chuyển sang màn hiển thị món,
        // kể cả backend không trả buffetId trên từng item.
        if (safeRows.length > 0) {
          if (ids.length > 0) {
            setLockedBuffetId(ids[0]);
            setSelectedBuffetIds([ids[0]]);
            await loadBuffetFoodsForOrder(orderCode, [ids[0]]);
          } else {
            setLockedBuffetId(null);
            setSelectedBuffetIds([]);
            await loadBuffetFoodsForOrder(orderCode, []);
          }
        } else {
          setShowBuffetFoods(false);
          setBuffetFoods([]);
        }
      } catch {
        // ignore: order có thể chưa có buffet
      }
    })();
  }, [showAddItemsModal, selectedOrder]);

  const loadBuffetFoodsForOrder = async (orderCode, buffetIds = []) => {
    const data = await getFoodsBufferByOrderCode(orderCode);
    const rows = Array.isArray(data)
      ? data
      : data?.$values || data?.data?.$values || data?.data || data?.items || [];

    const normalized = (Array.isArray(rows) ? rows : []).map((item, idx) => ({
      id: item.foodId || item.id || `${item.buffetId || 'buffet'}-${idx}`,
      foodId: Number(item.foodId || item.id || 0),
      buffetId: Number(item.buffetId || item.bufferId || item.idBuffer || 0),
      name: item.foodName || item.name || item.itemName || `Món ${idx + 1}`,
      // Mon trong goi buffet khong tinh tien le, chi tinh theo gia goi buffet.
      price: 0,
    }));

    const filtered = buffetIds.length > 0
      ? normalized.filter((x) => buffetIds.includes(x.buffetId) || x.buffetId === 0)
      : normalized;

    setBuffetFoods(filtered);
    setShowBuffetFoods(true);
  };

  // Lấy danh sách món ăn thực tế khi mở modal tạo đơn mới
  useEffect(() => {
    if (!showCreateModal) return;
    setMenuLoading(true);
    setMenuError(null);
    setSearchInput('');
    setReservationContactInput('');
    setReservationLookupRows([]);
    setSelectedReservationCode('');
    setReservationTimingNotice(null);
    setReservationSoftTimingAck(false);
    setReservationLookupLoading(false);
    const fetchMenu = async () => {
      try {
        const { getFoodByFilter } = require('../../api/foodApi');
        const params = new URLSearchParams();
        // Có thể thêm filter nếu muốn, ví dụ: params.append('category', 'all');
        const foods = await getFoodByFilter(params);
        setMenuItems(foods);
      } catch (err) {
        setMenuError('Không thể tải dữ liệu món ăn.');
        setMenuItems([]);
      } finally {
        setMenuLoading(false);
      }
    };
    fetchMenu();
  }, [showCreateModal]);

  useEffect(() => {
    if (createOrderType === 'reservation') return;
    setReservationContactInput('');
    setReservationLookupRows([]);
    setSelectedReservationCode('');
    setReservationTimingNotice(null);
    setReservationSoftTimingAck(false);
  }, [createOrderType]);

  const [orderForm, setOrderForm] = useState({
    fullName: 'Nguyễn Hoàng Nam',
    phone: '0901234567',
    orderCode: '#ORD-240524-001',
    orderType: 'at-place',
    fullName: '',
    phone: '',
    email: '',
    guests: '',
    bookingDate: '',
    bookingTime: '',
    note: ''
  });

  // Sửa logic: tableSelection lưu id số của bàn
  const [tableSelection, setTableSelection] = useState({
    mainTableId: null,
    mergedTableIds: []
  });
  const hasSelectedTable = Boolean(tableSelection.mainTableId);

  // State cho Modal Kiểm Tra Bàn
  const [tableCheckModal, setTableCheckModal] = useState(false);
  const [tableCheckDate, setTableCheckDate] = useState(new Date().toISOString().split('T')[0]);
  const [tableCheckShift, setTableCheckShift] = useState('Tất cả');

  // Danh sách bàn thực tế từ API
  const [tables, setTables] = useState([]);

  useEffect(() => {
    if (!hasSelectedTable) return;
    setOrderForm((prev) =>
      prev.orderType === 'at-place' ? prev : { ...prev, orderType: 'at-place' }
    );
  }, [hasSelectedTable]);

  const reloadTables = async () => {
    try {
      const data = await getWaiterTables();
      const mapped = Array.isArray(data)
        ? data.map((t) => ({
            id: t.id || t.tableId || t.code || t.tableCode,
            name: t.name,
            code: t.code || t.tableCode || t.id,
            seats: t.seats || t.capacity || t.chairs || 4,
            status: t.status || 'empty',
          }))
        : [];
      setTables(mapped);
      return mapped;
    } catch (err) {
      console.error('Lỗi lấy bàn:', err);
      setTables([]);
      return [];
    }
  };

  // Lấy danh sách bàn khi mở modal chọn bàn hoặc khi trang load
  useEffect(() => {
    if (!showTablePickerModal) return;
    reloadTables();
  }, [showTablePickerModal]);

  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [dineInOrders, setDineInOrders] = useState([]);
  const [takeawayOrders, setTakeawayOrders] = useState([]);
  const [changingDeliveryOrderCode, setChangingDeliveryOrderCode] = useState('');
  const [serviceHistory, setServiceHistory] = useState([]);
  const [showAllServiceHistory, setShowAllServiceHistory] = useState(false);

  const fetchWaiterOrders = useCallback(async (opts) => {
    const silent = opts && opts.silent === true;
    if (!silent) {
      setLoadingOrders(true);
      setOrdersError('');
    }
    try {
      const [preparingRes, deliveryRes] = await Promise.all([
        orderAPI.getPreparingMy(),
        orderAPI.getDeliveryMy(),
      ]);

      const preparingRows = asArray(preparingRes?.data?.data ?? preparingRes?.data);
      const deliveryRows = asArray(deliveryRes?.data?.data ?? deliveryRes?.data);

      const mappedPreparing = preparingRows.map(mapApiOrderToWaiter);
      const mappedDelivery = deliveryRows.map(mapApiOrderToWaiter);

      const dineIn = mappedPreparing.filter((order) => {
        const t = normalizeOrderType(order.channel);
        return t === 'dinein' || t === '';
      });

      const takeaway = mappedPreparing.filter((order) => {
        const t = normalizeOrderType(order.channel);
        return t === 'takeaway' || t === 'takeout' || t === 'carryout' || t === 'mangdi';
      });

      const deliveryByCode = new Map();
      [...mappedDelivery, ...mappedPreparing.filter((order) => normalizeOrderType(order.channel) === 'delivery')]
        .forEach((order) => {
          deliveryByCode.set(order.id, order);
        });

      setDineInOrders(dineIn);
      setTakeawayOrders(takeaway);
      setDeliveryOrders(Array.from(deliveryByCode.values()));
    } catch (error) {
      console.error(error);
      if (!silent) setOrdersError('Không lấy được đơn hàng của waiter');
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  }, []);

  const refreshSelectedOrderDetail = useCallback(async (orderCode) => {
    const code = String(orderCode || '').replace(/^#/, '').trim();
    if (!code) return;
    try {
      const detailRes = await orderAPI.getByCode(code);
      const detailPayload = detailRes?.data?.data || detailRes?.data || {};
      const mappedDetail = mapApiOrderToWaiter(detailPayload);
      setSelectedOrder((prev) => (prev ? { ...prev, ...mappedDetail } : mappedDetail));
      setOrderItemsState((mappedDetail?.items || []).map((item) => ({ ...item })));
    } catch (err) {
      console.warn('[Waiter] Không thể làm mới chi tiết đơn hàng:', err?.message || err);
    }
  }, []);

  async function fetchWaiterServiceHistory() {
    try {
      const res = await orderAPI.getHistoryMySevenDays();
      const payload = res?.data;
      const rows = asArray(payload?.data ?? payload);
      const mapped = rows.some(isOrderLikeHistoryRow)
        ? aggregateServiceHistoryFromOrders(rows)
        : rows.map(mapServiceHistoryItem);
      setServiceHistory(mapped);
    } catch (error) {
      console.error('Không lấy được lịch sử phục vụ 7 ngày:', error);
      setServiceHistory([]);
    }
  }

  // Luôn load đơn khi trang mount
  useEffect(() => {
    fetchWaiterOrders();
    fetchWaiterServiceHistory();
  }, [fetchWaiterOrders]);

  // Realtime theo SignalR backend như cũ.
  useEffect(() => {
    const token =
      localStorage.getItem('authToken') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('tableAccessToken');
    if (!token) return undefined;

    const conn = createHubConnection(KITCHEN_HUB);
    const refresh = async () => {
      await fetchWaiterOrders({ silent: true });
      if (showOrderDetailModal && selectedOrder) {
        const orderCode = resolveOrderCode(selectedOrder);
        await refreshSelectedOrderDetail(orderCode);
      }
    };
    conn.on('OrderItemStatusChanged', refresh);
    conn.on('AllItemsStatusChanged', refresh);
    conn.on('NewOrderItems', refresh);
    conn.onreconnected(refresh);
    conn.start().catch(() => {});
    return () => {
      void conn.stop();
    };
  }, [fetchWaiterOrders, refreshSelectedOrderDetail, selectedOrder, showOrderDetailModal]);

  useEffect(() => {
    if (!showPaymentModal || !selectedOrder) return;
    setVoucherCode('');
    setReceivedMoney('');
  }, [showPaymentModal, selectedOrder]);

  useEffect(() => {
    if (!buffetFoodIdSet.size) return;
    setCartItems((prev) => normalizeCartItemsByBuffetFoods(prev));
  }, [buffetFoodIdSet]);

  useEffect(() => {
    if (!uiNotice) return;
    const timer = setTimeout(() => setUiNotice(''), 2800);
    return () => clearTimeout(timer);
  }, [uiNotice]);

  const calculateOrderSubtotal = (order) => {
    const itemsSubtotal = (order?.items || []).reduce((sum, item) => {
      if (item?.dishStatus === 'cancelled') return sum;
      return sum + Number(item?.price || 0) * Number(item?.quantity || 0);
    }, 0);

    const backendSubtotalCandidates = [
      Number(order?.subTotal),
      Number(order?.subtotal),
      Number(order?.totalBeforeDiscount),
      Number(order?.totalAmount) - Number(order?.deliveryFee || 0) + Number(order?.discount || 0),
    ].filter((n) => Number.isFinite(n) && n > 0);

    const backendSubtotal = backendSubtotalCandidates.length > 0 ? backendSubtotalCandidates[0] : 0;
    // Tạm tính phải là tổng tiền món (chưa VAT). Chỉ fallback backend khi không có dữ liệu món.
    return itemsSubtotal > 0 ? itemsSubtotal : Math.max(0, backendSubtotal);
  };


  const getOrderBilling = (order) =>
    resolveOrderVatAndGrandTotal({
      subtotal: calculateOrderSubtotal(order),
      deliveryFee: Number(order?.deliveryFee || 0) || 0,
      discountAmount: Number(order?.discount ?? order?.discountAmount ?? 0) || 0,
      apiTotalAmount: order?.totalAmount,
      apiTaxAmount: order?.taxAmount ?? order?.vatAmount,
    });

  const calculateOrderTotal = (order) => getOrderBilling(order).grand;

  const calculateOrderVat = (order) => getOrderBilling(order).vat;

  const handlePrintWaiterOrderInvoice = async () => {
    if (!selectedOrder) return;
    const o = selectedOrder;
    const code = String(o.orderCode || o.code || '').trim();
    if (code) {
      try {
        await downloadInvoicePdf(code);
        return;
      } catch (e) {
        const msg = await getPdfErrorMessage(e);
        console.warn('[pdf-export/invoice]', msg);
      }
    }
    const lines = (orderItemsState || []).map((it) => {
      const q = Number(it.quantity) || 0;
      const pr = Number(it.price) || 0;
      return { name: String(it.name || 'Món'), qty: q, unitPrice: pr, lineTotal: q * pr };
    });
    const sub = calculateOrderSubtotal(o);
    const del = Number(o?.deliveryFee || 0) || 0;
    const disc = Number(o?.discount ?? o?.discountAmount ?? 0) || 0;
    const vat = calculateOrderVat(o);
    const grand = calculateOrderTotal(o);
    const dine = isDineInOrder(o);
    const ot = String(o?.orderType || '').toLowerCase();
    let typeLbl = 'Giao hàng';
    if (dine) typeLbl = 'Tại chỗ / Đặt bàn';
    else if (ot.includes('take')) typeLbl = 'Mang đi';
    printSalesInvoice({
      orderCode: String(o.orderCode || o.code || o.id || ''),
      orderTypeLabel: typeLbl,
      dateTime: o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '—',
      buyerName: dine ? (o.customerName || 'Khách tại bàn') : (o.customerName || 'Khách hàng'),
      buyerPhone: String(o.phone || '—'),
      buyerAddress: dine ? 'Tại nhà hàng' : String(o.address || '—'),
      tableInfo: dine ? String(o.tableNumber || o.tableCode || '').trim() : '',
      lines,
      subtotal: sub,
      shippingFee: del,
      discountAmount: disc,
      vatAmount: vat,
      grandTotal: grand,
      note: String(o.note || ''),
    });
  };

  const paymentTotal = Number(calculateOrderTotal(selectedOrder || { items: [] }) || 0);
  const receivedMoneyValue = Number(receivedMoney || 0);
  const hasReceivedMoney = receivedMoney.trim() !== '';
  const isCashAmountValid = hasReceivedMoney && receivedMoneyValue > 0;
  const remainingAfterCash = hasReceivedMoney
    ? Math.max(0, paymentTotal - receivedMoneyValue)
    : paymentTotal;
  const changeAmount = hasReceivedMoney
    ? Math.max(0, receivedMoneyValue - paymentTotal)
    : null;

  // Helper: getStatusClass (moved to component scope)
  const getStatusClass = (status) => {
    switch (status) {
      case 'ready':
        return 'status-ready';
      case 'preparing':
        return 'status-preparing';
      case 'delivering':
        return 'status-delivering';
      case 'completed':
        return 'status-completed';
      default:
        return 'status-pending';
    }
  };

  const normalizeTableCode = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const onlyDigits = raw.match(/(\d+)/);
    if (onlyDigits) return onlyDigits[1];
    return raw;
  };

  const resolveTableCandidates = (order) => {
    const mainTable = Array.isArray(order?.tables) && order.tables.length > 0
      ? (order.tables.find((t) => t.isMainTable) || order.tables[0])
      : null;

    const rawCandidates = [
      order?.tableCode,
      order?.tableNumber,
      order?.tableName,
      mainTable?.tableCode,
      mainTable?.code,
      mainTable?.tableId,
      mainTable?.id,
      mainTable?.tableName,
    ];

    const expanded = [];
    rawCandidates.forEach((value) => {
      const raw = String(value || '').trim();
      if (!raw) return;
      expanded.push(raw);
      const normalized = normalizeTableCode(raw);
      if (normalized && normalized !== raw) {
        expanded.push(normalized);
      }
    });

    const orderLabel = String(order?.tableNumber || order?.tableName || '').trim().toLowerCase();
    const orderDigits = normalizeTableCode(orderLabel);

    const matchedFromTables = (tables || []).find((table) => {
      const name = String(table?.name || '').trim().toLowerCase();
      const code = String(table?.code || '').trim().toLowerCase();
      if (orderLabel && (name === orderLabel || code === orderLabel)) return true;
      if (orderDigits) {
        return normalizeTableCode(name) === orderDigits || normalizeTableCode(code) === orderDigits;
      }
      return false;
    });

    if (matchedFromTables) {
      expanded.push(String(matchedFromTables.code || '').trim());
      expanded.push(String(matchedFromTables.id || '').trim());
      expanded.push(String(matchedFromTables.name || '').trim());
      const normalizedName = normalizeTableCode(matchedFromTables.name);
      if (normalizedName) expanded.push(normalizedName);
    }

    return Array.from(new Set(expanded.filter(Boolean)));
  };

  const buildGuestQrUrl = (tableCode, accessToken, tableName) => {
    const url = new URL('/guest-qr-order', window.location.origin);
    url.searchParams.set('tableCode', String(tableCode));
    if (tableName) {
      url.searchParams.set('tableName', String(tableName));
    }
    if (accessToken) {
      url.searchParams.set('tableToken', accessToken);
    }
    return url.toString();
  };

  const initQrForOrder = async (order) => {
    const candidates = resolveTableCandidates(order);
    if (candidates.length === 0) {
      setTableQrError('Không tìm thấy mã bàn để tạo QR.');
      return;
    }

    try {
      setTableQrLoading(true);
      setTableQrError('');
      let lastError = null;

      for (const candidate of candidates) {
        try {
          const data = await initTableSession(candidate);
          const accessToken = data?.accessToken || '';
          const finalTableCode = String(data?.tableCode || normalizeTableCode(candidate) || candidate);
          const displayTableName =
            order?.tableNumber ||
            order?.tableName ||
            data?.tableName ||
            data?.tableCode ||
            finalTableCode;
          const qrUrl = buildGuestQrUrl(finalTableCode, accessToken, displayTableName);
          setTableQrCode(finalTableCode);
          setTableQrValue(qrUrl);
          return;
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError || new Error('Không thể khởi tạo phiên QR cho bàn này.');
    } catch (err) {
      setTableQrError(err?.message || 'Không tạo được QR cho bàn này.');
      setTableQrValue('');
      setTableQrCode('');
    } finally {
      setTableQrLoading(false);
    }
  };

  const openOrderDetail = async (order) => {
    setItemCancelIndex(null);
    setItemCancelReason('');
    setSelectedOrder(order);
    setOrderItemsState(order.items.map(item => ({ ...item }))); // clone để thao tác trạng thái
    setShowOrderDetailModal(true);
    setTableQrValue('');
    setTableQrCode('');
    setTableQrError('');

    const orderCode = resolveOrderCode(order);
    if (orderCode) {
      await refreshSelectedOrderDetail(orderCode);
    }

  };

  const openOrderQrModal = async (order) => {
    if (!isDineInOrder(order)) {
      return;
    }
    setSelectedOrder(order);
    setTableQrValue('');
    setTableQrCode('');
    setTableQrError('');
    setShowTableQrModal(true);
    await initQrForOrder(order);
  };

  const openCancelModal = (order) => {
    setSelectedOrder(order);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setCancelReason('');
  };

  const handleCancelOrder = async () => {
    const reason = String(cancelReason || '').trim();
    if (!reason) {
      alert('Vui lòng nhập lý do hủy đơn.');
      return;
    }

    const orderCode = resolveOrderCode(selectedOrder);
    if (!orderCode) {
      alert('Không tìm thấy mã đơn để hủy.');
      return;
    }

    try {
      setIsCancellingOrder(true);
      const res = await orderAPI.deleteOrderDelivery(orderCode, { cancellationReason: reason });
      const successMessage =
        typeof res?.data === 'string'
          ? res.data
          : res?.data?.message || 'Hủy đơn giao hàng thành công.';

      setUiNotice(normalizeNoticeMessage(successMessage));
      closeCancelModal();
      closeOrderDetailModal();
      await fetchWaiterOrders();
    } catch (err) {
      const data = err?.response?.data;
      const detailText = typeof data?.detail === 'string' ? data.detail.trim() : '';
      const rawText = typeof data === 'string' ? data.trim() : '';
      const detail = data?.errors && typeof data.errors === 'object'
        ? Object.entries(data.errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : String(msgs)}`)
            .join('\n')
        : '';
      const msg =
        data?.message ||
        data?.title ||
        detailText ||
        rawText ||
        err?.message ||
        'Không thể hủy đơn giao hàng.';
      alert(detail ? `${msg}\n${detail}` : msg);
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const updateCartQuantity = (itemId, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === itemId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const updateBuffetChildQuantity = (itemId, delta) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        const next = Math.max(0, Number(item.quantityBufferChildent || 0) + delta);
        return { ...item, quantityBufferChildent: next };
      })
    );
  };

  const removeCartItem = (itemId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const cartTotal = cartItems.reduce((sum, item) => {
    const adult = Number(item.price || 0) * Number(item.quantity || 0);
    const child = item.type === 'buffet'
      ? Number(item.childrenPrice || 0) * Number(item.quantityBufferChildent || 0)
      : 0;
    return sum + adult + child;
  }, 0);

  const canProceedToPayment = orderItemsState.every(
    (item) =>
      item.dishStatus === 'cancelled' ||
      item.dishStatus === 'served' ||
      item.dishStatus === 'completed'
  );

  const canOrderProceedToPayment = (order) =>
    (order?.items || []).every(
      (item) =>
        item.dishStatus === 'cancelled' ||
        item.dishStatus === 'served' ||
        item.dishStatus === 'completed'
    );

  const closeItemCancelModal = () => {
    setItemCancelIndex(null);
    setItemCancelReason('');
  };

  const closeOrderDetailModal = () => {
    closeItemCancelModal();
    setShowOrderDetailModal(false);
  };

  const handleConfirmCancelItem = async () => {
    const reason = String(itemCancelReason || '').trim();
    if (itemCancelIndex == null || reason === '') {
      alert('Vui lòng chọn hoặc nhập lý do hủy món.');
      return;
    }
    const item = orderItemsState[itemCancelIndex];
    if (!item) {
      closeItemCancelModal();
      return;
    }
    if (isDeliveryOrder(selectedOrder)) {
      alert('Đơn giao hàng không cho phép hủy món từ phần phục vụ.');
      closeItemCancelModal();
      return;
    }
    const ids = resolveOrderItemNumericIds(item);
    if (ids.length === 0) {
      alert('Không tìm thấy mã dòng món (orderItemId) để hủy.');
      return;
    }
    try {
      setIsCancellingItem(true);
      await Promise.all(ids.map((id) => apiCancelItem(id, reason)));
      const patchCancelled = (arr) =>
        (arr || []).map((it, i) =>
          i === itemCancelIndex ? { ...it, dishStatus: 'cancelled' } : it
        );
      setOrderItemsState((prev) => patchCancelled(prev));
      setSelectedOrder((prev) => (prev ? { ...prev, items: patchCancelled(prev.items || []) } : prev));
      setUiNotice('Đã hủy món thành công.');
      closeItemCancelModal();
      await fetchWaiterOrders();
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        data?.message ||
        data?.title ||
        (typeof data === 'string' ? data : '') ||
        err?.message ||
        'Không thể hủy món.';
      alert(msg);
    } finally {
      setIsCancellingItem(false);
    }
  };

  const openOrderPaymentLink = (order) => {
    setSelectedOrder(order);
    setShowPaymentModal(true);
  };

  const handleAdvanceDeliveryStatus = async (order) => {
    const orderCode = resolveOrderCode(order);
    if (!orderCode) {
      alert('Không tìm thấy mã đơn giao hàng.');
      return;
    }

    const doneStates = ['completed', 'done', 'delivered', 'success', 'cancelled', 'canceled', 'failed'];
    if (doneStates.includes(String(order?.deliveryWorkflowStatus || '').toLowerCase())) {
      return;
    }

    const isStartAction = String(order?.deliveryActionLabel || '').trim().toUpperCase() === 'BẮT ĐẦU GIAO';
    if (isStartAction && !canStartDeliveryByItems(order)) {
      setUiNotice('Bếp chưa làm xong món. Chỉ bắt đầu giao khi tất cả món đã sẵn sàng.');
      return;
    }

    const isDelivering = ['delivering', 'shipping', 'onroute', 'intransit'].includes(
      String(order?.deliveryWorkflowStatus || '').toLowerCase()
    );
    if (isDelivering && !order?.isPaid) {
      setUiNotice('Đơn chưa thanh toán. Cần thanh toán trước khi hoàn thành giao hàng.');
      return;
    }

    try {
      setChangingDeliveryOrderCode(orderCode);
      const res = await orderAPI.changeStatus(orderCode);
      const message = typeof res?.data === 'string' ? res.data : (res?.data?.message || 'Cập nhật trạng thái giao hàng thành công.');
      setUiNotice(normalizeNoticeMessage(message));
      await fetchWaiterOrders();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.detail || err?.message || 'Không cập nhật được trạng thái giao hàng.';
      alert(msg);
    } finally {
      setChangingDeliveryOrderCode('');
    }
  };

  const handleProceedPayment = async () => {
    if (!selectedOrder) return;
    if (!canProceedToPayment) {
      alert('Cần phục vụ xong tất cả món trước khi thanh toán.');
      return;
    }

    const orderCode = resolveOrderCode(selectedOrder);
    if (!orderCode) {
      alert('Không xác định được mã đơn để thanh toán.');
      return;
    }

    const pickApiMessage = (err, fallback) => {
      const data = err?.response?.data;
      if (typeof data === 'string' && data.trim()) return data.trim();
      if (typeof data?.message === 'string' && data.message.trim()) return data.message.trim();
      if (typeof data?.title === 'string' && data.title.trim()) return data.title.trim();
      return err?.message || fallback;
    };

    const openRemainingQr = async () => {
      const returnTo = `${window.location.pathname}${window.location.search || ''}`;
      const res = await createRemainingPaymentQr({
        orderCode,
        returnUrl: `${window.location.origin}/payment/success?orderCode=${encodeURIComponent(orderCode)}&returnTo=${encodeURIComponent(returnTo)}`,
        cancelUrl: `${window.location.origin}/payment/cancel?orderCode=${encodeURIComponent(orderCode)}&returnTo=${encodeURIComponent(returnTo)}`,
      });
      const payload = res?.data?.data ?? res?.data ?? {};
      const checkoutUrl = String(payload?.checkoutUrl || '').trim();
      const qrCode = String(payload?.qrCode || '').trim();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
        return true;
      }
      if (qrCode) {
        alert(`Đã tạo QR thanh toán phần còn thiếu.\nMã QR: ${qrCode}`);
        return true;
      }
      alert('Không tạo được QR thanh toán phần còn thiếu.');
      return false;
    };

    if (activePaymentMethod === 'cash') {
      if (!isCashAmountValid) {
        alert('Tiền khách đưa phải lớn hơn 0.');
        return;
      }

      const orderId = Number(selectedOrder.orderId || selectedOrder.rawOrderId || 0);
      if (!Number.isFinite(orderId) || orderId <= 0) {
        alert('Không xác định được orderId để thanh toán tiền mặt.');
        return;
      }

      try {
        setIsPaying(true);
        const amount = receivedMoneyValue;
        await payOrderCash({
          orderId,
          amount,
          note:
            isDineInOrder(selectedOrder) && voucherCode.trim()
              ? `Thanh toán tiền mặt - voucher: ${voucherCode.trim()}`
              : 'Thanh toán tiền mặt tại quầy',
        });

        let completedAfterCash = false;
        try {
          const refreshedRes = await orderAPI.getByCode(orderCode);
          const raw = refreshedRes?.data?.data ?? refreshedRes?.data ?? {};
          const mapped = mapApiOrderToWaiter(raw);
          completedAfterCash = mapped.status === 'completed' || mapped.isPaid === true;
        } catch {
          // fallback: nếu chưa đọc được đơn mới thì vẫn refresh danh sách ngoài
        }

        if (completedAfterCash) {
          alert('Thanh toán thành công. Đơn đã hoàn tất.');
          setShowPaymentModal(false);
          closeOrderDetailModal();
          await fetchWaiterOrders();
          return;
        }

        alert(
          `Đã ghi nhận thanh toán tiền mặt ${formatCurrency(amount)}. ` +
          `Đơn còn thiếu ${formatCurrency(remainingAfterCash)} và sẽ chuyển sang thanh toán QR.`
        );
        await openRemainingQr();
        await fetchWaiterOrders();
      } catch (err) {
        alert(pickApiMessage(err, 'Lỗi thanh toán tiền mặt.'));
      } finally {
        setIsPaying(false);
      }
      return;
    }

    try {
      setIsPaying(true);
      await openRemainingQr();
    } catch (err) {
      alert(pickApiMessage(err, 'Lỗi kết nối API thanh toán.'));
    } finally {
      setIsPaying(false);
    }
  };

  // Hoàn tác: Đóng tất cả modal khi quay lại
  const closeCreateFlow = () => {
    setShowCreateModal(false);
    setShowOrderInfoModal(false);
    setShowTablePickerModal(false);
    setReservationSoftTimingAck(false);
  };

  // Quay lại trang khởi tạo đơn hàng mới (bước đầu tiên)
  const backToCreateOrderStart = () => {
    setShowOrderInfoModal(false);
    setShowCreateModal(true);
    setReservationSoftTimingAck(false);
  };

  const toggleTableSelection = (tableId) => {
    const table = tables.find((item) => item.id === tableId);
    if (!table || table.status === 'occupied') {
      return;
    }

    setTableSelection((prev) => {
      if (prev.mainTableId === tableId) {
        return prev;
      }

      if (prev.mergedTableIds.includes(tableId)) {
        return {
          ...prev,
          mergedTableIds: prev.mergedTableIds.filter((id) => id !== tableId)
        };
      }

      if (!prev.mainTableId) {
        return { ...prev, mainTableId: tableId };
      }

      return {
        ...prev,
        mergedTableIds: [...prev.mergedTableIds, tableId]
      };
    });
  };

  const totalSelectedTables =
    (tableSelection.mainTableId ? 1 : 0) + tableSelection.mergedTableIds.length;
  const totalSeats = tables
    .filter(
      (table) =>
        table.id === tableSelection.mainTableId || tableSelection.mergedTableIds.includes(table.id)
    )
    .reduce((sum, table) => sum + table.seats, 0);

  const displayedServiceHistory = showAllServiceHistory ? serviceHistory : serviceHistory.slice(0, 7);
  // Orders tab counts and currentOrders
  const dineInCount = dineInOrders.length;
  const takeawayCount = takeawayOrders.length;
  const deliveryCount = deliveryOrders.length;
  const currentOrders =
    activeTab === 'dineIn'
      ? dineInOrders
      : activeTab === 'takeaway'
      ? takeawayOrders
      : deliveryOrders;

  // DEBUG: Log currentOrders để kiểm tra dữ liệu thực tế
  console.log('[DEBUG][UI] currentOrders:', currentOrders);

  const noticeIsError = /lỗi|thất bại|không thể|chưa|cần|error|failed|cannot|missing|forbidden|unauthorized|bad request/i.test(uiNotice);

  return (
    <div className="waiter-orders-container">
      {uiNotice && (
        <div
          style={{
            position: 'fixed',
            top: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: noticeIsError ? 'rgba(255, 245, 240, 0.96)' : 'rgba(240, 253, 244, 0.96)',
            border: noticeIsError ? '1px solid #ffd8bf' : '1px solid #bbf7d0',
            color: noticeIsError ? '#9a3412' : '#166534',
            borderRadius: 14,
            padding: '11px 16px',
            boxShadow: '0 12px 28px rgba(0,0,0,0.14)',
            backdropFilter: 'blur(6px)',
            maxWidth: 560,
            whiteSpace: 'pre-line',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 180ms ease-out',
          }}
        >
          {noticeIsError ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{uiNotice}</span>
        </div>
      )}
      <header className="waiter-page-header">
        <div>
          <h2 className="waiter-page-title">Quản lý Đơn hàng</h2>
          <p className="waiter-page-subtitle">
            Hôm nay, {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button className="btn-create-order" onClick={() => setShowTablePickerModal(true)}>
          <Plus size={20} />
          Tạo đơn hàng mới
        </button>
      </header>
      {/* ...existing code... */}

      <div className="waiter-orders-layout">
        <section className="orders-main-section">
          <div className="orders-tabs">
            <button
              className={`orders-tab ${activeTab === 'dineIn' ? 'active' : ''}`}
              onClick={() => setActiveTab('dineIn')}
            >
              Tại bàn ({dineInCount})
            </button>
            <button
              className={`orders-tab ${activeTab === 'takeaway' ? 'active' : ''}`}
              onClick={() => setActiveTab('takeaway')}
            >
              Mang đi ({takeawayCount})
            </button>
            <button
              className={`orders-tab ${activeTab === 'delivery' ? 'active' : ''}`}
              onClick={() => setActiveTab('delivery')}
            >
              Giao hàng ({deliveryCount})
            </button>
          </div>

          <div className="orders-grid">
            {loadingOrders && <p className="order-items">Đang tải danh sách đơn hàng...</p>}
            {!loadingOrders && currentOrders.length === 0 && (
              <p className="order-items">Chưa có đơn hàng nào trong mục này.</p>
            )}
            {!loadingOrders && currentOrders.map((order) => {
              // Với đơn giao hàng: chỉ tô viền xanh ở trạng thái "BẮT ĐẦU GIAO" và món đã sẵn sàng.
              const isDeliveryOrder = normalizeOrderType(order.channel) === 'delivery';
              const canStartDelivery = isDeliveryOrder ? canStartDeliveryByItems(order) : true;
              const isStartDeliveryAction = isDeliveryOrder && String(order?.deliveryActionLabel || '').trim().toUpperCase() === 'BẮT ĐẦU GIAO';
              const hasReady = isDeliveryOrder
                ? (isStartDeliveryAction && canStartDelivery)
                : (Array.isArray(order.items) && order.items.some(item => item.dishStatus === 'ready'));
              const allServed = Array.isArray(order.items) && order.items.length > 0 && order.items.every(item => item.dishStatus === 'served');
              const canPayThisOrder = canOrderProceedToPayment(order);
              const isDoneDelivery = ['completed', 'done', 'delivered', 'success', 'cancelled', 'canceled', 'failed']
                .includes(String(order?.deliveryWorkflowStatus || '').toLowerCase());
              const isChangingDelivery = changingDeliveryOrderCode === String(order.id || '');
              const deliveryActionClass = isDeliveryOrder ? getDeliveryActionClass(order.deliveryActionLabel) : '';
              const deliveryActionUpper = String(order?.deliveryActionLabel || '').trim().toUpperCase();
              const isCompleteDeliveryBtn = isDeliveryOrder && deliveryActionUpper === 'HOÀN THÀNH GIAO';
              const deliveryPayBtnLabel = isDeliveryOrder
                ? isChangingDelivery
                  ? 'ĐANG CẬP NHẬT...'
                  : order.isPaid && isCompleteDeliveryBtn
                    ? 'HOÀN THÀNH GIAO · ĐÃ TT'
                    : order.deliveryActionLabel
                : 'Thanh toán';
              const deliveryPayTitle = isDeliveryOrder
                ? [
                    order.isPaid && isCompleteDeliveryBtn
                      ? 'Khách đã thanh toán trước (CK/online) — chỉ giao hàng, không thu tiền.'
                      : '',
                    isStartDeliveryAction && !canStartDelivery
                      ? 'Bếp chưa làm xong món, chưa thể bắt đầu giao.'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                : canPayThisOrder
                  ? ''
                  : 'Cần phục vụ xong tất cả món trước khi thanh toán';
              return (
                <div
                  key={order.id}
                  className={`order-card${hasReady ? ' order-card-ready' : ''}${allServed ? '' : ''}`}
                  onClick={() => (isDineInOrder(order) ? openOrderQrModal(order) : openOrderDetail(order))}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="order-card-header">
                    <div>
                      <h4 className="order-id">
                        {order.tableNumber ? order.tableNumber : `#${order.id}`}
                      </h4>
                      <span className="order-time">{order.tableNumber ? `#${order.id}` : order.time}</span>
                    </div>
                    <span className={`order-status ${getStatusClass(order.status)}`}>
                      {order.statusLabel}
                    </span>
                  </div>

                <div className="order-card-body">
                  <div className="order-info-row">
                    <User size={18} className="order-icon" />
                    <span className="order-customer-name">
                      {order.customerName || order.tableNumber}
                    </span>
                  </div>

                  {order.address && (
                    <div className="order-info-row">
                      <MapPin size={18} className="order-icon muted" />
                      <p className="order-address">{order.address}</p>
                    </div>
                  )}

                  {order.guests && (
                    <div className="order-info-row">
                      <User size={18} className="order-icon muted" />
                      <span className="order-text">{order.guests} người</span>
                    </div>
                  )}

                  <div className="order-info-row">
                    <Utensils size={18} className="order-icon muted" />
                    <p className="order-items">{getOrderItemsSummary(order)}</p>
                  </div>

                  {isDeliveryOrder && order.isPaid && (
                    <div className="order-info-row order-paid-notice" title="Khách đã thanh toán trước khi giao hàng">
                      <CheckCircle2 size={18} className="order-icon order-icon--paid" />
                      <span className="order-paid-notice__text">Đã thanh toán — chỉ giao hàng, không thu tiền</span>
                    </div>
                  )}
                </div>

                <div className="order-card-actions">
                  <button className="btn-order-detail" onClick={(e) => { e.stopPropagation(); openOrderDetail(order); }}>
                    Chi tiết
                  </button>
                  {isDeliveryOrder && !isDoneDelivery && (
                    <button
                      className="btn-danger-outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCancelModal(order);
                      }}
                    >
                      Hủy đơn
                    </button>
                  )}
                  <button
                    className={`btn-order-pay ${isDeliveryOrder ? deliveryActionClass : ''}`.trim()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDeliveryOrder) {
                        if (order?.deliveryActionLabel === 'CHỜ THANH TOÁN') {
                          openOrderPaymentLink(order);
                          return;
                        }
                        handleAdvanceDeliveryStatus(order);
                        return;
                      }
                      if (!canPayThisOrder) {
                        alert('Không thể thanh toán: còn món chưa được phục vụ.');
                        return;
                      }
                      alert('Đang mở màn hình thanh toán...');
                      setSelectedOrder(order);
                      setShowPaymentModal(true);
                    }}
                    aria-disabled={isDeliveryOrder ? (isDoneDelivery || isChangingDelivery) : !canPayThisOrder}
                    title={deliveryPayTitle || undefined}
                    style={(isDeliveryOrder ? (isDoneDelivery || isChangingDelivery || (isStartDeliveryAction && !canStartDelivery)) : !canPayThisOrder)
                      ? { opacity: 0.6, cursor: 'not-allowed' }
                      : undefined}
                  >
                    {isDeliveryOrder ? deliveryPayBtnLabel : 'Thanh toán'}
                  </button>
                </div>
              </div>
            )})}
          </div>

          <div className="service-history-section">
            <div className="section-header">
              <h3 className="section-title">Lịch sử phục vụ 7 ngày</h3>
              <button
                className="btn-view-all"
                type="button"
                onClick={() => setShowAllServiceHistory((prev) => !prev)}
              >
                {showAllServiceHistory ? 'Thu gọn' : 'Xem tất cả'}
              </button>
            </div>

            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Tổng đơn</th>
                    <th>Doanh thu</th>
                    <th>Đánh giá</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedServiceHistory.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: '#7a6f66' }}>
                        Chưa có dữ liệu lịch sử 7 ngày.
                      </td>
                    </tr>
                  )}
                  {displayedServiceHistory.map((record, index) => (
                    <tr key={index}>
                      <td>{record.date}</td>
                      <td className="font-medium">{record.totalOrders}</td>
                      <td>{record.revenue}</td>
                      <td>{record.rating || '-'}</td>
                      <td>
                        <span className={record.statusClass || 'status-pending'}>
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon">
                  <Plus size={20} />
                </div>
                <h3 className="modal-title">Khởi tạo Đơn hàng mới</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Vui lòng chọn phương thức khởi tạo đơn hàng để tiếp tục
              </p>
              <div className="order-type-grid">
                <label className="order-type-option">
                  <input
                    type="radio"
                    name="orderType"
                    value="reservation"
                    checked={createOrderType === 'reservation'}
                    onChange={(e) => setCreateOrderType(e.target.value)}
                  />
                  <div className="option-card">
                    <div className="option-icon icon-blue">
                      <Calendar size={28} />
                    </div>
                    <h4 className="option-title">Mã Đặt Bàn</h4>
                    <p className="option-description">
                      Dành cho khách đã đặt chỗ trước qua hệ thống.
                    </p>
                  </div>
                </label>
                <label className="order-type-option">
                  <input
                    type="radio"
                    name="orderType"
                    value="member"
                    checked={createOrderType === 'member'}
                    onChange={(e) => setCreateOrderType(e.target.value)}
                  />
                  <div className="option-card">
                    <div className="option-icon icon-green">
                      <User size={28} />
                    </div>
                    <h4 className="option-title">Khách Thành Viên</h4>
                    <p className="option-description">
                      Tra cứu theo SĐT/Email để tích điểm & nhận ưu đãi.
                    </p>
                  </div>
                </label>
                <label className="order-type-option">
                  <input
                    type="radio"
                    name="orderType"
                    value="walkin"
                    checked={createOrderType === 'walkin'}
                    onChange={(e) => setCreateOrderType(e.target.value)}
                  />
                  <div className="option-card">
                    <div className="option-icon icon-gray">
                      <User size={28} />
                    </div>
                    <h4 className="option-title">Khách Lẻ</h4>
                    <p className="option-description">
                      Tạo đơn nhanh chóng không cần thông tin khách hàng.
                    </p>
                  </div>
                </label>
              </div>
              {createOrderType !== 'walkin' && (
                <div className="search-section">
                  {createOrderType === 'reservation' ? (
                    <>
                      <div className="search-subsection">
                        <label className="search-label">Nhập SĐT hoặc Email để tìm mã đặt bàn</label>
                        <div className="search-input-wrapper">
                          <input
                            type="text"
                            className="search-input"
                            placeholder="Ví dụ: 0901xxxxxx hoặc email@domain.com"
                            value={reservationContactInput}
                            onChange={(e) => setReservationContactInput(e.target.value)}
                          />
                          <button
                            type="button"
                            className="search-btn"
                            onClick={handleReservationLookup}
                            disabled={reservationLookupLoading}
                            title="Tra cứu mã đặt bàn"
                          >
                            <Search size={16} />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <label className="search-label">Nhập thông tin tra cứu</label>
                      <div className="search-input-wrapper">
                        <input
                          type="text"
                          className="search-input"
                          placeholder="Nhập SĐT/Email thành viên..."
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  {createOrderType === 'reservation' && reservationLookupRows.length > 0 ? (
                    <div className="reservation-list">
                      <p className="reservation-list-title">Danh sách mã đặt bàn</p>
                      {reservationLookupRows.map((row, idx) => {
                        const code = getReservationCode(row);
                        const active = code && code === selectedReservationCode;
                        const customerName = row?.fullName || row?.fullname || row?.customerName || 'Khách hàng';
                        const guests = row?.numberOfGuests || row?.guests || 0;
                        const bookingDate = row?.reservationDate || row?.bookingDate || '';
                        const bookingTime = String(row?.reservationTime || row?.bookingTime || '').slice(0, 5);
                        return (
                          <button
                            key={code || `${customerName}-${idx}`}
                            type="button"
                            className={`reservation-list-item ${active ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedReservationCode(code);
                              fillOrderFormFromReservation(row, code);
                              setReservationTimingNotice(null);
                              setReservationSoftTimingAck(false);
                            }}
                          >
                            <div>
                              <strong>{code || 'Mã chưa xác định'}</strong>
                              <span>{customerName}</span>
                            </div>
                            <small>{bookingDate} {bookingTime ? `• ${bookingTime}` : ''} {guests ? `• ${guests} khách` : ''}</small>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                  {createOrderType === 'reservation' && reservationTimingNotice ? (
                    <div className="reservation-arrival-alert" role="alert">
                      <div className="reservation-arrival-alert-icon">
                        <AlertTriangle size={18} />
                      </div>
                      <div className="reservation-arrival-alert-content">
                        <p className="reservation-arrival-alert-title">
                          {reservationTimingNotice.title}
                        </p>
                        <p className="reservation-arrival-alert-text">
                          {reservationTimingNotice.lines?.[0] || ''}
                        </p>
                        <p className="reservation-arrival-alert-text">
                          {reservationTimingNotice.lines?.[1] || ''}
                        </p>
                      </div>
                    </div>
                  ) : null}
                  <p className="search-hint">
                    {createOrderType === 'reservation'
                      ? 'ℹ️ Bấm tra cứu để lấy danh sách mã đặt bàn, sau đó chọn mã cần tạo đơn.'
                      : 'ℹ️ Nhấn "Tiếp tục" sau khi đã xác nhận thông tin.'}
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>
                Hủy bỏ
              </button>
              <button
                className="btn-continue"
                onClick={async () => {
                  // Validate input, then move to next step (showOrderInfoModal or showAddItemsModal...)
                  if ((createOrderType === 'reservation' || createOrderType === 'member') && !searchInput.trim()) {
                    alert('Vui lòng nhập thông tin tra cứu!');
                    return;
                  }
                  // Tự động fill thông tin cá nhân nếu là thành viên/đặt chỗ
                  if (createOrderType === 'reservation') {
                    try {
                      const keyword = searchInput.trim();
                      let found = selectedReservation;

                      if (!found) {
                        const lookupKeyword = reservationContactInput.trim();
                        if (!lookupKeyword) {
                          alert('Vui lòng nhập SĐT hoặc Email và tra cứu mã đặt bàn trước.');
                          return;
                        }
                        const data = await checkReservationAvailabilityByPhoneOrEmail(lookupKeyword);
                        const rows = normalizeReservationLookupRows(data);
                        setReservationLookupRows(rows);
                        found = rows.find((r) => getReservationCode(r).toUpperCase() === keyword.toUpperCase()) || null;
                      }

                      if (!found) {
                        alert('Không tìm thấy mã đặt bàn này. Vui lòng kiểm tra lại.');
                        return;
                      }

                      const finalCode = fillOrderFormFromReservation(found, keyword);
                      if (!finalCode) {
                        alert('Không lấy được mã đặt bàn hợp lệ. Vui lòng chọn lại.');
                        return;
                      }
                      const timingStep = validateReservationArrivalWindow(found);
                      if (timingStep === 'block') {
                        return;
                      }
                      if (timingStep === 'warn') {
                        if (!reservationSoftTimingAck) {
                          setReservationSoftTimingAck(true);
                          return;
                        }
                      } else {
                        setReservationSoftTimingAck(false);
                      }
                    } catch (err) {
                      const status = err?.response?.status;
                      const message = err?.response?.data?.message || err?.message || 'Không thể tra cứu mã đặt bàn lúc này.';
                      alert(`Tra cứu thất bại (${status || 'N/A'}): ${message}`);
                      return;
                    }
                  } else if (createOrderType === 'member') {
                    try {
                      const keyword = searchInput.trim();
                      const isEmail = keyword.includes('@');

                      let found = null;

                      // Ưu tiên endpoint profile theo contact vì backend lookup trả Invalid type.
                      try {
                        const profileData = await getProfile(keyword);
                        const profilePayload = profileData?.data || profileData || {};
                        found = Array.isArray(profilePayload)
                          ? profilePayload[0]
                          : (Array.isArray(profilePayload?.items) ? profilePayload.items[0] : profilePayload);
                      } catch {
                        // Nếu không tra cứu được profile thì giữ fallback điền tay từ input.
                        found = null;
                      }

                      if (found) {
                        setOrderForm(prev => ({
                          ...prev,
                          fullName: found.fullName || found.fullname || found.customerName || found.name || prev.fullName,
                          phone: found.phone || found.phoneNumber || prev.phone,
                          email: found.email || prev.email,
                          guests: String(found.numberOfGuests || found.guests || prev.guests || ''),
                          orderCode: found.reservationCode || found.orderCode || prev.orderCode,
                          bookingDate: found.reservationDate || found.bookingDate || prev.bookingDate,
                          bookingTime: String(found.reservationTime || found.bookingTime || '').slice(0, 5) || prev.bookingTime,
                        }));
                      } else {
                        setOrderForm(prev => ({
                          ...prev,
                          email: isEmail ? keyword : prev.email,
                          phone: isEmail ? '' : keyword
                        }));
                      }
                    } catch (err) {
                      const keyword = searchInput.trim();
                      const isEmail = keyword.includes('@');
                      console.warn('Lookup member failed:', err?.response?.status, err?.response?.data || err?.message);
                      setOrderForm(prev => ({
                        ...prev,
                        email: isEmail ? keyword : prev.email,
                        phone: isEmail ? '' : keyword
                      }));
                    }
                  }
                  setShowCreateModal(false);
                  setShowOrderInfoModal(true); // sang bước tiếp theo
                }}
              >
                Tiếp tục
                <span className="btn-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrderInfoModal && (
        <div className="modal-overlay" onClick={closeCreateFlow}>
          <div className="modal-container modal-medium" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon">
                  <Receipt size={20} />
                </div>
                <h3 className="modal-title">Thông tin chi tiết đơn hàng</h3>
              </div>
              <button className="modal-close-btn" onClick={closeCreateFlow}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body modal-scroll-body">
              <form className="detail-form-grid">
                <section className="form-section">
                  <div className="form-section-title">
                    <User size={18} />
                    <h4>Phần 1: Thông tin cá nhân</h4>
                  </div>
                  <div className="form-two-columns">
                    <div className="field-group">
                      <label>Họ và tên</label>
                      <input
                        type="text"
                        value={orderForm.fullName}
                        onChange={(e) =>
                          setOrderForm((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                      />
                    </div>
                    <div className="field-group">
                      <label>Số điện thoại</label>
                      <input
                        type="tel"
                        value={orderForm.phone}
                        onChange={(e) =>
                          setOrderForm((prev) => ({ ...prev, phone: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </section>

                <section className="form-section">
                  <div className="form-section-title">
                    <Calendar size={18} />
                    <h4>Phần 2: Thông tin đặt chỗ</h4>
                  </div>

                  <div className="form-two-columns">
                    <div className="field-group">
                      <label>Mã đặt chỗ / Mã đơn</label>
                      <input type="text" value={orderForm.orderCode} readOnly className="field-readonly" />
                    </div>
                    <div className="field-group">
                      <label>Loại đơn hàng</label>
                      <select
                        value={orderForm.orderType}
                        disabled={hasSelectedTable}
                        onChange={(e) =>
                          setOrderForm((prev) => ({ ...prev, orderType: e.target.value }))
                        }
                      >
                        <option value="at-place">Ăn tại chỗ</option>
                        <option value="take-away">Mang về</option>
                        <option value="delivery">Giao hàng</option>
                        <option value="event">Sự kiện</option>
                      </select>
                      {hasSelectedTable && (
                        <small style={{ color: '#6b7280' }}>
                          Đã chọn bàn nên loại đơn hàng được khóa ở "Ăn tại chỗ".
                        </small>
                      )}
                    </div>
                  </div>

                  <div className="form-three-columns">
                    <div className="field-group">
                      <label>Số lượng khách</label>
                      <input
                        type="number"
                        min="1"
                        value={orderForm.guests}
                        onChange={(e) =>
                          setOrderForm((prev) => ({ ...prev, guests: e.target.value }))
                        }
                      />
                    </div>
                    <div className="field-group">
                      <label>Ngày đặt bàn</label>
                      <input
                        type="date"
                        value={orderForm.bookingDate}
                        onChange={(e) =>
                          setOrderForm((prev) => ({ ...prev, bookingDate: e.target.value }))
                        }
                      />
                    </div>
                    {/* Ẩn trường Giờ đặt bàn nếu là khách lẻ */}
                    {createOrderType !== 'walkin' && (
                      <div className="field-group">
                        <label>Giờ đặt bàn</label>
                        <input
                          type="time"
                          value={orderForm.bookingTime}
                          onChange={(e) =>
                            setOrderForm((prev) => ({ ...prev, bookingTime: e.target.value }))
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="field-group">
                    <label>Ghi chú đơn hàng</label>
                    <textarea
                      rows="3"
                      placeholder="Ghi chú về dị ứng, vị trí ngồi, yêu cầu đặc biệt..."
                      value={orderForm.note}
                      onChange={(e) =>
                        setOrderForm((prev) => ({ ...prev, note: e.target.value }))
                      }
                    />
                  </div>

                  {/* Đã chọn bàn ở bước trước, không cần nút chọn bàn và cảnh báo nữa */}
                </section>
              </form>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={backToCreateOrderStart}>
                <ArrowLeft size={16} />
                Quay lại
              </button>
              <button
                className="btn-continue"
                onClick={async () => {
                  // Validate: phải chọn bàn
                  const tableIds = [tableSelection.mainTableId, ...tableSelection.mergedTableIds]
                    .filter(Boolean)
                    .map(tid => {
                      if (typeof tid === 'number') return tid;
                      const found = tables.find(t => t.code === tid && typeof t.id === 'number');
                      return found ? found.id : undefined;
                    })
                    .filter(id => typeof id === 'number');
                  if (!tableIds || tableIds.length === 0) {
                    alert('Bạn phải chọn ít nhất 1 bàn trước khi tạo đơn!');
                    return;
                  }
                  const invalidTables = tableIds.filter(id => {
                    const found = tables.find(t => t.id === id);
                    if (!found) return true;
                    const status = String(found.status || '').trim().toLowerCase();
                    // Log trạng thái thực tế để debug
                    console.log('Kiểm tra bàn:', found.id, 'status:', found.status);
                    return !['empty', 'available'].includes(status);
                  });
                  if (invalidTables.length > 0) {
                    alert('Bạn chỉ được chọn bàn trống!');
                    return;
                  }
                  // Chuẩn bị payload và gọi API đúng loại đơn
                  let payload;
                  let apiFunc;
                  const orderTypeMap = {
                    'at-place': 'DineIn',
                    'take-away': 'TakeAway',
                    'delivery': 'Delivery',
                    event: 'EventBooking',
                  };
                  const apiOrderType = orderTypeMap[orderForm.orderType] || 'DineIn';

                  if (createOrderType === 'walkin') {
                    // Khách lẻ: lấy đúng dữ liệu từ UI, không fix cứng
                    payload = {
                      orderType: apiOrderType,
                      tableIds,
                      numberOfGuests: Number(orderForm.guests) || 1,
                      note: orderForm.note,
                      orderItems: cartItems.map(item => {
                        let obj = { quantity: Number(item.quantity) || 1, note: item.note || '' };
                        if (item.foodId && typeof item.foodId === 'number' && item.foodId > 0) {
                          obj.foodId = item.foodId;
                        } else if (item.comboId && typeof item.comboId === 'number' && item.comboId > 0) {
                          obj.comboId = item.comboId;
                        } else if (item.buffetId && typeof item.buffetId === 'number' && item.buffetId > 0) {
                          obj.buffetId = item.buffetId;
                        }
                        return obj;
                      }).filter(item => (item.foodId || item.comboId || item.buffetId))
                    };
                    if (payload.orderItems.length === 0) delete payload.orderItems;
                    const walkVat = roundOrderMoney(cartTotal * ORDER_VAT_RATE);
                    payload.taxAmount = walkVat;
                    payload.vatAmount = walkVat;
                    payload.totalAmount = cartTotal + walkVat;
                    payload.TotalAmount = cartTotal + walkVat;
                    apiFunc = createGuestOrder;
                  } else if (createOrderType === 'reservation') {
                    const reserved =
                      reservationLookupRows.find(
                        (row) =>
                          String(getReservationCode(row)).toUpperCase() ===
                          String(orderForm.orderCode || selectedReservationCode || '').toUpperCase()
                      ) || selectedReservation;
                    if (reserved) {
                      const timingSubmit = validateReservationArrivalWindow(reserved);
                      if (timingSubmit === 'block') {
                        return;
                      }
                      if (timingSubmit === 'warn' && !reservationSoftTimingAck) {
                        alert('Vui lòng đọc cảnh báo thời gian và nhấn Tiếp tục hai lần ở bước chọn mã đặt bàn trước khi hoàn tất.');
                        return;
                      }
                    }
                    const reservationCode = String(orderForm.orderCode || selectedReservationCode || searchInput || '').trim();
                    payload = {
                      reservationCode,
                      bookingCode: reservationCode,
                      orderType: apiOrderType,
                      tableIds,
                      numberOfGuests: Number(orderForm.guests) || 1,
                      note: orderForm.note
                    };
                    apiFunc = createOrderByReservation;
                  } else {
                    // member
                    const keyword = searchInput.trim();
                    const isEmail = keyword.includes('@');
                    const contactEmail = isEmail ? keyword : String(orderForm.email || '').trim();
                    const contactPhone = isEmail ? String(orderForm.phone || '').trim() : keyword;

                    if (!contactEmail && !contactPhone) {
                      alert('Vui lòng nhập SĐT hoặc Email hợp lệ cho khách thành viên.');
                      return;
                    }

                    payload = {
                      tableIds,
                      orderType: apiOrderType,
                      ...(contactPhone ? { phone: contactPhone } : {}),
                      ...(contactEmail ? { email: contactEmail } : {}),
                      numberOfGuests: Number(orderForm.guests) || 1,
                      note: orderForm.note
                    };
                    apiFunc = createOrderByContact;
                  }
                  try {
                    await apiFunc(payload);
                    alert('Đã tạo đơn thành công!');
                    setReservationSoftTimingAck(false);
                    setShowOrderInfoModal(false);
                    if (typeof fetchWaiterOrders === 'function') fetchWaiterOrders();
                    // Cập nhật trạng thái bàn vừa chọn ngay trên UI để tránh cảm giác trễ.
                    if (createOrderType === 'walkin') {
                      setTables((prev) =>
                        prev.map((t) => (tableIds.includes(t.id) ? { ...t, status: 'OPEN' } : t))
                      );
                    }
                    await reloadTables();
                    setTableSelection({ mainTableId: null, mergedTableIds: [] });
                  } catch (err) {
                    const errors = err?.response?.data?.errors;
                    let msg = err?.response?.data?.message || err.message || 'Tạo đơn thất bại!';
                    if (errors && typeof errors === 'object') {
                      const detail = Object.entries(errors)
                        .map(([field, arr]) => `${field}: ${Array.isArray(arr) ? arr.join(', ') : String(arr)}`)
                        .join('\n');
                      if (detail) msg = `${msg}\n${detail}`;
                    }
                    alert(msg);
                  }
                }}
              >
                Hoàn thành thông tin đơn
                <CheckCircle2 size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showTablePickerModal && (
        <div className="modal-overlay" onClick={() => setShowTablePickerModal(false)}>
          <div className="modal-container modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon">
                  <LayoutGrid size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Chọn bàn phục vụ</h3>
                  <p className="modal-subtitle">Chọn bàn chính trước, sau đó chọn các bàn ghép thêm</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowTablePickerModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="table-legend">
              <div className="legend-item">
                <span className="legend-box empty" /> Bàn trống
              </div>
              <div className="legend-item">
                <span className="legend-box occupied" /> Đang có khách
              </div>
              <div className="legend-item">
                <span className="legend-box selected" /> Đang được chọn
              </div>
            </div>

            <div className="table-picker-body">
              <div className="table-grid">
                {tables.map((table) => {
                  const isMain = table.id === tableSelection.mainTableId;
                  const isMerged = tableSelection.mergedTableIds.includes(table.id);
                  const isSelected = isMain || isMerged;
                  // Chuẩn hóa trạng thái bàn
                  const status = String(table.status || '').trim().toUpperCase();
                  const isAvailable = status === 'AVAILABLE';
                  const isOpen = status === 'OPEN';
                  const isOccupied = isOpen || status === 'OCCUPIED';
                  // Phân loại màu sắc
                  let tableClass = 'table-empty';
                  if (isOccupied) tableClass = 'table-occupied';
                  else if (isSelected) tableClass = 'table-selected';
                  // Disable nếu không phải AVAILABLE
                  const disabled = !isAvailable;
                  return (
                    <button
                      key={table.id}
                      type="button"
                      className={`table-item ${tableClass}`}
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        if (!tableSelection.mainTableId) {
                          setTableSelection({ mainTableId: table.id, mergedTableIds: [] });
                        } else if (tableSelection.mainTableId === table.id) {
                          setTableSelection({ mainTableId: null, mergedTableIds: [] });
                        } else {
                          setTableSelection((prev) => {
                            const merged = prev.mergedTableIds.includes(table.id)
                              ? prev.mergedTableIds.filter((id) => id !== table.id)
                              : [...prev.mergedTableIds, table.id];
                            return { ...prev, mergedTableIds: merged };
                          });
                        }
                      }}
                    >
                      {isMain && <span className="table-badge main">Chính</span>}
                      {isMerged && <span className="table-badge merged">Ghép</span>}
                      <strong>{table.name || table.id}</strong>
                      <span>{table.seats} ghế</span>
                      <span style={{fontSize:'12px',color:'#888'}}>{table.type}</span>
                      <span style={{fontSize:'12px',color:'#888'}}>{status === 'AVAILABLE' ? 'Bàn trống' : status === 'OPEN' ? 'Đang có khách' : status}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="table-picker-summary">
              <div className="summary-left">
                <div>
                  <span>Bàn chính:</span>
                  <strong>{tableSelection.mainTableId || '-'}</strong>
                </div>
                <div>
                  <span>Bàn ghép:</span>
                  <strong>
                    {tableSelection.mergedTableIds.length
                      ? tableSelection.mergedTableIds.join(', ')
                      : 'Chưa chọn'}
                  </strong>
                </div>
              </div>
              <p>
                Tổng cộng: <strong>{totalSelectedTables} bàn</strong> | Sức chứa:{' '}
                <strong>{totalSeats} khách</strong>
              </p>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowTablePickerModal(false)}>
                <ArrowLeft size={16} />
                Quản lý bàn
              </button>
              <button
                className="btn-add-outline"
                onClick={() => setTableCheckModal(true)}
                title="Kiểm tra tình trạng bàn"
              >
                <ClipboardList size={16} />
                Kiểm Tra Bàn
              </button>
              <button
                className="btn-continue"
                onClick={() => {
                  if (!tableSelection.mainTableId) {
                    alert('Vui lòng chọn bàn chính!');
                    return;
                  }
                  setShowTablePickerModal(false);
                  setShowCreateModal(true);
                }}
              >
                Xác nhận chọn bàn
                <CheckCircle2 size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kiểm Tra Bàn */}
      <TableCheckModal
        isOpen={tableCheckModal}
        onClose={() => setTableCheckModal(false)}
        selectedDate={tableCheckDate}
        onDateChange={setTableCheckDate}
        selectedShift={tableCheckShift}
        onShiftChange={setTableCheckShift}
      />

      {showOrderDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeOrderDetailModal}>
          <div className="modal-container modal-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <h3 className="modal-title">Chi tiết đơn hàng #{selectedOrder.id}</h3>
                <span className={`order-status ${getStatusClass(selectedOrder.status)}`}>
                  {selectedOrder.statusLabel}
                </span>
              </div>
              <button className="modal-close-btn" onClick={closeOrderDetailModal}>
                <X size={20} />
              </button>
            </div>

            {isDineInOrder(selectedOrder) ? (
              <div className="dinein-detail-top">
                <div className="dinein-info-card">
                  <p>Số bàn</p>
                  <strong>{selectedOrder.tableNumber || 'Bàn --'}</strong>
                </div>
                <div className="dinein-info-card">
                  <p>Số lượng khách</p>
                  <strong>
                    <Users size={15} /> {selectedOrder.guests ?? '—'}
                  </strong>
                </div>
                <div className="dinein-info-card">
                  <p>Trạng thái chung</p>
                  <span className={`order-status ${getStatusClass(selectedOrder.status)}`}>
                    {selectedOrder.statusLabel}
                  </span>
                </div>
              </div>
            ) : (
              <div className="dinein-detail-top single">
                <div className="dinein-info-card">
                  <p>Trạng thái chung</p>
                  <span className={`order-status ${getStatusClass(selectedOrder.status)}`}>
                    {selectedOrder.statusLabel}
                  </span>
                </div>
              </div>
            )}

            <div className="dinein-detail-body">
              {!isDineInOrder(selectedOrder) && (
                <div className="waiter-delivery-customer-box">
                  <h4>
                    <User size={16} /> Thông tin khách hàng
                  </h4>
                  <div className="waiter-delivery-customer-grid">
                    <div className="waiter-delivery-customer-item">
                      <p className="waiter-delivery-customer-label">Tên khách hàng</p>
                      <strong className="waiter-delivery-customer-value">
                        <User size={15} /> {selectedOrder.customerName || 'Chưa có thông tin'}
                      </strong>
                    </div>
                    <div className="waiter-delivery-customer-item">
                      <p className="waiter-delivery-customer-label">Số điện thoại</p>
                      <strong className="waiter-delivery-customer-value">
                        <Phone size={15} /> {selectedOrder.phone || 'Chưa có thông tin'}
                      </strong>
                    </div>
                    <div className="waiter-delivery-customer-item full">
                      <p className="waiter-delivery-customer-label">Địa chỉ giao hàng</p>
                      <strong className="waiter-delivery-customer-value">
                        <MapPin size={15} /> {selectedOrder.address || 'Chưa có thông tin'}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <h4>
                <Utensils size={16} /> Danh sách món ăn
              </h4>
              <div className="detail-table-wrap">
                <table className="detail-table dish-table">
                  <thead>
                    <tr>
                      <th>Tên món</th>
                      <th>SL</th>
                      <th>Trạng thái</th>
                      <th>Đơn giá</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItemsState.map((item, idx) => {
                      const dishStatus = getDishStatus(item.dishStatus || 'pending');
                      const itemRowIds = resolveOrderItemNumericIds(item);
                      const canCancelThisItem =
                        !isDeliveryOrder(selectedOrder) &&
                        item.dishStatus === 'pending' &&
                        itemRowIds.length > 0;
                      return (
                        <tr key={item.name + idx}>
                          <td>
                            <p>{item.name}</p>
                            {item.note && <small>{item.note}</small>}
                          </td>
                          <td>{item.quantity}</td>
                          <td>
                            <span className={dishStatus.cls}>{dishStatus.label === 'Sẵn sàng' ? 'Sẵn sàng' : dishStatus.label === 'Hoàn thành' ? 'Hoàn thành' : dishStatus.label}</span>
                          </td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>
                            <div className="waiter-dish-actions">
                              {canCancelThisItem && (
                                <button
                                  className="dish-action delete"
                                  type="button"
                                  title="Hủy món (bếp chưa nhận làm)"
                                  onClick={() => {
                                    setItemCancelIndex(idx);
                                    setItemCancelReason('');
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                              {dishStatus.label === 'Sẵn sàng' && (
                                <button
                                  className="dish-action serve"
                                  type="button"
                                  onClick={async () => {
                                  // Gọi API PATCH để cập nhật trạng thái món ăn
                                  try {
                                    const ids = Array.from(
                                      new Set(
                                        [
                                          ...(Array.isArray(item.orderItemIds) ? item.orderItemIds : []),
                                          item.id,
                                          item.orderItemId,
                                          item.itemId,
                                        ]
                                          .map((x) => Number(x || 0))
                                          .filter((x) => Number.isFinite(x) && x > 0)
                                      )
                                    );

                                    if (ids.length === 0) {
                                      alert('Không tìm thấy ID món ăn!');
                                      return;
                                    }

                                    await Promise.all(ids.map((id) => patchOrderItemServed(id)));
                                    setOrderItemsState(prev => prev.map((it, i) => i === idx ? { ...it, dishStatus: 'completed' } : it));
                                  } catch (err) {
                                    alert('Lỗi cập nhật trạng thái món ăn!');
                                  }
                                }}
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            )}
                            {dishStatus.label === 'Hoàn thành' && (
                              <span style={{color:'#4caf50'}}><CheckCircle2 size={14} /></span>
                            )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="total-summary soft">
                <div>
                  <span>Tạm tính</span>
                  <strong>{formatCurrency(calculateOrderSubtotal(selectedOrder))}</strong>
                </div>
                {calculateOrderVat(selectedOrder) > 0 && (
                  <div>
                    <span>VAT (10%)</span>
                    <strong>{formatCurrency(calculateOrderVat(selectedOrder))}</strong>
                  </div>
                )}
                {(selectedOrder?.deliveryFee || 0) > 0 && (
                  <div>
                    <span>Phí ship</span>
                    <strong>{formatCurrency(selectedOrder.deliveryFee || 0)}</strong>
                  </div>
                )}
                {(selectedOrder?.discount || 0) > 0 && (
                  <div>
                    <span>Giảm giá</span>
                    <strong>-{formatCurrency(selectedOrder.discount || 0)}</strong>
                  </div>
                )}
                <div className="grand-total">
                  <span>Tổng cộng</span>
                  <strong>{formatCurrency(calculateOrderTotal(selectedOrder))}</strong>
                </div>
              </div>
            </div>

            <div className="modal-footer split">
              <button className="btn-cancel" onClick={closeOrderDetailModal}>
                Đóng
              </button>
              <div className="detail-footer-actions">
                <button type="button" className="btn-add-outline" onClick={handlePrintWaiterOrderInvoice}>
                  <Printer size={16} /> Xuất hóa đơn
                </button>
                {isDineInOrder(selectedOrder) && (
                  <button className="btn-add-outline" onClick={() => setShowAddItemsModal(true)}>
                    <Plus size={16} /> Thêm món
                  </button>
                )}
                <button
                  className="btn-continue"
                  onClick={() => {
                    if (!canProceedToPayment) {
                      alert('Không thể thanh toán: còn món chưa được phục vụ.');
                      return;
                    }
                    alert('Đang mở màn hình thanh toán...');
                    setShowPaymentModal(true);
                  }}
                  aria-disabled={!canProceedToPayment}
                  title={canProceedToPayment ? '' : 'Cần phục vụ xong tất cả món trước khi thanh toán'}
                  style={!canProceedToPayment ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                >
                  <CreditCard size={18} /> Thanh toán
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {itemCancelIndex !== null && orderItemsState[itemCancelIndex] && (
        <div className="modal-overlay" onClick={closeItemCancelModal}>
          <div className="modal-container modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Hủy món</h3>
              <button className="modal-close-btn" type="button" onClick={closeItemCancelModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#1f2937' }}>
                {orderItemsState[itemCancelIndex]?.name}
              </p>
              <div className="field-group">
                <label>
                  Lý do hủy <span className="required">*</span>
                </label>
                <div className="waiter-cancel-item-quick-reasons">
                  {WAITER_CANCEL_ITEM_QUICK_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="waiter-quick-reason-chip"
                      onClick={() => setItemCancelReason(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={4}
                  placeholder="Chọn nhanh ở trên hoặc nhập lý do chi tiết..."
                  value={itemCancelReason}
                  onChange={(e) => setItemCancelReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer end">
              <button className="btn-cancel" type="button" onClick={closeItemCancelModal}>
                Quay lại
              </button>
              <button
                className="btn-danger-solid"
                type="button"
                onClick={handleConfirmCancelItem}
                disabled={!itemCancelReason.trim() || isCancellingItem}
              >
                <Trash2 size={16} /> {isCancellingItem ? 'Đang xử lý...' : 'Xác nhận hủy món'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTableQrModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowTableQrModal(false)}>
          <div className="modal-container modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">QR gọi món - {selectedOrder.tableNumber || selectedOrder.tableCode || 'Bàn'}</h3>
              <button className="modal-close-btn" onClick={() => setShowTableQrModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {tableQrLoading && <p style={{ margin: 0, color: '#7a6f66' }}>Đang tạo QR từ token bàn...</p>}
              {!tableQrLoading && tableQrError && <p style={{ margin: 0, color: '#cf1322' }}>{tableQrError}</p>}
              {!tableQrLoading && !tableQrError && tableQrValue && (
                <div>
                  <TableQRCode
                    qrValue={tableQrValue}
                    tableName={selectedOrder.tableNumber || selectedOrder.tableName || selectedOrder.tableCode || tableQrCode || 'N/A'}
                    size={180}
                  />
                  <div style={{ marginTop: 10, textAlign: 'center' }}>
                    <a
                      href={tableQrValue}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#c25a18', fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid rgba(194,90,24,0.45)', paddingBottom: 2, letterSpacing: 0.2 }}
                    >
                      Mở trang gọi món và thanh toán qua liên kết này
                    </a>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer end">
              <button className="btn-cancel" onClick={() => setShowTableQrModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeCancelModal}>
          <div className="modal-container modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Hủy đơn hàng #{selectedOrder.id}</h3>
              <button className="modal-close-btn" onClick={closeCancelModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="danger-box">
                <AlertTriangle size={18} />
                <p>Bạn có chắc chắn muốn hủy đơn hàng này không?</p>
              </div>
              <div className="field-group">
                <label>
                  Lý do hủy đơn <span className="required">*</span>
                </label>
                <textarea
                  rows="4"
                  placeholder="Nhập lý do hủy (ví dụ: Khách gọi báo hủy, hết món...)"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer end">
              <button className="btn-cancel" onClick={closeCancelModal}>
                Quay lại
              </button>
              <button className="btn-danger-solid" onClick={handleCancelOrder} disabled={!cancelReason.trim() || isCancellingOrder}>
                <Trash2 size={16} /> Xác nhận hủy đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-container modal-payment" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Thanh toán đơn hàng #{selectedOrder.id}</h3>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowPaymentModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="payment-layout">
              <div className="payment-left">
                <h4>
                  <Receipt size={16} /> Danh sách món đã phục vụ
                </h4>
                <div className="payment-items">
                  {selectedOrder.items.map((item) => (
                    <div key={item.name} className="payment-item">
                      <div>
                        <p>{item.name}</p>
                        <small>Số lượng: {String(item.quantity).padStart(2, '0')}</small>
                      </div>
                      <strong>{formatCurrency(item.quantity * item.price)}</strong>
                    </div>
                  ))}
                </div>
                <div className="payment-totals">
                  <div>
                    <span>Tạm tính:</span>
                    <strong>{formatCurrency(calculateOrderSubtotal(selectedOrder))}</strong>
                  </div>
                  {calculateOrderVat(selectedOrder) > 0 && (
                    <div>
                      <span>VAT (10%):</span>
                      <strong>{formatCurrency(calculateOrderVat(selectedOrder))}</strong>
                    </div>
                  )}
                  <div className="grand-total-box">
                    <span>Tổng cộng:</span>
                    <strong>{formatCurrency(calculateOrderTotal(selectedOrder))}</strong>
                  </div>
                </div>
              </div>

              <div className="payment-right">
                {isDineInOrder(selectedOrder) && (
                  <div className="field-group">
                    <label>Nhập mã Voucher</label>
                    <div className="voucher-input">
                      <TicketPercent size={16} />
                      <input
                        type="text"
                        value={voucherCode}
                        onChange={(e) => setVoucherCode(e.target.value)}
                      />
                      <button type="button">Áp dụng</button>
                    </div>
                    {voucherCode.trim() ? (
                      <p className="voucher-ok">
                        <CheckCircle2 size={14} /> Đã nhập mã {voucherCode}
                      </p>
                    ) : (
                      <p className="voucher-ok">Chưa áp dụng voucher</p>
                    )}
                  </div>
                )}

                <div className="field-group">
                  <label>Phương thức thanh toán</label>
                  <div className="payment-method-grid">
                    <button
                      type="button"
                      className={activePaymentMethod === 'cash' ? 'active' : ''}
                      onClick={() => setActivePaymentMethod('cash')}
                    >
                      <Banknote size={18} /> Tiền mặt
                    </button>
                    <button
                      type="button"
                      className={activePaymentMethod === 'qr' ? 'active' : ''}
                      onClick={() => setActivePaymentMethod('qr')}
                    >
                      {/* QRCode icon cho thanh toán, không phải QR nhỏ bàn */}
                      QR Code
                    </button>
                  </div>
                </div>

                <div className="field-group">
                  <label>Tiền khách đưa</label>
                  <input
                    type="text"
                    value={receivedMoney}
                    onChange={(e) => setReceivedMoney(e.target.value.replace(/[^0-9]/g, ''))}
                    className="money-input"
                  />
                  {activePaymentMethod === 'cash' && hasReceivedMoney && !isCashAmountValid && (
                    <p style={{ color: '#d4380d', marginTop: 8, fontSize: 13 }}>
                      Tiền khách đưa phải lớn hơn 0.
                    </p>
                  )}
                </div>

                <div className="change-box">
                  <span>
                    {activePaymentMethod === 'cash'
                      ? 'Còn thiếu sau tiền mặt:'
                      : 'Tiền thừa trả khách:'}
                  </span>
                  <strong>
                    {hasReceivedMoney
                      ? (activePaymentMethod === 'cash'
                        ? formatCurrency(remainingAfterCash)
                        : formatCurrency(changeAmount))
                      : '--'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="modal-footer payment-modal-footer">
              <button
                type="button"
                className="btn-add-outline payment-invoice-btn"
                onClick={handlePrintWaiterOrderInvoice}
                disabled={isPaying}
              >
                <Printer size={16} /> Xuất hóa đơn
              </button>
              <button
                className="btn-continue payment-complete-btn"
                onClick={handleProceedPayment}
                disabled={isPaying || (activePaymentMethod === 'cash' && !isCashAmountValid)}
                title={activePaymentMethod === 'cash' && !isCashAmountValid ? 'Tiền khách đưa phải lớn hơn 0.' : ''}
              >
                <Receipt size={18} /> {isPaying ? 'ĐANG XỬ LÝ THANH TOÁN...' : 'XÁC NHẬN THANH TOÁN & IN HÓA ĐƠN'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddItemsModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowAddItemsModal(false)}>
          <div className="modal-container modal-add-items" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-icon">
                  <Utensils size={20} />
                </div>
                <div>
                  <h3 className="modal-title">Thêm món vào đơn hàng</h3>
                  <p className="modal-subtitle">
                    {selectedOrder.tableNumber || 'Bàn 05'} • Đơn hàng #{selectedOrder.id}
                  </p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAddItemsModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="add-items-layout">
              <div className="add-items-menu-panel">
                <div className="add-items-toolbar">
                  <div className="menu-category-tabs">
                    <button
                      className={addItemCategory === 'dish' ? 'active' : ''}
                      onClick={() => setAddItemCategory('dish')}
                    >
                      Món lẻ
                    </button>
                    <button
                      className={addItemCategory === 'combo' ? 'active' : ''}
                      onClick={() => setAddItemCategory('combo')}
                    >
                      Combo
                    </button>
                    <button
                      className={addItemCategory === 'buffet' ? 'active' : ''}
                      onClick={() => setAddItemCategory('buffet')}
                    >
                      Buffet
                    </button>
                  </div>
                  <div className="menu-search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      placeholder="Tìm tên món, combo, buffet..."
                    />
                  </div>
                </div>

                {addItemCategory === 'dish' && (
                  <div className="menu-card-grid">
                    {menuLoading && <p>Đang tải món ăn...</p>}
                    {menuError && <p style={{color:'red'}}>{menuError}</p>}
                    {!menuLoading && !menuError && filteredMenuItems.length === 0 && <p>{searchKeyword ? 'Không tìm thấy món phù hợp.' : 'Không có món ăn nào.'}</p>}
                    {!menuLoading && !menuError && filteredMenuItems.map((food) => (
                      <div className="menu-food-card" key={food.foodId || food.id}>
                        <div>
                          <h5>{food.name || food.foodName}</h5>
                          <p>{formatCurrency(food.price)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setCartItems((prev) => {
                              const foodId = Number(food.foodId || food.id || 0);
                              const stableId = foodId > 0 ? `food-${foodId}` : String(food.foodId || food.id);
                              const includedInBuffet = foodId > 0 && buffetFoodIdSet.has(foodId);
                              const found = prev.find((x) => Number(x.foodId || 0) === foodId || String(x.id) === stableId);
                              if (found) {
                                return prev.map((x) =>
                                  (Number(x.foodId || 0) === foodId || String(x.id) === stableId)
                                    ? { ...x, id: stableId, foodId, quantity: x.quantity + 1, price: includedInBuffet ? 0 : Number(x.price || food.price || 0) }
                                    : x
                                );
                              }
                              return [
                                ...prev,
                                {
                                  id: stableId,
                                  foodId,
                                  name: food.name || food.foodName,
                                  price: includedInBuffet ? 0 : Number(food.price || 0),
                                  quantity: 1,
                                  note: ''
                                }
                              ];
                            })
                          }
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {addItemCategory === 'combo' && (
                  <div className="menu-card-grid">
                    {comboLoading && <p>Đang tải combo...</p>}
                    {comboError && <p style={{ color: 'red' }}>{comboError}</p>}
                    {!comboLoading && !comboError && filteredComboMenus.length === 0 && <p>{searchKeyword ? 'Không tìm thấy combo phù hợp.' : 'Không có combo nào.'}</p>}
                    {!comboLoading && !comboError && filteredComboMenus.map((combo) => {
                      const comboId = Number(combo.comboId || combo.id || 0);
                      const displayName = combo.comboName || combo.name || `Combo #${comboId}`;
                      const displayPrice = Number(combo.comboPrice || combo.price || 0);
                      const cartId = `combo-${comboId}`;

                      return (
                      <div className="menu-food-card" key={cartId}>
                        <div>
                          <h5>{displayName}</h5>
                          <p>{formatCurrency(displayPrice)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setCartItems((prev) => {
                              const found = prev.find((x) => x.id === cartId);
                              if (found) {
                                return prev.map((x) =>
                                  x.id === cartId ? { ...x, quantity: x.quantity + 1 } : x
                                );
                              }

                              return [
                                ...prev,
                                {
                                  id: cartId,
                                  comboId,
                                  type: 'combo',
                                  name: displayName,
                                  price: displayPrice,
                                  quantity: 1,
                                  note: ''
                                }
                              ];
                            })
                          }
                          disabled={comboId <= 0}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    )})}
                  </div>
                )}

                {addItemCategory === 'buffet' && (
                  <div className="buffet-panel">
                    <div className="buffet-header-block">
                      <h4>{showBuffetFoods ? 'Món trong gói buffet đã chọn' : 'Danh sách buffet'}</h4>
                      <span>{showBuffetFoods ? '' : 'Chọn gói để thêm vào đơn'}</span>
                    </div>

                    {showBuffetFoods && (
                      <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                        <small style={{ color: '#666' }}>
                          Gói đã chọn: {selectedBuffetIds.length ? selectedBuffetIds.join(', ') : '--'}
                        </small>
                      </div>
                    )}

                    <div className="menu-card-grid buffet-items-grid">
                      {!showBuffetFoods && buffetLoading && <p>Đang tải buffet...</p>}
                      {!showBuffetFoods && buffetError && <p style={{ color: 'red' }}>{buffetError}</p>}

                      {showBuffetFoods && filteredBuffetFoods.length === 0 && <p>{searchKeyword ? 'Không tìm thấy món buffet phù hợp.' : 'Chưa có món buffet trong đơn này.'}</p>}
                      {showBuffetFoods && filteredBuffetFoods.map((food) => (
                        <div className="menu-food-card buffet-child" key={`buffet-food-${food.id}`}>
                          <div>
                            <h5>{food.name}</h5>
                            <p style={{ color: '#666' }}>Đã gồm trong giá buffet</p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCartItems((prev) => {
                                const foodId = Number(food.foodId || food.id || 0);
                                const cartId = `food-${foodId}`;
                                const found = prev.find((x) => Number(x.foodId || 0) === foodId || String(x.id) === cartId);
                                if (found) {
                                  return prev.map((x) =>
                                    (Number(x.foodId || 0) === foodId || String(x.id) === cartId)
                                      ? { ...x, id: cartId, foodId, quantity: x.quantity + 1, price: 0 }
                                      : x
                                  );
                                }

                                return [
                                  ...prev,
                                  {
                                    id: cartId,
                                    foodId,
                                    name: food.name,
                                    price: 0,
                                    quantity: 1,
                                    note: ''
                                  }
                                ];
                              })
                            }
                            disabled={Number(food.foodId || food.id || 0) <= 0}
                            title={Number(food.foodId || food.id || 0) <= 0 ? 'Không xác định được mã món để thêm' : 'Thêm món vào giỏ'}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      ))}

                      {!showBuffetFoods && !buffetLoading && !buffetError && filteredBuffetMenus.length === 0 && <p>{searchKeyword ? 'Không tìm thấy gói buffet phù hợp.' : 'Không có gói buffet nào.'}</p>}
                      {!showBuffetFoods && !buffetLoading && !buffetError && filteredBuffetMenus.map((buffet) => {
                        const buffetId = Number(buffet.buffetId || buffet.id || 0);
                        const displayName = buffet.name || buffet.buffetName || `Buffet #${buffetId}`;
                        const adultPrice = Number(buffet.mainPrice || buffet.price || 0);
                        const childPrice = Number(buffet.childrenPrice || buffet.childPrice || 0);
                        const cartId = `buffet-${buffetId}`;

                        const existingBuffet = cartItems.find((x) => x.type === 'buffet');
                        const hasOtherBuffetSelected =
                          (existingBuffet && Number(existingBuffet.buffetId) !== buffetId) ||
                          (lockedBuffetId && Number(lockedBuffetId) !== buffetId);

                        return (
                          <div className="menu-food-card buffet-child" key={cartId}>
                            <div>
                              <h5>{displayName}</h5>
                              <div style={{ marginTop: 6, fontSize: 12, color: '#666', lineHeight: 1.4 }}>
                                <p style={{ margin: 0 }}><strong>Bảng Giá Chi Tiết</strong></p>
                                <p style={{ margin: '2px 0 0 0' }}>Suất Người Lớn (trên 1m3): {formatCurrency(adultPrice)}</p>
                                <p style={{ margin: '2px 0 0 0' }}>Suất Trẻ Em (1m - 1m3): {formatCurrency(childPrice)}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setCartItems((prev) => {
                                  const pickedBuffet = prev.find((x) => x.type === 'buffet');
                                  if (lockedBuffetId && Number(lockedBuffetId) !== buffetId) {
                                    alert('Đơn này đã có một loại buffet khác. Bạn chỉ có thể thêm cùng loại buffet đó.');
                                    return prev;
                                  }
                                  if (pickedBuffet && Number(pickedBuffet.buffetId) !== buffetId) {
                                    alert('Đơn này đã có một loại buffet khác. Bạn chỉ có thể thêm cùng loại buffet đó.');
                                    return prev;
                                  }

                                  const found = prev.find((x) => x.id === cartId);
                                  if (found) {
                                    return prev.map((x) =>
                                      x.id === cartId ? { ...x, quantity: x.quantity + 1 } : x
                                    );
                                  }

                                  return [
                                    ...prev,
                                    {
                                      id: cartId,
                                      buffetId,
                                      type: 'buffet',
                                      name: displayName,
                                      price: adultPrice,
                                      childrenPrice: childPrice,
                                      quantity: 1,
                                      quantityBufferChildent: 0,
                                      note: ''
                                    }
                                  ];
                                })
                              }
                              disabled={buffetId <= 0 || hasOtherBuffetSelected}
                              title={hasOtherBuffetSelected ? 'Đơn đã có loại buffet khác, không thể thêm.' : ''}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="add-items-cart-panel">
                <div className="cart-header">
                  <h4>
                    <ShoppingBag size={16} /> Giỏ hàng ({cartItems.length})
                  </h4>
                  <button type="button" onClick={() => setCartItems([])}>
                    Xóa tất cả
                  </button>
                </div>
                <div className="cart-items-list">
                  {cartItems.map((item) => (
                    <div key={item.id} className={`cart-item ${item.type === 'buffet' ? 'buffet' : ''}`}>
                      <div className={`cart-item-row ${item.type === 'buffet' ? 'buffet-summary' : ''}`}>
                        <div>
                          <h5>{item.name}</h5>
                          {item.type !== 'buffet' ? (
                            <p>{formatCurrency(item.price)}</p>
                          ) : null}
                        </div>
                        {item.type !== 'buffet' && (
                          <div className="qty-box">
                            <button type="button" onClick={() => updateCartQuantity(item.id, -1)}>
                              -
                            </button>
                            <span>{item.quantity}</span>
                            <button type="button" onClick={() => updateCartQuantity(item.id, 1)}>
                              +
                            </button>
                          </div>
                        )}
                      </div>
                      {item.type === 'buffet' && (
                        <div className="buffet-price-qty-rows">
                          <div className="buffet-price-qty-row">
                            <p className="buffet-line">Suất Người Lớn (trên 1m3): {formatCurrency(item.price)}</p>
                            <div className="qty-box buffet-qty-box">
                              <button type="button" onClick={() => updateCartQuantity(item.id, -1)}>
                                -
                              </button>
                              <span>{item.quantity}</span>
                              <button type="button" onClick={() => updateCartQuantity(item.id, 1)}>
                                +
                              </button>
                            </div>
                          </div>
                          <div className="buffet-price-qty-row">
                            <p className="buffet-line">Suất Trẻ Em (1m - 1m3): {formatCurrency(Number(item.childrenPrice || 0))}</p>
                            <div className="qty-box buffet-qty-box">
                              <button type="button" onClick={() => updateBuffetChildQuantity(item.id, -1)}>
                                -
                              </button>
                              <span>{Number(item.quantityBufferChildent || 0)}</span>
                              <button type="button" onClick={() => updateBuffetChildQuantity(item.id, 1)}>
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {item.selectedChildren && (
                        <div className="buffet-children-tags">
                          {item.selectedChildren.map((child) => (
                            <span key={child}>{child}</span>
                          ))}
                        </div>
                      )}
                      <input
                        className={item.type === 'buffet' ? 'cart-note-input buffet-note-input' : 'cart-note-input'}
                        placeholder="Ghi chú cho món..."
                        value={item.note || ''}
                        onChange={(e) =>
                          setCartItems((prev) =>
                            prev.map((x) => (x.id === item.id ? { ...x, note: e.target.value } : x))
                          )
                        }
                      />
                      <button className="remove-cart-item" type="button" onClick={() => removeCartItem(item.id)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="cart-total-row">
                    <span>Tạm tính</span>
                    <strong>{formatCurrency(cartTotal)}</strong>
                  </div>
                  <button
                    className="btn-continue full"
                    type="button"
                    disabled={isAddingItems}
                    onClick={handleConfirmAddItems}
                  >
                    {isAddingItems ? 'Đang thêm món...' : 'Xác nhận thêm món'}
                    <ArrowLeft size={16} className="rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// End of WaiterOrdersPage component

export default WaiterOrdersPage;
