import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const calculateCartTotal = async (items) => {
  let total = 0;
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (product && product.isActive) {
      total += product.price * item.quantity;
    }
  }
  return total;
};

const getAvailableStockForSize = (product, size) => {
  if (!product) return 0;
  if (product.sizeStock && product.sizeStock.length > 0 && size) {
    const found = product.sizeStock.find(s => s.size.toLowerCase() === size.trim().toLowerCase());
    if (found) return found.stock;
  }
  return product.stock || 0;
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id })
      .populate('items.productId', 'name price images category stock sizeStock isActive');

    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [], totalPrice: 0 });
    }

    // Filter out items whose product or category is inactive
    const activeCategories = await Category.find({ isActive: true }).select('name');
    const activeCategoryNames = new Set(activeCategories.map(c => c.name.toLowerCase()));

    const validItems = cart.items.filter(item => {
      if (!item.productId || !item.productId.isActive) return false;
      const cat = (item.productId.category || '').toLowerCase();
      return activeCategoryNames.has(cat);
    });

    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      cart.totalPrice = await calculateCartTotal(validItems);
      await cart.save();
    }

    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req, res) => {
  const { productId, quantity, size } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found or unavailable' });
    }

    // Verify category is active
    const activeCategory = await Category.findOne({
      name: { $regex: `^${product.category}$`, $options: 'i' },
      isActive: true
    });

    if (!activeCategory) {
      return res.status(400).json({ message: 'Cannot add to cart: this product category is currently inactive' });
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [], totalPrice: 0 });
    }

    // Check size-specific stock
    const availableStock = getAvailableStockForSize(product, size);
    const existingIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId && item.size === size
    );
    const alreadyInCart = existingIndex > -1 ? cart.items[existingIndex].quantity : 0;
    const requestedTotal = alreadyInCart + Number(quantity);

    if (availableStock < requestedTotal) {
      const leftToAdd = Math.max(0, availableStock - alreadyInCart);
      return res.status(400).json({
        message: leftToAdd > 0
          ? `Only ${availableStock} items in stock for size ${size} (${alreadyInCart} already in cart). You can add at most ${leftToAdd} more.`
          : `Insufficient stock for size ${size}. Only ${availableStock} unit(s) available.`
      });
    }

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += Number(quantity);
    } else {
      cart.items.push({ productId, quantity: Number(quantity), size });
    }

    cart.totalPrice = await calculateCartTotal(cart.items);
    await cart.save();

    // Populate product details for response
    const populatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name price images category stock sizeStock isActive');

    res.status(200).json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart
// @access  Private
export const updateCartQuantity = async (req, res) => {
  const { productId, size, quantity } = req.body;

  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId && item.size === size
    );

    if (itemIndex > -1) {
      const product = await Product.findById(productId);
      const availableStock = getAvailableStockForSize(product, size);

      if (availableStock < quantity) {
        return res.status(400).json({
          message: `Only ${availableStock} items left in stock for size ${size}`
        });
      }

      cart.items[itemIndex].quantity = Number(quantity);
      cart.totalPrice = await calculateCartTotal(cart.items);
      await cart.save();

      const populatedCart = await Cart.findById(cart._id)
        .populate('items.productId', 'name price images category stock sizeStock isActive');

      return res.json(populatedCart);
    } else {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart
// @access  Private
export const removeFromCart = async (req, res) => {
  const { productId, size } = req.query; // pass via query string or body

  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      (item) => !(item.productId.toString() === productId && item.size === size)
    );

    cart.totalPrice = await calculateCartTotal(cart.items);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.productId', 'name price images category stock sizeStock isActive');

    res.json(populatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = [];
      cart.totalPrice = 0;
      await cart.save();
    }
    res.json({ message: 'Cart cleared successfully', cart });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
