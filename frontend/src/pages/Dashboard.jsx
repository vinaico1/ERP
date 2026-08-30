import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../api';
import { formatCurrency } from '../utils/format';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

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
const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [dayMonth, setDayMonth] = useState(now.getMonth() + 1);
  const [dayYear, setDayYear] = useState(now.getFullYear());

  const loadDaily = useCallback(() => {
    reportsAPI.salesByDay({ year: dayYear, month: dayMonth })
      .then(r => setDailyData(r.data.data))
      .catch(console.error);
  }, [dayMonth, dayYear]);

  useEffect(() => {
    Promise.all([
      reportsAPI.dashboard(),
      reportsAPI.salesByPeriod({ year: now.getFullYear() })
    ]).then(([dashRes, salesRes]) => {
      setData(dashRes.data.data);
      const sales = salesRes.data.data.map((s, i) => ({ month: MONTHS[i], total: s.total, count: s.count }));
      setSalesData(sales);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadDaily(); }, [loadDaily]);

  function prevMonth() {
    if (dayMonth === 1) { setDayMonth(12); setDayYear(y => y - 1); }
    else setDayMonth(m => m - 1);
  }
  function nextMonth() {
    const isCurrentMonth = dayYear === now.getFullYear() && dayMonth === now.getMonth() + 1;
    if (isCurrentMonth) return;
    if (dayMonth === 12) { setDayMonth(1); setDayYear(y => y + 1); }
    else setDayMonth(m => m + 1);
  }

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

      {/* Vendas por dia do mês */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Vendas por Dia — {MONTH_NAMES[dayMonth - 1]} {dayYear}</h3>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 transition-colors">‹</button>
            <span className="text-xs text-gray-500 min-w-[90px] text-center">{MONTH_NAMES[dayMonth - 1]} {dayYear}</span>
            <button
              onClick={nextMonth}
              disabled={dayYear === now.getFullYear() && dayMonth === now.getMonth() + 1}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30 transition-colors"
            >›</button>
          </div>
        </div>
        <div className="p-4">
          {dailyData.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">Sem dados para o período</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dailyData} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={1} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={45} />
                <Tooltip
                  formatter={(v, name) => [formatCurrency(v), name === 'pdv' ? 'PDV' : name === 'erp' ? 'ERP' : 'Total']}
                  labelFormatter={d => `Dia ${d}`}
                />
                <Legend formatter={v => v === 'pdv' ? 'PDV' : 'ERP'} />
                <Bar dataKey="erp" stackId="a" fill="#0070F2" name="erp" radius={[0,0,0,0]} />
                <Bar dataKey="pdv" stackId="a" fill="#7c3aed" name="pdv" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="mt-2 flex gap-4 text-xs text-gray-500">
            <span>Total do mês: <strong className="text-gray-800">{formatCurrency(dailyData.reduce((s, d) => s + d.total, 0))}</strong></span>
            <span>Pedidos: <strong className="text-gray-800">{dailyData.reduce((s, d) => s + d.count, 0)}</strong></span>
            <span className="text-purple-600">PDV: <strong>{formatCurrency(dailyData.reduce((s, d) => s + d.pdv, 0))}</strong></span>
            <span className="text-blue-600">ERP: <strong>{formatCurrency(dailyData.reduce((s, d) => s + d.erp, 0))}</strong></span>
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
