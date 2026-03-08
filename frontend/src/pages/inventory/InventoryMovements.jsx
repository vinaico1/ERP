import React, { useState, useEffect, useCallback } from 'react';
import { inventoryAPI } from '../../api';
import { Table, Pagination } from '../../components/common/Table';
import PageHeader from '../../components/common/PageHeader';
import { formatNumber, formatDateTime } from '../../utils/format';

const TYPE_LABELS = { in: { label: 'Entrada', cls: 'badge-green' }, out: { label: 'Saída', cls: 'badge-red' }, adjustment: { label: 'Ajuste', cls: 'badge-blue' }, return: { label: 'Devolução', cls: 'badge-yellow' } };

export default function InventoryMovements() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', startDate: '', endDate: '' });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await inventoryAPI.movements({ ...filters, page, limit: 20 });
      setData(res.data.data); setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { header: 'Produto', render: r => <div><div className="font-medium">{r.product?.name}</div><div className="text-xs text-gray-400">{r.product?.code}</div></div> },
    { header: 'Tipo', render: r => { const t = TYPE_LABELS[r.type]; return <span className={t?.cls || 'badge-gray'}>{t?.label || r.type}</span>; } },
    { header: 'Qtde', render: r => <span className={r.type === 'out' ? 'text-red-600' : 'text-green-700'}>{r.type === 'out' ? '-' : '+'}{formatNumber(r.quantity, 0)}</span> },
    { header: 'Saldo', render: r => <span className="font-medium">{formatNumber(r.balance, 0)}</span> },
    { header: 'Motivo', render: r => r.reason || '-' },
    { header: 'Referência', render: r => r.reference || '-' },
    { header: 'Data', render: r => formatDateTime(r.createdAt) }
  ];

  return (
    <div>
      <PageHeader title="Movimentações de Estoque" backTo="/inventory" />
      <div className="card">
        <div className="p-4 border-b flex gap-3 flex-wrap">
          <select className="form-select w-36" value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
            <option value="">Todos tipos</option>
            <option value="in">Entrada</option>
            <option value="out">Saída</option>
            <option value="adjustment">Ajuste</option>
            <option value="return">Devolução</option>
          </select>
          <input type="date" className="form-input w-40" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
          <input type="date" className="form-input w-40" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
        </div>
        <Table columns={columns} data={data} loading={loading} emptyMessage="Nenhuma movimentação encontrada." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
