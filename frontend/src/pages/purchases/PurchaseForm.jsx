import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { purchasesAPI, suppliersAPI, productsAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/format';

const emptyItem = () => ({ productId: '', quantity: 1, unitPrice: 0, total: 0 });

export default function PurchaseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ supplierId: '', paymentTerms: '', notes: '', expectedDate: '' });
  const [items, setItems] = useState([emptyItem()]);

  useEffect(() => {
    suppliersAPI.list({ limit: 100, active: true }).then(r => setSuppliers(r.data.data));
    productsAPI.list({ limit: 200, active: true }).then(r => setProducts(r.data.data));
    if (isEdit) {
      purchasesAPI.get(id).then(res => {
        const d = res.data.data;
        setForm({ supplierId: d.supplierId, paymentTerms: d.paymentTerms || '', notes: d.notes || '', expectedDate: d.expectedDate ? d.expectedDate.slice(0, 10) : '' });
        setItems(d.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })));
      }).catch(() => navigate('/purchases'));
    }
  }, [id]);

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'productId') {
        const p = products.find(p => p.id === value);
        if (p) next[idx].unitPrice = p.cost;
      }
      next[idx].total = next[idx].quantity * next[idx].unitPrice;
      return next;
    });
  };

  const total = items.reduce((s, i) => s + i.total, 0);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, items };
      isEdit ? await purchasesAPI.update(id, payload) : await purchasesAPI.create(payload);
      navigate('/purchases');
    } catch (err) { setError(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title={isEdit ? 'Editar Pedido de Compra' : 'Novo Pedido de Compra'} backTo="/purchases" />
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="card-header"><h3 className="font-medium">Dados do Pedido</h3></div>
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Fornecedor *</label>
              <select className="form-select" value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))} required>
                <option value="">Selecione...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div><label className="form-label">Entrega Prevista</label><input type="date" className="form-input" value={form.expectedDate} onChange={e => setForm(f => ({ ...f, expectedDate: e.target.value }))} /></div>
            <div><label className="form-label">Cond. Pagamento</label><input className="form-input" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} /></div>
            <div className="md:col-span-2"><label className="form-label">Observações</label><textarea className="form-input h-16 resize-none" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-medium">Itens</h3>
            <button type="button" onClick={() => setItems(p => [...p, emptyItem()])} className="btn btn-sm btn-secondary">+ Item</button>
          </div>
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead><tr><th>Produto *</th><th className="w-24">Qtde</th><th className="w-32">Preço Unit.</th><th className="w-32">Total</th><th className="w-10"></th></tr></thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <select className="form-select" value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} required>
                        <option value="">Selecione...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td><input type="number" step="0.001" min="0.001" className="form-input" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} /></td>
                    <td><input type="number" step="0.01" min="0" className="form-input" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} /></td>
                    <td className="font-medium">{formatCurrency(item.total)}</td>
                    <td>{items.length > 1 && <button type="button" onClick={() => setItems(p => p.filter((_, i) => i !== idx))} className="text-red-400 hover:text-red-600 px-2">✕</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
            <div className="font-bold text-base">Total: <span className="text-primary-600">{formatCurrency(total)}</span></div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/purchases')}>Cancelar</button>
          <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Pedido'}</button>
        </div>
      </form>
    </div>
  );
}
