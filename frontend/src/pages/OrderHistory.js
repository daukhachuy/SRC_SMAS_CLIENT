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

/** Đơn hàng giao hàng (lịch sử): chỉ Completed / Cancelled — chuẩn hóa không phân biệt hoa thường */
const normalizeOrderEffectiveStatus = (orderStatus) => {
  if (orderStatus === null || orderStatus === undefined || orderStatus === '') return null;
  const s = String(orderStatus).trim().toLowerCase();
  if (s === 'completed' || s === 'complete') return 'Completed';
  if (s === 'cancelled' || s === 'cancel' || s === 'canceled') return 'Cancelled';
  return null;
};

/** Lấy trạng thái đơn từ nhiều khả năng tên field (backend / serializer) */
const pickOrderStatusRaw = (order) =>
  order?.orderStatus ?? order?.status ?? order?.Status ?? order?.order_state;

const isDeliveryOrder = (order) =>
  String(order?.orderType ?? order?.OrderType ?? '')
    .trim()
    .toLowerCase() === 'delivery';

const OrderHistory = () => {
  const [activeTab, setActiveTab] = useState('all-order');
  const [orders, setOrders] = useState([]);
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
    const u = t.toLowerCase();
    if (u === 'dinein') return 'Đặt bàn / Tại chỗ';
    if (u === 'takeaway') return 'Mang đi';
    if (u === 'delivery') return 'Giao hàng';
    if (u === 'eventbooking' || u === 'event') return 'Đặt sự kiện tại cửa hàng';
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
      const res = await myOrderAPI.getMyOrderHistory();
      console.log('[OrderHistory] raw orderData:', res);
      console.log('[OrderHistory] total items:', Array.isArray(res) ? res.length : 'not array');
      if (Array.isArray(res) && res.length > 0) {
        console.log('[OrderHistory] first item keys:', Object.keys(res[0]));
        console.log('[OrderHistory] first item:', JSON.stringify(res[0]));
      }
      const orderData = Array.isArray(res) ? res : [];

          const processedOrders = orderData
        .map((order) => {
          const statusRaw = pickOrderStatusRaw(order);
          const effectiveStatus = normalizeOrderEffectiveStatus(statusRaw);
          const cust = order.customer || {};
          const displayCustomer =
            order.delivery?.recipientName ||
            cust.fullName ||
            cust.fullname ||
            cust.FullName ||
            'Khách hàng';
          const displayPhone =
            order.delivery?.recipientPhone || cust.phone || order.delivery?.phone || null;
          const displayTable =
            formatTablesDisplay(order.tables) || order.tableNumber || null;
          const orderTypeRaw = String(order.orderType ?? order.OrderType ?? '').trim();
          const orderTypeNorm = orderTypeRaw.toLowerCase();
          const isEventBookingOrder =
            orderTypeNorm === 'eventbooking' || orderTypeNorm === 'event';

            return {
            ...order,
            orderId: order.orderId ?? order.OrderId,
            itemType: 'order',
            displayId: order.orderCode ?? order.OrderCode,
            displayStatus: statusRaw,
            displayDate: order.createdAt ?? order.CreatedAt,
            displayCustomer,
            displayPhone,
            displayGuests: order.numberOfGuests,
            isEventBookingOrder,
            displayTable,
            displayEvent: order.eventName || order.note || '—',
            displayTotal: order.totalAmount,
            typeName: mapOrderTypeLabel(order.orderType ?? order.OrderType),
            rawStatus: statusRaw,
            status: statusRaw,
            orderCode: order.orderCode ?? order.OrderCode,
            createdAt: order.createdAt ?? order.CreatedAt,
            totalAmount: order.totalAmount,
            items: order.items || order.orderItems || [],
            effectiveStatus,
          };
        })
        .filter((o) => o.effectiveStatus != null);

      console.log('[OrderHistory] processedOrders (effectiveStatus != null):', processedOrders.length, processedOrders.map(o => ({ orderCode: o.orderCode, status: o.rawStatus, effectiveStatus: o.effectiveStatus })));

      setOrders(processedOrders);
    } catch (err) {
      console.error('Lỗi khi lấy lịch sử:', err);
      setOrders([]);
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
  }, [activeTab]);

  const filteredHistory = orders
    .filter((item) => {
      if (activeTab === 'all-order') return true;
      if (activeTab === 'completed') return item.effectiveStatus === 'Completed';
      if (activeTab === 'cancelled') return item.effectiveStatus === 'Cancelled';
      return true;
    })
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      return item.displayId?.toLowerCase().includes(searchQuery.toLowerCase().trim());
    });

  console.log('[OrderHistory] orders state count:', orders.length);
  console.log('[OrderHistory] activeTab:', activeTab);
  console.log('[OrderHistory] filteredHistory count:', filteredHistory.length);

  const totalItems = filteredHistory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  const paginationUnit = 'đơn hàng';

  const emptyMessage = () => {
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

      <div className="Order-Tabs-Container Order-Status-Tabs">
        {orderTabs.map((tab) => (
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
                      <span className="Grid-Label">{item.isEventBookingOrder ? 'SỐ BÀN' : 'SỐ NGƯỜI'}</span>
                      <br />
                      <span className="Grid-Value">
                        {item.displayGuests != null
                          ? `${item.displayGuests} ${item.isEventBookingOrder ? 'bàn' : 'người'}`
                          : '—'}
                      </span>
                    </p>
                    <p>
                      <span className="Grid-Label">ĐẶT NGÀY</span>
                      <br />
                      <span className="Grid-Value">{formattedDate}</span>
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
