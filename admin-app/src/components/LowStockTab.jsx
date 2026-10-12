import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, PackageX, Package, Settings, RefreshCw } from 'lucide-react';
import { getLowStockAlerts } from '../services/adminService';

/**
 * LowStockTab — Low Stock Alert System
 * Algorithm: IF stock <= threshold → Low Stock; IF stock === 0 → Out of Stock
 * Threshold is configurable by admin (default 10).
 */
const LowStockTab = ({ showToast, backendUrl }) => {
  const [threshold, setThreshold] = useState(10);
  const [inputThreshold, setInputThreshold] = useState('10');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'Low Stock' | 'Out of Stock'

  const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

  const fetchAlerts = async (t = threshold) => {
    setLoading(true);
    try {
      const data = await getLowStockAlerts(t);
      setProducts(data.products || []);
    } catch {
      showToast('Failed to load low stock alerts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const applyThreshold = () => {
    const t = Number(inputThreshold);
    if (!t || t < 1) {
      showToast('Threshold must be a positive number', 'warning');
      return;
    }
    setThreshold(t);
    fetchAlerts(t);
  };

  const filtered = products.filter(p => filter === 'all' ? true : p.stockStatus === filter);
  const outOfStockCount = products.filter(p => p.stockStatus === 'Out of Stock').length;
  const lowStockCount = products.filter(p => p.stockStatus === 'Low Stock').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={22} color="#dc2626" />
            Low Stock Alerts
            {products.length > 0 && (
              <span style={{
                backgroundColor: '#dc2626', color: '#fff',
                borderRadius: '20px', padding: '1px 8px',
                fontSize: '0.72rem', fontWeight: '700', marginLeft: '4px'
              }}>
                {products.length}
              </span>
            )}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>
            Algorithm: Threshold-Based Detection — IF stock ≤ {threshold} → Low Stock
          </p>
        </div>

        {/* Threshold Config */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px', borderRadius: '10px',
          backgroundColor: '#fff', border: '1px solid #e5e7eb'
        }}>
          <Settings size={15} color="#6b7280" />
          <span style={{ fontSize: '0.82rem', color: '#374151', fontWeight: '500' }}>Threshold:</span>
          <input
            type="number"
            min="1"
            value={inputThreshold}
            onChange={(e) => setInputThreshold(e.target.value)}
            style={{
              width: '60px', padding: '5px 8px', border: '1px solid #e5e7eb',
              borderRadius: '6px', fontSize: '0.82rem', textAlign: 'center'
            }}
          />
          <button
            onClick={applyThreshold}
            style={{
              padding: '6px 14px', borderRadius: '6px',
              backgroundColor: '#b76e79', color: '#fff',
              border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600'
            }}
          >
            Apply
          </button>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Alerts', value: products.length, bg: '#ede9fe', color: '#5b21b6', icon: <Bell size={18} /> },
          { label: 'Low Stock', value: lowStockCount, bg: '#fef9c3', color: '#78350f', icon: <AlertTriangle size={18} /> },
          { label: 'Out of Stock', value: outOfStockCount, bg: '#fee2e2', color: '#7f1d1d', icon: <PackageX size={18} /> }
        ].map(card => (
          <div key={card.label} style={{
            padding: '1.25rem', borderRadius: '12px',
            backgroundColor: card.bg, color: card.color,
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            {card.icon}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '600', opacity: 0.8, marginBottom: '2px' }}>{card.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800' }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { value: 'all', label: 'All Alerts', count: products.length },
          { value: 'Low Stock', label: 'Low Stock', count: lowStockCount },
          { value: 'Out of Stock', label: 'Out of Stock', count: outOfStockCount }
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 16px', borderRadius: '8px',
              backgroundColor: filter === opt.value ? '#b76e79' : '#f9fafb',
              color: filter === opt.value ? '#fff' : '#374151',
              border: `1px solid ${filter === opt.value ? '#b76e79' : '#e5e7eb'}`,
              cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem'
            }}
          >
            {opt.label}
            <span style={{
              backgroundColor: filter === opt.value ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
              color: filter === opt.value ? '#fff' : '#374151',
              borderRadius: '10px', padding: '1px 7px', fontSize: '0.72rem', fontWeight: '700'
            }}>
              {opt.count}
            </span>
          </button>
        ))}
      </div>

      {/* Products Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#b76e79' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
          <div>Scanning inventory...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem', borderRadius: '14px',
          backgroundColor: filter === 'Out of Stock' ? '#fff8f8' : '#fefce8',
          border: `1px solid ${filter === 'Out of Stock' ? '#fca5a5' : '#fde68a'}`
        }}>
          <Package size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
          <div style={{ color: '#6b7280' }}>
            {products.length === 0
              ? `Great! No products are below the threshold of ${threshold}.`
              : 'No products match this filter.'}
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#fff8f0', borderBottom: '2px solid #fed7aa' }}>
                {['Product', 'SKU', 'Category', 'Price', 'Current Stock', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#7c2d12', fontSize: '0.78rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((prod) => {
                const isOutOfStock = prod.stockStatus === 'Out of Stock';
                return (
                  <tr
                    key={prod._id}
                    style={{
                      borderBottom: '1px solid #f9fafb',
                      backgroundColor: isOutOfStock ? '#fff8f8' : '#fffdf0',
                      borderLeft: `3px solid ${isOutOfStock ? '#dc2626' : '#d97706'}`
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '40px', height: '48px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f9fafb', flexShrink: 0 }}>
                          {prod.image
                            ? <img src={`${backendUrl}${prod.image}`} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <Package size={16} color="#d1d5db" style={{ margin: '16px auto', display: 'block' }} />
                          }
                        </div>
                        <span style={{ fontWeight: '600', color: '#1f2937' }}>{prod.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#6b7280' }}>{prod.sku}</td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>{prod.category}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#b76e79' }}>{formatPrice(prod.price)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontWeight: '800', fontSize: '1.05rem',
                        color: isOutOfStock ? '#dc2626' : '#d97706'
                      }}>
                        {prod.stock}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '4px' }}>/ {threshold} threshold</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '4px 12px', borderRadius: '20px', fontWeight: '700', fontSize: '0.78rem',
                        backgroundColor: isOutOfStock ? '#fee2e2' : '#fef9c3',
                        color: isOutOfStock ? '#dc2626' : '#d97706'
                      }}>
                        {isOutOfStock ? <PackageX size={12} /> : <AlertTriangle size={12} />}
                        {prod.stockStatus}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LowStockTab;
