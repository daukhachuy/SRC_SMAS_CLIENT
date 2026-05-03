import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardList, LayoutGrid } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useRoleSectionBasePath } from '../../hooks/useRoleSectionBasePath';
import { getWaiterTables } from '../../api/waiterApiTable';
import { eventBookingAPI } from '../../api/managerApi';
import TableCheckModal from '../../components/TableCheckModal';
import '../../styles/ManagerEventTableSelectionPage.css';

/** Lấy text lỗi từ response ASP.NET / axios (message, Message, title, errors). */
const pickBookEventCheckInMessage = (err, fallback) => {
  const data = err?.response?.data;
  if (typeof data === 'string' && data.trim()) return data.trim();
  const direct =
    (typeof data?.message === 'string' && data.message.trim()) ||
    (typeof data?.Message === 'string' && data.Message.trim()) ||
    (typeof data?.title === 'string' && data.title.trim());
  if (direct) return direct;
  if (data?.errors && typeof data.errors === 'object') {
    const parts = [];
    Object.values(data.errors).forEach((v) => {
      if (Array.isArray(v)) parts.push(...v.map(String));
      else if (v != null) parts.push(String(v));
    });
    const joined = parts.filter(Boolean).join(' ').trim();
    if (joined) return joined;
  }
  const status = err?.response?.status;
  const generic = err?.message;
  if (typeof generic === 'string' && generic.trim() && !/^request failed with status code/i.test(generic)) {
    return generic.trim();
  }
  return fallback + (status ? ` (${status})` : '');
};

