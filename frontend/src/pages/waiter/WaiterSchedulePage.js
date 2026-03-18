import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  RefreshCw,
  Loader2,
  AlertCircle,
  MapPin,
  ArrowRightLeft,
  Info,
  X,
  Send,
  CalendarDays,
  UserCheck,
} from 'lucide-react';
import '../../styles/WaiterPages.css';
import { mapNotificationToUI, notificationAPI, staffAPI } from '../../api/managerApi';

const WEEK_DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

function toDateOnlyString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getWeekStart(baseDate = new Date()) {
  const d = new Date(baseDate);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function getWeekDays(startDate) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return {
      key: toDateOnlyString(date),
      label: WEEK_DAY_LABELS[index],
      date,
      dayOfMonth: date.getDate(),
      isToday: toDateOnlyString(date) === toDateOnlyString(new Date()),
    };
  });
}

function unwrapResponse(response) {
  const data = response?.data?.data ?? response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function formatWeekRange(weekDays) {
  if (!weekDays.length) return '';
  const first = weekDays[0].date;
  const last = weekDays[weekDays.length - 1].date;
  return `${first.toLocaleDateString('vi-VN')} - ${last.toLocaleDateString('vi-VN')}`;
}

function normalizeShift(item, dayKey) {
  const name = item?.shiftName || item?.shift || 'Ca làm việc';
  const startTime = String(item?.startTime || '').slice(0, 5) || '--:--';
  const endTime = String(item?.endTime || '').slice(0, 5) || '--:--';
  const note = item?.note || item?.additionalWork || '';
  const area = item?.workArea || item?.location || item?.station || '';

  let variant = 'morning';
  const lower = String(name).toLowerCase();
  if (lower.includes('chiều') || lower.includes('afternoon')) variant = 'afternoon';
  if (lower.includes('tối') || lower.includes('evening') || lower.includes('night')) variant = 'evening';

  return {
    id: item?.workStaffId || item?.id || `${dayKey}-${name}-${startTime}-${endTime}`,
    dayKey,
    name,
    startTime,
    endTime,
    note,
    area,
    variant,
    raw: item,
  };
}

const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Cập nhật ca làm',
    time: 'Vừa xong',
    message: 'Bạn đã được phân công thêm ca làm mới.',
    tone: 'primary',
    isRead: false,
  },
];

