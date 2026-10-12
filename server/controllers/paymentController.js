import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import Cart from '../models/Cart.js';
import {
  validateCartAndCalculateTotal,
  validateDeliveryAddress,
  createRazorpayOrder,
  verifyRazorpaySignature,
  verifyWebhookSignature,
  finalizeSuccessfulPayment,
  rupeesToPaise
} from '../services/paymentService.js';
import { keyId, isMockMode } from '../config/razorpay.js';

// ── POST /api/payment/create-order ───────────────────────────────────────────
/**
 * @desc  Validate cart, verify stock + price server-side, create Razorpay order
 * @route POST /api/payment/create-order
 * @access Private (JWT)
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { cartItems, deliveryAddress } = req.body;

    // 1. Validate delivery address
    try {
      validateDeliveryAddress(deliveryAddress);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // 2. Server-side: validate products, stock, and calculate real total
    let verifiedItems, calculatedTotal;
    try {
      ({ items: verifiedItems, calculatedTotal } = await validateCartAndCalculateTotal(cartItems));
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // 3. Convert to paise
    const amountInPaise = rupeesToPaise(calculatedTotal);
    const receipt = `rcpt_${req.user._id}_${Date.now()}`;

    // 4. Create Razorpay order
    let rzpOrder, isMock;
    try {
      ({ rzpOrder, isMock } = await createRazorpayOrder(amountInPaise, receipt));
    } catch (err) {
      return res.status(502).json({ success: false, message: err.message });
    }

    // 5. Create internal EVAAS Order with paymentStatus = Pending
    const order = await Order.create({
      userId: req.user._id,
      products: verifiedItems,
      totalAmount: calculatedTotal,
      paymentMethod: 'Razorpay',
      paymentStatus: 'Pending',
      status: 'Pending',
      deliveryAddress: {
        fullName: deliveryAddress.fullName.trim(),
        phone: deliveryAddress.phone.trim(),
        houseNo: deliveryAddress.houseNo.trim(),
        street: deliveryAddress.street.trim(),
        city: deliveryAddress.city.trim(),
        state: deliveryAddress.state.trim(),
        pincode: deliveryAddress.pincode.trim()
      },
      shippingAddress: `${deliveryAddress.houseNo}, ${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}`,
      phone: deliveryAddress.phone.trim(),
      razorpayOrderId: rzpOrder.id,
      stockDeducted: false
    });

    // 6. Create Payment record (PENDING)
    await Payment.create({
      orderId: order._id,
      userId: req.user._id,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      paymentStatus: 'PENDING'
    });

    // 7. Return to frontend — NEVER expose keySecret
    return res.status(201).json({
      success: true,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      razorpayKeyId: keyId,   // public key only — safe to send to browser
      dbOrderId: order._id,
      isMock,
      merchantName: "EVAAS Women's Wear"
    });
  } catch (err) {
    console.error('[createPaymentOrder]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── POST /api/payment/verify ─────────────────────────────────────────────────
/**
 * @desc  Verify Razorpay signature and confirm order
 * @route POST /api/payment/verify
 * @access Private (JWT)
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, db_order_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !db_order_id) {
      return res.status(400).json({ success: false, message: 'Missing required payment verification fields.' });
    }

    // Find EVAAS order
    const order = await Order.findById(db_order_id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Ensure caller owns the order
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to verify this order.' });
    }

    // Find Payment record
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, orderId: order._id });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    // Idempotency: if already paid, return success without re-processing
    if (payment.paymentStatus === 'PAID') {
      return res.json({ success: true, message: 'Payment already verified.', order });
    }

    // Signature verification
    let isValid = false;
    if (razorpay_order_id.startsWith('order_mock_')) {
      // Development mock mode — bypass real verification
      isValid = true;
    } else if (!isMockMode) {
      isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    } else {
      isValid = true; // Fallback for dev
    }

    if (!isValid) {
      // Mark as failed
      payment.paymentStatus = 'FAILED';
      await payment.save();
      order.paymentStatus = 'Failed';
      await order.save();
      return res.status(400).json({ success: false, message: 'Payment signature verification failed. Order not confirmed.' });
    }

    // Finalize payment — idempotent
    const { alreadyProcessed } = await finalizeSuccessfulPayment({
      order,
      payment,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature
    });

    // Clear user cart
    await Cart.findOneAndDelete({ userId: req.user._id });

    return res.json({
      success: true,
      alreadyProcessed,
      message: alreadyProcessed ? 'Payment already verified.' : 'Payment verified and order confirmed!',
      orderId: order._id,
      razorpayPaymentId: razorpay_payment_id
    });
  } catch (err) {
    console.error('[verifyPayment]', err);
    res.status(500).json({ success: false, message: 'Internal server error during payment verification.' });
  }
};

// ── POST /api/payment/webhook ─────────────────────────────────────────────────
/**
 * @desc  Razorpay webhook — receives payment events server-to-server
 * @route POST /api/payment/webhook
 * @access Public (secured by Razorpay webhook signature)
 *
 * IMPORTANT: This route must receive the RAW body (Buffer), not JSON-parsed.
 * The server.js must register this route BEFORE express.json() middleware.
 */
