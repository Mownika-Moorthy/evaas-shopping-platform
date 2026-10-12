import mongoose from 'mongoose';

/**
 * Category Model
 * Stores product categories managed by the admin.
 * Products reference category by name (string) for backward compatibility.
 */
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', categorySchema);
export default Category;
