import api from './api';

// Admin Dashboard APIs
export const getAdminOverview = async () => {
  const { data } = await api.get('/admin/overview');
  return data;
};

export const getAdminAnalytics = async () => {
  const { data } = await api.get('/admin/analytics');
  return data;
};

export const getAllOrdersAdmin = async (params = {}) => {
  const { data } = await api.get('/admin/orders', { params });
  return data;
};

export const updateOrderStatusAdmin = async (id, statusData) => {
  const { data } = await api.put(`/admin/orders/${id}/status`, statusData);
  return data;
};

export const getAllCustomersAdmin = async (params = {}) => {
  const { data } = await api.get('/admin/customers', { params });
  return data;
};

export const getCustomerOrdersAdmin = async (customerId) => {
  const { data } = await api.get(`/admin/customers/${customerId}/orders`);
  return data;
};

export const getAllReviewsAdmin = async () => {
  const { data } = await api.get('/admin/reviews');
  return data;
};

export const deleteReviewAdmin = async (id) => {
  const { data } = await api.delete(`/admin/reviews/${id}`);
  return data;
};
