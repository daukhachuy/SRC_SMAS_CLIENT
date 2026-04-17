import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  PlayCircle,
  Timer,
  Trash2,
  LayoutGrid,
  List
} from 'lucide-react';
import {
  fetchPendingOrderItems,
  fetchInProgressOrderItems,
  patchOrderItemPreparing,
  patchOrderItemReady,
  postOrderItemCancel,
  patchOrderAllPreparing,
  patchOrderAllReady,
  fetchOrderItemsHistoryToday
} from './kitchenApi';
import { formatCurrency } from '../../api/managerApi';
import { createHubConnection, KITCHEN_HUB } from '../../realtime/signalrClient';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.locale('vi');

/**
 * Component con: Hiển thị thời gian trôi qua theo giây (MM:SS)
 * - Tự động cập nhật mỗi giây
 * - Màu sắc theo thời gian: Xanh (<5p) | Cam (5-10p) | Đỏ (>10p)
 * - Tránh re-render toàn bộ trang
 * - Sử dụng múi giờ Việt Nam (UTC+7)
 */
const TimerDisplay = ({ createdAt }) => {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Parse thời gian tạo món về milliseconds (UTC)
    const startMs = parseOrderCreatedAtMs(createdAt);
    if (!startMs) {
      setElapsed(0);
      return;
    }

    // Chuyển start time sang múi giờ Việt Nam (UTC+7)
    const startMsVn = startMs + 7 * 60 * 60 * 1000;

    // Hàm tính thời gian đã trôi qua (giây) theo múi giờ Việt Nam
    const calculateElapsed = () => {
      const now = Date.now();
      // Thêm offset 7 giờ để sang múi giờ Việt Nam
      const nowVn = now + 7 * 60 * 60 * 1000;
      return Math.max(0, Math.floor((nowVn - startMsVn) / 1000));
    };

    // Cập nhật ngay lập tức
    setElapsed(calculateElapsed());

    // Thiết lập interval 1 giây
    intervalRef.current = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    // Cleanup: xóa interval khi unmount hoặc createdAt thay đổi
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [createdAt]);

  // Chuyển đổi giây sang MM:SS
  const totalSeconds = elapsed;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Xác định màu sắc theo thời gian
  const minutesElapsed = minutes + (seconds > 0 ? 1 : 0); // Làm tròn lên phút
  let colorClass = 'timer-green'; // Xanh: < 5 phút
  if (minutesElapsed >= 10) {
    colorClass = 'timer-red'; // Đỏ: >= 10 phút
  } else if (minutesElapsed >= 5) {
    colorClass = 'timer-orange'; // Cam: 5-10 phút
  }

  return (
    <span className={`timer-display ${colorClass}`}>
      <Timer size={16} aria-hidden />
      <span className="timer-value">{timeString}</span>
    </span>
  );
};

/** Hiển thị thời gian chờ dạng MM:SS min (phút chờ × 60 giây → mm:ss). */
function formatAggregatedWaitMmSs(totalMinutes) {
  const m = Math.max(0, Math.floor(Number(totalMinutes) || 0));
  const totalSec = m * 60;
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')} min`;
}

/**
 * Chuỗi orderCreatedAt từ server (thường .NET) hay là UTC nhưng không có hậu tố Z.
 * `new Date('...')` khi đó bị hiểu là giờ local → lệch ~7h (UTC+7) → chờ ~420 phút.
 */
