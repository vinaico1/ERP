import axios from 'axios'

// Em produção o PDV é um projeto Vercel separado do backend, então precisa da
// URL absoluta da API (VITE_API_URL). Em dev local mantém '/api' (proxy do Vite).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 15000
})

// Injeta token em todas as requisições
api.interceptors.request.use(config => {
  const token = localStorage.getItem('pdv_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Trata erros globalmente
api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      // Tenta refresh token
      const refresh = localStorage.getItem('pdv_refresh')
      if (refresh) {
        try {
          const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: refresh })
          localStorage.setItem('pdv_token', data.data.token)
          localStorage.setItem('pdv_refresh', data.data.refreshToken)
          err.config.headers.Authorization = `Bearer ${data.data.accessToken}`
          return api.request(err.config)
        } catch {
          localStorage.removeItem('pdv_token')
          localStorage.removeItem('pdv_refresh')
          window.location.reload()
        }
      }
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout')
}

// ── PDV (endpoints dedicados — sem limite de paginação) ────────
export const pdvAPI = {
  products:   (params) => api.get('/pdv/products', { params }),
  categories: ()       => api.get('/pdv/categories'),
  stock:      (id)     => api.get(`/pdv/stock/${id}`),
  caixa:      (date)   => api.get('/pdv/caixa', { params: date ? { date } : {} })
}

// ── Produtos (ERP genérico — mantido para compatibilidade) ─────
export const productsAPI = {
  list:   (params) => api.get('/products', { params }),
  search: (q)      => api.get('/products', { params: { search: q, active: true, limit: 50 } })
}

// ── Clientes ──────────────────────────────────────────────────
export const customersAPI = {
  list: (params) => api.get('/customers', { params }),
  search: (q) => api.get('/customers', { params: { search: q, active: true, limit: 20 } }),
  getOne: (id) => api.get(`/customers/${id}`)
}

// ── Vendas ────────────────────────────────────────────────────
export const salesAPI = {
  create: (data) => api.post('/sales', data),
  updateStatus: (id, status) => api.patch(`/sales/${id}/status`, { status }),
  getOne: (id) => api.get(`/sales/${id}`)
}

// ── NF-e ──────────────────────────────────────────────────────
export const nfeAPI = {
  config: () => api.get('/nfe/config'),
  emitir: (orderId, paymentMethod) => api.post('/nfe/emitir', { orderId, paymentMethod }),
  consultar: (id) => api.get(`/nfe/${id}`),
  listarPorPedido: (orderId) => api.get(`/nfe/order/${orderId}`),
  cancelar: (id, justificativa) => api.post(`/nfe/${id}/cancelar`, { justificativa })
}

export default api
