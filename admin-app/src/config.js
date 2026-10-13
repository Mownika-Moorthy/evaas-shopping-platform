/**
 * Centralized configuration for the admin app.
 * 
 * In production (Vercel), uses VITE_API_URL or defaults to https://evaas-server.vercel.app.
 * Locally in dev mode, defaults to http://localhost:5000.
 */

export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://evaas-server.vercel.app' : 'http://localhost:5000');
export const API_BASE = `${API_URL}/api`;

/**
 * Resolves an image URL safely.
 * Returns external/Cloudinary URLs (http/https) directly as-is,
 * or prepends the API_URL for relative legacy uploads (/uploads/...).
 */
export const getImageUrl = (imagePath, fallback = '') => {
  if (!imagePath || typeof imagePath !== 'string') return fallback;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};
