import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import '../styles/ManagerToast.css';

const ManagerToastContext = createContext(null);

/**
 * Toast góc phải — dùng trong khu /manager (theme --manager-*).
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='info']
 */
export function ManagerToastProvider({ children }) {
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
    <ManagerToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className={`mgr-toast mgr-toast--${toast.type}`}
          role="alert"
          aria-live="polite"
        >
          <span className="mgr-toast-icon" aria-hidden>
            {toast.type === 'success' && <CheckCircle size={20} strokeWidth={2.2} />}
            {toast.type === 'error' && <AlertCircle size={20} strokeWidth={2.2} />}
            {toast.type === 'info' && <Info size={20} strokeWidth={2.2} />}
          </span>
          <p className="mgr-toast-text">{toast.message}</p>
          <button
            type="button"
            className="mgr-toast-close"
            onClick={hideToast}
            aria-label="Đóng thông báo"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </ManagerToastContext.Provider>
  );
}

export function useManagerToast() {
  const ctx = useContext(ManagerToastContext);
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
