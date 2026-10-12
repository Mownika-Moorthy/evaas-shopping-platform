/**
 * FestivalContext.jsx
 *
 * Fetches the currently active festival sale from the backend every 5 minutes.
 * Provides:
 *   - activeSale       — the primary running sale (or null)
 *   - activeSales      — all running sales (array)
 *   - computePrice(product) — returns { finalPrice, originalPrice, discountPercent, discountAmount, hasSaleDiscount }
 *   - theme            — CSS variable overrides for the active festival theme
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const BACKEND_URL = 'http://localhost:5000';
const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const FestivalContext = createContext(null);

// ── Internal helpers ──────────────────────────────────────────────────────────
const findApplicableSale = (product, sales) => {
  if (!sales || sales.length === 0) return null;
  const productId = product?._id?.toString();
  const category  = (product?.category || '').toLowerCase();

  const productSale = sales.find(
    s => s.applyTo === 'products' &&
      s.targetProducts?.some(id => id.toString() === productId)
  );
  if (productSale) return productSale;

  const categorySale = sales.find(
    s => s.applyTo === 'categories' &&
      s.targetCategories?.map(c => c.toLowerCase()).includes(category)
  );
  if (categorySale) return categorySale;

  return sales.find(s => s.applyTo === 'all') || null;
};

const computeDiscountedPrice = (product, sale) => {
  if (!sale || !product) return {
    finalPrice: product?.price || 0,
    originalPrice: product?.price || 0,
    discountPercent: 0,
    discountAmount: 0,
    hasSaleDiscount: false
  };

  const originalPrice = product.price;
  let discountAmount = 0;

  if (sale.discountType === 'percentage') {
    discountAmount = (originalPrice * sale.discountValue) / 100;
    if (sale.maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, sale.maxDiscountAmount);
    }
  } else {
    discountAmount = sale.discountValue;
  }

  discountAmount = Math.min(discountAmount, originalPrice);
  const finalPrice = Math.max(0, parseFloat((originalPrice - discountAmount).toFixed(2)));
  const discountPercent = parseFloat(((discountAmount / originalPrice) * 100).toFixed(1));

  return {
    finalPrice,
    originalPrice,
    discountAmount: parseFloat(discountAmount.toFixed(2)),
    discountPercent,
    hasSaleDiscount: discountAmount > 0,
    saleName: sale.name,
    saleEmoji: sale.theme?.emoji || '🎉'
  };
};

// ── Festival theme presets ────────────────────────────────────────────────────
export const FESTIVAL_PRESETS = [
  {
    festival: 'Diwali',
    emoji: '🪔',
    primaryColor: '#FF6B00',
    secondaryColor: '#FFD700',
    accentColor: '#E63946',
    bannerText: '✨ Diwali Dhamaka Sale!',
    bannerSubText: 'Light up your wardrobe this Diwali'
  },
  {
    festival: 'Pongal',
    emoji: '🌾',
    primaryColor: '#2D6A2D',
    secondaryColor: '#FFD700',
    accentColor: '#FF8C00',
    bannerText: '🌾 Pongal Porutkal Sale!',
    bannerSubText: 'Celebrate the harvest with great deals'
  },
  {
    festival: 'Aadi',
    emoji: '🌺',
    primaryColor: '#C0392B',
    secondaryColor: '#F39C12',
    accentColor: '#8E44AD',
    bannerText: '🌺 Aadi Festival Sale!',
    bannerSubText: 'Shop the traditional Aadi savings'
  },
  {
    festival: 'Tamil New Year',
    emoji: '🎊',
    primaryColor: '#6C3483',
    secondaryColor: '#F1C40F',
    accentColor: '#E74C3C',
    bannerText: '🎊 Tamil New Year Special!',
    bannerSubText: 'Start the New Year with amazing offers'
  },
  {
    festival: 'Navaratri',
    emoji: '💃',
    primaryColor: '#9B59D6',
    secondaryColor: '#E74C3C',
    accentColor: '#F39C12',
    bannerText: '💃 Navaratri Collection Sale!',
    bannerSubText: 'Dance into the festival season with great deals'
  },
  {
    festival: 'Christmas',
    emoji: '🎄',
    primaryColor: '#C0392B',
    secondaryColor: '#27AE60',
    accentColor: '#F1C40F',
    bannerText: '🎄 Christmas Sale!',
    bannerSubText: 'Spread the joy with festive deals'
  },
  {
    festival: 'Independence Day',
    emoji: '🇮🇳',
    primaryColor: '#FF9933',
    secondaryColor: '#138808',
    accentColor: '#000080',
    bannerText: '🇮🇳 Independence Day Sale!',
    bannerSubText: 'Celebrating freedom with special offers'
  },
  {
    festival: 'Custom',
    emoji: '🎉',
    primaryColor: '#D86B80',
    secondaryColor: '#7EAD76',
    accentColor: '#FFD700',
    bannerText: '🎉 Special Festival Sale!',
    bannerSubText: 'Limited time exclusive offers'
  }
];

// ── Provider ──────────────────────────────────────────────────────────────────
export const FestivalProvider = ({ children }) => {
  const [activeSales, setActiveSales]   = useState([]);
  const [activeSale,  setActiveSale]    = useState(null);
  const [loading,     setLoading]       = useState(true);

  const fetchActiveSales = useCallback(async () => {
    try {
      const res  = await fetch(`${BACKEND_URL}/api/festival/active`);
      const data = await res.json();
      const sales = data.sales || [];
      setActiveSales(sales);
      setActiveSale(sales.length > 0 ? sales[0] : null);
    } catch {
      // Silent fail — no sale active
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveSales();
    const timer = setInterval(fetchActiveSales, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchActiveSales]);

  // Apply CSS variable overrides for festival theme
  useEffect(() => {
    const root = document.documentElement;
    if (activeSale?.theme) {
      const t = activeSale.theme;
      root.style.setProperty('--festival-primary',   t.primaryColor   || '#D86B80');
      root.style.setProperty('--festival-secondary', t.secondaryColor || '#7EAD76');
      root.style.setProperty('--festival-accent',    t.accentColor    || '#FFD700');
      root.style.setProperty('--primary-color',      t.primaryColor   || '#D86B80');
      root.style.setProperty('--pink',               t.primaryColor   || '#D86B80');
      root.style.setProperty('--purple',             t.primaryColor   || '#D86B80');
      root.style.setProperty('--rose-gold',          t.primaryColor   || '#D86B80');
      root.style.setProperty('--rose-gold-dark',     t.primaryColor   || '#D86B80');
      root.setAttribute('data-festival', activeSale.festival.toLowerCase().replace(/\s+/g, '-'));
    } else {
      // Restore default theme
      root.style.removeProperty('--festival-primary');
      root.style.removeProperty('--festival-secondary');
      root.style.removeProperty('--festival-accent');
      root.style.removeProperty('--primary-color');
      root.style.removeProperty('--pink');
      root.style.removeProperty('--purple');
      root.style.removeProperty('--rose-gold');
      root.style.removeProperty('--rose-gold-dark');
      root.removeAttribute('data-festival');
    }
  }, [activeSale]);

  /** Get the festival-adjusted price info for a product */
  const computePrice = useCallback((product) => {
    const sale = findApplicableSale(product, activeSales);
    return computeDiscountedPrice(product, sale);
  }, [activeSales]);

  const theme = activeSale?.theme || null;

  return (
    <FestivalContext.Provider value={{
      activeSale,
      activeSales,
      loading,
      computePrice,
      theme,
      refreshSales: fetchActiveSales
    }}>
      {children}
    </FestivalContext.Provider>
  );
};

/** Convenience hook */
export const useFestival = () => {
  const ctx = useContext(FestivalContext);
  if (!ctx) throw new Error('useFestival must be used inside <FestivalProvider>');
  return ctx;
};
