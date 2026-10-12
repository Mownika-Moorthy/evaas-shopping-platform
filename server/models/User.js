import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  password: {
    type: String,
    default: null   // null for Google-authenticated users
  },
  address: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  googleId: {
    type: String,
    default: null
  },
  avatar: {
    type: String,
    default: null   // Google profile picture URL
  },
  otp: {
    type: String,
    default: null
  },
  otpExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving (skip for Google users who have null password)
userSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false; // Google-only accounts have no password
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
