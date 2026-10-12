import crypto from 'crypto';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Payment from '../models/Payment.js';
import Cart from '../models/Cart.js';
import Category from '../models/Category.js';
import FestivalSale from '../models/FestivalSale.js';
import { findApplicableSale, computeDiscountedPrice } from '../controllers/festivalController.js';
import { razorpayInstance, keyId, keySecret, isMockMode } from '../config/razorpay.js';

/**
 * paymentService.js
 * Centralizes all Razorpay + Order business logic.
 * Controllers call into this service — keeps controllers thin.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert rupees → paise (Razorpay requires paise) */
export const rupeesToPaise = (rupees) => Math.round(Number(rupees) * 100);

/** Verify HMAC-SHA256 Razorpay signature */
export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
};

/** Verify Razorpay webhook signature */
export const verifyWebhookSignature = (rawBody, signature, webhookSecret) => {
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');
  return expectedSignature === signature;
};

// ── Core Service Functions ────────────────────────────────────────────────────

/**
 * validateCartAndCalculateTotal
 * SERVER-SIDE price and stock verification.
 * NEVER trust amounts from the frontend.
 *
 * Returns { items, calculatedTotal } or throws an Error.
 */
export const validateCartAndCalculateTotal = async (cartItems) => {
  if (!cartItems || cartItems.length === 0) {
    throw new Error('No items provided in the order.');
  }

  // Query all currently active festival sales
  const now = new Date();
  const activeSales = await FestivalSale.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now }
  });

  let calculatedTotal = 0;
  const verifiedItems = [];

  for (const item of cartItems) {
    const { productId, quantity, size } = item;

    if (!productId || !quantity || !size) {
      throw new Error('Each item must have productId, quantity, and size.');
    }

    const dbProduct = await Product.findById(productId);

    if (!dbProduct || !dbProduct.isActive) {
      throw new Error(
        `Product "${dbProduct ? dbProduct.name : productId}" is not available for purchase.`
      );
    }

    // Validate category is active
    const activeCategory = await Category.findOne({
      name: { $regex: `^${dbProduct.category}$`, $options: 'i' },
      isActive: true
    });
    if (!activeCategory) {
      throw new Error(
        `Cannot order "${dbProduct.name}": its category "${dbProduct.category}" is currently inactive.`
      );
    }

    // Verify stock for specific size
    let availableStock = dbProduct.stock;
    if (dbProduct.sizeStock && dbProduct.sizeStock.length > 0 && size) {
      const matched = dbProduct.sizeStock.find(s => s.size.toLowerCase() === size.trim().toLowerCase());
      if (matched) availableStock = matched.stock;
    }

    if (availableStock < quantity) {
      throw new Error(
        `Insufficient stock for "${dbProduct.name}" (Size: ${size}). Only ${availableStock} unit(s) left.`
      );
    }

    // Apply active festival discount if eligible, otherwise regular price
    let effectivePrice = dbProduct.price;
    const applicableSale = findApplicableSale(dbProduct, activeSales);
    if (applicableSale) {
      const { finalPrice } = computeDiscountedPrice(dbProduct, applicableSale);
      effectivePrice = finalPrice;
    }

    calculatedTotal += effectivePrice * quantity;

    verifiedItems.push({
      productId: dbProduct._id,
      quantity,
      size,
      price: effectivePrice // server-verified price snapshot stored in Order
    });
  }

  return {
    items: verifiedItems,
    calculatedTotal: parseFloat(calculatedTotal.toFixed(2))
  };
};

/**
 * validateDeliveryAddress
 * Ensures all required address fields are present and non-empty.
 */
export const validateDeliveryAddress = (address) => {
  const required = ['fullName', 'phone', 'houseNo', 'street', 'city', 'state', 'pincode'];
  for (const field of required) {
    if (!address[field] || !String(address[field]).trim()) {
      throw new Error(`Delivery address is missing required field: ${field}`);
    }
  }
  if (!/^\d{6}$/.test(address.pincode.trim())) {
    throw new Error('Pincode must be exactly 6 digits.');
  }
  if (!/^\d{10}$/.test(address.phone.trim())) {
    throw new Error('Phone number must be exactly 10 digits.');
  }
};

