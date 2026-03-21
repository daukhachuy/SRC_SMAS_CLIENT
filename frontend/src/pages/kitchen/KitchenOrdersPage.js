import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  PlayCircle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import {
  fetchPendingOrderItems,
  patchOrderItemPreparing,
  patchOrderItemReady,
  postOrderItemCancel,
  patchOrderAllPreparing,
  patchOrderAllReady,
  fetchOrderItemsHistoryToday
} from './kitchenApi';
import { formatCurrency } from '../../api/managerApi';

/** Map GET /api/order-items/pending → UI model */
function mapPendingOrderToUI(raw) {
  const created = raw.orderCreatedAt ? new Date(raw.orderCreatedAt) : null;
  const waitMs = created && !Number.isNaN(created.getTime())
    ? Date.now() - created.getTime()
    : 0;
  const waitMinutes = Math.max(0, Math.floor(waitMs / 60000));

  let status = 'normal';
  if (waitMinutes >= 15) status = 'overdue';
  else if (waitMinutes < 5) status = 'new';

  const tableLabel =
    raw.tableId > 0
      ? `BÀN ${String(raw.tableId).padStart(2, '0')}`
      : 'Mang về / Tại quầy';

  const pending = raw.pendingItems || [];
  const items = pending.map((pi) => ({
    id: pi.orderItemId,
    orderItemId: pi.orderItemId,
    foodId: pi.foodId,
    name: pi.itemName,
    quantity: pi.quantity,
    note: pi.note,
    status: 'pending',
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const loadOrders = useCallback(async (options = {}) => {
    const silent = options.silent === true;
    setError('');
    if (!silent) setLoading(true);
    try {
      const list = await fetchPendingOrderItems();
      const mapped = (Array.isArray(list) ? list : []).map(mapPendingOrderToUI);
      setOrders(mapped);
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.message ||
          e?.message ||
          'Không tải được danh sách món chờ. Kiểm tra đăng nhập (Bearer token) và quyền bếp.'
      );
      setOrders([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const stats = useMemo(() => {
    let overdueOrders = 0;
    let pendingDishes = 0;
    let cookingDishes = 0;
    orders.forEach((o) => {
      if (o.status === 'overdue') overdueOrders += 1;
      (o.items || []).forEach((i) => {
        if (i.status === 'pending') pendingDishes += 1;
        if (i.status === 'preparing' || i.status === 'cooking') cookingDishes += 1;
      });
    });
    return { overdueOrders, pendingDishes, cookingDishes };
  }, [orders]);

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
      await loadOrders({ silent: true });
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || 'Hủy món thất bại.';
      alert(msg);
    } finally {
      setCancelSubmitting(false);
    }
  };

  /** PATCH preparing thành công: giữ món trên UI, chỉ đổi trạng thái (không gọi lại GET pending — tránh món biến mất) */
  const handleItemPreparing = async (orderItemId) => {
    setItemBusyId(orderItemId);
    setError('');
    try {
      await patchOrderItemPreparing(orderItemId);
      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          items: (order.items || []).map((it) =>
            it.orderItemId === orderItemId || it.id === orderItemId
              ? { ...it, status: 'preparing' }
              : it
          )
        }))
      );
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
      setOrders((prev) =>
        prev
          .map((order) => ({
            ...order,
            items: (order.items || []).filter(
              (it) => it.orderItemId !== orderItemId && it.id !== orderItemId
            )
          }))
          .filter((order) => (order.items || []).length > 0)
      );
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Không đánh dấu đã xong món.');
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
      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId
            ? {
                ...order,
                items: (order.items || []).map((it) =>
                  it.status === 'pending' ? { ...it, status: 'preparing' } : it
                )
              }
            : order
        )
      );
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

  const getOrderCardClass = (status) => {
    return `kds-order-card ${status === 'overdue' ? 'overdue' : ''}`;
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'cooking' || status === 'preparing') return 'cooking';
    if (status === 'pending') return 'pending';
    return '';
  };

  const getWaitTimeClass = (status) => {
    if (status === 'overdue') return 'overdue';
    if (status === 'new') return 'new';
    return 'normal';
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
          <button
            type="button"
            className="kds-refresh-btn"
            onClick={loadOrders}
            disabled={loading}
            title="Tải lại danh sách"
          >
            <RefreshCw size={20} className={loading ? 'kds-spin' : ''} />
            <span>{loading ? 'Đang tải...' : 'Tải lại'}</span>
          </button>
          <div className="kds-time">
            <Clock size={20} />
            <span>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="kds-api-error" role="alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <main className="kds-orders-grid">
        {loading && orders.length === 0 ? (
          <p className="kds-loading-msg">Đang tải đơn chờ chế biến...</p>
        ) : !loading && orders.length === 0 && !error ? (
          <p className="kds-empty-msg">Chưa có món nào chờ chế biến.</p>
        ) : null}
        {orders.map((order) => {
          const hasPendingItems = (order.items || []).some((i) => i.status === 'pending');
          return (
          <div key={order.orderId ?? order.id} className={getOrderCardClass(order.status)}>
            <div className={`kds-order-header ${order.status === 'overdue' ? 'overdue' : ''}`}>
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
              <div className={`kds-wait-time ${getWaitTimeClass(order.status)}`}>
                <Clock size={16} />
                {order.status === 'new' 
                  ? `MỚI NHẬN - ${order.waitTime} PHÚT`
                  : order.status === 'overdue'
                  ? `ĐÃ CHỜ ${order.waitTime} PHÚT`
                  : `ĐÃ CHỜ ${order.waitTime} PHÚT`
                }
              </div>

              {order.note && (
                <div className="kds-order-note warning">
                  <p className="note-label">Ghi chú</p>
                  <p className="note-content">{order.note}</p>
                </div>
              )}

              <div className="kds-items-list">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className={`kds-item ${item.status === 'preparing' ? 'cooking' : item.status}`}
                  >
                    <div className="kds-item-info">
                      <span className="kds-item-qty">{item.quantity}x</span>
                      <div>
                        <p className="kds-item-name">{item.name}</p>
                        {item.note && (
                          <p className="kds-item-note">{item.note}</p>
                        )}
                      </div>
                    </div>
                    <div className="kds-item-actions">
                      <span className={`kds-status-badge ${getStatusBadgeClass(item.status)}`}>
                        {item.status === 'preparing' || item.status === 'cooking'
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
                ))}
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
