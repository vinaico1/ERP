import React from 'react';

const STATUS_MAP = {
  // Sales/Purchases
  draft:      { label: 'Rascunho',    class: 'badge-gray' },
  confirmed:  { label: 'Confirmado',  class: 'badge-blue' },
  invoiced:   { label: 'Faturado',    class: 'badge-green' },
  sent:       { label: 'Enviado',     class: 'badge-blue' },
  partial:    { label: 'Parcial',     class: 'badge-yellow' },
  received:   { label: 'Recebido',    class: 'badge-green' },
  cancelled:  { label: 'Cancelado',   class: 'badge-red' },
  // Financial
  pending:    { label: 'Pendente',    class: 'badge-yellow' },
  paid:       { label: 'Pago',        class: 'badge-green' },
  overdue:    { label: 'Vencido',     class: 'badge-red' },
  // Service orders
  open:       { label: 'Aberto',      class: 'badge-blue' },
  in_progress:{ label: 'Em andamento',class: 'badge-orange' },
  done:       { label: 'Concluído',   class: 'badge-green' },
  // User
  true:       { label: 'Ativo',       class: 'badge-green' },
  false:      { label: 'Inativo',     class: 'badge-gray' },
};

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[String(status)] || { label: status, class: 'badge-gray' };
  return <span className={s.class}>{s.label}</span>;
}
