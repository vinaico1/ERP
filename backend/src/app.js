const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const customerRoutes = require('./modules/customers/customers.routes');
const supplierRoutes = require('./modules/suppliers/suppliers.routes');
const productRoutes = require('./modules/products/products.routes');
const serviceRoutes = require('./modules/services/services.routes');
const serviceOrderRoutes = require('./modules/services/service-orders.routes');
const employeeRoutes = require('./modules/employees/employees.routes');
const salesRoutes = require('./modules/sales/sales.routes');
const purchaseRoutes = require('./modules/purchases/purchases.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const financialRoutes = require('./modules/financial/financial.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const nfeRoutes = require('./modules/nfe/nfe.routes');
const pdvRoutes = require('./modules/pdv/pdv.routes');

const app = express();

app.use(helmet());

// Aceita múltiplas origens separadas por vírgula em cada variável (ex: domínio
// de produção + previews do Vercel), além dos defaults de desenvolvimento.
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  process.env.PDV_URL || 'http://localhost:5174',
  ...(process.env.EXTRA_ALLOWED_ORIGINS ? process.env.EXTRA_ALLOWED_ORIGINS.split(',').map(o => o.trim()) : [])
].flatMap(o => o.split(',').map(s => s.trim())).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0', system: 'ERP Corporativo' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/service-orders', serviceOrderRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/nfe', nfeRoutes);
app.use('/api/pdv', pdvRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Rota ${req.method} ${req.path} não encontrada` });
});

app.use(errorHandler);

module.exports = app;
