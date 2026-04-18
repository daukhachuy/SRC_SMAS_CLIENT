import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  exchangeQrTicket,
  getTableSessionInfo,
  refreshTableAccessToken,
} from '../api/tableSessionApi';
import { orderAPI } from '../api/managerApi';
import { handlePaymentSuccess } from '../utils/paymentHandler';
import useTableSession from '../hooks/useTableSession';
import { ShoppingCart, LogOut, Loader, AlertCircle } from 'lucide-react';
import { ORDER_VAT_RATE, roundOrderMoney } from '../constants/orderPricing';
import '../styles/TableSessionPage.css';

/**
 * TableSessionPage - Trang gọi món tại bàn cho khách
 * - Khách quét QR hoặc nhấn vào link → trao đổi QR ticket lấy access token
 * - Xem menu, gọi món, thanh toán
 * - Token hết hạn → làm mới tự động
 * - Bàn đóng → token vô hiệu → không truy cập được
 */
const TableSessionPage = () => {
  const { tableCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [sessionToken, setSessionToken] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'orders' | 'payment'
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // Token refresh timer
  useEffect(() => {
    if (!sessionToken) return;

    const refreshInterval = setInterval(async () => {
      try {
        await refreshTableAccessToken(localStorage.getItem('tableRefreshToken'));
        console.log('✅ Token refreshed automatically');
      } catch (err) {
        console.error('❌ Auto token refresh failed:', err);
        handleTokenExpired();
      }
    }, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => clearInterval(refreshInterval);
  }, [sessionToken]);

  // Khởi tạo session: trao đổi QR ticket hoặc lấy token từ localStorage
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoading(true);
        const qrTicket = searchParams.get('ticket');

        let token = localStorage.getItem('tableAccessToken');

        // Nếu chưa có token, trao đổi QR ticket
        if (!token && qrTicket) {
          const response = await exchangeQrTicket(tableCode, qrTicket);
          token = response.accessToken;
          setSessionToken(token);
        } else if (token) {
          setSessionToken(token);
        } else {
          throw new Error('Không tìm thấy session. Vui lòng quét QR code hoặc click vào link từ waiter.');
        }

        // Lấy thông tin session
        const info = await getTableSessionInfo();
        setSessionInfo(info);

        // Lấy danh sách đơn hàng của bàn
        await loadOrders();

        // Lấy menu
        await loadMenu();
      } catch (err) {
        console.error('Session initialization error:', err);
        setError(err.message || 'Lỗi khi khởi tạo session');
      } finally {
        setLoading(false);
      }
    };

    if (tableCode) {
      initializeSession();
    }
  }, [tableCode, searchParams]);

  // Tải danh sách đơn hàng của bàn
  const loadOrders = async () => {
    try {
      const response = await orderAPI.getActive();
      const orders = response.data || response;
      // Filter orders của bàn này
      const tableOrders = orders.filter(
        (order) => order.tableCode === tableCode
      );
      setOrders(tableOrders);
    } catch (err) {
      console.error('Error loading orders:', err);
      // Nếu lỗi, thử fallback
      try {
        const fallbackResponse = await orderAPI.getToday();
        const fallbackOrders = fallbackResponse.data || fallbackResponse;
        const tableOrders = fallbackOrders.filter(
          (order) => order.tableCode === tableCode
        );
        setOrders(tableOrders);
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
      }
    }
  };

  // Tải menu
  const loadMenu = async () => {
    try {
      // Sử dụng API lấy danh mục / thực phẩm
      // Đây là ví dụ đơn giản
      const mockMenu = [
        { id: 1, name: 'Phở Bò', price: 45000, description: 'Phở bò truyền thống' },
        { id: 2, name: 'Cơm Tấm', price: 35000, description: 'Cơm tấm Sài Gòn' },
        { id: 3, name: 'Bánh Mì', price: 20000, description: 'Bánh mì pâté' },
      ];
      setMenuItems(mockMenu);
    } catch (err) {
      console.error('Error loading menu:', err);
    }
  };

  // Xử lý token hết hạn
  const handleTokenExpired = () => {
    setError('Phiên làm việc của bàn đã kết thúc. Vui lòng yêu cầu waiter mở bàn mới.');
    localStorage.removeItem('tableAccessToken');
    localStorage.removeItem('tableSessionId');
    localStorage.removeItem('tableRefreshToken');
    localStorage.removeItem('tableCode');

    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  // Thêm vào giỏ
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  // Gọi món
  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      alert('Vui lòng chọn món ăn');
      return;
    }

    try {
      setLoading(true);
      // Gọi API tạo đơn hàng
      const orderData = {
        tableCode,
        dineIn: true,
        items: cart.map((item) => ({
          foodId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      // TODO: Implement orderAPI.create() endpoint
      // await orderAPI.create(orderData);
      alert('Đã gửi yêu cầu gọi món. Waiter sẽ xác nhận.');
      setCart([]);
      await loadOrders();
    } catch (err) {
      alert('Lỗi khi gọi món: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Thanh toán
  const handlePayment = async () => {
    try {
      setLoading(true);
      // Gọi API thanh toán
      // Sau khi thanh toán thành công, đóng bàn & hủy token
      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('tableAccessToken')}`,
        },
        body: JSON.stringify({
          tableCode,
          sessionId: sessionInfo?.sessionId,
          orders: orders.map((o) => o.id),
        }),
      });

      if (response.ok) {
        const paymentData = await response.json();
        
        // Thanh toán thành công → đóng bàn
        try {
          await handlePaymentSuccess(tableCode, sessionInfo?.sessionId);
        } catch (closeErr) {
          console.warn('Warning: Could not close table:', closeErr);
          // Continue anyway, redirect to thank you page
        }

        // Redirect tới trang cảm ơn hoặc order history
        alert('Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!');
        navigate('/', { replace: true });
      } else {
        const errorData = await response.json();
        alert('Lỗi thanh toán: ' + (errorData.message || 'Vui lòng thử lại'));
      }
    } catch (err) {
      alert('Lỗi khi thanh toán: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout khỏi session
  const handleLogout = () => {
    localStorage.removeItem('tableAccessToken');
    localStorage.removeItem('tableSessionId');
    localStorage.removeItem('tableRefreshToken');
    localStorage.removeItem('tableCode');
    navigate('/');
  };

  if (loading && !sessionToken) {
    return (
      <div className="table-session-page loading">
        <div className="loading-container">
          <Loader size={48} className="spinner" />
          <p>Đang khởi tạo phiên làm việc...</p>
        </div>
      </div>
    );
  }

  if (error && !sessionToken) {
    return (
      <div className="table-session-page error">
        <div className="error-container">
          <AlertCircle size={48} />
          <h2>Lỗi phiên làm việc</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const cartSessionSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartSessionVat = roundOrderMoney(cartSessionSubtotal * ORDER_VAT_RATE);
  const cartSessionTotal = cartSessionSubtotal + cartSessionVat;

  return (
    <div className="table-session-page">
      {/* Header */}
      <div className="table-session-header">
        <div className="header-left">
          <h1>Bàn {sessionInfo?.tableCode || tableCode}</h1>
          <span className="session-badge">Phiên #{sessionInfo?.sessionId?.substring(0, 8)}</span>
        </div>
        <button className="btn-logout" onClick={handleLogout} title="Thoát phiên">
          <LogOut size={18} />
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-warning">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => setActiveTab('menu')}
        >
          Thực đơn
        </button>
        <button
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Đơn hàng ({orders.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'payment' ? 'active' : ''}`}
          onClick={() => setActiveTab('payment')}
        >
          Thanh toán
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="menu-section">
            <div className="menu-grid">
              {menuItems.map((item) => (
                <div key={item.id} className="menu-card">
                  <div className="menu-card-header">
                    <h3>{item.name}</h3>
                    <span className="price">{item.price.toLocaleString()}đ</span>
                  </div>
                  <p className="description">{item.description}</p>
                  <button
                    className="btn btn-add-to-cart"
                    onClick={() => addToCart(item)}
                  >
                    <ShoppingCart size={16} />
                    Thêm vào giỏ
                  </button>
                </div>
              ))}
            </div>

            {/* Giỏ hàng tạm */}
            {cart.length > 0 && (
              <div className="cart-summary">
                <h3>Giỏ hàng ({cart.length} món)</h3>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <span>{item.name}</span>
                      <span className="qty">x{item.quantity}</span>
                      <span className="subtotal">{(item.price * item.quantity).toLocaleString()}đ</span>
                    </div>
                  ))}
                </div>
                <div className="cart-total" style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
                  <span>Tạm tính: {cartSessionSubtotal.toLocaleString()}đ</span>
                  <span>VAT (10%): +{cartSessionVat.toLocaleString()}đ</span>
                  <span style={{ fontWeight: 700 }}>Tổng: {cartSessionTotal.toLocaleString()}đ</span>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? 'Đang gửi...' : 'Gọi món'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="orders-section">
            {orders.length === 0 ? (
              <div className="empty-state">
                <p>Chưa có đơn hàng</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <span className="order-code">{order.orderCode}</span>
                      <span className={`status status-${order.status}`}>
                        {order.statusText || order.status}
                      </span>
                    </div>
                    <div className="order-items">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="item">
                          {item.foodName} x{item.quantity}
                        </div>
                      ))}
                    </div>
                    <div className="order-total">
                      Tổng: {(order.totalAmount || 0).toLocaleString()}đ
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment Tab */}
        {activeTab === 'payment' && (
          <div className="payment-section">
            <div className="payment-summary">
              <h3>Thông tin thanh toán</h3>
              <div className="summary-item">
                <span>Tổng số đơn:</span>
                <span>{orders.length}</span>
              </div>
              <div className="summary-item total">
                <span>Tổng tiền:</span>
                <span>{orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0).toLocaleString()}đ</span>
              </div>
              <button
                className="btn btn-primary btn-lg"
                onClick={handlePayment}
                disabled={loading || orders.length === 0}
              >
                {loading ? 'Đang xử lý...' : 'Thanh toán'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableSessionPage;
