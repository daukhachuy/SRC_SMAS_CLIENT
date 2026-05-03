import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { playIncomingNotificationSound } from '../utils/uiClickSound';

const AdminToastContext = createContext(null);

/**
 * Toast góc phải — dùng trong khu /admin.
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='info']
 */
export function AdminToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const hideToast = useCallback(() => setToast(null), []);

  const showToast = useCallback((message, type = 'info') => {
    const raw =
      typeof message === 'string'
        ? message
        : String(message?.message ?? message ?? '');
    const text = raw.trim() || '—';
    const t = ['success', 'error', 'info'].includes(type) ? type : 'info';
    setToast({ id: Date.now(), message: text, type: t });
    if (t === 'success' || t === 'info') {
      void playIncomingNotificationSound();
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const ms = toast.type === 'error' ? 5600 : 4200;
    const timer = setTimeout(hideToast, ms);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  const value = useMemo(
    () => ({ showToast, hideToast }),
    [showToast, hideToast]
  );

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className="admin-global-toast">
          <div
            className={`admin-toast-msg admin-toast-msg--${toast.type}`}
            role="alert"
            aria-live="polite"
          >
            <span className="admin-toast-icon" aria-hidden>
              {toast.type === 'success' && <CheckCircle size={20} strokeWidth={2.2} />}
              {toast.type === 'error' && <AlertCircle size={20} strokeWidth={2.2} />}
              {toast.type === 'info' && <Info size={20} strokeWidth={2.2} />}
            </span>
            <p className="admin-toast-text">{toast.message}</p>
            <button
              type="button"
              className="admin-toast-close"
              onClick={hideToast}
              aria-label="Đóng thông báo"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </AdminToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(AdminToastContext);
  if (!ctx) {
    return {
      showToast: (message) => {
        const text =
          typeof message === 'string'
            ? message
            : String(message?.message ?? message ?? '');
        if (typeof window !== 'undefined' && window.alert) window.alert(text);
      },
      hideToast: () => {},
    };
  }
  return ctx;
}
