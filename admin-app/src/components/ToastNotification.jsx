import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * ToastNotification — Global toast system
 * Usage: pass showToast function down as prop and call:
 *   showToast('message', 'success' | 'error' | 'warning' | 'info')
 */

const ICONS = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />
};

const COLORS = {
  success: { bg: '#d1fae5', border: '#059669', color: '#065f46' },
  error:   { bg: '#fee2e2', border: '#dc2626', color: '#7f1d1d' },
  warning: { bg: '#fef3c7', border: '#d97706', color: '#78350f' },
  info:    { bg: '#ede9fe', border: '#7c3aed', color: '#4c1d95' }
};

const ToastItem = ({ toast, onRemove }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const t1 = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 3500);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const style = COLORS[toast.type] || COLORS.info;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        borderRadius: '10px',
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        fontSize: '0.88rem',
        fontWeight: '500',
        minWidth: '280px',
        maxWidth: '380px',
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        cursor: 'pointer'
      }}
      onClick={() => onRemove(toast.id)}
    >
      <span style={{ flexShrink: 0 }}>{ICONS[toast.type]}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <X size={14} style={{ flexShrink: 0, opacity: 0.6 }} />
    </div>
  );
};

const ToastNotification = ({ toasts, onRemove }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
      }}
    >
      {toasts.map(toast => (
        <div key={toast.id} style={{ pointerEvents: 'all' }}>
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
};

export default ToastNotification;

/** Hook to manage toasts */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, showToast, removeToast };
};
