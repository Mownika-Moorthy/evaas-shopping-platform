import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  razorpayWebhook,
  cancelPayment,
  getPaymentByOrder
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * IMPORTANT: The webhook route is registered here but it must receive
 * the raw body buffer. server.js registers a rawBody capture middleware
 * for this specific path before the global express.json() middleware.
 */

// Public — Razorpay webhook (signature-verified internally, no JWT)
router.post('/webhook', razorpayWebhook);

// Protected — Customer payment flow
router.post('/create-order', protect, createPaymentOrder);
router.post('/verify',       protect, verifyPayment);
router.post('/cancel',       protect, cancelPayment);
router.get('/order/:dbOrderId', protect, getPaymentByOrder);

export default router;
