import React, { useState, useEffect, useCallback } from 'react';
import { financialAPI } from '../../api';
import { Table, Pagination } from '../../components/common/Table';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import { formatCurrency, formatDate } from '../../utils/format';

export default function Receivables() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [receiveModal, setReceiveModal] = useState(null);
  const [receiveForm, setReceiveForm] = useState({ receivedAmount: '', receivedDate: new Date().toISOString().slice(0, 10) });
  const [receiving, setReceiving] = useState(false);
  const [newModal, setNewModal] = useState(false);
  const [newForm, setNewForm] = useState({ description: '', amount: '', dueDate: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financialAPI.receivables.list({ status, page, limit: 15 });
      setData(res.data.data); setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const handleReceive = async (e) => {
    e.preventDefault(); setReceiving(true);
    try {
      await financialAPI.receivables.receive(receiveModal.id, { receivedAmount: Number(receiveForm.receivedAmount), receivedDate: receiveForm.receivedDate });
      setReceiveModal(null); load();
    } catch (err) { alert(err.response?.data?.error || 'Erro'); }
    finally { setReceiving(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await financialAPI.receivables.create({ ...newForm, amount: Number(newForm.amount) });
      setNewModal(false); load();
    } catch (err) { alert(err.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  const columns = [
    { header: 'Descrição', render: r => <div><div className="font-medium">{r.description}</div><div className="text-xs text-gray-400">{r.customer?.name}</div></div> },
    { header: 'Vencimento', render: r => <span className={r.status === 'overdue' ? 'text-red-600 font-medium' : ''}>{formatDate(r.dueDate)}</span> },
    { header: 'Valor', render: r => <span className="font-semibold text-green-700">{formatCurrency(r.amount)}</span> },
    { header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { header: '', render: r => (
      r.status !== 'received' && r.status !== 'cancelled' ? (
        <button onClick={() => { setReceiveModal(r); setReceiveForm({ receivedAmount: r.amount, receivedDate: new Date().toISOString().slice(0, 10) }); }} className="btn btn-sm btn-primary">
          Receber
        </button>
      ) : null
    )}
  ];

  const totalPending = data.filter(r => r.status !== 'received').reduce((s, r) => s + r.amount, 0);
  const totalReceived = data.filter(r => r.status === 'received').reduce((s, r) => s + (r.receivedAmount || r.amount), 0);

  return (
    <div>
      <PageHeader title="Contas a Receber" subtitle="Gestão de recebimentos"
        actions={<button onClick={() => setNewModal(true)} className="btn btn-primary">+ Nova Conta</button>}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4"><div className="text-sm text-gray-500">Total Pendente</div><div className="text-xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div></div>
        <div className="card p-4"><div className="text-sm text-gray-500">Total Recebido</div><div className="text-xl font-bold text-green-600">{formatCurrency(totalReceived)}</div></div>
        <div className="card p-4"><div className="text-sm text-gray-500">Qtde. Títulos</div><div className="text-xl font-bold text-gray-800">{pagination?.total || 0}</div></div>
      </div>

      <div className="card">
        <div className="p-4 border-b flex gap-3">
          <select className="form-select w-36" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="pending">Pendente</option>
            <option value="overdue">Vencido</option>
            <option value="received">Recebido</option>
          </select>
        </div>
        <Table columns={columns} data={data} loading={loading} />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal isOpen={!!receiveModal} onClose={() => setReceiveModal(null)} title="Registrar Recebimento">
        <form onSubmit={handleReceive} className="p-6 space-y-4">
          <div className="p-3 bg-gray-50 rounded text-sm"><strong>{receiveModal?.description}</strong><div className="text-gray-500">Valor original: {formatCurrency(receiveModal?.amount)}</div></div>
          <div><label className="form-label">Valor Recebido (R$) *</label><input type="number" step="0.01" min="0" className="form-input" value={receiveForm.receivedAmount} onChange={e => setReceiveForm(f => ({ ...f, receivedAmount: e.target.value }))} required /></div>
          <div><label className="form-label">Data do Recebimento *</label><input type="date" className="form-input" value={receiveForm.receivedDate} onChange={e => setReceiveForm(f => ({ ...f, receivedDate: e.target.value }))} required /></div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => setReceiveModal(null)}>Cancelar</button>
            <button type="submit" disabled={receiving} className="btn btn-primary">{receiving ? 'Registrando...' : 'Confirmar Recebimento'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={newModal} onClose={() => setNewModal(false)} title="Nova Conta a Receber">
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div><label className="form-label">Descrição *</label><input className="form-input" value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Valor (R$) *</label><input type="number" step="0.01" min="0" className="form-input" value={newForm.amount} onChange={e => setNewForm(f => ({ ...f, amount: e.target.value }))} required /></div>
            <div><label className="form-label">Vencimento *</label><input type="date" className="form-input" value={newForm.dueDate} onChange={e => setNewForm(f => ({ ...f, dueDate: e.target.value }))} required /></div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => setNewModal(false)}>Cancelar</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Salvando...' : 'Criar Conta'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
