
import express from 'express';
import multer from 'multer';
import path from 'path';

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';

import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Store uploaded files in memory instead of writing to local disk.
// Persistent image hosting must be configured in the controller.
const storage = multer.memoryStorage();

// Validate uploaded image types.
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

// Configure Multer.
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB per image
    files: 5
  },
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  }
});

// Product routes.
router.route('/')
  .get(getProducts)
  .post(protect, adminOnly, upload.array('images', 5), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, adminOnly, upload.array('images', 5), updateProduct)
  .delete(protect, adminOnly, deleteProduct);

export default router;
