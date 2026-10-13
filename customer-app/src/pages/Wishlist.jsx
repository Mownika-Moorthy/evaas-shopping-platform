import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { WishlistContext } from '../context/WishlistContext';
import { CartContext } from '../context/CartContext';
import { useNotification } from '../context/NotificationContext';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { API_URL, getImageUrl } from '../config';

const Wishlist = () => {
  const { wishlist, removeFromWishlist, clearWishlist } = useContext(WishlistContext);
  const { addToCart } = useContext(CartContext);
  const { showSuccess, showError, showWarning } = useNotification();
  const backendUrl = API_URL;

  const formatPrice = (p) => `₹${Number(p).toLocaleString('en-IN')}`;

  const handleMoveToCart = async (product) => {
    const inStockItem = product.sizeStock?.find(s => s.stock > 0);
    const defaultSize = inStockItem ? inStockItem.size : (product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'M');
    const res = await addToCart(product._id, 1, defaultSize);
    if (res.success) {
      removeFromWishlist(product._id);
      showSuccess(`${product.name} (Size: ${defaultSize}) moved to cart!`, 'Moved to Cart', {
        label: 'View Cart',
        to: '/cart'
      });
    } else {
      if (res.message?.toLowerCase().includes('log in') || res.message?.toLowerCase().includes('login')) {
        showWarning('Please log in to move items to your cart.', 'Login Required', {
          label: 'Log In Now',
          to: '/login'
        });
      } else {
        showError(res.message);
      }
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: '700' }}>My Wishlist</h1>
          <p style={{ color: 'var(--light-text)', fontSize: '0.9rem' }}>
            {wishlist.length} item{wishlist.length === 1 ? '' : 's'} saved for later
          </p>
        </div>

        {wishlist.length > 0 && (
          <button
            onClick={() => window.confirm('Clear all items from your wishlist?') && clearWishlist()}
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--danger)', borderColor: 'rgba(230, 57, 70, 0.3)' }}
          >
            Clear Wishlist
          </button>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div style={{
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '5rem 2rem',
          boxShadow: 'var(--shadow-sm)',
          border: '1px solid var(--light-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e63946'
          }}>
            <Heart size={38} />
          </div>
          <h2>Your wishlist is currently empty</h2>
          <p style={{ color: 'var(--light-text)', maxWidth: '420px', lineHeight: '1.6' }}>
            Tap the heart icon on any product in our collections to save your favorite designs and buy them later.
          </p>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.8rem 2rem' }}>
            Discover Collections <ArrowRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid-4">
          {wishlist.map((product) => {
            const imageUrl = getImageUrl(product.images?.[0]);

            return (
              <div key={product._id} className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                <div style={{ position: 'relative', overflow: 'hidden', paddingTop: '130%', background: '#eaeaea' }}>
                  <Link to={`/products/${product._id}`}>
                    <img
                      src={imageUrl}
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
                  </Link>

                  <button
                    onClick={() => removeFromWishlist(product._id)}
                    aria-label="Remove from Wishlist"
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--danger)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--green-dark)', fontWeight: '600', textTransform: 'uppercase' }}>
                    {product.category}
                  </span>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--dark-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Link to={`/products/${product._id}`}>{product.name}</Link>
                  </h3>
                  
                  <div style={{ fontWeight: '700', color: 'var(--rose-gold-dark)', margin: '0.3rem 0' }}>
                    {formatPrice(product.price)}
                  </div>

                  <button
                    onClick={() => handleMoveToCart(product)}
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 'auto', width: '100%' }}
                  >
                    <ShoppingBag size={14} /> Move to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
