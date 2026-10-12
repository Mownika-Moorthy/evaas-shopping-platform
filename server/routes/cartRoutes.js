import express from 'express';
import {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart
} from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All cart routes require token authentication
router.use(protect);

router.route('/')
  .get(getCart)
  .post(addToCart)
  .put(updateCartQuantity)
  .delete(removeFromCart);

router.route('/clear')
  .delete(clearCart);

export default router;
