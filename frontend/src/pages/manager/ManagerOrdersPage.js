import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bike,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  History,
  MoreHorizontal,
  PartyPopper,
  RefreshCw,
  Search,
  UtensilsCrossed
} from 'lucide-react';
import EventDetailModal from './EventDetailModal';
import DeliveryDetailModal from './DeliveryDetailModal';
import { orderAPI, mapOrderToUI, mapStatus, mapOrderTypeLabel, formatCurrency } from '../../api/managerApi';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const TAB_FILTER = {
  all:      null,
  dine:     'DineIn',
  takeaway: 'Takeaway',
  delivery: 'Delivery',
  event:    'Event',
};

const PAGE_SIZE = 12;

const ModeIcon = ({ mode }) => {
  if (mode === 'delivery') return <Bike size={14} />;
  if (mode === 'event')    return <PartyPopper size={14} />;
  return <UtensilsCrossed size={14} />;
};

const SkeletonCard = () => (
  <article className="order-item-card" style={{ pointerEvents: 'none' }}>
    <div style={{ padding: '12px 14px' }}>
      <div style={{ height: 12, background: '#f0f0f0', borderRadius: 4, marginBottom: 8, width: '60%' }} />
      <div style={{ height: 16, background: '#f0f0f0', borderRadius: 4, width: '80%' }} />
    </div>
    <div style={{ height: 140, background: '#f5f5f5' }} />
    <div style={{ padding: '12px 14px', height: 12, background: '#f0f0f0', borderRadius: 4, width: '40%' }} />
  </article>
);

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
const ManagerOrdersPage = () => {
  const navigate = useNavigate();

  const [activeOrders,   setActiveOrders]   = useState([]);
  const [historyOrders,  setHistoryOrders]  = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [histLoading,    setHistLoading]    = useState(true);
  const [error,          setError]          = useState(null);
  const [activeTab,      setActiveTab]      = useState('all');
  const [searchText,     setSearchText]     = useState('');
  const [currentPage,    setCurrentPage]    = useState(1);

  const [selectedEvent,        setSelectedEvent]        = useState(null);
  const [isModalOpen,          setIsModalOpen]          = useState(false);
  const [selectedDelivery,     setSelectedDelivery]     = useState(null);
  const [isDeliveryModalOpen,  setIsDeliveryModalOpen]  = useState(false);

  // ── fetch ─────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setHistLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
      console.log('🔑 Token present:', !!token);

      // Gọi song song, dùng allSettled để history lỗi không ảnh hưởng active
      const [activeResult, histResult] = await Promise.allSettled([
        orderAPI.getActive(),
        orderAPI.getHistory(),
      ]);

      // Xử lý active orders
      if (activeResult.status === 'fulfilled') {
        const d = activeResult.value.data;
        const rawActive = Array.isArray(d) ? d : d?.data ?? d?.items ?? d?.orders ?? [];
        console.log('📦 Active orders:', rawActive.length);
        setActiveOrders(rawActive.map(mapOrderToUI));
      } else {
        const s = activeResult.reason?.response?.status;
        const m = activeResult.reason?.response?.data?.message || activeResult.reason?.message;
        throw Object.assign(new Error(m), { response: { status: s, data: { message: m } } });
      }

      // Xử lý history (có thể bị 403 với một số role)
      if (histResult.status === 'fulfilled') {
        const d = histResult.value.data;
        const rawHistory = Array.isArray(d) ? d : d?.data ?? d?.items ?? d?.orders ?? [];
        console.log('📦 History orders:', rawHistory.length);
        const history = rawHistory.slice(0, 10).map((o) => {
          const { label, css } = mapStatus(o.status);
          return {
            code:        o.orderCode ?? `#${o.orderId}`,
            time:        o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '--',
            type:        mapOrderTypeLabel(o.orderType),
            amount:      formatCurrency(o.totalAmount ?? o.total),
            status:      label,
            statusClass: css,
            icon:        o.orderType === 'Delivery' ? 'delivery' : 'dine',
            id:          o.orderId ?? o.id,
          };
        });
        setHistoryOrders(history);
      } else {
        console.warn('⚠️ History endpoint không khả dụng (có thể do phân quyền):', histResult.reason?.response?.status);
        setHistoryOrders([]);
      }
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data?.message || err.response?.data?.title || err.message;
      console.error('❌ Lỗi tải đơn hàng | Status:', status, '| Message:', msg, err);
      setError(`Lỗi ${status ?? 'kết nối'}: ${msg ?? 'Không thể tải đơn hàng.'}`);
    } finally {
      setLoading(false);
      setHistLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── filter by tab ────────────────────────
  const tabFiltered =
    activeTab === 'all'
      ? activeOrders
      : activeOrders.filter((o) => o.icon === activeTab);

  const tabCounts = {
    all:      activeOrders.length,
    dine:     activeOrders.filter((o) => o.icon === 'dine').length,
    takeaway: activeOrders.filter((o) => o.icon === 'takeaway').length,
    delivery: activeOrders.filter((o) => o.icon === 'delivery').length,
    event:    activeOrders.filter((o) => o.icon === 'event').length,
  };

  // ── search ───────────────────────────────
  const lower = searchText.toLowerCase();
  const displayed = searchText
    ? tabFiltered.filter(
        (o) =>
          o.code.toLowerCase().includes(lower) ||
          o.title.toLowerCase().includes(lower) ||
          o.mode.toLowerCase().includes(lower)
      )
    : tabFiltered;

  // ── pagination ─────────────────────────
  const totalPages  = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const pagedOrders = displayed.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleTabClick = (key) => { setActiveTab(key); setCurrentPage(1); };

  // ── card click ────────────────────────
  const handleCardClick = (order) => {
    if (order.icon === 'event') {
      setSelectedEvent(order);
      setIsModalOpen(true);
    } else if (order.icon === 'delivery') {
      setSelectedDelivery(order);
      setIsDeliveryModalOpen(true);
    } else if (order.icon === 'dine') {
      navigate(`/manager/orders/dine-in/${encodeURIComponent(order.code)}`);
    } else {
      navigate(`/manager/orders/takeaway/${encodeURIComponent(order.code)}`);
    }
  };

  const orderTabs = [
    { label: 'Tất cả',     filterKey: 'all',      count: tabCounts.all },
    { label: 'Ăn tại chỗ', filterKey: 'dine',     count: tabCounts.dine },
    { label: 'Mang về',    filterKey: 'takeaway',  count: tabCounts.takeaway },
    { label: 'Vận chuyển', filterKey: 'delivery',  count: tabCounts.delivery },
    { label: 'Sự kiện',    filterKey: 'event',     count: tabCounts.event },
  ];

  const today = new Date().toLocaleDateString('vi-VN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // ─────────────────────────────────────────
  return (
    <div className="manager-page-grid orders-page">
      {/* HEADER */}
      <div className="manager-page-header orders-header-row">
        <div>
          <h1>Quản lý đơn hàng</h1>
          <p>Hôm nay: <strong>{today}</strong></p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="orders-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm mã đơn, số bàn, tên khách..."
              className="orders-search-input"
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button
            onClick={fetchAll}
            title="Làm mới"
            style={{
              background: 'none', border: '1.5px solid #e0e0e0',
              borderRadius: 8, padding: '8px 10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', color: '#666',
            }}
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="orders-tabs">
        {orderTabs.map((tab) => (
          <button
            key={tab.filterKey}
            className={`orders-tab ${activeTab === tab.filterKey ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.filterKey)}
          >
            <span>{tab.label}</span>
            <small>{String(tab.count).padStart(2, '0')}</small>
          </button>
        ))}
      </div>

      {/* ACTIVE SECTION */}
      <section className="manager-card orders-active-section">
        <div className="orders-section-head">
          <div>
            <h2>Đơn hàng đang hoạt động</h2>
            <p>Hiển thị {displayed.length} đơn mới nhất theo trạng thái vận hành.</p>
          </div>
          <span className="orders-count">{displayed.length} đơn</span>
        </div>

        {error && (
          <div style={{
            background: '#fff1f0', border: '1px solid #ffccc7',
            borderRadius: 8, padding: '12px 16px', marginBottom: 16,
            color: '#cf1322', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            ⚠ {error}
            <button
              onClick={fetchAll}
              style={{
                marginLeft: 'auto', padding: '4px 12px', borderRadius: 6,
                background: '#ff4d4f', color: '#fff', cursor: 'pointer',
              }}
            >
              Thử lại
            </button>
          </div>
        )}

        <div className="orders-grid-cards">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : pagedOrders.length === 0
              ? (
                <div style={{
                  gridColumn: '1/-1', textAlign: 'center',
                  padding: '48px 0', color: '#aaa',
                }}>
                  <UtensilsCrossed size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                  <p>Không có đơn hàng {searchText ? 'khớp tìm kiếm' : 'đang hoạt động'}.</p>
                </div>
              )
              : pagedOrders.map((order) => (
                <article
                  className="order-item-card"
                  key={order.id ?? order.code}
                  onClick={() => handleCardClick(order)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="order-item-top">
                    <div>
                      <p className="order-item-meta">
                        <ModeIcon mode={order.icon} />
                        <span>{order.code} • {order.mode}</span>
                      </p>
                      <h3>{order.title}</h3>
                    </div>
                    <span className={`orders-state ${order.statusClass}`}>{order.status}</span>
                  </div>

                  <div
                    className="order-item-image"
                    style={{ backgroundImage: `url(${order.image})` }}
                  >
                    <div className="order-item-overlay">
                      <span>{order.items}</span>
                    </div>
                  </div>

                  <div className="order-item-bottom">
                    <strong>{order.amount}</strong>
                    <button
                      aria-label={`Tác vụ ${order.code}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </article>
              ))
          }
        </div>

        {/* PAGINATION */}
        {!loading && displayed.length > PAGE_SIZE && (
          <div className="orders-pagination">
            <p>
              Hiển thị{' '}
              <strong>{(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, displayed.length)}</strong>{' '}
              trong tổng số <strong>{displayed.length}</strong> đơn
            </p>
            <div className="orders-pagination-controls">
              <button
                className={`orders-page-btn${currentPage === 1 ? ' disabled' : ''}`}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft size={16} /><span>Trang trước</span>
              </button>
              <div className="orders-pages">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={currentPage === p ? 'active' : ''}
                    onClick={() => setCurrentPage(p)}
                  >{p}</button>
                ))}
              </div>
              <button
                className={`orders-page-btn${currentPage === totalPages ? ' disabled' : ''}`}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <span>Trang sau</span><ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* HISTORY SECTION */}
      <section className="manager-card orders-history-section">
        <div className="orders-section-head history">
          <h2><History size={18} /><span>Lịch sử đơn hàng gần đây</span></h2>
        </div>

        <div className="manager-table-wrap">
          <table className="manager-table orders-history-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Thời gian</th>
                <th>Loại hình</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {histLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <td key={j}>
                          <div style={{ height: 12, background: '#f0f0f0', borderRadius: 4 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : historyOrders.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#aaa', padding: '24px 0' }}>
                        Chưa có lịch sử đơn hàng.
                      </td>
                    </tr>
                  )
                  : historyOrders.map((order) => (
                    <tr key={order.code}>
                      <td>{order.code}</td>
                      <td>{order.time}</td>
                      <td>
                        <div className="orders-history-type">
                          <ModeIcon mode={order.icon} />
                          <span>{order.type}</span>
                        </div>
                      </td>
                      <td>{order.amount}</td>
                      <td>
                        <span className={`orders-state ${order.statusClass}`}>{order.status}</span>
                      </td>
                      <td>
                        <button className="orders-detail-btn">Chi tiết</button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        <div className="orders-history-footer">
          <p>Hiển thị {historyOrders.length} đơn hàng gần nhất</p>
          <div className="orders-mini-pager">
            <button disabled><ChevronLeft size={16} /></button>
            <button><ChevronRight size={16} /></button>
          </div>
        </div>
      </section>

      <footer className="orders-footer-note">
        <CalendarDays size={14} />
        <p>© 2026 SMAS Restaurant System</p>
      </footer>

      {/* MODALS */}
      <EventDetailModal
        isOpen={isModalOpen}
        event={selectedEvent}
        onClose={() => { setIsModalOpen(false); setSelectedEvent(null); }}
        onSave={() => { setIsModalOpen(false); setSelectedEvent(null); fetchAll(); }}
      />
      <DeliveryDetailModal
        isOpen={isDeliveryModalOpen}
        deliveryData={selectedDelivery}
        onClose={() => { setIsDeliveryModalOpen(false); setSelectedDelivery(null); }}
      />
    </div>
  );
};

export default ManagerOrdersPage;
