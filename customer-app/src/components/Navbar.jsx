import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User as UserIcon, LogOut, Menu, X, ChevronDown, ShoppingBag } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { getActiveCategories } from '../services/categoryService';
import logo from '../assets/images/logo.png';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const { wishlistCount } = useContext(WishlistContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      const data = await getActiveCategories();
      if (isMounted) {
        setCategories(data.map(c => typeof c === 'string' ? c : c.name));
      }
    };
    loadCategories();
    return () => { isMounted = false; };
  }, []);

  const handleCategoryClick = (category) => {
    setCategoryDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      borderBottom: '1px solid var(--border)',
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(10px)'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '75px'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="Evaas Logo" style={{ height: '50px', objectFit: 'contain' }} />
        </Link>

        {/* Desktop Menu */}
        <div style={{ display: 'none', alignItems: 'center', gap: '2.5rem', height: '100%' }} className="desktop-menu-display">
          <Link to="/" style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--dark-text)' }}>Home</Link>
          <Link to="/products" style={{ fontSize: '0.95rem', fontWeight: '500', color: 'var(--dark-text)' }}>Shop All</Link>
          
          {/* Categories Dropdown */}
          <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}
               onMouseEnter={() => setCategoryDropdownOpen(true)}
               onMouseLeave={() => setCategoryDropdownOpen(false)}>
            <button style={{
              background: 'none',
              border: 'none',
              fontSize: '0.95rem',
              fontWeight: '500',
              color: 'var(--dark-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              Categories <ChevronDown size={14} />
            </button>
            {categoryDropdownOpen && (
              <div style={{
                position: 'absolute',
                top: '55px',
                left: '0',
                backgroundColor: 'white',
                minWidth: '200px',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--light-border)',
                padding: '0.5rem 0',
                display: 'flex',
                flexDirection: 'column',
                animation: 'fadeIn 0.2s ease',
                zIndex: 100
              }}>
                <Link
                  to="/categories"
                  onClick={() => setCategoryDropdownOpen(false)}
                  style={{
                    padding: '0.6rem 1.2rem',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    color: 'var(--rose-gold-dark)',
                    borderBottom: '1px solid var(--light-border)'
                  }}
                >
                  All Categories →
                </Link>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    style={{
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      padding: '0.6rem 1.2rem',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      color: 'var(--light-text)',
                      transition: 'var(--transition-smooth)'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--rose-gold-light)'; e.currentTarget.style.color = 'var(--rose-gold-dark)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--light-text)'; }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link to="/orders" style={{
            fontSize: '0.95rem',
            fontWeight: '500',
            color: 'var(--dark-text)',
            transition: 'var(--transition-smooth)'
          }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--rose-gold-dark)'; }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--dark-text)'; }}>
            My Orders
          </Link>
        </div>

        {/* Right Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          
          {/* Wishlist Icon */}
          <Link to="/wishlist" aria-label="Wishlist" style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--dark-text)',
            padding: '8px'
          }}>
            <Heart size={22} />
            {wishlistCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '0',
                right: '0',
                backgroundColor: '#e63946',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(230, 57, 70, 0.3)'
              }}>
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart Icon */}
          <Link to="/cart" aria-label="Cart" style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            color: 'var(--dark-text)',
            padding: '8px'
          }}>
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '0',
                right: '0',
                backgroundColor: 'var(--primary-pink)',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(155, 89, 214, 0.3)'
              }}>
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Section */}
          {user ? (
            <div style={{ position: 'relative' }}
                 onMouseEnter={() => setUserDropdownOpen(true)}
                 onMouseLeave={() => setUserDropdownOpen(false)}>
              <button style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                color: 'var(--dark-text)',
                padding: '8px'
              }}>
                <UserIcon size={22} />
                <span style={{ display: 'none', fontSize: '0.9rem', fontWeight: '500' }} className="desktop-menu-display">
                  {user.name ? user.name.split(' ')[0] : 'Account'}
                </span>
                <ChevronDown size={14} className="desktop-menu-display" style={{ display: 'none' }} />
              </button>
              
              {userDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  right: '0',
                  backgroundColor: 'white',
                  minWidth: '180px',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--light-border)',
                  padding: '0.5rem 0',
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'fadeIn 0.2s ease',
                  zIndex: 100
                }}>
                  <Link to="/orders" onClick={() => setUserDropdownOpen(false)} style={{
                    padding: '0.6rem 1.2rem', fontSize: '0.9rem', color: 'var(--light-text)',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--rose-gold-light)'; }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <ShoppingBag size={16} /> My Orders
                  </Link>

                  <Link to="/profile" onClick={() => setUserDropdownOpen(false)} style={{
                    padding: '0.6rem 1.2rem', fontSize: '0.9rem', color: 'var(--light-text)',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                  onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--rose-gold-light)'; }}
                  onMouseOut={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <UserIcon size={16} /> User Profile
                  </Link>

                  <button onClick={handleLogout} style={{
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    padding: '0.6rem 1.2rem',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: 'var(--danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'none', alignItems: 'center', gap: '0.8rem' }} className="desktop-menu-display">
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </div>
          )}

          {/* Mobile Menu Icon */}
          <button style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--dark-text)'
          }} className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Menu">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          position: 'absolute',
          top: '75px',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderBottom: '1px solid var(--light-border)',
          boxShadow: 'var(--shadow-md)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          zIndex: 999
        }}>
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: '500' }}>Home</Link>
          <Link to="/products" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: '500' }}>Shop All</Link>
          <Link to="/categories" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: '500' }}>Categories</Link>
          <Link to="/orders" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: '500' }}>My Orders</Link>
          <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} style={{ fontSize: '1rem', fontWeight: '500' }}>Wishlist ({wishlistCount})</Link>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--light-text)', fontWeight: '600', textTransform: 'uppercase' }}>Popular Categories</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  style={{
                    background: 'var(--bg-main)',
                    border: 'none',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--light-border)' }} />

          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--light-text)' }}>Logged in as: <strong>{user.name}</strong></div>
              <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline btn-sm" style={{ width: '100%' }}>My Orders</Link>
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline btn-sm" style={{ width: '100%' }}>User Profile</Link>
              <button onClick={handleLogout} className="btn btn-danger btn-sm" style={{ width: '100%' }}>Logout</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline btn-sm" style={{ flexGrow: 1 }}>Login</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-sm" style={{ flexGrow: 1 }}>Register</Link>
            </div>
          )}
        </div>
      )}

      {/* CSS adjustments inline injection */}
      <style>{`
        @media(min-width: 769px) {
          .desktop-menu-display { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
