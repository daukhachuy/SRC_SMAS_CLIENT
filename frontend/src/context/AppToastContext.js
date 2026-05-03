import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { registerAppToast, unregisterAppToast, emitAppToast } from '../utils/appToastBus';
import '../styles/AppToast.css';

const AppToastContext = createContext(null);

export function AppToastProvider({ children }) {
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
    registerAppToast(showToast);
    return () => unregisterAppToast();
  }, [showToast]);

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
    <AppToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className={`app-toast app-toast--${toast.type}`}
          role="alert"
          aria-live="polite"
        >
          <span className="app-toast-icon" aria-hidden>
            {toast.type === 'success' && <CheckCircle size={20} strokeWidth={2.2} />}
            {toast.type === 'error' && <AlertCircle size={20} strokeWidth={2.2} />}
            {toast.type === 'info' && <Info size={20} strokeWidth={2.2} />}
          </span>
          <p className="app-toast-text">{toast.message}</p>
          <button
            type="button"
            className="app-toast-close"
            onClick={hideToast}
            aria-label="Đóng thông báo"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </AppToastContext.Provider>
  );
}

export function useAppToast() {
  const ctx = useContext(AppToastContext);
  if (!ctx) {
    return {
      showToast: emitAppToast,
      hideToast: () => {},
    };
  }
  return ctx;
}
