import React, { useState } from 'react';
import AdminLayout from '../layouts/AdminLayout';

// Shared UI overlays
import ToastNotification, { useToast } from '../components/ToastNotification';
import ConfirmDialog from '../components/ConfirmDialog';

// Tab components
import OverviewTab    from '../components/OverviewTab';
import ProductsTab    from '../components/ProductsTab';
import OrdersTab      from '../components/OrdersTab';
import CustomersTab   from '../components/CustomersTab';
import ReviewsTab     from '../components/ReviewsTab';
import CategoryTab    from '../components/CategoryTab';
import InventoryTab   from '../components/InventoryTab';
import SalesReportTab from '../components/SalesReportTab';
import TopSellingTab  from '../components/TopSellingTab';
import LeastSellingTab from '../components/LeastSellingTab';
import LowStockTab    from '../components/LowStockTab';
import FestivalSaleTab from '../components/FestivalSaleTab';
import SettingsTab    from '../components/SettingsTab';
import { API_URL } from '../config';

const BACKEND_URL = API_URL;

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Toast notifications
  const { toasts, showToast, removeToast } = useToast();

  // Confirmation dialog
  const [confirmState, setConfirmState] = useState({
    isOpen: false, title: '', message: '', onConfirm: null, confirmText: 'Confirm', type: 'danger'
  });

  const confirmAction = (title, message, onConfirm, confirmText = 'Confirm', type = 'danger') => {
    setConfirmState({ isOpen: true, title, message, onConfirm, confirmText, type });
  };

  const handleConfirm = async () => {
    setConfirmState(s => ({ ...s, isOpen: false }));
    if (confirmState.onConfirm) await confirmState.onConfirm();
  };

  const handleCancelConfirm = () => setConfirmState(s => ({ ...s, isOpen: false }));

  const tabProps = {
    showToast,
    confirmDialog: confirmAction,
    backendUrl: BACKEND_URL
  };

  const TABS = {
    overview:       <OverviewTab      {...tabProps} />,
    products:       <ProductsTab      {...tabProps} />,
    categories:     <CategoryTab      {...tabProps} />,
    inventory:      <InventoryTab     {...tabProps} />,
    orders:         <OrdersTab        {...tabProps} />,
    customers:      <CustomersTab     {...tabProps} />,
    reviews:        <ReviewsTab       {...tabProps} />,
    reports:        <SalesReportTab   {...tabProps} />,
    'top-selling':  <TopSellingTab    {...tabProps} />,
    'least-selling':<LeastSellingTab  {...tabProps} />,
    'low-stock':    <LowStockTab      {...tabProps} />,
    'festival-sales': <FestivalSaleTab  {...tabProps} />,
    settings:       <SettingsTab      {...tabProps} />
  };

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {TABS[activeTab] || <OverviewTab {...tabProps} />}

      {/* Global Toast Notifications */}
      <ToastNotification toasts={toasts} onRemove={removeToast} />

      {/* Global Confirm Modal Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
        confirmText={confirmState.confirmText}
        type={confirmState.type}
      />
    </AdminLayout>
  );
};

export default AdminDashboard;
