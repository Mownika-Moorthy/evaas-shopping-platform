/**
 * FestivalBanner.jsx
 *
 * A sticky top announcement banner that appears when a festival sale is active.
 * Animates in/out and displays sale name, discount info, and countdown timer.
 */

import React, { useState, useEffect } from 'react';
import { useFestival } from '../context/FestivalContext';
import { X, Sparkles, Clock } from 'lucide-react';

const FestivalBanner = () => {
  const { activeSale } = useFestival();
  const [dismissed, setDismissed]   = useState(false);
  const [timeLeft,  setTimeLeft]    = useState('');
  const [visible,   setVisible]     = useState(false);

  // Reset dismissed state when a new sale becomes active
  useEffect(() => {
    if (activeSale) {
      setDismissed(false);
      setTimeout(() => setVisible(true), 100);
    } else {
      setVisible(false);
    }
  }, [activeSale?._id]);

  // Countdown to end of sale
  useEffect(() => {
    if (!activeSale) return;

    const tick = () => {
      const diff = new Date(activeSale.endDate) - new Date();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000)  / 60000);
      const s = Math.floor((diff % 60000)    / 1000);
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
      else setTimeLeft(`${m}m ${s}s`);
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [activeSale]);

  if (!activeSale || dismissed) return null;

  const { theme, name, discountType, discountValue } = activeSale;
  const primary   = theme?.primaryColor   || '#D86B80';
  const secondary = theme?.secondaryColor || '#FFD700';
  const accent    = theme?.accentColor    || '#FF6B00';
  const emoji     = theme?.emoji          || '🎉';
  const discountLabel = discountType === 'percentage'
    ? `${discountValue}% OFF`
    : `₹${discountValue} OFF`;

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${primary} 0%, ${accent} 50%, ${secondary} 100%)`,
        color: '#fff',
        padding: '0',
        overflow: 'hidden',
        maxHeight: visible ? '80px' : '0',
        transition: 'max-height 0.5s cubic-bezier(0.4,0,0.2,1)',
        position: 'relative',
        zIndex: 1000,
        boxShadow: `0 4px 20px ${primary}66`
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '10px 48px 10px 16px',
        minHeight: '48px',
        flexWrap: 'wrap'
      }}>
        {/* Animated sparkles */}
        <Sparkles size={18} style={{ flexShrink: 0, animation: 'spin 3s linear infinite' }} />

        {/* Sale name */}
        <span style={{ fontWeight: '800', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
          {emoji} {name}
        </span>

        {/* Discount badge */}
        <span style={{
          background: 'rgba(255,255,255,0.25)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: '20px',
          padding: '2px 12px',
          fontWeight: '900',
          fontSize: '0.9rem',
          backdropFilter: 'blur(8px)',
          whiteSpace: 'nowrap'
        }}>
          🔥 {discountLabel}
        </span>

        {/* Countdown */}
        {timeLeft && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.8rem',
            opacity: 0.9,
            whiteSpace: 'nowrap'
          }}>
            <Clock size={13} />
            Ends in {timeLeft}
          </span>
        )}

        {/* Banner sub text */}
        {theme?.bannerSubText && (
          <span style={{ fontSize: '0.8rem', opacity: 0.85, whiteSpace: 'nowrap' }}>
            — {theme.bannerSubText}
          </span>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss festival banner"
        style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: '50%',
          width: '26px',
          height: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          transition: 'background 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.35)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
      >
        <X size={14} />
      </button>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes marquee { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
      `}</style>
    </div>
  );
};

export default FestivalBanner;
