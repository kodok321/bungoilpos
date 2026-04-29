import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data) => api.put('/auth/change-password', data),
  register: (data) => api.post('/auth/register', data),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getByBarcode: (barcode) => api.get(`/products/barcode/${barcode}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  adjustStock: (id, data) => api.put(`/products/${id}/stock`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getStockMovements: (id) => api.get(`/products/${id}/stock-movements`),
};

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  cancel: (id) => api.put(`/transactions/${id}/cancel`),
};

export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const workOrderAPI = {
  getAll: (params) => api.get('/work-orders', { params }),
  getById: (id) => api.get(`/work-orders/${id}`),
  create: (data) => api.post('/work-orders', data),
  update: (id, data) => api.put(`/work-orders/${id}`, data),
  updateStatus: (id, data) => api.put(`/work-orders/${id}/status`, data),
  completeAndPay: (id, data) => api.put(`/work-orders/${id}/complete-pay`, data),
};

export const reportAPI = {
  dashboard: () => api.get('/reports/dashboard'),
  sales: (params) => api.get('/reports/sales', { params }),
  profit: (params) => api.get('/reports/profit', { params }),
  stock: () => api.get('/reports/stock'),
};

export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

export const branchAPI = {
  getAll: () => api.get('/branches'),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data),
  delete: (id) => api.delete(`/branches/${id}`),
};

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const settingsAPI = {
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  uploadLogo: (formData) => api.post('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteLogo: () => api.delete('/settings/logo'),
};

export const exportImportAPI = {
  exportProductsExcel: () => api.get('/export-import/products/excel', { responseType: 'blob' }),
  exportProductsPdf: () => api.get('/export-import/products/pdf', { responseType: 'blob' }),
  importProducts: (formData) => api.post('/export-import/products/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  exportCategoriesExcel: () => api.get('/export-import/categories/excel', { responseType: 'blob' }),
  exportCategoriesPdf: () => api.get('/export-import/categories/pdf', { responseType: 'blob' }),
  importCategories: (formData) => api.post('/export-import/categories/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  exportWorkOrdersExcel: (params) => api.get('/export-import/work-orders/excel', { params, responseType: 'blob' }),
  exportWorkOrdersPdf: (params) => api.get('/export-import/work-orders/pdf', { params, responseType: 'blob' }),
  importWorkOrders: (formData) => api.post('/export-import/work-orders/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  downloadTemplate: (type) => api.get(`/export-import/template/${type}`, { responseType: 'blob' }),
};

export const backupAPI = {
  create: () => api.post('/backup'),
  download: () => api.get('/backup/download', { responseType: 'blob' }),
  list: () => api.get('/backup/list'),
  delete: (filename) => api.delete(`/backup/${filename}`),
};

export default api;
