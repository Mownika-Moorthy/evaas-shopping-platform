import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/images/logo.png';
import { User, Mail, Phone, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';

const Register = () => {
  const { register, user } = useContext(AuthContext);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'customer') {
      navigate('/orders', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name || !email || !phone || !password || !confirmPassword || !address) {
      setErrorMsg('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (!/^\d{10}$/.test(phone.trim())) {
      setErrorMsg('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoadingLocal(true);
    const result = await register({
      name,
      email,
      phone,
      address,
      password
    });
    setLoadingLocal(false);

    if (!result.success) {
      setErrorMsg(result.message);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '90vh',
      padding: '2rem 1rem'
    }}>
      <div className="card fade-in" style={{
        width: '100%',
        maxWidth: '520px',
        padding: '2.5rem 2rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Logo Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem', gap: '0.4rem' }}>
          <img src={logo} alt="Evaas Logo" style={{ height: '60px', objectFit: 'contain' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--dark-text)' }}>Create Account</h2>
          <p style={{ color: 'var(--light-text)', fontSize: '0.85rem' }}>Join Evaas Women's Wear today</p>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            border: '1px solid rgba(220, 38, 38, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--purple)', display: 'flex' }}>
                <User size={18} />
              </span>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Priya Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--purple)', display: 'flex' }}>
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--purple)', display: 'flex' }}>
                  <Phone size={18} />
                </span>
                <input
                  type="tel"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Shipping Address</label>
            <textarea
              className="form-control"
              rows="2"
              placeholder="Flat / House no, Street, Area, City, Pincode"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--purple)', display: 'flex' }}>
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--light-text)', display: 'flex'
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--purple)', display: 'flex' }}>
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loadingLocal}
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem', marginBottom: '1.5rem' }}
          >
            {loadingLocal ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--light-text)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--rose-gold-dark)', fontWeight: '600' }}>
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
