import React, { useState, useEffect } from 'react';
import { myOrderAPI } from '../api/myOrderApi';
import OrderDetailModal from './OrderDetailModal';
import '../styles/OrderHistory.css';

const MyOrders = () => {
  const [activeTab, setActiveTab] = useState('Delivery');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'Delivery', label: 'GIAO HÀNG', icon: 'fa-truck' },
    { id: 'Booking', label: 'ĐẶT CHỖ', icon: 'fa-utensils' },
    { id: 'Event', label: 'SỰ KIỆN', icon: 'fa-calendar-star' }
  ];

  const [reservations, setReservations] = useState([]);

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

  const fetchOrders = async () => {
    setLoading(true);
    try {
      if (activeTab === 'Booking') {
        const data = await myOrderAPI.getReservations();
        setReservations(Array.isArray(data) ? data : []);
        setOrders([]);
      } else {
        const statuses = ['Pending', 'Confirmed', 'Processing', 'Completed'];
        const data = await myOrderAPI.getOrders(activeTab, statuses);
        setOrders(data || []);
        setReservations([]);
      }
    } catch (err) {
      setOrders([]);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); setCurrentPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }, [activeTab]);

  const listData = (activeTab === 'Booking' ? reservations : orders).filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const orderCode = item.orderCode || item.reservationCode || '';
    return orderCode.toLowerCase().includes(query);
  });
  const totalPages = Math.ceil(listData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedList = listData.slice(startIndex, endIndex);

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

      <div className="Orders-List-Flow">
        {loading ? (
          <div className="Spinner-Wrapper"><div className="Spinner"></div><p>Đang tải dữ liệu...</p></div>
        ) : activeTab === 'Booking' ? (
          listData.length > 0 ? (
            paginatedList.map((res) => {
              const status = getStatusDisplay(res.status);
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
                      <div className={`Status-Label ${status.class}`}>{status.text}</div>
                    </div>
                  </div>
                  <div className="Card-Main-Grid">
                    <div className="Grid-Col">
                      <p>NGƯỜI ĐẶT: <span>{res.fullname}</span></p>
                      <p>ĐIỆN THOẠI: <span>{res.phone}</span></p>
                    </div>
                    <div className="Grid-Col">
                      <p>NGÀY ĐẶT: <span>{res.reservationDate}</span></p>
                      <p>GIỜ: <span>{res.reservationTime}</span></p>
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
            })
          ) : (
            <div className="Empty-Box">Bạn chưa có đặt bàn nào.</div>
          )
        ) : listData.length > 0 ? (
          paginatedList.map((order) => {
            const status = getStatusDisplay(order.orderStatus);
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
                    <div className={`Status-Label ${status.class}`}>{status.text}</div>
                    <button className="Btn-View-Detail" onClick={() => { setSelectedOrder(order); setShowModal(true); }}>
                      CHI TIẾT
                    </button>
                  </div>
                </div>

                <div className="Card-Main-Grid">
                  <div className="Grid-Col">
                    <p>NGƯỜI NHẬN: <span>{order.delivery?.recipientName || order.customer?.fullname}</span></p>
                    <p>ĐIỆN THOẠI: <span>{order.delivery?.recipientPhone || order.customer?.phone}</span></p>
                  </div>
                  <div className="Grid-Col">
                    <p>HÌNH THỨC: <span>{order.paymentMethod || 'Tiền mặt'}</span></p>
                    <p>THỜI GIAN: <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span></p>
                  </div>
                  <div className="Grid-Col Total-Col">
                    <p>TỔNG THANH TOÁN</p>
                    <h2 className="Price-Text">{order.totalAmount?.toLocaleString()} đ</h2>
                  </div>
                </div>

                <div className="Card-Bottom-Address">
                  <i className="fa-solid fa-location-dot"></i>
                  <span>ĐỊA CHỈ: {order.delivery?.address || "Nhận tại cửa hàng"}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="Empty-Box">Không tìm thấy đơn hàng nào trong mục này.</div>
        )}
      </div>

      {listData.length > 0 && (
        <div className="Order-History-Pagination">
          <p className="Pagination-Info">Hiển thị {startIndex + 1}-{Math.min(startIndex + itemsPerPage, listData.length)} của {listData.length} {activeTab === 'Booking' ? 'đặt bàn' : 'đơn hàng'}</p>
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

      {showModal && <OrderDetailModal order={selectedOrder} onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default MyOrders;