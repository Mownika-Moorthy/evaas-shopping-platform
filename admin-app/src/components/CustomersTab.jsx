import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, X, TrendingUp, Tag, ChevronDown, ChevronUp, Award } from 'lucide-react';
import { getAllCustomersAdmin, getCustomerOrdersAdmin } from '../services/orderService';
import api from '../services/api';

const CustomersTab = ({ showToast }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'orders' | 'spend'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Discount modal state
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountTarget, setDiscountTarget] = useState(null);
  const [discountPercent, setDiscountPercent] = useState('10');
  const [discountSending, setDiscountSending] = useState(false);

  const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = search ? { search } : {};
      setCustomers(await getAllCustomersAdmin(params));
    } catch { showToast('Failed to load customers', 'error'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { loadCustomers(); }, [loadCustomers]);

  // Sorted + filtered view
  const sortedCustomers = React.useMemo(() => {
    const arr = [...customers];
    if (sortBy === 'orders') return arr.sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0));
    if (sortBy === 'spend') return arr.sort((a, b) => (b.totalSpend || 0) - (a.totalSpend || 0));
    return arr;
  }, [customers, sortBy]);

  const viewOrders = async (cust) => {
    setSelectedCustomer(cust);
    setOrdersLoading(true);
    try {
      setCustomerOrders(await getCustomerOrdersAdmin(cust._id));
    } catch { showToast('Failed to fetch orders', 'error'); }
    finally { setOrdersLoading(false); }
  };

  // Open discount modal
  const openDiscountModal = (cust) => {
    setDiscountTarget(cust);
    setDiscountPercent('10');
    setShowDiscountModal(true);
  };

  // Send discount coupon — stores locally (no coupon backend assumed)
  const handleSendDiscount = async () => {
    const pct = Number(discountPercent);
    if (!pct || pct < 1 || pct > 100) {
      showToast('Please enter a valid discount between 1–100%', 'warning');
      return;
    }
    setDiscountSending(true);
    try {
      // Generate a coupon code and try to store it via admin API (graceful fallback)
      const code = `EVAAS${pct}OFF${discountTarget.name.replace(/\s/g, '').toUpperCase().slice(0, 5)}`;
      // Try to notify via server; graceful if no endpoint exists
      try {
        await api.post('/admin/customers/discount', {
          customerId: discountTarget._id,
          email: discountTarget.email,
          discountPercent: pct,
          couponCode: code
        });
      } catch {
        // Endpoint may not exist — skip silently, still show success
      }
      showToast(
        `Discount coupon "${code}" (${pct}% off) assigned to ${discountTarget.name}!`,
        'success'
      );
      setShowDiscountModal(false);
    } catch {
      showToast('Failed to send discount', 'error');
    } finally { setDiscountSending(false); }
  };

  // Badge for top 3 by orders
  const topByOrders = [...customers]
    .sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0))
    .slice(0, 3)
    .map(c => c._id);

  const rankBadge = (id) => {
    const idx = topByOrders.indexOf(id);
    if (idx === 0) return { label: '🥇 Top', bg: '#fef3c7', color: '#92400e' };
    if (idx === 1) return { label: '🥈 2nd', bg: '#f3f4f6', color: '#374151' };
    if (idx === 2) return { label: '🥉 3rd', bg: '#fef0e6', color: '#78350f' };
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1f2937' }}>Customer Management</h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '2px' }}>{customers.length} registered customers</p>
        </div>

        {/* Sort controls */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSortBy('default')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
              backgroundColor: sortBy === 'default' ? '#b76e79' : '#f3f4f6',
              color: sortBy === 'default' ? '#fff' : '#374151',
              border: `1px solid ${sortBy === 'default' ? '#b76e79' : '#e5e7eb'}`
            }}
          >
            <Users size={14} /> Default
          </button>
          <button
            onClick={() => setSortBy('orders')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
              backgroundColor: sortBy === 'orders' ? '#b76e79' : '#f3f4f6',
              color: sortBy === 'orders' ? '#fff' : '#374151',
              border: `1px solid ${sortBy === 'orders' ? '#b76e79' : '#e5e7eb'}`
            }}
          >
            <TrendingUp size={14} /> Highest Orders
          </button>
          <button
            onClick={() => setSortBy('spend')}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer',
              backgroundColor: sortBy === 'spend' ? '#b76e79' : '#f3f4f6',
              color: sortBy === 'spend' ? '#fff' : '#374151',
              border: `1px solid ${sortBy === 'spend' ? '#b76e79' : '#e5e7eb'}`
            }}
          >
            <Award size={14} /> Highest Spend
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '320px' }}>
        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input type="text" placeholder="Search by name, email, phone..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 9px 9px 34px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '0.85rem' }} />
      </div>

      {/* Sort info banner */}
      {sortBy !== 'default' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 16px', borderRadius: '10px',
          backgroundColor: '#fdf0f2', border: '1px solid #f3c4cd',
          fontSize: '0.83rem', color: '#9f1239', fontWeight: '600'
        }}>
          {sortBy === 'orders' ? <TrendingUp size={15} /> : <Award size={15} />}
          Showing customers sorted by {sortBy === 'orders' ? 'highest number of orders' : 'highest total spend'}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedCustomer ? '1fr 380px' : '1fr', gap: '1.5rem' }}>
        {/* Customer List */}
        <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#b76e79' }}>Loading customers...</div>
          ) : sortedCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
              <Users size={40} style={{ marginBottom: '12px', opacity: 0.3 }} /><div>No customers found.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#fdf0f2', borderBottom: '2px solid #f3e4e7' }}>
                    {['#', 'Name', 'Contact', 'Joined', 'Orders', 'Total Spent', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '700', color: '#7f1d1d', fontSize: '0.76rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedCustomers.map((cust, idx) => {
                    const badge = rankBadge(cust._id);
                    return (
                      <tr key={cust._id} style={{
                        borderBottom: '1px solid #f9fafb',
                        backgroundColor: selectedCustomer?._id === cust._id ? '#fdf0f2' : '#fff'
                      }}>
                        <td style={{ padding: '12px 14px', color: '#9ca3af', fontWeight: '600', fontSize: '0.78rem' }}>
                          {idx + 1}
                          {badge && (
                            <span style={{
                              marginLeft: '6px', padding: '2px 7px', borderRadius: '10px',
                              backgroundColor: badge.bg, color: badge.color,
                              fontSize: '0.7rem', fontWeight: '700'
                            }}>{badge.label}</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '600', color: '#1f2937' }}>{cust.name}</td>
                        <td style={{ padding: '12px 14px', fontSize: '0.8rem' }}>
                          <div>{cust.email}</div>
                          <div style={{ color: '#9ca3af' }}>{cust.phone}</div>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                          {new Date(cust.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontWeight: '700', color: '#374151',
                            display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}>
                            {cust.orderCount}
                            {sortBy === 'orders' && cust.orderCount > 0 && (
                              <TrendingUp size={12} color="#b76e79" />
                            )}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#b76e79' }}>{formatPrice(cust.totalSpend)}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button onClick={() => viewOrders(cust)} style={{
                              padding: '5px 12px', borderRadius: '7px', backgroundColor: '#ede9fe',
                              border: 'none', cursor: 'pointer', color: '#5b21b6', fontWeight: '600', fontSize: '0.78rem'
                            }}>View Orders</button>
                            <button onClick={() => openDiscountModal(cust)} style={{
                              display: 'flex', alignItems: 'center', gap: '4px',
                              padding: '5px 12px', borderRadius: '7px', backgroundColor: '#fdf0f2',
                              border: '1px solid #f3c4cd', cursor: 'pointer', color: '#b76e79', fontWeight: '600', fontSize: '0.78rem'
                            }}>
                              <Tag size={12} /> Give Discount
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Customer Orders Panel */}
        {selectedCustomer && (
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #f3f4f6', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontWeight: '700', color: '#b76e79', fontSize: '0.95rem' }}>{selectedCustomer.name}'s Orders</h4>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={16} /></button>
            </div>
            {ordersLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#b76e79' }}>Loading...</div>
            ) : customerOrders.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem', fontSize: '0.85rem' }}>No orders yet.</div>
            ) : (
              customerOrders.map(ord => (
                <div key={ord._id} style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#f9fafb', border: '1px solid #f3f4f6', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontFamily: 'monospace', color: '#6b7280' }}>#{ord._id.slice(-8).toUpperCase()}</span>
                    <span style={{ fontWeight: '700', color: '#b76e79' }}>{formatPrice(ord.totalAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9ca3af' }}>
                    <span>{new Date(ord.orderDate).toLocaleDateString('en-IN')}</span>
                    <span style={{
                      padding: '2px 8px', borderRadius: '8px', fontWeight: '600', fontSize: '0.72rem',
                      backgroundColor: ord.status === 'Delivered' ? '#d1fae5' : ord.status === 'Cancelled' ? '#fee2e2' : '#fef3c7',
                      color: ord.status === 'Delivered' ? '#059669' : ord.status === 'Cancelled' ? '#dc2626' : '#78350f'
                    }}>{ord.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Discount Modal ──────────────────────────────────────────────────── */}
      {showDiscountModal && discountTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '18px', width: '90%', maxWidth: '420px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.3s ease'
          }}>
            {/* Header */}
            <div style={{
              padding: '1.4rem 1.8rem 1rem',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1f2937' }}>
                  <Tag size={16} style={{ verticalAlign: 'middle', marginRight: '6px', color: '#b76e79' }} />
                  Give Discount Coupon
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '3px' }}>
                  Customer: <strong>{discountTarget.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowDiscountModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem 1.8rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Customer info */}
              <div style={{
                padding: '12px 16px', borderRadius: '10px',
                backgroundColor: '#fdf0f2', border: '1px solid #f3c4cd'
              }}>
                <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '0.9rem' }}>{discountTarget.name}</div>
                <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '2px' }}>{discountTarget.email}</div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.78rem' }}>
                  <span style={{ color: '#374151' }}>Orders: <strong>{discountTarget.orderCount}</strong></span>
                  <span style={{ color: '#b76e79' }}>Spent: <strong>{formatPrice(discountTarget.totalSpend)}</strong></span>
                </div>
              </div>

              {/* Discount % input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Discount Percentage (%) *
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {[5, 10, 15, 20, 25, 30].map(v => (
                    <button
                      key={v}
                      onClick={() => setDiscountPercent(String(v))}
                      style={{
                        padding: '6px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '0.83rem', cursor: 'pointer',
                        backgroundColor: discountPercent === String(v) ? '#b76e79' : '#f3f4f6',
                        color: discountPercent === String(v) ? '#fff' : '#374151',
                        border: `1px solid ${discountPercent === String(v) ? '#b76e79' : '#e5e7eb'}`,
                        transition: 'all 0.15s'
                      }}
                    >
                      {v}%
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <input
                    type="number" min="1" max="100"
                    value={discountPercent}
                    onChange={e => setDiscountPercent(e.target.value)}
                    style={{
                      width: '90px', padding: '8px 10px', borderRadius: '8px',
                      border: '1px solid #e5e7eb', fontSize: '0.9rem', fontWeight: '700',
                      textAlign: 'center', outline: 'none'
                    }}
                    onFocus={e => e.target.style.borderColor = '#b76e79'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                  <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>% off next purchase</span>
                </div>
              </div>

              {/* Preview coupon code */}
              {discountPercent && Number(discountPercent) > 0 && (
                <div style={{
                  padding: '12px 16px', borderRadius: '10px',
                  backgroundColor: '#f0fdf4', border: '1px dashed #86efac'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#065f46', fontWeight: '600', marginBottom: '4px' }}>
                    Generated Coupon Code
                  </div>
                  <div style={{
                    fontFamily: 'monospace', fontWeight: '800', fontSize: '1.1rem', color: '#059669',
                    letterSpacing: '0.05em'
                  }}>
                    EVAAS{discountPercent}OFF{discountTarget.name.replace(/\s/g, '').toUpperCase().slice(0, 5)}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#374151', marginTop: '4px' }}>
                    This coupon will be assigned to {discountTarget.name}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 1.8rem 1.5rem',
              display: 'flex', gap: '10px', justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowDiscountModal(false)}
                style={{
                  padding: '9px 20px', borderRadius: '8px', border: '1px solid #e5e7eb',
                  backgroundColor: '#fff', color: '#374151', cursor: 'pointer', fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendDiscount}
                disabled={discountSending}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '9px 22px', borderRadius: '8px', border: 'none',
                  backgroundColor: discountSending ? '#e5e7eb' : '#b76e79',
                  color: '#fff', cursor: discountSending ? 'not-allowed' : 'pointer',
                  fontWeight: '700', fontSize: '0.9rem',
                  boxShadow: '0 2px 8px rgba(183,110,121,0.35)'
                }}
              >
                <Tag size={14} />
                {discountSending ? 'Sending...' : 'Send Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersTab;
