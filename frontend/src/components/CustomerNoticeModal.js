import React, { useEffect } from 'react';
import { UtensilsCrossed, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import '../styles/CustomerNoticeModal.css';

const VARIANT_META = {
  default: { Icon: Info, className: 'cnm-icon--default' },
  info: { Icon: Info, className: 'cnm-icon--info' },
  success: { Icon: CheckCircle2, className: 'cnm-icon--success' },
  warning: { Icon: AlertTriangle, className: 'cnm-icon--warning' },
  danger: { Icon: AlertTriangle, className: 'cnm-icon--danger' },
};

/**
 * Thông báo / xác nhận cho khách (thay alert & confirm mặc định trình duyệt).
 * kind: 'alert' | 'confirm'
 */
const CustomerNoticeModal = ({ config, onRequestClose }) => {
  useEffect(() => {
    if (!config) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onRequestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [config, onRequestClose]);

  if (!config) return null;

  const {
    kind = 'alert',
    title = 'Thông báo',
    message = '',
    variant = 'info',
    confirmLabel,
    cancelLabel,
    onConfirm,
    afterClose,
  } = config;

  const meta = VARIANT_META[variant] || VARIANT_META.info;
  const Icon = meta.Icon;

  const handlePrimary = () => {
    if (kind === 'confirm' && typeof onConfirm === 'function') {
      onConfirm();
    }
    onRequestClose();
    if (kind === 'alert' && typeof afterClose === 'function') {
      afterClose();
    }
  };

  const handleCancel = () => {
    onRequestClose();
  };

  const primaryLabel =
    confirmLabel || (kind === 'confirm' ? 'Đồng ý' : 'Đã hiểu');
  const secondaryLabel = cancelLabel || 'Hủy';

  return (
    <div
      className="cnm-overlay"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && handleCancel()}
    >
      <div
        className="cnm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cnm-title"
        aria-describedby="cnm-message"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cnm-glow" aria-hidden />
        <div className="cnm-brand">
          <UtensilsCrossed size={18} strokeWidth={2.2} />
          <span>Nhà hàng</span>
        </div>
        <div className={`cnm-icon-wrap ${meta.className}`}>
          <Icon size={28} strokeWidth={2} aria-hidden />
        </div>
        <h2 id="cnm-title" className="cnm-title">
          {title}
        </h2>
        <p id="cnm-message" className="cnm-message">
          {message}
        </p>
        <div className={`cnm-actions ${kind === 'confirm' ? 'cnm-actions--split' : ''}`}>
          {kind === 'confirm' && (
            <button type="button" className="cnm-btn cnm-btn--ghost" onClick={handleCancel}>
              {secondaryLabel}
            </button>
          )}
          <button
            type="button"
            className={`cnm-btn ${kind === 'confirm' && variant === 'danger' ? 'cnm-btn--danger' : 'cnm-btn--primary'}`}
            onClick={handlePrimary}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerNoticeModal;
