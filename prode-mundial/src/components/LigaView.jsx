import { useState } from 'react'
import { useLigaDetail, calcLigaPrizes } from '../hooks/useLigas'
import Leaderboard from './Leaderboard'

function fmt(n) { return '$' + Number(n).toLocaleString('es-AR') }

const MEDALS = ['🥇', '🥈', '🥉']
function posLabel(i) { return MEDALS[i] ?? `${i + 1}°` }

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {})
}

function shareInvite(liga) {
  const url  = `${window.location.origin}?join=${liga.codigo}`
  const text = `Unite a mi sala *${liga.nombre}* y hace tus predicciones del mundial! \n👉 ${url}`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
}

function PayBanner({ liga, myMembership, onDeclare }) {
  const [note,   setNote]   = useState(myMembership?.note || '')
  const [saving, setSaving] = useState(false)
  const [sent,   setSent]   = useState(false)

  if (!liga.entry_amount) return null
  if (myMembership?.paid)  return null

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await onDeclare(note)
    setSaving(false)
    setSent(true)
  }

  if (sent || myMembership?.note) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
        <p className="font-bold text-yellow-700">⏳ Pago declarado</p>
        <p className="text-sm text-gray-500 mt-1">
          El organizador confirmará tu transferencia para desbloquearte la tabla.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <p className="font-bold text-gray-800 mb-1">Pagá para ver la tabla</p>
      <p className="text-sm text-gray-500 mb-3">
        Transferí <span className="font-bold">{fmt(liga.entry_amount)}</span> al alias{' '}
        <span className="font-mono font-bold text-gray-800">
          {import.meta.env.VITE_ALIAS_PAGO || '—'}
        </span>
        {' '}y declaralo acá.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Referencia / tu nombre"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <button type="submit" disabled={saving || !note}
          className="bg-yellow-500 hover:bg-yellow-400 text-white font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm">
          {saving ? '…' : 'Listo'}
        </button>
      </form>
    </div>
  )
}

function CreatorInfo({ liga, confirmed, pending }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    copyToClipboard(liga.codigo)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tu sala</p>

      <div className="bg-gray-50 rounded-xl p-3">
        <p className="text-xs text-gray-400 mb-1">Código de invitación</p>
        <div className="flex items-center justify-between gap-2">
          <p className="font-mono font-black text-2xl text-gray-800 tracking-widest">{liga.codigo}</p>
          <div className="flex gap-1.5">
            <button onClick={handleCopy}
              className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-lg font-medium text-gray-700 transition">
              {copied ? '✓' : 'Copiar'}
            </button>
            <button onClick={() => shareInvite(liga)}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition">
              Compartir
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="bg-green-50 rounded-lg p-2">
          <p className="text-xl font-black text-green-700">{confirmed.length}</p>
          <p className="text-xs text-gray-400">confirmados</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-2">
          <p className="text-xl font-black text-yellow-700">{pending.length}</p>
          <p className="text-xs text-gray-400">pendientes</p>
        </div>
      </div>

      {liga.entry_amount > 0 && (
        <p className="text-xs text-gray-400 text-center">
          Los pagos son confirmados por el organizador del prode
        </p>
      )}
    </div>
  )
}

function PriceChangeModal({ currentAmount, onConfirm, onCancel }) {
  const [value, setValue] = useState('')
  const parsed = parseInt(value)
  const valid  = parsed > 0 && parsed !== currentAmount

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4">
        <h3 className="font-black text-gray-800 text-lg">Cambiar precio de entrada</h3>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-1">
          <p className="text-sm font-bold text-yellow-800">Importante</p>
          <p className="text-sm text-yellow-700 leading-relaxed">
            Si cambiás el precio, <strong>todos los depósitos confirmados van a quedar anulados</strong>{' '}
            y los jugadores van a tener que volver a declarar el pago al nuevo precio.
          </p>
        </div>

        <p className="text-sm text-gray-500">
          El cambio queda <strong>pendiente</strong> hasta que el administrador lo apruebe.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo precio</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input
              type="number" min="0" step="100"
              value={value}
              onChange={e => setValue(e.target.value)}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 font-bold"
              placeholder="0"
              autoFocus
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 border border-gray-300 text-gray-700 font-bold py-2.5 rounded-lg hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={() => onConfirm(parsed)} disabled={!valid}
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-white font-bold py-2.5 rounded-lg disabled:opacity-40 transition">
            Solicitar cambio
          </button>
        </div>
      </div>
    </div>
  )
}

