import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { customersAPI } from '../../api';
import PageHeader from '../../components/common/PageHeader';

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function CustomerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', tradeName: '', type: 'company', document: '', email: '', phone: '', mobile: '',
    address: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '',
    creditLimit: '', paymentTerms: '', notes: '', active: true
  });

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      customersAPI.get(id)
        .then(res => setForm({ ...res.data.data, creditLimit: res.data.data.creditLimit || '' }))
        .catch(() => navigate('/customers'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, creditLimit: Number(form.creditLimit) || 0 };
      if (isEdit) {
        await customersAPI.update(id, payload);
      } else {
        await customersAPI.create(payload);
      }
      navigate('/customers');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;

  return (
    <div>
      <PageHeader title={isEdit ? 'Editar Cliente' : 'Novo Cliente'} backTo="/customers" />

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic */}
        <div className="card">
          <div className="card-header"><h3 className="font-medium text-gray-700">Dados Principais</h3></div>
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">Nome / Razão Social *</label>
              <input className="form-input" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="form-label">Tipo *</label>
              <select className="form-select" value={form.type} onChange={set('type')}>
                <option value="company">Pessoa Jurídica</option>
                <option value="individual">Pessoa Física</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Nome Fantasia</label>
              <input className="form-input" value={form.tradeName} onChange={set('tradeName')} />
            </div>
            <div>
              <label className="form-label">{form.type === 'company' ? 'CNPJ' : 'CPF'}</label>
              <input className="form-input" value={form.document} onChange={set('document')} />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card">
          <div className="card-header"><h3 className="font-medium text-gray-700">Contato</h3></div>
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="form-label">E-mail</label>
              <input type="email" className="form-input" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="form-label">Telefone</label>
              <input className="form-input" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="form-label">Celular</label>
              <input className="form-input" value={form.mobile} onChange={set('mobile')} />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <div className="card-header"><h3 className="font-medium text-gray-700">Endereço</h3></div>
          <div className="card-body grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="form-label">Logradouro</label>
              <input className="form-input" value={form.address} onChange={set('address')} />
            </div>
            <div>
              <label className="form-label">Número</label>
              <input className="form-input" value={form.number} onChange={set('number')} />
            </div>
            <div>
              <label className="form-label">Complemento</label>
              <input className="form-input" value={form.complement} onChange={set('complement')} />
            </div>
            <div>
              <label className="form-label">Bairro</label>
              <input className="form-input" value={form.neighborhood} onChange={set('neighborhood')} />
            </div>
            <div>
              <label className="form-label">Cidade</label>
              <input className="form-input" value={form.city} onChange={set('city')} />
            </div>
            <div>
              <label className="form-label">Estado</label>
              <select className="form-select" value={form.state} onChange={set('state')}>
                <option value="">Selecione</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">CEP</label>
              <input className="form-input" value={form.zipCode} onChange={set('zipCode')} />
            </div>
          </div>
        </div>

        {/* Commercial */}
        <div className="card">
          <div className="card-header"><h3 className="font-medium text-gray-700">Dados Comerciais</h3></div>
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Limite de Crédito (R$)</label>
              <input type="number" step="0.01" min="0" className="form-input" value={form.creditLimit} onChange={set('creditLimit')} />
            </div>
            <div>
              <label className="form-label">Condição de Pagamento</label>
              <input className="form-input" value={form.paymentTerms} onChange={set('paymentTerms')} placeholder="Ex: 30/60/90" />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input type="checkbox" id="active" checked={form.active} onChange={set('active')} className="w-4 h-4" />
              <label htmlFor="active" className="text-sm text-gray-700">Ativo</label>
            </div>
            <div className="md:col-span-3">
              <label className="form-label">Observações</label>
              <textarea className="form-input h-20 resize-none" value={form.notes} onChange={set('notes')} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/customers')}>Cancelar</button>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Cliente'}
          </button>
        </div>
      </form>
    </div>
  );
}
