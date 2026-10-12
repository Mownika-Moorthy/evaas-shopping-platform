import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminAuthContext } from '../context/AdminAuthContext';
import logo from '../assets/images/logo.png';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Clock
} from 'lucide-react';

const AdminLogin = () => {
  const { admin, adminLogin, verifyOtp, resendOtp } = useContext(AdminAuthContext);
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'

  // Step 1: Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: 6-Digit OTP
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [devOtpHint, setDevOtpHint] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [expirySeconds, setExpirySeconds] = useState(300); // 5 minutes

  // Common state
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Refs for 6 OTP input boxes
  const otpInputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // If already logged in as admin, navigate to dashboard
  useEffect(() => {
    if (admin && admin.role === 'admin') {
      navigate('/', { replace: true });
    }
  }, [admin, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // OTP expiration countdown timer
  useEffect(() => {
    if (step === 'otp' && expirySeconds > 0) {
      const timer = setTimeout(() => setExpirySeconds(s => s - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, expirySeconds]);

  // Handle Step 1: Password Submission
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter both admin email and password.');
      return;
    }

    setLoading(true);
    const result = await adminLogin(email, password);
    setLoading(false);

    if (result.requireOtp) {
      // Transition to OTP step
      setStep('otp');
      setOtpDigits(['', '', '', '', '', '']);
      setExpirySeconds(300);
      setResendCooldown(30);
      setInfoMsg(result.message || `A 6-digit code has been sent to ${result.email}.`);
      if (result.devOtp) {
        setDevOtpHint(result.devOtp);
      }
      setTimeout(() => otpInputRefs[0].current?.focus(), 150);
    } else if (result.success) {
      navigate('/', { replace: true });
    } else {
      setErrorMsg(result.message || 'Invalid admin credentials.');
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    // Only accept numeric characters
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;

    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal ? cleanVal.slice(-1) : '';
    setOtpDigits(newDigits);
    setErrorMsg('');

    // Auto-focus next input if a digit was typed
    if (cleanVal && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }

    // Auto-submit if all 6 digits are filled
    if (cleanVal && index === 5 && newDigits.every(d => d !== '')) {
      executeVerifyOtp(newDigits.join(''));
    }
  };

  // Handle Backspace and Arrow keys navigation between OTP inputs
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs[index - 1].current?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }
  };

  // Handle paste full 6-digit code
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);

    const focusIdx = Math.min(pasted.length, 5);
    otpInputRefs[focusIdx].current?.focus();

    if (pasted.length === 6) {
      executeVerifyOtp(pasted);
    }
  };

  // Execute OTP Verification
  const executeVerifyOtp = async (codeToVerify) => {
    const code = codeToVerify || otpDigits.join('');
    setErrorMsg('');

    if (code.length < 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    const result = await verifyOtp(email, code);
    setLoading(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setErrorMsg(result.message || 'Invalid verification code. Please try again.');
      // Select all for quick correction
      otpInputRefs[0].current?.focus();
    }
  };

  // Handle Resend OTP
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);

    const result = await resendOtp(email);
    setLoading(false);

    if (result.success) {
      setResendCooldown(45);
      setExpirySeconds(300);
      setOtpDigits(['', '', '', '', '', '']);
      setInfoMsg(result.message || 'A fresh code has been sent to your email.');
      if (result.devOtp) {
        setDevOtpHint(result.devOtp);
      }
      otpInputRefs[0].current?.focus();
    } else {
      setErrorMsg(result.message || 'Failed to resend verification code.');
    }
  };

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 12px 11px 40px',
    border: '1px solid #3B246B',
    backgroundColor: '#160D33',
    color: '#f9fafb',
    borderRadius: '10px',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem 1rem',
      background: 'radial-gradient(ellipse at top, #2D1B69 0%, #160D33 70%, #0B061A 100%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#1E1238',
        border: '1px solid #3B246B',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        animation: 'fadeIn 0.3s ease'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.75rem', gap: '0.6rem' }}>
          <img src={logo} alt="Evaas Logo" style={{ height: '54px', objectFit: 'contain', filter: 'brightness(1.1)' }} />

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            backgroundColor: 'rgba(155, 89, 214, 0.2)', color: '#C79AF0',
            padding: '4px 14px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '800', letterSpacing: '0.8px'
          }}>
            <ShieldCheck size={14} /> SELLER CENTRAL & ADMIN
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: '#fff', marginTop: '4px', textAlign: 'center' }}>
            {step === 'credentials' ? 'Admin Sign In' : 'Two-Factor Verification'}
          </h2>

          <p style={{ color: '#AFA3BF', fontSize: '0.82rem', textAlign: 'center', margin: 0 }}>
            {step === 'credentials'
              ? 'Restricted operations management & seller control panel'
              : <>Enter the 6-digit code sent to <strong style={{ color: '#E9D5FF' }}>{email}</strong></>
            }
          </p>
        </div>

        {/* Informational Message */}
        {infoMsg && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.12)', color: '#6ee7b7',
            padding: '10px 14px', borderRadius: '8px',
            fontSize: '0.82rem', marginBottom: '1.25rem',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* Error Notification */}
        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#f87171',
            padding: '10px 14px', borderRadius: '8px',
            fontSize: '0.84rem', marginBottom: '1.25rem',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <ShieldAlert size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dev Mode OTP preview hint if SMTP is not configured */}
        {devOtpHint && (
          <div style={{
            backgroundColor: 'rgba(155, 89, 214, 0.15)', color: '#d8b4fe',
            padding: '8px 12px', borderRadius: '8px',
            fontSize: '0.78rem', marginBottom: '1.25rem',
            border: '1px dashed #9B59D6',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <span>💡 <strong>Dev Hint:</strong> Code is <code style={{ color: '#fff', background: '#3B246B', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9rem' }}>{devOtpHint}</code></span>
            <button
              type="button"
              onClick={() => {
                const digits = devOtpHint.split('');
                setOtpDigits(digits);
                executeVerifyOtp(devOtpHint);
              }}
              style={{
                background: '#9B59D6', color: '#fff', border: 'none', borderRadius: '4px',
                padding: '2px 8px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: '600'
              }}
            >
              Auto-Fill
            </button>
          </div>
        )}

        {/* ──────── STEP 1: CREDENTIALS FORM ──────── */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit}>
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#d1d5db' }}>Admin Email</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex' }}>
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#9B59D6'}
                  onBlur={e => e.target.style.borderColor = '#3B246B'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '1.75rem' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#d1d5db' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', display: 'flex' }}>
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder=""
                  required
                  style={{ ...inputStyle, paddingLeft: '40px', paddingRight: '40px' }}
                  onFocus={e => e.target.style.borderColor = '#9B59D6'}
                  onBlur={e => e.target.style.borderColor = '#3B246B'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex'
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.95rem',
                background: 'linear-gradient(135deg, #9B59D6 0%, #5E2C96 100%)',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '0.95rem', fontWeight: '700',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(155, 89, 214, 0.35)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <KeyRound size={18} />
              {loading ? 'Verifying Credentials...' : 'Send Security OTP'}
            </button>
          </form>
        )}

        {/* ──────── STEP 2: 6-DIGIT OTP VERIFICATION ──────── */}
        {step === 'otp' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#d1d5db' }}>6-Digit One-Time Code</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: expirySeconds < 60 ? '#f87171' : '#AFA3BF' }}>
                  <Clock size={13} />
                  <span>Expires in: <strong>{formatTime(expirySeconds)}</strong></span>
                </div>
              </div>

              {/* 6 Compact Digit Boxes */}
              <div
                onPaste={handleOtpPaste}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  margin: '0 auto',
                  maxWidth: '300px'
                }}
              >
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpInputRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    style={{
                      width: '42px',
                      height: '44px',
                      textAlign: 'center',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      color: '#ffffff',
                      backgroundColor: '#160D33',
                      border: digit ? '2px solid #9B59D6' : '1px solid #3B246B',
                      borderRadius: '8px',
                      outline: 'none',
                      transition: 'all 0.15s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = '#C79AF0';
                      e.target.style.boxShadow = '0 0 0 3px rgba(155, 89, 214, 0.25)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = digit ? '#9B59D6' : '#3B246B';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="button"
              onClick={() => executeVerifyOtp()}
              disabled={loading || otpDigits.some(d => d === '')}
              style={{
                width: '100%', padding: '0.95rem',
                background: 'linear-gradient(135deg, #9B59D6 0%, #5E2C96 100%)',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '0.95rem', fontWeight: '700',
                cursor: (loading || otpDigits.some(d => d === '')) ? 'not-allowed' : 'pointer',
                opacity: (loading || otpDigits.some(d => d === '')) ? 0.6 : 1,
                boxShadow: '0 4px 14px rgba(155, 89, 214, 0.35)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginBottom: '1rem'
              }}
            >
              <ShieldCheck size={18} />
              {loading ? 'Validating Code...' : 'Verify & Access Dashboard'}
            </button>

            {/* Actions: Resend Code and Back */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                style={{
                  background: 'none', border: 'none', color: '#9CA3AF',
                  fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                  padding: 0
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                style={{
                  background: 'none', border: 'none',
                  color: resendCooldown > 0 ? '#6B7280' : '#C79AF0',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: 0
                }}
              >
                <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        )}

        {/* Security badge note */}
        <div style={{
          marginTop: '1.75rem', padding: '12px',
          backgroundColor: '#111827', borderRadius: '10px', border: '1px solid #374151',
          fontSize: '0.74rem', color: '#9ca3af', textAlign: 'center', lineHeight: 1.6
        }}>
          🔒 Two-factor authentication (2FA) is enforced for all administrator logins to protect store data.
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
