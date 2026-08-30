import { useState } from 'react'
import { nfeAPI } from '../api'
import toast from 'react-hot-toast'

export default function NFeModal({ orderId, orderNumber, paymentMethod, onClose }) {
  const [step, setStep] = useState('ask')   // ask | loading | result
  const [nfeResult, setNfeResult] = useState(null)
  const [error, setError] = useState('')

  async function handleEmitir() {
    setError('')
    setStep('loading')
    try {
      const { data } = await nfeAPI.emitir(orderId, paymentMethod)
      setNfeResult(data.nfe)
      setStep('result')
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Falha ao emitir NF-e'
      setError(msg)
      setStep('ask')
      toast.error(msg)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md slide-up border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 bg-[#1a3a6b] text-white">
          <svg className="w-5 h-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div>
            <h2 className="text-base font-bold">Nota Fiscal Eletrônica</h2>
            <p className="text-blue-300 text-xs">Pedido {orderNumber}</p>
          </div>
        </div>

        {/* ── PASSO: Pergunta ── */}
        {step === 'ask' && (
          <>
            <div className="px-6 py-8 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-10 h-10 text-[#1a3a6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-800">O cliente deseja NF-e?</p>
              <p className="text-gray-500 text-sm mt-2">
                Venda registrada com sucesso. Deseja emitir a Nota Fiscal Eletrônica?
              </p>

              {error && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 px-5 pb-5">
              <button onClick={() => onClose(null)}
                className="flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-600 hover:bg-gray-50 font-bold py-3 rounded transition-colors text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Não, obrigado
              </button>
              <button onClick={handleEmitir}
                className="flex items-center justify-center gap-2 bg-[#1a3a6b] hover:bg-[#1e4a8a] text-white font-bold py-3 rounded transition-colors text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Sim, emitir NF-e
              </button>
            </div>
          </>
        )}

        {/* ── PASSO: Carregando ── */}
        {step === 'loading' && (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 border-4 border-[#1a3a6b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-700 font-semibold">Comunicando com a SEFAZ...</p>
            <p className="text-gray-400 text-sm mt-1">Aguarde alguns segundos</p>
          </div>
        )}

        {/* ── PASSO: Resultado ── */}
        {step === 'result' && nfeResult && (
          <>
            <div className="px-6 py-5">
              {/* Status icon */}
              {nfeResult.status === 'authorized' ? (
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-9 h-9 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-green-700">NF-e Autorizada!</h3>
                </div>
              ) : nfeResult.status === 'processing' ? (
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-9 h-9 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-yellow-700">Em Processamento</h3>
                </div>
              ) : (
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-9 h-9 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-red-700">NF-e Rejeitada</h3>
                </div>
              )}

              {/* Dados */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 divide-y divide-gray-100 text-sm">
                <InfoRow label="Ambiente" value={nfeResult.ambiente === 'producao' ? '🟢 Produção' : '🟡 Homologação'} />
                <InfoRow label="Status" value={statusLabel(nfeResult.status)} />
                {nfeResult.chaveAcesso && (
                  <InfoRow label="Chave NF-e" value={nfeResult.chaveAcesso} mono />
                )}
                {nfeResult.protocolo && (
                  <InfoRow label="Protocolo" value={nfeResult.protocolo} />
                )}
                {nfeResult.motivoRejeicao && (
                  <InfoRow label="Motivo" value={nfeResult.motivoRejeicao} danger />
                )}
              </div>

              {nfeResult.urlDanfe && (
                <a href={nfeResult.urlDanfe} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 mt-3 w-full border-2 border-[#1a3a6b] text-[#1a3a6b] hover:bg-blue-50 font-semibold py-2.5 rounded transition-colors text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Baixar DANFE
                </a>
              )}
            </div>

            <div className="px-5 pb-5">
              <button onClick={() => onClose(nfeResult)}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded transition-colors">
                Fechar e Nova Venda
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono, danger }) {
  return (
    <div className="flex justify-between gap-3 px-3 py-2">
      <span className="text-gray-500 shrink-0 text-xs">{label}</span>
      <span className={`text-right text-xs ${mono ? 'font-mono break-all' : 'font-medium'} ${danger ? 'text-red-600' : 'text-gray-800'}`}>
        {value}
      </span>
    </div>
  )
}

function statusLabel(status) {
  return { authorized: 'Autorizada', processing: 'Processando', rejected: 'Rejeitada', cancelled: 'Cancelada', pending: 'Pendente' }[status] || status
}
