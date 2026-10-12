import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

// ─── Helpers ────────────────────────────────────────────────────────────────

const getStartOfDay = (date) => new Date(new Date(date).setHours(0, 0, 0, 0));
const getEndOfDay = (date) => new Date(new Date(date).setHours(23, 59, 59, 999));

const formatCurrency = (amount) => `Rs.${Number(amount || 0).toFixed(2)}`;

/** Build date range filter based on period keyword */
const buildDateRange = (period, startDate, endDate) => {
  const now = new Date();

  if (startDate && endDate) {
    return {
      $gte: getStartOfDay(new Date(startDate)),
      $lte: getEndOfDay(new Date(endDate))
    };
  }

  switch (period) {
    case 'daily':
      return { $gte: getStartOfDay(now), $lte: getEndOfDay(now) };
    case 'weekly': {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 6);
      return { $gte: getStartOfDay(weekAgo), $lte: getEndOfDay(now) };
    }
    case 'monthly': {
      return {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lte: getEndOfDay(now)
      };
    }
    case 'yearly': {
      return {
        $gte: new Date(now.getFullYear(), 0, 1),
        $lte: getEndOfDay(now)
      };
    }
    default:
      return null; // all time
  }
};

/** Build $group _id based on period for aggregation */
const buildGroupId = (period) => {
  switch (period) {
    case 'daily':
      return {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
    case 'weekly':
      return {
        year: { $year: '$createdAt' },
        week: { $isoWeek: '$createdAt' }
      };
    case 'monthly':
      return {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    case 'yearly':
      return { year: { $year: '$createdAt' } };
    default:
      return {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
  }
};

// ─── Existing Endpoints (unchanged) ─────────────────────────────────────────

// @desc    Get Admin Dashboard Overview counts (EXISTING — preserved)
// @route   GET /api/admin/overview
export const getDashboardOverview = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    const revenueStats = await Order.aggregate([
      {
        $match: {
          $or: [
            { paymentStatus: 'Paid' },
            { paymentMethod: 'Cash on Delivery', status: { $ne: 'Cancelled' } }
          ]
        }
      },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);

    const revenue = revenueStats.length > 0 ? revenueStats[0].totalRevenue : 0;
    const pendingOrders = await Order.countDocuments({ status: 'Pending' });

    res.json({ totalProducts, totalOrders, totalCustomers, revenue, pendingOrders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Admin Dashboard Analytics (EXISTING — preserved)
// @route   GET /api/admin/analytics
export const getOrderAnalytics = async (req, res) => {
  try {
    const startOfPast6Months = new Date();
    startOfPast6Months.setMonth(startOfPast6Months.getMonth() - 5);
    startOfPast6Months.setDate(1);
    startOfPast6Months.setHours(0, 0, 0, 0);

    const monthlyStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startOfPast6Months }, status: { $ne: 'Cancelled' } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$paymentStatus', 'Paid'] },
                    { $eq: ['$paymentMethod', 'Cash on Delivery'] }
                  ]
                },
                '$totalAmount',
                0
              ]
            }
          },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyAnalytics = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const found = monthlyStats.find(s => s._id.year === year && s._id.month === monthNum);
      monthlyAnalytics.push({
        month: `${months[monthNum - 1]} ${year}`,
        revenue: found ? found.revenue : 0,
        orders: found ? found.orderCount : 0
      });
    }

    const topProductsStats = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$products' },
      { $group: { _id: '$products.productId', totalQuantity: { $sum: '$products.quantity' } } },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 }
    ]);

    const topProducts = [];
    for (const stat of topProductsStats) {
      const prod = await Product.findById(stat._id).select('name price category');
      if (prod) {
        topProducts.push({ name: prod.name, quantity: stat.totalQuantity, category: prod.category, price: prod.price });
      }
    }

    const categoryStats = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$products' },
      {
        $lookup: {
          from: 'products',
          localField: 'products.productId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $group: {
          _id: '$productDetails.category',
          revenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }
        }
      }
    ]);

    const categorySales = categoryStats.map(stat => ({ category: stat._id, revenue: stat.revenue }));

    const now = new Date();
    const todayStart = getStartOfDay(new Date(now));
    const todayEnd = getEndOfDay(new Date(now));
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const getRevenueForRange = async (start, end) => {
      const matchQuery = {
        createdAt: { $gte: start },
        $or: [
          { paymentStatus: 'Paid' },
          { paymentMethod: 'Cash on Delivery', status: { $ne: 'Cancelled' } }
        ]
      };
      if (end) matchQuery.createdAt.$lte = end;
      const stats = await Order.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      return stats.length > 0 ? stats[0].total : 0;
    };

    const todayRevenue = await getRevenueForRange(todayStart, todayEnd);
    const monthlyRevenue = await getRevenueForRange(monthStart);
    const yearlyRevenue = await getRevenueForRange(yearStart);

    res.json({
      monthlyAnalytics,
      topProducts,
      categorySales,
      revenueSummary: { today: todayRevenue, monthly: monthlyRevenue, yearly: yearlyRevenue }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (EXISTING — preserved)
// @route   GET /api/admin/orders
export const getAllOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    let query = {};
    if (status) query.status = status;

    let orders = await Order.find(query)
      .populate('userId', 'name email phone')
      .populate('products.productId', 'name price images')
      .sort({ createdAt: -1 });

    if (search) {
      const cleanSearch = search.toLowerCase();
      orders = orders.filter(o =>
        o._id.toString().includes(cleanSearch) ||
        (o.userId?.name || '').toLowerCase().includes(cleanSearch) ||
        o.phone.includes(cleanSearch)
      );
    }

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status + courier details (UPDATED — payment guard added)
// @route   PUT /api/admin/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  const {
    status,
    paymentStatus,
    // Courier fields
    courierName,
    trackingNumber,
    trackingUrl,
    estimatedDeliveryDate
  } = req.body;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // SECURITY: Admin cannot manually mark a Razorpay-unpaid order as Paid
    if (paymentStatus === 'Paid' && order.paymentMethod === 'Razorpay' && order.paymentStatus !== 'Paid') {
      return res.status(403).json({
        message: 'Cannot manually mark a Razorpay order as Paid. Payment must be verified through Razorpay.'
      });
    }

    if (status) {
      order.status = status;

      // Auto-set timestamps based on status transitions
      if (status === 'Shipped' && !order.shippedAt) {
        order.shippedAt = new Date();
      }
      if (status === 'Delivered' && !order.deliveredAt) {
        order.deliveredAt = new Date();
      }

      // COD → mark paid on delivery
      if (status === 'Delivered' && order.paymentMethod === 'Cash on Delivery') {
        order.paymentStatus = 'Paid';
      }
    }

    // Only allow explicit paymentStatus updates for COD
    if (paymentStatus && order.paymentMethod === 'Cash on Delivery') {
      order.paymentStatus = paymentStatus;
    }

    // Update courier details (optional fields)
    if (courierName !== undefined) order.courierName = courierName;
    if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) order.trackingUrl = trackingUrl;
    if (estimatedDeliveryDate !== undefined) {
      order.estimatedDeliveryDate = estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null;
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get all customers (EXISTING — preserved)
// @route   GET /api/admin/customers
export const getAllCustomers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { role: 'customer' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const customers = await User.find(query).select('-password').sort({ createdAt: -1 });
    const customersData = [];
    for (const customer of customers) {
      const orderCount = await Order.countDocuments({ userId: customer._id });
      const spendStats = await Order.aggregate([
        { $match: { userId: customer._id, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      const totalSpend = spendStats.length > 0 ? spendStats[0].total : 0;
      customersData.push({ ...customer._doc, orderCount, totalSpend });
    }

    res.json(customersData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer order history (EXISTING — preserved)
// @route   GET /api/admin/customers/:id/orders
export const getCustomerOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.id })
      .populate('products.productId', 'name price images')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reviews (EXISTING — preserved)
// @route   GET /api/admin/reviews
export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('userId', 'name email')
      .populate('productId', 'name images category price')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a review (EXISTING — preserved)
// @route   DELETE /api/admin/reviews/:id
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── NEW: Enhanced Dashboard ─────────────────────────────────────────────────

// @desc    Get Enhanced Admin Dashboard — all 9 metric cards
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getEnhancedDashboard = async (req, res) => {
  try {
    const LOW_STOCK_THRESHOLD = 10;

    const [totalProducts, totalCategories, totalOrders] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments({ isActive: true }),
      Order.countDocuments()
    ]);

    // Revenue (paid or COD non-cancelled)
    const revenueResult = await Order.aggregate([
      {
        $match: {
          $or: [
            { paymentStatus: 'Paid' },
            { paymentMethod: 'Cash on Delivery', status: { $ne: 'Cancelled' } }
          ]
        }
      },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    // Stock status counts
    const [inStock, lowStock, outOfStock] = await Promise.all([
      Product.countDocuments({ stock: { $gt: LOW_STOCK_THRESHOLD } }),
      Product.countDocuments({ stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }),
      Product.countDocuments({ stock: 0 })
    ]);

    // Best-selling product
    const bestSellingAgg = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productId',
          totalQty: { $sum: '$products.quantity' },
          totalRevenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }
        }
      },
      { $sort: { totalQty: -1 } },
      { $limit: 1 }
    ]);

    let bestSelling = null;
    if (bestSellingAgg.length > 0) {
      const prod = await Product.findById(bestSellingAgg[0]._id).select('name images category');
      if (prod) {
        bestSelling = {
          name: prod.name,
          image: prod.images?.[0] || '',
          category: prod.category,
          quantitySold: bestSellingAgg[0].totalQty,
          revenue: bestSellingAgg[0].totalRevenue
        };
      }
    }

    // Least-selling product (only from products that appear in orders)
    const leastSellingAgg = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productId',
          totalQty: { $sum: '$products.quantity' },
          totalRevenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }
        }
      },
      { $sort: { totalQty: 1 } },
      { $limit: 1 }
    ]);

    let leastSelling = null;
    if (leastSellingAgg.length > 0) {
      const prod = await Product.findById(leastSellingAgg[0]._id).select('name images category');
      if (prod) {
        leastSelling = {
          name: prod.name,
          image: prod.images?.[0] || '',
          category: prod.category,
          quantitySold: leastSellingAgg[0].totalQty,
          revenue: leastSellingAgg[0].totalRevenue
        };
      }
    }

    // Low stock notification badge count
    const lowStockAlertCount = await Product.countDocuments({ stock: { $gte: 0, $lte: LOW_STOCK_THRESHOLD } });

    res.json({
      totalProducts,
      totalCategories,
      totalOrders,
      totalRevenue,
      inStock,
      lowStock,
      outOfStock,
      bestSelling,
      leastSelling,
      lowStockAlertCount,
      threshold: LOW_STOCK_THRESHOLD
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── NEW: All Products for Admin (includes inactive) ────────────────────────

// @desc    Get ALL products for admin panel (includes inactive products)
// @route   GET /api/admin/products
// @access  Private/Admin
export const getAdminProducts = async (req, res) => {
  try {
    const { search, category, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const products = await Product.find(query).sort({ createdAt: -1 });
    const formatted = products.map(p => {
      const obj = p.toObject ? p.toObject() : { ...p };
      if (!obj.sizeStock || obj.sizeStock.length === 0) {
        const sizes = obj.sizes?.length ? obj.sizes : ['Free Size'];
        const total = obj.stock || 0;
        const base = Math.floor(total / sizes.length);
        const rem = total % sizes.length;
        obj.sizeStock = sizes.map((s, i) => ({ size: s, stock: base + (i === 0 ? rem : 0) }));
      }
      return obj;
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── NEW: Inventory Management ───────────────────────────────────────────────

// @desc    Get inventory list with stock status and units sold
// @route   GET /api/admin/inventory
// @access  Private/Admin
export const getInventory = async (req, res) => {
  try {
    const { search, category, stockStatus, threshold: thresholdParam } = req.query;
    const LOW_STOCK_THRESHOLD = Number(thresholdParam) || 10;

    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;

    const products = await Product.find(query).sort({ name: 1 });

    // Get units sold for each product via aggregation
    const soldAgg = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productId',
          unitsSold: { $sum: '$products.quantity' }
        }
      }
    ]);
    const soldMap = {};
    soldAgg.forEach(item => {
      soldMap[item._id.toString()] = item.unitsSold;
    });

    // Build inventory items with stock status & sizeStock
    let inventory = products.map(prod => {
      const unitsSold = soldMap[prod._id.toString()] || 0;
      let stockStatus;
      if (prod.stock === 0) stockStatus = 'Out of Stock';
      else if (prod.stock <= LOW_STOCK_THRESHOLD) stockStatus = 'Low Stock';
      else stockStatus = 'In Stock';

      const sizeStock = (prod.sizeStock && prod.sizeStock.length > 0)
        ? prod.sizeStock
        : (prod.sizes || []).map((s, idx) => {
            const count = prod.sizes.length || 1;
            const base = Math.floor(prod.stock / count);
            const rem = prod.stock % count;
            return { size: s, stock: base + (idx === 0 ? rem : 0) };
          });

      return {
        _id: prod._id,
        name: prod.name,
        image: prod.images?.[0] || '',
        sku: prod.sku || 'N/A',
        category: prod.category,
        price: prod.price,
        discount: prod.discount,
        stock: prod.stock,
        sizes: prod.sizes,
        sizeStock,
        unitsSold,
        stockStatus,
        isActive: prod.isActive
      };
    });

    // Filter by stockStatus if requested
    if (stockStatus) {
      inventory = inventory.filter(item => item.stockStatus === stockStatus);
    }

    res.json({ inventory, threshold: LOW_STOCK_THRESHOLD });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update product stock quantity or per-size stock from Inventory page
// @route   PUT /api/admin/inventory/:id
// @access  Private/Admin
export const updateInventoryStock = async (req, res) => {
  try {
    const { stock, sizeStock } = req.body;
    if (stock === undefined && sizeStock === undefined) {
      return res.status(400).json({ message: 'Stock quantity or sizeStock is required' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (Array.isArray(sizeStock)) {
      product.sizeStock = sizeStock.map(s => ({
        size: String(s.size).trim(),
        stock: Math.max(0, Number(s.stock) || 0)
      }));
      product.sizes = product.sizeStock.map(s => s.size);
      product.stock = product.sizeStock.reduce((acc, curr) => acc + curr.stock, 0);
    } else if (stock !== undefined && stock !== null) {
      product.stock = Math.max(0, Number(stock));
      const count = product.sizes.length || 1;
      const base = Math.floor(product.stock / count);
      const rem = product.stock % count;
      product.sizeStock = (product.sizes || []).map((s, idx) => ({
        size: s,
        stock: base + (idx === 0 ? rem : 0)
      }));
    }

    const updated = await product.save();

    // Determine stock status
    const threshold = 10;
    let stockStatus;
    if (updated.stock === 0) stockStatus = 'Out of Stock';
    else if (updated.stock <= threshold) stockStatus = 'Low Stock';
    else stockStatus = 'In Stock';

    res.json({ product: updated, stockStatus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── NEW: Sales Reports (MongoDB Aggregation Pipeline) ───────────────────────

// @desc    Generate sales report using aggregation pipeline
// @route   GET /api/admin/reports?period=daily|weekly|monthly|yearly&startDate=&endDate=
// @access  Private/Admin
export const getSalesReport = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    const dateRange = buildDateRange(period, startDate, endDate);
    const groupId = buildGroupId(period);

    const matchStage = {
      status: { $ne: 'Cancelled' }
    };
    if (dateRange) matchStage.createdAt = dateRange;

    // Aggregate: orders, revenue, total quantity
    const reportData = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$products' },
      {
        $group: {
          _id: groupId,
          totalOrders: { $addToSet: '$_id' },
          totalRevenue: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$paymentStatus', 'Paid'] },
                    { $eq: ['$paymentMethod', 'Cash on Delivery'] }
                  ]
                },
                '$totalAmount',
                0
              ]
            }
          },
          totalQuantity: { $sum: '$products.quantity' }
        }
      },
      {
        $project: {
          _id: 1,
          totalOrders: { $size: '$totalOrders' },
          totalRevenue: 1,
          totalQuantity: 1
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.week': 1 } }
    ]);

    // Summary totals
    const summary = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$products' },
      {
        $group: {
          _id: null,
          uniqueOrders: { $addToSet: '$_id' },
          totalRevenue: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ['$paymentStatus', 'Paid'] },
                    { $eq: ['$paymentMethod', 'Cash on Delivery'] }
                  ]
                },
                '$totalAmount',
                0
              ]
            }
          },
          totalQuantity: { $sum: '$products.quantity' }
        }
      },
      {
        $project: {
          totalOrders: { $size: '$uniqueOrders' },
          totalRevenue: 1,
          totalQuantity: 1
        }
      }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Format labels
    const formatted = reportData.map(item => {
      let label = '';
      if (period === 'daily') {
        label = `${item._id.day} ${months[(item._id.month || 1) - 1]} ${item._id.year}`;
      } else if (period === 'weekly') {
        label = `Week ${item._id.week}, ${item._id.year}`;
      } else if (period === 'monthly') {
        label = `${months[(item._id.month || 1) - 1]} ${item._id.year}`;
      } else {
        label = `${item._id.year}`;
      }
      return {
        label,
        totalOrders: item.totalOrders,
        totalRevenue: item.totalRevenue,
        totalQuantity: item.totalQuantity
      };
    });

    res.json({
      period,
      reportData: formatted,
      summary: summary[0] || { totalOrders: 0, totalRevenue: 0, totalQuantity: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── NEW: Export PDF ─────────────────────────────────────────────────────────

// @desc    Export sales report as PDF
// @route   GET /api/admin/reports/export/pdf?period=monthly
// @access  Private/Admin
export const exportReportPDF = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    // Fetch report data (re-use logic)
    const dateRange = buildDateRange(period, startDate, endDate);
    const groupId = buildGroupId(period);
    const matchStage = { status: { $ne: 'Cancelled' } };
    if (dateRange) matchStage.createdAt = dateRange;

    const reportData = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$products' },
      {
        $group: {
          _id: groupId,
          totalOrders: { $addToSet: '$_id' },
          totalRevenue: {
            $sum: {
              $cond: [
                { $or: [{ $eq: ['$paymentStatus', 'Paid'] }, { $eq: ['$paymentMethod', 'Cash on Delivery'] }] },
                '$totalAmount',
                0
              ]
            }
          },
          totalQuantity: { $sum: '$products.quantity' }
        }
      },
      { $project: { _id: 1, totalOrders: { $size: '$totalOrders' }, totalRevenue: 1, totalQuantity: 1 } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=EVAAS_SalesReport_${period}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#b76e79').text('EVAAS Womenswear', { align: 'center' });
    doc.fontSize(14).fillColor('#333').text(`Sales Report — ${period.toUpperCase()}`, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
    doc.moveDown(1);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#b76e79');
    doc.moveDown(0.5);

    // Table headers
    const colWidths = [160, 90, 100, 100];
    const startX = 40;
    let y = doc.y;

    doc.fontSize(10).fillColor('#fff');
    doc.rect(startX, y, 515, 20).fill('#b76e79');
    doc.fillColor('#fff')
      .text('Period', startX + 5, y + 5, { width: colWidths[0] })
      .text('Orders', startX + colWidths[0] + 5, y + 5, { width: colWidths[1] })
      .text('Qty Sold', startX + colWidths[0] + colWidths[1] + 5, y + 5, { width: colWidths[2] })
      .text('Revenue', startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, y + 5, { width: colWidths[3] });
    y += 22;

    // Table rows
    let totalOrders = 0, totalQty = 0, totalRevenue = 0;
    reportData.forEach((item, idx) => {
      let label = '';
      if (period === 'daily') label = `${item._id.day} ${months[(item._id.month || 1) - 1]} ${item._id.year}`;
      else if (period === 'weekly') label = `Week ${item._id.week}, ${item._id.year}`;
      else if (period === 'monthly') label = `${months[(item._id.month || 1) - 1]} ${item._id.year}`;
      else label = `${item._id.year}`;

      const bg = idx % 2 === 0 ? '#fdf0f2' : '#fff';
      doc.rect(startX, y, 515, 18).fill(bg);
      doc.fillColor('#333')
        .text(label, startX + 5, y + 4, { width: colWidths[0] })
        .text(String(item.totalOrders), startX + colWidths[0] + 5, y + 4, { width: colWidths[1] })
        .text(String(item.totalQuantity), startX + colWidths[0] + colWidths[1] + 5, y + 4, { width: colWidths[2] })
        .text(formatCurrency(item.totalRevenue), startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, y + 4, { width: colWidths[3] });

      totalOrders += item.totalOrders;
      totalQty += item.totalQuantity;
      totalRevenue += item.totalRevenue;
      y += 20;

      if (y > 720) { doc.addPage(); y = 40; }
    });

    // Totals row
    doc.rect(startX, y, 515, 20).fill('#b76e79');
    doc.fillColor('#fff').fontSize(10)
      .text('TOTAL', startX + 5, y + 5, { width: colWidths[0] })
      .text(String(totalOrders), startX + colWidths[0] + 5, y + 5, { width: colWidths[1] })
      .text(String(totalQty), startX + colWidths[0] + colWidths[1] + 5, y + 5, { width: colWidths[2] })
      .text(formatCurrency(totalRevenue), startX + colWidths[0] + colWidths[1] + colWidths[2] + 5, y + 5, { width: colWidths[3] });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── NEW: Export Excel ────────────────────────────────────────────────────────

// @desc    Export sales report as Excel
// @route   GET /api/admin/reports/export/excel?period=monthly
// @access  Private/Admin
export const exportReportExcel = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    const dateRange = buildDateRange(period, startDate, endDate);
    const groupId = buildGroupId(period);
    const matchStage = { status: { $ne: 'Cancelled' } };
    if (dateRange) matchStage.createdAt = dateRange;

    const reportData = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$products' },
      {
        $group: {
          _id: groupId,
          totalOrders: { $addToSet: '$_id' },
          totalRevenue: {
            $sum: {
              $cond: [
                { $or: [{ $eq: ['$paymentStatus', 'Paid'] }, { $eq: ['$paymentMethod', 'Cash on Delivery'] }] },
                '$totalAmount',
                0
              ]
            }
          },
          totalQuantity: { $sum: '$products.quantity' }
        }
      },
      { $project: { _id: 1, totalOrders: { $size: '$totalOrders' }, totalRevenue: 1, totalQuantity: 1 } },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EVAAS Womenswear';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`${period} Report`);

    // Title row
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = 'EVAAS Womenswear — Sales Report';
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFB76E79' } };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.mergeCells('A2:D2');
    sheet.getCell('A2').value = `Period: ${period.toUpperCase()} | Generated: ${new Date().toLocaleDateString('en-IN')}`;
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    // Column headers
    sheet.addRow(['']);
    const headerRow = sheet.addRow(['Period', 'Total Orders', 'Qty Sold', 'Revenue (Rs.)']);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB76E79' } };
      cell.alignment = { horizontal: 'center' };
    });

    // Data rows
    let totalOrders = 0, totalQty = 0, totalRevenue = 0;
    reportData.forEach((item, idx) => {
      let label = '';
      if (period === 'daily') label = `${item._id.day} ${months[(item._id.month || 1) - 1]} ${item._id.year}`;
      else if (period === 'weekly') label = `Week ${item._id.week}, ${item._id.year}`;
      else if (period === 'monthly') label = `${months[(item._id.month || 1) - 1]} ${item._id.year}`;
      else label = `${item._id.year}`;

      const row = sheet.addRow([label, item.totalOrders, item.totalQuantity, item.totalRevenue]);
      if (idx % 2 === 0) {
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDF0F2' } };
        });
      }
      totalOrders += item.totalOrders;
      totalQty += item.totalQuantity;
      totalRevenue += item.totalRevenue;
    });

    // Totals row
    const totalsRow = sheet.addRow(['TOTAL', totalOrders, totalQty, totalRevenue]);
    totalsRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB76E79' } };
    });

    // Column widths
    sheet.getColumn('A').width = 22;
    sheet.getColumn('B').width = 15;
    sheet.getColumn('C').width = 12;
    sheet.getColumn('D').width = 18;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=EVAAS_SalesReport_${period}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── NEW: Top-Selling Products ────────────────────────────────────────────────

