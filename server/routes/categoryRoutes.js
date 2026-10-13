
import express from 'express';
import multer from 'multer';
import path from 'path';

import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';

import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Use memory storage instead of creating folders on Vercel.
const storage = multer.memoryStorage();

const checkFileType = (file, cb) => {
  const allowedExtensions = /\.(jpg|jpeg|png|webp)$/i;
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  const extensionValid = allowedExtensions.test(
    path.extname(file.originalname)
  );

  const mimeTypeValid = allowedMimeTypes.includes(file.mimetype);

  if (extensionValid && mimeTypeValid) {
    return cb(null, true);
  }

  cb(new Error('Images only (jpg, jpeg, png, webp)!'));
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  }
});

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin routes
router.post(
  '/',
  protect,
  adminOnly,
  upload.single('image'),
  createCategory
);

router.put(
  '/:id',
  protect,
  adminOnly,
  upload.single('image'),
  updateCategory
);

router.delete('/:id', protect, adminOnly, deleteCategory);

export default router;
