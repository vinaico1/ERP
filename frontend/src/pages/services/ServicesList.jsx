import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { servicesAPI } from '../../api';
import { Table, Pagination } from '../../components/common/Table';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/format';

export default function ServicesList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await servicesAPI.list({ search, page, limit: 15 });
      setData(res.data.data); setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { header: 'Código', key: 'code' },
    { header: 'Serviço', render: r => <div><div className="font-medium">{r.name}</div><div className="text-xs text-gray-400">{r.description}</div></div> },
    { header: 'Unidade', key: 'unit' },
    { header: 'Duração', render: r => r.duration ? `${r.duration} min` : '-' },
    { header: 'Preço', render: r => <span className="font-medium text-green-700">{formatCurrency(r.price)}</span> },
    { header: 'Ativo', render: r => <span className={r.active ? 'badge-green' : 'badge-gray'}>{r.active ? 'Sim' : 'Não'}</span> },
    { header: '', render: r => <button onClick={() => navigate(`/services/${r.id}/edit`)} className="btn btn-sm btn-secondary">Editar</button> }
  ];

  return (
    <div>
      <PageHeader title="Serviços" subtitle={`${pagination?.total || 0} serviços`}
        actions={<Link to="/services/new" className="btn btn-primary">+ Novo Serviço</Link>}
      />
      <div className="card">
        <div className="p-4 border-b"><input type="text" placeholder="Buscar serviço..." className="form-input max-w-sm" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Table columns={columns} data={data} loading={loading} />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
