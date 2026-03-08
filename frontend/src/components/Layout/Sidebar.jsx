import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { label: 'Dashboard', icon: '📊', path: '/', exact: true },
  {
    label: 'Cadastros',
    icon: '📁',
    children: [
      { label: 'Clientes', path: '/customers', icon: '👥' },
      { label: 'Fornecedores', path: '/suppliers', icon: '🏭' },
      { label: 'Produtos', path: '/products', icon: '📦' },
      { label: 'Serviços', path: '/services', icon: '🔧' },
      { label: 'Funcionários', path: '/employees', icon: '👤' },
    ]
  },
  {
    label: 'Vendas',
    icon: '💰',
    children: [
      { label: 'Pedidos de Venda', path: '/sales', icon: '🛒' },
    ]
  },
  {
    label: 'Compras',
    icon: '🛍️',
    children: [
      { label: 'Pedidos de Compra', path: '/purchases', icon: '📋' },
    ]
  },
  {
    label: 'Estoque',
    icon: '🏪',
    children: [
      { label: 'Posição de Estoque', path: '/inventory', icon: '📊' },
      { label: 'Movimentações', path: '/inventory/movements', icon: '↕️' },
    ]
  },
  {
    label: 'Financeiro',
    icon: '💳',
    children: [
      { label: 'Contas a Pagar', path: '/financial/payables', icon: '📤' },
      { label: 'Contas a Receber', path: '/financial/receivables', icon: '📥' },
      { label: 'Fluxo de Caixa', path: '/financial/cashflow', icon: '💱' },
    ]
  },
  {
    label: 'Ordens de Serviço',
    icon: '🔩',
    children: [
      { label: 'Ordens de Serviço', path: '/service-orders', icon: '📝' },
    ]
  },
  { label: 'Relatórios', icon: '📈', path: '/reports' },
  {
    label: 'Administração',
    icon: '⚙️',
    children: [
      { label: 'Usuários', path: '/admin/users', icon: '👥' },
      { label: 'Perfis de Acesso', path: '/admin/roles', icon: '🔐' },
      { label: 'Logs de Auditoria', path: '/admin/audit', icon: '📋' },
    ]
  }
];

const NavItem = ({ item }) => {
  const location = useLocation();
  const [expanded, setExpanded] = useState(() => {
    if (item.children) {
      return item.children.some(c => location.pathname.startsWith(c.path));
    }
    return false;
  });

  if (item.children) {
    const isActive = item.children.some(c => location.pathname.startsWith(c.path));
    return (
      <div>
        <button
          onClick={() => setExpanded(e => !e)}
          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm rounded-md transition-colors duration-150
            ${isActive ? 'bg-white/10 text-white font-medium' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
        >
          <span className="flex items-center gap-3">
            <span className="text-base">{item.icon}</span>
            {item.label}
          </span>
          <span className={`text-xs transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>▶</span>
        </button>
        {expanded && (
          <div className="ml-4 mt-0.5 space-y-0.5">
            {item.children.map(child => (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-colors duration-150
                  ${isActive ? 'bg-primary-600 text-white font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`
                }
              >
                <span className="text-sm">{child.icon}</span>
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      end={item.exact}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 text-sm rounded-md transition-colors duration-150
        ${isActive ? 'bg-primary-600 text-white font-medium' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`
      }
    >
      <span className="text-base">{item.icon}</span>
      {item.label}
    </NavLink>
  );
};

export default function Sidebar({ open }) {
  const { user } = useAuth();

  return (
    <aside className={`${open ? 'w-64' : 'w-0 overflow-hidden'} transition-all duration-300 bg-sidebar flex flex-col h-full shrink-0`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">E</div>
        <div>
          <div className="text-white font-bold text-sm leading-tight">ERP</div>
          <div className="text-gray-400 text-xs">Corporativo v1.0</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
        {menuItems.map((item, i) => <NavItem key={i} item={item} />)}
      </nav>

      {/* User info */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs font-medium truncate">{user?.name}</div>
            <div className="text-gray-400 text-xs truncate capitalize">{user?.role?.name}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
