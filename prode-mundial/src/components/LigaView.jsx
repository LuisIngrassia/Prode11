import { useState } from 'react'
import { useLigaDetail, calcLigaPrizes } from '../hooks/useLigas'
import Leaderboard from './Leaderboard'

function fmt(n) { return '$' + Number(n).toLocaleString('es-AR') }

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {})
}

// Banner de pago para miembro no confirmado
function PayBanner({ liga, myMembership, onDeclare }) {
  const [note, setNote]     = useState(myMembership?.note || '')
  const [saving, setSaving] = useState(false)
  const [sent, setSent]     = useState(false)

  if (!liga.entry_amount) return null
  if (myMembership?.paid) return null

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
          El creador de la sala debe confirmarlo para que veas la tabla.
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

// Panel de admin del creador
function CreatorPanel({ liga, confirmed, pending, profiles, onConfirm, onRemove }) {
  const [open, setOpen] = useState(false)

  const total = confirmed.length * (liga.entry_amount || 0)

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-bold text-gray-700 text-sm">
          ⚙️ Admin de sala
          {pending.length > 0 && (
            <span className="ml-2 bg-yellow-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Código para compartir */}
          <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 font-medium">Código de invitación</p>
              <p className="font-mono font-black text-2xl text-gray-800 tracking-widest">{liga.codigo}</p>
            </div>
            <button
              onClick={() => copyToClipboard(liga.codigo)}
              className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-lg font-medium text-gray-700 transition"
            >
              Copiar
            </button>
          </div>

          {liga.entry_amount > 0 && (
            <div className="text-sm text-gray-500">
              Recaudado: <span className="font-bold text-gray-800">{fmt(total)}</span>
            </div>
          )}

          {/* Pendientes */}
          {pending.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pendientes</p>
              <div className="space-y-2">
                {pending.map(m => (
                  <div key={m.user_id} className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{profiles[m.user_id] || '—'}</p>
                      {m.note && <p className="text-xs text-gray-400 truncate">{m.note}</p>}
                    </div>
                    <button onClick={() => onConfirm(m.user_id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition">✓</button>
                    <button onClick={() => onRemove(m.user_id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirmados */}
          {confirmed.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirmados ({confirmed.length})</p>
              <div className="space-y-1">
                {confirmed.map(m => (
                  <div key={m.user_id} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-1.5">
                    <span className="text-sm text-gray-700">{profiles[m.user_id] || '—'}</span>
                    <span className="text-green-600 text-sm">✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Pozo de premios de la sala
function LigaPrizePool({ liga, confirmedCount, leaderboard }) {
  if (!liga.entry_amount) return null

  const prizes = calcLigaPrizes(liga, confirmedCount)
  const top3 = leaderboard.slice(0, 3)

  return (
    <div className="bg-gray-900 text-white rounded-2xl p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Pozo de la sala</p>
      <p className="text-4xl font-black">{fmt(prizes.net)}</p>
      <p className="text-gray-400 text-sm mt-1">
        {confirmedCount} participante{confirmedCount !== 1 ? 's' : ''} · {fmt(liga.entry_amount)} c/u
      </p>
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { emoji: '🥇', label: '1°', amount: prizes.first, player: top3[0]?.name },
          { emoji: '🥈', label: '2°', amount: prizes.second, player: top3[1]?.name },
          { emoji: '🥉', label: '3°', amount: prizes.third, player: top3[2]?.name },
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
  const {
    confirmed, pending, profiles, myMembership, loading,
    confirmMember, removeMember, declarePayment,
  } = useLigaDetail(liga.id, userId)

  const isCreator = liga.creator_id === userId
  const canSeeLeaderboard = myMembership?.paid || !liga.entry_amount || isCreator

  // Leaderboard filtrado a miembros confirmados de esta sala
  const confirmedIds = new Set(confirmed.map(m => m.user_id))
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
            onClick={() => copyToClipboard(liga.codigo)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium px-3 py-1.5 rounded-lg transition"
          >
            Compartir
          </button>
        )}
      </div>

      {/* Pozo */}
      <LigaPrizePool liga={liga} confirmedCount={confirmed.length} leaderboard={ligaLeaderboard} />

      {/* Banner pago (si no pagué) */}
      {!loading && !isCreator && (
        <PayBanner liga={liga} myMembership={myMembership} onDeclare={declarePayment} />
      )}

      {/* Admin panel (solo creator) */}
      {isCreator && (
        <CreatorPanel
          liga={liga}
          confirmed={confirmed}
          pending={pending}
          profiles={profiles}
          onConfirm={confirmMember}
          onRemove={removeMember}
        />
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
