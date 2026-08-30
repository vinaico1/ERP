import { useState, useEffect, useRef } from 'react'
import { useCart } from '../contexts/CartContext'
import { salesAPI } from '../api'
import { formatCurrency } from '../utils/format'
import NFeModal from './NFeModal'
import toast from 'react-hot-toast'

const PAYMENT_METHODS = [
  { id: 'cash',        label: 'Dinheiro',         icon: '💵' },
  { id: 'credit_card', label: 'Cartão Crédito',    icon: '💳' },
  { id: 'debit_card',  label: 'Cartão Débito',     icon: '💳' },
  { id: 'pix',         label: 'PIX',               icon: '⚡' },
  { id: 'mixed',       label: 'Misto',             icon: '🔀' },
]

export default function PaymentModal({ onClose, onComplete }) {
  const { items, customer, discount, total, globalDiscountValue, subtotal } = useCart()
  const [method, setMethod] = useState('cash')
  const [cashReceived, setCashReceived] = useState('')
  const [loading, setLoading] = useState(false)
  const [createdOrder, setCreatedOrder] = useState(null)
  const cashRef = useRef(null)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'F12') { e.preventDefault(); handleConfirm() }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [method, cashReceived])

  useEffect(() => {
    if (method === 'cash') { cashRef.current?.focus(); cashRef.current?.select() }
  }, [method])

  const cashNum = parseFloat(cashReceived) || 0
  const troco = method === 'cash' ? Math.max(0, cashNum - total) : 0

  async function handleConfirm() {
    if (loading) return
    if (method === 'cash' && cashNum < total) {
      toast.error('Valor recebido menor que o total'); return
    }
    setLoading(true)
    try {
      const payload = {
        customerId: customer?.id || undefined,
        items: items.map(i => ({
          productId: i.product.id,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discount: i.discount || 0
        })),
        discount: globalDiscountValue,
        paymentTerms: 'À vista',
        paymentMethod: method,
        origin: 'pdv',
        notes: `PDV - ${PAYMENT_METHODS.find(m => m.id === method)?.label}`
      }

      const { data: created } = await salesAPI.create(payload)
      const orderId = created.data.id
      await salesAPI.updateStatus(orderId, 'confirmed')
      await salesAPI.updateStatus(orderId, 'invoiced')
      const { data: orderData } = await salesAPI.getOne(orderId)
      setCreatedOrder(orderData.data)
    } catch (err) {
      toast.error(err.message || err.response?.data?.error || 'Erro ao registrar venda')
      setLoading(false)
    }
  }

  // Após criar pedido → NFeModal
  if (createdOrder) {
    return (
      <NFeModal
        orderId={createdOrder.id}
        orderNumber={createdOrder.number}
        paymentMethod={method}
        onClose={() => onComplete(createdOrder)}
      />
    )
  }

  // Atalhos de troco rápido
  const quickAmounts = [...new Set([
    total,
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 50) * 50,
    Math.ceil(total / 100) * 100
  ])].slice(0, 4)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg slide-up overflow-hidden border border-gray-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#1a3a6b] text-white">
          <h2 className="text-base font-bold">Receber Pagamento</h2>
          <button onClick={onClose} className="text-blue-300 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Resumo */}
          <div className="bg-[#f0f5ff] rounded-lg p-3 border border-blue-200">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{items.length} {items.length === 1 ? 'item' : 'itens'}</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {globalDiscountValue > 0 && (
              <div className="flex justify-between text-sm text-orange-600 font-medium mt-0.5">
                <span>Desconto ({discount}%)</span>
                <span>- {formatCurrency(globalDiscountValue)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold mt-1 pt-1 border-t border-blue-200">
              <span className="text-[#1a3a6b]">TOTAL</span>
              <span className="text-green-700">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Formas de pagamento */}
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">Forma de Pagamento</p>
            <div className="grid grid-cols-5 gap-1.5">
              {PAYMENT_METHODS.map(pm => (
                <button key={pm.id} onClick={() => setMethod(pm.id)}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded border-2 text-xs font-semibold transition-all
                    ${method === pm.id
                      ? 'border-[#1a3a6b] bg-[#1a3a6b] text-white'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-blue-400'}`}
                >
                  <span className="text-lg">{pm.icon}</span>
                  <span className="text-center leading-tight">{pm.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Troco (dinheiro) */}
          {method === 'cash' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor Recebido</label>
                  <input ref={cashRef} type="number" className="input-pdv text-lg font-bold text-center"
                    placeholder="0,00" value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)} step="0.01" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Troco</label>
                  <div className={`w-full rounded px-3 py-1.5 text-lg font-bold text-center border
                    ${troco > 0 ? 'bg-green-50 border-green-400 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                    {formatCurrency(troco)}
                  </div>
                </div>
              </div>
              {/* Atalhos */}
              <div className="flex gap-1.5 flex-wrap">
                {quickAmounts.map(v => (
                  <button key={v} onClick={() => setCashReceived(String(v))}
                    className="px-3 py-1 bg-gray-100 hover:bg-blue-100 border border-gray-300 hover:border-blue-400 rounded text-sm font-semibold text-gray-700 transition-colors">
                    {formatCurrency(v)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cliente selecionado */}
          {customer && (
            <div className="flex items-center gap-2 text-sm bg-blue-50 border border-blue-200 rounded px-3 py-1.5">
              <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-gray-600">Cliente: <strong className="text-gray-800">{customer.name}</strong></span>
            </div>
          )}

          {!customer && (
            <div className="flex items-center gap-2 text-xs bg-yellow-50 border border-yellow-300 rounded px-3 py-2 text-yellow-700">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nenhum cliente selecionado — a venda será registrada como Consumidor Final.
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="grid grid-cols-2 gap-3 px-5 pb-5">
          <button onClick={onClose} disabled={loading}
            className="flex items-center justify-center gap-2 border-2 border-red-500 text-red-600 hover:bg-red-50 font-bold py-3 rounded transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancelar (Esc)
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || (method === 'cash' && cashNum < total)}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded transition-colors">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processando...</>
              : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>Confirmar (F12)</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
