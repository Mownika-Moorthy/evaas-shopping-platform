import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// Default categories to seed on first run
const DEFAULT_CATEGORIES = [
  { name: 'Sarees', description: 'Traditional Indian Sarees' },
  { name: 'Kurtis', description: 'Stylish Kurtis and Kurtas' },
  { name: 'Salwars', description: 'Salwar Kameez Sets' },
  { name: 'Tops', description: 'Casual and Party Tops' },
  { name: 'Leggings', description: 'Comfortable Leggings and Churidars' },
  { name: 'Nightwear', description: 'Comfortable Night Suits and Sleepwear' },
  { name: 'Ethnic Wear', description: 'Ethnic and Traditional Wear' },
  { name: 'Western Wear', description: 'Modern Western Outfits' }
];

// @desc    Get all categories (Public + Admin)
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    // Seed default categories if collection is empty
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(DEFAULT_CATEGORIES);
    }

    const { activeOnly } = req.query;
    const query = activeOnly === 'true' ? { isActive: true } : {};
    const categories = await Category.find(query).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single category by ID
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new category
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    // Check for duplicate
    const existing = await Category.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (existing) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }

    // Handle optional uploaded image — upload to Cloudinary (Vercel-safe)
    let imagePath = '';
    if (req.file) {
      imagePath = await uploadToCloudinary(req.file.buffer, 'evaas/categories');
    }

    const category = new Category({
      name: name.trim(),
      description: description || '',
      image: imagePath,
      isActive: true
    });

    const created = await category.save();
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a category
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check for duplicate name (excluding self)
    if (name && name.trim() !== category.name) {
      const existing = await Category.findOne({
        name: { $regex: `^${name.trim()}$`, $options: 'i' },
        _id: { $ne: req.params.id }
      });
      if (existing) {
        return res.status(400).json({ message: 'A category with this name already exists' });
      }
    }

    category.name = name ? name.trim() : category.name;
    category.description = description !== undefined ? description : category.description;
    category.isActive = isActive !== undefined ? isActive : category.isActive;

    if (req.file) {
      category.image = await uploadToCloudinary(req.file.buffer, 'evaas/categories');
    }

    const updated = await category.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if products exist in this category
    const productCount = await Product.countDocuments({ category: category.name });
    if (productCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${productCount} product(s) are using this category. Reassign them first.`
      });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
