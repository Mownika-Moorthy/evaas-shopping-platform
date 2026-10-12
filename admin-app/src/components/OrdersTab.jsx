import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingCart, Truck, ExternalLink } from 'lucide-react';
import { getAllOrdersAdmin, updateOrderStatusAdmin } from '../services/orderService';

const STATUS_COLORS = {
  Pending:           { bg: '#fef9c3', color: '#78350f' },
  Confirmed:         { bg: '#dbeafe', color: '#1e40af' },
  Processing:        { bg: '#ede9fe', color: '#5b21b6' },
  Shipped:           { bg: '#fef3c7', color: '#92400e' },
  'Out for Delivery':{ bg: '#ffedd5', color: '#9a3412' },
  Delivered:         { bg: '#d1fae5', color: '#065f46' },
  Cancelled:         { bg: '#fee2e2', color: '#7f1d1d' }
};

const PAYMENT_COLORS = {
  Paid:    { bg: '#d1fae5', color: '#059669' },
  Pending: { bg: '#fef3c7', color: '#92400e' },
  Failed:  { bg: '#fee2e2', color: '#dc2626' }
};

const ALL_ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const OrdersTab = ({ showToast }) => {
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [courierForm, setCourierForm] = useState({});

  const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;
  const formatDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const data = await getAllOrdersAdmin(params);
      setOrders(data);
    } catch {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // ── Update single field ───────────────────────────────────────────────────
  const handleStatusChange = async (id, field, value, order) => {
    // Guard: prevent admin manually marking Razorpay order as Paid
    if (field === 'paymentStatus' && value === 'Paid' && order.paymentMethod === 'Razorpay' && order.paymentStatus !== 'Paid') {
      showToast('Cannot manually mark a Razorpay order as Paid. Payment is verified through Razorpay only.', 'error');
      return;
    }
    try {
      await updateOrderStatusAdmin(id, { [field]: value });
      showToast('Order updated successfully', 'success');
      loadOrders();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update order';
      showToast(msg, 'error');
    }
  };

  // ── Update courier details ────────────────────────────────────────────────
  const handleCourierSave = async (orderId) => {
    const form = courierForm[orderId] || {};
    try {
      await updateOrderStatusAdmin(orderId, {
        courierName: form.courierName || '',
        trackingNumber: form.trackingNumber || '',
        trackingUrl: form.trackingUrl || '',
        estimatedDeliveryDate: form.estimatedDeliveryDate || null
      });
      showToast('Courier details saved', 'success');
      setExpandedOrder(null);
      loadOrders();
    } catch {
      showToast('Failed to save courier details', 'error');
    }
  };

  const initCourierForm = (order) => {
    setCourierForm(prev => ({
      ...prev,
      [order._id]: {
        courierName: order.courierName || '',
        trackingNumber: order.trackingNumber || '',
        trackingUrl: order.trackingUrl || '',
        estimatedDeliveryDate: order.estimatedDeliveryDate
          ? new Date(order.estimatedDeliveryDate).toISOString().split('T')[0]
          : ''
      }
    }));
    setExpandedOrder(prev => prev === order._id ? null : order._id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1f2937' }}>Order Management</h2>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>{orders.length} orders total</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '300px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input type="text" placeholder="Search by customer, phone, ID..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 9px 9px 34px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem', backgroundColor: '#fff' }}>
          <option value="">All Orders</option>
          {ALL_ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#b76e79' }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
            <ShoppingCart size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div>No orders found.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#fdf0f2', borderBottom: '2px solid #f3e4e7' }}>
                  {['Order ID', 'Customer', 'Date', 'Total', 'Payment Method', 'Payment ID', 'Payment Status', 'Order Status', 'Courier', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 13px', textAlign: 'left', fontWeight: '700', color: '#7f1d1d', fontSize: '0.72rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(ord => (
                  <React.Fragment key={ord._id}>
                    <tr style={{ borderBottom: expandedOrder === ord._id ? 'none' : '1px solid #f9fafb', verticalAlign: 'top' }}>
                      {/* Order ID */}
                      <td style={{ padding: '11px 13px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#6b7280' }}>
                        #{ord._id.slice(-8).toUpperCase()}
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '11px 13px' }}>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>{ord.userId?.name || '—'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{ord.userId?.email || ord.phone}</div>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '11px 13px', color: '#374151', whiteSpace: 'nowrap' }}>
                        {formatDate(ord.orderDate || ord.createdAt)}
                      </td>

                      {/* Total */}
                      <td style={{ padding: '11px 13px', fontWeight: '700', color: '#b76e79', whiteSpace: 'nowrap' }}>
                        {formatPrice(ord.totalAmount)}
                      </td>

                      {/* Payment Method */}
                      <td style={{ padding: '11px 13px', color: '#374151', fontSize: '0.78rem' }}>
                        {ord.paymentMethod}
                      </td>

                      {/* Razorpay Payment ID */}
                      <td style={{ padding: '11px 13px', fontFamily: 'monospace', fontSize: '0.72rem', color: '#6b7280', maxWidth: '120px' }}>
                        {ord.razorpayPaymentId
                          ? <span title={ord.razorpayPaymentId}>{ord.razorpayPaymentId.slice(0, 12)}…</span>
                          : '—'}
                      </td>

                      {/* Payment Status */}
                      <td style={{ padding: '11px 13px' }}>
                        <span style={{
                          padding: '3px 9px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700',
                          backgroundColor: PAYMENT_COLORS[ord.paymentStatus]?.bg || '#f3f4f6',
                          color: PAYMENT_COLORS[ord.paymentStatus]?.color || '#374151'
                        }}>
                          {ord.paymentStatus}
                        </span>
                        {ord.paymentMethod === 'Razorpay' && ord.paymentStatus !== 'Paid' && (
                          <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '2px' }}>Auto-verified only</div>
                        )}
                      </td>

                      {/* Order Status */}
                      <td style={{ padding: '11px 13px' }}>
                        <select
                          value={ord.status}
                          onChange={e => handleStatusChange(ord._id, 'status', e.target.value, ord)}
                          style={{
                            padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                            border: `1px solid ${STATUS_COLORS[ord.status]?.color || '#e5e7eb'}`,
                            backgroundColor: STATUS_COLORS[ord.status]?.bg || '#f9fafb',
                            color: STATUS_COLORS[ord.status]?.color || '#374151'
                          }}
                        >
                          {ALL_ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>

                      {/* Courier Info */}
                      <td style={{ padding: '11px 13px', fontSize: '0.75rem', color: '#6b7280', maxWidth: '120px' }}>
                        {ord.courierName ? (
                          <div>
                            <div style={{ fontWeight: '600', color: '#374151' }}>{ord.courierName}</div>
                            {ord.trackingNumber && <div style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{ord.trackingNumber}</div>}
                            {ord.trackingUrl && (
                              <a href={ord.trackingUrl} target="_blank" rel="noopener noreferrer"
                                style={{ color: '#b76e79', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem' }}>
                                <ExternalLink size={10} /> Track
                              </a>
                            )}
                          </div>
                        ) : <span style={{ color: '#d1d5db' }}>Not set</span>}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '11px 13px' }}>
                        <button
                          onClick={() => initCourierForm(ord)}
                          style={{
                            padding: '5px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600', cursor: 'pointer',
                            border: '1px solid #e5e7eb', backgroundColor: expandedOrder === ord._id ? '#b76e79' : '#f9fafb',
                            color: expandedOrder === ord._id ? '#fff' : '#374151',
                            display: 'flex', alignItems: 'center', gap: '4px'
                          }}
                        >
                          <Truck size={12} /> {expandedOrder === ord._id ? 'Close' : 'Courier'}
                        </button>
                      </td>
                    </tr>

                    {/* ── Courier Detail Expand Row ─────────────────────────── */}
                    {expandedOrder === ord._id && (
                      <tr style={{ borderBottom: '1px solid #f9fafb' }}>
                        <td colSpan={10} style={{ padding: '0 13px 16px 13px', backgroundColor: '#fdf0f2' }}>
                          <div style={{ padding: '1rem', backgroundColor: 'white', borderRadius: '10px', border: '1px solid #f3e4e7', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 150px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Courier Name</label>
                              <input type="text" placeholder="e.g. Delhivery, DTDC"
                                value={courierForm[ord._id]?.courierName || ''}
                                onChange={e => setCourierForm(prev => ({ ...prev, [ord._id]: { ...prev[ord._id], courierName: e.target.value } }))}
                                style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.83rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 150px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Tracking Number</label>
                              <input type="text" placeholder="e.g. DL123456789IN"
                                value={courierForm[ord._id]?.trackingNumber || ''}
                                onChange={e => setCourierForm(prev => ({ ...prev, [ord._id]: { ...prev[ord._id], trackingNumber: e.target.value } }))}
                                style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.83rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '2 1 200px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Tracking URL</label>
                              <input type="url" placeholder="https://courier.com/track/..."
                                value={courierForm[ord._id]?.trackingUrl || ''}
                                onChange={e => setCourierForm(prev => ({ ...prev, [ord._id]: { ...prev[ord._id], trackingUrl: e.target.value } }))}
                                style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.83rem' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 140px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280' }}>Est. Delivery Date</label>
                              <input type="date"
                                value={courierForm[ord._id]?.estimatedDeliveryDate || ''}
                                onChange={e => setCourierForm(prev => ({ ...prev, [ord._id]: { ...prev[ord._id], estimatedDeliveryDate: e.target.value } }))}
                                style={{ padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '0.83rem' }} />
                            </div>
                            <button
                              onClick={() => handleCourierSave(ord._id)}
                              style={{ padding: '8px 18px', borderRadius: '8px', backgroundColor: '#b76e79', color: 'white', border: 'none', fontWeight: '700', fontSize: '0.83rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Truck size={14} /> Save Courier Info
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersTab;
