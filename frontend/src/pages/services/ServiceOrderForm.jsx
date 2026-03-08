import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { serviceOrdersAPI, servicesAPI, customersAPI, employeesAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';

export default function ServiceOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ serviceId: '', customerId: '', employeeId: '', priority: 'normal', scheduledAt: '', price: '', description: '', notes: '' });

  useEffect(() => {
    servicesAPI.list({ limit: 100, active: true }).then(r => setServices(r.data.data));
    customersAPI.list({ limit: 100, active: true }).then(r => setCustomers(r.data.data));
    employeesAPI.list({ limit: 100, active: true }).then(r => setEmployees(r.data.data));
    if (isEdit) {
      serviceOrdersAPI.get(id).then(res => {
        const d = res.data.data;
        setForm({ ...d, price: d.price || '', scheduledAt: d.scheduledAt ? d.scheduledAt.slice(0, 16) : '', customerId: d.customerId || '', employeeId: d.employeeId || '' });
      }).catch(() => navigate('/service-orders'));
    }
  }, [id]);

  const set = (f) => (e) => setForm(v => ({ ...v, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price) || 0 };
      isEdit ? await serviceOrdersAPI.update(id, payload) : await serviceOrdersAPI.create(payload);
      navigate('/service-orders');
    } catch (err) { setError(err.response?.data?.error || 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title={isEdit ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'} backTo="/service-orders" />
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Serviço *</label>
              <select className="form-select" value={form.serviceId} onChange={set('serviceId')} required>
                <option value="">Selecione...</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Prioridade</label>
              <select className="form-select" value={form.priority} onChange={set('priority')}>
                <option value="low">Baixa</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div>
              <label className="form-label">Cliente</label>
              <select className="form-select" value={form.customerId} onChange={set('customerId')}>
                <option value="">Sem cliente</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Responsável</label>
              <select className="form-select" value={form.employeeId} onChange={set('employeeId')}>
                <option value="">Sem responsável</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Agendamento</label>
              <input type="datetime-local" className="form-input" value={form.scheduledAt} onChange={set('scheduledAt')} />
            </div>
            <div>
              <label className="form-label">Valor (R$)</label>
              <input type="number" step="0.01" min="0" className="form-input" value={form.price} onChange={set('price')} />
            </div>
            <div className="md:col-span-3">
              <label className="form-label">Descrição</label>
              <textarea className="form-input h-20 resize-none" value={form.description} onChange={set('description')} />
            </div>
            <div className="md:col-span-3">
              <label className="form-label">Observações</label>
              <textarea className="form-input h-16 resize-none" value={form.notes} onChange={set('notes')} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/service-orders')}>Cancelar</button>
          <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar OS'}</button>
        </div>
      </form>
    </div>
  );
}