export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      const rawBody = req.rawBody || JSON.stringify(req.body);
      const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.warn('[Webhook] Invalid signature received');
        return res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
      }
    }

    const event = req.body;
    const eventType = event.event;

    console.log(`[Webhook] Received event: ${eventType}`);

    // ── payment.captured ────────────────────────────────────────────────────
    if (eventType === 'payment.captured') {
      const paymentEntity = event.payload?.payment?.entity;
      if (!paymentEntity) return res.status(200).json({ received: true });

      const { order_id: razorpayOrderId, id: razorpayPaymentId, method } = paymentEntity;

      const payment = await Payment.findOne({ razorpayOrderId });
      if (!payment) {
        console.warn(`[Webhook] No Payment found for Razorpay order: ${razorpayOrderId}`);
        return res.status(200).json({ received: true }); // Acknowledge to Razorpay
      }

      // Idempotency check
      if (payment.paymentStatus === 'PAID') {
        console.log(`[Webhook] Payment ${razorpayOrderId} already processed. Skipping.`);
        return res.status(200).json({ received: true, alreadyProcessed: true });
      }

      const order = await Order.findById(payment.orderId);
      if (!order) {
        console.warn(`[Webhook] Order not found for payment ${payment._id}`);
        return res.status(200).json({ received: true });
      }

      await finalizeSuccessfulPayment({
        order,
        payment,
        razorpayPaymentId,
        razorpaySignature: null,
        method
      });

      // Store raw webhook payload for audit
      payment.webhookPayload = event;
      await payment.save();

      console.log(`[Webhook] ✅ Payment confirmed for order ${order._id}`);
    }

    // ── payment.failed ───────────────────────────────────────────────────────
    if (eventType === 'payment.failed') {
      const paymentEntity = event.payload?.payment?.entity;
      if (!paymentEntity) return res.status(200).json({ received: true });

      const { order_id: razorpayOrderId } = paymentEntity;
      const payment = await Payment.findOne({ razorpayOrderId });

      if (payment && payment.paymentStatus !== 'PAID') {
        payment.paymentStatus = 'FAILED';
        payment.webhookPayload = event;
        await payment.save();

        const order = await Order.findById(payment.orderId);
        if (order && order.paymentStatus !== 'Paid') {
          order.paymentStatus = 'Failed';
          await order.save();
        }
        console.log(`[Webhook] ❌ Payment failed for Razorpay order: ${razorpayOrderId}`);
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Webhook Error]', err);
    // Always return 200 to Razorpay to prevent retry storms
    return res.status(200).json({ received: true, error: true });
  }
};

// ── POST /api/payment/cancel ──────────────────────────────────────────────────
/**
 * @desc  Customer explicitly cancelled payment (Razorpay modal closed)
 * @route POST /api/payment/cancel
 * @access Private (JWT)
 */
export const cancelPayment = async (req, res) => {
  try {
    const { db_order_id } = req.body;

    const order = await Order.findById(db_order_id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Only update if still pending — do NOT change if paid
    if (order.paymentStatus === 'Pending') {
      order.paymentStatus = 'Failed';
      await order.save();

      if (order.razorpayOrderId) {
        await Payment.findOneAndUpdate(
          { razorpayOrderId: order.razorpayOrderId, paymentStatus: 'PENDING' },
          { paymentStatus: 'CANCELLED' }
        );
      }
    }

    return res.json({ success: true, message: 'Payment cancelled. Order not confirmed.' });
  } catch (err) {
    console.error('[cancelPayment]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ── GET /api/payment/order/:dbOrderId ────────────────────────────────────────
/**
 * @desc  Get payment details for a specific order (customer view)
 * @route GET /api/payment/order/:dbOrderId
 * @access Private (JWT)
 */
export const getPaymentByOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.dbOrderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const payment = order.razorpayOrderId
      ? await Payment.findOne({ razorpayOrderId: order.razorpayOrderId })
      : null;

    return res.json({ success: true, payment });
  } catch (err) {
    console.error('[getPaymentByOrder]', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