const ManagerEventTableSelectionPage = () => {
  const { base } = useRoleSectionBasePath();
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const bookingCode = String(searchParams.get('bookingCode') || '').trim();
  const requiredTables = Number(searchParams.get('requiredTables') || 0);

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uiNotice, setUiNotice] = useState(null); // { text: string, variant: 'ok'|'err' }
  const [selectedTableIds, setSelectedTableIds] = useState([]);

  const [tableCheckModal, setTableCheckModal] = useState(false);
  const [tableCheckDate, setTableCheckDate] = useState(new Date().toISOString().split('T')[0]);
  const [tableCheckShift, setTableCheckShift] = useState('Tất cả');

  useEffect(() => {
    if (!uiNotice?.text) return undefined;
    const ms = uiNotice.variant === 'err' ? 12000 : 3200;
    const timer = setTimeout(() => setUiNotice(null), ms);
    return () => clearTimeout(timer);
  }, [uiNotice]);

  const reloadTables = async () => {
    try {
      setLoading(true);
      const data = await getWaiterTables();
      const mapped = Array.isArray(data)
        ? data.map((t) => ({
            id: t.id || t.tableId || t.code || t.tableCode,
            name: t.name,
            code: t.code || t.tableCode || t.id,
            seats: t.seats || t.capacity || t.chairs || 4,
            status: t.status || 'AVAILABLE',
            tableType: t.type || t.tableType || '',
          }))
        : [];
      setTables(mapped);
    } catch (err) {
      setTables([]);
      setUiNotice({ text: 'Không thể tải danh sách bàn.', variant: 'err' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadTables();
  }, []);

  const totalSelectedTables = selectedTableIds.length;
  const totalSeats = useMemo(() => {
    return tables
      .filter((table) => selectedTableIds.includes(table.id))
      .reduce((sum, table) => sum + Number(table.seats || 0), 0);
  }, [selectedTableIds, tables]);

  const backToEventDetail = () => {
    const q = bookingCode ? `?bookingCode=${encodeURIComponent(bookingCode)}` : '';
    navigate(`${base}/reservations/${eventId}${q}`);
  };

  const confirmSelection = async () => {
    if (!selectedTableIds.length) {
      setUiNotice({ text: 'Vui lòng chọn ít nhất 1 bàn cho sự kiện.', variant: 'err' });
      return;
    }
    if (requiredTables > 0 && selectedTableIds.length !== requiredTables) {
      setUiNotice({
        text: `Vui lòng chọn đúng ${requiredTables} bàn theo số lượng bàn của sự kiện.`,
        variant: 'err',
      });
      return;
    }
    const eventIdNumber = Number(eventId);
    if (!Number.isFinite(eventIdNumber) || eventIdNumber <= 0) {
      setUiNotice({ text: 'Mã sự kiện không hợp lệ.', variant: 'err' });
      return;
    }
    const tableIds = selectedTableIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
    if (!tableIds.length) {
      setUiNotice({ text: 'Danh sách bàn không hợp lệ.', variant: 'err' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await eventBookingAPI.checkIn(eventIdNumber, { tableIds });
      const successMsg =
        (typeof res?.data?.message === 'string' && res.data.message.trim()) ||
        (typeof res?.data?.Message === 'string' && res.data.Message.trim()) ||
        'Check-in sự kiện thành công.';
      setUiNotice({ text: successMsg, variant: 'ok' });
      sessionStorage.setItem(
        `manager:event-table-selection:${eventId}`,
        JSON.stringify({
          eventId,
          bookingCode,
          selectedTableIds: tableIds,
        })
      );
      setTimeout(() => {
        backToEventDetail();
      }, 550);
    } catch (err) {
      const msg = pickBookEventCheckInMessage(err, 'Không thể check-in sự kiện.');
      setUiNotice({ text: msg, variant: 'err' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="manager-event-table-page">
      {uiNotice?.text && (
        <div
          className={`manager-event-table-notice ${
            uiNotice.variant === 'err' ? 'manager-event-table-notice--err' : ''
          }`}
          role="alert"
        >
          {uiNotice.text}
        </div>
      )}
      <div className="manager-event-table-header">
        <h2>Chọn bàn phục vụ sự kiện</h2>
        <p>
          Sự kiện: <strong>{bookingCode || `#${eventId}`}</strong>
        </p>
        {requiredTables > 0 && (
          <p>
            Chọn bàn phục vụ: <strong>{selectedTableIds.length}/{requiredTables} bàn</strong>
          </p>
        )}
      </div>

      <div className="manager-event-table-shell">
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              <LayoutGrid size={20} />
            </div>
            <div>
              <h3 className="modal-title">
                Chọn bàn phục vụ {requiredTables > 0 ? `(${selectedTableIds.length}/${requiredTables} bàn)` : ''}
              </h3>
              <p className="modal-subtitle">
                {requiredTables > 0
                  ? `Vui lòng chọn đúng ${requiredTables} bàn theo sự kiện`
                  : 'Chọn các bàn cần phục vụ cho sự kiện'}
              </p>
            </div>
          </div>
        </div>

        <div className="table-legend">
          <div className="legend-item">
            <span className="legend-box empty" /> Bàn trống
          </div>
          <div className="legend-item">
            <span className="legend-box occupied" /> Đang có khách
          </div>
          <div className="legend-item">
            <span className="legend-box selected" /> Đang được chọn
          </div>
          <div className="legend-item">
            <span className="legend-box event-locked" /> Loại bàn sự kiện
          </div>
        </div>

        <div className="table-picker-body">
          <div className="table-grid">
            {loading ? (
              <div className="manager-event-table-loading">Đang tải danh sách bàn...</div>
            ) : (
              tables.map((table) => {
                const isSelected = selectedTableIds.includes(table.id);
                const status = String(table.status || '').trim().toUpperCase();
                const isAvailable = status === 'AVAILABLE';
                const isOpen = status === 'OPEN';
                const isOccupied = isOpen || status === 'OCCUPIED';
                const tableTypeRaw = String(table.tableType || '').trim().toLowerCase();
                const isEventType =
                  tableTypeRaw === 'event' ||
                  tableTypeRaw === 'even' ||
                  tableTypeRaw.includes('sự kiện') ||
                  tableTypeRaw.includes('su kien') ||
                  status === 'EVENT' ||
                  status === 'EVEN';
                const tableTypeLabel = isEventType ? 'Sự kiện' : status;
                let tableClass = 'table-empty';
                if (isEventType) tableClass = 'table-event-locked';
                else if (isOccupied) tableClass = 'table-occupied';
                else if (isSelected) tableClass = 'table-selected';
                const disabled = !isAvailable || isEventType;

                return (
                  <button
                    key={table.id}
                    type="button"
                    className={`table-item ${tableClass}`}
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      setSelectedTableIds((prev) => (
                        prev.includes(table.id)
                          ? prev.filter((id) => id !== table.id)
                          : [...prev, table.id]
                      ));
                    }}
                  >
                    {isEventType && <span className="table-badge event">Sự kiện</span>}
                    <strong>{table.name || table.id}</strong>
                    <span>{table.seats} ghế</span>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      {isEventType
                        ? 'Sự kiện'
                        : status === 'AVAILABLE'
                          ? 'Bàn trống'
                          : status === 'OPEN'
                            ? 'Đang có khách'
                            : tableTypeLabel}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="table-picker-summary">
          <div className="summary-left">
            <div>
              <span>Bàn đã chọn:</span>
              <strong>{selectedTableIds.length ? selectedTableIds.join(', ') : 'Chưa chọn'}</strong>
            </div>
          </div>
          <p>
            Tổng cộng: <strong>{totalSelectedTables} bàn</strong> | Sức chứa: <strong>{totalSeats} khách</strong>
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={backToEventDetail} type="button">
            <ArrowLeft size={16} />
            Quay lại sự kiện
          </button>
          <button className="btn-add-outline" onClick={() => setTableCheckModal(true)} type="button">
            <ClipboardList size={16} />
            Kiểm Tra Bàn
          </button>
          <button className="btn-continue" onClick={confirmSelection} type="button" disabled={submitting}>
            {submitting ? 'Đang xác nhận...' : 'Xác nhận chọn bàn'}
            <CheckCircle2 size={18} />
          </button>
        </div>
      </div>

      <TableCheckModal
        isOpen={tableCheckModal}
        onClose={() => setTableCheckModal(false)}
        selectedDate={tableCheckDate}
        onDateChange={setTableCheckDate}
        selectedShift={tableCheckShift}
        onShiftChange={setTableCheckShift}
      />
    </div>
  );
};

export default ManagerEventTableSelectionPage;

