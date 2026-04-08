import React, { useState, useEffect, useCallback } from 'react';
import { myOrderAPI } from '../api/myOrderApi';
import OrderDetailModal from './OrderDetailModal';
import '../styles/OrderHistory.css';

/**
 * Chuyển chuỗi ISO datetime (UTC) → giờ Việt Nam (UTC+7).
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

const fmtVNDate = (date) => {
  if (!date) return '—';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/** Đơn hàng giao hàng: chỉ Completed / Cancelled */
const normalizeOrderEffectiveStatus = (orderStatus) => {
  const s = String(orderStatus ?? '').trim();
  if (s === 'Completed' || s === 'Complete') return 'Completed';
  if (s === 'Cancelled' || s === 'Cancel' || s === 'Canceled') return 'Cancelled';
  return null;
};

const isDeliveryOrder = (order) => String(order.orderType ?? '').trim() === 'Delivery';

/** Đặt chỗ lịch sử: chỉ Seated (4) | Cancelled (3) */
const normalizeReservationEffective = (res) => {
  const raw = res.status ?? res.reservationStatus;
  if (raw === null || raw === undefined) return 'Cancelled';
  const num = Number(raw);
  const str = String(raw).trim();
  if (num === 3 || str === 'Cancelled') return 'Cancelled';
  if (num === 4 || str === 'Seated') return 'Seated';
  return 'Seated';
};

