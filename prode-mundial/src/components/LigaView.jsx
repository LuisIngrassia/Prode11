import { useState } from 'react'
import { useLigaDetail, calcLigaPrizes } from '../hooks/useLigas'
import Leaderboard from './Leaderboard'

function fmt(n) { return '$' + Number(n).toLocaleString('es-AR') }

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {})
}

function shareInvite(liga) {
  const url  = `${window.location.origin}?join=${liga.codigo}`
  const text = `¡Unite a mi sala "${liga.nombre}" del Prode Mundial 2026! ⚽🏆\nUsá el código: ${liga.codigo}\nO entrá directo:`
  if (navigator.share) {
    navigator.share({ title: `Prode - ${liga.nombre}`, text: text + '\n' + url, url })
  } else {
    copyToClipboard(`${text}\n${url}`)
  }
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

// Panel del creator — solo info y código, sin confirmar pagos
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

function LigaPrizePool({ liga, confirmedCount, leaderboard }) {
  if (!liga.entry_amount) return null

  const prizes = calcLigaPrizes(liga, confirmedCount)
  const top3   = leaderboard.slice(0, 3)

  return (
    <div className="bg-gray-900 text-white rounded-2xl p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Pozo de la sala</p>
      <p className="text-4xl font-black">{fmt(prizes.net)}</p>
      <p className="text-gray-400 text-sm mt-1">
        {confirmedCount} participante{confirmedCount !== 1 ? 's' : ''} · {fmt(liga.entry_amount)} c/u
      </p>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { emoji: '🥇', label: '1°', amount: prizes.first,  player: top3[0]?.name },
          { emoji: '🥈', label: '2°', amount: prizes.second, player: top3[1]?.name },
          { emoji: '🥉', label: '3°', amount: prizes.third,  player: top3[2]?.name },
        ].map(({ emoji, label, amount, player }) => (
          <div key={label} className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-lg">{emoji}</p>
            <p className="font-black text-sm mt-0.5">{fmt(amount)}</p>
            {player && <p className="text-xs text-gray-400 truncate mt-0.5">{player}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LigaView({ liga, leaderboard, userId, onBack }) {
  const { confirmed, pending, profiles, myMembership, loading, declarePayment } =
    useLigaDetail(liga.id, userId)

  const isCreator       = liga.creator_id === userId
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

      {/* Info del creator (sin botones de confirmar) */}
      {isCreator && !loading && (
        <CreatorInfo liga={liga} confirmed={confirmed} pending={pending} />
      )}

      {/* Banner de pago para quien no pagó (incluyendo el creator) */}
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
