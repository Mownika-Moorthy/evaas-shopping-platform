import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, LogIn, ArrowRight } from 'lucide-react';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const closeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showNotification = useCallback(({
    message,
    type = 'info',
    title = '',
    duration = 4000,
    action = null
  }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, title, duration, action };

    setNotifications((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        closeNotification(id);
      }, duration);
    }
    return id;
  }, [closeNotification]);

  const showSuccess = useCallback((message, title = 'Success', action = null) => {
    return showNotification({ message, type: 'success', title, action });
  }, [showNotification]);

  const showError = useCallback((message, title = 'Error', action = null) => {
    return showNotification({ message, type: 'error', title, action });
  }, [showNotification]);

  const showWarning = useCallback((message, title = 'Attention', action = null) => {
    return showNotification({ message, type: 'warning', title, action });
  }, [showNotification]);

  const showInfo = useCallback((message, title = 'Information', action = null) => {
    return showNotification({ message, type: 'info', title, action });
  }, [showNotification]);

  // Intercept any native window.alert to convert localhost dialogs into in-app notifications
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (msg) => {
      const text = String(msg || '');
      if (text.toLowerCase().includes('log in') || text.toLowerCase().includes('login')) {
        showWarning(text, 'Login Required', {
          label: 'Log In',
          to: '/login'
        });
      } else if (text.toLowerCase().includes('error') || text.toLowerCase().includes('failed') || text.toLowerCase().includes('stock')) {
        showError(text);
      } else if (text.toLowerCase().includes('added') || text.toLowerCase().includes('success')) {
        showSuccess(text);
      } else {
        showNotification({ message: text, type: 'info' });
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [showWarning, showError, showSuccess, showNotification]);

  const handleActionClick = (toast) => {
    if (toast.action?.onClick) {
      toast.action.onClick();
    }
    if (toast.action?.to) {
      navigate(toast.action.to);
    }
    closeNotification(toast.id);
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        closeNotification
      }}
    >
      {children}

      {/* Floating Website Toast Notification Box Container */}
      <div
        className="evaas-notification-container"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 100000,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '400px',
          width: 'calc(100vw - 32px)',
          pointerEvents: 'none'
        }}
      >
        {notifications.map((toast) => {
          const isLoginReq = toast.message?.toLowerCase().includes('log in') || toast.title?.toLowerCase().includes('login');

          let icon;
          let accentColor;
          let iconBg;

          switch (toast.type) {
            case 'success':
              icon = <CheckCircle2 size={20} color="#568750" />;
              accentColor = '#568750';
              iconBg = '#EEF6ED';
              break;
            case 'error':
              icon = <AlertCircle size={20} color="#D63B5A" />;
              accentColor = '#D63B5A';
              iconBg = '#FDF0F2';
              break;
            case 'warning':
              icon = isLoginReq ? <LogIn size={20} color="#B84A60" /> : <AlertTriangle size={20} color="#D97706" />;
              accentColor = isLoginReq ? '#D86B80' : '#D97706';
              iconBg = isLoginReq ? '#FDF0F2' : '#FEF3C7';
              break;
            default:
              icon = <Info size={20} color="#4A86C8" />;
              accentColor = '#4A86C8';
              iconBg = '#EFF6FF';
          }

          return (
            <div
              key={toast.id}
              className="evaas-toast-card"
              style={{
                pointerEvents: 'auto',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderRadius: '16px',
                border: `1.5px solid ${accentColor}35`,
                boxShadow: '0 12px 36px rgba(42, 29, 34, 0.12), 0 4px 12px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                position: 'relative',
                animation: 'evaasToastSlideIn 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                transition: 'all 0.25s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', padding: '14px 16px', gap: '12px' }}>
                {/* Icon Badge */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  {icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {toast.title && (
                    <div
                      style={{
                        fontWeight: '700',
                        fontSize: '0.92rem',
                        color: 'var(--dark-text)',
                        marginBottom: '2px'
                      }}
                    >
                      {toast.title}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: '0.86rem',
                      color: 'var(--body-text)',
                      lineHeight: '1.45',
                      wordBreak: 'break-word'
                    }}
                  >
                    {toast.message}
                  </div>

                  {/* Optional Action Button */}
                  {toast.action && (
                    <button
                      onClick={() => handleActionClick(toast)}
                      style={{
                        marginTop: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: accentColor,
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '5px 14px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: `0 3px 10px ${accentColor}40`,
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      {toast.action.label || 'Action'} <ArrowRight size={13} />
                    </button>
                  )}
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => closeNotification(toast.id)}
                  aria-label="Close notification"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--light-text)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background-color 0.2s',
                    flexShrink: 0
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Progress Bar */}
              {toast.duration > 0 && (
                <div
                  style={{
                    height: '3px',
                    width: '100%',
                    backgroundColor: 'rgba(0,0,0,0.05)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      backgroundColor: accentColor,
                      animation: `evaasToastProgress ${toast.duration}ms linear forwards`
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes evaasToastSlideIn {
          from {
            opacity: 0;
            transform: translateY(-16px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes evaasToastProgress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        @media (max-width: 480px) {
          .evaas-notification-container {
            right: 16px !important;
            left: 16px !important;
            top: 16px !important;
            width: auto !important;
          }
        }
      `}</style>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
