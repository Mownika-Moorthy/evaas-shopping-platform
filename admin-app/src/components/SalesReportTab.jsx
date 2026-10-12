import React, { useState, useEffect } from 'react';
import { Calendar, FileText, Download, TrendingUp, ShoppingCart, Package, RefreshCw } from 'lucide-react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { getSalesReport, exportReportPDF, exportReportExcel } from '../services/adminService';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

/**
 * SalesReportTab — Sales reports with aggregation pipeline data.
 * Supports: daily, weekly, monthly, yearly periods + custom date range.
 * Charts: Bar + Line.
 * Export: PDF and Excel via backend.
 */
const SalesReportTab = ({ showToast }) => {
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState('bar');

  const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = useCustom ? { period: 'custom', startDate, endDate } : { period };
      const data = await getSalesReport(params);
      setReportData(data.reportData || []);
      setSummary(data.summary || {});
    } catch (err) {
      showToast('Failed to generate report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const handleExportPDF = () => {
    showToast('Preparing PDF export...', 'info');
    const params = useCustom ? { period: 'custom', startDate, endDate } : { period };
    exportReportPDF(params);
  };

  const handleExportExcel = () => {
    showToast('Preparing Excel export...', 'info');
    const params = useCustom ? { period: 'custom', startDate, endDate } : { period };
    exportReportExcel(params);
  };

  const chartLabels = reportData.map(d => d.label);
  const chartColors = {
    revenue: { bg: 'rgba(183,110,121,0.7)', border: '#b76e79' },
    orders: { bg: 'rgba(91,33,182,0.6)', border: '#5b21b6' },
    qty: { bg: 'rgba(5,150,105,0.6)', border: '#059669' }
  };

  const revenueChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Revenue (₹)',
        data: reportData.map(d => d.totalRevenue),
        backgroundColor: chartColors.revenue.bg,
        borderColor: chartColors.revenue.border,
        borderWidth: 2,
        borderRadius: 6,
        tension: 0.4,
        fill: chartType === 'line'
      }
    ]
  };

  const ordersQtyChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Total Orders',
        data: reportData.map(d => d.totalOrders),
        backgroundColor: chartColors.orders.bg,
        borderColor: chartColors.orders.border,
        borderWidth: 2,
        borderRadius: 6,
        tension: 0.4
      },
      {
        label: 'Qty Sold',
        data: reportData.map(d => d.totalQuantity),
        backgroundColor: chartColors.qty.bg,
        borderColor: chartColors.qty.border,
        borderWidth: 2,
        borderRadius: 6,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.dataset.label || '';
            if (label.includes('Revenue')) return `${label}: ₹${Number(ctx.raw).toLocaleString('en-IN')}`;
            return `${label}: ${ctx.raw}`;
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      x: { grid: { display: false } }
    }
  };

  const PERIOD_OPTIONS = [
    { value: 'daily', label: 'Today' },
    { value: 'weekly', label: 'This Week' },
    { value: 'monthly', label: 'This Month' },
    { value: 'yearly', label: 'This Year' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1f2937' }}>Sales Reports</h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>MongoDB Aggregation Pipeline</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleExportPDF}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px',
              backgroundColor: '#fee2e2', color: '#dc2626',
              border: '1px solid #fca5a5', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem'
            }}
          >
            <FileText size={14} /> Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px',
              backgroundColor: '#d1fae5', color: '#059669',
              border: '1px solid #6ee7b7', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem'
            }}
          >
            <Download size={14} /> Export Excel
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '1.25rem', border: '1px solid #f3f4f6', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setPeriod(opt.value); setUseCustom(false); }}
              style={{
                padding: '7px 16px', borderRadius: '8px',
                backgroundColor: !useCustom && period === opt.value ? '#b76e79' : '#f9fafb',
                color: !useCustom && period === opt.value ? '#fff' : '#374151',
                border: `1px solid ${!useCustom && period === opt.value ? '#b76e79' : '#e5e7eb'}`,
                cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem', transition: 'all 0.2s'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Custom Range */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Calendar size={15} color="#9ca3af" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setUseCustom(true); }}
            style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.82rem' }}
          />
          <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setUseCustom(true); }}
            style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.82rem' }}
          />
          {useCustom && (
            <button
              onClick={fetchReport}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '7px 14px', borderRadius: '8px',
                backgroundColor: '#b76e79', color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600'
              }}
            >
              <RefreshCw size={13} /> Apply
            </button>
          )}
        </div>

        {/* Chart Type Toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {['bar', 'line'].map(t => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              style={{
                padding: '6px 12px', borderRadius: '6px',
                backgroundColor: chartType === t ? '#ede9fe' : '#f9fafb',
                color: chartType === t ? '#5b21b6' : '#6b7280',
                border: `1px solid ${chartType === t ? '#c4b5fd' : '#e5e7eb'}`,
                cursor: 'pointer', fontWeight: '600', fontSize: '0.78rem', textTransform: 'capitalize'
              }}
            >
              {t} chart
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#b76e79' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', marginBottom: '10px' }} />
          <div>Generating report...</div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Total Orders', value: summary.totalOrders || 0, icon: <ShoppingCart size={20} />, bg: '#ede9fe', color: '#5b21b6' },
                { label: 'Total Revenue', value: formatPrice(summary.totalRevenue || 0), icon: <TrendingUp size={20} />, bg: '#fdf0f2', color: '#b76e79' },
                { label: 'Units Sold', value: summary.totalQuantity || 0, icon: <Package size={20} />, bg: '#d1fae5', color: '#059669' }
              ].map((card) => (
                <div key={card.label} style={{
                  padding: '1.25rem 1.5rem', borderRadius: '12px',
                  backgroundColor: card.bg, display: 'flex', alignItems: 'center', gap: '14px'
                }}>
                  <div style={{ color: card.color }}>{card.icon}</div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: card.color, opacity: 0.8, marginBottom: '4px' }}>{card.label}</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: '800', color: card.color }}>{card.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Charts */}
          {reportData.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#374151', marginBottom: '1rem' }}>Revenue Trend</h4>
                {chartType === 'bar'
                  ? <Bar data={revenueChartData} options={chartOptions} />
                  : <Line data={revenueChartData} options={chartOptions} />
                }
              </div>
              <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '1.5rem', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#374151', marginBottom: '1rem' }}>Orders & Quantity</h4>
                {chartType === 'bar'
                  ? <Bar data={ordersQtyChartData} options={chartOptions} />
                  : <Line data={ordersQtyChartData} options={chartOptions} />
                }
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
              No data available for the selected period.
            </div>
          )}

          {/* Data Table */}
          {reportData.length > 0 && (
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6', backgroundColor: '#fdf0f2' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', color: '#7f1d1d' }}>Detailed Report</h4>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#fdf8f9', borderBottom: '1px solid #f3e4e7' }}>
                      {['Period', 'Total Orders', 'Qty Sold', 'Revenue'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '700', color: '#374151', fontSize: '0.78rem', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f9fafb', backgroundColor: idx % 2 === 0 ? '#fff' : '#fdf8f9' }}>
                        <td style={{ padding: '10px 16px', fontWeight: '500' }}>{row.label}</td>
                        <td style={{ padding: '10px 16px' }}>{row.totalOrders}</td>
                        <td style={{ padding: '10px 16px' }}>{row.totalQuantity}</td>
                        <td style={{ padding: '10px 16px', fontWeight: '700', color: '#b76e79' }}>{formatPrice(row.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SalesReportTab;
