import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Search,
  Plus,
  Users,
  CheckCircle,
  AlertCircle,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
  Utensils,
  X,
  Edit,
  Trash2,
  Info,
  Check,
  XCircle,
  Clock3,
} from 'lucide-react';
import {
  reservationAPI,
  eventBookingAPI,
  mapReservationToUI,
  mapEventToUI,
} from '../../api/managerApi';
import '../../styles/ManagerReservationsPage.css';

const ManagerReservationsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('regular');
  const [searchQuery, setSearchQuery] = useState('');
  const currentPage = 1;

  const [regularBookings, setRegularBookings] = useState([]);
  const [eventsData, setEventsData] = useState([]);
  const [totalTodayBookings, setTotalTodayBookings] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [activeTables, setActiveTables] = useState(0);
  const [pendingContracts, setPendingContracts] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [processingCode, setProcessingCode] = useState('');

  const loadReservationData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [listRes, sumTodayRes, waitConfirmRes] = await Promise.allSettled([
        reservationAPI.getAllDescCreatedAt(),
        reservationAPI.getSumToday(),
        reservationAPI.getWaitingConfirm(),
      ]);

      if (listRes.status !== 'fulfilled') {
        const status = listRes.reason?.response?.status;
        const msg = listRes.reason?.response?.data?.message || 'Không tải được danh sách đặt bàn';
        throw new Error(`Lỗi ${status ?? ''} ${msg}`.trim());
      }

      const reservationRaw = Array.isArray(listRes.value.data)
        ? listRes.value.data
        : listRes.value.data?.data ?? listRes.value.data?.items ?? [];

      const mappedReservations = reservationRaw.map(mapReservationToUI);
      setRegularBookings(mappedReservations);

      const activeDiningCount = mappedReservations.filter((booking) => booking.status === 'dining').length;
      setActiveTables(activeDiningCount);

      if (sumTodayRes.status === 'fulfilled') {
        const sumData = sumTodayRes.value.data;
        const sumValue = typeof sumData === 'number'
          ? sumData
          : sumData?.count ?? sumData?.total ?? sumData?.value ?? 0;
        setTotalTodayBookings(Number(sumValue) || mappedReservations.length);
      } else {
        setTotalTodayBookings(mappedReservations.length);
      }

      if (waitConfirmRes.status === 'fulfilled') {
        const waitData = waitConfirmRes.value.data;
        const waitCount = Array.isArray(waitData)
          ? waitData.length
          : waitData?.count ?? waitData?.total ?? waitData?.value ?? 0;
        setPendingBookings(Number(waitCount) || 0);
      } else {
        setPendingBookings(mappedReservations.filter((booking) => booking.status === 'pending').length);
      }
    } catch (err) {
      console.error('Lỗi tải đặt bàn:', err);
      setError(err.message || 'Không thể tải dữ liệu đặt bàn');
      setRegularBookings([]);
      setTotalTodayBookings(0);
      setPendingBookings(0);
      setActiveTables(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEventsData = useCallback(async () => {
    try {
      const [activeRes, upcomingRes, ascRes, historyRes, pendingContractRes] = await Promise.allSettled([
        eventBookingAPI.getActive(),
        eventBookingAPI.getUpcomingEvents(),
        eventBookingAPI.getAllAscCreatedAt(),
        eventBookingAPI.getHistory(),
        eventBookingAPI.getContractsNeedSigned(),
      ]);

      const extractArray = (payload) => {
        if (Array.isArray(payload)) return payload;
        return payload?.data ?? payload?.items ?? payload?.events ?? payload?.bookEvents ?? [];
      };

      const merged = [];
      const pushIfArray = (result) => {
        if (result.status !== 'fulfilled') return;
        const rows = extractArray(result.value.data);
        if (Array.isArray(rows) && rows.length > 0) merged.push(...rows);
      };

      pushIfArray(activeRes);
      pushIfArray(upcomingRes);
      pushIfArray(ascRes);
      pushIfArray(historyRes);

      // Deduplicate by best available identifier
      const seen = new Set();
      const deduped = merged.filter((item) => {
        const key = item?.bookEventId ?? item?.eventId ?? item?.bookingCode ?? item?.id ?? JSON.stringify(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setEventsData(deduped.map(mapEventToUI));

      if (pendingContractRes.status === 'fulfilled') {
        const data = pendingContractRes.value.data;
        const count = typeof data === 'number' ? data : data?.count ?? data?.total ?? data?.value ?? 0;
        setPendingContracts(Number(count) || 0);
      } else {
        setPendingContracts(0);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu sự kiện:', err);
      setEventsData([]);
      setPendingContracts(0);
    }
  }, []);

  useEffect(() => {
    loadReservationData();
    loadEventsData();
  }, [loadReservationData, loadEventsData]);

  const handleConfirmReservation = async (booking) => {
    if (!booking?.reservationCode) return;
    setProcessingCode(booking.reservationCode);
    try {
      await reservationAPI.confirm(booking.reservationCode);
      await loadReservationData();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Xác nhận đặt bàn thất bại';
      setError(`Lỗi ${status ?? ''} ${msg}`.trim());
    } finally {
      setProcessingCode('');
    }
  };

  const openCancelModal = (booking) => {
    setCancelTarget(booking);
    setCancelReason('');
  };

  const closeCancelModal = () => {
    setCancelTarget(null);
    setCancelReason('');
  };

  const handleCancelReservation = async () => {
    if (!cancelTarget?.reservationCode || !cancelReason.trim()) return;
    setProcessingCode(cancelTarget.reservationCode);
    try {
      await reservationAPI.cancel(cancelTarget.reservationCode);
      closeCancelModal();
      await loadReservationData();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Hủy đặt bàn thất bại';
      setError(`Lỗi ${status ?? ''} ${msg}`.trim());
    } finally {
      setProcessingCode('');
    }
  };

  const filteredRegularBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return regularBookings;
    return regularBookings.filter((booking) => (
      booking.customer.toLowerCase().includes(query)
      || booking.phone.includes(query)
      || String(booking.reservationCode).toLowerCase().includes(query)
    ));
  }, [searchQuery, regularBookings]);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return eventsData;
    return eventsData.filter((event) => (
      event.customer.toLowerCase().includes(query)
      || event.contact.toLowerCase().includes(query)
      || event.phone.includes(query)
      || String(event.bookingCode).toLowerCase().includes(query)
    ));
  }, [searchQuery, eventsData]);

  const upcomingEvents = eventsData.length;
  const urgentCount = pendingContracts;
  const totalRevenue = eventsData.reduce((sum, e) => sum + (Number(e.revenue) || 0), 0);

  const getEventTypeColor = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700',
      purple: 'bg-purple-50 text-purple-700',
      rose: 'bg-rose-50 text-rose-700',
      cyan: 'bg-cyan-50 text-cyan-700',
      green: 'bg-green-50 text-green-700',
      amber: 'bg-amber-50 text-amber-700',
    };
    return colors[color] || colors.blue;
  };

  const getStatusConfig = (status) => {
    const configs = {
      signed: {
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        icon: <CheckCircle size={14} />,
      },
      pending: {
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        icon: <AlertCircle size={14} />,
      },
      deposit: {
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        icon: <AlertCircle size={14} />,
      },
    };
    return configs[status] || configs.pending;
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN').format(amount || 0) + ' đ';

  const getRegularStatusConfig = (status) => {
    const configs = {
      dining: {
        className: 'regular-status dining',
        icon: <Utensils size={14} />,
      },
      pending: {
        className: 'regular-status pending',
        icon: <Clock3 size={14} />,
      },
      confirmed: {
        className: 'regular-status confirmed',
        icon: <CheckCircle size={14} />,
      },
      cancelled: {
        className: 'regular-status cancelled',
        icon: <XCircle size={14} />,
      },
    };
    return configs[status] || configs.pending;
  };

  return (
    <div className="reservations-page-container">
      <header className="reservations-header">
        <div className="header-content">
          <div className="header-text">
            <h2>{activeTab === 'regular' ? 'Quản lý Đặt bàn' : 'Quản lý Sự kiện & Đặt tiệc'}</h2>
            <p>
              {activeTab === 'regular'
                ? 'Theo dõi và điều phối lịch đặt bàn thường nhật tại nhà hàng.'
                : 'Điều phối và quản lý các đơn đặt tiệc quy mô lớn, hội nghị và sự kiện.'}
            </p>
          </div>
          <div className="header-actions">
            <div className="search-box">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder={activeTab === 'regular' ? 'Tìm tên khách hàng/SĐT...' : 'Tìm tên khách hàng/công ty...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="btn-create-event" type="button">
              <Plus size={20} />
              {activeTab === 'regular' ? 'Đặt bàn mới' : 'Tạo sự kiện mới'}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div style={{ background: '#fff1f0', color: '#cf1322', border: '1px solid #ffccc7', borderRadius: 10, padding: 12, marginBottom: 16 }}>
          ⚠ {error}
        </div>
      )}

      {activeTab === 'regular' ? (
        <div className="stats-grid">
          <div className="stat-card stat-card-blue">
            <div className="stat-header">
              <p className="stat-label">Tổng đặt bàn hôm nay</p>
              <Calendar className="stat-icon text-blue-500" size={24} />
            </div>
            <p className="stat-value">{totalTodayBookings}</p>
            <p className="stat-info">Lượt đặt bàn trong ngày</p>
          </div>

          <div className="stat-card stat-card-amber">
            <div className="stat-header">
              <p className="stat-label">Đang chờ xác nhận</p>
              <AlertCircle className="stat-icon text-amber-500" size={24} />
            </div>
            <p className="stat-value text-amber-600">{String(pendingBookings).padStart(2, '0')}</p>
            <p className="stat-info text-amber-600">Cần xử lý ngay</p>
          </div>

          <div className="stat-card stat-card-green">
            <div className="stat-header">
              <p className="stat-label">Bàn đang sử dụng</p>
              <Utensils className="stat-icon text-green-600" size={24} />
            </div>
            <p className="stat-value text-green-600">{activeTables}</p>
            <p className="stat-info">Đang hoạt động</p>
          </div>
        </div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <p className="stat-label">Sự kiện sắp tới</p>
              <Calendar className="stat-icon text-primary" size={24} />
            </div>
            <p className="stat-value">{upcomingEvents}</p>
            <p className="stat-change positive">Dữ liệu realtime</p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <p className="stat-label">Chờ ký hợp đồng</p>
              <AlertCircle className="stat-icon text-amber-500" size={24} />
            </div>
            <p className="stat-value text-amber-600">{String(pendingContracts).padStart(2, '0')}</p>
            <p className="stat-info">Cần xử lý gấp {String(urgentCount).padStart(2, '0')} đơn</p>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <p className="stat-label">Doanh thu dự kiến</p>
              <FileText className="stat-icon text-green-600" size={24} />
            </div>
            <p className="stat-value">{formatCurrency(totalRevenue)}</p>
            <p className="stat-info">Từ sự kiện active</p>
          </div>
        </div>
      )}

      <div className="content-card">
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === 'regular' ? 'active' : ''}`}
            onClick={() => setActiveTab('regular')}
            type="button"
          >
            <Calendar size={18} />
            Lịch đặt bàn thường
          </button>
          <button
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
            type="button"
          >
            <Users size={18} />
            Đặt tiệc / Sự kiện
          </button>
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ padding: 24, color: '#64748b' }}>Đang tải dữ liệu...</div>
          ) : activeTab === 'regular' ? (
            <table className="events-table regular-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Số lượng</th>
                  <th>Thời gian đặt</th>
                  <th>Số bàn</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegularBookings.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                      Không có dữ liệu đặt bàn
                    </td>
                  </tr>
                )}
                {filteredRegularBookings.map((booking) => {
                  const regularStatus = getRegularStatusConfig(booking.status);
                  const isProcessing = processingCode === booking.reservationCode;
                  return (
                    <tr key={booking.id} className={booking.status === 'cancelled' ? 'muted-row' : ''}>
                      <td>
                        <div className="customer-info">
                          <div className="customer-name">{booking.customer}</div>
                          <div className="customer-contact">SĐT: {booking.phone}</div>
                        </div>
                      </td>
                      <td className="regular-value">{booking.guests} Khách</td>
                      <td>
                        <div className="date-time-info">
                          <div className="time">{booking.time}</div>
                          <div className="date">{booking.date}</div>
                        </div>
                      </td>
                      <td>
                        {booking.table ? (
                          <span className="table-chip">{booking.table}</span>
                        ) : (
                          <span className="table-empty">Chưa chỉ định</span>
                        )}
                      </td>
                      <td>
                        <span className={regularStatus.className}>
                          {regularStatus.icon}
                          {booking.statusText}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {booking.status === 'pending' ? (
                            <>
                              <button className="btn-confirm-inline" onClick={() => handleConfirmReservation(booking)} disabled={isProcessing} type="button">
                                <Check size={14} />
                                {isProcessing ? 'Đang xử lý...' : 'Xác nhận'}
                              </button>
                              <button className="btn-cancel-inline" onClick={() => openCancelModal(booking)} disabled={isProcessing} type="button">
                                <X size={14} />
                                Hủy
                              </button>
                            </>
                          ) : booking.status === 'cancelled' ? (
                            <button className="btn-icon-only" title="Chi tiết" type="button">
                              <Info size={16} />
                            </button>
                          ) : (
                            <>
                              <button className="btn-icon-only" title="Chỉnh sửa" type="button">
                                <Edit size={16} />
                              </button>
                              <button className="btn-icon-only danger" title="Hủy đặt bàn" onClick={() => openCancelModal(booking)} type="button">
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="events-table">
              <thead>
                <tr>
                  <th>Khách hàng / Công ty</th>
                  <th>Loại sự kiện</th>
                  <th>Số lượng khách</th>
                  <th>Ngày tổ chức</th>
                  <th>Trạng thái hợp đồng</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>
                      Không có dữ liệu sự kiện
                    </td>
                  </tr>
                )}
                {filteredEvents.map((event) => {
                  const statusConfig = getStatusConfig(event.status);
                  return (
                    <tr key={event.id} className={event.urgent ? 'urgent-row' : ''}>
                      <td>
                        <div className="customer-info">
                          <div className="customer-name">{event.customer}</div>
                          <div className="customer-contact">Người liên hệ: {event.contact} ({event.phone})</div>
                        </div>
                      </td>
                      <td>
                        <span className={`event-type-badge ${getEventTypeColor(event.eventTypeColor)}`}>
                          {event.eventType}
                        </span>
                      </td>
                      <td>
                        <div className="guests-info">
                          <Users className="guests-icon" size={18} />
                          <span className="guests-count">{event.guests} khách</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-time-info">
                          <div className="time">{event.time}</div>
                          <div className="date">{event.date}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                          {statusConfig.icon}
                          {event.statusText}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-detail"
                            onClick={() => navigate(`/manager/reservations/${event.eventId || event.bookingCode || 'detail'}`)}
                            type="button"
                          >
                            <Eye size={14} />
                            Chi tiết
                          </button>
                          <button
                            className="btn-contract"
                            onClick={() => navigate(`/manager/reservations/${event.eventId || event.bookingCode || 'detail'}/contract`)}
                            type="button"
                          >
                            <FileText size={14} />
                            Hợp đồng
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="table-footer">
          <p className="pagination-info">
            {activeTab === 'regular'
              ? `Hiển thị ${filteredRegularBookings.length} trên ${totalTodayBookings} lượt đặt bàn`
              : `Hiển thị ${filteredEvents.length} trong số ${eventsData.length} sự kiện`}
          </p>
          <div className="pagination-controls">
            <button className="pagination-btn" disabled={currentPage === 1} type="button">
              <ChevronLeft size={16} />
            </button>
            <button className="pagination-btn active" type="button">1</button>
            <button className="pagination-btn" type="button">2</button>
            <button className="pagination-btn" type="button">3</button>
            <button className="pagination-btn" type="button">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {cancelTarget && (
        <div className="cancel-modal-overlay" onClick={closeCancelModal}>
          <div className="cancel-modal" onClick={(event) => event.stopPropagation()}>
            <div className="cancel-modal-header">
              <div className="cancel-modal-title-wrap">
                <div className="cancel-icon-wrap">
                  <Trash2 size={18} />
                </div>
                <h3 className="cancel-modal-title">Xác nhận hủy đặt bàn</h3>
              </div>
              <button className="cancel-close-btn" onClick={closeCancelModal} type="button">
                <X size={18} />
              </button>
            </div>

            <div className="cancel-modal-body">
              <p className="cancel-modal-text">
                Bạn có chắc chắn muốn hủy lượt đặt bàn của khách hàng <strong>{cancelTarget.customer}</strong> không?
              </p>

              <div className="cancel-warning-box">
                <AlertCircle size={18} />
                <p>Hành động này không thể hoàn tác. Lịch đặt bàn sẽ được chuyển sang trạng thái Đã hủy.</p>
              </div>

              <label className="cancel-label" htmlFor="cancel-reason">
                Lý do hủy <span>*</span>
              </label>
              <textarea
                id="cancel-reason"
                className="cancel-textarea"
                placeholder="Nhập lý do hủy (ví dụ: Khách gọi báo hủy, hết bàn...)"
                rows={4}
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
              />
              <p className="cancel-note">Thông tin này sẽ được lưu vào lịch sử đặt bàn nội bộ.</p>
            </div>

            <div className="cancel-modal-footer">
              <button className="btn-cancel-secondary" onClick={closeCancelModal} type="button">
                Hủy bỏ
              </button>
              <button
                className="btn-cancel-danger"
                disabled={!cancelReason.trim() || processingCode === cancelTarget.reservationCode}
                onClick={handleCancelReservation}
                type="button"
              >
                <Trash2 size={14} />
                {processingCode === cancelTarget.reservationCode ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerReservationsPage;
