import express from 'express';
import {
  getActiveSales,
  getAllSales,
  createSale,
  updateSale,
  deleteSale,
  toggleSaleStatus
} from '../controllers/festivalController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

// ── Public: Customer-facing ────────────────────────────────────────────────
// Used by the customer app to read the active festival sale (no auth needed)
router.get('/active', getActiveSales);

// ── Admin-protected: CRUD ──────────────────────────────────────────────────
router.use(protect, adminOnly);
router.get('/',            getAllSales);
router.post('/',           createSale);
router.put('/:id',         updateSale);
router.delete('/:id',      deleteSale);
router.patch('/:id/toggle', toggleSaleStatus);

export default router;
