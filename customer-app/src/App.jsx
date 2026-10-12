import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { FestivalProvider } from './context/FestivalContext';
import { NotificationProvider } from './context/NotificationContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <NotificationProvider>
          <CartProvider>
            <WishlistProvider>
              <FestivalProvider>
                <AppRoutes />
              </FestivalProvider>
            </WishlistProvider>
          </CartProvider>
        </NotificationProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
