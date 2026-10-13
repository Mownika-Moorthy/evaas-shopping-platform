import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { API_URL, getImageUrl } from '../config';

const CartItem = ({ item, onUpdateQty, onRemove, backendUrl = API_URL }) => {
  const product = item.productId;
  if (!product) return null;

  const imageUrl = getImageUrl(product.images?.[0], 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=200');

  const formatPrice = (p) => `₹${Number(p).toLocaleString('en-IN')}`;

  return (
    <div className="card" style={{
      display: 'flex',
      alignItems: 'center',
      padding: '1.25rem',
      gap: '1.25rem'
    }}>
      <div style={{ width: '85px', height: '105px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#eaeaea', flexShrink: 0 }}>
        <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', flexGrow: 1, overflow: 'hidden' }}>
        <span style={{ fontSize: '0.75rem', color: '#C0405A', fontWeight: '700', textTransform: 'uppercase' }}>
          {product.category}
        </span>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <Link to={`/products/${product._id}`}>{product.name}</Link>
        </h3>
        <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: 'var(--light-text)' }}>
          <span>Size: <strong style={{ color: 'var(--dark-text)' }}>{item.size}</strong></span>
          <span>Price: <strong style={{ color: 'var(--dark-text)' }}>{formatPrice(product.price)}</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onUpdateQty(product._id, item.size, item.quantity, -1)}
          style={{ width: '28px', height: '28px', padding: 0 }}
          aria-label="Decrease quantity"
        >
          -
        </button>
        <span style={{ width: '24px', textAlign: 'center', fontWeight: '600', fontSize: '0.9rem' }}>
          {item.quantity}
        </span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onUpdateQty(product._id, item.size, item.quantity, 1)}
          style={{ width: '28px', height: '28px', padding: 0 }}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', minWidth: '90px' }}>
        <span style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--rose-gold-dark)' }}>
          {formatPrice(product.price * item.quantity)}
        </span>
        <button
          onClick={() => onRemove(product._id, item.size)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--light-text)',
            transition: 'var(--transition-smooth)'
          }}
          aria-label="Remove item"
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--light-text)'}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default CartItem;
