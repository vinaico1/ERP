import { useState, useRef, useEffect } from 'react'
import { customersAPI } from '../api'

export default function CustomerSearch({ selected, onSelect, onClear }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await customersAPI.search(query)
        setResults(data.data || [])
        setOpen(true)
      } catch {} finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  function select(customer) {
    onSelect(customer); setQuery(''); setOpen(false); setResults([])
  }

  if (selected) {
    return (
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-300 rounded px-2 py-1">
        <div className="w-6 h-6 bg-[#1a3a6b] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
          {selected.name[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-800 truncate block">{selected.name}</span>
          <span className="text-xs text-gray-500">{selected.phone || selected.document || selected.email || 'Sem documento'}</span>
        </div>
        <button onClick={onClear} className="text-gray-400 hover:text-red-500 p-0.5 transition-colors shrink-0" title="Remover cliente">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <input type="text" className="input-pdv pl-8 text-sm"
          placeholder="Cliente (opcional) — nome, CPF/CNPJ, telefone..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-0.5 bg-white border border-gray-300 rounded shadow-lg z-50 max-h-48 overflow-y-auto fade-in">
          {results.map(c => (
            <button key={c.id} onClick={() => select(c)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-left transition-colors border-b border-gray-100 last:border-0">
              <div className="w-6 h-6 bg-[#1a3a6b] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                {c.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                <p className="text-xs text-gray-500">{c.phone || c.document || c.email || c.code}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
