import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Cart from '../models/Cart.js';
import Category from '../models/Category.js';

/**
 * orderController.js — Legacy COD + order-fetching endpoints.
 * Razorpay payment flow is now handled by paymentController.js
 *
 * Kept:
 *  - createOrder  (COD only — Razorpay uses /api/payment/create-order)
 *  - verifyRazorpayPayment  (legacy alias → delegates to /api/payment/verify)
 *  - getMyOrders
 *  - getOrderById
 *  - submitReview
 */

// @desc    Create a new COD order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: 'Cash on Delivery (COD) is disabled. EVAAS only accepts secure online payments via Razorpay.'
  });
};

/* Legacy COD implementation disabled in favor of online-only Razorpay payments
export const createOrderLegacy = async (req, res) => {
  const { products, totalAmount, paymentMethod, shippingAddress, phone, deliveryAddress } = req.body;

  try {
    if (!products || products.length === 0) {
      return res.status(400).json({ message: 'No products in order' });
    }

    // Only allow COD through this route; Razorpay uses /api/payment/create-order
    if (paymentMethod !== 'Cash on Delivery') {
      return res.status(400).json({
        message: 'Use POST /api/payment/create-order for Razorpay payments.'
      });
    }

    if (!shippingAddress || !phone) {
      return res.status(400).json({ message: 'Shipping address and phone are required' });
    }

    // Server-side stock verification for COD
    let calculatedTotal = 0;
    const verifiedItems = [];

    for (const item of products) {
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct || !dbProduct.isActive) {
        return res.status(404).json({
          message: `Product is not available: ${dbProduct ? dbProduct.name : item.productId}`
        });
      }

      const activeCategory = await Category.findOne({
        name: { $regex: `^${dbProduct.category}$`, $options: 'i' },
        isActive: true
      });
      if (!activeCategory) {
        return res.status(400).json({
          message: `Cannot order ${dbProduct.name}: category '${dbProduct.category}' is inactive.`
        });
      }

      // Verify stock for specific size
      let availableStock = dbProduct.stock;
      if (dbProduct.sizeStock && dbProduct.sizeStock.length > 0 && item.size) {
        const matched = dbProduct.sizeStock.find(s => s.size.toLowerCase() === item.size.trim().toLowerCase());
        if (matched) availableStock = matched.stock;
      }

      if (availableStock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${dbProduct.name} (Size: ${item.size}). Available: ${availableStock}`
        });
      }

      const effectivePrice = dbProduct.price;

      calculatedTotal += effectivePrice * item.quantity;
      verifiedItems.push({
        productId: dbProduct._id,
        quantity: item.quantity,
        size: item.size,
        price: effectivePrice
      });
    }

    // Build structured delivery address if provided
    let structuredAddress = null;
    if (deliveryAddress && deliveryAddress.fullName) {
      structuredAddress = deliveryAddress;
    }

    const order = await Order.create({
      userId: req.user._id,
      products: verifiedItems,
      totalAmount: parseFloat(calculatedTotal.toFixed(2)),
      paymentMethod: 'Cash on Delivery',
      paymentStatus: 'Pending',
      status: 'Confirmed',  // COD → directly confirmed
      shippingAddress,
      phone,
      deliveryAddress: structuredAddress,
      stockDeducted: true
    });

    // Decrement stock per size for COD
    for (const item of verifiedItems) {
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

    // Clear Cart
    await Cart.findOneAndDelete({ userId: req.user._id });

    return res.status(201).json({
      success: true,
      order,
      message: 'Order placed successfully with Cash on Delivery'
    });
  } catch (error) {
    console.error('[createOrder COD]', error);
    res.status(500).json({ message: error.message });
  }
};
*/

// @desc    Legacy Razorpay verify alias (kept for backward-compatibility)
// @route   POST /api/orders/verify-payment
// @access  Private
export const verifyRazorpayPayment = async (req, res) => {
  // Forward to payment controller logic inline
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, db_order_id } = req.body;

    if (!db_order_id) {
      return res.status(400).json({ message: 'db_order_id is required.' });
    }

    const order = await Order.findById(db_order_id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found in database' });
    }

    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized.' });
    }

    if (order.paymentStatus === 'Paid') {
      return res.json({ success: true, message: 'Payment already verified.', order });
    }

    // Always succeed for mock orders
    const isMock = razorpay_order_id?.startsWith('order_mock_');
    let isValid = isMock;

    if (!isMock) {
      const crypto = await import('crypto');
      const secret = process.env.RAZORPAY_KEY_SECRET;
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expected = crypto.default
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');
      isValid = expected === razorpay_signature;
    }

    if (!isValid) {
      order.paymentStatus = 'Failed';
      await order.save();
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    if (!order.stockDeducted) {
      for (const item of order.products) {
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
      order.stockDeducted = true;
    }

    order.paymentStatus = 'Paid';
    order.razorpayPaymentId = razorpay_payment_id;
    order.status = 'Confirmed';
    await order.save();

    await Cart.findOneAndDelete({ userId: req.user._id });

    res.json({
      success: true,
      message: 'Payment verified and order placed successfully',
      order
    });
  } catch (error) {
    console.error('[verifyRazorpayPayment legacy]', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .populate('products.productId', 'name images category')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('products.productId', 'name images price category');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this order' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reviews submitted by the logged in user
// @route   GET /api/orders/my-reviews
// @access  Private
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .populate('productId', 'name images category price')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error('getMyReviews error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit or update a review for a product
// @route   POST /api/orders/:id/review  (id = productId)
// @access  Private
export const submitReview = async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  try {
    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    // Verify the user has purchased this product (non-cancelled order)
    const validOrders = await Order.find({
      userId: req.user._id,
      status: { $ne: 'Cancelled' },
      'products.productId': productId
    });

    if (validOrders.length === 0) {
      return res.status(403).json({
        message: 'Only customers who have ordered this product can leave a review.'
      });
    }

    // Check if review already exists; update it if so, otherwise create new
    let review = await Review.findOne({
      userId: req.user._id,
      productId
    });

    let isUpdate = false;
    if (review) {
      isUpdate = true;
      review.rating = Number(rating);
      review.comment = comment.trim();
      await review.save();
    } else {
      review = new Review({
        userId: req.user._id,
        productId,
        rating: Number(rating),
        comment: comment.trim()
      });
      await review.save();
    }

    // Populate user name and product for instant UI update
    const populated = await Review.findById(review._id)
      .populate('userId', 'name')
      .populate('productId', 'name images category price');

    res.status(isUpdate ? 200 : 201).json({
      message: isUpdate ? 'Review updated successfully!' : 'Review submitted successfully!',
      review: populated
    });
  } catch (error) {
    console.error('submitReview error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

