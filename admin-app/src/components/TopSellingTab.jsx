import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Package, RefreshCw } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { getTopSellingProducts } from '../services/adminService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * TopSellingTab — Top 10 Best-Selling Products
 * Algorithm: Group by productId → Sum quantity → Sort Descending → Limit 10
 */
const TopSellingTab = ({ showToast, backendUrl }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'chart'

  const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await getTopSellingProducts(10);
        setProducts(data);
      } catch {
        showToast('Failed to load top-selling products', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const RANK_COLORS = ['#f59e0b', '#9ca3af', '#b45309', '#b76e79', '#5b21b6'];

  const getRankBadge = (rank) => (
    <div style={{
      width: '28px', height: '28px', borderRadius: '50%',
      backgroundColor: rank <= 3 ? RANK_COLORS[rank - 1] : '#f3f4f6',
      color: rank <= 3 ? '#fff' : '#374151',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '800', fontSize: '0.78rem', flexShrink: 0
    }}>
      {rank <= 3 ? <Trophy size={13} /> : rank}
    </div>
  );

  const chartData = {
    labels: products.map(p => p.name.length > 18 ? p.name.substring(0, 18) + '…' : p.name),
    datasets: [
      {
        label: 'Units Sold',
        data: products.map(p => p.quantitySold),
        backgroundColor: products.map((_, i) => {
          const palette = ['#b76e79', '#d97706', '#059669', '#5b21b6', '#0891b2', '#be185d', '#7c3aed', '#065f46', '#92400e', '#1e40af'];
          return palette[i % palette.length] + 'cc';
        }),
        borderRadius: 6,
        borderWidth: 0
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    indexAxis: 'y', // horizontal bar
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => ` Units Sold: ${c.raw}` } }
    },
    scales: {
      x: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={22} color="#f59e0b" /> Top 10 Best-Selling Products
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>
            Algorithm: Descending sort by total quantity sold
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['table', 'chart'].map(v => (
            <button key={v} onClick={() => setViewMode(v)} style={{
              padding: '7px 16px', borderRadius: '8px',
              backgroundColor: viewMode === v ? '#b76e79' : '#f9fafb',
              color: viewMode === v ? '#fff' : '#374151',
              border: `1px solid ${viewMode === v ? '#b76e79' : '#e5e7eb'}`,
              cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', textTransform: 'capitalize'
            }}>
              {v}
            </button>
          ))}
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
      ) : viewMode === 'chart' ? (
        <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '2rem', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#374151', marginBottom: '1.5rem' }}>Units Sold — Top 10 Products</h4>
          <Bar data={chartData} options={chartOptions} />
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#fdf0f2', borderBottom: '2px solid #f3e4e7' }}>
                {['Rank', 'Product', 'Category', 'Price', 'Units Sold', 'Revenue'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '700', color: '#7f1d1d', fontSize: '0.78rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.productId} style={{ borderBottom: '1px solid #f9fafb', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fdf8f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                >
                  <td style={{ padding: '12px 16px' }}>{getRankBadge(prod.rank)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '48px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#f9fafb', flexShrink: 0 }}>
                        {prod.image ? (
                          <img src={`${backendUrl}${prod.image}`} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : <Package size={16} color="#d1d5db" style={{ margin: '16px auto', display: 'block' }} />}
                      </div>
                      <span style={{ fontWeight: '600', color: '#1f2937' }}>{prod.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#6b7280' }}>{prod.category}</td>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color: '#374151' }}>{formatPrice(prod.price)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '3px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '0.82rem' }}>
                      {prod.quantitySold}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: '700', color: '#b76e79', fontSize: '0.9rem' }}>{formatPrice(prod.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TopSellingTab;
