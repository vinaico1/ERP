import React, { useState, useEffect, useCallback } from 'react';
import { financialAPI } from '../../api';
import { Table, Pagination } from '../../components/common/Table';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../utils/format';

export default function Payables() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [payModal, setPayModal] = useState(null); // holds the payable being paid
  const [payForm, setPayForm] = useState({ paidAmount: '', paidDate: new Date().toISOString().slice(0, 10) });
  const [paying, setPaying] = useState(false);
  const [newModal, setNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ description: '', amount: '', dueDate: '', supplierId: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financialAPI.payables.list({ status, search, page, limit: 15 });
      setData(res.data.data); setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [status, search, page]);

  useEffect(() => { load(); }, [load]);

  const handlePay = async (e) => {
    e.preventDefault(); setPaying(true);
    try {
      await financialAPI.payables.pay(payModal.id, { paidAmount: Number(payForm.paidAmount), paidDate: payForm.paidDate });
      setPayModal(null); load();
    } catch (err) { alert(err.response?.data?.error || 'Erro'); }
    finally { setPaying(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await financialAPI.payables.create({ ...newForm, amount: Number(newForm.amount) });
      setNewModal(false); setNewForm({ description: '', amount: '', dueDate: '', supplierId: '', notes: '' }); load();
    } catch (err) { alert(err.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const totals = data.reduce((s, r) => ({ amount: s.amount + r.amount, paid: s.paid + (r.paidAmount || 0) }), { amount: 0, paid: 0 });

  const columns = [
    { header: 'Descrição', render: r => <div><div className="font-medium">{r.description}</div><div className="text-xs text-gray-400">{r.supplier?.name}</div></div> },
    { header: 'Vencimento', render: r => <span className={r.status === 'overdue' ? 'text-red-600 font-medium' : ''}>{formatDate(r.dueDate)}</span> },
    { header: 'Valor', render: r => <span className="font-semibold">{formatCurrency(r.amount)}</span> },
    { header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { header: '', render: r => (
      r.status !== 'paid' && r.status !== 'cancelled' ? (
        <button onClick={() => { setPayModal(r); setPayForm({ paidAmount: r.amount, paidDate: new Date().toISOString().slice(0, 10) }); }} className="btn btn-sm btn-success">
          Pagar
        </button>
      ) : null
    )}
  ];

  return (
    <div>
      <PageHeader title="Contas a Pagar" subtitle="Gestão de pagamentos"
        actions={<button onClick={() => setNewModal(true)} className="btn btn-primary">+ Nova Conta</button>}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4"><div className="text-sm text-gray-500">Total Pendente</div><div className="text-xl font-bold text-red-600">{formatCurrency(totals.amount)}</div></div>
        <div className="card p-4"><div className="text-sm text-gray-500">Total Pago</div><div className="text-xl font-bold text-green-600">{formatCurrency(totals.paid)}</div></div>
        <div className="card p-4"><div className="text-sm text-gray-500">Qtde. Títulos</div><div className="text-xl font-bold text-gray-800">{pagination?.total || 0}</div></div>
      </div>

      <div className="card">
        <div className="p-4 border-b flex gap-3">
          <input type="text" placeholder="Buscar..." className="form-input max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-select w-36" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="pending">Pendente</option>
            <option value="overdue">Vencido</option>
            <option value="paid">Pago</option>
          </select>
        </div>
        <Table columns={columns} data={data} loading={loading} />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      {/* Pay Modal */}
      <Modal isOpen={!!payModal} onClose={() => setPayModal(null)} title="Registrar Pagamento">
        <form onSubmit={handlePay} className="p-6 space-y-4">
          <div className="p-3 bg-gray-50 rounded text-sm"><strong>{payModal?.description}</strong><div className="text-gray-500">Valor original: {formatCurrency(payModal?.amount)}</div></div>
          <div><label className="form-label">Valor Pago (R$) *</label><input type="number" step="0.01" min="0" className="form-input" value={payForm.paidAmount} onChange={e => setPayForm(f => ({ ...f, paidAmount: e.target.value }))} required /></div>
          <div><label className="form-label">Data do Pagamento *</label><input type="date" className="form-input" value={payForm.paidDate} onChange={e => setPayForm(f => ({ ...f, paidDate: e.target.value }))} required /></div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => setPayModal(null)}>Cancelar</button>
            <button type="submit" disabled={paying} className="btn btn-success">{paying ? 'Registrando...' : 'Confirmar Pagamento'}</button>
          </div>
        </form>
      </Modal>

      {/* New Modal */}
      <Modal isOpen={newModal} onClose={() => setNewModal(false)} title="Nova Conta a Pagar">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div><label className="form-label">Descrição *</label><input className="form-input" value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Valor (R$) *</label><input type="number" step="0.01" min="0" className="form-input" value={newForm.amount} onChange={e => setNewForm(f => ({ ...f, amount: e.target.value }))} required /></div>
            <div><label className="form-label">Vencimento *</label><input type="date" className="form-input" value={newForm.dueDate} onChange={e => setNewForm(f => ({ ...f, dueDate: e.target.value }))} required /></div>
          </div>
          <div><label className="form-label">Observações</label><textarea className="form-input h-16 resize-none" value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} /></div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => setNewModal(false)}>Cancelar</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Salvando...' : 'Criar Conta'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
