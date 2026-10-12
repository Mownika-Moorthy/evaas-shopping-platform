import React, { useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { useFestival } from '../context/FestivalContext';
import { useNotification } from '../context/NotificationContext';
import CartItem from '../components/CartItem';
import { ShoppingBag, ChevronRight, Sparkles } from 'lucide-react';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, loading } = useContext(CartContext);
  const { computePrice, activeSale } = useFestival();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const handleUpdateQty = async (productId, size, currentQty, amount) => {
    const newQty = currentQty + amount;
    if (newQty < 1) return;
    const res = await updateQuantity(productId, size, newQty);
    if (!res.success) showError(res.message);
  };

  const handleRemove = async (productId, size) => {
    if (window.confirm('Remove this item from cart?')) {
      const res = await removeFromCart(productId, size);
      if (!res.success) showError(res.message);
      else showSuccess('Item removed from cart');
    }
  };

  const cartItems = cart.items || [];
  const formatPrice = (price) => `₹${Number(price).toLocaleString('en-IN')}`;

  // ── Festival Discount Calculation ────────────────────────────────────────────
  const itemsWithFestival = cartItems.map(item => {
    const product = item.productId;
    if (!product) return { ...item, linePrice: 0, originalLine: 0, hasSaleDiscount: false };
    const priceInfo = computePrice(product);
    const unitPrice = priceInfo.hasSaleDiscount ? priceInfo.finalPrice : product.price;
    const originalUnit = product.discount > 0
      ? product.price - (product.price * product.discount / 100)
      : product.price;
    return {
      ...item,
      linePrice: unitPrice * item.quantity,
      originalLine: originalUnit * item.quantity,
      hasSaleDiscount: priceInfo.hasSaleDiscount
    };
  });

  const festivalSubtotal = itemsWithFestival.reduce((s, i) => s + i.linePrice, 0);
  const originalSubtotal = itemsWithFestival.reduce((s, i) => s + i.originalLine, 0);
  const hasFestivalDiscount = !!activeSale && festivalSubtotal < originalSubtotal;
  const festivalSavings = parseFloat((originalSubtotal - festivalSubtotal).toFixed(2));
  const displayTotal = hasFestivalDiscount ? festivalSubtotal : (cart.totalPrice || 0);

  if (loading && cartItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', fontSize: '1.2rem', color: 'var(--rose-gold-dark)' }}>
        Loading your shopping cart...
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <h1 className="font-serif" style={{ fontSize: '2.2rem', fontWeight: '600' }}>Your Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div style={{
          textAlign: 'center', backgroundColor: 'white', borderRadius: '16px',
          padding: '5rem 2rem', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--light-border)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem'
        }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--rose-gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rose-gold-dark)' }}>
            <ShoppingBag size={36} />
          </div>
          <h2>Your cart is empty!</h2>
          <p style={{ color: 'var(--light-text)', maxWidth: '400px' }}>
            Looks like you haven't added anything to your cart yet. Explore our stunning categories and find your perfect outfit today!
          </p>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.8rem 2rem' }}>
            Shop Collections
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '2rem' }} className="mobile-stack-grid">

          {/* Left: Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {cartItems.map((item, index) => (
              <CartItem
                key={`${item.productId?._id || index}-${item.size}-${index}`}
                item={item}
                onUpdateQty={handleUpdateQty}
                onRemove={handleRemove}
              />
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', flexWrap: 'wrap', gap: '10px' }}>
              <Link to="/products" className="btn btn-outline btn-sm">
                ← Continue Shopping
              </Link>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => window.confirm('Clear your entire cart?') && clearCart()}
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Right: Price Details Summary */}
          <div>
            <div className="card" style={{
              padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem',
              border: `2px solid ${hasFestivalDiscount ? (activeSale?.theme?.primaryColor || '#D86B80') + '40' : 'var(--border)'}`,
              boxShadow: hasFestivalDiscount ? `0 4px 20px ${activeSale?.theme?.primaryColor || '#D86B80'}20` : 'var(--shadow-sm)'
            }}>

              {/* Festival Active Banner */}
              {hasFestivalDiscount && (
                <div style={{
                  background: `linear-gradient(135deg, ${activeSale.theme?.primaryColor || '#D86B80'}, ${activeSale.theme?.accentColor || '#FF6B00'})`,
                  borderRadius: '10px', padding: '10px 14px', color: '#fff',
                  display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                  <Sparkles size={16} />
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.88rem' }}>
                      {activeSale.theme?.emoji} {activeSale.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                      You're saving {formatPrice(festivalSavings)} 🎊
                    </div>
                  </div>
                </div>
              )}

              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', borderBottom: '1px solid var(--light-border)', paddingBottom: '0.75rem', margin: 0 }}>
                Order Summary
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.95rem', color: 'var(--light-text)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Price ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                  <span style={{
                    color: hasFestivalDiscount ? 'var(--light-text)' : 'var(--dark-text)',
                    fontWeight: '500',
                    textDecoration: hasFestivalDiscount ? 'line-through' : 'none'
                  }}>
                    {formatPrice(originalSubtotal)}
                  </span>
                </div>

                {hasFestivalDiscount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: '700' }}>
                    <span>🎉 Festival Discount</span>
                    <span>− {formatPrice(festivalSavings)}</span>
                  </div>
                )}

                {hasFestivalDiscount && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--dark-text)', fontWeight: '600' }}>
                    <span>After Discount</span>
                    <span style={{ color: activeSale?.theme?.primaryColor || 'var(--rose-gold-dark)' }}>
                      {formatPrice(festivalSubtotal)}
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Delivery Charges</span>
                  <span style={{ color: '#E05C7A', fontWeight: '600' }}>FREE</span>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--light-border)', margin: 0 }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: '700', color: 'var(--dark-text)' }}>
                <span>Total Amount</span>
                <span style={{ color: hasFestivalDiscount ? (activeSale?.theme?.primaryColor || 'var(--rose-gold-dark)') : 'var(--rose-gold-dark)' }}>
                  {formatPrice(displayTotal)}
                </span>
              </div>

              {hasFestivalDiscount && (
                <div style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: '8px', padding: '8px 12px',
                  fontSize: '0.82rem', color: '#065f46', fontWeight: '600',
                  textAlign: 'center'
                }}>
                  🏷️ Saving {formatPrice(festivalSavings)} with {activeSale.theme?.emoji} {activeSale.name}!
                </div>
              )}

              <button
                className="btn btn-primary"
                onClick={() => navigate('/checkout')}
                style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '0.25rem' }}
              >
                Proceed to Checkout <ChevronRight size={18} />
              </button>
            </div>
          </div>

        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .mobile-stack-grid {
            grid-template-columns: 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>

    </div>
  );
};

export default Cart;
