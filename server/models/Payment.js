import mongoose from 'mongoose';

/**
 * Payment Model
 * Captures every Razorpay transaction lifecycle event.
 * Referenced by Order via razorpayOrderId for idempotent processing.
 */
const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    razorpayOrderId: {
      type: String,
      required: true,
      index: true
    },
    razorpayPaymentId: {
      type: String,
      default: null
    },
    razorpaySignature: {
      type: String,
      default: null
    },
    amount: {
      type: Number,  // amount in paise (₹ × 100)
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    },
    paymentMethod: {
      type: String,
      default: null   // filled after payment capture: upi, card, netbanking, etc.
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'CANCELLED'],
      default: 'PENDING'
    },
    // Prevent stock from being decremented more than once for the same payment
    stockDeducted: {
      type: Boolean,
      default: false
    },
    // Raw Razorpay webhook event payload (for audit/debugging)
    webhookPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