const OrderHistory = () => {
  const [listType, setListType] = useState('order');
  const [activeTab, setActiveTab] = useState('all-order');
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchQuery, setSearchQuery] = useState('');

  const orderTabs = [
    { id: 'all-order', label: 'Tất cả' },
    { id: 'completed', label: 'Hoàn thành' },
    { id: 'cancelled', label: 'Đã hủy' },
  ];

  const reservationTabs = [
    { id: 'seated', label: 'Đã đến' },
    { id: 'res-cancelled', label: 'Đã hủy' },
  ];

  const currentTabs = listType === 'reservation' ? reservationTabs : orderTabs;

  const getIconForType = (typeName) => {
    if (typeName?.includes('sự kiện')) return 'fa-solid fa-carrot';
    if (typeName?.includes('bàn ăn') || typeName?.includes('tại chỗ')) return 'fa-solid fa-utensils';
    if (typeName?.includes('Giao hàng') || typeName?.includes('giao hàng')) return 'fa-solid fa-truck';
    if (typeName?.includes('Mang đi')) return 'fa-solid fa-bag-shopping';
    if (typeName?.includes('buffet')) return 'fa-solid fa-calendar-xmark';
    return 'fa-solid fa-calendar-star';
  };

  const mapOrderTypeLabel = (orderType) => {
    const t = String(orderType || '').trim();
    if (t === 'DineIn') return 'Đặt bàn / Tại chỗ';
    if (t === 'TakeAway' || t === 'Takeaway') return 'Mang đi';
    if (t === 'Delivery') return 'Giao hàng';
    if (t === 'EventBooking' || t === 'Event') return 'Đặt sự kiện tại cửa hàng';
    return t || 'Đơn hàng';
  };

  const formatTablesDisplay = (tables) => {
    if (!Array.isArray(tables) || tables.length === 0) return null;
    const parts = tables.map((tb) => tb.tableCode ?? tb.tableNumber ?? tb.code ?? tb.name).filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  };

  const getStatusDisplay = (status) => {
    const str = String(status ?? '').trim();
    const num = Number(status);

    if (str === 'Pending') return { text: 'Chờ xác nhận', class: 'Waiting' };
    if (str === 'Confirmed') return { text: 'Đã xác nhận', class: 'Confirmed' };
    if (str === 'Seated') return { text: 'Đã đến', class: 'Seated' };
    if (str === 'Cancelled') return { text: 'Đã hủy', class: 'Cancelled' };
    if (str === 'Complete' || str === 'Completed') return { text: 'Hoàn thành', class: 'Completed' };

    if (num === 1) return { text: 'Chờ xác nhận', class: 'Waiting' };
    if (num === 2) return { text: 'Đã xác nhận', class: 'Confirmed' };
    if (num === 3) return { text: 'Đã hủy', class: 'Cancelled' };
    if (num === 4) return { text: 'Đã đến', class: 'Seated' };

    return { text: status ?? 'Chờ xác nhận', class: 'Waiting' };
  };

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const [orderSettled, reservationSettled] = await Promise.allSettled([
        myOrderAPI.getMyOrderHistory(),
        myOrderAPI.getReservations(),
      ]);
      const orderData = orderSettled.status === 'fulfilled' ? orderSettled.value : [];
      const reservationData = reservationSettled.status === 'fulfilled' ? reservationSettled.value : [];
      if (orderSettled.status === 'rejected') console.error('GET /order/history/my:', orderSettled.reason);
      if (reservationSettled.status === 'rejected') console.error('getReservations:', reservationSettled.reason);

      const processedOrders = (orderData || [])
        .map((order) => {
          const effectiveStatus = normalizeOrderEffectiveStatus(order.orderStatus);
          const cust = order.customer || {};
          const displayCustomer =
            order.delivery?.recipientName || cust.fullName || cust.fullname || 'Khách hàng';
          const displayPhone =
            order.delivery?.recipientPhone || cust.phone || order.delivery?.phone || null;
          const displayTable =
            formatTablesDisplay(order.tables) || order.tableNumber || null;

          return {
            ...order,
            itemType: 'order',
            displayId: order.orderCode,
            displayStatus: order.orderStatus,
            displayDate: order.createdAt,
            displayCustomer,
            displayPhone,
            displayGuests: order.numberOfGuests,
            displayTable,
            displayEvent: order.eventName || order.note || '—',
            displayTotal: order.totalAmount,
            typeName: mapOrderTypeLabel(order.orderType),
            rawStatus: order.orderStatus,
            status: order.orderStatus,
            orderCode: order.orderCode,
            createdAt: order.createdAt,
            totalAmount: order.totalAmount,
            items: order.items || order.orderItems || [],
            effectiveStatus,
          };
        })
        .filter((o) => isDeliveryOrder(o) && o.effectiveStatus);

      const processedReservations = (reservationData || []).map((res) => {
        const effectiveStatus = normalizeReservationEffective(res);
        const statusRaw = res.status ?? res.reservationStatus ?? 1;
        return {
          ...res,
          itemType: 'reservation',
          displayId: res.reservationCode,
          displayStatus: statusRaw,
          displayDate: res.reservationDate,
          displayCustomer: res.fullname || res.customerName || '—',
          displayPhone: res.phone || '—',
          displayGuests: res.numberOfGuests,
          displayTable: res.tableNumber || res.tableCode || '—',
          displayEvent: res.specialRequests || '—',
          displayTotal: 0,
          typeName: 'Đặt bàn ăn',
          effectiveStatus,
        };
      });

      setOrders(processedOrders);
      setReservations(processedReservations);
    } catch (err) {
      console.error('Lỗi khi lấy lịch sử:', err);
      setOrders([]);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, listType]);

  const baseList = listType === 'reservation' ? reservations : orders;

  const filteredHistory = baseList
    .filter((item) => {
      if (listType === 'reservation') {
        if (activeTab === 'seated') return item.effectiveStatus === 'Seated';
        if (activeTab === 'res-cancelled') return item.effectiveStatus === 'Cancelled';
        return true;
      }
      if (activeTab === 'all-order') return true;
      if (activeTab === 'completed') return item.effectiveStatus === 'Completed';
      if (activeTab === 'cancelled') return item.effectiveStatus === 'Cancelled';
      return true;
    })
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      return item.displayId?.toLowerCase().includes(searchQuery.toLowerCase().trim());
    });

  const totalItems = filteredHistory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  const paginationUnit = listType === 'reservation' ? 'đặt chỗ' : 'đơn hàng';

  const emptyMessage = () => {
    if (listType === 'reservation') {
      if (activeTab === 'seated') return 'Không có lịch đặt chỗ nào đã đến.';
      if (activeTab === 'res-cancelled') return 'Không có lịch đặt chỗ nào bị hủy.';
      return 'Không có lịch đặt chỗ nào.';
    }
    if (activeTab === 'completed') return 'Không có đơn giao hàng nào hoàn thành.';
    if (activeTab === 'cancelled') return 'Không có đơn giao hàng nào bị hủy.';
    return 'Không có đơn giao hàng (giao tận nơi) hoàn thành hoặc đã hủy.';
  };

  return (
    <div className="Order-History-Page">
      <h1 className="Page-Title">Lịch sử đơn hàng</h1>

      <div className="Order-Search-Bar">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          type="text"
          placeholder="Tìm theo mã giao dịch..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
        />
        {searchQuery && (
          <button type="button" className="Search-Clear-Btn" onClick={() => setSearchQuery('')}>
            <i className="fa-solid fa-times"></i>
          </button>
        )}
      </div>

      <div className="Order-Tabs-Container Order-Type-Tabs">
        <button
          type="button"
          className={`Order-Tab-Btn ${listType === 'order' ? 'Active' : ''}`}
          onClick={() => {
            setListType('order');
            setActiveTab('all-order');
            setCurrentPage(1);
          }}
        >
          <i className="fa-solid fa-box"></i> Đơn hàng
        </button>
        <button
          type="button"
          className={`Order-Tab-Btn ${listType === 'reservation' ? 'Active' : ''}`}
          onClick={() => {
            setListType('reservation');
            setActiveTab('seated');
            setCurrentPage(1);
          }}
        >
          <i className="fa-solid fa-utensils"></i> Đặt chỗ
        </button>
      </div>

      <div className="Order-Tabs-Container Order-Status-Tabs">
        {currentTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`Order-Tab-Btn ${activeTab === tab.id ? 'Active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="Orders-List-Container">
        {loading ? (
          <div className="Loading-State">
            <div className="Spinner"></div>
          </div>
        ) : paginatedHistory.length === 0 ? (
          <div className="Empty-Box">{emptyMessage()}</div>
        ) : (
          paginatedHistory.map((item) => {
            const status = getStatusDisplay(item.effectiveStatus || item.displayStatus);
            const formattedDate = item.displayDate ? fmtVNDate(toVietnamTime(item.displayDate)) : '—';
            const rowKey =
              item.itemType === 'order'
                ? `order-${item.orderId ?? item.displayId}`
                : `res-${item.displayId}`;

            return (
              <div key={rowKey} className="Order-Horizontal-Card">
                <div className="Card-Top-Row">
                  <div className="Type-Header">
                    <div className="Type-Icon-Wrap">
                      <i className={getIconForType(item.typeName)}></i>
                    </div>
                    <div className="Type-Text">
                      <strong>{item.typeName}</strong>
                      <small className="Order-Code-Tag">Mã giao dịch #{item.displayId}</small>
                    </div>
                  </div>
                  <div className="Right-Action-Header">
                    <div className={`Status-Label ${status.class}`}>{status.text}</div>
                    {item.itemType === 'order' && (
                      <button type="button" className="Btn-View-Detail" onClick={() => setSelectedOrder(item)}>
                        Chi tiết
                      </button>
                    )}
                  </div>
                </div>

                <div className="Card-Main-Grid">
                  <div className="Grid-Col">
                    <p>
                      <span className="Grid-Label">NGƯỜI ĐẶT</span>
                      <br />
                      <span className="Grid-Value">{item.displayCustomer}</span>
                    </p>
                    <p>
                      <span className="Grid-Label">LIÊN HỆ</span>
                      <br />
                      <span className="Grid-Value">{item.displayPhone || '—'}</span>
                    </p>
                  </div>
                  <div className="Grid-Col">
                    <p>
                      <span className="Grid-Label">SỐ NGƯỜI</span>
                      <br />
                      <span className="Grid-Value">{item.displayGuests != null ? `${item.displayGuests} người` : '—'}</span>
                    </p>
                    <p>
                      <span className="Grid-Label">ĐẶT NGÀY</span>
                      <br />
                      <span className="Grid-Value">{formattedDate}</span>
                    </p>
                  </div>
                  <div className="Grid-Col">
                    <p>
                      <span className="Grid-Label">SỐ BÀN</span>
                      <br />
                      <span className="Grid-Value">{item.displayTable || '—'}</span>
                    </p>
                    <p>
                      <span className="Grid-Label">SỰ KIỆN</span>
                      <br />
                      <span className="Grid-Value">{item.displayEvent || '—'}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && filteredHistory.length > 0 && (
        <div className="Order-History-Pagination">
          <p className="Pagination-Info">
            Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredHistory.length)} của{' '}
            {filteredHistory.length} {paginationUnit}
          </p>
          <div className="Pagination-Controls">
            <button
              type="button"
              className="Page-Nav-Btn"
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
                    className={`Page-Number ${currentPage === page ? 'Active' : ''}`}
                    onClick={() => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    {page}
                  </button>
                );
              }
              if (page === 4) return <span key="ellipsis" className="Page-Ellipsis">...</span>;
              return null;
            })}
            <button
              type="button"
              className="Page-Nav-Btn"
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}

      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
};

export default OrderHistory;
