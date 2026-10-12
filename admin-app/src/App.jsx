import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import AppRoutes from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AdminAuthProvider>
  );
}

export default App;
