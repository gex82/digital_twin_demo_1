import { useEffect, useRef, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useUiStore, type ToastTone } from '../../store/uiStore';
import { useShallow } from 'zustand/react/shallow';

const TONE_STYLE: Record<ToastTone, { border: string; text: string; icon: ReactNode }> = {
  info: {
    border: 'rgba(0,110,255,0.45)',
    text: '#93c5fd',
    icon: <Info size={14} />,
  },
  success: {
    border: 'rgba(16,185,129,0.45)',
    text: '#86efac',
    icon: <CheckCircle2 size={14} />,
  },
  warning: {
    border: 'rgba(208,100,20,0.45)',
    text: '#fdba74',
    icon: <AlertTriangle size={14} />,
  },
  error: {
    border: 'rgba(239,68,68,0.45)',
    text: '#fca5a5',
    icon: <XCircle size={14} />,
  },
};

const DISMISS_AFTER_MS = 5200;

export function ToastStack() {
  const { toasts, dismissToast } = useUiStore(
    useShallow((state) => ({
      toasts: state.toasts,
      dismissToast: state.dismissToast,
    }))
  );
  const timersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const activeIds = new Set(toasts.map((toast) => toast.id));

    for (const toast of toasts) {
      if (timersRef.current[toast.id]) continue;
      timersRef.current[toast.id] = window.setTimeout(() => {
        dismissToast(toast.id);
        delete timersRef.current[toast.id];
      }, DISMISS_AFTER_MS);
    }

    for (const [toastId, timer] of Object.entries(timersRef.current)) {
      if (activeIds.has(toastId)) continue;
      window.clearTimeout(timer);
      delete timersRef.current[toastId];
    }

    return () => {
      for (const timer of Object.values(timersRef.current)) {
        window.clearTimeout(timer);
      }
      timersRef.current = {};
    };
  }, [dismissToast, toasts]);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 78,
        right: 18,
        zIndex: 1600,
        width: 340,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => {
        const toneStyle = TONE_STYLE[toast.tone];
        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              background: 'rgba(7, 23, 46, 0.95)',
              border: `1px solid ${toneStyle.border}`,
              borderRadius: 10,
              boxShadow: '0 10px 26px rgba(0, 0, 0, 0.32)',
              padding: '10px 12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ color: toneStyle.text, marginTop: 1 }}>{toneStyle.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{toast.title}</div>
                <div style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.4 }}>{toast.message}</div>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: 0,
                  marginTop: 1,
                }}
                aria-label="Dismiss toast"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