const WaiterSchedulePage = () => {
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [weekShifts, setWeekShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [monthHours, setMonthHours] = useState(0);
  const [monthShifts, setMonthShifts] = useState(0);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [apiHint, setApiHint] = useState('Backend chưa mở endpoint đổi ca, hiện đang lưu yêu cầu tạm trên giao diện.');
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapManagers, setSwapManagers] = useState([]);
  const [swapForm, setSwapForm] = useState({ workStaffId: '', reason: '', managerId: '' });
  const [swapSubmitting, setSwapSubmitting] = useState(false);
  const [swapFeedback, setSwapFeedback] = useState({ type: '', message: '' });

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const shiftsByDay = useMemo(() => {
    const map = new Map(weekDays.map((day) => [day.key, []]));
    weekShifts.forEach((shift) => {
      if (!map.has(shift.dayKey)) return;
      map.get(shift.dayKey).push(shift);
    });
    return map;
  }, [weekDays, weekShifts]);

  const fetchSchedule = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [scheduleRes, monthlyHoursRes, monthlyShiftsRes, notificationRes, managersRes] = await Promise.allSettled([
        staffAPI.getScheduleWeekKitchenWaiter(toDateOnlyString(weekStart)),
        staffAPI.getSumTimeworkThisMonth(),
        staffAPI.getSumWorkshiftThisMonth(),
        notificationAPI.getAll(),
        staffAPI.filterByPosition(['Manager']),
      ]);

      const scheduleItems = scheduleRes.status === 'fulfilled' ? unwrapResponse(scheduleRes.value) : [];

      const userStr = localStorage.getItem('user');
      let currentUserId = null;
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr);
          currentUserId = parsed?.id ?? parsed?.userId ?? parsed?.staffId ?? null;
        } catch (e) {
          currentUserId = null;
        }
      }

      const filtered = scheduleItems.filter((item) => {
        const role = String(item?.position || item?.role || '').toLowerCase();
        const isWaiterRole = !role || role.includes('waiter') || role.includes('phục vụ') || role.includes('phuc vu');
        if (!isWaiterRole) return false;

        if (currentUserId == null) return true;
        const itemUserId = item?.userId ?? item?.staffId ?? item?.id;
        if (itemUserId == null) return true;
        return Number(itemUserId) === Number(currentUserId);
      });

      const mapped = filtered
        .map((item) => {
          const workDate = item?.workDate || item?.workDay || item?.date;
          if (!workDate) return null;
          const dayKey = toDateOnlyString(new Date(workDate));
          return normalizeShift(item, dayKey);
        })
        .filter(Boolean);

      setWeekShifts(mapped);

      const hours = monthlyHoursRes.status === 'fulfilled'
        ? Number(monthlyHoursRes.value?.data?.data ?? monthlyHoursRes.value?.data ?? 0)
        : 0;
      const shifts = monthlyShiftsRes.status === 'fulfilled'
        ? Number(monthlyShiftsRes.value?.data?.data ?? monthlyShiftsRes.value?.data ?? 0)
        : 0;
      setMonthHours(Number.isFinite(hours) ? hours : 0);
      setMonthShifts(Number.isFinite(shifts) ? shifts : 0);

      if (notificationRes.status === 'fulfilled') {
        const notificationItems = unwrapResponse(notificationRes.value);
        const mappedNotis = notificationItems.map((n, idx) => mapNotificationToUI(n, idx));
        if (mappedNotis.length > 0) {
          setNotifications(mappedNotis);
        } else {
          setNotifications(DEFAULT_NOTIFICATIONS);
        }
      } else {
        setNotifications(DEFAULT_NOTIFICATIONS);
      }

      if (managersRes.status === 'fulfilled') {
        const managerItems = unwrapResponse(managersRes.value);
        const mappedManagers = managerItems
          .map((m, idx) => ({
            id: m?.userId ?? m?.staffId ?? m?.id ?? `m-${idx + 1}`,
            name: m?.fullName ?? m?.fullname ?? m?.name ?? m?.staffName ?? `Quản lý #${idx + 1}`,
          }))
          .filter((m) => !!m.name);

        if (mappedManagers.length > 0) {
          setSwapManagers(mappedManagers);
        } else {
          setSwapManagers([
            { id: 'm1', name: 'Quản lý Lê Minh Tâm' },
            { id: 'm2', name: 'Quản lý Trần Hoàng Nam' },
          ]);
        }
      } else {
        setSwapManagers([
          { id: 'm1', name: 'Quản lý Lê Minh Tâm' },
          { id: 'm2', name: 'Quản lý Trần Hoàng Nam' },
        ]);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Không thể tải lịch làm việc.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchSchedule(false);
  }, [fetchSchedule]);

  const totalWeekShifts = weekShifts.length;
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const totalWeekHours = weekShifts.reduce((sum, shift) => {
    const [h1, m1] = shift.startTime.split(':').map(Number);
    const [h2, m2] = shift.endTime.split(':').map(Number);
    if ([h1, m1, h2, m2].some((x) => Number.isNaN(x))) return sum;
    const start = h1 * 60 + m1;
    const end = h2 * 60 + m2;
    const diff = Math.max(end - start, 0) / 60;
    return sum + diff;
  }, 0);

  const handleOpenSwapModal = () => {
    setSwapFeedback({ type: '', message: '' });
    setSwapForm({ workStaffId: '', reason: '', managerId: '' });
    setShowSwapModal(true);
  };

  const handleSubmitSwapRequest = async (event) => {
    event.preventDefault();

    if (!swapForm.workStaffId || !swapForm.reason.trim() || !swapForm.managerId) {
      setSwapFeedback({ type: 'error', message: 'Vui lòng điền đầy đủ thông tin trước khi gửi yêu cầu.' });
      return;
    }

    setSwapSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const targetShift = weekShifts.find((s) => String(s.id) === String(swapForm.workStaffId));
      const managerName = swapManagers.find((m) => String(m.id) === String(swapForm.managerId))?.name || 'Quản lý';
      const shiftLabel = targetShift
        ? `${targetShift.name} (${targetShift.startTime} - ${targetShift.endTime})`
        : 'ca đã chọn';

      setNotifications((prev) => [
        {
          id: Date.now(),
          title: 'Yêu cầu đổi ca đã gửi',
          message: `Bạn đã gửi yêu cầu đổi ${shiftLabel} đến ${managerName}.`,
          time: 'Vừa xong',
          tone: 'success',
          isRead: false,
        },
        ...prev,
      ]);

      setSwapFeedback({ type: 'success', message: 'Đã gửi yêu cầu thành công. Hệ thống sẽ đồng bộ khi backend mở endpoint đổi ca.' });
      setApiHint('Yêu cầu vừa được lưu tạm. Khi backend mở endpoint đổi ca, dữ liệu sẽ được gửi tự động.');
      setShowSwapModal(false);
    } finally {
      setSwapSubmitting(false);
    }
  };

  return (
    <div className="waiter-orders-container">
      <header className="waiter-page-header">
        <div>
          <h2 className="waiter-page-title">Lịch làm việc của tôi</h2>
          <p className="waiter-page-subtitle">
            Theo dõi và quản lý lịch trình làm việc hàng tuần của bạn.
          </p>
        </div>

        <div className="waiter-schedule-actions">
          <button
            className="waiter-schedule-refresh"
            onClick={() => fetchSchedule(true)}
            type="button"
          >
            {refreshing ? <Loader2 size={16} className="waiter-spin" /> : <RefreshCw size={16} />}
            Làm mới
          </button>
        </div>
      </header>

      {!!error && (
        <div className="waiter-schedule-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="waiter-schedule-layout">
        <section className="waiter-schedule-main">
          <div className="waiter-week-toolbar">
            <button
              type="button"
              className="waiter-week-nav-btn"
              onClick={() => setWeekStart((prev) => {
                const next = new Date(prev);
                next.setDate(prev.getDate() - 7);
                return next;
              })}
            >
              <ChevronLeft size={18} />
            </button>
            <h3>Tuần làm việc ({formatWeekRange(weekDays)})</h3>
            <button
              type="button"
              className="waiter-week-nav-btn"
              onClick={() => setWeekStart((prev) => {
                const next = new Date(prev);
                next.setDate(prev.getDate() + 7);
                return next;
              })}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="waiter-week-grid">
            {weekDays.map((day) => {
              const dayShifts = shiftsByDay.get(day.key) || [];
              return (
                <div key={day.key} className={`waiter-day-column ${day.isToday ? 'is-today' : ''}`}>
                  <div className="waiter-day-head">
                    <span>{day.isToday ? 'Hôm nay' : day.label}</span>
                    <strong>{day.dayOfMonth}</strong>
                  </div>

                  <div className="waiter-day-content">
                    {dayShifts.length === 0 && (
                      <p className="waiter-day-empty">Không có ca</p>
                    )}

                    {dayShifts.map((shift) => (
                      <div key={shift.id} className={`waiter-shift-chip ${shift.variant}`}>
                        <p className="waiter-shift-name">{shift.name}</p>
                        <p className="waiter-shift-time">{shift.startTime} - {shift.endTime}</p>
                        {shift.area && (
                          <p className="waiter-shift-note">
                            <MapPin size={12} />
                            {shift.area}
                          </p>
                        )}
                        {shift.note && !shift.area && (
                          <p className="waiter-shift-note">{shift.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {loading && (
            <div className="waiter-schedule-loading">
              <Loader2 size={20} className="waiter-spin" />
              Đang tải lịch làm việc...
            </div>
          )}
        </section>

        <aside className="waiter-schedule-side">
          <button className="waiter-request-switch-btn" type="button" onClick={handleOpenSwapModal}>
            <ArrowRightLeft size={18} />
            Gửi yêu cầu đổi ca
          </button>
          <p className="waiter-request-note">
            <Info size={14} />
            {apiHint}
          </p>

          <div className="waiter-schedule-card">
            <div className="waiter-schedule-card-head">
              <h4>
                <Bell size={16} />
                Thông báo & Yêu cầu
              </h4>
              <span>{unreadCount} mới</span>
            </div>
            <div className="waiter-notification-list">
              {notifications.map((item) => (
                <article key={item.id} className={`waiter-notification-item ${item.tone}`}>
                  <div className="waiter-notification-top">
                    <strong>{item.title}</strong>
                    <small>{item.time}</small>
                  </div>
                  <p>{item.message}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="waiter-schedule-card waiter-week-stats-card">
            <h4>Thống kê tuần này</h4>
            <div className="waiter-week-stats-grid">
              <div>
                <p>Số ca trong tuần</p>
                <strong>{totalWeekShifts}</strong>
              </div>
              <div>
                <p>Tổng giờ tuần</p>
                <strong>{totalWeekHours.toFixed(1)}h</strong>
              </div>
              <div>
                <p>Số ca tháng</p>
                <strong>{monthShifts}</strong>
              </div>
              <div>
                <p>Giờ công tháng</p>
                <strong>{monthHours}</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {showSwapModal && (
        <div className="waiter-swap-modal-overlay" onClick={() => setShowSwapModal(false)}>
          <div className="waiter-swap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="waiter-swap-modal-head">
              <div className="waiter-swap-modal-title">
                <span className="waiter-swap-modal-icon">
                  <ArrowRightLeft size={18} />
                </span>
                <h3>Yêu cầu đổi ca làm việc</h3>
              </div>
              <button type="button" className="waiter-swap-close-btn" onClick={() => setShowSwapModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form className="waiter-swap-form" onSubmit={handleSubmitSwapRequest}>
              <div className="waiter-swap-field">
                <label>
                  <CalendarDays size={14} />
                  Chọn ca làm cần đổi
                </label>
                <select
                  value={swapForm.workStaffId}
                  onChange={(e) => setSwapForm((prev) => ({ ...prev, workStaffId: e.target.value }))}
                >
                  <option value="">-- Chọn ca làm việc trong tuần --</option>
                  {weekShifts.map((shift) => {
                    const day = weekDays.find((d) => d.key === shift.dayKey);
                    const dayText = day ? `${day.label}, ${day.date.toLocaleDateString('vi-VN')}` : shift.dayKey;
                    return (
                      <option key={shift.id} value={shift.id}>
                        {dayText} - {shift.name} ({shift.startTime} - {shift.endTime})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="waiter-swap-field">
                <label>
                  <Info size={14} />
                  Lý do đổi ca
                </label>
                <textarea
                  rows={4}
                  placeholder="Vui lòng nhập lý do cụ thể..."
                  value={swapForm.reason}
                  onChange={(e) => setSwapForm((prev) => ({ ...prev, reason: e.target.value }))}
                ></textarea>
              </div>

              <div className="waiter-swap-field">
                <label>
                  <UserCheck size={14} />
                  Chọn quản lý phê duyệt
                </label>
                <select
                  value={swapForm.managerId}
                  onChange={(e) => setSwapForm((prev) => ({ ...prev, managerId: e.target.value }))}
                >
                  <option value="">-- Danh sách quản lý --</option>
                  {swapManagers.map((manager) => (
                    <option key={manager.id} value={manager.id}>{manager.name}</option>
                  ))}
                </select>
              </div>

              {swapFeedback.message && (
                <p className={`waiter-swap-feedback ${swapFeedback.type}`}>
                  {swapFeedback.message}
                </p>
              )}

              <button className="waiter-swap-submit-btn" type="submit" disabled={swapSubmitting}>
                {swapSubmitting ? <Loader2 size={16} className="waiter-spin" /> : <Send size={16} />}
                Gửi yêu cầu
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterSchedulePage;
