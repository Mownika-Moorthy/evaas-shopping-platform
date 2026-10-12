import FestivalSale from '../models/FestivalSale.js';
import Product from '../models/Product.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: compute the discounted price of a product against a sale
// ─────────────────────────────────────────────────────────────────────────────
export const computeDiscountedPrice = (product, sale) => {
  if (!sale) return { finalPrice: product.price, discount: 0, discountAmount: 0 };

  const originalPrice = product.price;
  let discountAmount = 0;

  if (sale.discountType === 'percentage') {
    discountAmount = (originalPrice * sale.discountValue) / 100;
    if (sale.maxDiscountAmount > 0) {
      discountAmount = Math.min(discountAmount, sale.maxDiscountAmount);
    }
  } else {
    // fixed
    discountAmount = sale.discountValue;
  }

  discountAmount = Math.min(discountAmount, originalPrice);
  const finalPrice = Math.max(0, parseFloat((originalPrice - discountAmount).toFixed(2)));
  const discountPercent = parseFloat(((discountAmount / originalPrice) * 100).toFixed(1));

  return { finalPrice, discountAmount, discountPercent };
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: find the best active sale applicable to a product
// ─────────────────────────────────────────────────────────────────────────────
export const findApplicableSale = (product, activeSales) => {
  if (!activeSales || activeSales.length === 0) return null;

  // Priority: products scope > categories scope > all
  const productId = product._id?.toString();
  const category  = (product.category || '').toLowerCase();

  // 1. Product-specific sale
  const productSale = activeSales.find(
    s => s.applyTo === 'products' && s.targetProducts.some(id => id.toString() === productId)
  );
  if (productSale) return productSale;

  // 2. Category sale
  const categorySale = activeSales.find(
    s => s.applyTo === 'categories' &&
      s.targetCategories.map(c => c.toLowerCase()).includes(category)
  );
  if (categorySale) return categorySale;

  // 3. All-products sale
  return activeSales.find(s => s.applyTo === 'all') || null;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/festival/active — Public: returns currently running sale(s)
// ─────────────────────────────────────────────────────────────────────────────
export const getActiveSales = async (req, res) => {
  try {
    const now = new Date();
    const sales = await FestivalSale.find({
      isActive: true,
      startDate: { $lte: now },
      endDate:   { $gte: now }
    }).sort({ createdAt: -1 });

    res.json({ sales });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/festival — Admin: list all sales (with pagination)
// ─────────────────────────────────────────────────────────────────────────────
export const getAllSales = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;

    const now = new Date();
    const [sales, total] = await Promise.all([
      FestivalSale.find()
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('targetProducts', 'name price images category'),
      FestivalSale.countDocuments()
    ]);

    const salesWithStatus = sales.map(s => ({
      ...s.toObject({ virtuals: true }),
      status: s.startDate > now ? 'upcoming'
            : s.endDate   < now ? 'expired'
            : s.isActive        ? 'live'
            :                     'paused'
    }));

    res.json({ sales: salesWithStatus, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/festival — Admin: create a new festival sale
// ─────────────────────────────────────────────────────────────────────────────
export const createSale = async (req, res) => {
  try {
    const {
      name, festival, description,
      discountType, discountValue, maxDiscountAmount, minOrderAmount,
      startDate, endDate,
      applyTo, targetCategories, targetProducts,
      theme, isActive
    } = req.body;

    // Validation
    if (!name || !festival || discountValue === undefined || !startDate || !endDate) {
      return res.status(400).json({ message: 'name, festival, discountValue, startDate and endDate are required.' });
    }
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ message: 'endDate must be after startDate.' });
    }

    const sale = await FestivalSale.create({
      name, festival, description,
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      maxDiscountAmount: Number(maxDiscountAmount) || 0,
      minOrderAmount:    Number(minOrderAmount)    || 0,
      startDate: new Date(startDate),
      endDate:   new Date(endDate),
      applyTo:   applyTo || 'all',
      targetCategories: targetCategories || [],
      targetProducts:   targetProducts   || [],
      theme:     theme   || {},
      isActive:  isActive !== false
    });

    res.status(201).json({ message: 'Festival sale created successfully.', sale });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/festival/:id — Admin: update a festival sale
// ─────────────────────────────────────────────────────────────────────────────
export const updateSale = async (req, res) => {
  try {
    const sale = await FestivalSale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Festival sale not found.' });

    const allowed = [
      'name','festival','description','discountType','discountValue',
      'maxDiscountAmount','minOrderAmount','startDate','endDate',
      'applyTo','targetCategories','targetProducts','theme','isActive'
    ];
    allowed.forEach(key => {
      if (req.body[key] !== undefined) {
        sale[key] = req.body[key];
      }
    });

    if (req.body.startDate) sale.startDate = new Date(req.body.startDate);
    if (req.body.endDate)   sale.endDate   = new Date(req.body.endDate);

    await sale.save();
    res.json({ message: 'Festival sale updated.', sale });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/festival/:id — Admin: delete a festival sale
// ─────────────────────────────────────────────────────────────────────────────
export const deleteSale = async (req, res) => {
  try {
    const sale = await FestivalSale.findByIdAndDelete(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Festival sale not found.' });
    res.json({ message: 'Festival sale deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/festival/:id/toggle — Admin: toggle active status
// ─────────────────────────────────────────────────────────────────────────────
export const toggleSaleStatus = async (req, res) => {
  try {
    const sale = await FestivalSale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Festival sale not found.' });
    sale.isActive = !sale.isActive;
    await sale.save();
    res.json({ message: `Sale ${sale.isActive ? 'activated' : 'deactivated'}.`, sale });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
