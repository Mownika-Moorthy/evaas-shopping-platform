import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  // Setup Axios default headers when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  }, [token]);

  // Load user profile on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed.role === 'admin') {
            // Block admin in customer app
            logout();
            return;
          }
          setUser(parsed);
        }
        
        // Fetch fresh profile from backend
        const { data } = await axios.get('http://localhost:5000/api/auth/profile');
        if (data.role === 'admin') {
          logout();
          return;
        }
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } catch (err) {
        console.error('Failed to load customer profile:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      if (data.role === 'admin') {
        return {
          success: false,
          message: 'Admin accounts cannot access customer app. Please use the Admin Portal at http://localhost:3001.'
        };
      }
      setToken(data.token);
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true, role: data.role };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please check credentials.'
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/register', userData);
      setToken(data.token);
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true, role: data.role };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed.'
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateProfile = async (profileData) => {
    try {
      const { data } = await axios.put('http://localhost:5000/api/auth/profile', profileData);
      setUser(data);
      if (data.token) {
        setToken(data.token);
      }
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Profile update failed.'
      };
    }
  };

  const googleLogin = async (accessToken, userInfo) => {
    setLoading(true);
    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/google', {
        accessToken,
        userInfo
      });
      if (data.role === 'admin') {
        return { success: false, message: 'Admin accounts cannot access the customer app.' };
      }
      setToken(data.token);
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Google sign-in failed. Please try again.'
      };
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, googleLogin, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
