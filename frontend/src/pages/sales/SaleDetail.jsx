import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { salesAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';

const STATUS_TRANSITIONS = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['invoiced', 'cancelled'],
  invoiced: [],
  cancelled: []
};

export default function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = () => {
    setLoading(true);
    salesAPI.get(id).then(res => setData(res.data.data)).catch(() => navigate('/sales')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const statusLabels = { confirmed: 'Confirmado', invoiced: 'Faturado', cancelled: 'Cancelado' };

  const handleStatusChange = async (newStatus) => {
    const label = statusLabels[newStatus] || newStatus;
    if (!confirm(`Confirmar mudança de status para "${label}"?`)) return;
    setUpdating(true);
    try {
      await salesAPI.updateStatus(id, newStatus);
      load();
    } catch (err) { alert(err.response?.data?.error || 'Erro ao atualizar status'); }
    finally { setUpdating(false); }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  if (!data) return null;

  const transitions = STATUS_TRANSITIONS[data.status] || [];

  return (
    <div>
      <PageHeader
        title={`Pedido ${data.number}`}
        backTo="/sales"
        actions={
          <div className="flex gap-2">
            {data.status === 'draft' && <button onClick={() => navigate(`/sales/${id}/edit`)} className="btn btn-secondary">Editar</button>}
            {transitions.map(s => (
              <button key={s} disabled={updating} onClick={() => handleStatusChange(s)}
                className={`btn ${s === 'cancelled' ? 'btn-danger' : s === 'invoiced' ? 'btn-success' : 'btn-primary'}`}>
                {s === 'confirmed' ? 'Confirmar' : s === 'invoiced' ? 'Faturar' : 'Cancelar'}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-medium">Informações do Pedido</h3>
              <StatusBadge status={data.status} />
            </div>
            <div className="card-body grid grid-cols-2 gap-4 text-sm">
              <div><div className="text-gray-500">Cliente</div><div className="font-medium">{data.customer?.name}</div></div>
              <div><div className="text-gray-500">Data</div><div className="font-medium">{formatDate(data.createdAt)}</div></div>
              <div><div className="text-gray-500">Vencimento</div><div className="font-medium">{formatDate(data.dueDate)}</div></div>
              <div><div className="text-gray-500">Condição de Pagamento</div><div className="font-medium">{data.paymentTerms || '-'}</div></div>
              {data.notes && <div className="col-span-2"><div className="text-gray-500">Observações</div><div>{data.notes}</div></div>}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3 className="font-medium">Itens</h3></div>
            <table className="table-auto w-full">
              <thead><tr><th>Produto</th><th>Qtde</th><th>Preço Unit.</th><th>Desconto</th><th>Total</th></tr></thead>
              <tbody>
                {data.items?.map(item => (
                  <tr key={item.id}>
                    <td><div className="font-medium">{item.product?.name}</div><div className="text-xs text-gray-400">{item.product?.code}</div></td>
                    <td>{item.quantity} {item.product?.unit}</td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td>{formatCurrency(item.discount)}</td>
                    <td className="font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="card-header"><h3 className="font-medium">Totais</h3></div>
            <div className="card-body space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(data.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Desconto</span><span className="text-red-600">-{formatCurrency(data.discount)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-3"><span>Total</span><span className="text-primary-600">{formatCurrency(data.total)}</span></div>
            </div>
          </div>
          {data.receivables?.length > 0 && (
            <div className="card">
              <div className="card-header"><h3 className="font-medium">Contas a Receber</h3></div>
              <div className="card-body space-y-2">
                {data.receivables.map(r => (
                  <div key={r.id} className="flex justify-between text-sm">
                    <div><div>{formatDate(r.dueDate)}</div><StatusBadge status={r.status} /></div>
                    <div className="font-medium">{formatCurrency(r.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
