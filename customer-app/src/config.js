/**
 * Centralized configuration for the customer app.
 * 
 * In production (Vercel), uses VITE_API_URL or defaults to https://evaas-server.vercel.app.
 * Locally in dev mode, defaults to http://localhost:5000.
 */

export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://evaas-server.vercel.app' : 'http://localhost:5000');
export const API_BASE = `${API_URL}/api`;
