import mongoose from 'mongoose';

/**
 * FestivalSale Model
 * Manages festival discount campaigns for Tamil Nadu & Indian festivals.
 * Supports percentage or fixed-amount discounts applied to all products,
 * specific categories, or selected individual products.
 */
const festivalSaleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
      // e.g. "Diwali Sale 2024", "Pongal Offer", "Aadi Festival"
    },
    festival: {
      type: String,
      required: true,
      trim: true
      // e.g. "Diwali", "Pongal", "Aadi", "Tamil New Year", "Navaratri", "Christmas", "Custom"
    },
    description: {
      type: String,
      default: ''
    },
    // ── Discount Configuration ────────────────────────────────────────────────
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
      // If percentage: 0–100, if fixed: amount in INR
    },
    maxDiscountAmount: {
      // Cap for percentage discounts (optional). 0 = no cap
      type: Number,
      default: 0,
      min: 0
    },
    minOrderAmount: {
      // Minimum cart value to apply discount (optional)
      type: Number,
      default: 0,
      min: 0
    },
    // ── Sale Duration ─────────────────────────────────────────────────────────
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    // ── Product Scope ──────────────────────────────────────────────────────────
    applyTo: {
      type: String,
      enum: ['all', 'categories', 'products'],
      default: 'all'
    },
    targetCategories: {
      // Used when applyTo === 'categories'
      type: [String],
      default: []
    },
    targetProducts: {
      // Used when applyTo === 'products' — stores product IDs
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      default: []
    },
    // ── Theme / Visual ─────────────────────────────────────────────────────────
    theme: {
      primaryColor:    { type: String, default: '#9B59D6' },
      secondaryColor:  { type: String, default: '#4A7C59' },
      accentColor:     { type: String, default: '#FFD700' },
      bannerText:      { type: String, default: '' },
      bannerSubText:   { type: String, default: '' },
      emoji:           { type: String, default: '🎉' }
    },
    // ── Status ────────────────────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true // admin can manually deactivate
    }
  },
  { timestamps: true }
);

// Compound index to find currently active sales quickly
festivalSaleSchema.index({ startDate: 1, endDate: 1, isActive: 1 });

// Virtual: is the sale currently running?
festivalSaleSchema.virtual('isLive').get(function () {
  const now = new Date();
  return this.isActive && this.startDate <= now && this.endDate >= now;
});

const FestivalSale = mongoose.model('FestivalSale', festivalSaleSchema);
export default FestivalSale;