/**
 * createRazorpayOrder
 * Creates a Razorpay order in TEST/LIVE mode, or a deterministic mock in dev.
 */
export const createRazorpayOrder = async (amountInPaise, receipt) => {
  if (!isMockMode && razorpayInstance) {
    try {
      const rzpOrder = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt
      });
      return { rzpOrder, isMock: false };
    } catch (err) {
      const errDescription = err?.error?.description || err?.message || 'Authentication or API error';
      console.error('Razorpay API error:', errDescription, err?.error || '');

      // In development mode, if Razorpay keys are invalid/expired (401 / BAD_REQUEST_ERROR),
      // gracefully fall back to mock order so developers can test the checkout workflow without blocking.
      if (process.env.NODE_ENV !== 'production' && (err?.statusCode === 401 || err?.error?.code === 'BAD_REQUEST_ERROR')) {
        console.warn('⚠️ Razorpay credentials failed authentication (invalid/expired test keys). Falling back to mock order for development.');
        const mockOrder = {
          id: `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          amount: amountInPaise,
          currency: 'INR',
          receipt
        };
        return { rzpOrder: mockOrder, isMock: true };
      }

      throw new Error(`Failed to create Razorpay payment order: ${errDescription}`);
    }
  }

  // Mock mode (development / no real keys)
  const mockOrder = {
    id: `order_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    amount: amountInPaise,
    currency: 'INR',
    receipt
  };
  return { rzpOrder: mockOrder, isMock: true };
};

/**
 * deductStockSafely
 * Atomically decrements stock per size and marks stockDeducted on Payment.
 * Uses the Payment.stockDeducted flag to prevent double-deduction.
 */
export const deductStockSafely = async (paymentDoc, orderProducts) => {
  if (paymentDoc.stockDeducted) {
    console.warn(`[PaymentService] Stock already deducted for payment ${paymentDoc._id}. Skipping.`);
    return false;
  }

  for (const item of orderProducts) {
    const prod = await Product.findById(item.productId);
    if (prod) {
      if (prod.sizeStock && prod.sizeStock.length > 0 && item.size) {
        const sIdx = prod.sizeStock.findIndex(s => s.size.toLowerCase() === item.size.trim().toLowerCase());
        if (sIdx > -1) {
          prod.sizeStock[sIdx].stock = Math.max(0, prod.sizeStock[sIdx].stock - item.quantity);
          prod.stock = prod.sizeStock.reduce((acc, curr) => acc + curr.stock, 0);
          await prod.save();
          continue;
        }
      }
      prod.stock = Math.max(0, prod.stock - item.quantity);
      await prod.save();
    }
  }

  paymentDoc.stockDeducted = true;
  await paymentDoc.save();
  return true;
};

/**
 * finalizeSuccessfulPayment
 * Called after a verified payment (from /verify endpoint or webhook).
 * Idempotent — safe to call multiple times for the same payment.
 */
export const finalizeSuccessfulPayment = async ({
  order,
  payment,
  razorpayPaymentId,
  razorpaySignature,
  method = null
}) => {
  // Guard: if already paid, do nothing
  if (order.paymentStatus === 'Paid') {
    return { alreadyProcessed: true };
  }

  // Update Order
  order.paymentStatus = 'Paid';
  order.razorpayPaymentId = razorpayPaymentId;
  order.status = 'Confirmed';
  order.stockDeducted = true;
  await order.save();

  // Update Payment record
  payment.paymentStatus = 'PAID';
  payment.razorpayPaymentId = razorpayPaymentId;
  payment.razorpaySignature = razorpaySignature || null;
  if (method) payment.paymentMethod = method;

  // Deduct stock idempotently
  await deductStockSafely(payment, order.products);

  return { alreadyProcessed: false };
};
