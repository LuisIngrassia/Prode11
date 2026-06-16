import { useState, useEffect } from 'react'
import GroupStage from './GroupStage'
import Bracket from './Bracket'
import { FLAGS } from '../data/teams'
import { getMatchStartUTC, isMatchLocked, isMatchInProgress } from '../utils/matchTime'

const PHASE_LABEL = {
  r32: 'Ronda de 32', r16: 'Octavos de Final',
  qf: 'Cuartos de Final', sf: 'Semifinal',
  final: 'Gran Final', '3rd': '3er Puesto',
}

function formatCountdown(ms) {
  if (ms <= 0) return null
  const totalSec = Math.floor(ms / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (d > 0) return `${d}d ${h}h ${String(m).padStart(2, '0')}m`
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
  return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
}

function LiveMatchCard({ match, prediction }) {
  const label = match.group_name
    ? `Grupo ${match.group_name}`
    : (PHASE_LABEL[match.phase] || '')

  const hasPred = prediction?.pred_home != null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      <div className="bg-orange-500 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-white">
            En vivo
          </span>
        </div>
        {label && (
          <span className="text-xs font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
            {label}
          </span>
        )}
      </div>

      <div className="px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col items-center flex-1 gap-1">
            <span className="text-4xl leading-none">{FLAGS[match.home] || '🏳'}</span>
            <span className="text-sm font-bold text-gray-800 text-center leading-tight">{match.home}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            {hasPred ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-11 h-9 flex items-center justify-center border-2 border-gray-200 rounded-lg text-lg font-black text-gray-400 bg-gray-50">
                    {prediction.pred_home}
                  </span>
                  <span className="text-gray-300 font-bold text-base">-</span>
                  <span className="w-11 h-9 flex items-center justify-center border-2 border-gray-200 rounded-lg text-lg font-black text-gray-400 bg-gray-50">
                    {prediction.pred_away}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide flex items-center gap-1">
                  🔒 tu predicción
                </span>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">🔒</span>
                <span className="text-[10px] text-gray-400">sin predicción</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center flex-1 gap-1">
            <span className="text-4xl leading-none">{FLAGS[match.away] || '🏳'}</span>
            <span className="text-sm font-bold text-gray-800 text-center leading-tight">{match.away}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function NextMatchCard({ match, prediction, onSave }) {
  const [ph, setPh] = useState(prediction?.pred_home ?? '')
  const [pa, setPa] = useState(prediction?.pred_away ?? '')
  const [saving, setSaving]     = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [now, setNow]           = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setPh(prediction?.pred_home != null ? String(prediction.pred_home) : '')
    setPa(prediction?.pred_away != null ? String(prediction.pred_away) : '')
  }, [prediction?.pred_home, prediction?.pred_away])

  const startUTC  = getMatchStartUTC(match)
  const msLeft    = startUTC ? startUTC.getTime() - now : null
  const countdown = msLeft != null && msLeft > 0 ? formatCountdown(msLeft) : null

  const isDirty = ph !== '' && pa !== '' && (
    String(ph) !== String(prediction?.pred_home ?? '') ||
    String(pa) !== String(prediction?.pred_away ?? '')
  )
  const hasSaved = prediction?.pred_home != null && !isDirty

  async function handleSave() {
    if (!isDirty) return
    setSaving(true)
    await onSave(match.id, parseInt(ph), parseInt(pa))
    setSaving(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2500)
  }

  const label = match.group_name
    ? `Grupo ${match.group_name}`
    : (PHASE_LABEL[match.phase] || '')

  const dateStr = startUTC
    ? startUTC.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        weekday: 'long', day: 'numeric', month: 'long',
      })
    : match.date || ''

  const timeStr = startUTC
    ? startUTC.toLocaleString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: '2-digit', minute: '2-digit',
      })
    : ''

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      {/* Header amarillo */}
      <div className="bg-yellow-400 px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-white/80">
          Próximo partido
        </span>
        {label && (
          <span className="text-xs font-bold text-white bg-white/20 px-2 py-0.5 rounded-full">
            {label}
          </span>
        )}
      </div>

      <div className="px-4 py-4">
        {/* Equipos */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex flex-col items-center flex-1 gap-1">
            <span className="text-4xl leading-none">{FLAGS[match.home] || '🏳'}</span>
            <span className="text-sm font-bold text-gray-800 text-center leading-tight">{match.home}</span>
          </div>

          {/* Inputs de predicción centrados */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <input
                type="number" min="0" max="99" value={ph}
                onChange={e => { setPh(e.target.value); setJustSaved(false) }}
                className="w-11 text-center border-2 border-gray-200 rounded-lg py-1.5 text-lg font-black focus:outline-none focus:border-green-500 text-gray-800"
              />
              <span className="text-gray-300 font-bold text-base">-</span>
              <input
                type="number" min="0" max="99" value={pa}
                onChange={e => { setPa(e.target.value); setJustSaved(false) }}
                className="w-11 text-center border-2 border-gray-200 rounded-lg py-1.5 text-lg font-black focus:outline-none focus:border-green-500 text-gray-800"
              />
            </div>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">tu predicción</span>
          </div>

          <div className="flex flex-col items-center flex-1 gap-1">
            <span className="text-4xl leading-none">{FLAGS[match.away] || '🏳'}</span>
            <span className="text-sm font-bold text-gray-800 text-center leading-tight">{match.away}</span>
          </div>
        </div>

        {/* Footer: fecha + countdown + botón guardar */}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 capitalize truncate">
              {dateStr}{timeStr ? `, ${timeStr}` : ''}
            </p>
            {countdown && (
              <p className="text-xs font-mono font-bold text-green-600 mt-0.5">
                ⏱ {countdown}
              </p>
            )}
          </div>

          <div className="flex-shrink-0">
            {justSaved ? (
              <span className="text-green-500 font-bold text-sm">✓ Guardado</span>
            ) : hasSaved && !isDirty ? (
              <span className="text-gray-300 text-sm">✓</span>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PrediccionesTab({ matches, predictions, onSave }) {
  const [sub, setSub] = useState('grupos')

  const liveMatch = matches
    .filter(m => isMatchInProgress(m))
    .sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0))[0]

  const nextMatch = matches
    .filter(m => !isMatchLocked(m))
    .sort((a, b) => {
      const ta = getMatchStartUTC(a)?.getTime() ?? Infinity
      const tb = getMatchStartUTC(b)?.getTime() ?? Infinity
      return ta - tb
    })[0]

  return (
    <div>
      {liveMatch && (
        <LiveMatchCard
          match={liveMatch}
          prediction={predictions?.[liveMatch.id]}
        />
      )}
      {nextMatch && (
        <NextMatchCard
          match={nextMatch}
          prediction={predictions?.[nextMatch.id]}
          onSave={onSave}
        />
      )}

      <div className="flex gap-1 bg-gray-200 p-1 rounded-xl mb-4">
        {[
          { id: 'grupos', label: '⬡ Fase de Grupos' },
          { id: 'llaves', label: '🏆 Llaves' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
              sub === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'grupos' && (
        <GroupStage matches={matches} predictions={predictions} onSave={onSave} />
      )}
      {sub === 'llaves' && (
        <Bracket matches={matches} predictions={predictions} onSave={onSave} />
      )}
    </div>
  )
}
