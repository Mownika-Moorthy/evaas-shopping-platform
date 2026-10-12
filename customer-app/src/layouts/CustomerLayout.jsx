import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FestivalBanner from '../components/FestivalBanner';

const CustomerLayout = () => {
  return (
    <div className="app-container">
      <FestivalBanner />
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default CustomerLayout;
