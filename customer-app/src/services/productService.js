import api from './api';

export const getProducts = async (params = {}) => {
  const { data } = await api.get('/products', { params });
  return data;
};

export const getProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

export const submitProductReview = async (id, reviewData) => {
  const { data } = await api.post(`/orders/${id}/review`, reviewData);
  return data;
};
