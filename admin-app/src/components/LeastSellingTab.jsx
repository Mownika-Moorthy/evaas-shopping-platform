import React, { useState, useEffect } from 'react';
import { TrendingDown, Package, RefreshCw, AlertTriangle } from 'lucide-react';
import { getLeastSellingProducts } from '../services/adminService';

/**
 * LeastSellingTab — Bottom 10 Least-Selling Products
 * Algorithm: Group by productId → Sum quantity → Sort Ascending → Limit 10
 */
const LeastSellingTab = ({ showToast, backendUrl }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getLeastSellingProducts(10);
        setProducts(data);
      } catch {
        showToast('Failed to load least-selling products', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingDown size={22} color="#dc2626" /> Bottom 10 Least-Selling Products
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>
          Algorithm: Ascending sort by total quantity sold — identify underperforming products
        </p>
      </div>

      {/* Info Banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: '10px',
        padding: '12px 16px', borderRadius: '10px',
        backgroundColor: '#fef9c3', border: '1px solid #fde047', color: '#713f12'
      }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
        <div style={{ fontSize: '0.83rem' }}>
          <strong>Action Required:</strong> Consider promotions, discounts, or bundle deals for these products to improve their sales performance.
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#b76e79' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
          <div>Calculating rankings...</div>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af', backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6' }}>
          <Package size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
          <div>No order data available for ranking.</div>
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#fff8f0', borderBottom: '2px solid #fed7aa' }}>
                {['Rank', 'Product', 'Category', 'Price', 'Stock', 'Units Sold', 'Revenue'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#7c2d12', fontSize: '0.78rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr
                  key={prod.productId}
                  style={{ borderBottom: '1px solid #f9fafb', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff8f0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%',
                      backgroundColor: '#fee2e2', color: '#dc2626',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '800', fontSize: '0.78rem'
                    }}>
                      {prod.rank}
                    </div>
                  </td>
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
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{prod.category}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#374151' }}>{formatPrice(prod.price)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: '600', color: prod.stock === 0 ? '#dc2626' : '#374151' }}>{prod.stock}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      backgroundColor: '#fee2e2', color: '#dc2626',
                      padding: '3px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '0.82rem'
                    }}>
                      {prod.quantitySold}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#6b7280', fontSize: '0.9rem' }}>{formatPrice(prod.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeastSellingTab;
