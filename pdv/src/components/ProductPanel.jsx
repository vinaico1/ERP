import { useState, useEffect, useRef } from 'react'
import { pdvAPI } from '../api'
import { useCart } from '../contexts/CartContext'
import { formatCurrency } from '../utils/format'
import toast from 'react-hot-toast'

export default function ProductPanel() {
  const { addItem } = useCart()
  const [query, setQuery] = useState('')
  const [allProducts, setAllProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [categories, setCategories] = useState(['TODOS'])
  const [activeCategory, setActiveCategory] = useState('TODOS')
  const [loading, setLoading] = useState(true)
  const inputRef = useRef(null)

  useEffect(() => {
    // Carrega produtos e categorias em paralelo via endpoint dedicado do PDV
    Promise.all([pdvAPI.products(), pdvAPI.categories()])
      .then(([prodsRes, catsRes]) => {
        const prods = prodsRes.data.data || []
        const cats  = catsRes.data.data  || []
        setAllProducts(prods)
        setFiltered(prods)
        setCategories(['TODOS', ...cats.map(c => c.name.toUpperCase())])
      })
      .catch(() => toast.error('Erro ao carregar produtos do ERP'))
      .finally(() => setLoading(false))
  }, [])

  // Filtra localmente por categoria + busca (dados já estão no cliente)
  useEffect(() => {
    let result = allProducts
    if (activeCategory !== 'TODOS') {
      result = result.filter(p => p.category?.name?.toUpperCase() === activeCategory)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [activeCategory, query, allProducts])

  // Recarrega estoque ao focar a janela (para refletir movimentações do ERP em tempo real)
  useEffect(() => {
    function onFocus() {
      pdvAPI.products().then(({ data }) => {
        const prods = data.data || []
        setAllProducts(prods)
      }).catch(() => {})
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // F2 para focar busca
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'F2') { e.preventDefault(); inputRef.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleAdd(product) {
    const stock = product.inventory?.quantity ?? 0
    if (stock <= 0) {
      toast.error(`${product.name}: sem estoque`)
      return
    }
    addItem(product)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Busca de produto */}
      <div className="px-2 py-1.5 border-b border-gray-200">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="input-pdv pl-8 text-sm"
            placeholder="Buscar produto por nome ou código (F2)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Abas de categorias */}
      <div className="flex gap-1 px-2 py-1.5 border-b border-gray-200 overflow-x-auto shrink-0">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded text-xs font-bold whitespace-nowrap border transition-colors
              ${activeCategory === cat
                ? 'bg-[#1a3a6b] text-white border-[#1a3a6b]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de produtos */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center text-gray-400 mt-16">
            <svg className="w-10 h-10 mx-auto mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
            <p className="text-sm">Nenhum produto encontrado</p>
          </div>
        )}

        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
          {filtered.map(product => {
            const stock = product.inventory?.quantity ?? 0
            const outOfStock = stock <= 0
            return (
              <button
                key={product.id}
                onClick={() => handleAdd(product)}
                disabled={outOfStock}
                className={`
                  flex flex-col items-center justify-between p-2 rounded border text-center
                  transition-all active:scale-95 select-none
                  ${outOfStock
                    ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                    : 'bg-white border-gray-300 hover:border-[#1a3a6b] hover:bg-blue-50 cursor-pointer shadow-sm hover:shadow'}
                `}
                style={{ minHeight: 100 }}
              >
                {/* Ícone / imagem */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1
                  ${outOfStock ? 'bg-gray-200' : 'bg-blue-100'}`}>
                  <svg className={`w-5 h-5 ${outOfStock ? 'text-gray-400' : 'text-[#1a3a6b]'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0v10l-8 4m0-10L4 7m8 4v10" />
                  </svg>
                </div>

                {/* Nome */}
                <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2 w-full">
                  {product.name}
                </p>

                {/* Preço */}
                <p className="text-sm font-bold text-[#1a3a6b] mt-1">
                  {formatCurrency(product.price)}
                </p>

                {/* Estoque — sempre visível */}
                <span className={`text-[10px] font-semibold mt-0.5
                  ${outOfStock        ? 'text-red-500'
                  : stock <= product.minStock ? 'text-orange-500'
                  : 'text-green-600'}`}>
                  {outOfStock ? 'Sem estoque' : `Estoque: ${stock} ${product.unit || 'UN'}`}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
