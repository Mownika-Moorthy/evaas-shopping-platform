import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import logo from '../assets/images/logo.png';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: 'white',
      borderTop: '1px solid var(--light-border)',
      paddingTop: '4rem',
      paddingBottom: '2rem',
      marginTop: 'auto'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          {/* Brand Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <img src={logo} alt="Evaas Logo" style={{ height: '55px', width: 'auto', alignSelf: 'flex-start', objectFit: 'contain' }} />
            <p style={{ color: 'var(--light-text)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Evaas Women's Wear curated collection of elegant, modern, and traditional apparel designed to empower and inspire every woman.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <a href="https://www.instagram.com/evaas_tiruchengode?stkn=MXVvODBnY3N0YnlzMw==" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--rose-gold-dark)' }} aria-label="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--dark-text)' }}>Quick Links</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: 0 }}>
              <li><Link to="/" style={{ fontSize: '0.9rem', color: 'var(--light-text)' }}>Home</Link></li>
              <li><Link to="/products" style={{ fontSize: '0.9rem', color: 'var(--light-text)' }}>All Collections</Link></li>
              <li><Link to="/categories" style={{ fontSize: '0.9rem', color: 'var(--light-text)' }}>Browse Categories</Link></li>
              <li><Link to="/cart" style={{ fontSize: '0.9rem', color: 'var(--light-text)' }}>Shopping Cart</Link></li>
              <li><Link to="/wishlist" style={{ fontSize: '0.9rem', color: 'var(--light-text)' }}>Wishlist</Link></li>
              <li><Link to="/orders" style={{ fontSize: '0.9rem', color: 'var(--light-text)' }}>Track Orders</Link></li>
            </ul>
          </div>

          {/* Policies */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--dark-text)' }}>Policies</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: 0 }}>
              <li><Link to="/policies#return" style={{ fontSize: '0.9rem', color: 'var(--light-text)' }}>Return Policy</Link></li>
              <li><Link to="/policies#refund" style={{ fontSize: '0.9rem', color: 'var(--light-text)' }}>Refund Policy</Link></li>
              <li><Link to="/policies#shipping" style={{ fontSize: '0.9rem', color: 'var(--light-text)' }}>Shipping Policy</Link></li>
              <li><Link to="/policies#privacy" style={{ fontSize: '0.9rem', color: 'var(--light-text)' }}>Privacy Policy</Link></li>
              <li><Link to="/policies#terms" style={{ fontSize: '0.9rem', color: 'var(--light-text)' }}>Terms &amp; Conditions</Link></li>
            </ul>
          </div>

          {/* Contacts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--dark-text)' }}>Customer Support</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: 0, color: 'var(--light-text)', fontSize: '0.9rem' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <MapPin size={18} style={{ color: 'var(--rose-gold)', flexShrink: 0, marginTop: '2px' }} />
                <span>Koottapalli Colony, Erode Main Rd, Varagurampatti, Tamil Nadu 637214</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Phone size={18} style={{ color: 'var(--rose-gold)' }} />
                <span>+91 63743 40846</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={18} style={{ color: 'var(--rose-gold)' }} />
                <span>evaaswomenswear008@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--light-border)', marginBottom: '1.5rem' }} />

        <div style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          color: 'var(--light-text)',
          fontSize: '0.85rem'
        }}>
          <p>© {new Date().getFullYear()} Evaas Women's Wear. All Rights Reserved.</p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span>Secured Payments via Razorpay</span>
            <div style={{ height: '22px', padding: '0 8px', backgroundColor: '#eef2ff', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: '#1e3a8a' }}>
              RAZORPAY
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
