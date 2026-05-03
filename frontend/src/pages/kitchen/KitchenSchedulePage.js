import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowLeftRight,
  MapPin,
  Bell,
  AlertCircle
} from 'lucide-react';
import { fetchScheduleWeekKitchenWaiter, staffApi } from '../../api/staffApi';
import { notificationAPI, staffAPI } from '../../api/managerApi';
import { getProfile } from '../../api/userApi';
import { emitAppToast } from '../../utils/appToastBus';

function resolveSenderIdFromUser(user) {
  if (!user || typeof user !== 'object') return null;
  const raw = user.userId ?? user.id ?? user.staffId;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function getSenderIdForNotification() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      const id = resolveSenderIdFromUser(u);
      if (id != null) return id;
    } catch {
      /* ignore */
    }
  }
  try {
    const profile = await getProfile();
    return resolveSenderIdFromUser(profile);
  } catch {
    return null;
  }
}

/** StaffResponseDTO (Swagger) có `position`, không có `role` — phải lọc theo position */
function isManagerStaffRow(s) {
  const pos = String(s.position ?? s.role ?? s.staffRole ?? s.jobTitle ?? '').toLowerCase();
  return (
    pos.includes('manager') ||
    pos.includes('quản lý') ||
    pos.includes('quan ly') ||
    pos === 'manager'
  );
}

function mapStaffToManagerOption(s) {
  const uid = s.userId ?? s.id ?? s.staffId;
  if (uid == null || uid === '') return null;
  const name = s.fullname || s.fullName || s.name || '—';
  return { value: String(uid), label: `Quản lý ${name}` };
}

function dedupeManagerOptions(arr) {
  const seen = new Set();
  const out = [];
  arr.forEach((opt) => {
    if (!opt || seen.has(opt.value)) return;
    seen.add(opt.value);
    out.push(opt);
  });
  return out;
}

async function fetchManagers() {
  // 1) POST /Staff/filter-by-position — body: mảng chuỗi vị trí (theo Swagger)
  try {
    const res = await staffAPI.filterByPosition(['Manager', 'Quản lý', 'manager']);
    const raw = extractList(res.data);
    const mapped = dedupeManagerOptions(raw.map(mapStaffToManagerOption).filter(Boolean));
    if (mapped.length > 0) return mapped;
  } catch (e) {
    console.warn('[fetchManagers] filter-by-position:', e?.message || e);
  }

  // 2) GET /Staff/staffs-list — lọc theo field `position` (Swagger StaffResponseDTO không có `role`)
  const res = await staffApi.getStaffsList();
  const raw = extractList(res.data);
  const fromList = raw.filter(isManagerStaffRow).map(mapStaffToManagerOption).filter(Boolean);
  return dedupeManagerOptions(fromList);
}

/* ---------- Helpers: API GET /api/Staff/schedule-week-kitchen-waiter ---------- */

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function normalizeWorkDate(raw) {
  if (raw == null || raw === '') return '';
  const s = String(raw);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const t = new Date(s);
  if (!Number.isNaN(t.getTime())) return formatYMD(t);
  return '';
}

function extractList(data) {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.$values)) return data.$values;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function formatTimePart(t) {
  if (t == null || t === '') return '';
  const s = String(t);
  if (s.includes('T')) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  }
  return s.length >= 5 ? s.slice(0, 5) : s;
}

function formatShiftRange(start, end) {
  const a = formatTimePart(start);
  const b = formatTimePart(end);
  if (a && b) return `${a} - ${b}`;
  return a || b || '—';
}

function parseToMinutes(t) {
  if (t == null || t === '') return null;
  const s = String(t);
  if (s.includes('T')) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.getHours() * 60 + d.getMinutes();
  }
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  return null;
}

function hoursBetweenStartEnd(start, end) {
  const a = parseToMinutes(start);
  const b = parseToMinutes(end);
  if (a == null || b == null) return 0;
  let diff = (b - a) / 60;
  if (diff < 0) diff += 24;
  return diff;
}

function shiftColorFromName(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('sáng')) return 'blue';
  if (n.includes('chiều') || n.includes('chieu')) return 'green';
  if (n.includes('tối') || n.includes('toi') || n.includes('đêm') || n.includes('dem')) return 'purple';
  return 'primary';
}

function mapRowsToByDate(rows) {
  const map = {};
  rows.forEach((row, idx) => {
    const key = normalizeWorkDate(row.workDate);
    if (!key) return;
    if (!map[key]) map[key] = [];
    const noteParts = [row.note, row.additionalWork].filter(Boolean);
    map[key].push({
      id: `shift-${key}-${idx}`,
      name: row.shiftName || 'Ca làm',
      time: formatShiftRange(row.startTime, row.endTime),
      color: shiftColorFromName(row.shiftName),
      location: noteParts.length ? noteParts.join(' · ') : null,
      hours: hoursBetweenStartEnd(row.startTime, row.endTime)
    });
  });
  return map;
}