// @desc    Get Top 10 best-selling products (descending by qty sold)
// @route   GET /api/admin/analytics/top-selling
// @access  Private/Admin
export const getTopSellingProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const topAgg = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productId',
          totalQuantity: { $sum: '$products.quantity' },
          totalRevenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit }
    ]);

    const result = [];
    for (let i = 0; i < topAgg.length; i++) {
      const prod = await Product.findById(topAgg[i]._id).select('name images category price sku');
      if (prod) {
        result.push({
          rank: i + 1,
          productId: prod._id,
          name: prod.name,
          image: prod.images?.[0] || '',
          category: prod.category,
          price: prod.price,
          sku: prod.sku,
          quantitySold: topAgg[i].totalQuantity,
          revenue: topAgg[i].totalRevenue
        });
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── NEW: Least-Selling Products ──────────────────────────────────────────────

// @desc    Get Bottom 10 least-selling products (ascending by qty sold)
// @route   GET /api/admin/analytics/least-selling
// @access  Private/Admin
export const getLeastSellingProducts = async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const leastAgg = await Order.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.productId',
          totalQuantity: { $sum: '$products.quantity' },
          totalRevenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }
        }
      },
      { $sort: { totalQuantity: 1 } },
      { $limit: limit }
    ]);

    const result = [];
    for (let i = 0; i < leastAgg.length; i++) {
      const prod = await Product.findById(leastAgg[i]._id).select('name images category price sku stock');
      if (prod) {
        result.push({
          rank: i + 1,
          productId: prod._id,
          name: prod.name,
          image: prod.images?.[0] || '',
          category: prod.category,
          price: prod.price,
          sku: prod.sku,
          stock: prod.stock,
          quantitySold: leastAgg[i].totalQuantity,
          revenue: leastAgg[i].totalRevenue
        });
      }
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── NEW: Low Stock Alerts ────────────────────────────────────────────────────

// @desc    Get products below threshold (Low Stock + Out of Stock)
// @route   GET /api/admin/analytics/low-stock?threshold=10
// @access  Private/Admin
export const getLowStockAlerts = async (req, res) => {
  try {
    const threshold = Number(req.query.threshold) || 10;

    const products = await Product.find({
      stock: { $lte: threshold }
    }).sort({ stock: 1 });

    const result = products.map(prod => {
      const sizeStock = (prod.sizeStock && prod.sizeStock.length > 0)
        ? prod.sizeStock
        : (prod.sizes || []).map((s, idx) => {
            const count = prod.sizes.length || 1;
            const base = Math.floor(prod.stock / count);
            const rem = prod.stock % count;
            return { size: s, stock: base + (idx === 0 ? rem : 0) };
          });
      return {
        _id: prod._id,
        name: prod.name,
        image: prod.images?.[0] || '',
        sku: prod.sku || 'N/A',
        category: prod.category,
        price: prod.price,
        stock: prod.stock,
        sizes: prod.sizes,
        sizeStock,
        isActive: prod.isActive,
        stockStatus: prod.stock === 0 ? 'Out of Stock' : 'Low Stock'
      };
    });

    res.json({ products: result, threshold, count: result.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
