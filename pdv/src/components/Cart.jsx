import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { formatCurrency } from '../utils/format'

export default function Cart({ onCheckout }) {
  const {
    items, discount, setDiscount,
    removeItem, updateQty, updateItemDiscount,
    subtotal, globalDiscountValue, total, isEmpty
  } = useCart()

  const [editingDiscount, setEditingDiscount] = useState(false)
  const [discountInput, setDiscountInput] = useState('')

  function applyDiscount() {
    const val = parseFloat(discountInput) || 0
    setDiscount(Math.max(0, Math.min(val, 100)))
    setEditingDiscount(false)
  }

  return (
    <div className="flex flex-col h-full bg-slate-850 border-l border-slate-700">
      {/* Header do carrinho */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.4 7h12.8M10 20a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z" />
          </svg>
          <span className="font-semibold text-white">Carrinho</span>
        </div>
        <span className="text-xs bg-slate-700 text-slate-300 rounded-full px-2 py-0.5">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </span>
      </div>

      {/* Itens */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {isEmpty && (
          <div className="text-center text-slate-500 mt-12">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.4 7h12.8M10 20a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            <p className="text-sm">Carrinho vazio</p>
            <p className="text-xs mt-1">Clique em um produto para adicionar</p>
          </div>
        )}

        {items.map(item => (
          <CartItem
            key={item.product.id}
            item={item}
            onRemove={() => removeItem(item.product.id)}
            onQtyChange={(qty) => updateQty(item.product.id, qty)}
            onDiscountChange={(d) => updateItemDiscount(item.product.id, d)}
          />
        ))}
      </div>

      {/* Totais */}
      {!isEmpty && (
        <div className="border-t border-slate-700 px-4 py-3 space-y-2 shrink-0">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {/* Desconto global */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Desconto</span>
            {editingDiscount ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  className="w-16 bg-slate-700 border border-slate-600 text-white rounded px-2 py-0.5 text-sm text-right"
                  value={discountInput}
                  onChange={e => setDiscountInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyDiscount()}
                  autoFocus
                  placeholder="0"
                  min="0"
                  max="100"
                />
                <span className="text-slate-400 text-xs">%</span>
                <button onClick={applyDiscount} className="text-green-400 hover:text-green-300">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setDiscountInput(String(discount)); setEditingDiscount(true) }}
                className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
              >
                {discount > 0 ? `- ${discount}% (${formatCurrency(globalDiscountValue)})` : 'Adicionar desconto'}
              </button>
            )}
          </div>

          {/* Total */}
          <div className="flex justify-between text-lg font-bold pt-1 border-t border-slate-700">
            <span className="text-white">Total</span>
            <span className="text-green-400">{formatCurrency(total)}</span>
          </div>

          {/* Botão de pagamento */}
          <button
            onClick={onCheckout}
            className="w-full btn-success py-3 text-base mt-2 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Pagamento (F12)
          </button>
        </div>
      )}
    </div>
  )
}

function CartItem({ item, onRemove, onQtyChange, onDiscountChange }) {
  const [editingQty, setEditingQty] = useState(false)
  const [qtyInput, setQtyInput] = useState('')

  function applyQty() {
    const val = parseFloat(qtyInput)
    if (!isNaN(val) && val > 0) onQtyChange(val)
    setEditingQty(false)
  }

  return (
    <div className="bg-slate-800 rounded-lg p-2.5 group">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 font-mono">{item.product.code}</p>
          <p className="text-sm font-medium text-white truncate">{item.product.name}</p>
        </div>
        <button
          onClick={onRemove}
          className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-0.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-between mt-2">
        {/* Controle de quantidade */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onQtyChange(item.quantity - 1)}
            className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors text-sm"
          >-</button>

          {editingQty ? (
            <input
              type="number"
              className="w-12 text-center bg-slate-700 border border-slate-500 text-white rounded px-1 py-0.5 text-sm"
              value={qtyInput}
              onChange={e => setQtyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && applyQty()}
              onBlur={applyQty}
              autoFocus
            />
          ) : (
            <button
              onClick={() => { setQtyInput(String(item.quantity)); setEditingQty(true) }}
              className="w-10 text-center text-sm font-bold text-white hover:text-blue-400"
            >
              {item.quantity}
            </button>
          )}

          <button
            onClick={() => onQtyChange(item.quantity + 1)}
            className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors text-sm"
          >+</button>
        </div>

        <div className="text-right">
          <p className="text-sm font-bold text-white">{formatCurrency(item.total)}</p>
          <p className="text-xs text-slate-400">{formatCurrency(item.unitPrice)} x {item.quantity}</p>
        </div>
      </div>
    </div>
  )
}
