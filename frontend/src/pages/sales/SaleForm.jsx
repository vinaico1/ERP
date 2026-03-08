import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { salesAPI, customersAPI, productsAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { formatCurrency } from '../../utils/format';

const emptyItem = () => ({ productId: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 });

export default function SaleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ customerId: '', paymentTerms: '', notes: '', dueDate: '' });
  const [items, setItems] = useState([emptyItem()]);
  const [stockWarning, setStockWarning] = useState(null);

  useEffect(() => {
    customersAPI.list({ limit: 100, active: true }).then(r => setCustomers(r.data.data));
    productsAPI.list({ limit: 200, active: true }).then(r => setProducts(r.data.data));
    if (isEdit) {
      salesAPI.get(id).then(res => {
        const d = res.data.data;
        setForm({ customerId: d.customerId, paymentTerms: d.paymentTerms || '', notes: d.notes || '', dueDate: d.dueDate ? d.dueDate.slice(0, 10) : '' });
        setItems(d.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount, total: i.total })));
      }).catch(() => navigate('/sales'));
    }
  }, [id]);

  const updateItem = (idx, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'productId') {
        const p = products.find(p => p.id === value);
        if (p) next[idx].unitPrice = p.price;
      }
      const item = next[idx];
      next[idx].total = (item.quantity * item.unitPrice) - item.discount;

      // Verifica estoque
      const productId = field === 'productId' ? value : item.productId;
      const quantity = field === 'quantity' ? value : item.quantity;
      const prod = products.find(p => p.id === productId);
      if (prod && prod.inventory) {
        const emEstoque = prod.inventory.quantity ?? 0;
        if (quantity > emEstoque) {
          const dueDate = form.dueDate ? new Date(form.dueDate) : null;
          const hoje = new Date();
          const diasPrazo = dueDate ? Math.ceil((dueDate - hoje) / (1000 * 60 * 60 * 24)) : 0;
          const prazoLongo = diasPrazo > 60;
          setStockWarning({ productName: prod.name, emEstoque, pedido: quantity, prazoLongo, diasPrazo });
        }
      }

      return next;
    });
  };

  const addItem = () => setItems(p => [...p, emptyItem()]);
  const removeItem = (idx) => setItems(p => p.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
  const discount = items.reduce((s, i) => s + (i.discount || 0), 0);
  const total = subtotal - discount;

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const dueDate = form.dueDate ? new Date(form.dueDate) : null;
      const hoje = new Date();
      const diasPrazo = dueDate ? Math.ceil((dueDate - hoje) / (1000 * 60 * 60 * 24)) : 0;
      const prazoLongo = diasPrazo > 60;

      for (const item of items) {
        const prod = products.find(p => p.id === item.productId);
        if (prod && prod.inventory) {
          const emEstoque = prod.inventory.quantity ?? 0;
          if (item.quantity > emEstoque && !prazoLongo) {
            setError(`Estoque insuficiente para "${prod.name}": ${emEstoque} em estoque, ${item.quantity} pedido(s). Ajuste o prazo de entrega para mais de 60 dias ou reduza a quantidade.`);
            setSaving(false);
            return;
          }
        }
      }

      const payload = { ...form, items };
      isEdit ? await salesAPI.update(id, payload) : await salesAPI.create(payload);
      navigate('/sales');
    } catch (err) { setError(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <Modal isOpen={!!stockWarning} onClose={() => setStockWarning(null)} title="Estoque Insuficiente" size="sm">
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${stockWarning?.prazoLongo ? 'bg-yellow-100' : 'bg-red-100'}`}>
              <svg className={`w-5 h-5 ${stockWarning?.prazoLongo ? 'text-yellow-600' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                O produto <span className="font-semibold">{stockWarning?.productName}</span> possui apenas{' '}
                <span className="font-semibold text-red-600">{stockWarning?.emEstoque}</span> unidade(s) em estoque,
                mas a quantidade pedida é{' '}
                <span className="font-semibold text-red-600">{stockWarning?.pedido}</span>.
              </p>
              {stockWarning?.prazoLongo ? (
                <p className="text-sm text-yellow-700 mt-2 font-medium">
                  O prazo de entrega é de <span className="font-semibold">{stockWarning.diasPrazo} dias</span> (superior a 60 dias).
                  A venda pode ser realizada mediante aceite do cliente quanto ao prazo de entrega.
                </p>
              ) : (
                <p className="text-sm text-red-700 mt-2 font-medium">
                  O prazo de entrega é inferior a 60 dias. Não é possível confirmar este pedido sem estoque suficiente.
                  Ajuste a quantidade, o prazo de entrega ou reponha o estoque.
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            {stockWarning?.prazoLongo ? (
              <button className="btn btn-primary" onClick={() => setStockWarning(null)}>Cliente aceita o prazo — prosseguir</button>
            ) : (
              <button className="btn btn-secondary" onClick={() => setStockWarning(null)}>Fechar</button>
            )}
          </div>
        </div>
      </Modal>

      <PageHeader title={isEdit ? 'Editar Pedido de Venda' : 'Novo Pedido de Venda'} backTo="/sales" />
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="card-header"><h3 className="font-medium">Dados do Pedido</h3></div>
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Cliente *</label>
              <select className="form-select" value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} required>
                <option value="">Selecione o cliente...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Vencimento</label>
              <input type="date" className="form-input" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Condição de Pagamento</label>
              <input className="form-input" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} placeholder="Ex: À vista, 30/60" />
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Observações</label>
              <textarea className="form-input h-16 resize-none" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-medium">Itens do Pedido</h3>
            <button type="button" onClick={addItem} className="btn btn-sm btn-secondary">+ Adicionar Item</button>
          </div>
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead>
                <tr>
                  <th>Produto *</th>
                  <th className="w-24">Qtde</th>
                  <th className="w-32">Preço Unit.</th>
                  <th className="w-28">Desconto</th>
                  <th className="w-32">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <select className="form-select" value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} required>
                        <option value="">Selecione...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                      </select>
                    </td>
                    <td><input type="number" step="0.001" min="0.001" className="form-input" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} required /></td>
                    <td><input type="number" step="0.01" min="0" className="form-input" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} required /></td>
                    <td><input type="number" step="0.01" min="0" className="form-input" value={item.discount} onChange={e => updateItem(idx, 'discount', Number(e.target.value))} /></td>
                    <td className="font-medium">{formatCurrency(item.total)}</td>
                    <td>
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 px-2">✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-8 text-sm">
            <div className="text-gray-500">Subtotal: <span className="font-medium text-gray-800">{formatCurrency(subtotal)}</span></div>
            <div className="text-gray-500">Desconto: <span className="font-medium text-red-600">-{formatCurrency(discount)}</span></div>
            <div className="text-gray-700 font-semibold text-base">Total: <span className="text-primary-600">{formatCurrency(total)}</span></div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/sales')}>Cancelar</button>
          <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Pedido'}</button>
        </div>
      </form>
    </div>
  );
}
