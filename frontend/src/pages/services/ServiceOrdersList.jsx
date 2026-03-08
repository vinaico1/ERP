import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { serviceOrdersAPI } from '../../api';
import { Table, Pagination } from '../../components/common/Table';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/format';

export default function ServiceOrdersList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await serviceOrdersAPI.list({ status, page, limit: 15 });
      setData(res.data.data); setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id, newStatus) => {
    setUpdating(id);
    try { await serviceOrdersAPI.updateStatus(id, newStatus); load(); }
    catch (err) { alert(err.response?.data?.error || 'Erro'); }
    finally { setUpdating(null); }
  };

  const PRIORITY_COLORS = { low: 'badge-gray', normal: 'badge-blue', high: 'badge-yellow', urgent: 'badge-red' };

  const columns = [
    { header: 'Número', render: r => <span className="font-mono font-medium text-primary-600">{r.number}</span> },
    { header: 'Serviço', render: r => r.service?.name || '-' },
    { header: 'Cliente', render: r => r.customer?.name || '-' },
    { header: 'Responsável', render: r => r.employee?.name || '-' },
    { header: 'Status', render: r => <StatusBadge status={r.status} /> },
    { header: 'Prioridade', render: r => <span className={PRIORITY_COLORS[r.priority] || 'badge-gray'}>{r.priority}</span> },
    { header: 'Agendado', render: r => formatDate(r.scheduledAt) },
    { header: '', render: r => (
      <div className="flex gap-1">
        {r.status === 'open' && <button disabled={updating === r.id} onClick={() => handleStatus(r.id, 'in_progress')} className="btn btn-sm btn-primary">Iniciar</button>}
        {r.status === 'in_progress' && <button disabled={updating === r.id} onClick={() => handleStatus(r.id, 'done')} className="btn btn-sm btn-success">Concluir</button>}
        <button onClick={() => navigate(`/service-orders/${r.id}/edit`)} className="btn btn-sm btn-secondary">Editar</button>
      </div>
    )}
  ];

  return (
    <div>
      <PageHeader title="Ordens de Serviço" subtitle={`${pagination?.total || 0} ordens`}
        actions={<Link to="/service-orders/new" className="btn btn-primary">+ Nova OS</Link>}
      />
      <div className="card">
        <div className="p-4 border-b">
          <select className="form-select w-40" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Todos status</option>
            <option value="open">Aberto</option>
            <option value="in_progress">Em andamento</option>
            <option value="done">Concluído</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
        <Table columns={columns} data={data} loading={loading} />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
