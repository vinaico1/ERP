import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customersAPI } from '../../api';
import { Table, Pagination } from '../../components/common/Table';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDocument, downloadBlob } from '../../utils/format';

export default function CustomersList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customersAPI.list({ search, page, limit: 15 });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const handleExport = async (format) => {
    try {
      const res = await customersAPI.export(format);
      downloadBlob(res.data, `clientes.${format === 'csv' ? 'csv' : 'xlsx'}`);
    } catch (err) { console.error(err); }
  };

  const columns = [
    { header: 'Código', key: 'code', className: 'w-28' },
    { header: 'Nome', render: r => (
      <div>
        <div className="font-medium text-gray-800">{r.name}</div>
        {r.tradeName && <div className="text-xs text-gray-400">{r.tradeName}</div>}
      </div>
    )},
    { header: 'Tipo', render: r => <span className="badge-gray">{r.type === 'company' ? 'Empresa' : 'Pessoa Física'}</span> },
    { header: 'Documento', render: r => formatDocument(r.document) },
    { header: 'Cidade/UF', render: r => r.city ? `${r.city}/${r.state}` : '-' },
    { header: 'Telefone', render: r => r.phone || '-' },
    { header: 'Status', render: r => <StatusBadge status={r.active} /> },
    { header: '', render: r => (
      <div className="flex gap-1 justify-end">
        <button onClick={() => navigate(`/customers/${r.id}/edit`)} className="btn btn-sm btn-secondary">Editar</button>
      </div>
    ), className: 'w-24' }
  ];

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${pagination?.total || 0} clientes cadastrados`}
        actions={
          <>
            <div className="relative group">
              <button className="btn btn-secondary btn-sm">Exportar ▾</button>
              <div className="absolute right-0 mt-1 w-36 bg-white rounded shadow-lg border z-10 hidden group-hover:block">
                <button onClick={() => handleExport('excel')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Excel (.xlsx)</button>
                <button onClick={() => handleExport('csv')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50">CSV</button>
              </div>
            </div>
            <Link to="/customers/new" className="btn btn-primary">+ Novo Cliente</Link>
          </>
        }
      />

      <div className="card">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Buscar por nome, código, documento..."
            className="form-input max-w-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Table columns={columns} data={data} loading={loading} />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
