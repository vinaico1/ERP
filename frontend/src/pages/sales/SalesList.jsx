import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { salesAPI } from '../../api';
import { Table, Pagination } from '../../components/common/Table';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate, downloadBlob } from '../../utils/format';

export default function SalesList() {
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
      const res = await salesAPI.list({ search, status, page, limit: 15 });
      setData(res.data.data); setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [search, status, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, status]);

  const columns = [
    { header: 'Número', render: r => <span className="font-mono font-medium text-primary-600">{r.number}</span> },
    { header: 'Cliente', render: r => r.customer?.name || '-' },
    { header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { header: 'Total', render: r => <span className="font-semibold">{formatCurrency(r.total)}</span> },
    { header: 'Data', render: r => formatDate(r.createdAt) },
    { header: 'Vencimento', render: r => formatDate(r.dueDate) },
    { header: '', render: r => (
      <div className="flex gap-1">
        <button onClick={() => navigate(`/sales/${r.id}`)} className="btn btn-sm btn-secondary">Ver</button>
        {r.status === 'draft' && <button onClick={() => navigate(`/sales/${r.id}/edit`)} className="btn btn-sm btn-secondary">Editar</button>}
      </div>
    )}
  ];

  return (
    <div>
      <PageHeader title="Pedidos de Venda" subtitle={`${pagination?.total || 0} pedidos`}
        actions={
          <>
            <button onClick={() => salesAPI.export('excel').then(r => downloadBlob(r.data, 'vendas.xlsx'))} className="btn btn-secondary btn-sm">Exportar</button>
            <Link to="/sales/new" className="btn btn-primary">+ Nova Venda</Link>
          </>
        }
      />
      <div className="card">
        <div className="p-4 border-b flex gap-3">
          <input type="text" placeholder="Buscar número, cliente..." className="form-input max-w-xs" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-select w-40" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Todos status</option>
            <option value="draft">Rascunho</option>
            <option value="confirmed">Confirmado</option>
            <option value="invoiced">Faturado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
        <Table columns={columns} data={data} loading={loading} />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
