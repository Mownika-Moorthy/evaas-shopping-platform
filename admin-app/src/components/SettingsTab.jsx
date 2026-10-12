import React, { useState, useContext } from 'react';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { Shield, Store, Save } from 'lucide-react';

const SettingsTab = ({ showToast }) => {
  const { admin, updateProfile } = useContext(AdminAuthContext);

  // Store Configuration State (stored in localStorage for seller defaults)
  const [storeConfig, setStoreConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('evaas_store_config');
      return saved ? JSON.parse(saved) : {
        storeName: "Evaas Women's Wear",
        supportEmail: "support@evaaswear.com",
        supportPhone: "+91 98765 43210",
        currency: "INR (₹)",
        lowStockThreshold: 10,
        freeShippingMin: 0,
        taxRate: 5
      };
    } catch {
      return {
        storeName: "Evaas Women's Wear",
        supportEmail: "support@evaaswear.com",
        supportPhone: "+91 98765 43210",
        currency: "INR (₹)",
        lowStockThreshold: 10,
        freeShippingMin: 0,
        taxRate: 5
      };
    }
  });

  // Admin Account Security State
  const [adminName, setAdminName] = useState(admin?.name || 'Mownika Admin');
  const [adminEmail, setAdminEmail] = useState(admin?.email || 'mownikamoorthy@gmail.com');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminUpdating, setAdminUpdating] = useState(false);

  const handleStoreConfigSave = (e) => {
    e.preventDefault();
    localStorage.setItem('evaas_store_config', JSON.stringify(storeConfig));
    if (showToast) {
      showToast('Store settings saved successfully!', 'success');
    } else {
      alert('Store settings saved successfully!');
    }
  };

  const handleAdminSecuritySave = async (e) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      if (showToast) showToast('New passwords do not match.', 'error');
      else alert('New passwords do not match.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      if (showToast) showToast('Password must be at least 6 characters.', 'error');
      else alert('Password must be at least 6 characters.');
      return;
    }

    setAdminUpdating(true);
    const updateData = { name: adminName, email: adminEmail };
    if (newPassword) updateData.password = newPassword;

    const res = await updateProfile(updateData);
    setAdminUpdating(false);

    if (res.success) {
      setNewPassword('');
      setConfirmPassword('');
      if (showToast) showToast('Admin profile updated successfully!', 'success');
      else alert('Admin profile updated successfully!');
    } else {
      if (showToast) showToast(res.message || 'Update failed', 'error');
      else alert(res.message || 'Update failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Title */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1f2937' }}>Portal Settings & Preferences</h2>
        <p style={{ color: '#6b7280', fontSize: '0.88rem' }}>Configure store operating parameters, seller contact info, and admin security credentials</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* Card 1: Store Operating Settings */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #f3f4f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fdf0f2', color: '#b76e79', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Store size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>Store Configuration</h3>
              <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Public facing store profile</p>
            </div>
          </div>

          <form onSubmit={handleStoreConfigSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Store Name</label>
              <input
                type="text"
                className="form-control"
                value={storeConfig.storeName}
                onChange={(e) => setStoreConfig({ ...storeConfig, storeName: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Support Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={storeConfig.supportEmail}
                  onChange={(e) => setStoreConfig({ ...storeConfig, supportEmail: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Support Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={storeConfig.supportPhone}
                  onChange={(e) => setStoreConfig({ ...storeConfig, supportPhone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Currency</label>
                <input
                  type="text"
                  className="form-control"
                  value={storeConfig.currency}
                  onChange={(e) => setStoreConfig({ ...storeConfig, currency: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Low Stock Alert Threshold</label>
                <input
                  type="number"
                  className="form-control"
                  value={storeConfig.lowStockThreshold}
                  onChange={(e) => setStoreConfig({ ...storeConfig, lowStockThreshold: Number(e.target.value) })}
                  min="1"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-sm"
              style={{ alignSelf: 'flex-start', marginTop: '0.5rem', padding: '9px 18px' }}
            >
              <Save size={15} /> Save Store Defaults
            </button>
          </form>
        </div>

        {/* Card 2: Admin Account & Security */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #f3f4f6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>Admin Credentials</h3>
              <p style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Authorized administrator security settings</p>
            </div>
          </div>

          <form onSubmit={handleAdminSecuritySave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Admin Full Name</label>
              <input
                type="text"
                className="form-control"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Admin Email Address</label>
              <input
                type="email"
                className="form-control"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>New Password</label>
                <input
                  type="password"
                  placeholder="Leave blank to keep"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#374151', marginBottom: '4px' }}>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={adminUpdating}
              style={{ alignSelf: 'flex-start', marginTop: '0.5rem', padding: '9px 18px' }}
            >
              <Save size={15} /> {adminUpdating ? 'Updating...' : 'Update Admin Account'}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default SettingsTab;
