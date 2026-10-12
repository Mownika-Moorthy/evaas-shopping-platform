import express from 'express';
import {
  getDashboardOverview,
  getOrderAnalytics,
  getAllOrders,
  updateOrderStatus,
  getAllCustomers,
  getCustomerOrderHistory,
  getAllReviews,
  deleteReview,
  // NEW endpoints
  getEnhancedDashboard,
  getAdminProducts,
  getInventory,
  updateInventoryStock,
  getSalesReport,
  exportReportPDF,
  exportReportExcel,
  getTopSellingProducts,
  getLeastSellingProducts,
  getLowStockAlerts
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Apply auth protection & admin authorization to all admin routes
router.use(protect, adminOnly);

// ── Existing Routes (preserved) ─────────────────────────────────────────────
router.get('/overview', getDashboardOverview);
router.get('/analytics', getOrderAnalytics);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/customers', getAllCustomers);
router.get('/customers/:id/orders', getCustomerOrderHistory);
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReview);

// ── NEW: Enhanced Dashboard ──────────────────────────────────────────────────
router.get('/dashboard', getEnhancedDashboard);

// ── NEW: Admin Product Management (shows all including inactive) ─────────────
router.get('/products', getAdminProducts);

// ── NEW: Inventory Management ────────────────────────────────────────────────
router.get('/inventory', getInventory);
router.put('/inventory/:id', updateInventoryStock);

// ── NEW: Sales Reports ────────────────────────────────────────────────────────
router.get('/reports', getSalesReport);
router.get('/reports/export/pdf', exportReportPDF);
router.get('/reports/export/excel', exportReportExcel);

// ── NEW: Analytics ────────────────────────────────────────────────────────────
router.get('/analytics/top-selling', getTopSellingProducts);
router.get('/analytics/least-selling', getLeastSellingProducts);
router.get('/analytics/low-stock', getLowStockAlerts);

export default router;
