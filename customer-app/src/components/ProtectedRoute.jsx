import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, logout } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '60vh',
        fontSize: '1.2rem',
        color: 'var(--purple)',
        fontWeight: 'bold'
      }}>
        Loading Evaas Women's Wear...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin cannot use customer app
  if (user.role === 'admin') {
    logout();
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
