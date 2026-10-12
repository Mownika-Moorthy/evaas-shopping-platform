import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Calculate average rating after save
reviewSchema.post('save', async function() {
  const Review = this.constructor;
  const Product = mongoose.model('Product');
  
  const stats = await Review.aggregate([
    { $match: { productId: this.productId } },
    { $group: { _id: '$productId', avgRating: { $avg: '$rating' } } }
  ]);
  
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.productId, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10
    });
  }
});

// Calculate average rating after delete
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    const Review = mongoose.model('Review');
    const Product = mongoose.model('Product');
    
    const stats = await Review.aggregate([
      { $match: { productId: doc.productId } },
      { $group: { _id: '$productId', avgRating: { $avg: '$rating' } } }
    ]);
    
    const newRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    await Product.findByIdAndUpdate(doc.productId, {
      averageRating: newRating
    });
  }
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
