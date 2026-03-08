import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';

const MODULES = ['customers', 'suppliers', 'products', 'services', 'employees', 'sales', 'purchases', 'inventory', 'financial', 'reports', 'admin', 'users'];
const ACTIONS = ['read', 'write', 'delete'];

export default function AdminRoles() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', permissions: {} });

  const load = async () => {
    setLoading(true);
    try { const res = await adminAPI.roles.list(); setData(res.data.data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (role) => {
    setEditing(role);
    setForm({ name: role.name, description: role.description || '', permissions: JSON.parse(role.permissions || '{}') });
    setError(''); setModal(true);
  };

  const openNew = () => {
    setEditing(null);
    const perms = {};
    MODULES.forEach(m => { perms[m] = []; });
    setForm({ name: '', description: '', permissions: perms });
    setError(''); setModal(true);
  };

  const togglePerm = (module, action) => {
    setForm(f => {
      const current = f.permissions[module] || [];
      const next = current.includes(action) ? current.filter(a => a !== action) : [...current, action];
      return { ...f, permissions: { ...f.permissions, [module]: next } };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      editing ? await adminAPI.roles.update(editing.id, form) : await adminAPI.roles.create(form);
      setModal(false); load();
    } catch (err) { setError(err.response?.data?.error || 'Erro'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div>
      <PageHeader title="Perfis de Acesso" subtitle={`${data.length} perfis`}
        actions={<button onClick={openNew} className="btn btn-primary">+ Novo Perfil</button>}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(role => {
          const perms = JSON.parse(role.permissions || '{}');
          return (
            <div key={role.id} className="card">
              <div className="card-header flex items-center justify-between">
                <div>
                  <div className="font-semibold capitalize">{role.name}</div>
                  <div className="text-xs text-gray-400">{role._count?.users || 0} usuários</div>
                </div>
                <button onClick={() => openEdit(role)} className="btn btn-sm btn-secondary">Editar</button>
              </div>
              <div className="card-body">
                <div className="space-y-1 text-xs">
                  {MODULES.map(m => {
                    const mp = perms[m] || [];
                    return mp.length > 0 ? (
                      <div key={m} className="flex justify-between">
                        <span className="text-gray-600 capitalize">{m}</span>
                        <span className="text-gray-500">{mp.join(', ')}</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar Perfil' : 'Novo Perfil'} size="lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="form-label">Nome *</label><input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><label className="form-label">Descrição</label><input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          </div>
          <div>
            <label className="form-label">Permissões</label>
            <div className="border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50"><th className="px-3 py-2 text-left">Módulo</th>{ACTIONS.map(a => <th key={a} className="px-3 py-2 text-center capitalize">{a}</th>)}</tr></thead>
                <tbody>
                  {MODULES.map(m => (
                    <tr key={m} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 capitalize font-medium">{m}</td>
                      {ACTIONS.map(a => (
                        <td key={a} className="px-3 py-2 text-center">
                          <input type="checkbox" checked={(form.permissions[m] || []).includes(a)} onChange={() => togglePerm(m, a)} className="w-4 h-4" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Perfil'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
