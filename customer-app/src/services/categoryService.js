import api from './api';

/**
 * Category Service for Customer App
 * Fetches only active categories dynamically from backend
 */
export const getActiveCategories = async () => {
  try {
    const { data } = await api.get('/categories', { params: { activeOnly: 'true' } });
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Failed to fetch active categories:', error);
    return [];
  }
};
