import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { servicesAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';

export default function ServiceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', code: '', description: '', unit: 'HR', price: '', duration: '', active: true });

  useEffect(() => {
    if (isEdit) servicesAPI.get(id).then(res => setForm({ ...res.data.data, price: res.data.data.price || '', duration: res.data.data.duration || '' })).catch(() => navigate('/services'));
  }, [id]);

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price) || 0, duration: Number(form.duration) || null };
      isEdit ? await servicesAPI.update(id, payload) : await servicesAPI.create(payload);
      navigate('/services');
    } catch (err) { setError(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title={isEdit ? 'Editar Serviço' : 'Novo Serviço'} backTo="/services" />
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2"><label className="form-label">Nome *</label><input className="form-input" value={form.name} onChange={set('name')} required /></div>
            <div><label className="form-label">Código</label><input className="form-input" value={form.code} onChange={set('code')} /></div>
            <div className="md:col-span-3"><label className="form-label">Descrição</label><textarea className="form-input h-20 resize-none" value={form.description} onChange={set('description')} /></div>
            <div><label className="form-label">Preço (R$) *</label><input type="number" step="0.01" min="0" className="form-input" value={form.price} onChange={set('price')} required /></div>
            <div><label className="form-label">Unidade</label>
              <select className="form-select" value={form.unit} onChange={set('unit')}>
                {['HR','DI','UN','PCT'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div><label className="form-label">Duração (minutos)</label><input type="number" min="0" className="form-input" value={form.duration} onChange={set('duration')} /></div>
            <div className="flex items-center gap-2 mt-5"><input type="checkbox" id="active" checked={form.active} onChange={set('active')} className="w-4 h-4" /><label htmlFor="active" className="text-sm">Ativo</label></div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/services')}>Cancelar</button>
          <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Serviço'}</button>
        </div>
      </form>
    </div>
  );
}
