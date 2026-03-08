import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { inventoryAPI } from '../../api';
import { Table, Pagination } from '../../components/common/Table';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { formatNumber, formatCurrency } from '../../utils/format';

export default function InventoryList() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [adjustModal, setAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ productId: '', quantity: '', reason: '' });
  const [adjusting, setAdjusting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryAPI.list({ search, page, limit: 20 });
      setData(res.data.data); setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const getStockClass = (inv, product) => {
    const qty = inv?.quantity || 0;
    if (qty === 0) return 'text-red-600 font-semibold';
    if (product.minStock > 0 && qty <= product.minStock) return 'text-orange-600 font-semibold';
    return 'text-green-700 font-semibold';
  };

  const handleAdjust = async (e) => {
    e.preventDefault(); setAdjusting(true);
    try {
      await inventoryAPI.adjustment({ ...adjustForm, quantity: Number(adjustForm.quantity) });
      setAdjustModal(false);
      setAdjustForm({ productId: '', quantity: '', reason: '' });
      load();
    } catch (err) { alert(err.response?.data?.error || 'Erro'); }
    finally { setAdjusting(false); }
  };

  const columns = [
    { header: 'Código', render: r => r.product?.code },
    { header: 'Produto', render: r => <div><div className="font-medium">{r.product?.name}</div><div className="text-xs text-gray-400">{r.product?.category?.name}</div></div> },
    { header: 'Estoque', render: r => <span className={getStockClass(r, r.product)}>{formatNumber(r.quantity, 0)} {r.product?.unit}</span> },
    { header: 'Mínimo', render: r => formatNumber(r.product?.minStock, 0) },
    { header: 'Máximo', render: r => formatNumber(r.product?.maxStock, 0) },
    { header: 'Valor em Estoque', render: r => formatCurrency(r.quantity * r.product?.cost) },
    { header: '', render: r => (
      <button onClick={() => { setAdjustForm({ productId: r.productId, quantity: r.quantity, reason: 'Ajuste de inventário' }); setAdjustModal(true); }} className="btn btn-sm btn-secondary">
        Ajustar
      </button>
    )}
  ];

  return (
    <div>
      <PageHeader title="Posição de Estoque" subtitle={`${pagination?.total || 0} produtos`}
        actions={<Link to="/inventory/movements" className="btn btn-secondary">Ver Movimentações</Link>}
      />
      <div className="card">
        <div className="p-4 border-b"><input type="text" placeholder="Buscar produto..." className="form-input max-w-sm" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Table columns={columns} data={data} loading={loading} />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal isOpen={adjustModal} onClose={() => setAdjustModal(false)} title="Ajustar Estoque">
        <form onSubmit={handleAdjust} className="p-6 space-y-4">
          <div>
            <label className="form-label">Nova Quantidade *</label>
            <input type="number" step="0.001" min="0" className="form-input" value={adjustForm.quantity} onChange={e => setAdjustForm(f => ({ ...f, quantity: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Motivo *</label>
            <input className="form-input" value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))} required />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => setAdjustModal(false)}>Cancelar</button>
            <button type="submit" disabled={adjusting} className="btn btn-primary">{adjusting ? 'Ajustando...' : 'Confirmar Ajuste'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
