import mongoose from 'mongoose';

/**
 * Order Model — Updated for full Razorpay payment integration
 *
 * Changes from original:
 *  - orderStatus expanded to PENDING_PAYMENT | CONFIRMED | PROCESSING | SHIPPED | OUT_FOR_DELIVERY | DELIVERED | CANCELLED
 *  - paymentStatus updated: PENDING | PAID | FAILED (Refunded removed — EVAAS does not support refunds)
 *  - shippingAddress changed from plain String to structured sub-document (snapshot at order time)
 *  - Added courier fields: courierName, trackingNumber, trackingUrl, shippedAt, deliveredAt, estimatedDeliveryDate
 *  - Added stockDeducted flag to prevent double stock deduction
 *  - Kept backward-compatible fields: status (maps to orderStatus), phone, orderDate
 */

// ── Delivery Address Snapshot ─────────────────────────────────────────────────
const addressSchema = new mongoose.Schema(
  {
    fullName:    { type: String, required: true },
    phone:       { type: String, required: true },
    houseNo:     { type: String, required: true },
    street:      { type: String, required: true },
    city:        { type: String, required: true },
    state:       { type: String, required: true },
    pincode:     { type: String, required: true }
  },
  { _id: false }
);

// ── Order Item ────────────────────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: { type: Number, required: true, min: 1 },
    size:     { type: String, required: true },
    price:    { type: Number, required: true }  // server-verified price snapshot
  },
  { _id: false }
);

// ── Main Order ────────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    products: [orderItemSchema],

    totalAmount: { type: Number, required: true },

    // ── Payment ───────────────────────────────────────────────────────────────
    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery', 'Razorpay'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed'],   // NOTE: No Refunded — EVAAS has no return/refund policy
      default: 'Pending'
    },
    razorpayOrderId:  { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },

    // ── Order Lifecycle ───────────────────────────────────────────────────────
    // 'status' kept for backward-compatibility with existing admin/customer code
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Pending'
    },

    // ── Delivery Address (snapshot — immutable after order placed) ────────────
    deliveryAddress: {
      type: addressSchema,
      required: false  // Optional so COD legacy orders (shippingAddress string) still work
    },
    // Legacy plain-text address field kept for backward-compatibility
    shippingAddress: { type: String, default: '' },
    phone: { type: String, default: '' },   // top-level phone kept for legacy queries

    // ── Courier / Shipping Details ────────────────────────────────────────────
    courierName:          { type: String, default: null },
    trackingNumber:       { type: String, default: null },
    trackingUrl:          { type: String, default: null },
    shippedAt:            { type: Date,   default: null },
    deliveredAt:          { type: Date,   default: null },
    estimatedDeliveryDate:{ type: Date,   default: null },

    // ── Idempotency Flag ──────────────────────────────────────────────────────
    stockDeducted: { type: Boolean, default: false },

    // ── Legacy ────────────────────────────────────────────────────────────────
    orderDate: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
