import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { createPaymentOrder, verifyPayment, cancelPayment } from '../services/orderService';
import { useFestival } from '../context/FestivalContext';
import {
  ChevronRight, MapPin, Phone, ShieldCheck, Wallet, Sparkles,
  Truck, AlertTriangle, CheckCircle, XCircle, RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

const BACKEND_URL = 'http://localhost:5000';

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const { cart, clearCart } = useContext(CartContext);
  const { computePrice, activeSale } = useFestival();
  const navigate = useNavigate();

  // ── Structured Delivery Address ────────────────────────────────────────────
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    houseNo: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [paymentMethod, setPaymentMethod] = useState('Razorpay');

  // ── UI States ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Payment result states
  const [paymentResult, setPaymentResult] = useState(null); // 'success' | 'failed' | null
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);

  // Mock modal for dev environment
  const [showMockModal, setShowMockModal] = useState(false);
  const [mockPaymentDetails, setMockPaymentDetails] = useState(null);

  // Fill name + phone from profile
  useEffect(() => {
    if (user) {
      setAddress(prev => ({
        ...prev,
        fullName: user.name || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatPrice = (price) => `₹${Number(price).toLocaleString('en-IN')}`;

  const handleAddressChange = (field, value) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    setErrorMsg('');
  };

  const validateForm = () => {
    const { fullName, phone, houseNo, street, city, state, pincode } = address;
    if (!fullName.trim()) { setErrorMsg('Please enter your full name.'); return false; }
    if (!/^\d{10}$/.test(phone.trim())) { setErrorMsg('Phone number must be exactly 10 digits.'); return false; }
    if (!houseNo.trim()) { setErrorMsg('House / Flat number is required.'); return false; }
    if (!street.trim()) { setErrorMsg('Street / Area is required.'); return false; }
    if (!city.trim()) { setErrorMsg('City is required.'); return false; }
    if (!state.trim()) { setErrorMsg('State is required.'); return false; }
    if (!/^\d{6}$/.test(pincode.trim())) { setErrorMsg('Pincode must be exactly 6 digits.'); return false; }
    if (!cart.items || cart.items.length === 0) { setErrorMsg('Your cart is empty.'); return false; }
    return true;
  };

  // ── After successful verification ─────────────────────────────────────────
  const handlePaymentSuccess = async (orderId) => {
    confetti({ particleCount: 180, spread: 90, colors: ['#D86B80', '#7EAD76', '#E892A2', '#A1C99A'], origin: { y: 0.6 } });
    await clearCart();
    setConfirmedOrderId(orderId);
    setPaymentResult('success');
    setLoading(false);
  };

  const handlePaymentFailed = (pendingOrderId) => {
    setConfirmedOrderId(pendingOrderId);
    setPaymentResult('failed');
    setLoading(false);
  };

  // ── Open Real Razorpay Checkout ────────────────────────────────────────────
  const openRazorpayCheckout = (orderData) => {
    const { razorpayOrderId, amount, currency, razorpayKeyId, dbOrderId, merchantName } = orderData;

    const options = {
      key: razorpayKeyId,
      amount,
      currency,
      name: merchantName || "EVAAS Women's Wear",
      description: 'Secure Checkout — EVAAS',
      order_id: razorpayOrderId,
      handler: async (response) => {
        try {
          setLoading(true);
          const verifyRes = await verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            db_order_id: dbOrderId
          });

          if (verifyRes.success) {
            await handlePaymentSuccess(dbOrderId);
          } else {
            handlePaymentFailed(dbOrderId);
          }
        } catch {
          handlePaymentFailed(dbOrderId);
        }
      },
      prefill: {
        name: address.fullName,
        email: user?.email || '',
        contact: address.phone
      },
      notes: {
        order_id: String(dbOrderId)
      },
      theme: { color: '#b76e79' },
      modal: {
        ondismiss: async () => {
          // Customer closed modal without paying
          try {
            await cancelPayment(dbOrderId);
          } catch {}
          handlePaymentFailed(dbOrderId);
        }
      }
    };

    setLoading(false);
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // ── Mock Simulate Success ─────────────────────────────────────────────────
  const handleSimulatedPaymentSuccess = async () => {
    setShowMockModal(false);
    setLoading(true);
    try {
      const verifyRes = await verifyPayment({
        razorpay_order_id: mockPaymentDetails.razorpayOrderId,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: `sig_mock_${Date.now()}`,
        db_order_id: mockPaymentDetails.dbOrderId
      });

      if (verifyRes.success) {
        await handlePaymentSuccess(mockPaymentDetails.dbOrderId);
      } else {
        handlePaymentFailed(mockPaymentDetails.dbOrderId);
      }
    } catch {
      handlePaymentFailed(mockPaymentDetails.dbOrderId);
    }
  };

  // ── Main Place Order Handler ───────────────────────────────────────────────
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setPaymentResult(null);

    if (!validateForm()) return;

    setLoading(true);

    // Online Payment Flow (Razorpay)
    try {
      const cartItems = cart.items.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity,
        size: item.size
        // NOTE: Do NOT send price — backend will verify from DB
      }));

      const orderRes = await createPaymentOrder({
        cartItems,
        deliveryAddress: address
      });

      if (orderRes.isMock || orderRes.razorpayOrderId?.startsWith('order_mock_')) {
        // Development mock mode
        setLoading(false);
        setMockPaymentDetails({
          razorpayOrderId: orderRes.razorpayOrderId,
          dbOrderId: orderRes.dbOrderId,
          amount: orderRes.amount
        });
        setShowMockModal(true);
      } else if (window.Razorpay) {
        openRazorpayCheckout(orderRes);
      } else {
        // Razorpay script not loaded — fall back to mock
        setLoading(false);
        setMockPaymentDetails({
          razorpayOrderId: orderRes.razorpayOrderId,
          dbOrderId: orderRes.dbOrderId,
          amount: orderRes.amount
        });
        setShowMockModal(true);
      }
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
    }
  };

  // Compute festival-discounted totals
  const cartItemsWithDiscount = (cart?.items || []).map(item => {
    const product = item.productId;
    if (!product) return { ...item, linePrice: 0 };
    const priceInfo = computePrice(product);
    const unitPrice = priceInfo.hasSaleDiscount ? priceInfo.finalPrice : product.price;
    return { ...item, linePrice: unitPrice * item.quantity, priceInfo };
  });

  const festivalSubtotal = cartItemsWithDiscount.reduce((sum, i) => sum + i.linePrice, 0);
  const originalSubtotal = (cart?.items || []).reduce((sum, item) => {
    const p = item.productId;
    if (!p) return sum;
    const base = p.discount > 0 ? p.price - (p.price * p.discount / 100) : p.price;
    return sum + base * item.quantity;
  }, 0);
  const festivalSavings = parseFloat((originalSubtotal - festivalSubtotal).toFixed(2));
  const hasFestivalDiscount = activeSale && festivalSavings > 0;

  const cartTotal = hasFestivalDiscount ? festivalSubtotal : (cart?.totalPrice || 0);

  // ── Payment Success Screen ─────────────────────────────────────────────────
  if (paymentResult === 'success') {
    return (
      <div className="container" style={{ paddingTop: '3rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={44} color="#059669" />
          </div>
          <div>
            <h1 className="font-serif" style={{ fontSize: '2rem', color: '#059669', fontWeight: '700' }}>Payment Successful!</h1>
            <p style={{ color: 'var(--light-text)', marginTop: '8px' }}>Your order has been confirmed.</p>
          </div>
          {confirmedOrderId && (
            <div style={{ backgroundColor: 'var(--bg-main)', borderRadius: '8px', padding: '1rem 1.5rem', fontSize: '0.9rem', width: '100%', textAlign: 'left' }}>
              <div><strong>Order ID:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--rose-gold-dark)' }}>#{String(confirmedOrderId).slice(-10).toUpperCase()}</span></div>
            </div>
          )}
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '0.85rem',
            color: '#78350f',
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            textAlign: 'left'
          }}>
            <Truck size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Your order will be delivered within <strong>10–15 working days</strong> by our courier partner. You'll receive tracking details once shipped.</span>
          </div>
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '0.82rem',
            color: '#7f1d1d',
            textAlign: 'left'
          }}>
            ⚠️ <strong>EVAAS does not accept returns or provide refunds.</strong> Please verify product details, size, color, and delivery address carefully before placing your order.
          </div>
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button className="btn btn-outline" onClick={() => navigate('/products')} style={{ flex: 1 }}>Continue Shopping</button>
            <button className="btn btn-primary" onClick={() => navigate('/orders')} style={{ flex: 1 }}>View My Orders</button>
          </div>
        </div>
      </div>
    );
  }

  // ── Payment Failed Screen ──────────────────────────────────────────────────
  if (paymentResult === 'failed') {
    return (
      <div className="container" style={{ paddingTop: '3rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={44} color="#dc2626" />
          </div>
          <div>
            <h1 className="font-serif" style={{ fontSize: '2rem', color: '#dc2626', fontWeight: '700' }}>Payment Failed</h1>
            <p style={{ color: 'var(--light-text)', marginTop: '8px' }}>Your order has <strong>not</strong> been confirmed.</p>
            <p style={{ color: 'var(--light-text)', fontSize: '0.85rem', marginTop: '4px' }}>No charges have been deducted. Stock has not been affected.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
            <button className="btn btn-outline" onClick={() => navigate('/cart')} style={{ flex: 1 }}>Back to Cart</button>
            <button
              className="btn btn-primary"
              onClick={() => { setPaymentResult(null); setErrorMsg(''); }}
              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
            >
              <RotateCcw size={16} /> Retry Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Checkout Form ─────────────────────────────────────────────────────
  return (
    <div className="container" style={{ paddingTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--light-text)' }}>
        <Link to="/cart">Cart</Link>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--rose-gold-dark)', fontWeight: '500' }}>Checkout</span>
      </div>

      <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: '600' }}>Secure Checkout</h1>

      {errorMsg && (
        <div style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertTriangle size={16} /> {errorMsg}
        </div>
      )}

      {/* No Return / No Refund Policy Banner */}
      <div style={{
        backgroundColor: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '10px',
        padding: '12px 16px',
        fontSize: '0.82rem',
        color: '#78350f',
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start'
      }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>EVAAS does not accept returns or provide refunds.</strong> Please verify product details, size, color, and delivery address carefully before placing your order.
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '2.5rem' }} className="mobile-stack-grid">

        {/* ── Left: Form ────────────────────────────────────────────────────── */}
        <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Delivery Address */}
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--rose-gold-dark)' }}>
              <MapPin size={20} /> Delivery Address
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Priya Sharma"
                  value={address.fullName}
                  onChange={e => handleAddressChange('fullName', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  value={address.phone}
                  onChange={e => handleAddressChange('phone', e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>

              <div className="form-group">
                <label>House / Flat No. *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 12A, Block B"
                  value={address.houseNo}
                  onChange={e => handleAddressChange('houseNo', e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Street / Area *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. MG Road, Koramangala"
                  value={address.street}
                  onChange={e => handleAddressChange('street', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Bangalore"
                  value={address.city}
                  onChange={e => handleAddressChange('city', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>State *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Karnataka"
                  value={address.state}
                  onChange={e => handleAddressChange('state', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Pincode *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="6-digit pincode"
                  maxLength={6}
                  value={address.pincode}
                  onChange={e => handleAddressChange('pincode', e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '0.85rem',
            color: '#065f46',
            display: 'flex',
            gap: '10px',
            alignItems: 'center'
          }}>
            <Truck size={18} style={{ flexShrink: 0 }} />
            <span>Estimated delivery: <strong>10–15 working days</strong> via our courier partner. Free shipping on all orders.</span>
          </div>

          {/* Payment Method */}
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--rose-gold-dark)' }}>
              <Wallet size={20} /> Payment Method
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '1.25rem', borderRadius: '10px',
                border: '2px solid var(--rose-gold)', backgroundColor: 'var(--rose-gold-light)'
              }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--rose-gold-dark)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', flexShrink: 0
                }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'white' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--dark-text)' }}>
                      💳 Online Payment (Razorpay)
                    </span>
                    <span style={{
                      backgroundColor: '#d1fae5', color: '#065f46', fontSize: '0.72rem',
                      fontWeight: '700', padding: '2px 8px', borderRadius: '12px'
                    }}>
                      100% SECURE
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--light-text)', lineHeight: '1.4' }}>
                    UPI (Google Pay, PhonePe, Paytm, CRED), Credit/Debit Cards, Net Banking & Wallets.
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--rose-gold-dark)', fontWeight: '600', marginTop: '2px' }}>
                    ⚡ Instant confirmation & priority courier dispatch
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            id="checkout-pay-now-btn"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Processing...
              </>
            ) : (
              <><ShieldCheck size={20} /> Pay Now — {formatPrice(cartTotal)}</>
            )}
          </button>
        </form>

        {/* ── Right: Order Summary ───────────────────────────────────────────── */}
        <div>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', border: '1px solid var(--border)', position: 'sticky', top: '80px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', borderBottom: '1px solid var(--light-border)', paddingBottom: '0.5rem' }}>
              Order Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
              {cartItemsWithDiscount.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '54px', backgroundColor: '#eee', borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                    <img
                      src={item.productId?.images?.[0] ? `${BACKEND_URL}${item.productId.images[0]}` : ''}
                      alt={item.productId?.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.productId?.name}</span>
                    <span style={{ color: 'var(--light-text)', fontSize: '0.78rem' }}>Size: {item.size} × {item.quantity}</span>
                    {item.priceInfo?.hasSaleDiscount && (
                      <span style={{ color: '#dc2626', fontSize: '0.72rem', textDecoration: 'line-through' }}>
                        ₹{(item.productId.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', flexShrink: 0, color: item.priceInfo?.hasSaleDiscount ? (activeSale?.theme?.primaryColor || '#D86B80') : 'inherit' }}>
                    {formatPrice(item.linePrice)}
                  </span>
                </div>
              ))}
            </div>

            {/* Festival Discount Banner in Summary */}
            {hasFestivalDiscount && (
              <div style={{
                background: `linear-gradient(135deg, ${activeSale.theme?.primaryColor || '#D86B80'}20, ${activeSale.theme?.accentColor || '#FF6B00'}15)`,
                border: `1px solid ${activeSale.theme?.primaryColor || '#D86B80'}50`,
                borderRadius: '8px', padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '0.82rem', color: activeSale.theme?.primaryColor || '#D86B80'
              }}>
                <span style={{ fontSize: '1rem' }}>{activeSale.theme?.emoji || '🎉'}</span>
                <div>
                  <div style={{ fontWeight: '700' }}>{activeSale.name}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>You save {formatPrice(festivalSavings)} 🎊</div>
                </div>
              </div>
            )}

            <hr style={{ border: 'none', borderTop: '1px solid var(--light-border)' }} />

            {hasFestivalDiscount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--light-text)' }}>
                <span>Original Price</span>
                <span style={{ textDecoration: 'line-through' }}>{formatPrice(originalSubtotal)}</span>
              </div>
            )}

            {hasFestivalDiscount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#16a34a', fontWeight: '700' }}>
                <span>🎉 Festival Discount</span>
                <span>− {formatPrice(festivalSavings)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--light-text)' }}>
              <span>Shipping</span>
              <span style={{ color: '#059669', fontWeight: '600' }}>FREE</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '700', color: 'var(--dark-text)' }}>
              <span>Total</span>
              <span style={{ color: activeSale?.theme?.primaryColor || 'var(--rose-gold-dark)' }}>{formatPrice(cartTotal)}</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', color: 'var(--light-text)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              <ShieldCheck size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <span>Your payment data is encrypted and secure.</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── Mock Payment Modal (dev mode) ──────────────────────────────────── */}
      {showMockModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: '460px', backgroundColor: 'white',
            padding: '2.5rem 2rem', textAlign: 'center',
            display: 'flex', flexDirection: 'column', gap: '1.25rem'
          }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--rose-gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rose-gold-dark)', margin: '0 auto' }}>
              <Sparkles size={28} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.4rem', color: 'var(--rose-gold-dark)' }}>Mock Razorpay Checkout</h2>
              <p style={{ color: 'var(--light-text)', fontSize: '0.82rem', marginTop: '4px' }}>
                Dev/Test Mode — No real keys configured. Simulating Razorpay response.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', textAlign: 'left', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Mock Order ID:</strong> <span style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{mockPaymentDetails?.razorpayOrderId}</span></div>
              <div><strong>Amount:</strong> {formatPrice((mockPaymentDetails?.amount || 0) / 100)}</div>
              <div><strong>Merchant:</strong> EVAAS Women's Wear</div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--light-text)' }}>
              Clicking <em>Simulate Success</em> mimics a successful UPI/card payment from Razorpay servers.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-outline"
                onClick={async () => {
                  setShowMockModal(false);
                  try { await cancelPayment(mockPaymentDetails.dbOrderId); } catch {}
                  handlePaymentFailed(mockPaymentDetails.dbOrderId);
                }}
                style={{ flex: 1, padding: '10px' }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSimulatedPaymentSuccess}
                style={{ flex: 2, padding: '10px' }}
              >
                ✓ Simulate Success
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .mobile-stack-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
        }
      `}</style>

    </div>
  );
};

export default Checkout;
