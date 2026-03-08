import React, { useEffect, useState } from 'react';
import { reportsAPI } from '../api';
import { formatCurrency } from '../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import PageHeader from '../components/common/PageHeader';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const COLORS = ['#0070F2', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function Reports() {
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [financial, setFinancial] = useState(null);
  const [overdue, setOverdue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      reportsAPI.salesByPeriod({ year }),
      reportsAPI.topProducts({ limit: 5 }),
      reportsAPI.salesByCustomer({ limit: 5 }),
      reportsAPI.inventorySummary(),
      reportsAPI.financialSummary(),
      reportsAPI.overdue()
    ]).then(([salesRes, prodRes, custRes, invRes, finRes, overdueRes]) => {
      setSalesData(salesRes.data.data.map((s, i) => ({ month: MONTHS[i], total: s.total, count: s.count })));
      setTopProducts(prodRes.data.data);
      setTopCustomers(custRes.data.data);
      setInventory(invRes.data.data);
      setFinancial(finRes.data.data);
      setOverdue(overdueRes.data.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <div className="flex justify-center p-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios e Analytics" subtitle="Indicadores do negócio"
        actions={
          <select className="form-select w-32" value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        }
      />

      {/* Financial Summary */}
      {financial && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card p-4"><div className="text-xs text-gray-500 mb-1">Total Recebido</div><div className="text-lg font-bold text-green-700">{formatCurrency(financial.received)}</div></div>
          <div className="card p-4"><div className="text-xs text-gray-500 mb-1">Total Pago</div><div className="text-lg font-bold text-red-700">{formatCurrency(financial.paid)}</div></div>
          <div className="card p-4"><div className="text-xs text-gray-500 mb-1">A Receber</div><div className="text-lg font-bold text-yellow-600">{formatCurrency(financial.pendingReceivables)}</div></div>
          <div className="card p-4"><div className="text-xs text-gray-500 mb-1">A Pagar</div><div className="text-lg font-bold text-orange-600">{formatCurrency(financial.pendingPayables)}</div></div>
          <div className="card p-4"><div className="text-xs text-gray-500 mb-1">Saldo Líquido</div><div className={`text-lg font-bold ${financial.netBalance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatCurrency(financial.netBalance)}</div></div>
        </div>
      )}

      {/* Sales Chart */}
      <div className="card">
        <div className="card-header"><h3 className="text-sm font-semibold text-gray-700">Vendas por Mês — {year}</h3></div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="total" fill="#0070F2" radius={[4, 4, 0, 0]} name="Vendas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card">
          <div className="card-header"><h3 className="text-sm font-semibold text-gray-700">Top 5 Produtos Mais Vendidos</h3></div>
          <div className="card-body space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: COLORS[i] }}>{i + 1}</div>
                  <div><div className="text-sm font-medium">{p.name}</div><div className="text-xs text-gray-400">{p.code} • {p.quantity} un.</div></div>
                </div>
                <div className="text-sm font-semibold text-primary-600">{formatCurrency(p.total)}</div>
              </div>
            ))}
            {!topProducts.length && <div className="text-sm text-gray-400 py-4 text-center">Sem dados</div>}
          </div>
        </div>

        {/* Top Customers */}
        <div className="card">
          <div className="card-header"><h3 className="text-sm font-semibold text-gray-700">Top 5 Clientes</h3></div>
          <div className="card-body space-y-3">
            {topCustomers.map((c, i) => (
              <div key={c.customerId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: COLORS[i] }}>{i + 1}</div>
                  <div><div className="text-sm font-medium">{c.customer}</div><div className="text-xs text-gray-400">{c.count} pedidos</div></div>
                </div>
                <div className="text-sm font-semibold text-green-700">{formatCurrency(c.total)}</div>
              </div>
            ))}
            {!topCustomers.length && <div className="text-sm text-gray-400 py-4 text-center">Sem dados</div>}
          </div>
        </div>
      </div>

      {/* Inventory */}
      {inventory && (
        <div className="card">
          <div className="card-header"><h3 className="text-sm font-semibold text-gray-700">Resumo de Estoque</h3></div>
          <div className="card-body grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><div className="text-xs text-gray-500">Valor Total em Estoque</div><div className="text-xl font-bold text-blue-700">{formatCurrency(inventory.totalValue)}</div></div>
            <div><div className="text-xs text-gray-500">Total de Produtos</div><div className="text-xl font-bold text-gray-800">{inventory.totalItems}</div></div>
            <div><div className="text-xs text-gray-500">Estoque Crítico</div><div className="text-xl font-bold text-orange-600">{inventory.lowStock}</div></div>
            <div><div className="text-xs text-gray-500">Sem Estoque</div><div className="text-xl font-bold text-red-600">{inventory.zeroStock}</div></div>
          </div>
        </div>
      )}

      {/* Overdue */}
      {overdue && (overdue.payables?.length > 0 || overdue.receivables?.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {overdue.payables?.length > 0 && (
            <div className="card border-l-4 border-red-400">
              <div className="card-header"><h3 className="text-sm font-semibold text-red-700">Contas a Pagar Vencidas ({overdue.payables.length})</h3></div>
              <div className="divide-y">
                {overdue.payables.slice(0, 5).map(p => (
                  <div key={p.id} className="px-4 py-3 flex justify-between text-sm">
                    <div><div className="font-medium">{p.description}</div><div className="text-xs text-gray-400">{p.supplier?.name}</div></div>
                    <div className="font-semibold text-red-600">{formatCurrency(p.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {overdue.receivables?.length > 0 && (
            <div className="card border-l-4 border-yellow-400">
              <div className="card-header"><h3 className="text-sm font-semibold text-yellow-700">Contas a Receber Vencidas ({overdue.receivables.length})</h3></div>
              <div className="divide-y">
                {overdue.receivables.slice(0, 5).map(r => (
                  <div key={r.id} className="px-4 py-3 flex justify-between text-sm">
                    <div><div className="font-medium">{r.description}</div><div className="text-xs text-gray-400">{r.customer?.name}</div></div>
                    <div className="font-semibold text-yellow-600">{formatCurrency(r.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
