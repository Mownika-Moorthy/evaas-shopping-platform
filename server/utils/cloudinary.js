/**
 * cloudinary.js — Cloudinary upload helper
 *
 * Uploads an image buffer directly to Cloudinary and returns the secure URL.
 * This is used instead of writing files to disk (Vercel's filesystem is read-only).
 *
 * Required env vars:
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer - The image file buffer from multer memoryStorage
 * @param {string} folder - The Cloudinary folder to upload into (e.g. 'evaas/products')
 * @returns {Promise<string>} The secure HTTPS URL of the uploaded image
 */
export const uploadToCloudinary = (buffer, folder = 'evaas/uploads') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

/**
 * Delete an image from Cloudinary by its public_id.
 * Extracts the public_id from a full Cloudinary URL.
 * @param {string} imageUrl - Full Cloudinary secure URL
 */
export const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) return;
    // Extract public_id: everything after /upload/vXXXXX/ up to (but not including) file extension
    const parts = imageUrl.split('/upload/');
    if (parts.length < 2) return;
    const withVersion = parts[1]; // e.g. "v1234567/evaas/products/filename.jpg"
    const withoutVersion = withVersion.replace(/^v\d+\//, ''); // remove version prefix
    const publicId = withoutVersion.replace(/\.[^/.]+$/, ''); // remove extension
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};
