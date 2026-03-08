import React, { useState, useEffect, useCallback } from 'react';
import { usersAPI, adminAPI } from '../../api';
import { Table, Pagination } from '../../components/common/Table';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import { formatDateTime } from '../../utils/format';

export default function AdminUsers() {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', roleId: '', active: true });
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        usersAPI.list({ page, limit: 15 }),
        adminAPI.roles.list()
      ]);
      setData(usersRes.data.data); setPagination(usersRes.data.pagination);
      setRoles(rolesRes.data.data);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', roleId: user.roleId, active: user.active });
    setError('');
    setModal(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', roleId: roles[0]?.id || '', active: true });
    setError('');
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      editing ? await usersAPI.update(editing.id, payload) : await usersAPI.create(payload);
      setModal(false); load();
    } catch (err) { setError(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const columns = [
    { header: 'Nome', render: r => <div><div className="font-medium">{r.name}</div><div className="text-xs text-gray-400">{r.email}</div></div> },
    { header: 'Perfil', render: r => <span className="badge-blue capitalize">{r.role?.name}</span> },
    { header: 'Último Acesso', render: r => formatDateTime(r.lastLogin) },
    { header: 'Status', render: r => <span className={r.active ? 'badge-green' : 'badge-gray'}>{r.active ? 'Ativo' : 'Inativo'}</span> },
    { header: '', render: r => <button onClick={() => openEdit(r)} className="btn btn-sm btn-secondary">Editar</button> }
  ];

  return (
    <div>
      <PageHeader title="Usuários do Sistema" subtitle={`${pagination?.total || 0} usuários`}
        actions={<button onClick={openNew} className="btn btn-primary">+ Novo Usuário</button>}
      />
      <div className="card">
        <Table columns={columns} data={data} loading={loading} />
        <Pagination pagination={pagination} onPageChange={setPage} />
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editing ? 'Editar Usuário' : 'Novo Usuário'}>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
          <div><label className="form-label">Nome *</label><input className="form-input" value={form.name} onChange={set('name')} required /></div>
          <div><label className="form-label">E-mail *</label><input type="email" className="form-input" value={form.email} onChange={set('email')} required /></div>
          <div><label className="form-label">{editing ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}</label><input type="password" className="form-input" value={form.password} onChange={set('password')} required={!editing} /></div>
          <div><label className="form-label">Perfil *</label>
            <select className="form-select" value={form.roleId} onChange={set('roleId')} required>
              <option value="">Selecione...</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" id="active" checked={form.active} onChange={set('active')} className="w-4 h-4" /><label htmlFor="active" className="text-sm">Ativo</label></div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Salvando...' : editing ? 'Salvar' : 'Criar Usuário'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
