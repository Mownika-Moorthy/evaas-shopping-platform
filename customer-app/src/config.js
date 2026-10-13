/**
 * Centralized configuration for the customer app.
 * 
 * In production (Vercel), set the VITE_API_URL environment variable
 * to your backend URL (e.g. https://evaas-server.vercel.app).
 * Locally it defaults to http://localhost:5000.
 */

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const API_BASE = `${API_URL}/api`;
