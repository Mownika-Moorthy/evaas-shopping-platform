import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getMyOrders, getOrderById, getMyReviews } from '../services/orderService';
import { submitProductReview } from '../services/productService';
import {
  ShoppingBag, MapPin, Phone, Mail, ChevronRight, User,
  Truck, Package, CheckCircle, Clock, AlertTriangle, ExternalLink,
  Star, X, Check, Edit3, MessageSquare
} from 'lucide-react';

import { API_URL, getImageUrl } from '../config';

const BACKEND_URL = API_URL;

// ── Order status steps ─────────────────────────────────────────────────────────
const TIMELINE_STEPS = [
  { key: 'Confirmed',        label: 'Confirmed',       icon: <CheckCircle size={16} /> },
  { key: 'Processing',       label: 'Processing',      icon: <Package size={16} /> },
  { key: 'Shipped',          label: 'Shipped',         icon: <Truck size={16} /> },
  { key: 'Out for Delivery', label: 'Out for Delivery',icon: <Truck size={16} /> },
  { key: 'Delivered',        label: 'Delivered',       icon: <CheckCircle size={16} /> }
];

const STEP_ORDER = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

const getStatusStepIndex = (status) => STEP_ORDER.indexOf(status);

const Orders = () => {
  const { user } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'reviews'

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Reviews State
  const [myReviews, setMyReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Review Modal State
  const [reviewModal, setReviewModal] = useState({
    isOpen: false,
    product: null,
    existingReview: null
  });
  const [modalRating, setModalRating] = useState(5);
  const [modalHoverRating, setModalHoverRating] = useState(0);
  const [modalComment, setModalComment] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');

  const formatPrice = (price) => `₹${Number(price || 0).toLocaleString('en-IN')}`;

  const formatDate = (dateStr) =>
    dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  // ── Fetch Orders & Reviews ──────────────────────────────────────────────────
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await getMyOrders();
      const list = Array.isArray(data) ? data : [];
      setOrders(list);
      if (list.length > 0) fetchOrderDetail(list[0]._id);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const data = await getMyReviews();
      setMyReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchReviews();
  }, []);

  const fetchOrderDetail = async (orderId) => {
    setLoadingDetail(true);
    try {
      const detail = await getOrderById(orderId);
      setSelectedOrder(detail);
    } catch (err) {
      console.error('Error loading order:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── Review Modal Helpers ────────────────────────────────────────────────────
  const openReviewModal = (product, existingReview = null) => {
    setReviewModal({
      isOpen: true,
      product,
      existingReview
    });
    setModalRating(existingReview ? existingReview.rating : 5);
    setModalHoverRating(0);
    setModalComment(existingReview ? existingReview.comment : '');
    setModalError('');
    setModalSuccess('');
  };

  const closeReviewModal = () => {
    setReviewModal({ isOpen: false, product: null, existingReview: null });
    setModalError('');
    setModalSuccess('');
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModal.product?._id) return;
    if (!modalComment.trim()) {
      setModalError('Please share a few words about your experience.');
      return;
    }

    setModalLoading(true);
    setModalError('');
    setModalSuccess('');

    try {
      const res = await submitProductReview(reviewModal.product._id, {
        rating: modalRating,
        comment: modalComment.trim()
      });

      setModalSuccess(res.message || 'Review submitted successfully!');

      // Update state instantly
      const updatedRev = res.review;
      setMyReviews((prev) => {
        const filtered = prev.filter(
          (r) => (r.productId?._id || r.productId) !== reviewModal.product._id
        );
        return [updatedRev, ...filtered];
      });

      setTimeout(() => {
        closeReviewModal();
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Error submitting review.');
    } finally {
      setModalLoading(false);
    }
  };

  // Helper to render static stars
  const renderStars = (score, size = 14) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={size}
          fill={i <= score ? '#fbbf24' : 'none'}
          color={i <= score ? '#fbbf24' : '#d1d5db'}
        />
      );
    }
    return stars;
  };

  // Extract products awaiting review across all active orders
  const unreviewedProducts = [];
  const reviewedProductIds = new Set(
    myReviews.map((r) => r.productId?._id || r.productId)
  );

  orders
    .filter((o) => o.status !== 'Cancelled')
    .forEach((o) => {
      (o.products || []).forEach((item) => {
        const prod = item.productId;
        if (prod && prod._id && !reviewedProductIds.has(prod._id)) {
          if (!unreviewedProducts.some((p) => p._id === prod._id)) {
            unreviewedProducts.push(prod);
          }
        }
      });
    });

  // ── Status badge ──────────────────────────────────────────────────────────
  const statusBadge = (status) => {
    const map = {
      Pending:           { bg: '#fef3c7', color: '#92400e' },
      Confirmed:         { bg: '#dbeafe', color: '#1e40af' },
      Processing:        { bg: '#ede9fe', color: '#5b21b6' },
      Shipped:           { bg: '#fef9c3', color: '#78350f' },
      'Out for Delivery':{ bg: '#ffedd5', color: '#9a3412' },
      Delivered:         { bg: '#d1fae5', color: '#065f46' },
      Cancelled:         { bg: '#fee2e2', color: '#7f1d1d' }
    };
    const style = map[status] || { bg: '#f3f4f6', color: '#374151' };
    return (
      <span style={{
        backgroundColor: style.bg, color: style.color,
        padding: '3px 10px', borderRadius: '20px',
        fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap'
      }}>
        {status}
      </span>
    );
  };

  const paymentBadge = (status) => {
    const colors = {
      Paid:    { bg: '#d1fae5', color: '#059669' },
      Pending: { bg: '#fef3c7', color: '#92400e' },
      Failed:  { bg: '#fee2e2', color: '#dc2626' }
    };
    const c = colors[status] || { bg: '#f3f4f6', color: '#374151' };
    return (
      <span style={{ backgroundColor: c.bg, color: c.color, padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700' }}>
        {status}
      </span>
    );
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* Header */}
      <div className="card" style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--purple-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)' }}>
            <ShoppingBag size={28} />
          </div>
          <div>
            <h1 className="font-serif" style={{ fontSize: '1.6rem', fontWeight: '700' }}>My Orders & Reviews</h1>
            <p style={{ color: 'var(--light-text)', fontSize: '0.85rem' }}>Track deliveries, view purchase history, and share your product feedback</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/profile" className="btn btn-outline btn-sm"><User size={15} /> Edit Profile</Link>
          <Link to="/products" className="btn btn-primary btn-sm">Continue Shopping</Link>
        </div>
      </div>

      {/* Tabs navigation */}
      <div style={{
        display: 'flex', gap: '1rem', borderBottom: '2px solid var(--border-light)',
        paddingBottom: '0', marginTop: '-0.5rem'
      }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 18px', fontSize: '1rem', fontWeight: activeTab === 'orders' ? '700' : '500',
            color: activeTab === 'orders' ? 'var(--purple)' : 'var(--light-text)',
            borderBottom: activeTab === 'orders' ? '3px solid var(--purple)' : '3px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease'
          }}
        >
          <Package size={18} /> Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '10px 18px', fontSize: '1rem', fontWeight: activeTab === 'reviews' ? '700' : '500',
            color: activeTab === 'reviews' ? 'var(--purple)' : 'var(--light-text)',
            borderBottom: activeTab === 'reviews' ? '3px solid var(--purple)' : '3px solid transparent',
            display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease'
          }}
        >
          <Star size={18} fill={activeTab === 'reviews' ? 'var(--purple)' : 'none'} />
          My Reviews ({myReviews.length})
          {unreviewedProducts.length > 0 && (
            <span style={{
              backgroundColor: '#fbbf24', color: '#78350f', fontSize: '0.72rem',
              fontWeight: '700', padding: '1px 7px', borderRadius: '10px', marginLeft: '4px'
            }}>
              {unreviewedProducts.length} to review
            </span>
          )}
        </button>
      </div>

      {/* No Return Policy Banner */}
      <div style={{
        backgroundColor: '#fffbeb', border: '1px solid #fde68a',
        borderRadius: '10px', padding: '12px 16px', fontSize: '0.82rem', color: '#78350f',
        display: 'flex', gap: '10px', alignItems: 'flex-start'
      }}>
        <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span><strong>EVAAS does not accept returns or provide refunds.</strong> All sales are final. Products are delivered within <strong>10–15 working days</strong>.</span>
      </div>

      {/* ── TAB 1: ORDERS ────────────────────────────────────────────────────────── */}
      {activeTab === 'orders' && (
        <>
          {loadingOrders ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--purple)', fontSize: '1.1rem' }}>
              Loading your orders...
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', padding: '5rem 2rem', border: '1px solid var(--light-border)', color: 'var(--light-text)' }}>
              <ShoppingBag size={42} style={{ color: 'var(--purple)', marginBottom: '1rem' }} />
              <h3>You haven't placed any orders yet!</h3>
              <p style={{ marginTop: '0.5rem' }}>Browse our collection and place your first order.</p>
              <Link to="/products" className="btn btn-primary btn-sm" style={{ marginTop: '1.5rem' }}>Shop Now</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }} className="mobile-stack-grid">

              {/* Orders List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '80vh', overflowY: 'auto', paddingRight: '4px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--purple-dark)' }}>Recent Orders</h3>
                {orders.map(ord => (
                  <div
                    key={ord._id}
                    onClick={() => fetchOrderDetail(ord._id)}
                    style={{
                      backgroundColor: 'white', padding: '1.1rem', borderRadius: '12px',
                      border: selectedOrder?._id === ord._id ? '2px solid var(--purple)' : '1px solid var(--light-border)',
                      boxShadow: selectedOrder?._id === ord._id ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                      cursor: 'pointer', transition: 'var(--transition-smooth)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--light-text)', fontFamily: 'monospace' }}>#{ord._id.slice(-8).toUpperCase()}</span>
                      {statusBadge(ord.status)}
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--purple-dark)', margin: '0.25rem 0' }}>
                      {formatPrice(ord.totalAmount)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--light-text)' }}>
                      <span>{formatDate(ord.orderDate || ord.createdAt)}</span>
                      <span>{ord.products?.length || 0} item(s)</span>
                    </div>
                    <div style={{ marginTop: '6px' }}>
                      {paymentBadge(ord.paymentStatus)} <span style={{ fontSize: '0.72rem', color: 'var(--light-text)', marginLeft: '4px' }}>{ord.paymentMethod}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Detail */}
              <div>
                {loadingDetail ? (
                  <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--purple)' }}>Loading order details...</div>
                ) : selectedOrder ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Order Meta */}
                    <div className="card" style={{ padding: '1.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
                        <div>
                          <h2 style={{ fontSize: '1.15rem', fontWeight: '700' }}>Order Details</h2>
                          <span style={{ fontSize: '0.8rem', color: 'var(--light-text)' }}>Placed: {formatDate(selectedOrder.orderDate || selectedOrder.createdAt)}</span>
                        </div>
                        {statusBadge(selectedOrder.status)}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', backgroundColor: 'var(--bg-main)', borderRadius: '8px', padding: '1rem', fontSize: '0.82rem' }}>
                        <div>
                          <span style={{ color: 'var(--light-text)', display: 'block' }}>Order ID</span>
                          <strong style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>#{selectedOrder._id.slice(-10).toUpperCase()}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--light-text)', display: 'block' }}>Payment</span>
                          <strong>{selectedOrder.paymentMethod}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--light-text)', display: 'block' }}>Payment Status</span>
                          {paymentBadge(selectedOrder.paymentStatus)}
                        </div>
                        {selectedOrder.razorpayPaymentId && (
                          <div>
                            <span style={{ color: 'var(--light-text)', display: 'block' }}>Payment ID</span>
                            <strong style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{selectedOrder.razorpayPaymentId}</strong>
                          </div>
                        )}
                        <div>
                          <span style={{ color: 'var(--light-text)', display: 'block' }}>Total</span>
                          <strong style={{ color: 'var(--purple-dark)' }}>{formatPrice(selectedOrder.totalAmount)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Order Timeline */}
                    {selectedOrder.status !== 'Cancelled' ? (
                      <div className="card" style={{ padding: '1.75rem' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--purple-dark)', marginBottom: '1.5rem' }}>
                          Order Progress
                        </h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', overflowX: 'auto' }}>
                          <div style={{
                            position: 'absolute', top: '20px', left: '10%', right: '10%',
                            height: '2px', backgroundColor: '#e5e7eb', zIndex: 0
                          }} />
                          {TIMELINE_STEPS.map((step, i) => {
                            const currentIdx = getStatusStepIndex(selectedOrder.status);
                            const stepIdx = getStatusStepIndex(step.key);
                            const done = stepIdx <= currentIdx;
                            const active = stepIdx === currentIdx;
                            return (
                              <div key={step.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, position: 'relative', zIndex: 1 }}>
                                <div style={{
                                  width: '40px', height: '40px', borderRadius: '50%',
                                  backgroundColor: done ? 'var(--purple)' : '#e5e7eb',
                                  color: done ? 'white' : '#9ca3af',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontWeight: '700', fontSize: '0.8rem',
                                  boxShadow: active ? '0 0 0 4px rgba(155, 89, 214, 0.25)' : 'none',
                                  transition: 'all 0.3s ease'
                                }}>
                                  {done ? '✓' : i + 1}
                                </div>
                                <span style={{ fontSize: '0.72rem', fontWeight: active ? '700' : '500', color: done ? 'var(--purple-dark)' : '#9ca3af', textAlign: 'center', lineHeight: '1.3' }}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="card" style={{ padding: '1.25rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', textAlign: 'center', color: '#7f1d1d', fontWeight: '600' }}>
                        This order has been Cancelled.
                      </div>
                    )}

                    {/* Courier / Tracking Info */}
                    {(selectedOrder.courierName || selectedOrder.trackingNumber) && (
                      <div className="card" style={{ padding: '1.75rem' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--purple-dark)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Truck size={18} /> Shipping & Tracking
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                          {selectedOrder.courierName && (
                            <div>
                              <span style={{ color: 'var(--light-text)', display: 'block', fontSize: '0.75rem' }}>Courier</span>
                              <strong>{selectedOrder.courierName}</strong>
                            </div>
                          )}
                          {selectedOrder.trackingNumber && (
                            <div>
                              <span style={{ color: 'var(--light-text)', display: 'block', fontSize: '0.75rem' }}>Tracking Number</span>
                              <strong style={{ fontFamily: 'monospace' }}>{selectedOrder.trackingNumber}</strong>
                            </div>
                          )}
                          {selectedOrder.estimatedDeliveryDate && (
                            <div>
                              <span style={{ color: 'var(--light-text)', display: 'block', fontSize: '0.75rem' }}>Est. Delivery</span>
                              <strong>{formatDate(selectedOrder.estimatedDeliveryDate)}</strong>
                            </div>
                          )}
                          {selectedOrder.shippedAt && (
                            <div>
                              <span style={{ color: 'var(--light-text)', display: 'block', fontSize: '0.75rem' }}>Shipped On</span>
                              <strong>{formatDate(selectedOrder.shippedAt)}</strong>
                            </div>
                          )}
                        </div>
                        {selectedOrder.trackingUrl && (
                          <a href={selectedOrder.trackingUrl} target="_blank" rel="noopener noreferrer"
                            style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--purple-dark)', fontWeight: '600', fontSize: '0.85rem', textDecoration: 'none' }}>
                            <ExternalLink size={14} /> Track your shipment
                          </a>
                        )}
                      </div>
                    )}

                    {/* Ordered Items with Reviews */}
                    <div className="card" style={{ padding: '1.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--purple-dark)', margin: 0 }}>
                          Ordered Items
                        </h3>
                        <span style={{ fontSize: '0.78rem', color: 'var(--light-text)' }}>
                          Share your experience by leaving a review
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {selectedOrder.products?.map((item, idx) => {
                          const product = item.productId;
                          if (!product) return null;
                          const imageUrl = getImageUrl(product.images?.[0], '');

                          const existingRev = myReviews.find(
                            (r) => (r.productId?._id || r.productId) === product._id
                          );

                          return (
                            <div
                              key={idx}
                              style={{
                                display: 'flex', gap: '1rem', alignItems: 'center',
                                padding: '0.75rem', borderRadius: '10px',
                                border: '1px solid var(--border-light)', backgroundColor: '#fff',
                                flexWrap: 'wrap'
                              }}
                            >
                              <div style={{ width: '64px', height: '80px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8f5f2', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {imageUrl ? (
                                  <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <Package size={22} color="#b76e79" />
                                )}
                              </div>

                              <div style={{ flexGrow: 1, minWidth: '180px' }}>
                                <Link
                                  to={`/product/${product._id}`}
                                  style={{ fontWeight: '600', fontSize: '0.92rem', color: 'var(--dark-text)', textDecoration: 'none' }}
                                >
                                  {product.name}
                                </Link>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--light-text)', marginTop: '4px' }}>
                                  <span>Size: <strong>{item.size}</strong></span>
                                  <span>Qty: <strong>{item.quantity}</strong></span>
                                  <span>Price: <strong>{formatPrice(item.price)}</strong></span>
                                </div>

                                {/* Review Status or Action */}
                                <div style={{ marginTop: '8px' }}>
                                  {existingRev ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                        backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a',
                                        padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600'
                                      }}>
                                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                        Your Rating: {existingRev.rating}/5
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => openReviewModal(product, existingRev)}
                                        style={{
                                          background: 'none', border: 'none', color: 'var(--purple)',
                                          fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                                          display: 'inline-flex', alignItems: 'center', gap: '3px', textDecoration: 'underline'
                                        }}
                                      >
                                        <Edit3 size={11} /> Edit Review
                                      </button>
                                    </div>
                                  ) : selectedOrder.status !== 'Cancelled' ? (
                                    <button
                                      type="button"
                                      onClick={() => openReviewModal(product, null)}
                                      className="btn btn-outline btn-sm"
                                      style={{
                                        padding: '4px 10px', fontSize: '0.75rem',
                                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                                        color: 'var(--purple-dark)', borderColor: 'var(--purple-light)',
                                        borderRadius: '8px', backgroundColor: 'var(--purple-mist)'
                                      }}
                                    >
                                      <Star size={12} fill="#fbbf24" color="#fbbf24" /> Write a Review
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.72rem', color: 'var(--light-text)' }}>
                                      Review not available for cancelled order
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div style={{ fontWeight: '700', color: 'var(--purple-dark)', flexShrink: 0, textAlign: 'right' }}>
                                {formatPrice(item.price * item.quantity)}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <hr style={{ border: 'none', borderTop: '1px solid var(--light-border)', margin: '1.25rem 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: '700' }}>
                        <span>Total Invoice</span>
                        <span style={{ color: 'var(--purple-dark)' }}>{formatPrice(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="card" style={{ padding: '1.75rem' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--purple-dark)', marginBottom: '1rem' }}>Delivery Details</h3>
                      {selectedOrder.deliveryAddress ? (
                        <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--light-text)' }}>
                          <div style={{ fontWeight: '600', color: 'var(--dark-text)', fontSize: '1rem' }}>{selectedOrder.deliveryAddress.fullName}</div>
                          <div style={{ display: 'flex', gap: '6px' }}><Phone size={14} /> {selectedOrder.deliveryAddress.phone}</div>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                            <MapPin size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span>
                              {selectedOrder.deliveryAddress.houseNo}, {selectedOrder.deliveryAddress.street},<br />
                              {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} — {selectedOrder.deliveryAddress.pincode}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.9rem', color: 'var(--light-text)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}><MapPin size={14} /> {selectedOrder.shippingAddress}</div>
                          <div style={{ display: 'flex', gap: '6px' }}><Phone size={14} /> {selectedOrder.phone}</div>
                          <div style={{ display: 'flex', gap: '6px' }}><Mail size={14} /> {selectedOrder.userId?.email || user?.email}</div>
                        </div>
                      )}
                    </div>

                    {/* Delivery Policy */}
                    <div style={{
                      backgroundColor: '#fffbeb', border: '1px solid #fde68a',
                      borderRadius: '10px', padding: '12px 16px', fontSize: '0.82rem', color: '#78350f',
                      display: 'flex', gap: '10px', alignItems: 'flex-start'
                    }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span><strong>EVAAS does not accept returns or provide refunds.</strong> Products are delivered within 10–15 working days.</span>
                    </div>

                  </div>
                ) : null}
              </div>

            </div>
          )}
        </>
      )}

      {/* ── TAB 2: MY REVIEWS SECTION ────────────────────────────────────────────── */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Unreviewed Products Section (if any) */}
          {unreviewedProducts.length > 0 && (
            <div className="card" style={{ padding: '1.75rem', backgroundColor: 'var(--purple-mist)', border: '1px solid var(--purple-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <Star size={20} color="var(--purple)" fill="var(--purple)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--purple-dark)', margin: 0 }}>
                  Awaiting Your Feedback ({unreviewedProducts.length})
                </h3>
              </div>
              <p style={{ color: 'var(--body-text)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
                You purchased these products recently. Share what you loved about their fit and quality!
              </p>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1rem'
              }}>
                {unreviewedProducts.map((prod) => {
                  const img = getImageUrl(prod.images?.[0], '');
                  return (
                    <div
                      key={prod._id}
                      style={{
                        backgroundColor: 'white', borderRadius: '12px', padding: '1rem',
                        border: '1px solid var(--border)', display: 'flex', gap: '0.75rem',
                        alignItems: 'center', boxShadow: 'var(--shadow-xs)'
                      }}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={prod.name}
                          style={{ width: '50px', height: '65px', borderRadius: '6px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '50px', height: '65px', borderRadius: '6px', backgroundColor: '#f8f5f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={20} color="#b76e79" />
                        </div>
                      )}
                      <div style={{ flexGrow: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--dark-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prod.name}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--light-text)', textTransform: 'capitalize' }}>
                          {prod.category}
                        </span>
                        <div style={{ marginTop: '6px' }}>
                          <button
                            type="button"
                            onClick={() => openReviewModal(prod, null)}
                            className="btn btn-primary btn-sm"
                            style={{ padding: '3px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Star size={11} fill="#fff" /> Rate Item
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* User's Submitted Reviews List */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 className="font-serif" style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.25rem', color: 'var(--dark-text)' }}>
              Your Reviews ({myReviews.length})
            </h3>

            {loadingReviews ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--purple)' }}>
                Loading your reviews...
              </div>
            ) : myReviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--light-text)' }}>
                <MessageSquare size={44} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--purple)' }} />
                <h4 style={{ fontWeight: '600', color: 'var(--dark-text)', marginBottom: '0.5rem' }}>No reviews submitted yet</h4>
                <p style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
                  When you review your purchased items, they will appear here so you can view or update them anytime.
                </p>
                {orders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="btn btn-primary btn-sm"
                  >
                    View Your Orders
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {myReviews.map((rev) => {
                  const prod = rev.productId;
                  const img = getImageUrl(prod?.images?.[0], '');

                  return (
                    <div
                      key={rev._id}
                      style={{
                        padding: '1.25rem', borderRadius: '12px',
                        border: '1px solid var(--border-light)',
                        backgroundColor: 'var(--bg-main)',
                        display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
                        flexWrap: 'wrap'
                      }}
                    >
                      {/* Product Thumbnail */}
                      {prod && (
                        <Link to={`/product/${prod._id}`}>
                          {img ? (
                            <img
                              src={img}
                              alt={prod.name || 'Product'}
                              style={{ width: '60px', height: '75px', borderRadius: '8px', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '60px', height: '75px', borderRadius: '8px', backgroundColor: '#f8f5f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Package size={22} color="#b76e79" />
                            </div>
                          )}
                        </Link>
                      )}

                      {/* Content */}
                      <div style={{ flexGrow: 1, minWidth: '220px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                          <div>
                            {prod ? (
                              <Link
                                to={`/product/${prod._id}`}
                                style={{ fontWeight: '700', fontSize: '0.98rem', color: 'var(--dark-text)', textDecoration: 'none' }}
                              >
                                {prod.name}
                              </Link>
                            ) : (
                              <span style={{ fontWeight: '700', fontSize: '0.98rem', color: 'var(--dark-text)' }}>
                                Product
                              </span>
                            )}
                            <div style={{ fontSize: '0.78rem', color: 'var(--light-text)', marginTop: '2px' }}>
                              Reviewed on {formatDate(rev.createdAt)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => openReviewModal(prod || { _id: rev.productId }, rev)}
                            className="btn btn-outline btn-sm"
                            style={{
                              padding: '4px 10px', fontSize: '0.75rem',
                              display: 'inline-flex', alignItems: 'center', gap: '4px',
                              borderRadius: '8px'
                            }}
                          >
                            <Edit3 size={12} /> Edit Review
                          </button>
                        </div>

                        {/* Stars */}
                        <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                          {renderStars(rev.rating, 16)}
                          <span style={{ marginLeft: '6px', fontSize: '0.85rem', fontWeight: '700', color: '#b45309' }}>
                            {rev.rating}/5
                          </span>
                        </div>

                        {/* Comment */}
                        <p style={{ color: 'var(--body-text)', fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>
                          "{rev.comment}"
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── INTERACTIVE REVIEW MODAL ────────────────────────────────────────────── */}
      {reviewModal.isOpen && (
        <div
          onClick={closeReviewModal}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(20, 10, 35, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '1rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white', borderRadius: '16px',
              maxWidth: '520px', width: '100%', padding: '2rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)', position: 'relative',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={closeReviewModal}
              style={{
                position: 'absolute', top: '1.25rem', right: '1.25rem',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--light-text)', padding: '4px', display: 'flex'
              }}
            >
              <X size={20} />
            </button>

            {/* Modal Title */}
            <h3 className="font-serif" style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--dark-text)', marginBottom: '0.5rem' }}>
              {reviewModal.existingReview ? 'Edit Your Review' : 'Rate & Review'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--light-text)', marginBottom: '1.25rem' }}>
              Your verified review helps other customers make better shopping choices.
            </p>

            {/* Product summary card */}
            {reviewModal.product && (
              <div style={{
                display: 'flex', gap: '0.75rem', alignItems: 'center',
                backgroundColor: 'var(--bg-main)', padding: '0.75rem 1rem',
                borderRadius: '10px', marginBottom: '1.5rem',
                border: '1px solid var(--border)'
              }}>
                {reviewModal.product.images?.length ? (
                  <img
                    src={`${BACKEND_URL}${reviewModal.product.images[0]}`}
                    alt={reviewModal.product.name}
                    style={{ width: '42px', height: '54px', borderRadius: '6px', objectFit: 'cover' }}
                  />
                ) : null}
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--dark-text)' }}>
                    {reviewModal.product.name}
                  </div>
                  {reviewModal.product.category && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--light-text)', textTransform: 'capitalize' }}>
                      {reviewModal.product.category}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleModalSubmit}>
              {/* Alert Feedback */}
              {modalError && (
                <div style={{
                  backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                  borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1rem'
                }}>
                  {modalError}
                </div>
              )}

              {modalSuccess && (
                <div style={{
                  backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#16a34a',
                  borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.85rem', marginBottom: '1rem',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <Check size={18} />
                  <span>{modalSuccess}</span>
                </div>
              )}

              {/* Star Rating Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--body-text)', marginBottom: '0.5rem' }}>
                  Rating <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const currentFill = (modalHoverRating || modalRating) >= starVal;
                    return (
                      <button
                        type="button"
                        key={starVal}
                        onClick={() => setModalRating(starVal)}
                        onMouseEnter={() => setModalHoverRating(starVal)}
                        onMouseLeave={() => setModalHoverRating(0)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '4px', transition: 'transform 0.15s'
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                        onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      >
                        <Star
                          size={30}
                          fill={currentFill ? '#fbbf24' : 'none'}
                          color={currentFill ? '#fbbf24' : '#d1d5db'}
                        />
                      </button>
                    );
                  })}
                  <span style={{ marginLeft: '10px', fontSize: '0.9rem', fontWeight: '600', color: 'var(--purple-dark)' }}>
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][modalHoverRating || modalRating]}
                  </span>
                </div>
              </div>

              {/* Comment text area */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--body-text)', marginBottom: '0.5rem' }}>
                  Your Review <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Share details of your experience — fit, fabric quality, comfort, styling..."
                  value={modalComment}
                  onChange={(e) => setModalComment(e.target.value)}
                  required
                  style={{
                    width: '100%', borderRadius: '8px', padding: '0.75rem',
                    border: '1px solid var(--border)', fontSize: '0.88rem',
                    resize: 'vertical', minHeight: '100px'
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="btn btn-outline btn-sm"
                  disabled={modalLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={modalLoading}
                  style={{ padding: '0.6rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {modalLoading ? 'Saving...' : reviewModal.existingReview ? 'Update Review' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 768px) {
          .mobile-stack-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
        }
      `}</style>

    </div>
  );
};

export default Orders;
