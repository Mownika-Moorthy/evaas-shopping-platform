/**
 * FestivalSaleTab.jsx — Admin Festival Sale Management
 *
 * Features:
 * - List all festival sales (live, upcoming, expired, paused)
 * - Create new sales with festival presets or custom config
 * - Edit existing sales
 * - Toggle active/inactive
 * - Delete sales
 * - Visual preview of how the sale will look to customers
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Plus, Edit2, Trash2, Power, PowerOff, Calendar, Tag, Percent,
  IndianRupee, ChevronDown, ChevronUp, RefreshCw, Clock, ShoppingBag,
  Globe, Eye, EyeOff, Layers
} from 'lucide-react';
import {
  getAllFestivalSales, createFestivalSale, updateFestivalSale,
  deleteFestivalSale, toggleFestivalSaleStatus, getCategories, getAdminProducts
} from '../services/adminService';

// ── Festival Presets ──────────────────────────────────────────────────────────
const FESTIVAL_PRESETS = [
  { festival: 'Diwali',         emoji: '🪔', primaryColor: '#FF6B00', secondaryColor: '#FFD700', accentColor: '#E63946', bannerText: '✨ Diwali Dhamaka Sale!',      bannerSubText: 'Light up your wardrobe this Diwali' },
  { festival: 'Pongal',         emoji: '🌾', primaryColor: '#2D6A2D', secondaryColor: '#FFD700', accentColor: '#FF8C00', bannerText: '🌾 Pongal Porutkal Sale!',     bannerSubText: 'Celebrate the harvest with great deals' },
  { festival: 'Aadi',           emoji: '🌺', primaryColor: '#C0392B', secondaryColor: '#F39C12', accentColor: '#8E44AD', bannerText: '🌺 Aadi Festival Sale!',        bannerSubText: 'Shop the traditional Aadi savings' },
  { festival: 'Tamil New Year', emoji: '🎊', primaryColor: '#6C3483', secondaryColor: '#F1C40F', accentColor: '#E74C3C', bannerText: '🎊 Tamil New Year Special!',    bannerSubText: 'Start the New Year with amazing offers' },
  { festival: 'Navaratri',      emoji: '💃', primaryColor: '#9B59D6', secondaryColor: '#E74C3C', accentColor: '#F39C12', bannerText: '💃 Navaratri Collection Sale!', bannerSubText: 'Dance into the festival season with great deals' },
  { festival: 'Christmas',      emoji: '🎄', primaryColor: '#C0392B', secondaryColor: '#27AE60', accentColor: '#F1C40F', bannerText: '🎄 Christmas Sale!',             bannerSubText: 'Spread the joy with festive deals' },
  { festival: 'Eid',            emoji: '🌙', primaryColor: '#1E7A5C', secondaryColor: '#D4AF37', accentColor: '#E67E22', bannerText: '🌙 Eid Mubarak Sale!',          bannerSubText: 'Celebrate Eid with exclusive offers' },
  { festival: 'Independence Day', emoji: '🇮🇳', primaryColor: '#FF9933', secondaryColor: '#138808', accentColor: '#000080', bannerText: '🇮🇳 Independence Day Sale!',  bannerSubText: 'Celebrating freedom with special offers' },
  { festival: 'Republic Day',   emoji: '🎖️', primaryColor: '#003580', secondaryColor: '#FF9933', accentColor: '#138808', bannerText: '🎖️ Republic Day Offer!',       bannerSubText: 'Honoring the republic with great deals' },
  { festival: 'Onam',           emoji: '🌸', primaryColor: '#2E8B57', secondaryColor: '#FFD700', accentColor: '#FF6347', bannerText: '🌸 Onam Sadhya Sale!',          bannerSubText: 'Celebrate the harvest festival with us' },
  { festival: 'Custom',         emoji: '🎉', primaryColor: '#9B59D6', secondaryColor: '#4A7C59', accentColor: '#FFD700', bannerText: '🎉 Special Festival Sale!',     bannerSubText: 'Limited time exclusive offers' },
];

// ── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    live:     { bg: '#dcfce7', color: '#16a34a', label: '🟢 Live' },
    upcoming: { bg: '#dbeafe', color: '#2563eb', label: '🔵 Upcoming' },
    expired:  { bg: '#f3f4f6', color: '#6b7280', label: '⚫ Expired' },
    paused:   { bg: '#fef9c3', color: '#ca8a04', label: '⏸ Paused' }
  }[status] || { bg: '#f3f4f6', color: '#6b7280', label: status };

  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '0.75rem', fontWeight: '700'
    }}>
      {cfg.label}
    </span>
  );
};

// ── Countdown ─────────────────────────────────────────────────────────────────
const Countdown = ({ endDate, status }) => {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (status !== 'live') return;
    const tick = () => {
      const diff = new Date(endDate) - new Date();
      if (diff <= 0) { setLabel('Ended'); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setLabel(d > 0 ? `${d}d ${h}h left` : `${h}h ${m}m left`);
    };
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, [endDate, status]);
  if (status !== 'live') return null;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#16a34a', fontWeight: '600' }}>
      <Clock size={13} /> {label}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const FestivalSaleTab = ({ showToast, confirmDialog }) => {
  const [sales,      setSales]       = useState([]);
  const [loading,    setLoading]     = useState(true);
  const [showForm,   setShowForm]    = useState(false);
  const [editSale,   setEditSale]    = useState(null);
  const [categories, setCategories]  = useState([]);
  const [products,   setProducts]    = useState([]);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [saleData, catData, prodData] = await Promise.all([
        getAllFestivalSales(),
        getCategories(),
        getAdminProducts({ limit: 200 })
      ]);
      setSales(saleData.sales || []);
      setCategories(catData.categories || catData || []);
      setProducts(prodData.products || prodData || []);
    } catch (err) {
      showToast('Failed to load data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Toggle Status ─────────────────────────────────────────────────────────
  const handleToggle = async (sale) => {
    try {
      await toggleFestivalSaleStatus(sale._id);
      showToast(`Sale "${sale.name}" ${sale.isActive ? 'deactivated' : 'activated'}.`, 'success');
      fetchAll();
    } catch (err) {
      showToast('Toggle failed: ' + err.message, 'error');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (sale) => {
    confirmDialog(
      'Delete Festival Sale',
      `Are you sure you want to delete "${sale.name}"? This cannot be undone.`,
      async () => {
        try {
          await deleteFestivalSale(sale._id);
          showToast(`Sale "${sale.name}" deleted.`, 'success');
          fetchAll();
        } catch (err) {
          showToast('Delete failed: ' + err.message, 'error');
        }
      },
      'Delete', 'danger'
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e1b4b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={22} color="#9B59D6" /> Festival Sale Management
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.88rem', marginTop: '4px' }}>
            Create and manage festival discounts — Diwali, Pongal, Aadi, Tamil New Year &amp; more
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchAll} style={btnStyle('#f3f4f6', '#374151')} title="Refresh">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => { setEditSale(null); setShowForm(true); }} style={btnStyle('#9B59D6', '#fff')}>
            <Plus size={15} /> Create Sale
          </button>
        </div>
      </div>

      {/* Live Status Summary */}
      <LiveSummary sales={sales} />

      {/* Sale Form Modal */}
      {showForm && (
        <SaleFormModal
          editSale={editSale}
          categories={categories}
          products={products}
          onClose={() => { setShowForm(false); setEditSale(null); }}
          onSaved={() => { setShowForm(false); setEditSale(null); fetchAll(); }}
          showToast={showToast}
        />
      )}

      {/* Sales List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '12px' }}>Loading festival sales…</p>
        </div>
      ) : sales.length === 0 ? (
        <EmptyState onCreate={() => setShowForm(true)} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sales.map(sale => (
            <SaleCard
              key={sale._id}
              sale={sale}
              onToggle={handleToggle}
              onEdit={() => { setEditSale(sale); setShowForm(true); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Live Summary Bar ──────────────────────────────────────────────────────────
const LiveSummary = ({ sales }) => {
  const live     = sales.filter(s => s.status === 'live').length;
  const upcoming = sales.filter(s => s.status === 'upcoming').length;
  const expired  = sales.filter(s => s.status === 'expired').length;

  return (
    <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
      {[
        { label: 'Live Now', count: live,     color: '#16a34a', bg: '#dcfce7', icon: '🟢' },
        { label: 'Upcoming', count: upcoming, color: '#2563eb', bg: '#dbeafe', icon: '🔵' },
        { label: 'Expired',  count: expired,  color: '#6b7280', bg: '#f3f4f6', icon: '⚫' },
        { label: 'Total',    count: sales.length, color: '#9B59D6', bg: '#f3e8ff', icon: '📋' }
      ].map(s => (
        <div key={s.label} style={{ flex: '1 1 120px', background: s.bg, borderRadius: '12px', padding: '14px 18px', minWidth: '120px' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: s.color }}>{s.count}</div>
          <div style={{ fontSize: '0.8rem', color: s.color, fontWeight: '600' }}>{s.icon} {s.label}</div>
        </div>
      ))}
    </div>
  );
};

// ── Sale Card ─────────────────────────────────────────────────────────────────
const SaleCard = ({ sale, onToggle, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const primary = sale.theme?.primaryColor   || '#9B59D6';
  const accent  = sale.theme?.accentColor    || '#FF6B00';
  const emoji   = sale.theme?.emoji          || '🎉';

  const discountLabel = sale.discountType === 'percentage'
    ? `${sale.discountValue}% OFF`
    : `₹${sale.discountValue} OFF`;

  const scopeLabel = {
    all:        '🌍 All Products',
    categories: `📂 ${sale.targetCategories?.join(', ') || 'Selected Categories'}`,
    products:   `📦 ${sale.targetProducts?.length || 0} Products`
  }[sale.applyTo] || 'All';

  return (
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      border: `2px solid ${sale.status === 'live' ? primary + '50' : '#e5e7eb'}`,
      overflow: 'hidden',
      boxShadow: sale.status === 'live' ? `0 4px 20px ${primary}20` : '0 1px 4px rgba(0,0,0,0.05)',
      transition: 'all 0.2s'
    }}>
      {/* Festival Color Strip */}
      {sale.status === 'live' && (
        <div style={{
          height: '5px',
          background: `linear-gradient(90deg, ${primary}, ${accent}, ${primary})`
        }} />
      )}

      <div style={{ padding: '1.1rem 1.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Left: Title & meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.5rem' }}>{emoji}</span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#1e1b4b', margin: 0 }}>{sale.name}</h3>
              <StatusBadge status={sale.status} />
              <Countdown endDate={sale.endDate} status={sale.status} />
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.82rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Tag size={13} /> {sale.festival}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={13} />
                {new Date(sale.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })} —
                {new Date(sale.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
              </span>
              <span style={{ fontSize: '0.82rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Layers size={13} /> {scopeLabel}
              </span>
            </div>

            {/* Discount highlight */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                background: `linear-gradient(135deg, ${accent}, ${primary})`,
                color: '#fff',
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '900',
                letterSpacing: '0.5px'
              }}>
                🔥 {discountLabel}
              </span>
              {sale.maxDiscountAmount > 0 && (
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Max ₹{sale.maxDiscountAmount}</span>
              )}
              {sale.minOrderAmount > 0 && (
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Min ₹{sale.minOrderAmount}</span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => onToggle(sale)}
              title={sale.isActive ? 'Deactivate' : 'Activate'}
              style={btnStyle(sale.isActive ? '#dcfce7' : '#fee2e2', sale.isActive ? '#16a34a' : '#dc2626')}
            >
              {sale.isActive ? <Power size={15} /> : <PowerOff size={15} />}
            </button>
            <button onClick={onEdit} style={btnStyle('#eff6ff', '#2563eb')} title="Edit">
              <Edit2 size={15} />
            </button>
            <button onClick={() => onDelete(sale)} style={btnStyle('#fef2f2', '#dc2626')} title="Delete">
              <Trash2 size={15} />
            </button>
            <button onClick={() => setExpanded(e => !e)} style={btnStyle('#f9fafb', '#374151')}>
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>

        {/* Expanded: Customer Preview */}
        {expanded && (
          <div style={{ marginTop: '14px', borderTop: '1px solid #f3f4f6', paddingTop: '14px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>
              👁️ Customer Preview
            </div>
            <div style={{
              background: `linear-gradient(135deg, ${primary}, ${accent})`,
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontSize: '1.4rem' }}>✨</span>
              <div>
                <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{emoji} {sale.name}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>{sale.theme?.bannerSubText || 'Limited time festival offer!'}</div>
              </div>
              <span style={{
                marginLeft: 'auto',
                background: 'rgba(255,255,255,0.25)',
                border: '1px solid rgba(255,255,255,0.5)',
                borderRadius: '20px',
                padding: '3px 14px',
                fontWeight: '900',
                fontSize: '0.88rem'
              }}>
                🔥 {discountLabel}
              </span>
            </div>

            {/* Theme Colors */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Theme:</span>
              {[sale.theme?.primaryColor, sale.theme?.secondaryColor, sale.theme?.accentColor].map((c, i) => (
                c && <div key={i} style={{ width: '22px', height: '22px', borderRadius: '50%', background: c, border: '2px solid #e5e7eb' }} title={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Empty State ───────────────────────────────────────────────────────────────
const EmptyState = ({ onCreate }) => (
  <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#fff', borderRadius: '16px', border: '2px dashed #e5e7eb' }}>
    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>No Festival Sales Yet</h3>
    <p style={{ color: '#6b7280', marginBottom: '20px' }}>Create your first festival sale to show discounts to customers during special occasions.</p>
    <button onClick={onCreate} style={{ ...btnStyle('#9B59D6', '#fff'), padding: '10px 24px', fontSize: '0.9rem' }}>
      <Plus size={16} /> Create Your First Sale
    </button>
  </div>
);

// ── Sale Form Modal ───────────────────────────────────────────────────────────
const DEFAULT_FORM = {
  name: '', festival: 'Diwali', description: '',
  discountType: 'percentage', discountValue: 20, maxDiscountAmount: 0, minOrderAmount: 0,
  startDate: '', endDate: '',
  applyTo: 'all', targetCategories: [], targetProducts: [],
  theme: {
    primaryColor: '#FF6B00', secondaryColor: '#FFD700', accentColor: '#E63946',
    bannerText: '✨ Diwali Dhamaka Sale!', bannerSubText: 'Light up your wardrobe this Diwali', emoji: '🪔'
  },
  isActive: true
};

const SaleFormModal = ({ editSale, categories, products, onClose, onSaved, showToast }) => {
  const [form,    setForm]    = useState(() => {
    if (editSale) {
      return {
        ...editSale,
        startDate: editSale.startDate ? new Date(editSale.startDate).toISOString().slice(0, 16) : '',
        endDate:   editSale.endDate   ? new Date(editSale.endDate).toISOString().slice(0, 16) : '',
      };
    }
    return { ...DEFAULT_FORM };
  });
  const [saving,  setSaving]  = useState(false);

  const applyPreset = (preset) => {
    setForm(f => ({
      ...f,
      festival: preset.festival,
      name: f.name || `${preset.festival} Sale ${new Date().getFullYear()}`,
      theme: {
        primaryColor:   preset.primaryColor,
        secondaryColor: preset.secondaryColor,
        accentColor:    preset.accentColor,
        bannerText:     preset.bannerText,
        bannerSubText:  preset.bannerSubText,
        emoji:          preset.emoji
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { showToast('Sale name is required.', 'error'); return; }
    if (!form.startDate || !form.endDate) { showToast('Start and end dates are required.', 'error'); return; }
    if (new Date(form.startDate) >= new Date(form.endDate)) { showToast('End date must be after start date.', 'error'); return; }
    if (form.discountValue <= 0) { showToast('Discount value must be greater than 0.', 'error'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        discountValue:    Number(form.discountValue),
        maxDiscountAmount: Number(form.maxDiscountAmount),
        minOrderAmount:    Number(form.minOrderAmount),
        startDate: new Date(form.startDate).toISOString(),
        endDate:   new Date(form.endDate).toISOString()
      };

      if (editSale) {
        await updateFestivalSale(editSale._id, payload);
        showToast('Festival sale updated!', 'success');
      } else {
        await createFestivalSale(payload);
        showToast('Festival sale created!', 'success');
      }
      onSaved();
    } catch (err) {
      showToast('Save failed: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setTheme = (key, val) => setForm(f => ({ ...f, theme: { ...f.theme, [key]: val } }));

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '20px', overflowY: 'auto', backdropFilter: 'blur(4px)'
    }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '720px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)', overflow: 'hidden',
        margin: 'auto'
      }}>
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #2D1B69, #9B59D6)',
          padding: '1.25rem 1.5rem', color: '#fff'
        }}>
          <h2 style={{ margin: 0, fontWeight: '800', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} /> {editSale ? 'Edit Festival Sale' : 'Create Festival Sale'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.83rem', opacity: 0.8 }}>
            Configure discount, dates, scope, and visual theme
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Festival Presets */}
          <div>
            <label style={labelStyle}>🎊 Festival Preset</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
              {FESTIVAL_PRESETS.map(p => (
                <button
                  key={p.festival}
                  type="button"
                  onClick={() => applyPreset(p)}
                  style={{
                    padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600',
                    border: `2px solid ${form.festival === p.festival ? p.primaryColor : '#e5e7eb'}`,
                    background: form.festival === p.festival ? p.primaryColor + '20' : '#fff',
                    color: form.festival === p.festival ? p.primaryColor : '#374151',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  {p.emoji} {p.festival}
                </button>
              ))}
            </div>
          </div>

          {/* Name & Description */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Sale Name *</label>
              <input
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="e.g. Diwali Dhamaka 2024"
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Festival</label>
              <input
                value={form.festival}
                onChange={e => setField('festival', e.target.value)}
                placeholder="e.g. Diwali"
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description (optional)</label>
            <textarea
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              placeholder="Internal notes about this sale..."
              style={{ ...inputStyle, height: '70px', resize: 'vertical' }}
            />
          </div>

          {/* Discount Configuration */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}><Percent size={15} /> Discount Configuration</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Discount Type</label>
                <select value={form.discountType} onChange={e => setField('discountType', e.target.value)} style={inputStyle}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>
                  {form.discountType === 'percentage' ? 'Discount %' : 'Discount ₹'} *
                </label>
                <input
                  type="number" min="0" max={form.discountType === 'percentage' ? 100 : undefined}
                  value={form.discountValue}
                  onChange={e => setField('discountValue', e.target.value)}
                  required style={inputStyle}
                />
              </div>
              {form.discountType === 'percentage' && (
                <div>
                  <label style={labelStyle}>Max Discount ₹ (0 = no cap)</label>
                  <input
                    type="number" min="0" value={form.maxDiscountAmount}
                    onChange={e => setField('maxDiscountAmount', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              )}
              <div>
                <label style={labelStyle}>Min Order ₹ (0 = any)</label>
                <input
                  type="number" min="0" value={form.minOrderAmount}
                  onChange={e => setField('minOrderAmount', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}><Calendar size={15} /> Sale Duration</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Start Date & Time *</label>
                <input
                  type="datetime-local" value={form.startDate}
                  onChange={e => setField('startDate', e.target.value)}
                  required style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>End Date & Time *</label>
                <input
                  type="datetime-local" value={form.endDate}
                  onChange={e => setField('endDate', e.target.value)}
                  required style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Scope */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}><ShoppingBag size={15} /> Apply Discount To</div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {['all', 'categories', 'products'].map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600', color: form.applyTo === opt ? '#9B59D6' : '#374151' }}>
                  <input type="radio" name="applyTo" value={opt} checked={form.applyTo === opt} onChange={() => setField('applyTo', opt)} />
                  {opt === 'all' ? '🌍 All Products' : opt === 'categories' ? '📂 Categories' : '📦 Select Products'}
                </label>
              ))}
            </div>

            {form.applyTo === 'categories' && (
              <div>
                <label style={labelStyle}>Select Categories</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {categories.map(cat => {
                    const name = cat.name || cat;
                    const sel  = form.targetCategories.includes(name);
                    return (
                      <button
                        key={name} type="button"
                        onClick={() => setField('targetCategories', sel
                          ? form.targetCategories.filter(c => c !== name)
                          : [...form.targetCategories, name]
                        )}
                        style={{
                          padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem',
                          border: `2px solid ${sel ? '#9B59D6' : '#e5e7eb'}`,
                          background: sel ? '#f3e8ff' : '#fff', color: sel ? '#9B59D6' : '#374151',
                          cursor: 'pointer', fontWeight: '600'
                        }}
                      >
                        {sel ? '✓ ' : ''}{name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {form.applyTo === 'products' && (
              <div>
                <label style={labelStyle}>Select Products ({form.targetProducts.length} selected)</label>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', marginTop: '8px' }}>
                  {products.map(p => {
                    const sel = form.targetProducts.includes(p._id);
                    return (
                      <label
                        key={p._id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '8px 12px', cursor: 'pointer',
                          background: sel ? '#f3e8ff' : 'transparent',
                          borderBottom: '1px solid #f3f4f6', fontSize: '0.84rem'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={sel}
                          onChange={() => setField('targetProducts', sel
                            ? form.targetProducts.filter(id => id !== p._id)
                            : [...form.targetProducts, p._id]
                          )}
                        />
                        <span style={{ flex: 1 }}>{p.name}</span>
                        <span style={{ color: '#6b7280', fontSize: '0.78rem' }}>{p.category}</span>
                        <span style={{ fontWeight: '700', color: '#9B59D6' }}>₹{p.price?.toLocaleString('en-IN')}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Theme */}
          <div style={sectionStyle}>
            <div style={sectionTitleStyle}><Globe size={15} /> Visual Theme</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Emoji</label>
                <input value={form.theme.emoji} onChange={e => setTheme('emoji', e.target.value)} placeholder="🎉" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Primary Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={form.theme.primaryColor} onChange={e => setTheme('primaryColor', e.target.value)} style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '6px' }} />
                  <input value={form.theme.primaryColor} onChange={e => setTheme('primaryColor', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Secondary Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={form.theme.secondaryColor} onChange={e => setTheme('secondaryColor', e.target.value)} style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '6px' }} />
                  <input value={form.theme.secondaryColor} onChange={e => setTheme('secondaryColor', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Accent Color</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={form.theme.accentColor} onChange={e => setTheme('accentColor', e.target.value)} style={{ width: '40px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '6px' }} />
                  <input value={form.theme.accentColor} onChange={e => setTheme('accentColor', e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              <div>
                <label style={labelStyle}>Banner Headline</label>
                <input value={form.theme.bannerText} onChange={e => setTheme('bannerText', e.target.value)} placeholder="✨ Festival Sale!" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Banner Sub-text</label>
                <input value={form.theme.bannerSubText} onChange={e => setTheme('bannerSubText', e.target.value)} placeholder="Limited time offers" style={inputStyle} />
              </div>
            </div>

            {/* Live Preview */}
            <div style={{ marginTop: '14px' }}>
              <label style={{ ...labelStyle, marginBottom: '8px', display: 'block' }}>Live Preview</label>
              <div style={{
                background: `linear-gradient(135deg, ${form.theme.primaryColor}, ${form.theme.accentColor})`,
                borderRadius: '10px', padding: '12px 16px', color: '#fff',
                display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: '1.3rem' }}>✨</span>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{form.theme.emoji} {form.name || 'Sale Name'}</div>
                  <div style={{ fontSize: '0.78rem', opacity: 0.85 }}>{form.theme.bannerSubText}</div>
                </div>
                <span style={{
                  marginLeft: 'auto',
                  background: 'rgba(255,255,255,0.25)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  borderRadius: '20px', padding: '2px 12px',
                  fontWeight: '900', fontSize: '0.85rem'
                }}>
                  🔥 {form.discountValue}{form.discountType === 'percentage' ? '%' : '₹'} OFF
                </span>
              </div>
            </div>
          </div>

          {/* Active toggle */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '600', color: '#374151' }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setField('isActive', e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#9B59D6' }}
            />
            Enable sale immediately after saving
          </label>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px', borderTop: '1px solid #f3f4f6' }}>
            <button type="button" onClick={onClose} style={btnStyle('#f3f4f6', '#374151')}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ ...btnStyle('#9B59D6', '#fff'), minWidth: '140px', opacity: saving ? 0.7 : 1 }}>
              {saving ? '⏳ Saving…' : (editSale ? '💾 Update Sale' : '🎉 Create Sale')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Style helpers ─────────────────────────────────────────────────────────────
const btnStyle = (bg, color) => ({
  display: 'inline-flex', alignItems: 'center', gap: '6px',
  padding: '8px 14px', borderRadius: '8px', border: 'none',
  backgroundColor: bg, color, cursor: 'pointer', fontWeight: '600',
  fontSize: '0.85rem', transition: 'opacity 0.15s'
});

const labelStyle = {
  display: 'block', fontSize: '0.8rem', fontWeight: '700',
  color: '#374151', marginBottom: '5px', letterSpacing: '0.3px'
};

const inputStyle = {
  width: '100%', padding: '8px 12px', borderRadius: '8px',
  border: '1.5px solid #e5e7eb', fontSize: '0.88rem', color: '#1f2937',
  boxSizing: 'border-box', outline: 'none', background: '#fafafa'
};

const sectionStyle = {
  background: '#f9fafb', borderRadius: '12px', padding: '14px 16px',
  border: '1px solid #f0f0f0'
};

const sectionTitleStyle = {
  display: 'flex', alignItems: 'center', gap: '6px',
  fontSize: '0.85rem', fontWeight: '800', color: '#374151',
  marginBottom: '12px'
};

export default FestivalSaleTab;
