import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';
import { API_BASE } from '../config';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const [cart, setCart] = useState({ items: [], totalPrice: 0 });
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/cart`);
      setCart(data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart automatically when user logging in or out changes
  useEffect(() => {
    if (token && user) {
      fetchCart();
    } else {
      setCart({ items: [], totalPrice: 0 });
    }
  }, [token, user]);

  const addToCart = async (productId, quantity, size) => {
    if (!token) {
      return { success: false, message: 'Please log in to add items to cart.' };
    }
    try {
      const { data } = await axios.post(`${API_BASE}/cart`, {
        productId,
        quantity,
        size
      });
      setCart(data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Error adding item to cart.'
      };
    }
  };

  const updateQuantity = async (productId, size, quantity) => {
    try {
      const { data } = await axios.put(`${API_BASE}/cart`, {
        productId,
        size,
        quantity
      });
      setCart(data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Error updating quantity.'
      };
    }
  };

  const removeFromCart = async (productId, size) => {
    try {
      const { data } = await axios.delete(`${API_BASE}/cart`, {
        params: { productId, size }
      });
      setCart(data);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Error removing item from cart.'
      };
    }
  };

  const clearCart = async () => {
    try {
      const { data } = await axios.delete(`${API_BASE}/cart/clear`);
      setCart(data.cart || { items: [], totalPrice: 0 });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Error clearing cart.'
      };
    }
  };

  const cartCount = cart.items ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;

  return (
    <CartContext.Provider value={{ cart, cartCount, loading, fetchCart, addToCart, updateQuantity, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};
