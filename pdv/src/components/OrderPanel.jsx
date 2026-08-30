import { useState, useRef, useEffect } from 'react'
import { useCart } from '../contexts/CartContext'
import { formatCurrency } from '../utils/format'

export default function OrderPanel({ onCheckout }) {
  const {
    items, discount, setDiscount,
    removeItem, updateQty,
    subtotal, globalDiscountValue, total, isEmpty
  } = useCart()

  const [selectedIdx, setSelectedIdx] = useState(null)
  const [codeInput, setCodeInput] = useState('')
  const [qtdInput, setQtdInput] = useState('1')
  const codeRef = useRef(null)

  // F12 → checkout
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'F12') { e.preventDefault(); if (!isEmpty) onCheckout() }
      if (e.key === 'Delete' && selectedIdx !== null) {
        removeItem(items[selectedIdx]?.product.id)
        setSelectedIdx(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isEmpty, selectedIdx, items])

  function applyQtd() {
    if (selectedIdx !== null && items[selectedIdx]) {
      const qty = parseFloat(qtdInput)
      if (!isNaN(qty) && qty > 0) updateQty(items[selectedIdx].product.id, qty)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Código + Qtde */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-gray-200 bg-[#f0f5ff] shrink-0">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Código</label>
          <input
            ref={codeRef}
            type="text"
            className="input-pdv font-mono text-sm"
            placeholder="Cód. de barras"
            value={codeInput}
            onChange={e => setCodeInput(e.target.value)}
          />
        </div>

        {/* Separador × */}
        <span className="text-gray-400 font-bold mt-4">×</span>

        {/* Qtde com -/+ */}
        <div style={{ width: 130 }}>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Qtde</label>
          <div className="flex items-center border border-gray-300 rounded bg-white overflow-hidden">

            {/* Botão − */}
            <button
              onClick={() => {
                const item = selectedIdx !== null ? items[selectedIdx] : null
                if (item) {
                  const newQty = Math.max(1, item.quantity - 1)
                  updateQty(item.product.id, newQty)
                  setQtdInput(String(newQty))
                } else {
                  const val = Math.max(1, (parseFloat(qtdInput) || 1) - 1)
                  setQtdInput(String(val))
                }
              }}
              className="w-8 h-8 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 font-bold text-lg border-r border-gray-300 transition-colors select-none"
              title="Diminuir 1"
            >−</button>

            {/* Campo numérico */}
            <input
              type="number"
              className="flex-1 text-center text-sm font-bold text-gray-800 py-0.5 focus:outline-none bg-white"
              value={qtdInput}
              onChange={e => setQtdInput(e.target.value)}
              onBlur={applyQtd}
              onKeyDown={e => e.key === 'Enter' && applyQtd()}
              min="1"
              step="1"
            />

            {/* Botão + */}
            <button
              onClick={() => {
                const item = selectedIdx !== null ? items[selectedIdx] : null
                if (item) {
                  const newQty = item.quantity + 1
                  updateQty(item.product.id, newQty)
                  setQtdInput(String(newQty))
                } else {
                  const val = (parseFloat(qtdInput) || 1) + 1
                  setQtdInput(String(val))
                }
              }}
              className="w-8 h-8 flex items-center justify-center bg-green-50 hover:bg-green-100 text-green-700 font-bold text-lg border-l border-gray-300 transition-colors select-none"
              title="Aumentar 1"
            >+</button>

            {/* Remover item */}
            <button
              onClick={() => {
                if (selectedIdx !== null && items[selectedIdx]) {
                  removeItem(items[selectedIdx].product.id)
                  setSelectedIdx(null)
                  setQtdInput('1')
                }
              }}
              className="w-7 h-8 flex items-center justify-center bg-gray-50 hover:bg-red-100 text-gray-400 hover:text-red-500 border-l border-gray-300 transition-colors"
              title="Remover item (Del)"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de itens */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Cabeçalho da tabela */}
        <div className="grid text-[10px] font-bold text-gray-500 uppercase bg-[#e8f0fe] border-b border-gray-200 shrink-0"
          style={{ gridTemplateColumns: '24px 1fr 46px 64px 64px' }}>
          <div className="px-1 py-1 text-center">#</div>
          <div className="px-1 py-1">Produto</div>
          <div className="px-1 py-1 text-center">Qtde</div>
          <div className="px-1 py-1 text-right">Unitário</div>
          <div className="px-1 py-1 text-right pr-2">Total</div>
        </div>

        {/* Linhas */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty && (
            <div className="text-center text-gray-400 mt-10 text-sm">
              <svg className="w-8 h-8 mx-auto mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.4 7h12.8M10 20a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z" />
              </svg>
              <p className="text-xs">Clique em um produto para adicionar</p>
            </div>
          )}
          {items.map((item, idx) => (
            <div
              key={item.product.id}
              onClick={() => { setSelectedIdx(idx); setQtdInput(String(item.quantity)) }}
              onDoubleClick={() => removeItem(item.product.id)}
              className={`grid text-xs border-b border-gray-100 cursor-pointer transition-colors
                ${selectedIdx === idx
                  ? 'bg-orange-100 border-orange-200'
                  : idx % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-[#f5f9ff] hover:bg-blue-50'}`}
              style={{ gridTemplateColumns: '24px 1fr 46px 64px 64px' }}
            >
              <div className="px-1 py-1.5 text-center text-gray-500 font-mono">{idx + 1}</div>
              <div className="px-1 py-1.5 font-semibold text-gray-800 truncate">{item.product.name}</div>
              <div className="px-1 py-1.5 text-center text-gray-700">{item.quantity}</div>
              <div className="px-1 py-1.5 text-right text-gray-600 font-mono">
                {formatCurrency(item.unitPrice)}
              </div>
              <div className="px-1 py-1.5 text-right font-bold text-gray-800 font-mono pr-2">
                {formatCurrency(item.total)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totais */}
      <div className="border-t-2 border-[#1a3a6b] bg-[#1a3a6b] px-3 py-2 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-blue-200 text-sm font-semibold">Valor Total</span>
          {!isEmpty && (
            <button
              onClick={() => {
                const d = prompt('Desconto geral (%)', String(discount))
                const val = parseFloat(d)
                if (!isNaN(val)) setDiscount(Math.max(0, Math.min(val, 100)))
              }}
              className="text-xs text-orange-300 hover:text-orange-200 underline"
            >
              {discount > 0 ? `Desc. ${discount}%` : 'Aplicar desconto'}
            </button>
          )}
        </div>
        <div className="text-right text-white font-bold" style={{ fontSize: '2rem', lineHeight: 1 }}>
          {formatCurrency(total)}
        </div>
        {globalDiscountValue > 0 && (
          <div className="text-right text-orange-300 text-xs mt-0.5">
            Subtotal: {formatCurrency(subtotal)} | Desconto: -{formatCurrency(globalDiscountValue)}
          </div>
        )}
      </div>

      {/* Botões de ação */}
      <div className="grid grid-cols-2 gap-2 p-2 bg-[#f0f5ff] border-t border-gray-200 shrink-0">
        <button
          onClick={() => { if (selectedIdx !== null && items[selectedIdx]) { removeItem(items[selectedIdx].product.id); setSelectedIdx(null) } }}
          disabled={isEmpty}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancelar Item
        </button>
        <button
          onClick={onCheckout}
          disabled={isEmpty}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Receber e Finalizar
        </button>
      </div>
    </div>
  )
}
