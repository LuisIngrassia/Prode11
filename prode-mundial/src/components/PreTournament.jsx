import { useState } from 'react'
import { FLAGS, GROUPS } from '../data/teams'
import { isTournamentStarted } from '../utils/matchTime'

const TEAMS = Object.values(GROUPS).flat().sort()

export default function PreTournament({ special, onSave }) {
  const [champion,    setChampion]    = useState(special.champion    || '')
  const [subchampion, setSubchampion] = useState(special.subchampion || '')
  const [saving,  setSaving]  = useState(false)
  const [msg,     setMsg]     = useState('')

  const isLocked = special.locked || isTournamentStarted()

  async function handleSave(e) {
    e.preventDefault()
    if (!champion || !subchampion) return
    if (champion === subchampion) { setMsg('Campeón y subcampeón deben ser distintos'); return }
    setSaving(true)
    const { error } = await onSave(champion, subchampion)
    setSaving(false)
    setMsg(error ? (typeof error === 'string' ? error : error.message) : '¡Guardado!')
    setTimeout(() => setMsg(''), 3000)
  }

  if (isLocked) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 text-center shadow-sm">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="font-bold text-gray-700 text-lg mb-1">Predicciones especiales bloqueadas</h2>
        <p className="text-gray-500 text-sm">El torneo ya comenzó</p>
        <div className="mt-4 space-y-2">
          <div className="bg-green-50 rounded-lg px-4 py-2">
            <span className="text-xs text-gray-400 uppercase">Campeón</span>
            <p className="font-bold text-green-700 flex items-center justify-center gap-1">
              {special.champion ? <><span>{FLAGS[special.champion]}</span> {special.champion}</> : '—'}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg px-4 py-2">
            <span className="text-xs text-gray-400 uppercase">Subcampeón</span>
            <p className="font-bold text-blue-700 flex items-center justify-center gap-1">
              {special.subchampion ? <><span>{FLAGS[special.subchampion]}</span> {special.subchampion}</> : '—'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h2 className="font-bold text-gray-700 text-lg mb-1">Predicciones especiales</h2>
      <p className="text-sm text-gray-400 mb-5">
        +20 pts por campeón · +10 pts por subcampeón.
        Se bloquean al inicio del torneo (11 Jun).
      </p>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">🏆 Campeón</label>
          <select
            value={champion}
            onChange={e => setChampion(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="">Seleccionar equipo...</option>
            {TEAMS.map(t => (
              <option key={t} value={t}>{FLAGS[t]} {t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">🥈 Subcampeón</label>
          <select
            value={subchampion}
            onChange={e => setSubchampion(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            <option value="">Seleccionar equipo...</option>
            {TEAMS.filter(t => t !== champion).map(t => (
              <option key={t} value={t}>{FLAGS[t]} {t}</option>
            ))}
          </select>
        </div>

        {msg && (
          <p className={`text-sm px-3 py-2 rounded-lg ${msg.includes('!') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {msg}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !champion || !subchampion}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-40"
        >
          {saving ? 'Guardando...' : 'Guardar predicciones'}
        </button>
      </form>
    </div>
  )
}
