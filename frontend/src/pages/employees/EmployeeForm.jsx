import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employeesAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', code: '', email: '', phone: '', document: '', position: '', department: '', salary: '', active: true });

  useEffect(() => {
    if (isEdit) employeesAPI.get(id).then(res => setForm({ ...res.data.data, salary: res.data.data.salary || '' })).catch(() => navigate('/employees'));
  }, [id]);

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, salary: Number(form.salary) || null };
      isEdit ? await employeesAPI.update(id, payload) : await employeesAPI.create(payload);
      navigate('/employees');
    } catch (err) { setError(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title={isEdit ? 'Editar Funcionário' : 'Novo Funcionário'} backTo="/employees" />
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2"><label className="form-label">Nome *</label><input className="form-input" value={form.name} onChange={set('name')} required /></div>
            <div><label className="form-label">Código</label><input className="form-input" value={form.code} onChange={set('code')} /></div>
            <div><label className="form-label">E-mail</label><input type="email" className="form-input" value={form.email} onChange={set('email')} /></div>
            <div><label className="form-label">Telefone</label><input className="form-input" value={form.phone} onChange={set('phone')} /></div>
            <div><label className="form-label">CPF</label><input className="form-input" value={form.document} onChange={set('document')} /></div>
            <div><label className="form-label">Cargo</label><input className="form-input" value={form.position} onChange={set('position')} /></div>
            <div><label className="form-label">Departamento</label><input className="form-input" value={form.department} onChange={set('department')} /></div>
            <div><label className="form-label">Salário (R$)</label><input type="number" step="0.01" min="0" className="form-input" value={form.salary} onChange={set('salary')} /></div>
            <div className="flex items-center gap-2 mt-5"><input type="checkbox" id="active" checked={form.active} onChange={set('active')} className="w-4 h-4" /><label htmlFor="active" className="text-sm">Ativo</label></div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/employees')}>Cancelar</button>
          <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar Funcionário'}</button>
        </div>
      </form>
    </div>
  );
}
