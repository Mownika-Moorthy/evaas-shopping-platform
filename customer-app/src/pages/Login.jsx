import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/images/logo.png';
import { Mail, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

const Login = () => {
  const { login, googleLogin, user } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && user.role === 'customer') {
      const from = location.state?.from?.pathname || '/orders';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoadingLocal(true);
    const result = await login(email, password);
    setLoadingLocal(false);

    if (!result.success) {
      setErrorMsg(result.message || 'Login failed. Please check credentials.');
    }
  };

  // @react-oauth/google — popup flow, returns Google credential token
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setErrorMsg('');
      // tokenResponse.access_token is an OAuth access token (not ID token)
      // We exchange it for user info and pass the credential to backend
      try {
        // Fetch user info from Google using the access token
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const userInfo = await userInfoRes.json();

        // Send to our backend as a structured payload
        const result = await googleLogin(tokenResponse.access_token, userInfo);
        if (!result.success) {
          setErrorMsg(result.message || 'Google sign-in failed.');
        }
      } catch (err) {
        setErrorMsg('Google sign-in failed. Please try again.');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setErrorMsg('Google sign-in was cancelled or failed.');
    },
    flow: 'implicit'
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '2rem 1rem'
    }}>
      <div className="card fade-in" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '2.5rem 2rem',
        boxShadow: 'var(--shadow-lg)'
      }}>
        {/* Logo Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem', gap: '0.5rem' }}>
          <img src={logo} alt="Evaas Logo" style={{ height: '70px', objectFit: 'contain' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--dark-text)' }}>Welcome Back</h2>
          <p style={{ color: 'var(--light-text)', fontSize: '0.85rem' }}>Sign in to your customer account</p>
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

        {/* ─── Google Sign-In Button ─── */}
        <button
          id="google-login-btn"
          type="button"
          onClick={() => handleGoogleLogin()}
          disabled={googleLoading || loadingLocal}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem',
            borderRadius: '10px',
            border: '1.5px solid #e2e8f0',
            backgroundColor: googleLoading ? '#f8f9fa' : 'white',
            color: '#3c4043',
            fontWeight: '600',
            fontSize: '0.95rem',
            cursor: googleLoading ? 'wait' : 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            transition: 'box-shadow 0.2s, background-color 0.2s',
            fontFamily: 'inherit'
          }}
          onMouseOver={(e) => { if (!googleLoading) e.currentTarget.style.boxShadow = '0 3px 10px rgba(0,0,0,0.12)'; }}
          onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'; }}
        >
          {/* Google logo SVG */}
          {googleLoading ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="var(--pink)" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
          )}
          {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
        </button>

        {/* ─── Divider ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          <span style={{ color: 'var(--light-text)', fontSize: '0.8rem', fontWeight: '500', whiteSpace: 'nowrap' }}>or sign in with email</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
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

          {/* Password */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
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

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loadingLocal || googleLoading}
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginBottom: '1.5rem' }}
          >
            {loadingLocal ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--light-text)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--purple)', fontWeight: '600' }}>
            Register Now
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;

