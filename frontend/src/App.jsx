import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomersList from './pages/customers/CustomersList';
import CustomerForm from './pages/customers/CustomerForm';
import SuppliersList from './pages/suppliers/SuppliersList';
import SupplierForm from './pages/suppliers/SupplierForm';
import ProductsList from './pages/products/ProductsList';
import ProductForm from './pages/products/ProductForm';
import ServicesList from './pages/services/ServicesList';
import ServiceForm from './pages/services/ServiceForm';
import EmployeesList from './pages/employees/EmployeesList';
import EmployeeForm from './pages/employees/EmployeeForm';
import SalesList from './pages/sales/SalesList';
import SaleForm from './pages/sales/SaleForm';
import SaleDetail from './pages/sales/SaleDetail';
import PurchasesList from './pages/purchases/PurchasesList';
import PurchaseForm from './pages/purchases/PurchaseForm';
import PurchaseDetail from './pages/purchases/PurchaseDetail';
import InventoryList from './pages/inventory/InventoryList';
import InventoryMovements from './pages/inventory/InventoryMovements';
import Payables from './pages/financial/Payables';
import Receivables from './pages/financial/Receivables';
import CashFlow from './pages/financial/CashFlow';
import ServiceOrdersList from './pages/services/ServiceOrdersList';
import ServiceOrderForm from './pages/services/ServiceOrderForm';
import AdminUsers from './pages/admin/AdminUsers';
import AdminRoles from './pages/admin/AdminRoles';
import AuditLogs from './pages/admin/AuditLogs';
import Reports from './pages/Reports';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="customers" element={<CustomersList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:id/edit" element={<CustomerForm />} />
        <Route path="suppliers" element={<SuppliersList />} />
        <Route path="suppliers/new" element={<SupplierForm />} />
        <Route path="suppliers/:id/edit" element={<SupplierForm />} />
        <Route path="products" element={<ProductsList />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="services" element={<ServicesList />} />
        <Route path="services/new" element={<ServiceForm />} />
        <Route path="services/:id/edit" element={<ServiceForm />} />
        <Route path="employees" element={<EmployeesList />} />
        <Route path="employees/new" element={<EmployeeForm />} />
        <Route path="employees/:id/edit" element={<EmployeeForm />} />
        <Route path="sales" element={<SalesList />} />
        <Route path="sales/new" element={<SaleForm />} />
        <Route path="sales/:id" element={<SaleDetail />} />
        <Route path="sales/:id/edit" element={<SaleForm />} />
        <Route path="purchases" element={<PurchasesList />} />
        <Route path="purchases/new" element={<PurchaseForm />} />
        <Route path="purchases/:id" element={<PurchaseDetail />} />
        <Route path="purchases/:id/edit" element={<PurchaseForm />} />
        <Route path="inventory" element={<InventoryList />} />
        <Route path="inventory/movements" element={<InventoryMovements />} />
        <Route path="financial/payables" element={<Payables />} />
        <Route path="financial/receivables" element={<Receivables />} />
        <Route path="financial/cashflow" element={<CashFlow />} />
        <Route path="service-orders" element={<ServiceOrdersList />} />
        <Route path="service-orders/new" element={<ServiceOrderForm />} />
        <Route path="service-orders/:id/edit" element={<ServiceOrderForm />} />
        <Route path="reports" element={<Reports />} />
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="admin/roles" element={<AdminRoles />} />
        <Route path="admin/audit" element={<AuditLogs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
