import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import ProductPanel from './ProductPanel'
import OrderPanel from './OrderPanel'
import PaymentModal from './PaymentModal'
import CustomerSearch from './CustomerSearch'
import CaixaPanel from './CaixaPanel'
import { hasErpAccess } from '../utils/permissions'
import toast from 'react-hot-toast'

const ERP_URL = 'http://localhost:5173'

const TABS = [
  { id: 'venda',    label: 'Venda',    icon: '🛒' },
  { id: 'caixa',   label: 'Caixa',    icon: '💰' },
]

export default function PDVMain() {
  const { user, logout } = useAuth()
  const { customer, setCustomer, clearCart } = useCart()
  const [activeTab, setActiveTab] = useState('venda')
  const [showPayment, setShowPayment] = useState(false)
  const [lastSale, setLastSale] = useState(null)

  const [caixaRefresh, setCaixaRefresh] = useState(0)

  function handleSaleComplete(sale) {
    setLastSale(sale)
    setShowPayment(false)
    clearCart()
    setCaixaRefresh(r => r + 1)
    toast.success(`Venda ${sale.number} finalizada com sucesso!`, { duration: 4000 })
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="flex items-center bg-[#1a3a6b] text-white px-3 py-0 shrink-0 select-none" style={{ height: 46 }}>
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4 pr-4 border-r border-[#2a5a9b]" style={{ minWidth: 160 }}>
          <div className="w-7 h-7 bg-orange-500 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.4 7h12.8" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-wide">PDV Sistema</span>
        </div>

        {/* Tabs de navegação */}
        <nav className="flex items-center gap-1 flex-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 h-[46px] text-sm font-semibold border-b-2 transition-colors
                ${activeTab === tab.id
                  ? 'border-orange-400 text-orange-300 bg-[#0f2b58]'
                  : 'border-transparent text-blue-200 hover:text-white hover:bg-[#163060]'}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Info do usuário + último pedido */}
        <div className="flex items-center gap-2 text-xs text-blue-300 ml-auto">
          {lastSale && (
            <span className="hidden lg:block">
              Último: <strong className="text-orange-300">{lastSale.number}</strong>
            </span>
          )}

          <span className="hidden md:block text-blue-200">
            <strong className="text-white">{user?.name}</strong>
            {user?.role?.name && (
              <span className="ml-1 text-blue-400">({user.role.name})</span>
            )}
          </span>

          {/* Botão Acessar ERP — só aparece se tiver permissão */}
          {hasErpAccess(user) && (
            <a
              href={ERP_URL}
              target="_blank"
              rel="noreferrer"
              title="Abrir ERP"
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-400 text-white font-semibold px-3 py-1 rounded transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="hidden sm:inline">Acessar ERP</span>
            </a>
          )}

          <button onClick={logout} title="Sair"
            className="flex items-center gap-1 bg-[#0f2b58] hover:bg-[#0c2247] px-2 py-1 rounded text-blue-300 hover:text-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────── */}
      {activeTab === 'venda' ? (
        <div className="flex flex-1 overflow-hidden gap-2 p-2 bg-[#dde9f8]">
          {/* Lado esquerdo: categorias + produtos */}
          <div className="flex flex-col flex-1 overflow-hidden bg-white rounded border border-gray-300 shadow-sm">
            {/* Busca de cliente */}
            <div className="px-2 pt-2 pb-1 border-b border-gray-200">
              <CustomerSearch
                selected={customer}
                onSelect={setCustomer}
                onClear={() => setCustomer(null)}
              />
            </div>
            <ProductPanel />
          </div>

          {/* Lado direito: pedido */}
          <div className="flex flex-col shrink-0 bg-white rounded border border-gray-300 shadow-sm" style={{ width: 380 }}>
            <OrderPanel onCheckout={() => setShowPayment(true)} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden bg-[#dde9f8]">
          <CaixaPanel refreshKey={caixaRefresh} />
        </div>
      )}

      {/* ── Status bar ──────────────────────────────────────────── */}
      <footer className="flex items-center justify-between px-3 py-0.5 bg-[#1a3a6b] text-blue-300 text-xs shrink-0">
        <span>PDV Versão 1.0</span>
        <span>Caixa 01</span>
        <span>Usuário: {user?.name} | {new Date().toLocaleDateString('pt-BR')}</span>
      </footer>

      {/* Modal de pagamento */}
      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onComplete={handleSaleComplete}
        />
      )}
    </div>
  )
}
