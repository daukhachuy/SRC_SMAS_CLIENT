import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  CreditCard,
  LayoutGrid,
  MapPin,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  TicketPercent,
  Trash2,
  User,
  Users,
  Utensils,
  X
} from 'lucide-react';
import '../../styles/WaiterPages.css';
import { orderAPI } from '../../api/managerApi';
import { createGuestOrder, createOrderByReservation, createOrderByContact, addItemsToOrder, lookupOrder, getFoodsBufferByOrderCode } from '../../api/orderApi';
import { getFoodByFilter, getBuffetLists, getComboLists } from '../../api/foodApi';
import { patchOrderItemServed } from '../../api/orderItemApi';
import { createPaymentLink, payOrderCash } from '../../api/paymentService';
import { getWaiterTables } from '../../api/waiterApiTable';
import { initTableSession } from '../../api/tableSessionApi';
import TableQRCode from '../../components/TableQRCode';

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
    case 'pending':
    default:
      return { cls: 'dish-status-pending', label: 'Chờ xử lý' };
  }
}

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

const mapOrderStatus = (status) => {
  const s = normalizeStatus(status);
  if (s === 'pending') return { status: 'pending', statusLabel: 'Chờ xử lý' };
  if (s === 'preparing' || s === 'processing') return { status: 'preparing', statusLabel: 'Đang làm' };
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
  if (s === 'ready' || s === 'completed') return 'ready';
  if (s === 'served' || s === 'delivered') return 'served';
  if (s === 'preparing' || s === 'processing' || s === 'cooking') return 'preparing';
  return 'pending';
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
    statusClass: status === 'Hoàn thành' ? 'status-completed' : 'status-pending',
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
        statusClass: row.processingCount > 0 ? 'status-pending' : 'status-completed',
      };
    });
};

const normalizeSearchText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const toOrderItem = (item, idx) => ({
  name: item?.foodName || item?.name || item?.itemName || `Món ${idx + 1}`,
  quantity: Number(item?.quantity || item?.qty || 1),
  price: toCurrencyNumber(item?.unitPrice ?? item?.price ?? item?.totalPrice ?? 0),
  dishStatus: mapDishStatus(item?.status),
  note: item?.note || ''
});