const DOW_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

function buildWeekDays(weekMonday, byDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekMonday);
    d.setDate(weekMonday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const iso = formatYMD(d);
    const shifts = byDate[iso] || [];
    out.push({
      day: DOW_LABELS[i],
      date: String(d.getDate()),
      dateKey: iso,
      isToday: d.getTime() === today.getTime(),
      isOff: false,
      shifts
    });
  }
  return out;
}

function formatWeekToolbarLabel(weekMonday) {
  const end = new Date(weekMonday);
  end.setDate(weekMonday.getDate() + 6);
  const f = (x) =>
    x.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `Tuần: ${f(weekMonday)} – ${f(end)}`;
}

function emptyWeek(weekMonday) {
  return buildWeekDays(weekMonday, {});
}

/* ---------- Component ---------- */

const KitchenSchedulePage = () => {
  const [viewMode, setViewMode] = useState('week');
  const [weekMonday, setWeekMonday] = useState(() => getMonday(new Date()));
  const [weekSchedule, setWeekSchedule] = useState(() => emptyWeek(getMonday(new Date())));
  const [currentWeek, setCurrentWeek] = useState(() => formatWeekToolbarLabel(getMonday(new Date())));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showSwapModal, setShowSwapModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState('');
  const [swapReason, setSwapReason] = useState('');
  const [selectedManager, setSelectedManager] = useState('');
  const [swapSubmitting, setSwapSubmitting] = useState(false);
  const [swapError, setSwapError] = useState('');
  const [managerList, setManagerList] = useState([]);
  const [managersLoading, setManagersLoading] = useState(false);

  // Load managers khi modal mở
  useEffect(() => {
    if (!showSwapModal) return;
    setManagersLoading(true);
    fetchManagers()
      .then(setManagerList)
      .catch((e) => console.warn('[fetchManagers]', e))
      .finally(() => setManagersLoading(false));
  }, [showSwapModal]);

  const loadWeek = useCallback(async (monday) => {
    setLoading(true);
    setError('');
    const dateParam = formatYMD(monday);
    try {
      const data = await fetchScheduleWeekKitchenWaiter(dateParam);
      const list = extractList(data);
      const byDate = mapRowsToByDate(list);
      const schedule = buildWeekDays(monday, byDate);
      setWeekSchedule(schedule);
      setCurrentWeek(formatWeekToolbarLabel(monday));
    } catch (e) {
      console.error('[schedule-week-kitchen-waiter]', e);
      setError(
        e?.response?.data?.message ||
          e?.message ||
          'Không tải được lịch làm việc. Kiểm tra đăng nhập (Staff/Kitchen) và thử lại.'
      );
      setWeekSchedule(emptyWeek(monday));
      setCurrentWeek(formatWeekToolbarLabel(monday));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWeek(weekMonday);
  }, [weekMonday, loadWeek]);

  const stats = useMemo(() => {
    let shiftCount = 0;
    let totalH = 0;
    weekSchedule.forEach((day) => {
      day.shifts.forEach((s) => {
        shiftCount += 1;
        totalH += s.hours || 0;
      });
    });
    const hRounded = Math.round(totalH * 10) / 10;
    return { shiftCount, totalHours: hRounded };
  }, [weekSchedule]);

  const handlePrevWeek = () => {
    setWeekMonday((prev) => {
      const n = new Date(prev);
      n.setDate(n.getDate() - 7);
      return n;
    });
  };

  const handleNextWeek = () => {
    setWeekMonday((prev) => {
      const n = new Date(prev);
      n.setDate(n.getDate() + 7);
      return n;
    });
  };

  const notifications = [
    {
      id: 1,
      type: 'update',
      title: 'Cập nhật ca làm',
      content: 'Bạn đã được phân công thêm Ca Tối vào Thứ 6 này.',
      time: '10 phút trước',
      isNew: true
    },
    {
      id: 2,
      type: 'approved',
      title: 'Đã phê duyệt',
      content: 'Yêu cầu đổi ca Thứ 3 (17/10) đã được Quản lý chấp nhận.',
      time: '2 giờ trước',
      isNew: false
    },
    {
      id: 3,
      type: 'reminder',
      title: 'Nhắc nhở',
      content: 'Đừng quên check-in đúng giờ cho ca làm hôm nay tại Khu vực VIP.',
      time: 'Hôm qua',
      isNew: false
    }
  ];

  const handleSwapRequest = async () => {
    setSwapError('');
    if (!selectedShift) {
      setSwapError('Vui lòng chọn ca làm việc cần đổi.');
      return;
    }
    if (!swapReason.trim()) {
      setSwapError('Vui lòng nhập lý do đổi ca.');
      return;
    }
    if (!selectedManager) {
      setSwapError('Vui lòng chọn quản lý phê duyệt.');
      return;
    }

    let shiftLabel = '';
    for (const day of weekSchedule) {
      const s = day.shifts.find((sh) => sh.id === selectedShift);
      if (s) {
        shiftLabel = `${day.day} ${day.date} — ${s.name} (${s.time})`;
        break;
      }
    }

    const managerLabel =
      managerList.find((m) => m.value === selectedManager)?.label || selectedManager;

    setSwapSubmitting(true);
    try {
      const senderId = await getSenderIdForNotification();
      if (senderId == null) {
        setSwapError(
          'Không xác định được tài khoản (senderId). Vui lòng đăng nhập lại hoặc kiểm tra hồ sơ nhân viên.'
        );
        return;
      }

      const title = 'Yêu cầu đổi ca làm việc';
      const content = [
        `Ca cần đổi: ${shiftLabel || selectedShift}`,
        `Lý do: ${swapReason.trim()}`,
        `Quản lý phê duyệt dự kiến: ${managerLabel}`
      ].join('\n');

      await notificationAPI.changeWorkShift({
        senderId,
        title,
        content
      });

      setShowSwapModal(false);
      setSelectedShift('');
      setSwapReason('');
      setSelectedManager('');
      emitAppToast('Đã gửi yêu cầu đổi ca. Quản lý sẽ xem xét qua thông báo.', 'success');
    } catch (e) {
      console.error('[change-workshift]', e);
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.title ||
        e?.message ||
        'Gửi yêu cầu thất bại. Thử lại sau.';
      setSwapError(String(msg));
    } finally {
      setSwapSubmitting(false);
    }
  };

  return (
    <div className="kitchen-schedule-page">
      <div className="kitchen-schedule-container">
        <div className="schedule-header">
          <div className="schedule-header-left">
            <h2 className="schedule-title">Lịch làm việc của tôi</h2>
            <p className="schedule-subtitle">
              Lịch ca bếp theo API <code>/Staff/schedule-week-kitchen-waiter</code> — chọn tuần bằng mũi tên.
            </p>
          </div>
          <div className="schedule-view-toggle">
            <button
              type="button"
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              Tháng
            </button>
            <button
              type="button"
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              Tuần
            </button>
            <button
              type="button"
              className={viewMode === 'day' ? 'active' : ''}
              onClick={() => setViewMode('day')}
            >
              Ngày
            </button>
          </div>
        </div>

        {error && (
          <div className="kds-api-error kitchen-schedule-error" role="alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="schedule-content-wrapper">
          <div className="schedule-calendar-section">
            <div className="ksched-surface">
              <div className="ksched-toolbar">
                <button
                  type="button"
                  className="ksched-toolbar-btn"
                  onClick={handlePrevWeek}
                  disabled={loading}
                  aria-label="Tuần trước"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="ksched-toolbar-title">
                  {loading ? 'Đang tải lịch…' : currentWeek}
                </h3>
                <button
                  type="button"
                  className="ksched-toolbar-btn"
                  onClick={handleNextWeek}
                  disabled={loading}
                  aria-label="Tuần sau"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className={`ksched-week-grid${loading ? ' ksched-week-grid--loading' : ''}`}>
                {weekSchedule.map((day, index) => (
                  <div
                    key={day.dateKey || index}
                    className={`ksched-day${day.isToday ? ' ksched-day--today' : ''}`}
                  >
                    <div className="ksched-day__head">
                      <div className="ksched-day__labels">
                        <span className="ksched-day__dow">{day.day}</span>
                        {day.isToday && <span className="ksched-day__badge">Hôm nay</span>}
                      </div>
                      <span className="ksched-day__num">{day.date}</span>
                    </div>
                    <div className="ksched-day__body">
                      {day.isOff ? (
                        <div className="ksched-day__off" aria-label="Nghỉ lễ">
                          NGHỈ LỄ
                        </div>
                      ) : day.shifts.length === 0 ? (
                        <div className="ksched-day__empty">Không có ca</div>
                      ) : (
                        day.shifts.map((shift) => (
                          <div
                            key={shift.id}
                            className={`ksched-shift ksched-shift--${shift.color}${
                              day.isToday ? ' ksched-shift--current' : ''
                            }`}
                          >
                            <p className="ksched-shift__name">{shift.name}</p>
                            <p className="ksched-shift__time">{shift.time}</p>
                            {shift.location && (
                              <div className="ksched-shift__loc">
                                <MapPin size={12} />
                                <span>{shift.location}</span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="schedule-sidebar">
            <button
              type="button"
              className="swap-request-btn"
              onClick={() => {
                setSwapError('');
                setShowSwapModal(true);
              }}
            >
              <ArrowLeftRight size={22} strokeWidth={2.25} />
              Gửi yêu cầu đổi ca
            </button>

            <div className="notifications-card">
              <div className="notifications-header">
                <h3 className="notifications-title">
                  <Bell size={18} />
                  Thông báo & Yêu cầu
                </h3>
                <span className="notifications-badge">3 mới</span>
              </div>
              <div className="notifications-list">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`notification-item ${notif.isNew ? 'new' : ''}`}
                  >
                    <div className="notification-header">
                      <span className={`notification-type ${notif.type}`}>{notif.title}</span>
                      <span className="notification-time">{notif.time}</span>
                    </div>
                    <p className="notification-content">{notif.content}</p>
                  </div>
                ))}
              </div>
              <div className="notifications-footer">
                <button type="button" className="view-all-link">
                  Xem tất cả thông báo
                </button>
              </div>
            </div>

            <div className="stats-card">
              <h4 className="stats-title">Thống kê tuần này (theo API)</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <p className="stat-label">Số ca</p>
                  <p className="stat-value">{stats.shiftCount}</p>
                </div>
                <div className="stat-item">
                  <p className="stat-label">Tổng giờ (ước lượng)</p>
                  <p className="stat-value">
                    {stats.totalHours > 0 ? `${stats.totalHours}h` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showSwapModal && (
          <div
            className="kitchen-modal-overlay"
            onClick={() => {
              if (!swapSubmitting) {
                setShowSwapModal(false);
                setSwapError('');
              }
            }}
          >
            <div className="kitchen-modal swap-modal" onClick={(e) => e.stopPropagation()}>
              <div className="kitchen-modal-header">
                <div className="modal-header-content">
                  <div className="modal-icon primary">
                    <RefreshCw size={24} />
                  </div>
                  <h3 className="kitchen-modal-title">Yêu cầu đổi ca làm việc</h3>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  disabled={swapSubmitting}
                  onClick={() => {
                    setShowSwapModal(false);
                    setSwapError('');
                  }}
                >
                  ×
                </button>
              </div>

              {swapError && (
                <div className="kitchen-schedule-error kds-api-error" role="alert" style={{ margin: '0 24px 12px' }}>
                  <AlertCircle size={18} />
                  <span>{swapError}</span>
                </div>
              )}

              <div className="kitchen-modal-content">
                <div className="kitchen-form-group">
                  <label className="kitchen-form-label">Chọn ca làm cần đổi</label>
                  <select
                    className="kitchen-select"
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value)}
                  >
                    <option value="">-- Chọn ca làm việc trong tuần --</option>
                    {weekSchedule.flatMap((day) =>
                      day.shifts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {day.day} {day.date} — {s.name} ({s.time})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="kitchen-form-group">
                  <label className="kitchen-form-label">Lý do đổi ca</label>
                  <textarea
                    className="kitchen-textarea"
                    placeholder="Vui lòng nhập lý do cụ thể..."
                    rows={4}
                    value={swapReason}
                    onChange={(e) => setSwapReason(e.target.value)}
                  />
                </div>

                <div className="kitchen-form-group">
                  <label className="kitchen-form-label">Chọn quản lý phê duyệt</label>
                  <select
                    className="kitchen-select"
                    value={selectedManager}
                    onChange={(e) => setSelectedManager(e.target.value)}
                  >
                    <option value="">-- Danh sách quản lý --</option>
                    {managersLoading ? (
                      <option value="" disabled>Đang tải…</option>
                    ) : managerList.length === 0 ? (
                      <option value="" disabled>Không tìm thấy quản lý</option>
                    ) : (
                      managerList.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="kitchen-modal-footer">
                <button
                  type="button"
                  className="kitchen-btn secondary"
                  disabled={swapSubmitting}
                  onClick={() => {
                    setShowSwapModal(false);
                    setSwapError('');
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="kitchen-btn primary"
                  disabled={swapSubmitting}
                  onClick={handleSwapRequest}
                >
                  {swapSubmitting ? 'Đang gửi…' : 'Gửi yêu cầu'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenSchedulePage;
