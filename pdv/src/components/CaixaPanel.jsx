import { useState, useEffect, useCallback } from 'react'
import { pdvAPI } from '../api'
import { formatCurrency } from '../utils/format'

const METHOD_COLORS = {
  cash:        { bg: 'bg-green-50',  border: 'border-green-400',  text: 'text-green-700',  badge: 'bg-green-100 text-green-800' },
  credit_card: { bg: 'bg-blue-50',   border: 'border-blue-400',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-800' },
  debit_card:  { bg: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-800' },
  pix:         { bg: 'bg-teal-50',   border: 'border-teal-400',   text: 'text-teal-700',   badge: 'bg-teal-100 text-teal-800' },
  mixed:       { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function CaixaPanel({ refreshKey = 0 }) {
  const [date, setDate] = useState(todayStr())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await pdvAPI.caixa(date)
      setData(res.data.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar movimentações')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { load() }, [load, refreshKey])

  const isToday = date === todayStr()

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 gap-3">

      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-2 py-1 shadow-sm">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="text-sm text-gray-700 outline-none bg-transparent cursor-pointer"
          />
        </div>

        {!isToday && (
          <button
            onClick={() => setDate(todayStr())}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline"
          >
            Voltar para hoje
          </button>
        )}

        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 ml-auto bg-[#1a3a6b] hover:bg-[#163060] text-white text-sm font-semibold px-3 py-1.5 rounded shadow-sm transition-colors disabled:opacity-50"
        >
          {loading
            ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
          }
          Atualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 text-sm rounded px-3 py-2">{error}</div>
      )}

      {loading && !data && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#1a3a6b] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {data && (
        <>
          {/* ── Cards por forma de pagamento ─────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {data.totals.map(m => {
              const c = METHOD_COLORS[m.id] || METHOD_COLORS.mixed
              return (
                <div key={m.id} className={`${c.bg} border-2 ${c.border} rounded-lg p-3 flex flex-col gap-1`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl">{m.icon}</span>
                    <span className={`text-xs font-bold uppercase ${c.text}`}>{m.label}</span>
                  </div>
                  <span className={`text-lg font-bold ${c.text}`}>{formatCurrency(m.total)}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-semibold w-fit ${c.badge}`}>
                    {m.count} {m.count === 1 ? 'venda' : 'vendas'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* ── Total geral ──────────────────────────────────────── */}
          <div className="flex items-center justify-between bg-[#1a3a6b] text-white rounded-lg px-4 py-3 shadow">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-bold text-sm">
                TOTAL DO {isToday ? 'DIA' : 'PERÍODO'} — {data.count} {data.count === 1 ? 'venda' : 'vendas'}
              </span>
            </div>
            <span className="text-2xl font-bold text-orange-300">{formatCurrency(data.grandTotal)}</span>
          </div>

          {/* ── Tabela de movimentações ───────────────────────────── */}
          <div className="flex-1 bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-600 uppercase">Movimentações</span>
              <span className="text-xs text-gray-400">
                {new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {data.sales.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 py-12">
                <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium">Nenhuma venda registrada neste período</span>
              </div>
            ) : (
              <div className="overflow-auto flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-200">
                      <th className="px-3 py-2 font-semibold">Hora</th>
                      <th className="px-3 py-2 font-semibold">Pedido</th>
                      <th className="px-3 py-2 font-semibold">Cliente</th>
                      <th className="px-3 py-2 font-semibold">Pagamento</th>
                      <th className="px-3 py-2 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.map((sale, i) => {
                      const method = data.totals.find(m => m.id === sale.paymentMethod)
                      const c = METHOD_COLORS[sale.paymentMethod] || METHOD_COLORS.mixed
                      return (
                        <tr key={sale.id} className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                          <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                            {new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-3 py-2 font-mono font-semibold text-[#1a3a6b]">{sale.number}</td>
                          <td className="px-3 py-2 text-gray-600 max-w-[160px] truncate">
                            {sale.customer?.name || <span className="text-gray-400 italic">Consumidor Final</span>}
                          </td>
                          <td className="px-3 py-2">
                            {method ? (
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${c.badge}`}>
                                {method.icon} {method.label}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-gray-800">{formatCurrency(sale.total)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 bg-gray-100">
                      <td colSpan={4} className="px-3 py-2 text-xs font-bold text-gray-600 uppercase">Total</td>
                      <td className="px-3 py-2 text-right font-bold text-[#1a3a6b]">{formatCurrency(data.grandTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
