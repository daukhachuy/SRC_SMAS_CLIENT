import React, { useState, useEffect } from 'react';
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

/**
 * Đơn Pending quá 2 tiếng chưa xác nhận → tự đánh Cancelled.
 */
const applyAutoCancel = (item) => {
  const raw = item.displayStatus || item.status || item.orderStatus || '';
  if (raw !== 'Pending') return item;
  const createdAt = item.displayDate || item.createdAt || item.reservationDate || null;
  if (!createdAt) return item;
  const created = toVietnamTime(createdAt);
  if (!created) return item;
  const diffMs = new Date() - created;
  if (diffMs > 2 * 60 * 60 * 1000) {
    return { ...item, effectiveStatus: 'Cancelled', autoCancelled: true };
  }
  return { ...item, effectiveStatus: 'Pending', autoCancelled: false };
};

const OrderHistory = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'completed', label: 'Hoàn thành' },
    { id: 'cancelled', label: 'Đã hủy' }
  ];

  const getIconForType = (typeName) => {
    if (typeName?.includes('sự kiện')) return 'fa-solid fa-carrot';
    if (typeName?.includes('bàn ăn')) return 'fa-solid fa-utensils';
    if (typeName?.includes('buffet')) return 'fa-solid fa-calendar-xmark';
    return 'fa-solid fa-calendar-star';
  };

  const getStatusDisplay = (status) => {
    const config = {
      'Pending': { text: 'Chờ xác nhận', class: 'Waiting' },
      'Confirmed': { text: 'Đã xác nhận', class: 'Success' },
      'Processing': { text: 'Đang xử lý', class: 'Processing' },
      'Completed': { text: 'Hoàn thành', class: 'Success' },
      'Cancelled': { text: 'Đã hủy', class: 'Cancelled' }
    };
    return config[status] || { text: status || 'Chờ xác nhận', class: 'Waiting' };
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [orderData, reservationData] = await Promise.all([
        myOrderAPI.getOrders('All', ['Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled']),
        myOrderAPI.getReservations()
      ]);

      const processedOrders = (orderData || []).map(order => ({
        ...order,
        itemType: 'order',
        displayId: order.orderCode,
        displayStatus: order.orderStatus,
        displayDate: order.createdAt,
        displayCustomer: order.delivery?.recipientName || order.customer?.fullname || 'Khách hàng',
        displayPhone: order.delivery?.recipientPhone || order.customer?.phone,
        displayGuests: order.numberOfGuests,
        displayTable: order.tableNumber,
        displayEvent: order.eventName,
        displayTotal: order.totalAmount,
        typeName: order.orderType === 'Delivery' ? 'Giao hàng' :
                   order.orderType === 'Event' ? 'Đặt sự kiện tại cửa hàng' : 'Đặt chỗ',
        rawStatus: order.orderStatus,
      }));

      const processedReservations = (reservationData || []).map(res => ({
        ...res,
        itemType: 'reservation',
        displayId: res.reservationCode,
        displayStatus: res.status,
        displayDate: res.reservationDate,
        displayCustomer: res.fullname,
        displayPhone: res.phone,
        displayGuests: res.numberOfGuests,
        displayTable: res.tableNumber || '—',
        displayEvent: res.specialRequests || '—',
        displayTotal: 0,
        typeName: 'Đặt bàn ăn',
        rawStatus: res.status,
      }));

      setOrders(processedOrders);
      setReservations(processedReservations);
    } catch (err) {
      console.error('Lỗi khi lấy lịch sử đơn hàng:', err);
      setOrders([]);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchHistory();
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const allHistory = [...orders, ...reservations].map(applyAutoCancel);

  const filteredHistory = allHistory.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'completed') return item.effectiveStatus === 'Completed';
    if (activeTab === 'cancelled') return item.effectiveStatus === 'Cancelled';
    return true;
  }).filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return item.displayId?.toLowerCase().includes(query);
  });

  const totalItems = filteredHistory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredHistory.length);
  const paginatedHistory = filteredHistory.slice(startIndex, endIndex);

  return (
    <div className="Order-History-Page">
      <h1 className="Page-Title">Lịch sử đơn hàng</h1>

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
            {tab.label}
          </button>
        ))}
      </div>

      <div className="Orders-List-Container">
        {loading ? (
          <div className="Loading-State"><div className="Spinner"></div></div>
        ) : paginatedHistory.length === 0 ? (
          <div className="Empty-Box">Bạn chưa có đơn hàng nào.</div>
        ) : (
          paginatedHistory.map(item => {
            const status = getStatusDisplay(item.effectiveStatus || item.displayStatus);
            const formattedDate = item.displayDate ? fmtVNDate(toVietnamTime(item.displayDate)) : '—';
            
            return (
              <div key={item.displayId} className="Order-Horizontal-Card">
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
                      <button className="Btn-View-Detail" onClick={() => setSelectedOrder(item)}>
                        Chi tiết
                      </button>
                    )}
                  </div>
                </div>

                <div className="Card-Main-Grid">
                  <div className="Grid-Col">
                    <p><span className="Grid-Label">NGƯỜI ĐẶT</span><br /><span className="Grid-Value">{item.displayCustomer}</span></p>
                    <p><span className="Grid-Label">LIÊN HỆ</span><br /><span className="Grid-Value">{item.displayPhone || '—'}</span></p>
                  </div>
                  <div className="Grid-Col">
                    <p><span className="Grid-Label">SỐ NGƯỜI</span><br /><span className="Grid-Value">{item.displayGuests || '—'} người</span></p>
                    <p><span className="Grid-Label">ĐẶT NGÀY</span><br /><span className="Grid-Value">{formattedDate}</span></p>
                  </div>
                  <div className="Grid-Col">
                    <p><span className="Grid-Label">SỐ BÀN</span><br /><span className="Grid-Value">{item.displayTable || '—'}</span></p>
                    <p><span className="Grid-Label">SỰ KIỆN</span><br /><span className="Grid-Value">{item.displayEvent || '—'}</span></p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && filteredHistory.length > 0 && (
        <div className="Order-History-Pagination">
          <p className="Pagination-Info">Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredHistory.length)} của {filteredHistory.length} đơn hàng</p>
          <div className="Pagination-Controls">
            <button
              type="button"
              className="Page-Nav-Btn"
              disabled={currentPage === 1}
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
                    className={`Page-Number ${currentPage === page ? 'Active' : ''}`}
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
              disabled={currentPage === totalPages}
              onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
};

export default OrderHistory;
