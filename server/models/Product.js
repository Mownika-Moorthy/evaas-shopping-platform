import mongoose from 'mongoose';

/**
 * Product Model — Extended for EVAAS Admin Inventory Module
 * New fields: sku, discount, colors, isActive
 * Removed enum restriction on category to support dynamic Category collection
 * isActive controls customer-site visibility (admin sees all, customers see isActive:true only)
 */
const sizeStockSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      required: true,
      trim: true
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
      // Enum removed — validated against Category collection dynamically
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100 // percentage
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    sku: {
      type: String,
      unique: true,
      sparse: true // allows multiple docs without sku (backward compatibility)
    },
    sizes: {
      type: [String],
      default: ['S', 'M', 'L', 'XL', 'XXL']
    },
    sizeStock: {
      type: [sizeStockSchema],
      default: []
    },
    colors: {
      type: [String],
      default: []
    },
    images: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true // Active products appear on customer site
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    }
  },
  { timestamps: true }
);

// Virtual: discounted price
productSchema.virtual('discountedPrice').get(function () {
  if (this.discount > 0) {
    return parseFloat((this.price - (this.price * this.discount) / 100).toFixed(2));
  }
  return this.price;
});

// Pre-save hook: auto-generate SKU and sync sizeStock/sizes/stock
productSchema.pre('save', async function () {
  if (!this.sku) {
    const prefix = 'EVA';
    const catPrefix = (this.category || 'PROD').replace(/\s+/g, '').toUpperCase().substring(0, 4);
    const uniquePart = Date.now().toString(36).toUpperCase();
    this.sku = `${prefix}-${catPrefix}-${uniquePart}`;
  }

  // Ensure sizeStock and total stock consistency
  if (this.sizeStock && this.sizeStock.length > 0) {
    this.stock = this.sizeStock.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
    this.sizes = this.sizeStock.map(item => item.size);
  } else if (this.sizes && this.sizes.length > 0) {
    // If only sizes & total stock exist (e.g. legacy documents), initialize sizeStock
    const count = this.sizes.length;
    const total = Number(this.stock) || 0;
    const base = Math.floor(total / count);
    const remainder = total % count;
    this.sizeStock = this.sizes.map((s, idx) => ({
      size: s,
      stock: base + (idx === 0 ? remainder : 0)
    }));
  }
});

const Product = mongoose.model('Product', productSchema);
export default Product;
