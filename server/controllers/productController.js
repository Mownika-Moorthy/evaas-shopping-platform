import Product from '../models/Product.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';

const DEFAULT_CATEGORIES = [
  { name: 'Sarees', description: 'Traditional Indian Sarees', isActive: true },
  { name: 'Kurtis', description: 'Stylish Kurtis and Kurtas', isActive: true },
  { name: 'Salwars', description: 'Salwar Kameez Sets', isActive: true },
  { name: 'Tops', description: 'Casual and Party Tops', isActive: true },
  { name: 'Leggings', description: 'Comfortable Leggings and Churidars', isActive: true },
  { name: 'Nightwear', description: 'Comfortable Night Suits and Sleepwear', isActive: true },
  { name: 'Ethnic Wear', description: 'Ethnic and Traditional Wear', isActive: true },
  { name: 'Western Wear', description: 'Modern Western Outfits', isActive: true }
];

// @desc    Get all products with filters (PUBLIC — only isActive:true and active category)
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, rating, sortBy } = req.query;

    // Seed default categories if collection is empty
    const catCount = await Category.countDocuments();
    if (catCount === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
    }

    // Fetch all active categories
    const activeCategories = await Category.find({ isActive: true }).select('name');
    const activeCategoryNames = activeCategories.map(c => c.name);

    if (activeCategoryNames.length === 0) {
      return res.json([]);
    }

    // Public customers see only active products
    let query = { isActive: true };

    if (category) {
      // Check if requested category is active
      const matchedCategory = activeCategories.find(
        c => c.name.toLowerCase() === category.trim().toLowerCase()
      );
      if (!matchedCategory) {
        // If category is inactive or non-existent, return empty array
        return res.json([]);
      }
      query.category = { $regex: `^${matchedCategory.name}$`, $options: 'i' };
    } else {
      // Only include products that belong to an active category (case-insensitive)
      query.category = { $in: activeCategoryNames.map(n => new RegExp(`^${n}$`, 'i')) };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (rating) {
      query.averageRating = { $gte: Number(rating) };
    }

    let sort = {};
    if (sortBy === 'price_low' || sortBy === 'priceAsc' || sortBy === 'price_asc') {
      sort.price = 1;
    } else if (sortBy === 'price_high' || sortBy === 'priceDesc' || sortBy === 'price_desc') {
      sort.price = -1;
    } else if (sortBy === 'rating' || sortBy === 'top_rated' || sortBy === 'ratingDesc') {
      sort.averageRating = -1;
    } else if (sortBy === 'oldest') {
      sort.createdAt = 1;
    } else {
      // Default: latest arrivals
      sort.createdAt = -1;
    }

    const products = await Product.find(query).sort(sort);
    res.json(products.map(formatProductWithSizeStock));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: Ensure product has sizeStock populated even if legacy document
export const formatProductWithSizeStock = (product) => {
  if (!product) return null;
  const prodObj = product.toObject ? product.toObject({ virtuals: true }) : { ...product };
  if (!prodObj.sizeStock || prodObj.sizeStock.length === 0) {
    const sizes = prodObj.sizes && prodObj.sizes.length > 0 ? prodObj.sizes : ['Free Size'];
    const count = sizes.length;
    const total = Number(prodObj.stock) || 0;
    const base = Math.floor(total / count);
    const rem = total % count;
    prodObj.sizeStock = sizes.map((sz, idx) => ({
      size: sz,
      stock: base + (idx === 0 ? rem : 0)
    }));
  }
  return prodObj;
};

// @desc    Get product details by ID (PUBLIC — only active product & active category)
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found or unavailable' });
    }

    // Verify product belongs to an active category
    const activeCategory = await Category.findOne({
      name: { $regex: `^${product.category}$`, $options: 'i' },
      isActive: true
    });

    if (!activeCategory) {
      return res.status(404).json({ message: 'Product is currently unavailable as its category is inactive' });
    }

    const reviews = await Review.find({ productId: product._id })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    res.json({ product: formatProductWithSizeStock(product), reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new product (ADMIN only)
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const { name, description, category, price, discount, stock, sizes, sizeStock, colors, isActive } = req.body;

    // Validate required fields explicitly
    if (!name || !description || !category || !price) {
      return res.status(400).json({ message: 'name, description, category, and price are required.' });
    }

    // Handle multiple uploaded images — upload to Cloudinary (Vercel-safe)
    const imagePaths = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, 'evaas/products');
        imagePaths.push(url);
      }
    }

    // Parse sizeStock if provided
    let parsedSizeStock = [];
    if (sizeStock) {
      try {
        parsedSizeStock = typeof sizeStock === 'string' ? JSON.parse(sizeStock) : sizeStock;
      } catch {
        parsedSizeStock = [];
      }
    }

    let parsedSizes = [];
    let calculatedStock = 0;

    if (Array.isArray(parsedSizeStock) && parsedSizeStock.length > 0) {
      parsedSizeStock = parsedSizeStock.map(item => ({
        size: String(item.size).trim(),
        stock: Math.max(0, Number(item.stock) || 0)
      }));
      parsedSizes = parsedSizeStock.map(item => item.size);
      calculatedStock = parsedSizeStock.reduce((acc, curr) => acc + curr.stock, 0);
    } else {
      // Fallback if sizeStock was not sent directly
      parsedSizes = ['S', 'M', 'L', 'XL', 'XXL'];
      if (sizes) {
        try {
          parsedSizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
        } catch {
          parsedSizes = sizes.split(',').map(s => s.trim());
        }
      }
      calculatedStock = stock !== undefined ? Math.max(0, Number(stock) || 0) : 0;
      const count = parsedSizes.length || 1;
      const base = Math.floor(calculatedStock / count);
      const rem = calculatedStock % count;
      parsedSizeStock = parsedSizes.map((s, idx) => ({
        size: s,
        stock: base + (idx === 0 ? rem : 0)
      }));
    }

    // Parse colors
    let parsedColors = [];
    if (colors) {
      try {
        parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
      } catch {
        parsedColors = colors.split(',').map(c => c.trim()).filter(Boolean);
      }
    }

    const product = new Product({
      name,
      description,
      category,
      price: Number(price),
      discount: discount !== undefined ? Number(discount) : 0,
      stock: calculatedStock,
      sizes: parsedSizes,
      sizeStock: parsedSizeStock,
      colors: parsedColors,
      images: imagePaths,
      isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
      averageRating: 0
    });

    const createdProduct = await product.save();
    res.status(201).json(formatProductWithSizeStock(createdProduct));
  } catch (error) {
    console.error('createProduct error:', error.message);
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(error.errors).map(e => e.message).join(', ') });
    }
    // Duplicate key (e.g. SKU collision)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'field';
      return res.status(409).json({ message: `Duplicate value for ${field}. Please try again.` });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product (ADMIN only)
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const { name, description, category, price, discount, stock, sizes, sizeStock, colors, keepImages, isActive } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.category = category || product.category;
    product.price = price !== undefined ? Number(price) : product.price;
    product.discount = discount !== undefined ? Number(discount) : product.discount;
    product.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : product.isActive;

    // Handle sizeStock updates
    let parsedSizeStock = null;
    if (sizeStock !== undefined) {
      try {
        parsedSizeStock = typeof sizeStock === 'string' ? JSON.parse(sizeStock) : sizeStock;
      } catch {
        parsedSizeStock = null;
      }
    }

    if (Array.isArray(parsedSizeStock)) {
      product.sizeStock = parsedSizeStock.map(item => ({
        size: String(item.size).trim(),
        stock: Math.max(0, Number(item.stock) || 0)
      }));
      product.sizes = product.sizeStock.map(s => s.size);
      product.stock = product.sizeStock.reduce((acc, s) => acc + s.stock, 0);
    } else {
      if (sizes) {
        try {
          product.sizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
        } catch {
          product.sizes = sizes.split(',').map(s => s.trim());
        }
      }
      if (stock !== undefined) {
        product.stock = Number(stock);
        // Sync sizeStock
        const count = product.sizes.length || 1;
        const total = product.stock;
        const base = Math.floor(total / count);
        const rem = total % count;
        product.sizeStock = product.sizes.map((s, idx) => ({
          size: s,
          stock: base + (idx === 0 ? rem : 0)
        }));
      }
    }

    if (colors) {
      try {
        product.colors = typeof colors === 'string' ? JSON.parse(colors) : colors;
      } catch {
        product.colors = colors.split(',').map(c => c.trim()).filter(Boolean);
      }
    }

    // Process new images — upload to Cloudinary (Vercel-safe)
    let newImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, 'evaas/products');
        newImages.push(url);
      }
    }

    // Merge with kept images
    let oldImages = [];
    if (keepImages) {
      try {
        oldImages = typeof keepImages === 'string' ? JSON.parse(keepImages) : keepImages;
      } catch {
        oldImages = Array.isArray(keepImages) ? keepImages : [keepImages];
      }
    } else if (!req.files || req.files.length === 0) {
      oldImages = product.images;
    }

    product.images = [...oldImages, ...newImages];

    const updatedProduct = await product.save();
    res.json(formatProductWithSizeStock(updatedProduct));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product (ADMIN only)
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Review.deleteMany({ productId: product._id });
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
