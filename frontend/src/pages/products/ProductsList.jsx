import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productsAPI } from '../../api';
import { Table, Pagination } from '../../components/common/Table';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatNumber, downloadBlob } from '../../utils/format';

export default function ProductsList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsAPI.list({ search, page, limit: 15 });
      setData(res.data.data);
      setPagination(res.data.pagination);
    } finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search]);

  const getStockStatus = (product) => {
    const qty = product.inventory?.quantity || 0;
    if (qty === 0) return <span className="badge-red">Zerado</span>;
    if (qty <= product.minStock && product.minStock > 0) return <span className="badge-orange">Baixo</span>;
    return <span className="badge-green">OK</span>;
  };

  const columns = [
    { header: 'Código', key: 'code', className: 'w-28' },
    { header: 'Produto', render: r => <div><div className="font-medium">{r.name}</div><div className="text-xs text-gray-400">{r.category?.name}</div></div> },
    { header: 'Un.', key: 'unit', className: 'w-16' },
    { header: 'Preço Venda', render: r => <span className="font-medium">{formatCurrency(r.price)}</span> },
    { header: 'Custo', render: r => formatCurrency(r.cost) },
    { header: 'Estoque', render: r => (
      <div>
        <div className="font-medium">{formatNumber(r.inventory?.quantity || 0, 0)}</div>
        <div className="text-xs text-gray-400">mín: {formatNumber(r.minStock, 0)}</div>
      </div>
    )},
    { header: 'Status Estoque', render: r => getStockStatus(r) },
    { header: 'Situação', render: r => <StatusBadge status={r.active} /> },
    { header: '', render: r => <button onClick={() => navigate(`/products/${r.id}/edit`)} className="btn btn-sm btn-secondary">Editar</button> }
  ];

  return (
    <div>
      <PageHeader title="Produtos" subtitle={`${pagination?.total || 0} produtos`}
        actions={
          <>
            <button onClick={() => productsAPI.export('excel').then(r => downloadBlob(r.data, 'produtos.xlsx'))} className="btn btn-secondary btn-sm">Exportar</button>
            <Link to="/products/new" className="btn btn-primary">+ Novo Produto</Link>
          </>
        }
      />
      <div className="card">
        <div className="p-4 border-b"><input type="text" placeholder="Buscar produto..." className="form-input max-w-sm" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <Table columns={columns} data={data} loading={loading} />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>
    </div>
  );
}
