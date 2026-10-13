import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [loading, setLoading] = useState(true);

  // Sync token to localStorage and axios default headers
  useEffect(() => {
    if (token) {
      localStorage.setItem('admin_token', token);
    } else {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
    }
  }, [token]);

  // Load admin profile on mount
  useEffect(() => {
    const loadAdmin = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const storedAdmin = localStorage.getItem('admin_user');
        if (storedAdmin) {
          const parsed = JSON.parse(storedAdmin);
          if (parsed.role !== 'admin') {
            logout();
            return;
          }
          setAdmin(parsed);
        }

        const { data } = await axios.get(`${API_BASE}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (data.role !== 'admin') {
          logout();
          return;
        }

        setAdmin(data);
        localStorage.setItem('admin_user', JSON.stringify(data));
      } catch (err) {
        console.error('Failed to authenticate admin:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadAdmin();
  }, [token]);

  const adminLogin = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/admin-login`, { email, password });
      
      // If 2FA OTP is required (Step 1)
      if (data.requireOtp) {
        return {
          success: true,
          requireOtp: true,
          email: data.email,
          message: data.message,
          devOtp: data.devOtp
        };
      }

      // Fallback for direct token issuance if ever configured
      if (data.role !== 'admin') {
        return {
          success: false,
          message: 'Access denied. Administrator privileges required.'
        };
      }
      setToken(data.token);
      setAdmin(data);
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data));
      return { success: true, role: data.role };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Admin login failed. Please verify credentials.'
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email, otp) => {
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/auth/admin-verify-otp`, { email, otp });
      if (data.role !== 'admin') {
        return {
          success: false,
          message: 'Access denied. Administrator privileges required.'
        };
      }
      setToken(data.token);
      setAdmin(data);
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data));
      return { success: true, role: data.role };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Verification failed. Please check your code.'
      };
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (email) => {
    try {
      const { data } = await axios.post(`${API_BASE}/auth/admin-resend-otp`, { email });
      return {
        success: true,
        message: data.message,
        devOtp: data.devOtp
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to resend verification code.'
      };
    }
  };

  const logout = () => {
    setToken('');
    setAdmin(null);
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  };

  const updateProfile = async (profileData) => {
    try {
      const { data } = await axios.put(`${API_BASE}/auth/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmin(data);
      if (data.token) {
        setToken(data.token);
      }
      localStorage.setItem('admin_user', JSON.stringify(data));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Admin profile update failed.'
      };
    }
  };

  return (
    <AdminAuthContext.Provider value={{
      admin,
      user: admin,
      token,
      loading,
      adminLogin,
      verifyOtp,
      resendOtp,
      logout,
      updateProfile
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
