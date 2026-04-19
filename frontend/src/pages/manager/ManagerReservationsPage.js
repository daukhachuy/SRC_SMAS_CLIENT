import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoleSectionBasePath } from '../../hooks/useRoleSectionBasePath';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  Info,
  Plus,
  Search,
  Trash2,
  Users,
  Utensils,
  X,
  XCircle,
} from 'lucide-react';
import {
  eventBookingAPI,
  mapEventToUI,
  mapReservationToUI,
  reservationAPI,
  reviewBookEvent,
} from '../../api/managerApi';
import '../../styles/ManagerPages.css';
import '../../styles/ManagerReservationsPage.css';

const ManagerReservationsPage = () => {
  const { base } = useRoleSectionBasePath();
  const navigate = useNavigate();
  const [eventStatusFilter, setEventStatusFilter] = useState('all');
  // Modal state cho xác nhận duyệt sự kiện
  const [reviewModal, setReviewModal] = useState({ open: false, eventId: null, loading: false, error: '', decision: 'Approved', note: '' });
  const [activeTab, setActiveTab] = useState('regular');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [regularBookings, setRegularBookings] = useState([]);
  const [eventsData, setEventsData] = useState([]);
  const [totalTodayBookings, setTotalTodayBookings] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);
  const [activeTables, setActiveTables] = useState(0);
  const [pendingContracts, setPendingContracts] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uiNotice, setUiNotice] = useState('');

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [processingCode, setProcessingCode] = useState('');

  // Hàm mở modal xác nhận duyệt sự kiện
  const openReviewModal = (eventId) => {
    setReviewModal({ open: true, eventId, loading: false, error: '', decision: 'Approved', note: '' });
  };

  // Hàm gọi API xác nhận duyệt sự kiện
  const handleReviewEvent = async (decision) => {
    const resolvedDecision = decision === 'Rejected' ? 'Rejected' : 'Approved';
    setReviewModal((prev) => ({ ...prev, loading: true, error: '', decision: resolvedDecision }));
    try {
      await reviewBookEvent(reviewModal.eventId, {
        decision: resolvedDecision,
        note: reviewModal.note,
      });
      setReviewModal({ open: false, eventId: null, loading: false, error: '', decision: 'Approved', note: '' });
      setUiNotice(resolvedDecision === 'Approved' ? 'Xác nhận sự kiện thành công!' : 'Đã hủy sự kiện thành công!');
      loadEventsData();
    } catch (err) {
      setReviewModal((prev) => ({ ...prev, loading: false, error: err?.response?.data?.message || err?.message || 'Lỗi xác nhận sự kiện' }));
    }
  };

  const openContractSigningPage = (event, detailId) => {
    if (!detailId) return;
    const bookingCode = String(event?.bookingCode || event?.raw?.bookingCode || event?.raw?.eventCode || '').trim();
    const bookingQuery = bookingCode ? `?bookingCode=${encodeURIComponent(bookingCode)}` : '';
    navigate(`${base}/reservations/${detailId}/contract${bookingQuery}`);
  };

  const openCreateContractPage = (event, detailId) => {
    if (!detailId) return;
    const bookingCode = String(event?.bookingCode || event?.raw?.bookingCode || event?.raw?.eventCode || '').trim();
    const query = new URLSearchParams();
    if (bookingCode) query.set('bookingCode', bookingCode);
    query.set('create', '1');
    navigate(`${base}/reservations/${detailId}/contract?${query.toString()}`);
  };

  useEffect(() => {
    if (!uiNotice) return;
    const timer = setTimeout(() => setUiNotice(''), 2800);
    return () => clearTimeout(timer);
  }, [uiNotice]);

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

      // Sắp xếp theo thời gian đặt (đơn nào đặt trước lên trước)
      const mappedReservations = reservationRaw.map(mapReservationToUI);
      // Ưu tiên các đơn 'Chờ xác nhận' lên đầu, sau đó đến 'Đã xác nhận', đều sắp xếp theo thời gian đặt giảm dần
      const getTimestamp = (booking) => {
        const date = new Date(`${booking.date}T${booking.time}`);
        return date.getTime();
      };
      const pending = mappedReservations
        .filter(b => b.status === 'pending')
        .sort((a, b) => getTimestamp(b) - getTimestamp(a));
      const confirmed = mappedReservations
        .filter(b => b.status === 'confirmed')
        .sort((a, b) => getTimestamp(b) - getTimestamp(a));
      const others = mappedReservations
        .filter(b => b.status !== 'pending' && b.status !== 'confirmed')
        .sort((a, b) => getTimestamp(b) - getTimestamp(a));
      setRegularBookings([...pending, ...confirmed, ...others]);

      const activeDiningCount = mappedReservations.filter(
        (booking) => booking.status === 'dining' || booking.status === 'seated'
      ).length;
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
    setLoading(true);
    try {
      const [activeRes, upcomingRes, ascRes, historyRes, pendingContractRes] = await Promise.allSettled([
        eventBookingAPI.getActive(),
        eventBookingAPI.getUpcomingEvents(),
        eventBookingAPI.getAllAscCreatedAt(),
        eventBookingAPI.getHistory(),
        eventBookingAPI.getContractsNeedSigned(),
      ]);

      // Debug: Log raw responses
      console.log('[Manager] book-event/active:', activeRes);
      console.log('[Manager] events/upcoming-events:', upcomingRes);
      console.log('[Manager] book-event/asc-created-at:', ascRes);
      console.log('[Manager] book-event/history:', historyRes);
      console.log('[Manager] contract/number-need-signed:', pendingContractRes);

      const extractArray = (payload, sourceName = 'unknown') => {
        if (Array.isArray(payload)) return payload;
        // Thử nhiều format phổ biến
        const data = payload?.data;
        if (Array.isArray(data)) return data;
        if (data?.$values && Array.isArray(data.$values)) return data.$values;
        if (data?.items && Array.isArray(data.items)) return data.items;
        if (data?.events && Array.isArray(data.events)) return data.events;
        if (data?.bookEvents && Array.isArray(data.bookEvents)) return data.bookEvents;
        if (data?.content && Array.isArray(data.content)) return data.content;
        console.warn(`[Manager] extractArray (${sourceName}): No array found in`, payload);
        return [];
      };

      const merged = [];
      const pushIfArray = (result, sourceName = 'unknown') => {
        if (result.status !== 'fulfilled') {
          console.warn(`[Manager] ${sourceName} failed:`, result.reason);
          return;
        }
        const rows = extractArray(result.value.data, sourceName);
        console.log(`[Manager] ${sourceName}: Found ${Array.isArray(rows) ? rows.length : 0} items`, rows.slice(0, 2));
        if (Array.isArray(rows) && rows.length > 0) merged.push(...rows);
      };

      pushIfArray(activeRes, 'book-event/active');
      pushIfArray(upcomingRes, 'events/upcoming-events');
      pushIfArray(ascRes, 'book-event/asc-created-at');
      pushIfArray(historyRes, 'book-event/history');

      console.log('[Manager] Total merged events before dedup:', merged.length);

      // Deduplicate by best available identifier
      const seen = new Set();
      const deduped = merged.filter((item) => {
        const key = item?.bookEventId ?? item?.eventId ?? item?.bookingCode ?? item?.eventCode ?? item?.id ?? JSON.stringify(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      console.log('[Manager] After dedup:', deduped.length, 'events');
      console.log('[Manager] Sample events:', deduped.slice(0, 3));

      const mappedEvents = deduped.map(mapEventToUI);
      console.log('[Manager] Mapped events:', mappedEvents);
      setEventsData(mappedEvents);

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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReservationData();
    loadEventsData();
  }, [loadReservationData, loadEventsData]);

  /** Chỉ cho hủy trước khi khách nhận bàn (đã xác nhận vẫn hủy được; seated/dining thì không). */
  const canCancelRegularBooking = (booking) =>
    booking && ['pending', 'confirmed'].includes(booking.status);

  const handleConfirmReservation = async (booking) => {
    if (!booking?.reservationCode) return;
    setProcessingCode(booking.reservationCode);
    try {
      await reservationAPI.confirm(booking.reservationCode);
      await loadReservationData();
      setUiNotice(`Đã xác nhận đặt bàn ${booking.reservationCode}.`);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Xác nhận đặt bàn thất bại';
      setError(`Lỗi ${status ?? ''} ${msg}`.trim());
      setUiNotice(`Lỗi ${status ?? ''} ${msg}`.trim());
    } finally {
      setProcessingCode('');
    }
  };

  const openCancelModal = (booking) => {
    if (!canCancelRegularBooking(booking)) {
      setUiNotice('Đã nhận bàn hoặc đang dùng bữa — không thể hủy đặt bàn.');
      return;
    }
    setCancelTarget(booking);
    setCancelReason('');
  };

  const closeCancelModal = () => {
    setCancelTarget(null);
    setCancelReason('');
  };

  const handleCancelReservation = async () => {
    if (!cancelTarget?.reservationCode || !cancelReason.trim()) return;
    if (!canCancelRegularBooking(cancelTarget)) {
      closeCancelModal();
      setUiNotice('Không thể hủy đơn ở trạng thái này.');
      return;
    }
    setProcessingCode(cancelTarget.reservationCode);
    try {
      await reservationAPI.cancel(cancelTarget.reservationCode, cancelReason);
      closeCancelModal();
      await loadReservationData();
      setUiNotice(`Đã hủy đặt bàn ${cancelTarget.reservationCode}.`);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || 'Hủy đặt bàn thất bại';
      setError(`Lỗi ${status ?? ''} ${msg}`.trim());
      setUiNotice(`Lỗi ${status ?? ''} ${msg}`.trim());
    } finally {
      setProcessingCode('');
    }
  };

  const filteredRegularBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let filtered = regularBookings;
    if (statusFilter !== 'all') {
      filtered = filtered.filter((booking) => booking.status === statusFilter);
    }
    if (!query) return filtered;
    return filtered.filter((booking) => (
      booking.customer.toLowerCase().includes(query)
      || booking.phone.includes(query)
      || String(booking.reservationCode).toLowerCase().includes(query)
    ));
  }, [searchQuery, regularBookings, statusFilter]);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let filtered = eventsData;
    if (eventStatusFilter !== 'all') {
      filtered = filtered.filter((event) => {
        if (eventStatusFilter === 'signed') return event.status === 'signed' || event.status === 'deposit' || event.status === 'completed';
        if (eventStatusFilter === 'pending') return event.status === 'unsigned';
        if (eventStatusFilter === 'nosigned') return !event.status || event.status === 'nosigned' || event.statusText?.toLowerCase().includes('chưa có hợp đồng');
        if (eventStatusFilter === 'cancelled') return event.status === 'cancelled' || event.status === 'rejected';
        return true;
      });
    }
    if (!query) return filtered;
    return filtered.filter((event) => (
      event.customer.toLowerCase().includes(query)
      || event.contact.toLowerCase().includes(query)
      || event.phone.includes(query)
      || String(event.bookingCode).toLowerCase().includes(query)
    ));
  }, [searchQuery, eventsData, eventStatusFilter]);

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
      unsigned: {
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        icon: <Clock3 size={14} />,
      },
      nosigned: {
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-700',
        icon: <AlertCircle size={14} />,
      },
      deposit: {
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
        icon: <AlertCircle size={14} />,
      },
      rejected: {
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        icon: <XCircle size={14} />,
      },
      completed: {
        bgColor: 'bg-violet-100',
        textColor: 'text-violet-700',
        icon: <CheckCircle size={14} />,
      },
      cancelled: {
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-700',
        icon: <XCircle size={14} />,
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
      seated: {
        className: 'regular-status dining',
        icon: <Utensils size={14} />,
      },
      cancelled: {
        className: 'regular-status cancelled',
        icon: <XCircle size={14} />,
      },
    };
    return configs[status] || configs.pending;
  };

  const hasCreatedContract = (event) => {
    const raw = event?.raw || {};
    const contractStatus = String(raw?.contractStatus || '').trim().toLowerCase();
    if (['draft', 'sent', 'signed', 'deposited', 'deposit', 'completed', 'active'].includes(contractStatus)) {
      return true;
    }
    return Boolean(
      raw?.contractId
      || raw?.contractCode
      || raw?.termsAndConditions
      || raw?.signedAt
      || raw?.depositAmount
      || raw?.depositPercent
      || raw?.contract
    );
  };

  const noticeIsError = /lỗi|thất bại|không thể|chưa|cần|không/i.test(uiNotice);

  return (
    <div className="reservations-page-container">
      {uiNotice && (
        <div
          style={{
            position: 'fixed',
            top: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: noticeIsError ? 'rgba(255, 245, 240, 0.96)' : 'rgba(240, 253, 244, 0.96)',
            border: noticeIsError ? '1px solid #ffd8bf' : '1px solid #bbf7d0',
            color: noticeIsError ? '#9a3412' : '#166534',
            borderRadius: 14,
            padding: '11px 16px',
            boxShadow: '0 12px 28px rgba(0,0,0,0.14)',
            backdropFilter: 'blur(6px)',
            maxWidth: 560,
            whiteSpace: 'pre-line',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeIn 180ms ease-out',
          }}
        >
          {noticeIsError ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{uiNotice}</span>
        </div>
      )}

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
            {activeTab !== 'regular' && (
              <button className="btn-create-event" type="button">
                <Plus size={20} />
                Tạo sự kiện mới
              </button>
            )}
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
        {/* Bộ lọc trạng thái đặt bàn */}
        {(activeTab === 'regular' || activeTab === 'events') && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1.5rem', marginTop: 8, marginBottom: 0 }}>
            <div style={{ display: 'flex', gap: 0 }}>
              <div className="tabs-container" style={{ borderBottom: 'none', background: 'none', padding: 0 }}>
                <button
                  className={`tab-btn ${activeTab === 'regular' ? 'active' : ''}`}
                  onClick={() => setActiveTab('regular')}
                  type="button"
                  style={{ borderBottom: 'none', background: 'none', fontSize: 15, padding: '8px 18px', marginBottom: 0 }}
                >
                  <Calendar size={16} />
                  Lịch đặt bàn thường
                </button>
                <button
                  className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
                  onClick={() => setActiveTab('events')}
                  type="button"
                  style={{ borderBottom: 'none', background: 'none', fontSize: 15, padding: '8px 18px', marginBottom: 0 }}
                >
                  <Users size={16} />
                  Đặt tiệc / Sự kiện
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', background: '#f8fafc', borderRadius: 20, padding: '3px 8px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
              {activeTab === 'regular' && <>
                <button
                  className={`filter-btn${statusFilter === 'all' ? ' active' : ''}`}
                  style={{ padding: '5px 14px', borderRadius: 16, border: 'none', background: statusFilter === 'all' ? '#ff6d1f' : 'transparent', color: statusFilter === 'all' ? '#fff' : '#2d3748', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.18s', boxShadow: statusFilter === 'all' ? '0 2px 8px #ff6d1f22' : 'none' }}
                  onClick={() => setStatusFilter('all')}
                  onMouseOver={e => { if(statusFilter!=='all')e.target.style.background='#f3f4f6'; }}
                  onMouseOut={e => { if(statusFilter!=='all')e.target.style.background='transparent'; }}
                >Tất cả</button>
                <button
                  className={`filter-btn${statusFilter === 'pending' ? ' active' : ''}`}
                  style={{ padding: '5px 14px', borderRadius: 16, border: 'none', background: statusFilter === 'pending' ? '#f59e0b' : 'transparent', color: statusFilter === 'pending' ? '#fff' : '#2d3748', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.18s', boxShadow: statusFilter === 'pending' ? '0 2px 8px #f59e0b22' : 'none' }}
                  onClick={() => setStatusFilter('pending')}
                  onMouseOver={e => { if(statusFilter!=='pending')e.target.style.background='#f3f4f6'; }}
                  onMouseOut={e => { if(statusFilter!=='pending')e.target.style.background='transparent'; }}
                >Chờ xác nhận</button>
                <button
                  className={`filter-btn${statusFilter === 'confirmed' ? ' active' : ''}`}
                  style={{ padding: '5px 14px', borderRadius: 16, border: 'none', background: statusFilter === 'confirmed' ? '#22c55e' : 'transparent', color: statusFilter === 'confirmed' ? '#fff' : '#2d3748', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.18s', boxShadow: statusFilter === 'confirmed' ? '0 2px 8px #22c55e22' : 'none' }}
                  onClick={() => setStatusFilter('confirmed')}
                  onMouseOver={e => { if(statusFilter!=='confirmed')e.target.style.background='#f3f4f6'; }}
                  onMouseOut={e => { if(statusFilter!=='confirmed')e.target.style.background='transparent'; }}
                >Đã xác nhận</button>
                <button
                  className={`filter-btn${statusFilter === 'seated' ? ' active' : ''}`}
                  style={{ padding: '5px 14px', borderRadius: 16, border: 'none', background: statusFilter === 'seated' ? '#0ea5e9' : 'transparent', color: statusFilter === 'seated' ? '#fff' : '#2d3748', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.18s', boxShadow: statusFilter === 'seated' ? '0 2px 8px #0ea5e922' : 'none' }}
                  onClick={() => setStatusFilter('seated')}
                  onMouseOver={e => { if(statusFilter!=='seated')e.target.style.background='#f3f4f6'; }}
                  onMouseOut={e => { if(statusFilter!=='seated')e.target.style.background='transparent'; }}
                >Đã nhận bàn</button>
                <button
                  className={`filter-btn${statusFilter === 'cancelled' ? ' active' : ''}`}
                  style={{ padding: '5px 14px', borderRadius: 16, border: 'none', background: statusFilter === 'cancelled' ? '#64748b' : 'transparent', color: statusFilter === 'cancelled' ? '#fff' : '#2d3748', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.18s', boxShadow: statusFilter === 'cancelled' ? '0 2px 8px #64748b22' : 'none' }}
                  onClick={() => setStatusFilter('cancelled')}
                  onMouseOver={e => { if(statusFilter!=='cancelled')e.target.style.background='#f3f4f6'; }}
                  onMouseOut={e => { if(statusFilter!=='cancelled')e.target.style.background='transparent'; }}
                >Đã hủy</button>
              </>}
              {activeTab === 'events' && <>
                <button
                  className={`filter-btn${eventStatusFilter === 'all' ? ' active' : ''}`}
                  style={{ padding: '5px 14px', borderRadius: 16, border: 'none', background: eventStatusFilter === 'all' ? '#ff6d1f' : 'transparent', color: eventStatusFilter === 'all' ? '#fff' : '#2d3748', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.18s', boxShadow: eventStatusFilter === 'all' ? '0 2px 8px #ff6d1f22' : 'none' }}
                  onClick={() => setEventStatusFilter('all')}
                  onMouseOver={e => { if(eventStatusFilter!=='all')e.target.style.background='#f3f4f6'; }}
                  onMouseOut={e => { if(eventStatusFilter!=='all')e.target.style.background='transparent'; }}
                >Tất cả</button>
                <button
                  className={`filter-btn${eventStatusFilter === 'pending' ? ' active' : ''}`}
                  style={{ padding: '5px 14px', borderRadius: 16, border: 'none', background: eventStatusFilter === 'pending' ? '#f59e0b' : 'transparent', color: eventStatusFilter === 'pending' ? '#fff' : '#2d3748', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.18s', boxShadow: eventStatusFilter === 'pending' ? '0 2px 8px #f59e0b22' : 'none' }}
                  onClick={() => setEventStatusFilter('pending')}
                  onMouseOver={e => { if(eventStatusFilter!=='pending')e.target.style.background='#f3f4f6'; }}
                  onMouseOut={e => { if(eventStatusFilter!=='pending')e.target.style.background='transparent'; }}
                >Chờ ký hợp đồng</button>
                <button
                  className={`filter-btn${eventStatusFilter === 'signed' ? ' active' : ''}`}
                  style={{ padding: '5px 14px', borderRadius: 16, border: 'none', background: eventStatusFilter === 'signed' ? '#22c55e' : 'transparent', color: eventStatusFilter === 'signed' ? '#fff' : '#2d3748', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.18s', boxShadow: eventStatusFilter === 'signed' ? '0 2px 8px #22c55e22' : 'none' }}
                  onClick={() => setEventStatusFilter('signed')}
                  onMouseOver={e => { if(eventStatusFilter!=='signed')e.target.style.background='#f3f4f6'; }}
                  onMouseOut={e => { if(eventStatusFilter!=='signed')e.target.style.background='transparent'; }}
                >Đã ký hợp đồng</button>
                <button
                  className={`filter-btn${eventStatusFilter === 'nosigned' ? ' active' : ''}`}
                  style={{ padding: '5px 14px', borderRadius: 16, border: 'none', background: eventStatusFilter === 'nosigned' ? '#64748b' : 'transparent', color: eventStatusFilter === 'nosigned' ? '#fff' : '#2d3748', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.18s', boxShadow: eventStatusFilter === 'nosigned' ? '0 2px 8px #64748b22' : 'none' }}
                  onClick={() => setEventStatusFilter('nosigned')}
                  onMouseOver={e => { if(eventStatusFilter!=='nosigned')e.target.style.background='#f3f4f6'; }}
                  onMouseOut={e => { if(eventStatusFilter!=='nosigned')e.target.style.background='transparent'; }}
                >Chưa có hợp đồng</button>
                <button
                  className={`filter-btn${eventStatusFilter === 'cancelled' ? ' active' : ''}`}
                  style={{ padding: '5px 14px', borderRadius: 16, border: 'none', background: eventStatusFilter === 'cancelled' ? '#ef4444' : 'transparent', color: eventStatusFilter === 'cancelled' ? '#fff' : '#2d3748', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.18s', boxShadow: eventStatusFilter === 'cancelled' ? '0 2px 8px #ef444422' : 'none' }}
                  onClick={() => setEventStatusFilter('cancelled')}
                  onMouseOver={e => { if(eventStatusFilter!=='cancelled')e.target.style.background='#f3f4f6'; }}
                  onMouseOut={e => { if(eventStatusFilter!=='cancelled')e.target.style.background='transparent'; }}
                >Đã hủy</button>
              </>}
            </div>
          </div>
        )}
        {/* Tabs đã chuyển lên trên, bỏ đoạn này */}

        <div className="table-container">
          {loading ? (
            <div style={{ padding: 24, color: '#64748b' }}>Đang tải dữ liệu...</div>
          ) : activeTab === 'regular' ? (
            <table className="events-table regular-table">
              <thead>
                <tr>
                  <th>Mã đặt chỗ</th>
                  <th>Khách hàng</th>
                  <th>Số lượng</th>
                  <th>Thời gian đặt</th>
                  <th>Số bàn</th>
                  <th>Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegularBookings
                  .slice((currentPage - 1) * 10, currentPage * 10)
                  .map((booking) => {
                    const regularStatus = getRegularStatusConfig(booking.status);
                    const isProcessing = processingCode === booking.reservationCode;
                    return (
                      <tr key={booking.id} className={booking.status === 'cancelled' ? 'muted-row' : ''}>
                        <td>{booking.reservationCode}</td>
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
                            ) : canCancelRegularBooking(booking) ? (
                              <button className="btn-icon-only danger" title="Hủy đặt bàn" onClick={() => openCancelModal(booking)} type="button">
                                <Trash2 size={16} />
                              </button>
                            ) : (
                              <button
                                className="btn-icon-only"
                                title="Đã nhận bàn — không thể hủy"
                                type="button"
                              >
                                <Info size={16} />
                              </button>
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
                  const eventCode = event.bookingCode || event.raw?.bookingCode || event.raw?.eventCode || 'N/A';
                  const detailId = event.bookEventId || event.raw?.bookEventId || event.id || event.eventId;
                  const canOpenDetailByStatus = event.status === 'unsigned';
                  const createdContract = hasCreatedContract(event);
                  const shouldShowCreateContract = event.statusText === 'Đã duyệt' && !createdContract;
                  return (
                    <tr key={event.id || event.bookingCode || event.eventId} className={event.urgent ? 'urgent-row' : ''}>
                      <td>
                        <div className="customer-info">
                          <div className="customer-name">{event.customer}</div>
                          <div className="customer-contact">Người liên hệ: {event.contact} ({event.phone})</div>
                          <div className="customer-contact">Mã sự kiện: {eventCode}</div>
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
                          <span className="guests-count">{event.tableCount ?? event.guests} bàn</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-time-info">
                          <div className="time">{event.time}</div>
                          <div className="date">{event.date}</div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${statusConfig.bgColor} ${statusConfig.textColor}`}
                          role={canOpenDetailByStatus ? 'button' : undefined}
                          onClick={canOpenDetailByStatus && detailId ? () => navigate(`${base}/reservations/${detailId}`) : undefined}
                          style={canOpenDetailByStatus ? { cursor: 'pointer' } : undefined}
                          title={canOpenDetailByStatus ? 'Mở chi tiết sự kiện' : undefined}
                        >
                          {statusConfig.icon}
                          {event.statusText}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-detail"
                            onClick={() => detailId && navigate(`${base}/reservations/${detailId}`)}
                            type="button"
                            disabled={!detailId}
                          >
                            <Eye size={14} />
                            Chi tiết
                          </button>
                          {event.statusText === 'Chờ duyệt' ? (
                            <button
                              className="btn-contract"
                              onClick={() => detailId && openReviewModal(detailId)}
                              type="button"
                              disabled={!detailId}
                            >
                              <FileText size={14} />
                              Xác nhận
                            </button>
                          ) : (
                            <button
                              className="btn-contract"
                              onClick={() => (
                                shouldShowCreateContract
                                  ? openCreateContractPage(event, detailId)
                                  : openContractSigningPage(event, detailId)
                              )}
                              type="button"
                              disabled={!detailId}
                            >
                              <FileText size={14} />
                              {shouldShowCreateContract ? 'Tạo hợp đồng' : 'Hợp đồng'}
                            </button>
                          )}
                                    {/* Modal xác nhận duyệt sự kiện */}
                                    {reviewModal.open && (
                                      <div className="cancel-modal-overlay" onClick={() => setReviewModal({ ...reviewModal, open: false })}>
                                        <div className="cancel-modal" onClick={e => e.stopPropagation()}>
                                          <div className="cancel-modal-header">
                                            <div className="cancel-modal-title-wrap">
                                              <div className="cancel-icon-wrap">
                                                <FileText size={18} />
                                              </div>
                                              <h3 className="cancel-modal-title">Xác nhận duyệt sự kiện</h3>
                                            </div>
                                            <button className="cancel-close-btn" onClick={() => setReviewModal({ ...reviewModal, open: false })} type="button">
                                              <X size={18} />
                                            </button>
                                          </div>
                                          <div className="cancel-modal-body">
                                            <p className="cancel-modal-text">
                                              Bạn muốn duyệt hay hủy sự kiện này?
                                            </p>

                                            <div className="cancel-warning-box">
                                              <AlertCircle size={18} />
                                              <p>
                                                Chọn <strong>Xác nhận</strong> để duyệt sự kiện, hoặc <strong>Hủy sự kiện</strong> để từ chối.
                                                Thao tác sẽ được ghi nhận và cập nhật trạng thái ngay.
                                              </p>
                                            </div>

                                            <label className="cancel-label" htmlFor="review-note">
                                              Ghi chú <span style={{ opacity: 0.7 }}>(tuỳ chọn)</span>
                                            </label>
                                            <textarea
                                              id="review-note"
                                              className="cancel-textarea"
                                              placeholder="Nhập ghi chú (nếu có)..."
                                              rows={4}
                                              value={reviewModal.note}
                                              onChange={e => setReviewModal(prev => ({ ...prev, note: e.target.value }))}
                                            />
                                            {reviewModal.error && <div style={{ color: 'red', marginTop: 8 }}>{reviewModal.error}</div>}
                                          </div>
                                          <div className="cancel-modal-footer">
                                            <button className="btn-cancel-secondary" onClick={() => setReviewModal({ ...reviewModal, open: false })} type="button">Đóng</button>
                                            <button className="btn-cancel-danger" onClick={() => handleReviewEvent('Rejected')} type="button" disabled={reviewModal.loading}>
                                              {reviewModal.loading && reviewModal.decision === 'Rejected' ? 'Đang hủy...' : 'Hủy sự kiện'}
                                            </button>
                                            <button className="btn-contract" onClick={() => handleReviewEvent('Approved')} type="button" disabled={reviewModal.loading}>
                                              {reviewModal.loading && reviewModal.decision === 'Approved' ? 'Đang xác nhận...' : 'Xác nhận'}
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
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
            <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} type="button">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.ceil(filteredRegularBookings.length / 10) }, (_, idx) => (
              <button
                key={idx + 1}
                className={`pagination-btn${currentPage === idx + 1 ? ' active' : ''}`}
                onClick={() => setCurrentPage(idx + 1)}
                type="button"
              >
                {idx + 1}
              </button>
            ))}
            <button className="pagination-btn" disabled={currentPage === Math.ceil(filteredRegularBookings.length / 10) || filteredRegularBookings.length === 0} onClick={() => setCurrentPage(currentPage + 1)} type="button">
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
