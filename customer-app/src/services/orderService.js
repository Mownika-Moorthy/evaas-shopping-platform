import api from './api';

// ── Razorpay Payment Flow ────────────────────────────────────────────────────

/**
 * Step 1: Create a Razorpay order on the backend.
 * The backend verifies stock, calculates the real price, and returns:
 * { razorpayOrderId, amount, currency, razorpayKeyId, dbOrderId, isMock }
 */
export const createPaymentOrder = async (payload) => {
  const { data } = await api.post('/payment/create-order', payload);
  return data;
};

/**
 * Step 2: Verify the Razorpay signature after customer pays.
 * Send: { razorpay_order_id, razorpay_payment_id, razorpay_signature, db_order_id }
 */
export const verifyPayment = async (paymentData) => {
  const { data } = await api.post('/payment/verify', paymentData);
  return data;
};

/**
 * Cancel: Customer closed/dismissed the Razorpay modal.
 */
export const cancelPayment = async (db_order_id) => {
  const { data } = await api.post('/payment/cancel', { db_order_id });
  return data;
};

// ── Legacy COD Order ─────────────────────────────────────────────────────────

/**
 * Place a COD order directly.
 */
export const createOrder = async (orderData) => {
  const { data } = await api.post('/orders', orderData);
  return data;
};

// ── My Orders ────────────────────────────────────────────────────────────────

export const getMyOrders = async () => {
  const { data } = await api.get('/orders/my-orders');
  return data;
};

export const getOrderById = async (id) => {
  const { data } = await api.get(`/orders/${id}`);
  return data;
};

export const getMyReviews = async () => {
  const { data } = await api.get('/orders/my-reviews');
  return data;
};