const mapApiOrderToWaiter = (order) => {
  // Lấy đúng trường từ API thực tế
  const orderCode = order?.orderCode || order?.code || `DH-${order?.orderId || order?.id || '---'}`;
  const mappedStatus = mapOrderStatus(order?.orderStatus || order?.status);
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
      }))
    : [];
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
  const tableCodeValue = Array.isArray(order.tables) && order.tables.length > 0
    ? (order.tables.find(t => t.isMainTable)?.tableId || order.tables[0]?.tableId || tableName)
    : (order.tableCode || order.tableNumber || tableName);
  const customerName = order?.customer?.fullname || order?.customerName || order?.guestName || order?.receiverName || (isDineIn ? (tableName ? `Khách tại ${tableName}` : 'Khách tại bàn') : 'Khách hàng');
  return {
    id: orderCode,
    orderId: order?.orderId || order?.id || null,
    time: order?.createdAt
      ? new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '--:--',
    status: mappedStatus.status,
    statusLabel: mappedStatus.statusLabel,
    tableNumber: isDineIn ? (tableName || 'Bàn --') : '',
    tableCode: String(tableCodeValue || '').trim(),
    guests: Number(order?.numberOfGuests || order?.guestCount || order?.guests || 0),
    customerName,
    channel: isDineIn ? 'dineIn' : order.orderType || '',
    items: orderItems,
    address: order?.deliveryAddress || order?.address || '',
    phone: order?.customer?.phone || order?.customerPhone || order?.phone || order?.receiverPhone || '',
    note: order?.note || order?.customerNote || '',
    deliveryFee: Number(order?.deliveryPrice || order?.deliveryFee || 0),
    discount: Number(order?.discountAmount || order?.discount || 0),
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

      fetchWaiterOrders();
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
  const [uiNotice, setUiNotice] = useState('');
  const [tableQrValue, setTableQrValue] = useState('');
  const [tableQrCode, setTableQrCode] = useState('');
  const [tableQrLoading, setTableQrLoading] = useState(false);
  const [tableQrError, setTableQrError] = useState('');

  const alert = (message) => {
    setUiNotice(String(message ?? ''));
  };

  // --- FIX: BỔ SUNG STATE searchInput ---
  const [searchInput, setSearchInput] = useState('');

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

  // --- FIX: BỔ SUNG STATE createOrderType ---
  const [createOrderType, setCreateOrderType] = useState('reservation');

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

  const [orderForm, setOrderForm] = useState({
    fullName: 'Nguyễn Hoàng Nam',
    phone: '0901234567',
    orderCode: '#ORD-240524-001',
    orderType: 'at-place',
    fullName: '',
    phone: '',
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

  // Danh sách bàn thực tế từ API
  const [tables, setTables] = useState([]);

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
  const [serviceHistory, setServiceHistory] = useState([]);
  const [showAllServiceHistory, setShowAllServiceHistory] = useState(false);

  // Đổi fetchWaiterOrders thành function thường, không dùng useCallback
  async function fetchWaiterOrders() {
    setLoadingOrders(true);
    setOrdersError('');
    try {
      const res = await orderAPI.getPreparingMy();
      console.log('[RAW API]', res.data);
      // Lấy danh sách đơn hàng từ res.data.data hoặc res.data.orders hoặc []
      const rawOrders = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data?.orders)
        ? res.data.orders
        : [];
      console.log('[ORDERS]', rawOrders);
      const mapped = rawOrders.map(mapApiOrderToWaiter);
      console.log('[MAPPED]', mapped);
      setDineInOrders(mapped);
      setTakeawayOrders([]);
      setDeliveryOrders([]);
    } catch (error) {
      console.error(error);
      setOrdersError('Không lấy được đơn hàng của waiter');
    } finally {
      setLoadingOrders(false);
    }
  }

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
  }, []);

  useEffect(() => {
    if (!showPaymentModal || !selectedOrder) return;
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

  const calculateOrderSubtotal = (order) =>
    (order.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0);


  const calculateOrderTotal = (order) =>
    calculateOrderSubtotal(order) + (order.deliveryFee || 0) - (order.discount || 0);

  const paymentTotal = Number(calculateOrderTotal(selectedOrder || { items: [] }) || 0);
  const receivedMoneyValue = Number(receivedMoney || 0);
  const hasReceivedMoney = receivedMoney.trim() !== '';
  const isCashAmountValid = hasReceivedMoney && receivedMoneyValue >= paymentTotal;
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

  const buildGuestQrUrl = (tableCode, accessToken) => {
    const url = new URL('/guest-qr-order', window.location.origin);
    url.searchParams.set('tableCode', String(tableCode));
    if (accessToken) {
      url.searchParams.set('tableToken', accessToken);
    }
    return url.toString();
  };

  const initQrForOrder = async (order) => {
    const resolvedTableCode = normalizeTableCode(order?.tableCode || order?.tableNumber);
    if (!resolvedTableCode) {
      setTableQrError('Không tìm thấy mã bàn để tạo QR.');
      return;
    }

    try {
      setTableQrLoading(true);
      setTableQrError('');
      const data = await initTableSession(resolvedTableCode);
      const accessToken = data?.accessToken || '';
      const qrUrl = buildGuestQrUrl(data?.tableCode || resolvedTableCode, accessToken);
      setTableQrCode(String(data?.tableCode || resolvedTableCode));
      setTableQrValue(qrUrl);
    } catch (err) {
      setTableQrError(err?.message || 'Không tạo được QR cho bàn này.');
      setTableQrValue('');
      setTableQrCode('');
    } finally {
      setTableQrLoading(false);
    }
  };

  const openOrderDetail = async (order) => {
    setSelectedOrder(order);
    setOrderItemsState(order.items.map(item => ({ ...item }))); // clone để thao tác trạng thái
    setShowOrderDetailModal(true);
    setTableQrValue('');
    setTableQrCode('');
    setTableQrError('');
    await initQrForOrder(order);
  };

  const openOrderQrModal = async (order) => {
    setSelectedOrder(order);
    setTableQrValue('');
    setTableQrCode('');
    setTableQrError('');
    setShowTableQrModal(true);
    await initQrForOrder(order);
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
    (item) => item.dishStatus === 'served' || item.dishStatus === 'completed'
  );

  const canOrderProceedToPayment = (order) =>
    (order?.items || []).every(
      (item) => item.dishStatus === 'served' || item.dishStatus === 'completed'
    );

  const handleProceedPayment = async () => {
    if (!selectedOrder) return;
    if (!canProceedToPayment) {
      alert('Cần phục vụ xong tất cả món trước khi thanh toán.');
      return;
    }

    if (activePaymentMethod === 'cash') {
      if (!isCashAmountValid) {
        alert('Tiền khách đưa phải lớn hơn hoặc bằng tổng thanh toán.');
        return;
      }

      const orderId = Number(selectedOrder.orderId || selectedOrder.rawOrderId || 0);
      if (!Number.isFinite(orderId) || orderId <= 0) {
        alert('Không xác định được orderId để thanh toán tiền mặt.');
        return;
      }

      try {
        setIsPaying(true);
        const amount = paymentTotal;
        await payOrderCash({
          orderId,
          amount,
          note: voucherCode ? `Thanh toán tiền mặt - voucher: ${voucherCode}` : 'Thanh toán tiền mặt tại quầy',
        });
        alert('Thanh toán tiền mặt thành công.');
        setShowPaymentModal(false);
        setShowOrderDetailModal(false);
        await fetchWaiterOrders();
      } catch (err) {
        alert(err?.response?.data?.message || err?.message || 'Lỗi thanh toán tiền mặt.');
      } finally {
        setIsPaying(false);
      }
      return;
    }

    const orderId = Number(selectedOrder.orderId || selectedOrder.rawOrderId || 0);
    if (!Number.isFinite(orderId) || orderId <= 0) {
      alert('Không xác định được orderId để tạo link thanh toán.');
      return;
    }

    try {
      setIsPaying(true);
      const res = await createPaymentLink({
        orderId,
        returnUrl: `${window.location.origin}/payment-result?success=true&orderId=${orderId}`,
        cancelUrl: `${window.location.origin}/payment-result?success=false&orderId=${orderId}`,
      });

      const checkoutUrl = res?.data?.checkoutUrl;
      if (res?.data?.success && checkoutUrl) {
        window.location.href = checkoutUrl;
        return;
      }

      alert(res?.data?.message || 'Không tạo được link thanh toán.');
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi kết nối API thanh toán.');
    } finally {
      setIsPaying(false);
    }
  };

  // Hoàn tác: Đóng tất cả modal khi quay lại
  const closeCreateFlow = () => {
    setShowCreateModal(false);
    setShowOrderInfoModal(false);
    setShowTablePickerModal(false);
  };

  // Quay lại trang khởi tạo đơn hàng mới (bước đầu tiên)
  const backToCreateOrderStart = () => {
    setShowOrderInfoModal(false);
    setShowCreateModal(true);
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

  const noticeIsError = /lỗi|thất bại|không thể|chưa|cần/i.test(uiNotice);

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
            {!loadingOrders && dineInOrders.length === 0 && (
              <p className="order-items">Chưa có đơn hàng nào trong mục này.</p>
            )}
            {!loadingOrders && dineInOrders.map((order) => {
              // Nếu còn ít nhất 1 món 'ready' thì viền xanh, khi tất cả món đều 'served' thì về mặc định
              const hasReady = Array.isArray(order.items) && order.items.some(item => item.dishStatus === 'ready');
              const allServed = Array.isArray(order.items) && order.items.length > 0 && order.items.every(item => item.dishStatus === 'served');
              const canPayThisOrder = canOrderProceedToPayment(order);
              return (
                <div
                  key={order.id}
                  className={`order-card${hasReady ? ' order-card-ready' : ''}${allServed ? '' : ''}`}
                  onClick={() => openOrderQrModal(order)}
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
                </div>

                <div className="order-card-actions">
                  <button className="btn-order-detail" onClick={(e) => { e.stopPropagation(); openOrderDetail(order); }}>
                    Chi tiết
                  </button>
                  <button
                    className="btn-order-pay"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!canPayThisOrder) {
                        alert('Không thể thanh toán: còn món chưa được phục vụ.');
                        return;
                      }
                      alert('Đang mở màn hình thanh toán...');
                      setSelectedOrder(order);
                      setShowPaymentModal(true);
                    }}
                    aria-disabled={!canPayThisOrder}
                    title={canPayThisOrder ? '' : 'Cần phục vụ xong tất cả món trước khi thanh toán'}
                    style={!canPayThisOrder ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
                  >
                    Thanh toán
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
              <div className="search-section">
                <label className="search-label">Nhập thông tin tra cứu</label>
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Nhập mã đặt bàn hoặc SĐT/Email..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <button className="search-btn">
                    🔍
                  </button>
                </div>
                <p className="search-hint">
                  ℹ️ Nhấn "Tiếp tục" sau khi đã xác nhận thông tin.
                </p>
              </div>
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
                      const code = searchInput.trim();
                      const data = await lookupOrder('reservation', code);
                      const rows = Array.isArray(data)
                        ? data
                        : data?.data?.items ?? data?.data?.$values ?? data?.items ?? data?.$values ?? (data ? [data] : []);

                      const found = rows.find((r) => String(r?.reservationCode || r?.bookingCode || '').trim().toUpperCase() === code.toUpperCase())
                        || rows[0];

                      if (!found) {
                        alert('Không tìm thấy mã đặt bàn này. Vui lòng kiểm tra lại.');
                        return;
                      }

                      const bookingTime = String(found.reservationTime || found.bookingTime || '').slice(0, 5);
                      setOrderForm(prev => ({
                        ...prev,
                        orderCode: found.reservationCode || found.bookingCode || code,
                        fullName: found.fullName || found.fullname || found.customerName || prev.fullName,
                        phone: found.phone || prev.phone,
                        guests: String(found.numberOfGuests || found.guests || prev.guests || ''),
                        bookingDate: found.reservationDate || found.bookingDate || prev.bookingDate,
                        bookingTime: bookingTime || prev.bookingTime,
                        note: found.specialRequests || prev.note,
                      }));
                    } catch (err) {
                      const status = err?.response?.status;
                      const message = err?.response?.data?.message || err?.message || 'Không thể tra cứu mã đặt bàn lúc này.';
                      alert(`Tra cứu thất bại (${status || 'N/A'}): ${message}`);
                      return;
                    }
                  } else if (createOrderType === 'member') {
                    try {
                      const keyword = searchInput.trim();
                      const data = await lookupOrder('contact', keyword);
                      const rows = Array.isArray(data)
                        ? data
                        : data?.data?.items ?? data?.data?.$values ?? data?.items ?? data?.$values ?? (data ? [data] : []);
                      const found = rows[0];

                      if (found) {
                        setOrderForm(prev => ({
                          ...prev,
                          fullName: found.fullName || found.fullname || found.customerName || found.name || prev.fullName,
                          phone: found.phone || prev.phone,
                          guests: String(found.numberOfGuests || found.guests || prev.guests || ''),
                          orderCode: found.reservationCode || found.orderCode || prev.orderCode,
                          bookingDate: found.reservationDate || found.bookingDate || prev.bookingDate,
                          bookingTime: String(found.reservationTime || found.bookingTime || '').slice(0, 5) || prev.bookingTime,
                        }));
                      } else {
                        const isEmail = keyword.includes('@');
                        setOrderForm(prev => ({
                          ...prev,
                          phone: isEmail ? '' : keyword
                        }));
                      }
                    } catch (err) {
                      const keyword = searchInput.trim();
                      const isEmail = keyword.includes('@');
                      console.warn('Lookup member failed:', err?.response?.status, err?.response?.data || err?.message);
                      setOrderForm(prev => ({
                        ...prev,
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
                        onChange={(e) =>
                          setOrderForm((prev) => ({ ...prev, orderType: e.target.value }))
                        }
                      >
                        <option value="at-place">Ăn tại chỗ</option>
                        <option value="take-away">Mang về</option>
                        <option value="delivery">Giao hàng</option>
                        <option value="event">Sự kiện</option>
                      </select>
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
                    apiFunc = createGuestOrder;
                  } else if (createOrderType === 'reservation') {
                    const reservationCode = String(orderForm.orderCode || searchInput || '').trim();
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
                    payload = {
                      orderType: apiOrderType,
                      ...(isEmail ? { email: keyword } : { phone: keyword }),
                      numberOfGuests: Number(orderForm.guests) || 1,
                      note: orderForm.note
                    };
                    apiFunc = createOrderByContact;
                  }
                  try {
                    await apiFunc(payload);
                    alert('Đã tạo đơn thành công!');
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
                Quay lại
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

      {showOrderDetailModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowOrderDetailModal(false)}>
          <div className="modal-container modal-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-content">
                <h3 className="modal-title">Chi tiết đơn hàng #{selectedOrder.id}</h3>
                <span className={`order-status ${getStatusClass(selectedOrder.status)}`}>
                  {selectedOrder.statusLabel}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowOrderDetailModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="dinein-detail-top">
              <div className="dinein-info-card">
                <p>Số bàn</p>
                <strong>{selectedOrder.tableNumber || 'Bàn 05'}</strong>
              </div>
              <div className="dinein-info-card">
                <p>Số lượng khách</p>
                <strong>
                  <Users size={15} /> {selectedOrder.guests || 4}
                </strong>
              </div>
              <div className="dinein-info-card">
                <p>Trạng thái chung</p>
                <span className={`order-status ${getStatusClass(selectedOrder.status)}`}>
                  {selectedOrder.statusLabel}
                </span>
              </div>
            </div>

            <div className="dinein-detail-body">
              <div style={{ marginBottom: 16, border: '1px dashed #e0dcd8', borderRadius: 12, padding: 12, background: '#fffaf5' }}>
                <h4 style={{ margin: '0 0 8px 0' }}>QR gọi món của bàn</h4>
                {tableQrLoading && <p style={{ margin: 0, color: '#7a6f66' }}>Đang tạo QR từ token bàn...</p>}
                {!tableQrLoading && tableQrError && <p style={{ margin: 0, color: '#cf1322' }}>{tableQrError}</p>}
                {!tableQrLoading && !tableQrError && tableQrValue && (
                  <TableQRCode
                    qrValue={tableQrValue}
                    tableName={tableQrCode || selectedOrder.tableNumber || selectedOrder.tableCode || 'N/A'}
                    size={128}
                  />
                )}
              </div>

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
                            {dishStatus.label === 'Sẵn sàng' && (
                              <button
                                className="dish-action serve"
                                type="button"
                                onClick={async () => {
                                  // Gọi API PATCH để cập nhật trạng thái món ăn
                                  try {
                                    // orderItemsState[idx] phải có orderItemId hoặc id
                                    const orderItemId = item.id || item.orderItemId || item.itemId;
                                    if (!orderItemId) {
                                      alert('Không tìm thấy ID món ăn!');
                                      return;
                                    }
                                    await patchOrderItemServed(orderItemId);
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
                <div className="grand-total">
                  <span>Tổng cộng</span>
                  <strong>{formatCurrency(calculateOrderSubtotal(selectedOrder))}</strong>
                </div>
              </div>
            </div>

            <div className="modal-footer split">
              <button className="btn-cancel" onClick={() => setShowOrderDetailModal(false)}>
                Đóng
              </button>
              <div className="detail-footer-actions">
                <button className="btn-add-outline" onClick={() => setShowAddItemsModal(true)}>
                  <Plus size={16} /> Thêm món
                </button>
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
                    tableName={tableQrCode || selectedOrder.tableNumber || selectedOrder.tableCode || 'N/A'}
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
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-container modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Hủy đơn hàng #{selectedOrder.id}</h3>
              <button className="modal-close-btn" onClick={() => setShowCancelModal(false)}>
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
              <button className="btn-cancel" onClick={() => setShowCancelModal(false)}>
                Quay lại
              </button>
              <button className="btn-danger-solid" disabled={!cancelReason.trim()}>
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
                  <p className="modal-subtitle">Nhân viên: Nguyễn Văn An</p>
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
                  <div className="grand-total-box">
                    <span>Tổng cộng:</span>
                    <strong>{formatCurrency(calculateOrderTotal(selectedOrder))}</strong>
                  </div>
                </div>
              </div>

              <div className="payment-right">
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
                    <button
                      type="button"
                      className={activePaymentMethod === 'card' ? 'active' : ''}
                      onClick={() => setActivePaymentMethod('card')}
                    >
                      <CreditCard size={18} /> Thẻ
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
                      Tiền khách đưa phải lớn hơn hoặc bằng {formatCurrency(paymentTotal)}.
                    </p>
                  )}
                </div>

                <div className="change-box">
                  <span>Tiền thừa trả khách:</span>
                  <strong>
                    {hasReceivedMoney ? formatCurrency(changeAmount) : '--'}
                  </strong>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-continue full"
                onClick={handleProceedPayment}
                disabled={isPaying || (activePaymentMethod === 'cash' && !isCashAmountValid)}
                title={activePaymentMethod === 'cash' && !isCashAmountValid ? 'Tiền khách đưa chưa đủ để thanh toán.' : ''}
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
                    <span>Tổng cộng tạm tính</span>
                    <strong>{formatCurrency(cartTotal)}</strong>
                  </div>
                  <button
                    className="btn-continue full"
                    onClick={handleConfirmAddItems}
                  >
                    Xác nhận thêm món
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
