import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { purchasesAPI } from '../../api';
import { Table, Pagination } from '../../components/common/Table';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';

export default function PurchasesList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchasesAPI.list({ search, status, page, limit: 15 });
      setData(res.data.data); setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { header: 'Número', render: r => <span className="font-mono font-medium text-primary-600">{r.number}</span> },
    { header: 'Fornecedor', render: r => r.supplier?.name || '-' },
    { header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { header: 'Total', render: r => <span className="font-semibold">{formatCurrency(r.total)}</span> },
    { header: 'Data', render: r => formatDate(r.createdAt) },
    { header: 'Entrega Prevista', render: r => formatDate(r.expectedDate) },
    { header: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => navigate(`/purchases/${r.id}`)} className="btn btn-sm btn-secondary">Ver</button>
      </div>
    )}
  ];

  return (
    <div>
      <PageHeader title="Pedidos de Compra" subtitle={`${pagination?.total || 0} pedidos`}
        actions={<Link to="/purchases/new" className="btn btn-primary">+ Nova Compra</Link>}
      />
      <div className="card">
        <div className="p-4 border-b flex gap-3">
          <input type="text" placeholder="Buscar..." className="form-input max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-select w-40" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Todos status</option>
            <option value="draft">Rascunho</option>
            <option value="sent">Enviado</option>
            <option value="partial">Parcial</option>
            <option value="received">Recebido</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
        <Table columns={columns} data={data} loading={loading} />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
