import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById, submitProductReview } from '../services/productService';
import { getMyOrders } from '../services/orderService';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { WishlistContext } from '../context/WishlistContext';
import { Star, ShoppingBag, CreditCard, ChevronRight, Check, Heart, ArrowLeft, Ruler, Sparkles } from 'lucide-react';
import SizeChartModal from '../components/SizeChartModal';
import { useFestival } from '../context/FestivalContext';
import { useNotification } from '../context/NotificationContext';
import { API_URL } from '../config';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const { toggleWishlist, isInWishlist } = useContext(WishlistContext);
  const { computePrice, activeSale } = useFestival();
  const { showSuccess, showError, showWarning } = useNotification();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Image gallery states
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Cart selection states
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  // Review posting states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [isVerifiedPurchaser, setIsVerifiedPurchaser] = useState(false);

  // Size chart modal
  const [showSizeChart, setShowSizeChart] = useState(false);

  const backendUrl = API_URL;

  const fetchProductDetails = async () => {
    try {
      const data = await getProductById(id);
      setProduct(data.product);
      setReviews(data.reviews || []);
      
      if (data.product.sizes && data.product.sizes.length > 0) {
        // Automatically preselect the first in-stock size if available
        const inStockItem = data.product.sizeStock?.find(s => s.stock > 0);
        setSelectedSize(inStockItem ? inStockItem.size : data.product.sizes[0]);
      }
    } catch (err) {
      setErrorMsg('Product details not found.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedSizeStock = () => {
    if (!product) return 0;
    if (product.sizeStock && product.sizeStock.length > 0 && selectedSize) {
      const found = product.sizeStock.find(s => s.size.toLowerCase() === selectedSize.toLowerCase());
      if (found) return found.stock;
    }
    return product.stock || 0;
  };

  const selectedSizeStock = getSelectedSizeStock();
  const isSelectedOutOfStock = selectedSizeStock === 0;

  const handleSelectSize = (sz) => {
    setSelectedSize(sz);
    if (!product) return;
    const found = product.sizeStock?.find(s => s.size.toLowerCase() === sz.toLowerCase());
    const stockForSize = found ? found.stock : product.stock;
    if (stockForSize > 0 && quantity > stockForSize) {
      setQuantity(1);
    }
  };

  const checkPurchaseStatus = async () => {
    if (!user) return;
    try {
      const orders = await getMyOrders();
      const hasPurchased = orders.some(order => 
        order.status === 'Delivered' && 
        order.products.some(p => p.productId?._id === id || p.productId === id)
      );
      setIsVerifiedPurchaser(hasPurchased);
    } catch (err) {
      console.error('Error verifying customer purchase status:', err);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  useEffect(() => {
    if (product) {
      checkPurchaseStatus();
    }
  }, [product, user]);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      showWarning('Please select a size first.', 'Size Required');
      return;
    }
    if (isSelectedOutOfStock) {
      showError(`Size ${selectedSize} is currently out of stock.`, 'Out of Stock');
      return;
    }
    if (quantity > selectedSizeStock) {
      showWarning(`Only ${selectedSizeStock} items available in size ${selectedSize}.`, 'Limited Stock');
      return;
    }
    setActionLoading(true);
    const res = await addToCart(product._id, quantity, selectedSize);
    setActionLoading(false);
    
    if (res.success) {
      showSuccess(`${product.name} (Size: ${selectedSize}) added to your cart!`, 'Added to Bag', {
        label: 'View Cart',
        to: '/cart'
      });
    } else {
      if (res.message?.toLowerCase().includes('log in') || res.message?.toLowerCase().includes('login')) {
        showWarning('Please log in to add items to your cart.', 'Login Required', {
          label: 'Log In Now',
          to: '/login'
        });
      } else {
        showError(res.message);
      }
    }
  };

  const handleBuyNow = async () => {
    if (!selectedSize) {
      showWarning('Please select a size first.', 'Size Required');
      return;
    }
    if (isSelectedOutOfStock) {
      showError(`Size ${selectedSize} is currently out of stock.`, 'Out of Stock');
      return;
    }
    if (quantity > selectedSizeStock) {
      showWarning(`Only ${selectedSizeStock} items available in size ${selectedSize}.`, 'Limited Stock');
      return;
    }
    setActionLoading(true);
    const res = await addToCart(product._id, quantity, selectedSize);
    setActionLoading(false);
    
    if (res.success) {
      navigate('/cart');
    } else {
      if (res.message?.toLowerCase().includes('log in') || res.message?.toLowerCase().includes('login')) {
        showWarning('Please log in to complete your purchase.', 'Login Required', {
          label: 'Log In Now',
          to: '/login'
        });
      } else {
        showError(res.message);
      }
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!comment.trim()) {
      setReviewError('Please write your review feedback.');
      return;
    }

    setReviewLoading(true);
    try {
      const data = await submitProductReview(id, { rating, comment });
      setReviewSuccess('Review submitted successfully!');
      setComment('');
      setReviews(prev => [data.review, ...prev]);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Error submitting review.');
    } finally {
      setReviewLoading(false);
    }
  };

  const formatPrice = (p) => `₹${Number(p).toLocaleString('en-IN')}`;

  const renderStars = (score) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          fill={i <= score ? '#fbbf24' : 'none'}
          color={i <= score ? '#fbbf24' : '#d1d5db'}
        />
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '6rem', fontSize: '1.2rem', color: 'var(--rose-gold-dark)' }}>
        Loading product details...
      </div>
    );
  }

  if (errorMsg || !product) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
        <h2>{errorMsg || 'Product not found'}</h2>
        <Link to="/products" className="btn btn-primary" style={{ marginTop: '1.5rem' }}>
          Back to Shop
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images.map(img => `${backendUrl}${img}`)
    : ['https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800'];

  const isFavorited = isInWishlist(product._id);

  return (
    <div className="container" style={{ paddingTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      {/* Breadcrumb Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--light-text)' }}>
        <Link to="/" style={{ color: 'var(--light-text)' }}>Home</Link>
        <ChevronRight size={14} />
        <Link to="/products" style={{ color: 'var(--light-text)' }}>Products</Link>
        <ChevronRight size={14} />
        <Link to={`/products?category=${encodeURIComponent(product.category)}`} style={{ color: 'var(--rose-gold-dark)', fontWeight: '600' }}>
          {product.category}
        </Link>
        <ChevronRight size={14} />
        <span style={{ color: 'var(--dark-text)', fontWeight: '500' }}>{product.name}</span>
      </div>

      {/* Main Product Showcase Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }} className="mobile-product-grid">
        
        {/* Left: Product Images Gallery */}
        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'row' }}>
          {/* Thumbnails list */}
          {images.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '70px', flexShrink: 0 }}>
              {images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: '65px',
                    height: '85px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: activeImageIndex === idx ? '2px solid var(--rose-gold)' : '1px solid var(--light-border)',
                    boxShadow: activeImageIndex === idx ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  <img src={img} alt={`${product.name}-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* Main Selected Image */}
          <div style={{
            position: 'relative',
            width: '100%',
            paddingTop: '125%',
            borderRadius: '16px',
            overflow: 'hidden',
            backgroundColor: '#f5f5f5',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--light-border)'
          }}>
            <img
              src={images[activeImageIndex]}
              alt={product.name}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />

            {/* Wishlist Button */}
            <button
              onClick={() => toggleWishlist(product)}
              aria-label="Save to Wishlist"
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isFavorited ? '#e63946' : '#71696b',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'all 0.2s ease',
                zIndex: 2
              }}
            >
              <Heart size={20} fill={isFavorited ? '#e63946' : 'none'} />
            </button>
          </div>
        </div>

        {/* Right: Product Specification & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--green-dark)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
              {product.category}
            </span>
            <h1 className="font-serif" style={{ fontSize: '2rem', fontWeight: '700', margin: '0.3rem 0', color: 'var(--dark-text)' }}>
              {product.name}
            </h1>
            
            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {renderStars(product.averageRating || 0)}
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--light-text)' }}>
                {product.averageRating ? product.averageRating.toFixed(1) : 'No ratings yet'} ({reviews.length} reviews)
              </span>
            </div>
          </div>

          {/* Pricing */}
          {(() => {
            const priceInfo = product ? computePrice(product) : null;
            const showFestival = priceInfo?.hasSaleDiscount;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '2rem', fontWeight: '700',
                    color: showFestival ? (activeSale?.theme?.primaryColor || 'var(--rose-gold-dark)') : 'var(--rose-gold-dark)'
                  }}>
                    {formatPrice(showFestival ? priceInfo.finalPrice : product.price)}
                  </span>
                  {showFestival && (
                    <span style={{ fontSize: '1.1rem', color: 'var(--light-text)', textDecoration: 'line-through', fontWeight: '400' }}>
                      {formatPrice(priceInfo.originalPrice)}
                    </span>
                  )}
                  {!showFestival && product.discount > 0 && (
                    <span style={{ fontSize: '1rem', color: '#059669', fontWeight: '600', backgroundColor: '#d1fae5', padding: '2px 8px', borderRadius: '4px' }}>
                      {product.discount}% OFF
                    </span>
                  )}
                  {showFestival && (
                    <span style={{
                      fontSize: '0.88rem', fontWeight: '800',
                      background: `linear-gradient(135deg, ${activeSale?.theme?.accentColor || '#FF6B00'}, ${activeSale?.theme?.primaryColor || '#D86B80'})`,
                      color: '#fff', padding: '3px 12px', borderRadius: '20px',
                      display: 'inline-flex', alignItems: 'center', gap: '4px'
                    }}>
                      <Sparkles size={12} /> {priceInfo.discountPercent}% OFF
                    </span>
                  )}
                </div>
                {showFestival && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: `${activeSale?.theme?.primaryColor || '#D86B80'}15`,
                    border: `1px solid ${activeSale?.theme?.primaryColor || '#D86B80'}40`,
                    borderRadius: '8px', padding: '6px 12px',
                    fontSize: '0.82rem', color: activeSale?.theme?.primaryColor || '#D86B80',
                    fontWeight: '600', width: 'fit-content'
                  }}>
                    <span>{activeSale?.theme?.emoji || '🎉'}</span>
                    <span>{activeSale.name} — Save {formatPrice(priceInfo.discountAmount)}</span>
                  </div>
                )}
              </div>
            );
          })()}

          <p style={{ color: 'var(--light-text)', lineHeight: '1.7', fontSize: '0.95rem' }}>
            {product.description}
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid var(--light-border)' }} />

          {/* Size Selector */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Select Size:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--purple-dark)', fontWeight: '600' }}>Selected: {selectedSize}</span>
                <button
                  type="button"
                  id="size-guide-btn"
                  onClick={() => setShowSizeChart(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--green-dark)',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                    transition: 'opacity 0.15s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                  onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  <Ruler size={13} /> Size Guide
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {product.sizes && product.sizes.map((sz) => {
                const item = product.sizeStock?.find(s => s.size.toLowerCase() === sz.toLowerCase());
                const szStock = item !== undefined ? item.stock : product.stock;
                const isSzOutOfStock = szStock === 0;

                return (
                  <button
                    key={sz}
                    onClick={() => handleSelectSize(sz)}
                    style={{
                      minWidth: '58px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: selectedSize === sz
                        ? '2px solid var(--purple)'
                        : isSzOutOfStock
                          ? '1px dashed #d1d5db'
                          : '1px solid var(--light-border)',
                      backgroundColor: selectedSize === sz
                        ? 'var(--purple-pale)'
                        : isSzOutOfStock
                          ? '#f9fafb'
                          : 'white',
                      color: selectedSize === sz
                        ? 'var(--purple-dark)'
                        : isSzOutOfStock
                          ? '#9ca3af'
                          : 'var(--dark-text)',
                      fontWeight: selectedSize === sz ? '700' : '500',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '3px',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <span>{sz}</span>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: '600',
                      color: isSzOutOfStock ? '#dc2626' : szStock <= 5 ? '#d97706' : '#059669'
                    }}>
                      {isSzOutOfStock ? 'Sold Out' : `${szStock} left`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector & Stock Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Quantity:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={isSelectedOutOfStock || quantity <= 1}
                style={{ width: '32px', height: '32px', padding: 0 }}
              >
                -
              </button>
              <span style={{ width: '30px', textAlign: 'center', fontWeight: '700' }}>
                {isSelectedOutOfStock ? 0 : quantity}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setQuantity(q => Math.min(selectedSizeStock, q + 1))}
                disabled={isSelectedOutOfStock || quantity >= selectedSizeStock}
                style={{ width: '32px', height: '32px', padding: 0 }}
              >
                +
              </button>
            </div>
            <div>
              {isSelectedOutOfStock ? (
                <span style={{ fontSize: '0.88rem', color: '#dc2626', fontWeight: '700' }}>
                  ❌ Size {selectedSize} is Out of Stock
                </span>
              ) : selectedSizeStock <= 5 ? (
                <span style={{ fontSize: '0.88rem', color: '#d97706', fontWeight: '600' }}>
                  ⚡ Only {selectedSizeStock} left in Size {selectedSize} — Order soon!
                </span>
              ) : (
                <span style={{ fontSize: '0.88rem', color: '#059669', fontWeight: '600' }}>
                  ✅ {selectedSizeStock} items available in Size {selectedSize}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              className="btn btn-outline"
              disabled={actionLoading || isSelectedOutOfStock}
              onClick={handleAddToCart}
              style={{ flex: 1, padding: '0.9rem' }}
            >
              <ShoppingBag size={18} /> {isSelectedOutOfStock ? `Size ${selectedSize} Out of Stock` : 'Add to Cart'}
            </button>
            <button
              className="btn btn-primary"
              disabled={actionLoading || isSelectedOutOfStock}
              onClick={handleBuyNow}
              style={{ flex: 1, padding: '0.9rem' }}
            >
              <CreditCard size={18} /> {isSelectedOutOfStock ? 'Out of Stock' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Customer Reviews Section ── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Section Header + Rating Summary */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '2rem',
          boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)'
        }}>
          <h2 className="font-serif" style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--dark-text)' }}>
            Customer Reviews
          </h2>

          <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {/* Average score */}
            <div style={{ textAlign: 'center', minWidth: '130px' }}>
              <div style={{ fontSize: '4rem', fontWeight: '800', lineHeight: 1, color: 'var(--dark-text)' }}>
                {product.averageRating ? product.averageRating.toFixed(1) : '—'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', margin: '0.5rem 0' }}>
                {renderStars(Math.round(product.averageRating || 0))}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--light-text)' }}>
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
              </div>
            </div>

            {/* Rating bars */}
            <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[5, 4, 3, 2, 1].map(star => {
                const count = reviews.filter(r => Math.round(r.rating) === star).length;
                const pct = reviews.length ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem' }}>
                    <span style={{ width: '12px', textAlign: 'right', color: 'var(--light-text)', fontWeight: '600' }}>{star}</span>
                    <Star size={11} fill="#fbbf24" color="#fbbf24" />
                    <div style={{ flex: 1, height: '8px', borderRadius: '99px', backgroundColor: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                        borderRadius: '99px', transition: 'width 0.6s ease'
                      }} />
                    </div>
                    <span style={{ width: '20px', color: 'var(--light-text)' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Write a Review — gate logic */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '2rem',
          boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)'
        }}>
          <h3 className="font-serif" style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1.25rem', color: 'var(--dark-text)' }}>
            Write a Review
          </h3>

          {!user ? (
            <div style={{
              background: 'var(--purple-pale)', borderRadius: '12px', padding: '1.25rem',
              border: '1px solid var(--purple-light)', display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
              <Star size={22} color="var(--purple)" />
              <div>
                <p style={{ fontWeight: '600', color: 'var(--purple-dark)', marginBottom: '2px' }}>Sign in to leave a review</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--light-text)' }}>
                  <Link to="/login" style={{ color: 'var(--purple)', fontWeight: '700', textDecoration: 'underline' }}>Log in</Link> to share your experience with this product.
                </p>
              </div>
            </div>
          ) : !isVerifiedPurchaser ? (
            <div style={{
              background: 'var(--purple-pale)', borderRadius: '12px', padding: '1.25rem',
              border: '1px solid var(--purple-light)', display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
              <ShoppingBag size={22} color="var(--purple)" />
              <div>
                <p style={{ fontWeight: '600', color: 'var(--purple-dark)', marginBottom: '2px' }}>Purchase required to review</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--light-text)' }}>
                  Only verified buyers who have received this product can leave a review.
                </p>
              </div>
            </div>
          ) : reviewSuccess ? (
            <div style={{
              background: '#f0fdf4', borderRadius: '12px', padding: '1.25rem',
              border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '1rem'
            }}>
              <Check size={22} color="#16a34a" />
              <p style={{ fontWeight: '600', color: '#15803d' }}>{reviewSuccess}</p>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit}>
              {reviewError && (
                <div style={{
                  background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px',
                  padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.88rem', color: '#dc2626'
                }}>
                  {reviewError}
                </div>
              )}

              {/* Star Rating Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--body-text)', display: 'block', marginBottom: '0.5rem' }}>
                  Your Rating
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map(starVal => (
                    <button
                      type="button"
                      key={starVal}
                      onClick={() => setRating(starVal)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', transition: 'transform 0.15s' }}
                      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.25)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Star
                        size={28}
                        fill={starVal <= rating ? '#fbbf24' : 'none'}
                        color={starVal <= rating ? '#fbbf24' : '#d1d5db'}
                      />
                    </button>
                  ))}
                  <span style={{ marginLeft: '8px', fontSize: '0.85rem', color: 'var(--light-text)', alignSelf: 'center' }}>
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--body-text)', display: 'block', marginBottom: '0.5rem' }}>
                  Your Review
                </label>
                <textarea
                  className="form-control"
                  placeholder="Share details of your experience — fit, fabric quality, comfort, styling..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows="4"
                  required
                  style={{ resize: 'vertical', minHeight: '110px' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={reviewLoading}
                style={{ padding: '0.75rem 2rem' }}
              >
                {reviewLoading ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>

        {/* Reviews List */}
        <div style={{
          background: 'white', borderRadius: '20px', padding: '2rem',
          boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)'
        }}>
          <h3 className="font-serif" style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--dark-text)' }}>
            All Reviews ({reviews.length})
          </h3>

          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--light-text)' }}>
              <Star size={40} style={{ marginBottom: '1rem', opacity: 0.25 }} />
              <p style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '0.25rem' }}>No reviews yet</p>
              <p style={{ fontSize: '0.88rem' }}>Be the first to share your experience with this product!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {reviews.map((rev, idx) => (
                <div key={rev._id} style={{
                  padding: '1.5rem 0',
                  borderBottom: idx < reviews.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Avatar */}
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, var(--purple), var(--purple-deeper))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: '700', fontSize: '0.9rem'
                      }}>
                        {(rev.userId?.name || 'V').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.92rem', color: 'var(--dark-text)' }}>
                          {rev.userId?.name || 'Verified Buyer'}
                        </div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          fontSize: '0.72rem', color: '#16a34a',
                          backgroundColor: '#f0fdf4', padding: '2px 7px', borderRadius: '99px',
                          fontWeight: '600', border: '1px solid #86efac'
                        }}>
                          <Check size={10} /> Verified Purchase
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--light-text)', flexShrink: 0 }}>
                      {new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Stars */}
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '0.65rem' }}>
                    {renderStars(rev.rating)}
                    <span style={{ marginLeft: '6px', fontSize: '0.82rem', color: 'var(--light-text)', alignSelf: 'center' }}>
                      {rev.rating}/5
                    </span>
                  </div>

                  <p style={{ color: 'var(--body-text)', fontSize: '0.92rem', lineHeight: '1.75', margin: 0 }}>
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Size Chart Modal */}
      {showSizeChart && (
        <SizeChartModal
          isOpen={true}
          onClose={() => setShowSizeChart(false)}
          category={product?.category || 'dresses'}
          selectedSize={selectedSize}
          onSelectSize={(sz) => { setSelectedSize(sz); setShowSizeChart(false); }}
        />
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-product-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDetails;
