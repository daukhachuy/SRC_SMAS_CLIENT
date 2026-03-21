import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  LayoutGrid,
  MapPin,
  Plus,
  QrCode,
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

const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.$values)) return payload.$values;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.$values)) return payload.data.$values;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.orders)) return payload.orders;
  return [];
};

const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

const mapOrderStatus = (status) => {
  const s = normalizeStatus(status);
  if (s === 'ready' || s === 'confirmed') return { status: 'ready', statusLabel: 'Sẵn sàng' };
  if (s === 'delivering' || s === 'shipping') return { status: 'delivering', statusLabel: 'Đang giao' };
  if (s === 'completed' || s === 'done') return { status: 'ready', statusLabel: 'Hoàn thành' };
  if (s === 'cancelled' || s === 'canceled') return { status: 'preparing', statusLabel: 'Đã hủy' };
  return { status: 'preparing', statusLabel: 'Đang làm' };
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

const toOrderItem = (item, idx) => ({
  name: item?.foodName || item?.name || item?.itemName || `Món ${idx + 1}`,
  quantity: Number(item?.quantity || item?.qty || 1),
  price: toCurrencyNumber(item?.unitPrice ?? item?.price ?? item?.totalPrice ?? 0),
  dishStatus: mapDishStatus(item?.status),
  note: item?.note || ''
});

const mapApiOrderToWaiter = (order) => {
  const orderCode = order?.orderCode || order?.code || `DH-${order?.orderId || order?.id || '---'}`;
  const mappedStatus = mapOrderStatus(order?.status);
  const orderItems = asArray(order?.orderItems).map(toOrderItem);
  const totalAmount = toCurrencyNumber(order?.totalAmount ?? order?.total ?? 0);

  const orderType = String(order?.orderType || '').toLowerCase();
  const tableName = order?.tableName || order?.tableCode || order?.tableNumber;
  const isDineIn = orderType === 'dinein';
  const customerName =
    order?.customerName ||
    order?.guestName ||
    order?.receiverName ||
    (isDineIn ? (tableName ? `Khách tại ${tableName}` : 'Khách tại bàn') : 'Khách hàng');

  return {
    id: orderCode,
    time: order?.createdAt
      ? new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      : '--:--',
    status: mappedStatus.status,
    statusLabel: mappedStatus.statusLabel,
    tableNumber: isDineIn ? (tableName || 'Bàn --') : '',
    guests: Number(order?.numberOfGuests || order?.guestCount || order?.guests || 0),
    customerName,
    channel: isDineIn ? 'dineIn' : orderType === 'takeaway' ? 'takeaway' : 'delivery',
    items: orderItems,
    address: order?.deliveryAddress || order?.address || '',
    phone: order?.customerPhone || order?.phone || order?.receiverPhone || '',
    note: order?.note || order?.customerNote || '',
    deliveryFee: toCurrencyNumber(order?.deliveryFee),
    discount: toCurrencyNumber(order?.discount),
    totalAmount
  };
};

const WaiterOrdersPage = () => {
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [activeTab, setActiveTab] = useState('dineIn');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOrderInfoModal, setShowOrderInfoModal] = useState(false);
  const [showTablePickerModal, setShowTablePickerModal] = useState(false);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [createOrderType, setCreateOrderType] = useState('reservation');
  const [addItemCategory, setAddItemCategory] = useState('dish');
  const [activePaymentMethod, setActivePaymentMethod] = useState('cash');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [voucherCode, setVoucherCode] = useState('GIAM30K');
  const [receivedMoney, setReceivedMoney] = useState('200000');
  const [menuSearch, setMenuSearch] = useState('');

  const [cartItems, setCartItems] = useState([
    { id: 'dish-1', name: 'Phở Bò Tái Lăn', price: 65000, quantity: 2, note: '' },
    {
      id: 'buffet-1',
      name: 'Buffet Hải Sản',
      price: 299000,
      quantity: 1,
      note: '',
      type: 'buffet',
      selectedChildren: ['Tôm hùm bỏ lò', 'Cua hoàng đế']
    },
    { id: 'drink-1', name: 'Trà Đào Cam Sả', price: 35000, quantity: 1, note: '' }
  ]);

  const [orderForm, setOrderForm] = useState({
    fullName: 'Nguyễn Hoàng Nam',
    phone: '0901234567',
    orderCode: '#ORD-240524-001',
    orderType: 'at-place',
    guests: 4,
    bookingDate: '2024-05-24',
    bookingTime: '18:30',
    note: ''
  });

  const [tableSelection, setTableSelection] = useState({
    mainTableId: 'T.01',
    mergedTableIds: ['T.02', 'T.10']
  });

  const tables = useMemo(
    () => [
      { id: 'T.01', seats: 4, status: 'empty' },
      { id: 'T.02', seats: 4, status: 'empty' },
      { id: 'T.03', seats: 2, status: 'empty' },
      { id: 'T.04', seats: 6, status: 'occupied' },
      { id: 'T.05', seats: 4, status: 'empty' },
      { id: 'T.06', seats: 4, status: 'empty' },
      { id: 'T.07', seats: 8, status: 'empty' },
      { id: 'T.08', seats: 2, status: 'empty' },
      { id: 'T.09', seats: 4, status: 'occupied' },
      { id: 'T.10', seats: 4, status: 'empty' },
      { id: 'T.11', seats: 4, status: 'empty' },
      { id: 'T.12', seats: 2, status: 'empty' },
      { id: 'T.13', seats: 4, status: 'empty' },
      { id: 'T.14', seats: 4, status: 'empty' },
      { id: 'T.15', seats: 6, status: 'empty' },
      { id: 'T.16', seats: 4, status: 'occupied' }
    ],
    []
  );

  const [deliveryOrders, setDeliveryOrders] = useState([]);
  const [dineInOrders, setDineInOrders] = useState([]);
  const [takeawayOrders, setTakeawayOrders] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);

  const fetchWaiterOrders = useCallback(async () => {
    setLoadingOrders(true);
    setOrdersError('');

    try {
      const [activeResult, historyResult] = await Promise.allSettled([
        orderAPI.getActive(),
        orderAPI.getHistory()
      ]);

      let activeOrders = [];

      if (activeResult.status === 'fulfilled') {
        activeOrders = asArray(activeResult.value?.data).map(mapApiOrderToWaiter);
      } else {
        const status = activeResult.reason?.response?.status;

        // Một số backend không cấp quyền /order/active cho Waiter.
        // Thử fallback endpoint hôm nay trước khi báo lỗi.
        if (status === 403) {
          const todayResult = await Promise.allSettled([orderAPI.getToday()]);
          if (todayResult[0].status === 'fulfilled') {
            activeOrders = asArray(todayResult[0].value?.data).map(mapApiOrderToWaiter);
          } else {
            throw new Error('Lỗi 403: Tài khoản Waiter không có quyền gọi API đơn hàng hiện tại. Vui lòng cấp quyền endpoint order cho Waiter hoặc cung cấp endpoint riêng cho waiter.');
          }
        } else {
          const message = activeResult.reason?.response?.data?.message || activeResult.reason?.message;
          throw new Error(`Lỗi ${status || 'kết nối'}: ${message || 'Không thể tải danh sách đơn hàng.'}`);
        }
      }

      setDineInOrders(activeOrders.filter((order) => order.channel === 'dineIn'));
      setTakeawayOrders(activeOrders.filter((order) => order.channel === 'takeaway'));
      setDeliveryOrders(activeOrders.filter((order) => order.channel === 'delivery'));

      if (historyResult.status === 'fulfilled') {
        const historyOrders = asArray(historyResult.value?.data);
        const groupedByDate = historyOrders.reduce((acc, order) => {
          const rawDate = order?.createdAt || order?.updatedAt || order?.orderDate;
          const dateKey = rawDate ? new Date(rawDate).toLocaleDateString('vi-VN') : 'Không xác định';
          const current = acc[dateKey] || { totalOrders: 0, revenue: 0 };
          current.totalOrders += 1;
          current.revenue += toCurrencyNumber(order?.totalAmount ?? order?.total ?? 0);
          acc[dateKey] = current;
          return acc;
        }, {});

        const historyRows = Object.entries(groupedByDate)
          .slice(0, 7)
          .map(([date, metrics]) => ({
            date,
            totalOrders: `${metrics.totalOrders} đơn`,
            revenue: `${metrics.revenue.toLocaleString('vi-VN')}đ`,
            rating: 5,
            status: 'Hoàn thành'
          }));

        setServiceHistory(historyRows);
      } else {
        setServiceHistory([]);
      }
    } catch (error) {
      console.error('Không thể tải dữ liệu đơn hàng waiter:', error);
      setOrdersError(error?.message || 'Không thể tải dữ liệu đơn hàng.');
      setDineInOrders([]);
      setTakeawayOrders([]);
      setDeliveryOrders([]);
      setServiceHistory([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchWaiterOrders();
  }, [fetchWaiterOrders]);

  const currentOrders =
    activeTab === 'delivery'
      ? deliveryOrders
      : activeTab === 'takeaway'
        ? takeawayOrders
        : dineInOrders;
  const deliveryCount = deliveryOrders.length;
  const takeawayCount = takeawayOrders.length;
  const dineInCount = dineInOrders.length;

  const getStatusClass = (status) => {
    switch (status) {
      case 'preparing':
        return 'status-preparing';
      case 'ready':
        return 'status-ready';
      case 'delivering':
        return 'status-delivering';
      default:
        return '';
    }
  };

  const getDishStatus = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Đang chờ', cls: 'dish-status pending' };
      case 'preparing':
        return { label: 'Đang làm', cls: 'dish-status preparing' };
      case 'ready':
        return { label: 'Đã xong', cls: 'dish-status ready' };
      case 'served':
        return { label: 'Đã bưng lên', cls: 'dish-status served' };
      default:
        return { label: 'Đang chờ', cls: 'dish-status pending' };
    }
  };

  const formatCurrency = (value) => `${value.toLocaleString('vi-VN')}đ`;

  const getOrderItemsSummary = (order) =>
    ((order.items || []).length ? (order.items || []) : [{ name: 'Chưa có món', quantity: 0 }])
      .map((item) => `${item.name} (${item.quantity})`)
      .join(', ');

  const calculateOrderSubtotal = (order) =>
    (order.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0);

  const calculateOrderTotal = (order) =>
    calculateOrderSubtotal(order) + (order.deliveryFee || 0) - (order.discount || 0);

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setShowOrderDetailModal(true);
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

  const removeCartItem = (itemId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const closeCreateFlow = () => {
    setShowCreateModal(false);
    setShowOrderInfoModal(false);
    setShowTablePickerModal(false);
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

  const shiftStats = {
    workHours: '5h 42m',
    efficiency: '94%',
    tips: '450.000đ'
  };

  const pendingDeliveries = deliveryOrders.filter((order) => order.status === 'ready').slice(0, 2);

  return (
    <div className="waiter-orders-container">
      <header className="waiter-page-header">
        <div>
          <h2 className="waiter-page-title">Quản lý Đơn hàng</h2>
          <p className="waiter-page-subtitle">
            Hôm nay, {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button className="btn-create-order" onClick={() => setShowCreateModal(true)}>
          <Plus size={20} />
          Tạo đơn hàng mới
        </button>
      </header>

      {ordersError && (
        <div style={{
          marginBottom: '16px',
          border: '1px solid #ffccc7',
          background: '#fff2f0',
          color: '#cf1322',
          padding: '10px 12px',
          borderRadius: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span>{ordersError}</span>
          <button className="btn-order-detail" type="button" onClick={fetchWaiterOrders}>
            Tải lại
          </button>
        </div>
      )}

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
            {!loadingOrders && currentOrders.map((order) => (
              <div key={order.id} className="order-card">
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
                  <button className="btn-order-detail" onClick={() => openOrderDetail(order)}>
                    Chi tiết
                  </button>
                  <button
                    className="btn-order-pay"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowPaymentModal(true);
                    }}
                  >
                    Thanh toán
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="service-history-section">
            <div className="section-header">
              <h3 className="section-title">Lịch sử phục vụ 7 ngày</h3>
              <button className="btn-view-all">Xem tất cả</button>
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
                  {serviceHistory.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#888' }}>
                        Chưa có dữ liệu lịch sử từ API.
                      </td>
                    </tr>
                  )}
                  {serviceHistory.map((record, index) => (
                    <tr key={index}>
                      <td>{record.date}</td>
                      <td className="font-medium">{record.totalOrders}</td>
                      <td>{record.revenue}</td>
                      <td>
                        <div className="rating-stars">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < Math.floor(record.rating) ? 'star-filled' : 'star-empty'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="status-completed">
                          ✓ {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <aside className="orders-sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-card-title">
              <ShoppingBag size={20} className="title-icon" />
              Đơn vận chuyển ({pendingDeliveries.length})
            </h3>

            <div className="delivery-orders-list">
              {pendingDeliveries.map((order) => (
                <div key={order.id} className="delivery-order-item">
                  <div className="delivery-order-header">
                    <span className="delivery-order-id">#{order.id}</span>
                    <span className="delivery-order-time">{order.time}</span>
                  </div>
                  <h5 className="delivery-customer-name">{order.customerName}</h5>
                  <p className="delivery-address">
                    <MapPin size={12} />
                    {order.address}
                  </p>
                  <button className="btn-start-delivery">Bắt đầu giao</button>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-card stats-card">
            <h3 className="sidebar-card-title">Thống kê ca làm</h3>

            <div className="stats-grid">
              <div className="stat-item">
                <p className="stat-label">Thời gian</p>
                <p className="stat-value">{shiftStats.workHours}</p>
              </div>
              <div className="stat-item">
                <p className="stat-label">Hiệu suất</p>
                <p className="stat-value stat-success">{shiftStats.efficiency}</p>
              </div>
            </div>

            <div className="tips-banner">
              <div>
                <p className="tips-label">Tiền tip hôm nay</p>
                <p className="tips-amount">{shiftStats.tips}</p>
              </div>
              <Clock size={32} className="tips-icon" />
            </div>
          </div>
        </aside>
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

              {/* Order Type Options */}
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

              {/* Search Input */}
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
                onClick={() => {
                  setShowCreateModal(false);
                  setShowOrderInfoModal(true);
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

                  <button
                    type="button"
                    className="select-table-btn"
                    onClick={() => setShowTablePickerModal(true)}
                  >
                    <LayoutGrid size={18} />
                    Chọn bàn (Bàn chính & Ghép thêm)
                  </button>
                  <p className="select-table-hint">
                    Vui lòng chọn bàn để hoàn thành chi tiết đơn hàng
                  </p>
                </section>
              </form>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeCreateFlow}>
                <ArrowLeft size={16} />
                Quay lại
              </button>
              <button className="btn-continue">
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
                  const isOccupied = table.status === 'occupied';

                  return (
                    <button
                      key={table.id}
                      type="button"
                      className={`table-item ${
                        isOccupied ? 'table-occupied' : isSelected ? 'table-selected' : 'table-empty'
                      }`}
                      disabled={isOccupied}
                      onClick={() => toggleTableSelection(table.id)}
                    >
                      {isMain && <span className="table-badge main">Chính</span>}
                      {isMerged && <span className="table-badge merged">Ghép</span>}
                      <strong>{table.id}</strong>
                      <span>{table.seats} ghế</span>
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
              <button className="btn-continue" onClick={() => setShowTablePickerModal(false)}>
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
                    {selectedOrder.items.map((item) => {
                      const dishStatus = getDishStatus(item.dishStatus || 'pending');
                      return (
                        <tr key={item.name}>
                          <td>
                            <p>{item.name}</p>
                            {item.note && <small>{item.note}</small>}
                          </td>
                          <td>{item.quantity}</td>
                          <td>
                            <span className={dishStatus.cls}>{dishStatus.label}</span>
                          </td>
                          <td>{formatCurrency(item.price)}</td>
                          <td>
                            {item.dishStatus === 'pending' && (
                              <button className="dish-action delete" type="button">
                                <Trash2 size={14} />
                              </button>
                            )}
                            {item.dishStatus === 'ready' && (
                              <button className="dish-action serve" type="button">
                                <CheckCircle2 size={14} />
                              </button>
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
                <div>
                  <span>Thuế VAT (10%)</span>
                  <strong>{formatCurrency(Math.round(calculateOrderSubtotal(selectedOrder) * 0.1))}</strong>
                </div>
                <div className="grand-total">
                  <span>Tổng cộng</span>
                  <strong>
                    {formatCurrency(
                      calculateOrderSubtotal(selectedOrder) +
                        Math.round(calculateOrderSubtotal(selectedOrder) * 0.1)
                    )}
                  </strong>
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
                    setShowPaymentModal(true);
                  }}
                >
                  <CreditCard size={18} /> Thanh toán
                </button>
              </div>
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
                  <div>
                    <span>Thuế (VAT 8%):</span>
                    <strong>{formatCurrency(Math.round(calculateOrderSubtotal(selectedOrder) * 0.08))}</strong>
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
                  <p className="voucher-ok">
                    <CheckCircle2 size={14} /> Đã áp dụng mã {voucherCode || 'GIAM30K'} (-30.000đ)
                  </p>
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
                      <QrCode size={18} /> QR Code
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
                </div>

                <div className="change-box">
                  <span>Tiền thừa trả khách:</span>
                  <strong>
                    {formatCurrency(
                      Math.max(0, Number(receivedMoney || 0) - calculateOrderTotal(selectedOrder))
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-continue full">
                <Receipt size={18} /> XÁC NHẬN THANH TOÁN & IN HÓA ĐƠN
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
                    {[
                      { id: 'dish-a', name: 'Phở Bò Tái Lăn', price: 65000 },
                      { id: 'dish-b', name: 'Cơm Tấm Sườn', price: 55000 },
                      { id: 'dish-c', name: 'Gỏi Cuốn Tôm Thịt', price: 45000 },
                      { id: 'dish-d', name: 'Trà Đào Cam Sả', price: 35000 }
                    ].map((menu) => (
                      <div className="menu-food-card" key={menu.id}>
                        <div>
                          <h5>{menu.name}</h5>
                          <p>{formatCurrency(menu.price)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setCartItems((prev) => {
                              const found = prev.find((x) => x.id === menu.id);
                              if (found) {
                                return prev.map((x) =>
                                  x.id === menu.id ? { ...x, quantity: x.quantity + 1 } : x
                                );
                              }
                              return [...prev, { ...menu, quantity: 1, note: '' }];
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
                    {[
                      { id: 'combo-a', name: 'Combo Gia Đình', price: 850000 },
                      { id: 'combo-b', name: 'Combo Uyên Ương', price: 520000 },
                      { id: 'combo-c', name: 'Combo Trưa Văn Phòng', price: 95000 }
                    ].map((combo) => (
                      <div className="menu-food-card" key={combo.id}>
                        <div>
                          <h5>{combo.name}</h5>
                          <p>{formatCurrency(combo.price)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setCartItems((prev) => {
                              const found = prev.find((x) => x.id === combo.id);
                              if (found) {
                                return prev.map((x) =>
                                  x.id === combo.id ? { ...x, quantity: x.quantity + 1 } : x
                                );
                              }
                              return [...prev, { ...combo, quantity: 1, note: '' }];
                            })
                          }
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {addItemCategory === 'buffet' && (
                  <div className="buffet-panel">
                    <div className="buffet-header-block">
                      <h4>Thành phần Buffet Hải Sản (Đã chọn)</h4>
                      <span>Đang áp dụng</span>
                    </div>
                    <div className="menu-card-grid buffet-items-grid">
                      {['Tôm hùm bỏ lò phô mai', 'Cua hoàng đế hấp sả', 'Hàu nướng mỡ hành', 'Sò điệp Nhật'].map(
                        (dish) => (
                          <div className="menu-food-card buffet-child" key={dish}>
                            <div>
                              <h5>{dish}</h5>
                              <p>0đ</p>
                            </div>
                            <button type="button">
                              <Plus size={16} />
                            </button>
                          </div>
                        )
                      )}
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
                      <div className="cart-item-row">
                        <div>
                          <h5>{item.name}</h5>
                          <p>{formatCurrency(item.price)}</p>
                        </div>
                        <div className="qty-box">
                          <button type="button" onClick={() => updateCartQuantity(item.id, -1)}>
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => updateCartQuantity(item.id, 1)}>
                            +
                          </button>
                        </div>
                      </div>
                      {item.selectedChildren && (
                        <div className="buffet-children-tags">
                          {item.selectedChildren.map((child) => (
                            <span key={child}>{child}</span>
                          ))}
                        </div>
                      )}
                      <input
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
                    onClick={() => {
                      setShowAddItemsModal(false);
                    }}
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
};

export default WaiterOrdersPage;
