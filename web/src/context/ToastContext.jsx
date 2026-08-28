import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react';
import './ToastContext.css';

export const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const DEFAULT_DURATION = 5000;

/**
 * Lightweight toast system.
 *
 * Toasts are announced to assistive technology through a polite live region,
 * and every toast is dismissible by keyboard as well as pointer.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (toast) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const entry = {
        id,
        variant: toast.variant || 'info',
        title: toast.title || '',
        message: toast.message || '',
        duration: toast.duration ?? DEFAULT_DURATION,
      };

      setToasts((current) => [...current, entry]);

      if (entry.duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), entry.duration)
        );
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      toast: push,
      success: (message, title) => push({ variant: 'success', message, title }),
      error: (message, title) => push({ variant: 'error', message, title }),
      warning: (message, title) => push({ variant: 'warning', message, title }),
      info: (message, title) => push({ variant: 'info', message, title }),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="toast-viewport" role="region" aria-label="Notifications">
        <div aria-live="polite" aria-atomic="false" className="toast-list">
          {toasts.map((toast) => {
            const Icon = ICONS[toast.variant] || Info;
            return (
              <div key={toast.id} className={`toast toast--${toast.variant}`}>
                <Icon className="toast__icon" size={20} aria-hidden="true" />
                <div className="toast__body">
                  {toast.title ? <p className="toast__title">{toast.title}</p> : null}
                  <p className="toast__message">{toast.message}</p>
                </div>
                <button
                  type="button"
                  className="toast__close"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
}
