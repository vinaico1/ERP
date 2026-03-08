import React, { useState, useEffect, useCallback } from 'react';
import { financialAPI } from '../../api';
import { Table, Pagination } from '../../components/common/Table';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CashFlow() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [newModal, setNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ type: 'income', description: '', amount: '', date: new Date().toISOString().slice(0, 10), notes: '' });
  const [saving, setSaving] = useState(false);

  const now = new Date();
  const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        financialAPI.cashflow.list({ type, page, limit: 20 }),
        financialAPI.cashflow.summary({ startDate, endDate })
      ]);
      setData(listRes.data.data); setPagination(listRes.data.pagination);
      setSummary(summaryRes.data.data);
    } finally { setLoading(false); }
  }, [type, page]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await financialAPI.cashflow.create({ ...newForm, amount: Number(newForm.amount) });
      setNewModal(false); load();
    } catch (err) { alert(err.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const chartData = summary ? [
    { name: 'Receitas', value: summary.totalIncome, fill: '#22c55e' },
    { name: 'Despesas', value: summary.totalExpense, fill: '#ef4444' },
    { name: 'Saldo', value: summary.balance, fill: summary.balance >= 0 ? '#3b82f6' : '#f97316' }
  ] : [];

  const columns = [
    { header: 'Data', render: r => formatDate(r.date) },
    { header: 'Tipo', render: r => <span className={r.type === 'income' ? 'badge-green' : 'badge-red'}>{r.type === 'income' ? 'Receita' : 'Despesa'}</span> },
    { header: 'Descrição', render: r => <div><div className="font-medium">{r.description}</div><div className="text-xs text-gray-400">{r.category?.name}</div></div> },
    { header: 'Valor', render: r => <span className={`font-semibold ${r.type === 'income' ? 'text-green-700' : 'text-red-600'}`}>{r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount)}</span> },
    { header: 'Referência', render: r => r.reference || '-' }
  ];

  return (
    <div>
      <PageHeader title="Fluxo de Caixa" subtitle="Mês atual"
        actions={<button onClick={() => setNewModal(true)} className="btn btn-primary">+ Novo Lançamento</button>}
      />

      {summary && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4"><div className="text-sm text-gray-500">Receitas do Mês</div><div className="text-xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</div></div>
          <div className="card p-4"><div className="text-sm text-gray-500">Despesas do Mês</div><div className="text-xl font-bold text-red-600">{formatCurrency(summary.totalExpense)}</div></div>
          <div className="card p-4"><div className="text-sm text-gray-500">Saldo</div><div className={`text-xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>{formatCurrency(summary.balance)}</div></div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="card mb-6">
          <div className="card-header"><h3 className="text-sm font-semibold text-gray-700">Resumo Mensal</h3></div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Bar dataKey="value" fill="#0070F2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card">
        <div className="p-4 border-b">
          <select className="form-select w-36" value={type} onChange={e => setType(e.target.value)}>
            <option value="">Todos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
        </div>
        <Table columns={columns} data={data} loading={loading} />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal isOpen={newModal} onClose={() => setNewModal(false)} title="Novo Lançamento">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Tipo *</label>
              <select className="form-select" value={newForm.type} onChange={e => setNewForm(f => ({ ...f, type: e.target.value }))}>
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
              </select>
            </div>
            <div><label className="form-label">Data *</label><input type="date" className="form-input" value={newForm.date} onChange={e => setNewForm(f => ({ ...f, date: e.target.value }))} required /></div>
          </div>
          <div><label className="form-label">Descrição *</label><input className="form-input" value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} required /></div>
          <div><label className="form-label">Valor (R$) *</label><input type="number" step="0.01" min="0" className="form-input" value={newForm.amount} onChange={e => setNewForm(f => ({ ...f, amount: e.target.value }))} required /></div>
          <div><label className="form-label">Observações</label><textarea className="form-input h-16 resize-none" value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => setNewModal(false)}>Cancelar</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Salvando...' : 'Criar Lançamento'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
