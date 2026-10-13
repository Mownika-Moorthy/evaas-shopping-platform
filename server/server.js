/**
 * server.js — EVAAS Women's Wear Backend
 *
 * IMPORTANT: dotenv MUST load before any other module that reads process.env.
 * In ESM, top-level `import` statements are hoisted before code runs, so we
 * use `dotenv/config` as the very first import to guarantee env is populated
 * before any other module (including razorpay.js) initialises.
 */
import 'dotenv/config';   // ← MUST be first: loads .env before all other imports

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import User from './models/User.js';

// ── Route Imports (after dotenv/config so env is available) ─────────────────
import authRoutes     from './routes/authRoutes.js';
import productRoutes  from './routes/productRoutes.js';
import cartRoutes     from './routes/cartRoutes.js';
import orderRoutes    from './routes/orderRoutes.js';
import adminRoutes    from './routes/adminRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import paymentRoutes  from './routes/paymentRoutes.js';
import festivalRoutes from './routes/festivalRoutes.js';

// Connect to Database
connectDB();

// Auto-create admin account if it doesn't exist
const ensureAdminExists = async () => {
  try {
    const exists = await User.findOne({ email: 'mownikamoorthy@gmail.com' });
    if (!exists) {
      await User.create({
        name: 'Mownika Admin',
        email: 'mownikamoorthy@gmail.com',
        phone: '9999988888',
        password: 'Mownika@06',
        address: 'Evaas HQ, Bangalore, India',
        role: 'admin'
      });
      console.log('✅ Admin account created: mownikamoorthy@gmail.com');
    }
  } catch (err) {
    console.error('Admin seed error:', err.message);
  }
};

mongoose.connection.on('connected', () => {
  ensureAdminExists();
});

const app = express();

// ── Security Middleware ────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// ── Rate Limiting ──────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,  // increased for general API usage
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/auth/'), // skip for auth routes (have their own limiter)
  message: { message: 'Too many requests. Please try again later.' }
});
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: 'Too many payment requests. Please slow down.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,  // increased from 30 to 50 login attempts per 15 min
  message: { message: 'Too many login attempts. Please try again later.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);  // applies to all auth routes (login, otp, resend)
app.use('/api/payment/', paymentLimiter);

// ── Raw Body Capture for Razorpay Webhook (MUST be before express.json) ───────
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body;
  try {
    req.body = JSON.parse(req.body.toString('utf8'));
  } catch {
    req.body = {};
  }
  next();
});

// ── Body Parsers ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static Files (local dev only) ─────────────────────────────────────────────
// Vercel's filesystem is read-only; uploads go to Cloudinary in production.
// Only attempt to serve local /uploads when running outside of Vercel.
if (!process.env.VERCEL) {
  const __dirname = path.resolve();
  const uploadDir = path.join(__dirname, 'uploads', 'products');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// ── Route Registrations ────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/cart',       cartRoutes);
app.use('/api/orders',     orderRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/payment',    paymentRoutes);
app.use('/api/festival',   festivalRoutes);

// ── Root Route ─────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Evaas Womenswear API is running successfully!'
  });
});

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: "Evaas Women's Wear backend is operational!",
    razorpayMode: process.env.RAZORPAY_KEY_ID?.includes('mock') ? 'MOCK' : 'LIVE/TEST'
  });
});

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route Not Found - ${req.originalUrl}` });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`💳 Razorpay: ${process.env.RAZORPAY_KEY_ID?.includes('mock') ? '⚠️  MOCK MODE' : '✅ TEST/LIVE — ' + process.env.RAZORPAY_KEY_ID}`);
});