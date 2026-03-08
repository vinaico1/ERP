import React, { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../api';
import { Table, Pagination } from '../../components/common/Table';
import PageHeader from '../../components/common/PageHeader';
import { formatDateTime } from '../../utils/format';

const ACTION_COLORS = { create: 'badge-green', update: 'badge-blue', delete: 'badge-red', login: 'badge-gray', logout: 'badge-gray', change_password: 'badge-yellow' };

export default function AuditLogs() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ entity: '', action: '', startDate: '', endDate: '' });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.auditLogs({ ...filters, page, limit: 20 });
      setData(res.data.data); setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { header: 'Data', render: r => formatDateTime(r.createdAt) },
    { header: 'Usuário', render: r => r.user?.name || '-' },
    { header: 'Ação', render: r => <span className={ACTION_COLORS[r.action] || 'badge-gray'}>{r.action}</span> },
    { header: 'Entidade', render: r => <span className="font-mono text-xs">{r.entity}</span> },
    { header: 'ID', render: r => <span className="font-mono text-xs text-gray-400 truncate max-w-[80px] block">{r.entityId || '-'}</span> },
    { header: 'IP', render: r => r.ip || '-' }
  ];

  return (
    <div>
      <PageHeader title="Logs de Auditoria" subtitle="Histórico de ações do sistema" />
      <div className="card">
        <div className="p-4 border-b flex gap-3 flex-wrap">
          <select className="form-select w-40" value={filters.entity} onChange={e => setFilters(f => ({ ...f, entity: e.target.value }))}>
            <option value="">Todas entidades</option>
            {['User', 'Customer', 'Supplier', 'Product', 'Service', 'Employee', 'SalesOrder', 'PurchaseOrder', 'Inventory', 'AccountPayable', 'AccountReceivable', 'ServiceOrder'].map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <select className="form-select w-36" value={filters.action} onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}>
            <option value="">Todas ações</option>
            <option value="create">Criação</option>
            <option value="update">Atualização</option>
            <option value="delete">Exclusão</option>
            <option value="login">Login</option>
          </select>
          <input type="date" className="form-input w-40" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} />
          <input type="date" className="form-input w-40" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} />
        </div>
        <Table columns={columns} data={data} loading={loading} emptyMessage="Nenhum log encontrado." />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
