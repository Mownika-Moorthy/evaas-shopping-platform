import express from 'express';
import {
  createOrder,
  verifyRazorpayPayment,
  getMyOrders,
  getMyReviews,
  getOrderById,
  submitReview
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, createOrder);

router.route('/my-orders')
  .get(protect, getMyOrders);

router.route('/my-reviews')
  .get(protect, getMyReviews);

router.route('/verify-payment')
  .post(protect, verifyRazorpayPayment);

router.route('/:id')
  .get(protect, getOrderById);

router.route('/:id/review')
  .post(protect, submitReview);

export default router;
