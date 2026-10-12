import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { User, Mail, Phone, MapPin, Lock, ShoppingBag, ShieldCheck } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useContext(AuthContext);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: '', text: '' });

    if (!name || !email || !phone || !address) {
      setProfileMsg({ type: 'danger', text: 'All contact fields are required.' });
      return;
    }

    if (password) {
      if (password !== confirmPassword) {
        setProfileMsg({ type: 'danger', text: 'Passwords do not match.' });
        return;
      }
      if (password.length < 6) {
        setProfileMsg({ type: 'danger', text: 'Password must be at least 6 characters.' });
        return;
      }
    }

    setProfileLoading(true);
    const updateData = { name, email, phone, address };
    if (password) {
      updateData.password = password;
    }

    const res = await updateProfile(updateData);
    setProfileLoading(false);

    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setPassword('');
      setConfirmPassword('');
    } else {
      setProfileMsg({ type: 'danger', text: res.message });
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header banner */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--rose-gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rose-gold-dark)' }}>
            <User size={32} />
          </div>
          <div>
            <h1 className="font-serif" style={{ fontSize: '1.8rem', fontWeight: '700' }}>User Profile</h1>
            <p style={{ color: 'var(--light-text)', fontSize: '0.9rem' }}>Manage your personal details, contact number, and default delivery address</p>
          </div>
        </div>

        <Link to="/orders" className="btn btn-outline btn-sm">
          <ShoppingBag size={16} /> View My Orders
        </Link>
      </div>

      {/* Edit Form Card */}
      <div className="card fade-in" style={{ padding: '2.5rem 2rem', maxWidth: '680px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--rose-gold-dark)' }}>
          Personal Details
        </h2>
        
        {profileMsg.text && (
          <div style={{
            backgroundColor: profileMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: profileMsg.type === 'success' ? '#059669' : '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            marginBottom: '1.5rem',
            border: `1px solid ${profileMsg.type === 'success' ? 'rgba(5, 150, 105, 0.2)' : 'rgba(220, 38, 38, 0.2)'}`
          }}>
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleProfileSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label>Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--purple)', display: 'flex' }}>
                  <User size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--purple)', display: 'flex' }}>
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  className="form-control"
                  style={{ paddingLeft: '2.4rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--purple)', display: 'flex' }}>
                <Phone size={16} />
              </span>
              <input
                type="tel"
                className="form-control"
                style={{ paddingLeft: '2.4rem' }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Default Shipping Address</label>
            <div style={{ position: 'relative' }}>
              <textarea
                className="form-control"
                rows="3"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--light-border)', margin: '1.75rem 0' }} />
          
          <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--rose-gold-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={16} /> Change Password (Optional)
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Leave blank to keep same"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={profileLoading}
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem', marginTop: '1rem' }}
          >
            {profileLoading ? 'Saving changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default Profile;
