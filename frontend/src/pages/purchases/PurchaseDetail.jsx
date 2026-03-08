import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { purchasesAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';

export default function PurchaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = () => { setLoading(true); purchasesAPI.get(id).then(r => setData(r.data.data)).catch(() => navigate('/purchases')).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, [id]);

  const statusLabels = { sent: 'Enviado', received: 'Recebido', partial: 'Parcial', cancelled: 'Cancelado' };

  const handleStatus = async (status) => {
    const label = statusLabels[status] || status;
    if (!confirm(`Confirmar mudança de status para "${label}"?`)) return;
    setUpdating(true);
    try { await purchasesAPI.updateStatus(id, status); load(); }
    catch (err) { alert(err.response?.data?.error || 'Erro ao atualizar status'); }
    finally { setUpdating(false); }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  if (!data) return null;

  const transitions = { draft: ['sent', 'cancelled'], sent: ['received', 'partial', 'cancelled'], partial: ['received', 'cancelled'], received: [], cancelled: [] };
  const nextStatuses = transitions[data.status] || [];

  return (
    <div>
      <PageHeader title={`Compra ${data.number}`} backTo="/purchases"
        actions={
          <div className="flex gap-2">
            {data.status === 'draft' && <button onClick={() => navigate(`/purchases/${id}/edit`)} className="btn btn-secondary">Editar</button>}
            {nextStatuses.map(s => (
              <button key={s} disabled={updating} onClick={() => handleStatus(s)}
                className={`btn ${s === 'cancelled' ? 'btn-danger' : s === 'received' ? 'btn-success' : 'btn-primary'}`}>
                {s === 'sent' ? 'Enviar' : s === 'received' ? 'Receber' : s === 'partial' ? 'Parcial' : 'Cancelar'}
              </button>
            ))}
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="font-medium">Informações</h3>
              <StatusBadge status={data.status} />
            </div>
            <div className="card-body grid grid-cols-2 gap-4 text-sm">
              <div><div className="text-gray-500">Fornecedor</div><div className="font-medium">{data.supplier?.name}</div></div>
              <div><div className="text-gray-500">Data</div><div className="font-medium">{formatDate(data.createdAt)}</div></div>
              <div><div className="text-gray-500">Entrega Prevista</div><div>{formatDate(data.expectedDate)}</div></div>
              <div><div className="text-gray-500">Cond. Pagamento</div><div>{data.paymentTerms || '-'}</div></div>
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="font-medium">Itens</h3></div>
            <table className="table-auto w-full">
              <thead><tr><th>Produto</th><th>Qtde Pedida</th><th>Qtde Recebida</th><th>Preço Unit.</th><th>Total</th></tr></thead>
              <tbody>
                {data.items?.map(item => (
                  <tr key={item.id}>
                    <td><div className="font-medium">{item.product?.name}</div></td>
                    <td>{item.quantity}</td>
                    <td>
                      <span className={item.received >= item.quantity ? 'text-green-600 font-medium' : item.received > 0 ? 'text-yellow-600 font-medium' : ''}>{item.received}</span>
                    </td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td className="font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card h-fit">
          <div className="card-header"><h3 className="font-medium">Totais</h3></div>
          <div className="card-body">
            <div className="flex justify-between font-bold text-lg"><span>Total</span><span className="text-primary-600">{formatCurrency(data.total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
