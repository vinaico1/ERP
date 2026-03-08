import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../api';
import { formatCurrency } from '../utils/format';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const StatCard = ({ title, value, sub, icon, color = 'blue', link }) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red:    'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  const card = (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{title}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${colors[color]}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
  return link ? <Link to={link}>{card}</Link> : card;
};

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      reportsAPI.dashboard(),
      reportsAPI.salesByPeriod({ year: new Date().getFullYear() })
    ]).then(([dashRes, salesRes]) => {
      setData(dashRes.data.data);
      const sales = salesRes.data.data.map((s, i) => ({ month: MONTHS[i], total: s.total, count: s.count }));
      setSalesData(sales);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visão geral do negócio</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Vendas este mês" value={formatCurrency(data.salesMonth.total)} sub={`${data.salesMonth.count} pedidos`} icon="💰" color="green" link="/sales" />
        <StatCard title="Compras este mês" value={formatCurrency(data.purchasesMonth.total)} sub={`${data.purchasesMonth.count} pedidos`} icon="🛍️" color="blue" link="/purchases" />
        <StatCard title="A Receber" value={formatCurrency(data.financial.pendingReceivables)} sub={`${data.financial.pendingReceivablesCount} títulos`} icon="📥" color="yellow" link="/financial/receivables" />
        <StatCard title="A Pagar" value={formatCurrency(data.financial.pendingPayables)} sub={`${data.financial.pendingPayablesCount} títulos`} icon="📤" color="red" link="/financial/payables" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Clientes" value={data.masterData.customers} icon="👥" color="purple" link="/customers" />
        <StatCard title="Fornecedores" value={data.masterData.suppliers} icon="🏭" color="blue" link="/suppliers" />
        <StatCard title="Produtos" value={data.masterData.products} icon="📦" color="orange" link="/products" />
        <StatCard title="Estoque Crítico" value={data.alerts.lowStockCount} sub="itens abaixo do mínimo" icon="⚠️" color="red" link="/inventory" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-700">Vendas por Mês ({new Date().getFullYear()})</h3>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={salesData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0070F2" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0070F2" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Area type="monotone" dataKey="total" stroke="#0070F2" strokeWidth={2} fill="url(#colorTotal)" name="Vendas" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-gray-700">Fluxo de Caixa (Mês Atual)</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="text-xs text-gray-500">Receitas</div>
                <div className="text-lg font-bold text-green-700">{formatCurrency(data.financial.monthIncome)}</div>
              </div>
              <div className="text-2xl">📈</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <div className="text-xs text-gray-500">Despesas</div>
                <div className="text-lg font-bold text-red-700">{formatCurrency(data.financial.monthExpense)}</div>
              </div>
              <div className="text-2xl">📉</div>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-lg ${data.financial.cashFlowBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
              <div>
                <div className="text-xs text-gray-500">Saldo</div>
                <div className={`text-lg font-bold ${data.financial.cashFlowBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  {formatCurrency(data.financial.cashFlowBalance)}
                </div>
              </div>
              <div className="text-2xl">💱</div>
            </div>

            {data.alerts.openServiceOrders > 0 && (
              <Link to="/service-orders" className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100">
                <div>
                  <div className="text-xs text-gray-500">Ordens de Serviço Abertas</div>
                  <div className="text-lg font-bold text-yellow-700">{data.alerts.openServiceOrders}</div>
                </div>
                <div className="text-2xl">🔩</div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.lowStockCount > 0 && (
        <div className="card border-l-4 border-l-orange-400">
          <div className="p-4 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-medium text-gray-800">Alerta de Estoque Baixo</div>
              <div className="text-sm text-gray-500">
                {data.alerts.lowStockCount} produto(s) abaixo do estoque mínimo.{' '}
                <Link to="/inventory" className="text-primary-600 hover:underline">Ver estoque →</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
