import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, ShoppingCart, Users, TrendingUp, Package, AlertTriangle, PackageX, Trophy, TrendingDown, RefreshCw
} from 'lucide-react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Title, Tooltip, Legend, ArcElement, Filler
} from 'chart.js';
import { getAdminOverview, getAdminAnalytics } from '../services/orderService';
import { getEnhancedDashboard } from '../services/adminService';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, Filler);

/**
 * OverviewTab — Enhanced Admin Dashboard with all 9 metric cards.
 * Uses both existing analytics (charts) and new enhanced dashboard metrics.
 */
const OverviewTab = ({ showToast }) => {
  const [overview, setOverview] = useState(null);
  const [enhanced, setEnhanced] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ov, enh, an] = await Promise.all([
          getAdminOverview(),
          getEnhancedDashboard(),
          getAdminAnalytics()
        ]);
        setOverview(ov);
        setEnhanced(enh);
        setAnalytics(an);
      } catch {
        showToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem', color: '#b76e79' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
        <div style={{ fontWeight: '600' }}>Gathering business metrics...</div>
      </div>
    );
  }

  // Chart configs
  const CHART_COLORS = { rose: '#b76e79', purple: '#5b21b6', teal: '#0d9488', amber: '#d97706' };

  const revenueChartData = {
    labels: analytics?.monthlyAnalytics.map(a => a.month) || [],
    datasets: [{
      label: 'Monthly Revenue (₹)',
      data: analytics?.monthlyAnalytics.map(a => a.revenue) || [],
      backgroundColor: 'rgba(183,110,121,0.65)',
      borderColor: CHART_COLORS.rose,
      borderWidth: 2, borderRadius: 6
    }]
  };

  const ordersChartData = {
    labels: analytics?.monthlyAnalytics.map(a => a.month) || [],
    datasets: [{
      label: 'Orders per Month',
      data: analytics?.monthlyAnalytics.map(a => a.orders) || [],
      borderColor: CHART_COLORS.purple,
      backgroundColor: 'rgba(91,33,182,0.08)',
      tension: 0.4, fill: true, pointBackgroundColor: CHART_COLORS.purple, pointRadius: 4
    }]
  };

  const topProductsChartData = {
    labels: analytics?.topProducts.map(p => p.name.length > 14 ? p.name.substring(0, 14) + '…' : p.name) || [],
    datasets: [{
      label: 'Units Sold',
      data: analytics?.topProducts.map(p => p.quantity) || [],
      backgroundColor: ['#b76e79cc', '#5b21b6cc', '#059669cc', '#d97706cc', '#0891b2cc'],
      borderRadius: 6
    }]
  };

  const categoryChartData = {
    labels: analytics?.categorySales.map(c => c.category) || [],
    datasets: [{
      data: analytics?.categorySales.map(c => c.revenue) || [],
      backgroundColor: ['#b76e79', '#5b21b6', '#059669', '#d97706', '#0891b2', '#dc2626', '#7c3aed', '#065f46'],
      hoverOffset: 8
    }]
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'top' }, tooltip: {} },
    scales: { y: { beginAtZero: true, grid: { color: '#f3f4f6' } }, x: { grid: { display: false } } }
  };

  // 9 Dashboard Metric Cards
  const metricCards = [
    { label: 'Total Products', value: enhanced?.totalProducts ?? overview?.totalProducts ?? '—', icon: <ShoppingBag size={20} />, bg: '#fdf0f2', color: '#b76e79' },
    { label: 'Total Categories', value: enhanced?.totalCategories ?? '—', icon: <Package size={20} />, bg: '#ede9fe', color: '#5b21b6' },
    { label: 'Total Orders', value: enhanced?.totalOrders ?? overview?.totalOrders ?? '—', icon: <ShoppingCart size={20} />, bg: '#e0f2fe', color: '#0369a1' },
    { label: 'Total Revenue', value: formatPrice(enhanced?.totalRevenue ?? overview?.revenue), icon: <TrendingUp size={20} />, bg: '#d1fae5', color: '#059669' },
    { label: 'Products In Stock', value: enhanced?.inStock ?? '—', icon: <Package size={20} />, bg: '#f0fdf4', color: '#16a34a' },
    { label: 'Low Stock', value: enhanced?.lowStock ?? '—', icon: <AlertTriangle size={20} />, bg: '#fef9c3', color: '#d97706', alert: (enhanced?.lowStock || 0) > 0 },
    { label: 'Out of Stock', value: enhanced?.outOfStock ?? '—', icon: <PackageX size={20} />, bg: '#fee2e2', color: '#dc2626', alert: (enhanced?.outOfStock || 0) > 0 },
    { label: 'Best Seller', value: enhanced?.bestSelling?.name || 'N/A', icon: <Trophy size={20} />, bg: '#fef3c7', color: '#78350f', small: true },
    { label: 'Least Seller', value: enhanced?.leastSelling?.name || 'N/A', icon: <TrendingDown size={20} />, bg: '#f3f4f6', color: '#374151', small: true }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* 9 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
        {metricCards.map((card) => (
          <div key={card.label} style={{
            padding: '1.25rem', borderRadius: '14px',
            backgroundColor: card.bg,
            border: card.alert ? `1.5px solid ${card.color}` : '1px solid transparent',
            boxShadow: card.alert ? `0 0 0 2px ${card.color}22` : '0 1px 4px rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', gap: '12px',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = card.alert ? `0 0 0 2px ${card.color}22` : '0 1px 4px rgba(0,0,0,0.05)'; }}
          >
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: `${card.color}18`, color: card.color, flexShrink: 0 }}>
              {card.icon}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '600', color: card.color, opacity: 0.75, marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {card.label}
              </div>
              <div style={{
                fontSize: card.small ? '0.82rem' : '1.4rem',
                fontWeight: '800', color: card.color,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {card.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Summary */}
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.25rem' }}>Revenue Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
          {[
            { label: "Today's Revenue", value: formatPrice(analytics?.revenueSummary?.today) },
            { label: 'This Month', value: formatPrice(analytics?.revenueSummary?.monthly) },
            { label: 'This Year', value: formatPrice(analytics?.revenueSummary?.yearly) }
          ].map((item, i) => (
            <div key={item.label} style={{ borderRight: i < 2 ? '1px solid #f3f4f6' : 'none', paddingRight: i < 2 ? '1rem' : 0 }}>
              <div style={{ fontSize: '0.78rem', color: '#9ca3af', fontWeight: '600', marginBottom: '6px' }}>{item.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#b76e79' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts 2x2 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {[
          { title: 'Monthly Sales Revenue', chart: <Bar data={revenueChartData} options={chartOptions} /> },
          { title: 'Orders per Month', chart: <Line data={ordersChartData} options={{ ...chartOptions, scales: { y: { beginAtZero: true, grid: { color: '#f3f4f6' } }, x: { grid: { display: false } } } }} /> },
          { title: 'Top 5 Selling Products', chart: <Bar data={topProductsChartData} options={chartOptions} /> },
          {
            title: 'Category-wise Sales',
            chart: (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ maxWidth: '220px', width: '100%' }}>
                  <Pie data={categoryChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } } }} />
                </div>
              </div>
            )
          }
        ].map(({ title, chart }) => (
          <div key={title} style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#374151', marginBottom: '1.25rem' }}>{title}</h4>
            {chart}
          </div>
        ))}
      </div>

    </div>
  );
};

export default OverviewTab;