function parseOrderCreatedAtMs(raw) {
  if (raw == null || raw === '') return null;
  let s = String(raw).trim();
  s = s.replace(/(\.\d{3})\d+/, '$1');
  const hasExplicitZone = /Z$/i.test(s) || /[+-]\d{2}:?\d{2}$/.test(s);
  if (!hasExplicitZone && /^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const t = new Date(`${s}Z`).getTime();
    return Number.isNaN(t) ? null : t;
  }
  const t = new Date(s).getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * Tính số phút chờ từ chuỗi ISO với dayjs UTC-aware, trả về number.
 * Dùng dayjs vì format & diff có thể xử lý triệt để múi giờ và chuỗi "Z".
 */
function calcWaitMinutes(orderCreatedAt) {
  if (!orderCreatedAt) return 0;
  let d;
  const hasZ = /Z$/i.test(String(orderCreatedAt));
  if (hasZ) {
    d = dayjs.utc(orderCreatedAt).local();
  } else if (/^\d{4}-\d{2}-\d{2}T/.test(orderCreatedAt)) {
    d = dayjs.utc(orderCreatedAt).local();
  } else {
    d = dayjs(orderCreatedAt);
  }
  const diff = dayjs().diff(d, 'minute', true);
  return Math.max(0, Math.floor(diff));
}

/** Chuẩn hóa status từ API → 'pending' | 'preparing' | 'ready' */
function normalizeStatus(raw) {
  if (raw == null || raw === '') return 'pending';
  const s = String(raw).toLowerCase().trim();
  if (s === 'preparing' || s === 'cooking') return 'preparing';
  if (s === 'ready' || s === 'completed' || s === 'done') return 'ready';
  return 'pending';
}

/** Trạng thái gốc từ từng dòng món (backend .NET hay camelCase). */
function rawItemStatus(pi) {
  if (!pi || typeof pi !== 'object') return '';
  return (
    pi.status ??
    pi.Status ??
    pi.itemStatus ??
    pi.ItemStatus ??
    pi.orderItemStatus ??
    pi.OrderItemStatus ??
    ''
  );
}

/** Để gộp 2 nguồn: preparing thắng pending khi trùng orderItemId */
function statusRank(s) {
  if (s === 'preparing' || s === 'cooking') return 1;
  if (s === 'ready') return 2;
  return 0;
}

/** Map GET /api/order-items/pending → UI model */
function mapPendingOrderToUI(raw) {
  const waitMinutes = calcWaitMinutes(raw.orderCreatedAt);

  let status = 'normal';
  if (waitMinutes >= 15) status = 'overdue';
  else if (waitMinutes < 5) status = 'new';

  const tableLabel =
    raw.tableId > 0
      ? `BÀN ${String(raw.tableId).padStart(2, '0')}`
      : 'Mang về ';

  const pending = raw.pendingItems || [];
  const items = pending.map((pi) => ({
    id: pi.orderItemId,
    orderItemId: pi.orderItemId,
    foodId: pi.foodId,
    name: pi.itemName,
    quantity: pi.quantity,
    note: pi.note,
    status: normalizeStatus(rawItemStatus(pi)),
    openingTime: pi.openingTime
  }));

  return {
    id: raw.orderId,
    orderId: raw.orderId,
    orderCode: raw.orderCode,
    table: tableLabel,
    tableId: raw.tableId,
    waitTime: waitMinutes,
    status,
    note: null,
    orderCreatedAt: raw.orderCreatedAt,
    items
  };
}

/** Map 1 order từ GET /api/order-items/in-progress → UI model (items đang nấu / sẵn sàng) */
function mapInProgressOrderToUI(raw) {
  const waitMinutes = calcWaitMinutes(raw.orderCreatedAt);

  let status = 'normal';
  if (waitMinutes >= 15) status = 'overdue';
  else if (waitMinutes < 5) status = 'new';

  const tableLabel =
    raw.tableId > 0
      ? `BÀN ${String(raw.tableId).padStart(2, '0')}`
      : 'Mang về / Tại quầy';

  const items = (raw.items || []).map((pi) => ({
    id: pi.orderItemId,
    orderItemId: pi.orderItemId,
    foodId: pi.foodId,
    name: pi.itemName,
    quantity: pi.quantity,
    note: pi.note,
    status: normalizeStatus(rawItemStatus(pi)),
    openingTime: pi.openingTime
  }));

  return {
    id: raw.orderId,
    orderId: raw.orderId,
    orderCode: raw.orderCode,
    table: tableLabel,
    tableId: raw.tableId,
    waitTime: waitMinutes,
    status,
    note: null,
    orderCreatedAt: raw.orderCreatedAt,
    items
  };
}

const KitchenOrdersPage = () => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [orders, setOrders] = useState([]);
  const [inProgressOrders, setInProgressOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [itemBusyId, setItemBusyId] = useState(null);
  const [orderBusyId, setOrderBusyId] = useState(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  /** GET /order-items/history/today → { date, totalItems, items } */
  const [historyData, setHistoryData] = useState({
    date: null,
    totalItems: 0,
    items: []
  });
  const [historyError, setHistoryError] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'item'
  const [itemSearch, setItemSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'preparing' | 'overdue'
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'longest-wait'

  const loadOrders = useCallback(async (options = {}) => {
    const silent = options.silent === true;
    setError('');
    if (!silent) setLoading(true);
    try {
      const [pendingList, inProgList] = await Promise.all([
        fetchPendingOrderItems(),
        fetchInProgressOrderItems()
      ]);
      const pendingMapped = (Array.isArray(pendingList) ? pendingList : []).map(mapPendingOrderToUI);
      const inProgMapped = (Array.isArray(inProgList) ? inProgList : []).map(mapInProgressOrderToUI);
      setOrders(pendingMapped);
      setInProgressOrders(inProgMapped);
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.message ||
          e?.message ||
          'Không tải được danh sách món chờ. Kiểm tra đăng nhập (Bearer token) và quyền bếp.'
      );
      setOrders([]);
      setInProgressOrders([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const token =
      localStorage.getItem('authToken') ||
      localStorage.getItem('accessToken') ||
      localStorage.getItem('tableAccessToken');
    if (!token) return undefined;

    const conn = createHubConnection(KITCHEN_HUB);
    const refreshOrders = () => {
      void loadOrders({ silent: true });
    };

    conn.on('OrderItemStatusChanged', () => {
      refreshOrders();
    });
    conn.on('AllItemsStatusChanged', () => {
      refreshOrders();
    });
    conn.on('NewOrderItems', (payload) => {
      refreshOrders();
      const code = payload && String(payload.orderCode || '').trim();
      setToastMsg(code ? `Có món mới (${code}).` : 'Có món mới vừa được thêm.');
    });
    conn.onreconnected(() => {
      refreshOrders();
    });

    conn.start().catch(() => {
      /* fallback polling/manual refresh */
    });

    return () => {
      void conn.stop();
    };
  }, [loadOrders]);

  // Auto-clear toast message after 3 seconds
  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(''), 3000);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  /** Gộp đơn pending + in-progress, lọc bỏ items đã ready. in-progress trước; trùng orderItemId giữ bản có status “xa” hơn (preparing > pending). */
  const allOrders = useMemo(() => {
    const mergeItemLists = (a, b) => {
      const byId = new Map();
      for (const it of a) {
        byId.set(String(it.orderItemId), it);
      }
      for (const it of b) {
        const id = String(it.orderItemId);
        const prev = byId.get(id);
        if (!prev) {
          byId.set(id, it);
          continue;
        }
        if (statusRank(it.status) > statusRank(prev.status)) {
          byId.set(id, it);
        }
      }
      return Array.from(byId.values()).filter((it) => it.status !== 'ready');
    };

    const map = new Map();
    [...inProgressOrders, ...orders].forEach((o) => {
      const rawItems = (o.items || []).filter((it) => it.status !== 'ready');
      if (rawItems.length === 0) return;
      if (!map.has(o.orderId)) {
        map.set(o.orderId, { ...o, items: rawItems });
      } else {
        const existing = map.get(o.orderId);
        existing.items = mergeItemLists(existing.items, rawItems);
      }
    });

    // 返回基础订单列表（不过滤、不排序）
    return Array.from(map.values());
  }, [orders, inProgressOrders]);

  /**
   * Gom tất cả items từ mọi đơn hàng → nhóm theo (foodId, itemName).
   * Mỗi group chứa:
   *   - name, foodId
   *   - totalQty, pendingQty, preparingQty
   *   - maxWaitMinutes (đơn cũ nhất)
   *   - orders: array orderId (để thao tác)
   */
  const aggregatedItems = useMemo(() => {
    const map = new Map();
    // Duyệt cả pending (orders) và preparing (inProgressOrders)
    allOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        // Bỏ qua ready — đã xong, không hiện trên bếp
        if (item.status === 'ready') return;

        const key = item.foodId ?? item.name ?? `__${item.id}`;
        if (!map.has(key)) {
          map.set(key, {
            key,
            name: item.name,
            foodId: item.foodId,
            totalQty: 0,
            pendingQty: 0,
            preparingQty: 0,
            maxWaitMinutes: 0,
            orderIds: [],
            noteParts: new Set()
          });
        }
        const g = map.get(key);
        g.totalQty += item.quantity;
        g.orderIds.push(order.orderId ?? order.id);
        if (item.status === 'pending') {
          g.pendingQty += item.quantity;
          g.maxWaitMinutes = Math.max(g.maxWaitMinutes, order.waitTime);
        }
        if (item.status === 'preparing') {
          g.preparingQty += item.quantity;
          g.maxWaitMinutes = Math.max(g.maxWaitMinutes, order.waitTime);
        }
        const note = item.note && String(item.note).trim();
        if (note) g.noteParts.add(note);
      });
    });
    return Array.from(map.values())
      .map((g) => ({
        key: g.key,
        name: g.name,
        foodId: g.foodId,
        totalQty: g.totalQty,
        pendingQty: g.pendingQty,
        preparingQty: g.preparingQty,
        maxWaitMinutes: g.maxWaitMinutes,
        orderIds: g.orderIds,
        modifiers: g.noteParts.size ? [...g.noteParts].join(' · ') : ''
      }))
      .sort((a, b) => b.maxWaitMinutes - a.maxWaitMinutes);
  }, [allOrders]);

  /** Theo Bàn: sắp xếp theo thời gian chờ (hiển thị tất cả) */
  const cardOrders = useMemo(() => {
    return [...allOrders].sort((a, b) => b.waitTime - a.waitTime);
  }, [allOrders]);

  /** Theo Món: tìm kiếm + lọc + sắp xếp */
  const filteredAggregatedItems = useMemo(() => {
    // 1) Tìm kiếm theo tên món
    let result = aggregatedItems.filter((g) =>
      g.name.toLowerCase().includes(itemSearch.trim().toLowerCase())
    );

    // 2) 筛选逻辑
    if (filterStatus === 'pending') {
      result = result.filter((g) => g.pendingQty > 0);
    } else if (filterStatus === 'preparing') {
      result = result.filter((g) => g.preparingQty > 0);
    } else if (filterStatus === 'overdue') {
      result = result.filter((g) => g.maxWaitMinutes >= 15);
    }

    // 3) 排序逻辑
    if (sortBy === 'longest-wait') {
      result.sort((a, b) => b.maxWaitMinutes - a.maxWaitMinutes);
    } else {
      result.sort((a, b) => a.maxWaitMinutes - b.maxWaitMinutes);
    }

    return result;
  }, [aggregatedItems, itemSearch, filterStatus, sortBy]);

  /** Thống kê cho footer */
  const stats = useMemo(() => {
    let overdueOrders = 0;
    let pendingDishes = 0;
    let cookingDishes = 0;
    allOrders.forEach((o) => {
      if (o.status === 'overdue') overdueOrders += 1;
      (o.items || []).forEach((i) => {
        if (i.status === 'pending') pendingDishes += 1;
        if (i.status === 'preparing') cookingDishes += 1;
      });
    });
    return { overdueOrders, pendingDishes, cookingDishes };
  }, [allOrders]);

  const handleCancelItem = (item) => {
    setSelectedItem(item);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Vui lòng nhập lý do hủy món');
      return;
    }
    const oid = selectedItem?.orderItemId ?? selectedItem?.id;
    if (oid == null) {
      alert('Không xác định được món cần hủy.');
      return;
    }
    setCancelSubmitting(true);
    setError('');
    try {
      await postOrderItemCancel(oid, cancelReason.trim());
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedItem(null);
      // Optimistic: loại bỏ món khỏi cả orders và inProgressOrders
      setOrders((prev) =>
        prev
          .map((order) => ({
            ...order,
            items: (order.items || []).filter(
              (it) => String(it.orderItemId) !== String(oid) && it.id !== oid
            )
          }))
          .filter((order) => (order.items || []).length > 0)
      );
      setInProgressOrders((prev) =>
        prev
          .map((order) => ({
            ...order,
            items: (order.items || []).filter(
              (it) => String(it.orderItemId) !== String(oid) && it.id !== oid
            )
          }))
          .filter((order) => (order.items || []).length > 0)
      );
      setToastMsg('Đã hủy món.');
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || 'Hủy món thất bại.';
      alert(msg);
    } finally {
      setCancelSubmitting(false);
    }
  };

  /** PATCH preparing — sau đó tải lại để khớp server (tránh F5 hiện pending trong khi DB đã preparing). */
  const handleItemPreparing = async (orderItemId) => {
    setItemBusyId(orderItemId);
    setError('');
    try {
      await patchOrderItemPreparing(orderItemId);
      await loadOrders({ silent: true });
      setToastMsg('Đang nấu món này.');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Không cập nhật trạng thái chế biến.');
    } finally {
      setItemBusyId(null);
    }
  };

  const handleItemReady = async (orderItemId) => {
    setItemBusyId(orderItemId);
    setError('');
    try {
      await patchOrderItemReady(orderItemId);
      await loadOrders({ silent: true });
      setToastMsg('Món đã sẵn sàng — chờ người chạy bàn.');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Không đánh dấu đã xong món.';
      setError(msg);
    } finally {
      setItemBusyId(null);
    }
  };

  const handleStartAllItems = async (orderId) => {
    if (orderId == null) return;
    setOrderBusyId(orderId);
    setError('');
    try {
      await patchOrderAllPreparing(orderId);
      // Đồng bộ từ server: tránh F5 / danh sách pending+in-progress lệch nhau
      await loadOrders({ silent: true });
      setToastMsg('Bắt đầu nấu tất cả món.');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Không bắt đầu tất cả món.');
    } finally {
      setOrderBusyId(null);
    }
  };

  const handleCompleteAllItems = async (orderId) => {
    if (orderId == null) return;
    setOrderBusyId(orderId);
    setError('');
    try {
      await patchOrderAllReady(orderId);
      await loadOrders({ silent: true });
      setToastMsg('Hoàn thành đơn — chờ người chạy bàn.');
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Không hoàn thành tất cả món.');
    } finally {
      setOrderBusyId(null);
    }
  };

  const openHistoryModal = async () => {
    setShowHistoryModal(true);
    setHistoryData({ date: null, totalItems: 0, items: [] });
    setHistoryError('');
    setHistoryLoading(true);
    try {
      const res = await fetchOrderItemsHistoryToday();
      if (res && Array.isArray(res.items)) {
        setHistoryData({
          date: res.date ?? null,
          totalItems: res.totalItems ?? res.items.length,
          items: res.items
        });
      } else if (Array.isArray(res)) {
        setHistoryData({
          date: null,
          totalItems: res.length,
          items: res
        });
      } else {
        setHistoryData({ date: null, totalItems: 0, items: [] });
      }
    } catch (e) {
      setHistoryError(
        e?.response?.data?.message ||
          e?.message ||
          'Không tải được lịch sử hôm nay.'
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'cooking' || status === 'preparing') return 'cooking';
    if (status === 'pending') return 'pending';
    return '';
  };

  /** Bắt đầu tất cả món trong group (pending → preparing) — gọi batch trên mỗi order */
  const handleGroupStartAll = async (group) => {
    const uniqueOrderIds = [...new Set(group.orderIds)];
    setOrderBusyId(group.key);
    setError('');
    try {
      await Promise.all(uniqueOrderIds.map((oid) => patchOrderAllPreparing(oid)));
      await loadOrders({ silent: true });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Không bắt đầu nhóm món.');
    } finally {
      setOrderBusyId(null);
    }
  };

  /** Xóa / hủy tất cả món trong group → gọi cancel cho mỗi order rồi load lại */
  const handleGroupCancelAll = async (group) => {
    const uniqueOrderIds = [...new Set(group.orderIds)];
    setOrderBusyId(group.key);
    setError('');
    try {
      // Thu thập orderItemId từ allOrders cho món thuộc group này
      const toCancel = [];
      allOrders.forEach((order) => {
        if (!uniqueOrderIds.includes(order.orderId ?? order.id)) return;
        (order.items || []).forEach((item) => {
          const key = item.foodId ?? item.name ?? `__${item.id}`;
          if (key === group.key && item.status !== 'ready') {
            toCancel.push(item.orderItemId ?? item.id);
          }
        });
      });
      // Xác nhận trước khi hủy nhiều món
      if (toCancel.length === 0) return;
      const ok = window.confirm(
        `Hủy ${toCancel.length} món "${group.name}" khỏi các đơn liên quan?`
      );
      if (!ok) {
        setOrderBusyId(null);
        return;
      }
      await Promise.all(toCancel.map((id) => postOrderItemCancel(id, 'Hủy từ bếp')));
      await loadOrders({ silent: true });
      setToastMsg(`Đã hủy ${toCancel.length} món.`);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Hủy nhóm món thất bại.');
    } finally {
      setOrderBusyId(null);
    }
  };

  /** Hoàn thành tất cả món trong group → load lại full */
  const handleGroupCompleteAll = async (group) => {
    const uniqueOrderIds = [...new Set(group.orderIds)];
    setOrderBusyId(group.key);
    setError('');
    try {
      await Promise.all(uniqueOrderIds.map((oid) => patchOrderAllReady(oid)));
      await loadOrders({ silent: true });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Không hoàn thành nhóm món.');
    } finally {
      setOrderBusyId(null);
    }
  };

  return (
    <div className="kds-orders-container">
      <header className="kds-header">
        <div className="kds-header-left">
          <h2 className="kds-page-title">Điều phối chế biến - Thao tác hàng loạt</h2>
          <div className="kds-status-badge online">
            <span className="status-dot"></span>
            ĐANG TRỰC TUYẾN
          </div>
        </div>
        <div className="kds-header-right">
          <div className="kds-view-toggle" role="tablist" aria-label="Chế độ hiển thị">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'table'}
              className={`kds-view-tab ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <LayoutGrid size={16} />
              <span>Theo Bàn</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'item'}
              className={`kds-view-tab ${viewMode === 'item' ? 'active' : ''}`}
              onClick={() => setViewMode('item')}
            >
              <List size={16} />
              <span>Theo Món</span>
            </button>
          </div>
          <div className="kds-time">
            <Clock size={20} />
            <span>{dayjs().format('HH:mm')}</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="kds-api-error" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {toastMsg && (
        <div className="kds-toast-msg" role="status">
          <CheckCircle size={20} />
          <span>{toastMsg}</span>
        </div>
      )}

      {viewMode === 'item' && (
        <div className="kds-item-controls">
          <div className="kds-item-search-wrap">
            <input
              type="text"
              className="kds-item-search"
              placeholder="Tìm kiếm món ăn..."
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
            />
          </div>
          <div className="kds-item-filters">
            <div className="kds-filter-group">
              <label htmlFor="filter-status" className="kds-filter-label">Trạng thái:</label>
              <select
                id="filter-status"
                className="kds-filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chờ nấu</option>
                <option value="preparing">Đang nấu</option>
                <option value="overdue">Trễ</option>
              </select>
            </div>
            <div className="kds-filter-group">
              <label htmlFor="sort-by" className="kds-filter-label">Sắp xếp:</label>
              <select
                id="sort-by"
                className="kds-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="default">Thời gian ngắn → dài</option>
                <option value="longest-wait">Thời gian dài → ngắn</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <main className={`kds-orders-grid ${viewMode === 'item' ? 'kds-by-item-main' : ''}`}>
        {viewMode === 'item' ? (
          <>
            {loading && aggregatedItems.length === 0 ? (
              <p className="kds-loading-msg kds-item-table-msg">Đang tải...</p>
            ) : !loading && aggregatedItems.length === 0 && !error ? (
              <p className="kds-empty-msg kds-item-table-msg">Chưa có món nào chờ chế biến.</p>
            ) : null}
            {aggregatedItems.length > 0 && (
              <div className="kds-item-table-wrap">
                <table className="kds-item-table">
                  <thead>
                    <tr>
                      <th className="kds-item-th kds-item-th-id">ID</th>
                      <th className="kds-item-th kds-item-th-dish">Tên món &amp; ghi chú</th>
                      <th className="kds-item-th kds-item-th-qty">SL</th>
                      <th className="kds-item-th kds-item-th-status">Trạng thái</th>
                      <th className="kds-item-th kds-item-th-actions">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAggregatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="kds-item-td kds-item-td-empty">
                          {itemSearch.trim()
                            ? 'Không có món phù hợp tìm kiếm.'
                            : '—'}
                        </td>
                      </tr>
                    ) : (
                      filteredAggregatedItems.map((group) => {
                        // Tìm một orderItem mẫu để lấy createdAt (lấy từ món đầu tiên trong group)
                        const sampleItem = (allOrders
                          .flatMap((o) => o.items || [])
                          .find((it) => (it.foodId ?? it.name) === group.key)) || {};
                        const createdAt = sampleItem.createdAt || sampleItem.orderCreatedAt;

                        const rowStatus =
                          group.maxWaitMinutes >= 15
                            ? 'late'
                            : group.preparingQty > 0
                              ? 'cooking'
                              : 'pending';
                        const displayId =
                          group.foodId != null && group.foodId !== ''
                            ? String(group.foodId)
                            : String(group.key).replace(/\D/g, '').slice(-6) || String(group.key).slice(0, 6);
                        return (
                          <tr
                            key={group.key}
                            className="kds-item-tr"
                          >
                            <td className="kds-item-td kds-item-td-id">#{displayId}</td>
                            <td className="kds-item-td kds-item-td-dish">
                              <span className="kds-item-dish-name">{group.name}</span>
                              {group.modifiers ? (
                                <span className="kds-item-dish-modifiers">{group.modifiers}</span>
                              ) : null}
                            </td>
                            <td className="kds-item-td kds-item-td-qty">
                              <span
                                className={`kds-item-qty-badge ${rowStatus === 'late' ? 'kds-item-qty-badge--late' : ''}`}
                              >
                                {group.totalQty}
                              </span>
                            </td>
                            <td className="kds-item-td kds-item-td-status">
                              <span className={`kds-item-status-pill kds-item-status-pill--${rowStatus}`}>
                                <span className="kds-item-status-dot" aria-hidden />
                                {rowStatus === 'late'
                                  ? 'TRỄ'
                                  : rowStatus === 'cooking'
                                    ? 'ĐANG NẤU'
                                    : 'CHỜ NẤU'}
                              </span>
                            </td>
                            <td className="kds-item-td kds-item-td-actions">
                              <div className="kds-item-action-btns">
                                {rowStatus === 'pending' ? (
                                  <>
                                    <button
                                      type="button"
                                      className="kds-item-pill-btn kds-item-pill-btn--start"
                                      disabled={orderBusyId === group.key || group.pendingQty === 0}
                                      onClick={() => handleGroupStartAll(group)}
                                    >
                                      {orderBusyId === group.key ? '...' : 'BẮT ĐẦU'}
                                    </button>
                                    <button
                                      type="button"
                                      className="kds-item-pill-btn kds-item-pill-btn--cancel"
                                      disabled={orderBusyId === group.key}
                                      onClick={() => handleGroupCancelAll(group)}
                                    >
                                      {orderBusyId === group.key ? '...' : 'HỦY'}
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    className="kds-item-pill-btn kds-item-pill-btn--complete"
                                    disabled={orderBusyId === group.key}
                                    onClick={() => handleGroupCompleteAll(group)}
                                  >
                                    {orderBusyId === group.key ? '...' : 'HOÀN THÀNH'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
        {loading && cardOrders.length === 0 ? (
          <p className="kds-loading-msg">Đang tải đơn chờ chế biến...</p>
        ) : !loading && cardOrders.length === 0 && !error ? (
          <p className="kds-empty-msg">Chưa có món nào chờ chế biến.</p>
        ) : null}
        {cardOrders.map((order) => {
          const hasPendingItems = (order.items || []).some((i) => i.status === 'pending');
          return (
          <div key={order.orderId ?? order.id} className="kds-order-card">
            <div className="kds-order-header">
              <div className="kds-table-info">
                <span className="kds-table-label">Bàn</span>
                <span className="kds-table-name">{order.table}</span>
              </div>
              <div className="kds-order-info">
                <span className="kds-order-label">Mã đơn</span>
                <span className="kds-order-id">#{order.orderCode || order.orderId}</span>
              </div>
            </div>

            <div className="kds-order-content">
              {order.note && (
                <div className="kds-order-note warning">
                  <p className="note-label">Ghi chú</p>
                  <p className="note-content">{order.note}</p>
                </div>
              )}

              <div className="kds-items-list">
                {order.items.map((item) => {
                  // Ưu tiên lấy createdAt/itemCreatedAt của riêng món, fallback về orderCreatedAt
                  const itemCreatedAt = item.createdAt || item.orderCreatedAt || item.openingTime || order.orderCreatedAt;
                  return (
                    <div
                      key={item.id}
                      className={`kds-item ${item.status === 'preparing' || item.status === 'cooking' ? 'cooking' : item.status === 'ready' ? 'ready' : item.status}`}
                    >
                      <div className="kds-item-info">
                        <span className="kds-item-qty">{item.quantity}x</span>
                        <div>
                          <p className={`kds-item-name ${item.status === 'ready' ? 'kds-item-name--ready' : ''}`}>{item.name}</p>
                          {item.note && (
                            <p className="kds-item-note">{item.note}</p>
                          )}
                        </div>
                      </div>
                      <div className="kds-item-actions">
                        {/* Timer riêng cho từng món */}
                        <TimerDisplay createdAt={itemCreatedAt} />
                        <span className={`kds-status-badge ${getStatusBadgeClass(item.status)}`}>
                          {item.status === 'ready'
                            ? 'Sẵn sàng'
                            : item.status === 'preparing' || item.status === 'cooking'
                              ? 'Đang nấu'
                              : 'Chờ nấu'}
                        </span>
                        <div className="kds-item-api-btns">
                          {item.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                className="kds-item-api-btn start"
                                title="Bắt đầu chế biến (Preparing)"
                                disabled={itemBusyId === item.orderItemId}
                                onClick={() => handleItemPreparing(item.orderItemId)}
                              >
                                <PlayCircle size={18} />
                              </button>
                              <button
                                type="button"
                                className="kds-cancel-btn"
                                onClick={() => handleCancelItem(item)}
                                disabled={itemBusyId === item.orderItemId}
                                aria-label="Hủy món"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                          {item.status === 'preparing' && (
                            <button
                              type="button"
                              className="kds-item-api-btn ready"
                              title="Đã xong món (Ready)"
                              disabled={itemBusyId === item.orderItemId}
                              onClick={() => handleItemReady(item.orderItemId)}
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="kds-order-actions">
              <button 
                type="button"
                className="kds-action-btn start"
                disabled={orderBusyId === order.orderId || !hasPendingItems}
                title={!hasPendingItems ? 'Không còn món ở trạng thái chờ' : undefined}
                onClick={() => handleStartAllItems(order.orderId)}
              >
                <PlayCircle size={20} />
                <span>{orderBusyId === order.orderId ? 'Đang xử lý...' : 'Bắt đầu tất cả'}</span>
              </button>
              <button 
                type="button"
                className="kds-action-btn complete"
                disabled={orderBusyId === order.orderId}
                onClick={() => handleCompleteAllItems(order.orderId)}
              >
                <CheckCircle size={20} />
                <span>{orderBusyId === order.orderId ? 'Đang xử lý...' : 'Hoàn thành tất cả'}</span>
              </button>
            </div>
          </div>
          );
        })}
          </>
        )}
      </main>

      <footer className="kds-footer">
        <div className="kds-stats">
          <div className="kds-stat-item">
            <span className="stat-dot overdue"></span>
            <span className="stat-text">
              Trễ:{' '}
              <strong className="stat-value overdue">{stats.overdueOrders} đơn</strong>
            </span>
          </div>
          <div className="kds-stat-item">
            <span className="stat-dot cooking"></span>
            <span className="stat-text">
              Đang chế biến:{' '}
              <strong className="stat-value cooking">{stats.cookingDishes} món</strong>
            </span>
          </div>
          <div className="kds-stat-item">
            <span className="stat-dot pending"></span>
            <span className="stat-text">
              Chờ nấu:{' '}
              <strong className="stat-value pending">{stats.pendingDishes} món</strong>
            </span>
          </div>
        </div>
        <div className="kds-footer-actions">
          <button type="button" className="kds-history-btn" onClick={openHistoryModal}>
            <Clock size={18} />
            Xem lịch sử hôm nay
          </button>
        </div>
      </footer>

      {/* Cancel Item Modal */}
      {showCancelModal && (
        <div className="kds-modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="kds-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kds-modal-header">
              <div className="modal-icon warning">
                <AlertCircle size={28} />
              </div>
              <div>
                <h3 className="kds-modal-title">
                  Xác nhận hủy món: <span className="highlight">{selectedItem?.name}</span>
                </h3>
                <p className="kds-modal-subtitle">Thao tác này không thể hoàn tác</p>
              </div>
            </div>

            <div className="kds-modal-content">
              <div className="kds-modal-warning">
                <p>Bạn có chắc chắn muốn hủy món này khỏi danh sách chế biến của bếp?</p>
              </div>

              <div className="kds-form-group">
                <div className="kds-form-label-row">
                  <label className="kds-form-label">Lý do hủy món</label>
                  <span className="kds-form-required">Bắt buộc</span>
                </div>
                <textarea
                  className="kds-textarea"
                  placeholder="Nhập lý do chi tiết (ví dụ: Hết nguyên liệu bò, Khách báo đổi món, Nhầm đơn hàng...)"
                  rows={5}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>

            <div className="kds-modal-footer">
              <button 
                className="kds-btn secondary"
                onClick={() => setShowCancelModal(false)}
              >
                Quay lại
              </button>
              <button 
                type="button"
                className="kds-btn danger"
                onClick={handleConfirmCancel}
                disabled={cancelSubmitting}
              >
                <CheckCircle size={18} />
                {cancelSubmitting ? 'Đang gửi...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lịch sử món trong ngày — GET /api/order-items/history/today */}
      {showHistoryModal && (
        <div className="kds-modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="kds-modal kds-history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kds-modal-header">
              <div>
                <h3 className="kds-modal-title">Lịch sử món hôm nay</h3>
                <p className="kds-modal-subtitle">
                  {historyData.date
                    ? `Ngày ${historyData.date} · ${historyData.totalItems} món`
                    : 'GET /order-items/history/today'}
                </p>
              </div>
              <button
                type="button"
                className="kds-history-close"
                onClick={() => setShowHistoryModal(false)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <div className="kds-modal-content kds-history-body">
              {historyLoading ? (
                <p className="kds-loading-msg">Đang tải...</p>
              ) : historyError ? (
                <div className="kds-api-error" style={{ margin: 0 }}>
                  <AlertCircle size={20} />
                  <span>{historyError}</span>
                </div>
              ) : historyData.items.length === 0 ? (
                <p className="kds-empty-msg" style={{ padding: '24px 0' }}>
                  Chưa có dữ liệu lịch sử trong ngày.
                </p>
              ) : (
                <div className="kds-history-table-wrap">
                  <p className="kds-history-summary">
                    Tổng <strong>{historyData.totalItems}</strong> dòng món
                    {historyData.date ? (
                      <span className="kds-history-meta"> · {historyData.date}</span>
                    ) : null}
                  </p>
                  <table className="kds-history-table">
                    <thead>
                      <tr>
                        <th>Món</th>
                        <th>Mã đơn</th>
                        <th>SL</th>
                        <th>Đơn giá</th>
                        <th>Thành tiền</th>
                        <th>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.items.map((row, idx) => (
                        <tr key={row.orderItemId ?? row.id ?? idx}>
                          <td className="kds-history-cell-name">
                            {row.itemName ?? row.foodName ?? row.name ?? '—'}
                          </td>
                          <td>
                            <span className="kds-history-code">{row.orderCode ?? '—'}</span>
                            {row.orderId != null && (
                              <span className="kds-history-meta"> #{row.orderId}</span>
                            )}
                          </td>
                          <td>{row.quantity ?? '—'}</td>
                          <td>{formatCurrency(row.unitPrice ?? 0)}</td>
                          <td>{formatCurrency(row.subtotal ?? 0)}</td>
                          <td className="kds-history-note">{row.note || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="kds-modal-footer">
              <button type="button" className="kds-btn secondary" onClick={() => setShowHistoryModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenOrdersPage;