function CreatorSettings({ liga, onUpdateSettings, onRequestPriceChange }) {
  const [winnerCount, setWinnerCount] = useState(liga.winner_count || 3)
  const [saving, setSaving]           = useState(false)
  const [saved,  setSaved]            = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)

  const winnersDirty = winnerCount !== (liga.winner_count || 3)

  async function handleSaveWinners() {
    setSaving(true)
    await onUpdateSettings({ winner_count: winnerCount })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handlePriceConfirm(newAmount) {
    setShowPriceModal(false)
    await onRequestPriceChange(newAmount)
  }

  return (
    <>
      {showPriceModal && (
        <PriceChangeModal
          currentAmount={liga.entry_amount}
          onConfirm={handlePriceConfirm}
          onCancel={() => setShowPriceModal(false)}
        />
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm space-y-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Configuración de la sala</p>

        {/* Ganadores */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Cantidad de ganadores</p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <button
                  key={n}
                  onClick={() => setWinnerCount(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                    winnerCount === n
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {winnersDirty && (
            <button
              onClick={handleSaveWinners}
              disabled={saving}
              className="mt-2 text-xs bg-gray-800 hover:bg-gray-700 text-white font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
            >
              {saving ? '…' : saved ? '✓ Guardado' : 'Guardar'}
            </button>
          )}
        </div>

        {/* Precio */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Precio de entrada</p>
              <p className="text-lg font-black text-gray-800">
                {liga.entry_amount ? fmt(liga.entry_amount) : 'Sin precio'}
              </p>
            </div>
            <button
              onClick={() => setShowPriceModal(true)}
              className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-bold px-3 py-1.5 rounded-lg transition"
            >
              Cambiar
            </button>
          </div>

          {liga.pending_entry_amount != null && (
            <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
              <span className="text-base flex-shrink-0">⏳</span>
              <div>
                <p className="text-xs font-bold text-orange-700">Cambio de precio pendiente</p>
                <p className="text-xs text-orange-600 mt-0.5">
                  Nuevo precio solicitado: <span className="font-bold">{fmt(liga.pending_entry_amount)}</span>.
                  Esperando aprobación del admin.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function LigaPrizePool({ liga, confirmedCount, leaderboard }) {
  if (!liga.entry_amount) return null

  const { net, prizes } = calcLigaPrizes(liga, confirmedCount)
  const n     = prizes.length
  const gridCols = n <= 3 ? 'grid-cols-3' : 'grid-cols-3'

  return (
    <div className="bg-gray-900 text-white rounded-2xl p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Pozo de la sala</p>
      <p className="text-4xl font-black">{fmt(net)}</p>
      <p className="text-gray-400 text-sm mt-1">
        {confirmedCount} participante{confirmedCount !== 1 ? 's' : ''} · {fmt(liga.entry_amount)} c/u
        {n !== 3 && <span> · {n} ganador{n !== 1 ? 'es' : ''}</span>}
      </p>
      <div className={`grid ${gridCols} gap-2 mt-4`}>
        {prizes.map((amount, i) => {
          const player = leaderboard[i]?.name
          return (
            <div key={i} className="bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-lg">{posLabel(i)}</p>
              <p className="font-black text-sm mt-0.5">{fmt(amount)}</p>
              {player && <p className="text-xs text-gray-400 truncate mt-0.5">{player}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function LigaView({ liga: ligaProp, leaderboard, userId, onBack }) {
  const {
    liga: ligaData,
    confirmed, pending, profiles, myMembership, loading,
    declarePayment, updateSettings, requestPriceChange,
  } = useLigaDetail(ligaProp.id, userId)

  const liga = ligaData || ligaProp

  const isCreator        = liga.creator_id === userId
  const canSeeLeaderboard = myMembership?.paid || !liga.entry_amount

  const confirmedIds    = new Set(confirmed.map(m => m.user_id))
  const ligaLeaderboard = leaderboard.filter(p => confirmedIds.has(p.id))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack}
          className="text-gray-500 hover:text-gray-800 p-1 rounded-lg hover:bg-gray-100 transition">
          ←
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-gray-800 text-lg truncate">{liga.nombre}</h1>
          <p className="text-xs text-gray-400 font-mono">#{liga.codigo}</p>
        </div>
        {!isCreator && (
          <button
            onClick={() => shareInvite(liga)}
            className="text-xs bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-1.5 rounded-lg transition"
          >
            Compartir
          </button>
        )}
      </div>

      {/* Pozo */}
      <LigaPrizePool liga={liga} confirmedCount={confirmed.length} leaderboard={ligaLeaderboard} />

      {/* Info + settings del creator */}
      {isCreator && !loading && (
        <>
          <CreatorInfo liga={liga} confirmed={confirmed} pending={pending} />
          <CreatorSettings
            liga={liga}
            onUpdateSettings={updateSettings}
            onRequestPriceChange={requestPriceChange}
          />
        </>
      )}

      {/* Banner de pago */}
      {!loading && (
        <PayBanner liga={liga} myMembership={myMembership} onDeclare={declarePayment} />
      )}

      {/* Leaderboard */}
      {canSeeLeaderboard ? (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
            Tabla — {confirmed.length} participante{confirmed.length !== 1 ? 's' : ''}
          </p>
          {ligaLeaderboard.length > 0
            ? <Leaderboard leaderboard={ligaLeaderboard} currentUserId={userId} />
            : <p className="text-center text-gray-400 py-8 text-sm bg-white rounded-xl border border-gray-100">
                Aún no hay participantes confirmados
              </p>
          }
        </div>
      ) : (
        <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">🔒</p>
          <p className="font-bold text-gray-700">Tabla bloqueada</p>
          <p className="text-sm text-gray-400 mt-1">Declarar el pago para ver las posiciones</p>
        </div>
      )}
    </div>
  )
}
