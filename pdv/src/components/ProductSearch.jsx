import { useState, useEffect, useRef, useCallback } from 'react'
import { productsAPI } from '../api'
import { useCart } from '../contexts/CartContext'
import { formatCurrency } from '../utils/format'
import toast from 'react-hot-toast'

export default function ProductSearch() {
  const { addItem } = useCart()
  const [query, setQuery] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [allProducts, setAllProducts] = useState([])
  const inputRef = useRef(null)

  // Carrega todos os produtos ativos na montagem
  useEffect(() => {
    productsAPI.list({ active: true, limit: 200 })
      .then(({ data }) => setAllProducts(data.data || []))
      .catch(() => {})
  }, [])

  // Busca com debounce
  useEffect(() => {
    if (!query.trim()) {
      setProducts(allProducts.slice(0, 40))
      return
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await productsAPI.search(query)
        setProducts(data.data || [])
      } catch {
        toast.error('Erro ao buscar produtos')
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query, allProducts])

  // Inicializa com todos os produtos
  useEffect(() => {
    if (allProducts.length > 0 && products.length === 0) {
      setProducts(allProducts.slice(0, 40))
    }
  }, [allProducts])

  function handleAdd(product) {
    const stock = product.inventory?.quantity ?? 0
    if (stock <= 0) {
      toast.error(`${product.name}: sem estoque`)
      return
    }
    addItem(product)
    toast.success(`${product.name} adicionado`, { duration: 1200 })
  }

  // Atalho F2 para focar na busca
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'F2') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex flex-col flex-1 overflow-hidden px-3 pb-3">
      {/* Campo de busca */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="input-pdv pl-9 pr-16"
          placeholder="Buscar produto por nome ou código... (F2)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {query && !loading && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Grid de produtos */}
      <div className="flex-1 overflow-y-auto">
        {products.length === 0 && !loading && (
          <div className="text-center text-slate-500 mt-16">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
            <p>Nenhum produto encontrado</p>
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
          {products.map(product => {
            const stock = product.inventory?.quantity ?? 0
            const outOfStock = stock <= 0
            return (
              <button
                key={product.id}
                onClick={() => handleAdd(product)}
                disabled={outOfStock}
                className={`
                  relative flex flex-col items-start p-3 rounded-xl border text-left transition-all
                  ${outOfStock
                    ? 'bg-slate-800/50 border-slate-700 opacity-50 cursor-not-allowed'
                    : 'bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-750 active:scale-95 cursor-pointer'
                  }
                `}
              >
                {/* Estoque badge */}
                <span className={`
                  absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-full font-medium
                  ${outOfStock ? 'bg-red-900/60 text-red-400' :
                    stock <= 5 ? 'bg-yellow-900/60 text-yellow-400' :
                    'bg-green-900/40 text-green-400'}
                `}>
                  {outOfStock ? 'Sem estoque' : stock <= 5 ? `${stock} un` : `${stock} un`}
                </span>

                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0v10l-8 4m0-10L4 7m8 4v10" />
                  </svg>
                </div>

                <p className="text-xs text-slate-400 font-mono">{product.code}</p>
                <p className="text-sm font-medium text-white leading-tight mt-0.5 line-clamp-2">
                  {product.name}
                </p>
                <p className="text-base font-bold text-blue-400 mt-1">
                  {formatCurrency(product.price)}
                </p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
