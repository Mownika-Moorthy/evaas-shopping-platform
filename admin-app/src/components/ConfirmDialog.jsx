import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmDialog — Modal confirmation dialog
 * Replaces native window.confirm() with a styled modal.
 *
 * Props:
 *   isOpen      — boolean
 *   title       — string
 *   message     — string
 *   onConfirm   — function
 *   onCancel    — function
 *   confirmText — string (default: 'Delete')
 *   type        — 'danger' | 'warning' | 'info'
 */
const ConfirmDialog = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  type = 'danger'
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  if (!isOpen) return null;

  const btnColors = {
    danger:  { bg: '#dc2626', hover: '#b91c1c' },
    warning: { bg: '#d97706', hover: '#b45309' },
    info:    { bg: '#7c3aed', hover: '#6d28d9' }
  };
  const btnStyle = btnColors[type] || btnColors.danger;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99990,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onCancel}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '420px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            padding: '4px'
          }}
        >
          <X size={18} />
        </button>

        {/* Icon + Title */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '50%',
              backgroundColor: type === 'danger' ? '#fee2e2' : type === 'warning' ? '#fef3c7' : '#ede9fe',
              flexShrink: 0
            }}
          >
            <AlertTriangle
              size={20}
              color={type === 'danger' ? '#dc2626' : type === 'warning' ? '#d97706' : '#7c3aed'}
            />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>{title}</h3>
            <p style={{ fontSize: '0.88rem', color: '#6b7280', marginTop: '6px', lineHeight: '1.5' }}>{message}</p>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: '#fff',
              color: '#374151',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.88rem'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: btnStyle.bg,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.88rem',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = btnStyle.hover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = btnStyle.bg}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
