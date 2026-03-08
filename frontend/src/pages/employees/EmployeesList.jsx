import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { employeesAPI } from '../../api';
import { Table, Pagination } from '../../components/common/Table';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/format';

export default function EmployeesList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeesAPI.list({ search, page, limit: 15 });
      setData(res.data.data); setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { header: 'Código', key: 'code' },
    { header: 'Nome', render: r => <div><div className="font-medium">{r.name}</div><div className="text-xs text-gray-400">{r.email}</div></div> },
    { header: 'Cargo', key: 'position' },
    { header: 'Departamento', key: 'department' },
    { header: 'Salário', render: r => r.salary ? formatCurrency(r.salary) : '-' },
    { header: 'Status', render: r => <span className={r.active ? 'badge-green' : 'badge-gray'}>{r.active ? 'Ativo' : 'Inativo'}</span> },
    { header: '', render: r => <button onClick={() => navigate(`/employees/${r.id}/edit`)} className="btn btn-sm btn-secondary">Editar</button> }
  ];

  return (
    <div>
      <PageHeader title="Funcionários" subtitle={`${pagination?.total || 0} funcionários`}
        actions={<Link to="/employees/new" className="btn btn-primary">+ Novo Funcionário</Link>}
      />
      <div className="card">
        <div className="p-4 border-b"><input type="text" placeholder="Buscar funcionário..." className="form-input max-w-sm" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Table columns={columns} data={data} loading={loading} />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
