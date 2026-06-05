import { useState } from 'react'
import { calculatePrizes } from '../hooks/useEntries'

const ALIAS = import.meta.env.VITE_ALIAS_PAGO || 'alias.a.configurar'
const MIN   = Number(import.meta.env.VITE_MONTO_MINIMO) || 500

function fmt(n) {
  return '$' + Number(n).toLocaleString('es-AR')
}

function EntryStatus({ myEntry, onSubmit }) {
  const [amount, setAmount] = useState('')
  const [note, setNote]     = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const amt = parseInt(amount)
    if (amt < MIN) { setMsg(`Mínimo ${fmt(MIN)}`); return }
    setSaving(true)
    const { error } = await onSubmit(amt, note)
    setSaving(false)
    if (error) setMsg(error.message)
    else setMsg('')
  }

  if (myEntry?.confirmed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <p className="text-2xl mb-1">✅</p>
        <p className="font-bold text-green-700">¡Estás en el pozo!</p>
        <p className="text-sm text-gray-500 mt-1">
          Tu aporte confirmado: <span className="font-bold text-gray-700">{fmt(myEntry.amount)}</span>
        </p>
      </div>
    )
  }

  if (myEntry && !myEntry.confirmed) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
        <p className="text-2xl mb-1">⏳</p>
        <p className="font-bold text-yellow-700">Pendiente de confirmación</p>
        <p className="text-sm text-gray-500 mt-1">
          Declaraste <span className="font-bold">{fmt(myEntry.amount)}</span>.
          Avisale al organizador para que confirme tu pago.
        </p>
        {myEntry.note && (
          <p className="text-xs text-gray-400 mt-1">Referencia: {myEntry.note}</p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-1">Quiero entrar al pozo</h3>
      <p className="text-sm text-gray-500 mb-4">
        Transferí lo que quieras (mínimo {fmt(MIN)}) al alias{' '}
        <span className="font-mono font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
          {ALIAS}
        </span>
        {' '}y completá este formulario.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto que transferiste
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
            <input
              type="number" min={MIN} step="100"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              placeholder={MIN.toLocaleString('es-AR')}
              className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 font-bold"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Referencia / nombre en la transferencia
          </label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ej: Juan García PRODE"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>

        {msg && <p className="text-sm text-red-600">{msg}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50"
        >
          {saving ? 'Enviando...' : 'Declarar mi pago'}
        </button>
      </form>
    </div>
  )
}

function PrizeRow({ rank, player, prize, amount, multiplier, returnRatio }) {
  const medals = ['🥇', '🥈', '🥉']
  const colors  = [
    'border-yellow-300 bg-yellow-50',
    'border-gray-300 bg-gray-50',
    'border-orange-200 bg-orange-50',
  ]
  return (
    <div className={`border rounded-xl p-4 ${colors[rank]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{medals[rank]}</span>
          <div>
            <p className="font-bold text-gray-800">{player?.name || '?'}</p>
            <p className="text-xs text-gray-500">
              Aporte: <span className="font-semibold">{fmt(amount || 0)}</span>
              {' · '}multiplicador: <span className="font-semibold">{multiplier}×</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-gray-800">{fmt(prize)}</p>
          {returnRatio !== '—' && (
            <p className="text-xs text-green-600 font-semibold">{returnRatio}× retorno</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PrizePool({ leaderboard, myEntry, confirmed, pending, totalGross, organizerCut, netPool, onSubmit }) {
  const prizes = calculatePrizes(confirmed, leaderboard, netPool)
  const participantsWithEntry = confirmed.length

  return (
    <div className="space-y-5">
      {/* Header del pozo */}
      <div className="bg-gray-900 rounded-2xl p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Pozo acumulado</p>
        <p className="text-5xl font-black tracking-tight">{fmt(netPool)}</p>
        <p className="text-gray-400 text-sm mt-1">
          {fmt(totalGross)} recaudados · {fmt(organizerCut)} admin (12%)
        </p>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-black">{participantsWithEntry}</p>
            <p className="text-xs text-gray-400">en el pozo</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-2xl font-black">{pending.length}</p>
            <p className="text-xs text-gray-400">pendientes</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-center">
            <p className="text-sm font-black">
              {fmt(Math.min(...confirmed.map(e => e.amount).filter(Boolean), 0) || 0)}
              <span className="text-gray-400 text-xs"> mín</span>
            </p>
            <p className="text-sm font-black mt-0.5">
              {fmt(Math.max(...confirmed.map(e => e.amount).filter(Boolean), 0) || 0)}
              <span className="text-gray-400 text-xs"> máx</span>
            </p>
          </div>
        </div>
      </div>

      {/* Cómo funciona */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="font-bold text-blue-800 mb-2">¿Cómo se calcula tu premio?</p>
        <p className="text-sm text-blue-700 leading-relaxed">
          El pozo neto se reparte entre los top 3. Tu premio depende de
          <strong> cuánto aportaste</strong> y <strong>qué posición salís</strong>.
        </p>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
          {['1° → 3×', '2° → 1.5×', '3° → 0.5×'].map(t => (
            <div key={t} className="bg-white rounded-lg p-2 border border-blue-200 font-bold text-blue-700">{t}</div>
          ))}
        </div>
        <p className="text-xs text-blue-500 mt-2">
          Tu aporte × tu multiplicador ÷ suma de los 3 × pozo neto = tu premio
        </p>
      </div>

      {/* Proyección de premios */}
      <div>
        <h2 className="font-bold text-gray-700 mb-3">
          Proyección actual
          <span className="text-xs font-normal text-gray-400 ml-2">
            (según standings del prode)
          </span>
        </h2>
        {prizes.length > 0 ? (
          <div className="space-y-3">
            {prizes.map((p, i) => (
              <PrizeRow
                key={i}
                rank={i}
                player={p}
                prize={p.prize}
                amount={p.amount}
                multiplier={p.multiplier}
                returnRatio={p.returnRatio}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">
            <p className="text-3xl mb-2">🏆</p>
            <p className="text-sm">Los premios se mostrarán cuando haya participantes en el pozo y posiciones en la tabla.</p>
          </div>
        )}
      </div>

      {/* Formulario de entrada */}
      <EntryStatus myEntry={myEntry} onSubmit={onSubmit} />
    </div>
  )
}
