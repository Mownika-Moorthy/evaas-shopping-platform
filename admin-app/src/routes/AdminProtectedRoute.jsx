import React, { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AdminAuthContext } from '../context/AdminAuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { admin, loading } = useContext(AdminAuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#111827',
        color: '#f9a8d4',
        fontSize: '1.2rem',
        fontWeight: 'bold'
      }}>
        Verifying Admin Access...
      </div>
    );
  }

  if (!admin || admin.role !== 'admin') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
