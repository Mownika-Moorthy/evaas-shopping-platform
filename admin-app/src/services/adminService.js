import api from './api';

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getEnhancedDashboard = async () => {
  const { data } = await api.get('/admin/dashboard');
  return data;
};

// ── Admin Products (all including inactive) ───────────────────────────────────
export const getAdminProducts = async (params = {}) => {
  const { data } = await api.get('/admin/products', { params });
  return data;
};

// ── Categories ─────────────────────────────────────────────────────────────────
export const getCategories = async (activeOnly = false) => {
  const { data } = await api.get('/categories', { params: activeOnly ? { activeOnly: 'true' } : {} });
  return data;
};

export const createCategory = async (formData) => {
  const { data } = await api.post('/categories', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const updateCategory = async (id, formData) => {
  const { data } = await api.put(`/categories/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const deleteCategory = async (id) => {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
};

// ── Inventory ──────────────────────────────────────────────────────────────────
export const getInventory = async (params = {}) => {
  const { data } = await api.get('/admin/inventory', { params });
  return data;
};

export const updateInventoryStock = async (id, payload) => {
  const body = typeof payload === 'object' && payload !== null ? payload : { stock: payload };
  const { data } = await api.put(`/admin/inventory/${id}`, body);
  return data;
};

// ── Sales Reports ──────────────────────────────────────────────────────────────
export const getSalesReport = async (params = {}) => {
  const { data } = await api.get('/admin/reports', { params });
  return data;
};

export const exportReportPDF = (params = {}) => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  const query = new URLSearchParams(params).toString();
  const url = `http://localhost:5000/api/admin/reports/export/pdf?${query}`;
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `EVAAS_SalesReport_${params.period || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    })
    .catch(err => console.error('Export PDF error:', err));
};

export const exportReportExcel = (params = {}) => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token');
  const query = new URLSearchParams(params).toString();
  const url = `http://localhost:5000/api/admin/reports/export/excel?${query}`;
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.blob())
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `EVAAS_SalesReport_${params.period || 'report'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    })
    .catch(err => console.error('Export Excel error:', err));
};

// ── Analytics ──────────────────────────────────────────────────────────────────
export const getTopSellingProducts = async (limit = 10) => {
  const { data } = await api.get('/admin/analytics/top-selling', { params: { limit } });
  return data;
};

export const getLeastSellingProducts = async (limit = 10) => {
  const { data } = await api.get('/admin/analytics/least-selling', { params: { limit } });
  return data;
};

export const getLowStockAlerts = async (threshold = 10) => {
  const { data } = await api.get('/admin/analytics/low-stock', { params: { threshold } });
  return data;
};

// ── Settings / Admin Profile ───────────────────────────────────────────────────
export const updateAdminProfile = async (profileData) => {
  const { data } = await api.put('/auth/profile', profileData);
  return data;
};

// ── Festival Sale Management ───────────────────────────────────────────────────
export const getAllFestivalSales = async (params = {}) => {
  const { data } = await api.get('/festival', { params });
  return data;
};

export const createFestivalSale = async (payload) => {
  const { data } = await api.post('/festival', payload);
  return data;
};

export const updateFestivalSale = async (id, payload) => {
  const { data } = await api.put(`/festival/${id}`, payload);
  return data;
};

export const deleteFestivalSale = async (id) => {
  const { data } = await api.delete(`/festival/${id}`);
  return data;
};

export const toggleFestivalSaleStatus = async (id) => {
  const { data } = await api.patch(`/festival/${id}/toggle`);
  return data;
};

