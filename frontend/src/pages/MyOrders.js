import React, { useState, useEffect } from 'react';
import { myOrderAPI } from '../api/myOrderApi';
import OrderDetailModal from './OrderDetailModal';
import EventOrderDetailModal from './EventOrderDetailModal';
import '../styles/OrderHistory.css';

/**
 * Chuyển chuỗi ISO datetime (UTC) → giờ Việt Nam (UTC+7).
 * Dùng đúng giờ địa phương, không bị lệch múi giờ trình duyệt.
 */
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

const fmtVNDate = (date) => {
  if (!date) return '—';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmtRawTime = (timeStr) => {
  if (!timeStr) return '—';
  const m = String(timeStr).match(/^(\d{2}):(\d{2})/);
  if (!m) return timeStr;
  const [, h, mi] = m;
  return `${h}:${mi}`;
};

/** Kiểm tra đơn Pending quá 2 tiếng chưa xác nhận → tự đánh Cancelled */
const applyAutoCancel = (item) => {
  const raw = item.rawStatus || item.status || item.orderStatus || '';
  if (raw !== 'Pending') return item;
  const createdAt = item.createdAt || item.reservationDate || null;
  if (!createdAt) return item;
  const created = toVietnamTime(createdAt);
  if (!created) return item;
  const now = new Date();
  const diffMs = now - created;
  if (diffMs > 2 * 60 * 60 * 1000) {
    return { ...item, effectiveStatus: 'Cancelled', autoCancelled: true };
  }
  return { ...item, effectiveStatus: 'Pending', autoCancelled: false };
};

/** Completed / Cancelled → sang OrderHistory; chỉ giữ lại đơn đang xử lý */
const isForHistory = (status) => ['Completed', 'Cancelled', 'Cancel'].includes(status);

/** POST /api/order/filter — Giao hàng: dùng status "Confirmed" (theo thực tế backend) */
const DELIVERY_API_STATUSES = ['Pending', 'Confirmed'];

const MyOrders = () => {
  const [activeTab, setActiveTab] = useState('Delivery');
  /** Lọc phụ tab Giao hàng: all | Pending | Confirm */
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'Delivery', label: 'GIAO HÀNG', icon: 'fa-truck' },
    { id: 'Booking', label: 'ĐẶT CHỖ', icon: 'fa-utensils' },
    { id: 'Event', label: 'SỰ KIỆN', icon: 'fa-calendar-star' }
  ];

  const [reservations, setReservations] = useState([]);
  const [eventsData, setEventsData] = useState([]);

  const getStatusDisplay = (status) => {
    const config = {
      Pending: { text: 'Chờ xác nhận', class: 'Waiting' },
      Confirm: { text: 'Đã xác nhận', class: 'Success' },
      Confirmed: { text: 'Đã xác nhận', class: 'Success' },
      Processing: { text: 'Đang xử lý', class: 'Processing' },
      Completed: { text: 'Hoàn thành', class: 'Success' },
      Cancelled: { text: 'Đã hủy', class: 'Cancelled' },
    };
    return config[status] || { text: status || 'Chờ xác nhận', class: 'Waiting' };
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (activeTab === 'Booking') {
        const data = await myOrderAPI.getReservations();
        const raw = Array.isArray(data) ? data : [];
        setReservations(raw);
        setEventsData([]);
        setOrders([]);
      } else if (activeTab === 'Event') {
        const data = await myOrderAPI.getMyBookEvents();
        const raw = Array.isArray(data) ? data : [];
        setEventsData(raw);
        setReservations([]);
        setOrders([]);
      } else {
        // POST /api/order/filter — orderType=Delivery & status=Pending & status=Confirm
        const data = await myOrderAPI.getOrders(activeTab, DELIVERY_API_STATUSES);
        setOrders(Array.isArray(data) ? data : []);
        setReservations([]);
        setEventsData([]);
      }
    } catch (err) {
      setOrders([]);
      setReservations([]);
      setEventsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    setCurrentPage(1);
    setDeliveryStatusFilter('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  /* ── Poll: đơn hàng bị hủy từ backend → lập tức loại khỏi danh sách ── */
  useEffect(() => {
    if (activeTab !== 'Delivery') return;

    const poll = async () => {
      const latest = await myOrderAPI.getOrders(activeTab, DELIVERY_API_STATUSES);
      const fresh = Array.isArray(latest) ? latest : [];
      setOrders((prev) => {
        if (fresh.length === 0) return prev;
        const cancelledIds = new Set(
          fresh.filter((o) => o.orderStatus === 'Cancelled').map((o) => o.orderId)
        );
        if (cancelledIds.size === 0) return fresh;
        return fresh.filter((o) => !cancelledIds.has(o.orderId));
      });
    };

    const intervalId = setInterval(poll, 15_000); // 15s
    return () => clearInterval(intervalId);
  }, [activeTab]);

  /* ── Lọc cho MyOrders: chỉ giữ lại Pending/Confirmed ── */

  const allData = (
    activeTab === 'Booking' ? reservations :
    activeTab === 'Event' ? eventsData :
    orders
  );

  const matchesDeliveryStatusFilter = (order) => {
    if (deliveryStatusFilter === 'all') return true;
    const st = order.orderStatus || order.status || '';
    if (deliveryStatusFilter === 'Pending') return st === 'Pending';
    if (deliveryStatusFilter === 'Confirmed') return st === 'Confirmed';
    return true;
  };

  const filteredData = allData
    .map((item) => {
      const withEffective = applyAutoCancel(item);
      const eff = withEffective.effectiveStatus ?? withEffective.orderStatus ?? withEffective.status;
      return { ...withEffective, _isHistory: isForHistory(eff) };
    })
    .filter((item) => !item._isHistory)
    .filter((item) => {
      if (activeTab === 'Delivery' && !matchesDeliveryStatusFilter(item)) return false;
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      const code = item.orderCode || item.reservationCode || item.eventBookingCode || item.bookingCode || '';
      return code.toLowerCase().includes(query);
    });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const currentPageSafe = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (currentPageSafe - 1) * itemsPerPage;
  const paginatedList = filteredData.slice(startIndex, startIndex + itemsPerPage);

  /* ── Tab Đặt chỗ ── */
  const renderBookingCard = (res) => {
    const status = getStatusDisplay(res.effectiveStatus || res.status);
    const isAutoCancelled = res.autoCancelled && res.effectiveStatus === 'Cancelled';
    return (
      <div key={res.reservationId} className="Order-Horizontal-Card">
        <div className="Card-Top-Row">
          <div className="Type-Header">
            <div className="Type-Icon-Wrap">
              <i className="fa-solid fa-house-user"></i>
            </div>
            <div className="Type-Text">
              <strong>Đặt chỗ</strong>
              <small className="Order-Code-Tag">Mã giao dịch #{res.reservationCode}</small>
            </div>
          </div>
          <div className="Right-Action-Header">
            <div className={`Status-Label ${status.class}`}>
              {status.text}
              {isAutoCancelled && <span style={{ fontSize: '0.75em', marginLeft: 4 }}>(quá hạn)</span>}
            </div>
          </div>
        </div>
        <div className="Card-Main-Grid">
          <div className="Grid-Col">
            <p>NGƯỜI ĐẶT: <span>{res.fullname || '—'}</span></p>
            <p>ĐIỆN THOẠI: <span>{res.phone || '—'}</span></p>
          </div>
          <div className="Grid-Col">
            <p>NGÀY ĐẶT: <span>{res.reservationDate ? fmtVNDate(toVietnamTime(res.reservationDate)) : (res.reservationDate || '—')}</span></p>
            <p>GIỜ: <span>{fmtRawTime(res.reservationTime)}</span></p>
          </div>
          <div className="Grid-Col Total-Col">
            <p>SỐ KHÁCH</p>
            <h2 className="Price-Text">{res.numberOfGuests} người</h2>
          </div>
        </div>
        {res.specialRequests && (
          <div className="Card-Bottom-Address">
            <i className="fa-solid fa-comment"></i>
            <span>Yêu cầu: {res.specialRequests}</span>
          </div>
        )}
      </div>
    );
  };

  /* ── Tab Sự kiện ── */
  const renderEventCard = (ev) => {
    const status = getStatusDisplay(ev.effectiveStatus || ev.status || ev.bookingStatus || '');
    const isAutoCancelled = ev.autoCancelled && ev.effectiveStatus === 'Cancelled';
    return (
      <div key={ev.eventBookingId || ev.id} className="Order-Horizontal-Card">
        <div className="Card-Top-Row">
          <div className="Type-Header">
            <div className="Type-Icon-Wrap">
              <i className="fa-solid fa-calendar-star"></i>
            </div>
            <div className="Type-Text">
              <strong>Đặt sự kiện</strong>
              <small className="Order-Code-Tag">#{ev.eventBookingCode || ev.bookingCode || ev.orderCode || ev.id}</small>
            </div>
          </div>
          <div className="Right-Action-Header">
            <div className={`Status-Label ${status.class}`}>
              {status.text}
              {isAutoCancelled && <span style={{ fontSize: '0.75em', marginLeft: 4 }}>(quá hạn)</span>}
            </div>
            <button
              className="Btn-View-Detail"
              onClick={() => {
                setSelectedEvent(ev);
                setShowEventModal(true);
              }}
            >
              CHI TIẾT
            </button>
          </div>
        </div>
        <div className="Card-Main-Grid">
          <div className="Grid-Col">
            <p>TÊN SỰ KIỆN: <span>{ev.eventTitle || ev.title || '—'}</span></p>
            <p>LOẠI: <span>{ev.eventType || '—'}</span></p>
          </div>
          <div className="Grid-Col">
            <p>NGÀY: <span>{ev.bookingDate ? fmtVNDate(toVietnamTime(ev.bookingDate)) : (ev.eventDate ? fmtVNDate(toVietnamTime(ev.eventDate)) : '—')}</span></p>
            <p>GIỜ: <span>{fmtRawTime(ev.bookingTime || ev.eventTime)}</span></p>
          </div>
          <div className="Grid-Col Total-Col">
            <p>SỐ KHÁCH</p>
            <h2 className="Price-Text">{(ev.numberOfGuests || ev.guestCount || 0)} người</h2>
          </div>
        </div>
        {(ev.specialRequests || ev.note) && (
          <div className="Card-Bottom-Address">
            <i className="fa-solid fa-comment"></i>
            <span>Yêu cầu: {ev.specialRequests || ev.note}</span>
          </div>
        )}
      </div>
    );
  };

  /* ── Tab Giao hàng (Delivery) ── */
  const renderDeliveryCard = (order) => {
    const status = getStatusDisplay(order.effectiveStatus || order.orderStatus);
    const isAutoCancelled = order.autoCancelled && order.effectiveStatus === 'Cancelled';
    return (
      <div key={order.orderId} className="Order-Horizontal-Card">
        <div className="Card-Top-Row">
          <div className="Type-Header">
            <div className="Type-Icon-Wrap">
              <i className={`fa-solid ${
                order.orderType === 'Delivery' ? 'fa-box' :
                order.orderType === 'Event' ? 'fa-calendar-star' : 'fa-house-user'
              }`}></i>
            </div>
            <div className="Type-Text">
              <strong>
                {order.orderType === 'Delivery' ? 'Giao hàng' :
                 order.orderType === 'Event' ? 'Đặt sự kiện tại cửa hàng' : 'Đặt chỗ'}
              </strong>
              <small className="Order-Code-Tag">Mã giao dịch #{order.orderCode}</small>
            </div>
          </div>
          <div className="Right-Action-Header">
            <div className={`Status-Label ${status.class}`}>
              {status.text}
              {isAutoCancelled && <span style={{ fontSize: '0.75em', marginLeft: 4 }}>(quá hạn)</span>}
            </div>
            <button className="Btn-View-Detail" onClick={() => { setSelectedOrder(order); setShowModal(true); }}>
              CHI TIẾT
            </button>
          </div>
        </div>
        <div className="Card-Main-Grid">
          <div className="Grid-Col">
            <p>NGƯỜI NHẬN: <span>{order.delivery?.recipientName || order.customer?.fullName || order.customer?.fullname || '—'}</span></p>
            <p>ĐIỆN THOẠI: <span>{order.delivery?.recipientPhone || order.customer?.phone || '—'}</span></p>
          </div>
          <div className="Grid-Col">
            <p>HÌNH THỨC: <span>{order.paymentMethod || 'Tiền mặt'}</span></p>
            <p>THỜI GIAN: <span>{fmtVN(toVietnamTime(order.createdAt))}</span></p>
          </div>
          <div className="Grid-Col Total-Col">
            <p>TỔNG THANH TOÁN</p>
            <h2 className="Price-Text">{order.totalAmount?.toLocaleString()} đ</h2>
          </div>
        </div>
        <div className="Card-Bottom-Address">
          <i className="fa-solid fa-location-dot"></i>
          <span>ĐỊA CHỈ: {order.delivery?.address || 'Nhận tại cửa hàng'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="Order-History-Page">
      <h1 className="Page-Title">ĐƠN HÀNG CỦA TÔI</h1>

      <div className="Order-Search-Bar">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          type="text"
          placeholder="Tìm theo mã giao dịch..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
        />
        {searchQuery && (
          <button className="Search-Clear-Btn" onClick={() => setSearchQuery('')}>
            <i className="fa-solid fa-times"></i>
          </button>
        )}
      </div>

      <div className="Order-Tabs-Container">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`Order-Tab-Btn ${activeTab === tab.id ? 'Active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'Delivery' && (
        <div className="Order-Tabs-Container Delivery-Sub-Filters" role="group" aria-label="Lọc trạng thái giao hàng">
          <button
            type="button"
            className={`Order-Tab-Btn ${deliveryStatusFilter === 'all' ? 'Active' : ''}`}
            onClick={() => { setDeliveryStatusFilter('all'); setCurrentPage(1); }}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`Order-Tab-Btn ${deliveryStatusFilter === 'Pending' ? 'Active' : ''}`}
            onClick={() => { setDeliveryStatusFilter('Pending'); setCurrentPage(1); }}
          >
            Chờ xác nhận
          </button>
          <button
            type="button"
            className={`Order-Tab-Btn ${deliveryStatusFilter === 'Confirmed' ? 'Active' : ''}`}
            onClick={() => { setDeliveryStatusFilter('Confirmed'); setCurrentPage(1); }}
          >
            Đã xác nhận
          </button>
        </div>
      )}

      <div className="Orders-List-Flow">
        {loading ? (
          <div className="Spinner-Wrapper"><div className="Spinner"></div><p>Đang tải dữ liệu...</p></div>
        ) : activeTab === 'Booking' ? (
          paginatedList.length > 0
            ? paginatedList.map(renderBookingCard)
            : <div className="Empty-Box">Bạn chưa có đặt bàn nào đang chờ.</div>
        ) : activeTab === 'Event' ? (
          paginatedList.length > 0
            ? paginatedList.map(renderEventCard)
            : <div className="Empty-Box">Bạn chưa có đặt sự kiện nào đang chờ.</div>
        ) : (
          paginatedList.length > 0
            ? paginatedList.map(renderDeliveryCard)
            : <div className="Empty-Box">Không tìm thấy đơn hàng nào đang chờ.</div>
        )}
      </div>

      {filteredData.length > 0 && (
        <div className="Order-History-Pagination">
          <p className="Pagination-Info">
            Hiển thị {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredData.length)} trong {filteredData.length} đơn đang chờ
          </p>
          <div className="Pagination-Controls">
            <button
              type="button"
              className="Page-Nav-Btn"
              disabled={currentPageSafe <= 1}
              onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              if (page === 1 || page === 2 || page === 3 || page === totalPages) {
                return (
                  <button
                    key={page}
                    type="button"
                    className={`Page-Number ${currentPageSafe === page ? 'Active' : ''}`}
                    onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  >
                    {page}
                  </button>
                );
              }
              if (page === 4) return <span key={page} className="Page-Ellipsis">...</span>;
              return null;
            })}
            <button
              type="button"
              className="Page-Nav-Btn"
              disabled={currentPageSafe >= totalPages}
              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}

      {showModal && <OrderDetailModal order={selectedOrder} onClose={() => setShowModal(false)} />}
      {showEventModal && (
        <EventOrderDetailModal
          eventData={selectedEvent}
          onClose={() => setShowEventModal(false)}
        />
      )}
    </div>
  );
};

export default MyOrders;
