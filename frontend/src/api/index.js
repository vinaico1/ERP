import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Request: inject token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('erp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response: handle token expiry
api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    if (err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED' && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('erp_refresh_token');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        localStorage.setItem('erp_token', data.data.token);
        localStorage.setItem('erp_refresh_token', data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.token}`;
        return api(original);
      } catch {
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

// ---- Auth ----
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.put('/auth/change-password', data)
};

// ---- Customers ----
export const customersAPI = {
  list: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  export: (format = 'excel') => api.get('/customers/export', { params: { format }, responseType: 'blob' })
};

// ---- Suppliers ----
export const suppliersAPI = {
  list: (params) => api.get('/suppliers', { params }),
  get: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  export: (format = 'excel') => api.get('/suppliers/export', { params: { format }, responseType: 'blob' })
};

// ---- Products ----
export const productsAPI = {
  list: (params) => api.get('/products', { params }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  lowStock: () => api.get('/products/low-stock'),
  categories: () => api.get('/products/categories'),
  createCategory: (data) => api.post('/products/categories', data),
  export: (format = 'excel') => api.get('/products/export', { params: { format }, responseType: 'blob' })
};

// ---- Services ----
export const servicesAPI = {
  list: (params) => api.get('/services', { params }),
  get: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  delete: (id) => api.delete(`/services/${id}`)
};

// ---- Employees ----
export const employeesAPI = {
  list: (params) => api.get('/employees', { params }),
  get: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`)
};

// ---- Sales ----
export const salesAPI = {
  list: (params) => api.get('/sales', { params }),
  get: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  updateStatus: (id, status) => api.patch(`/sales/${id}/status`, { status }),
  cancel: (id) => api.delete(`/sales/${id}`),
  export: (format = 'excel') => api.get('/sales/export', { params: { format }, responseType: 'blob' })
};

// ---- Purchases ----
export const purchasesAPI = {
  list: (params) => api.get('/purchases', { params }),
  get: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  updateStatus: (id, status) => api.patch(`/purchases/${id}/status`, { status }),
  receiveItems: (id, data) => api.patch(`/purchases/${id}/receive`, data),
  cancel: (id) => api.delete(`/purchases/${id}`)
};

// ---- Inventory ----
export const inventoryAPI = {
  list: (params) => api.get('/inventory', { params }),
  movements: (params) => api.get('/inventory/movements', { params }),
  lowStock: () => api.get('/inventory/low-stock'),
  adjustment: (data) => api.post('/inventory/adjustment', data),
  registerMovement: (data) => api.post('/inventory/movement', data)
};

// ---- Financial ----
export const financialAPI = {
  categories: (params) => api.get('/financial/categories', { params }),
  createCategory: (data) => api.post('/financial/categories', data),
  costCenters: () => api.get('/financial/cost-centers'),
  createCostCenter: (data) => api.post('/financial/cost-centers', data),
  payables: { list: (p) => api.get('/financial/payables', { params: p }), get: (id) => api.get(`/financial/payables/${id}`), create: (d) => api.post('/financial/payables', d), update: (id, d) => api.put(`/financial/payables/${id}`, d), pay: (id, d) => api.patch(`/financial/payables/${id}/pay`, d) },
  receivables: { list: (p) => api.get('/financial/receivables', { params: p }), get: (id) => api.get(`/financial/receivables/${id}`), create: (d) => api.post('/financial/receivables', d), update: (id, d) => api.put(`/financial/receivables/${id}`, d), receive: (id, d) => api.patch(`/financial/receivables/${id}/receive`, d) },
  cashflow: { list: (p) => api.get('/financial/cashflow', { params: p }), create: (d) => api.post('/financial/cashflow', d), summary: (p) => api.get('/financial/cashflow/summary', { params: p }) }
};

// ---- Service Orders ----
export const serviceOrdersAPI = {
  list: (params) => api.get('/service-orders', { params }),
  get: (id) => api.get(`/service-orders/${id}`),
  create: (data) => api.post('/service-orders', data),
  update: (id, data) => api.put(`/service-orders/${id}`, data),
  updateStatus: (id, status) => api.patch(`/service-orders/${id}/status`, { status }),
  cancel: (id) => api.delete(`/service-orders/${id}`)
};

// ---- Reports ----
export const reportsAPI = {
  dashboard: () => api.get('/reports/dashboard'),
  salesByPeriod: (params) => api.get('/reports/sales-by-period', { params }),
  salesByCustomer: (params) => api.get('/reports/sales-by-customer', { params }),
  inventorySummary: () => api.get('/reports/inventory-summary'),
  financialSummary: (params) => api.get('/reports/financial-summary', { params }),
  topProducts: (params) => api.get('/reports/top-products', { params }),
  overdue: () => api.get('/reports/overdue')
};

// ---- Admin ----
export const adminAPI = {
  roles: { list: () => api.get('/admin/roles'), create: (d) => api.post('/admin/roles', d), update: (id, d) => api.put(`/admin/roles/${id}`, d), delete: (id) => api.delete(`/admin/roles/${id}`) },
  auditLogs: (params) => api.get('/admin/audit-logs', { params }),
  stats: () => api.get('/admin/stats')
};

export const usersAPI = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};
