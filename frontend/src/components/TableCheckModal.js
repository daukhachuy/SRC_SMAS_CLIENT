import React, { useState, useEffect, useCallback } from 'react';
import { X, CalendarDays, LayoutGrid, Users, CheckCircle2, Activity, RefreshCw } from 'lucide-react';
import { getTableAvailability } from '../api/tableApi';

const TableCheckModal = ({
  isOpen,
  onClose,
  selectedDate,
  onDateChange,
  selectedShift,
  onShiftChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availabilityData, setAvailabilityData] = useState(null);

  const timeSlots = [
    { value: 'Tất cả', label: 'Tất cả' },
    { value: 'Sáng', label: 'Sáng' },
    { value: 'Trưa', label: 'Trưa' },
    { value: 'Chiều', label: 'Chiều' },
    { value: 'Tối', label: 'Tối' },
  ];

  const fetchAvailability = useCallback(async () => {
    if (!isOpen || !selectedDate) return;

    setLoading(true);
    setError('');
    try {
      const data = await getTableAvailability(selectedDate, selectedShift);
      setAvailabilityData(data?.data || data);
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu availability:', err);
      setError(err?.response?.data?.message || err?.message || 'Không thể lấy dữ liệu bàn');
    } finally {
      setLoading(false);
    }
  }, [isOpen, selectedDate, selectedShift]);

  useEffect(() => {
    if (isOpen) {
      fetchAvailability();
    }
  }, [isOpen, fetchAvailability]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Hôm nay';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });
  };

  const getDisplayData = () => {
    if (!availabilityData) return null;

    if (selectedShift === 'Tất cả') {
      // Aggregate all time slots
      const allReservations = [];
      const allEvents = [];
      let totalGuests = 0;
      let totalBookedTables = 0;
      let totalActiveTables = 0;

      availabilityData.timeSlots?.forEach((slot) => {
        if (slot.reservations) allReservations.push(...slot.reservations);
        if (slot.bookEvents) allEvents.push(...slot.bookEvents);
        if (slot.summary) {
          totalGuests += slot.summary.totalGuests || 0;
          totalBookedTables += slot.summary.totalBookedTables || 0;
          totalActiveTables = slot.summary.activeTables || 0;
        }
      });

      return {
        reservations: allReservations,
        bookEvents: allEvents,
        summary: {
          totalGuests,
          totalBookedTables,
          activeTables: totalActiveTables,
          capacityPercentage: availabilityData.timeSlots?.[0]?.summary?.capacityPercentage || 0,
        },
      };
    }

    // Single time slot
    const slot = availabilityData.timeSlots?.find(
      (s) => s.timeSlotName === selectedShift
    );
    return slot || null;
  };

  const displayData = getDisplayData();

  const totalGuests = displayData?.summary?.totalGuests || 0;
  const totalBookedTables = displayData?.summary?.totalBookedTables || 0;
  const activeTables = displayData?.summary?.activeTables || 0;
  const capacityPercentage = displayData?.summary?.capacityPercentage || 0;

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay-backdrop" onClick={onClose} />
      <div className="table-check-modal">
        {/* Header */}
        <header className="tc-modal-header">
          <div className="tc-header-left">
            <div className="tc-date-picker" onClick={() => document.getElementById('tc-date-input')?.showPicker?.()}>
              <CalendarDays size={18} className="tc-date-icon-svg" />
              <span className="tc-date-label">{formatDate(selectedDate)}</span>
              <span className="tc-date-arrow">▼</span>
              <input
                id="tc-date-input"
                type="date"
                className="tc-date-input-hidden"
                value={selectedDate || ''}
                onChange={(e) => onDateChange(e.target.value)}
              />
            </div>
            <div className="tc-shift-select-wrap">
              <select
                className="tc-shift-select"
                value={selectedShift}
                onChange={(e) => onShiftChange(e.target.value)}
              >
                {timeSlots.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <span className="tc-shift-arrow">▼</span>
            </div>
            <button
              className="tc-refresh-btn"
              onClick={fetchAvailability}
              disabled={loading}
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
          </div>
          <div className="tc-header-right">
            <div className="tc-header-user hidden-sm">
              
            </div>
            <button
              className="tc-close-btn"
              type="button"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Body */}
        <main className="tc-modal-body">
          {loading && !displayData ? (
            <div className="tc-loading-state">
              <div className="tc-spinner"></div>
              <p>Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="tc-error-state">
              <p>{error}</p>
              <button onClick={fetchAvailability}>Thử lại</button>
            </div>
          ) : (
            <>
              {/* Left Column: Đơn đặt bàn */}
              <section className="tc-col">
                <div className="tc-col-header">
                  <div className="tc-col-title-row">
                    <div className="tc-col-indicator" style={{ background: '#ff6c1f' }} />
                    <h2 className="tc-col-title">Đơn đặt bàn</h2>
                  </div>
                  <span className="tc-col-badge">
                    {displayData?.reservations?.length || 0} đơn mới
                  </span>
                </div>
                <div className="tc-col-table-wrap">
                  <table className="tc-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Giờ đặt</th>
                        <th className="tc-th-center">Số lượng người</th>
                        <th>Người đặt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayData?.reservations?.length ? (
                        displayData.reservations.slice(0, 10).map((booking, idx) => (
                          <tr key={booking.id || idx} className="tc-table-row">
                            <td className="tc-code-primary">
                              #{booking.reservationCode || booking.bookingCode || booking.code || booking.id}
                            </td>
                            <td className="tc-time-cell">
                              {booking.reservationTime || booking.time || booking.startTime || '—'}
                            </td>
                            <td className="tc-th-center">
                              <span className="tc-pill">
                                {booking.numberOfGuests || booking.guestCount || booking.quantity || 0}
                              </span>
                            </td>
                            <td className="tc-name-cell">
                              {booking.customerName || booking.name || booking.guestName || '—'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="tc-empty-row">Không có đơn đặt bàn nào</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Right Column: Đơn sự kiện */}
              <section className="tc-col">
                <div className="tc-col-header">
                  <div className="tc-col-title-row">
                    <div className="tc-col-indicator" style={{ background: '#006590' }} />
                    <h2 className="tc-col-title">Đơn sự kiện</h2>
                  </div>
                  <span className="tc-col-badge tc-col-badge-tertiary">
                    {displayData?.bookEvents?.length || 0} hôm nay
                  </span>
                </div>
                <div className="tc-col-table-wrap">
                  <table className="tc-table">
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Giờ đặt</th>
                        <th className="tc-th-center">Số lượng bàn</th>
                        <th>Người đặt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayData?.bookEvents?.length ? (
                        displayData.bookEvents.slice(0, 10).map((event, idx) => (
                          <tr key={event.id || idx} className="tc-table-row">
                            <td className="tc-code-tertiary">
                              #{event.bookingCode || event.eventCode || event.code || event.id}
                            </td>
                            <td className="tc-time-cell">
                              {event.reservationTime || event.time || event.startTime || '—'}
                            </td>
                            <td className="tc-th-center">
                              <span className="tc-pill tc-pill-tertiary">
                                {event.tableCount || event.numberOfTables || event.tables || 0}
                              </span>
                            </td>
                            <td className="tc-name-cell">
                              {event.customerName || event.companyName || event.name || event.contactName || '—'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="tc-empty-row">Không có đơn sự kiện nào</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </main>

        {/* Footer Summary */}
        <footer className="tc-modal-footer">
          <div className="tc-summary-grid">
              <div className="tc-summary-card">
                <div className="tc-summary-icon-wrap" style={{ background: 'rgba(255,108,31,0.1)' }}>
                  <Users size={18} style={{ color: '#ff6c1f' }} />
                </div>
                <p className="tc-summary-label">Tổng khách đặt</p>
                <div className="tc-summary-value-row">
                  <span className="tc-summary-big">{totalGuests}</span>
                  <span className="tc-summary-unit">người</span>
                </div>
              </div>

              <div className="tc-summary-card">
                <div className="tc-summary-icon-wrap" style={{ background: 'rgba(148,73,38,0.15)' }}>
                  <LayoutGrid size={18} style={{ color: '#944926' }} />
                </div>
                <p className="tc-summary-label">Tổng bàn đặt</p>
                <div className="tc-summary-value-row">
                  <span className="tc-summary-big">{totalBookedTables}</span>
                  <span className="tc-summary-unit">bàn</span>
                </div>
              </div>

              <div className="tc-summary-card">
                <div className="tc-summary-icon-wrap" style={{ background: 'rgba(0,101,144,0.1)' }}>
                  <CheckCircle2 size={18} style={{ color: '#006590' }} />
                </div>
                <p className="tc-summary-label">Đang hoạt động</p>
                <div className="tc-summary-value-row">
                  <span className="tc-summary-big">{activeTables}</span>
                  <span className="tc-summary-unit">bàn</span>
                </div>
              </div>

              <div className="tc-summary-card">
                <div className="tc-summary-icon-wrap" style={{ background: 'rgba(29,27,25,0.05)' }}>
                  <Activity size={18} style={{ color: '#1d1b19' }} />
                </div>
                <p className="tc-summary-label">Công suất đạt</p>
                <div className="tc-summary-value-row tc-summary-capacity">
                  <span className="tc-summary-big">{capacityPercentage}</span>
                  <span className="tc-summary-unit">/ 100%</span>
                  <div className="tc-progress-bar">
                    <div
                      className="tc-progress-fill"
                      style={{ width: `${capacityPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </footer>
      </div>
    </>
  );
};

export default TableCheckModal;
