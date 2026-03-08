import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productsAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '', code: '', description: '', unit: 'UN', price: '', cost: '',
    minStock: '', maxStock: '', ncm: '', categoryId: '', active: true
  });

  useEffect(() => {
    productsAPI.categories().then(res => setCategories(res.data.data));
    if (isEdit) {
      setLoading(true);
      productsAPI.get(id).then(res => {
        const d = res.data.data;
        setForm({ ...d, price: d.price || '', cost: d.cost || '', minStock: d.minStock || '', maxStock: d.maxStock || '', categoryId: d.categoryId || '' });
      }).catch(() => navigate('/products')).finally(() => setLoading(false));
    }
  }, [id]);

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price) || 0, cost: Number(form.cost) || 0, minStock: Number(form.minStock) || 0, maxStock: Number(form.maxStock) || 0 };
      isEdit ? await productsAPI.update(id, payload) : await productsAPI.create(payload);
      navigate('/products');
    } catch (err) { setError(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div>
      <PageHeader title={isEdit ? 'Editar Produto' : 'Novo Produto'} backTo="/products" />
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <div className="card-header"><h3 className="font-medium text-gray-700">Dados do Produto</h3></div>
          <div className="card-body grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3"><label className="form-label">Nome *</label><input className="form-input" value={form.name} onChange={set('name')} required /></div>
            <div><label className="form-label">Código</label><input className="form-input" value={form.code} onChange={set('code')} placeholder="Gerado automaticamente" /></div>
            <div className="md:col-span-4"><label className="form-label">Descrição</label><textarea className="form-input h-20 resize-none" value={form.description} onChange={set('description')} /></div>
            <div><label className="form-label">Unidade</label>
              <select className="form-select" value={form.unit} onChange={set('unit')}>
                {['UN','PCT','CX','KG','LT','MT','HR','DI'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div><label className="form-label">Categoria</label>
              <select className="form-select" value={form.categoryId} onChange={set('categoryId')}>
                <option value="">Sem categoria</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div><label className="form-label">NCM</label><input className="form-input" value={form.ncm} onChange={set('ncm')} /></div>
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" id="active" checked={form.active} onChange={set('active')} className="w-4 h-4" />
              <label htmlFor="active" className="text-sm">Ativo</label>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="font-medium text-gray-700">Preços e Estoque</h3></div>
          <div className="card-body grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><label className="form-label">Preço de Venda (R$)</label><input type="number" step="0.01" min="0" className="form-input" value={form.price} onChange={set('price')} /></div>
            <div><label className="form-label">Custo (R$)</label><input type="number" step="0.01" min="0" className="form-input" value={form.cost} onChange={set('cost')} /></div>
            <div><label className="form-label">Estoque Mínimo</label><input type="number" step="0.001" min="0" className="form-input" value={form.minStock} onChange={set('minStock')} /></div>
            <div><label className="form-label">Estoque Máximo</label><input type="number" step="0.001" min="0" className="form-input" value={form.maxStock} onChange={set('maxStock')} /></div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/products')}>Cancelar</button>
          <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Produto'}</button>
        </div>
      </form>
    </div>
  );
}
