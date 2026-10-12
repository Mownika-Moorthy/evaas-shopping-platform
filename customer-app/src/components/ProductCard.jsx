import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Heart } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { useFestival } from '../context/FestivalContext';
import { useNotification } from '../context/NotificationContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useContext(CartContext);
  const { toggleWishlist, isInWishlist } = useContext(WishlistContext);
  const { computePrice, activeSale } = useFestival();
  const { showSuccess, showError, showWarning } = useNotification();
  const backendUrl = 'http://localhost:5000';

  const imageUrl = product.images && product.images.length > 0
    ? `${backendUrl}${product.images[0]}`
    : 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400';

  // Festival price computation
  const priceInfo = computePrice(product);
  const showDiscount = priceInfo.hasSaleDiscount;

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const inStockItem = product.sizeStock?.find(s => s.stock > 0);
    const defaultSize = inStockItem ? inStockItem.size : (product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M');
    const res = await addToCart(product._id, 1, defaultSize);
    if (res.success) {
      showSuccess(`${product.name} (Size: ${defaultSize}) added to your cart!`, 'Added to Bag', {
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

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} size={14} fill="#fbbf24" color="#fbbf24" />);
      } else {
        stars.push(<Star key={i} size={14} color="#d1d5db" />);
      }
    }
    return stars;
  };

  const isFavorited = isInWishlist(product._id);

  return (
    <Link to={`/products/${product._id}`} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ position: 'relative', overflow: 'hidden', paddingTop: '130%', background: '#eaeaea' }}>
        <img
          src={imageUrl}
          alt={product.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'var(--transition-smooth)'
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          aria-label="Save to Wishlist"
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isFavorited ? '#e63946' : '#71696b',
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            transition: 'all 0.2s ease',
            zIndex: 2
          }}
          onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
          onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Heart size={18} fill={isFavorited ? '#e63946' : 'none'} />
        </button>

        {/* Festival Discount Badge */}
        {showDiscount && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: `linear-gradient(135deg, ${activeSale?.theme?.accentColor || '#FF6B00'}, ${activeSale?.theme?.primaryColor || '#D86B80'})`,
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: '800',
            zIndex: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            letterSpacing: '0.5px'
          }}>
            {priceInfo.saleEmoji} {priceInfo.discountPercent}% OFF
          </div>
        )}

        {/* Out of Stock Badge */}
        {product.stock === 0 && !showDiscount && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(230, 57, 70, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: '600',
            zIndex: 2
          }}>
            OUT OF STOCK
          </div>
        )}
        {product.stock === 0 && showDiscount && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            backgroundColor: 'rgba(230, 57, 70, 0.9)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontWeight: '600',
            zIndex: 2
          }}>
            OUT OF STOCK
          </div>
        )}
      </div>

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '0.4rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--green-dark)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {product.category}
        </span>
        <h3 style={{ fontSize: '1rem', fontWeight: '500', color: 'var(--dark-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {product.name}
        </h3>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="rating-stars">
            {renderStars(product.averageRating || 0)}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--light-text)' }}>
            ({product.averageRating || 0})
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {showDiscount ? (
              <>
                <span style={{
                  fontSize: '1.15rem',
                  fontWeight: '800',
                  color: activeSale?.theme?.primaryColor || 'var(--rose-gold-dark)'
                }}>
                  ₹{priceInfo.finalPrice.toLocaleString('en-IN')}
                </span>
                <span style={{
                  fontSize: '0.78rem',
                  color: 'var(--light-text)',
                  textDecoration: 'line-through'
                }}>
                  ₹{priceInfo.originalPrice.toLocaleString('en-IN')}
                </span>
              </>
            ) : (
              <span style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--rose-gold-dark)' }}>
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {product.stock > 0 && (
            <button
              onClick={handleQuickAdd}
              aria-label="Add to cart"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: showDiscount
                  ? (activeSale?.theme?.primaryColor || 'var(--rose-gold-light)')
                  : 'var(--rose-gold-light)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: showDiscount ? '#fff' : 'var(--rose-gold-dark)',
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = showDiscount
                  ? (activeSale?.theme?.accentColor || 'var(--rose-gold)')
                  : 'var(--rose-gold)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = showDiscount
                  ? (activeSale?.theme?.primaryColor || 'var(--rose-gold-light)')
                  : 'var(--rose-gold-light)';
                e.currentTarget.style.color = showDiscount ? '#fff' : 'var(--rose-gold-dark)';
              }}
            >
              <ShoppingBag size={15} />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
