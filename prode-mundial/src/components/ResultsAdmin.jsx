import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { FLAGS, isRealTeam } from '../data/teams'
import { getPlaceholderUpdates, getThirdPlaceRanking, parseThirdCombo, isUnresolvedThirdSlot } from '../utils/knockoutFill'

const GROUP_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L']
const KNOCKOUT_PHASES = [
  { key: 'r32',   label: 'Ronda de 32' },
  { key: 'r16',   label: 'Octavos' },
  { key: 'qf',    label: 'Cuartos' },
  { key: 'sf',    label: 'Semis' },
  { key: '3rd',   label: '3er Puesto' },
  { key: 'final', label: 'Final' },
]

async function saveResult(matchId, resultHome, resultAway) {
  const { error } = await supabase
    .from('matches')
    .update({ result_home: resultHome, result_away: resultAway })
    .eq('id', matchId)
  if (error) return error

  await supabase.rpc('calculate_points', { match_id_input: matchId })
  return null
}

function MatchResultRow({ match, onSaved }) {
  const hasResult = match.result_home != null && match.result_away != null
  const [rh, setRh] = useState(match.result_home ?? '')
  const [ra, setRa] = useState(match.result_away ?? '')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState(hasResult ? 'saved' : 'idle')

  async function handleSave() {
    if (rh === '' || ra === '') return
    setSaving(true)
    const error = await saveResult(match.id, parseInt(rh), parseInt(ra))
    setSaving(false)
    if (error) { setStatus('error'); return }
    setStatus('saved')
    onSaved()
  }

  return (
    <div className={`flex items-center gap-2 p-3 rounded-xl border transition ${
      status === 'saved' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'
    }`}>
      <span className="text-xs text-gray-400 w-8 text-center flex-shrink-0 font-mono">
        {match.match_number}
      </span>

      {/* Local */}
      <div className="flex items-center gap-1 flex-1 justify-end min-w-0">
        <span className="text-xs font-medium text-gray-700 truncate text-right">{match.home}</span>
        <span className="text-sm flex-shrink-0">{FLAGS[match.home] || ''}</span>
      </div>

      {/* Inputs */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <input
          type="number" min="0" max="99"
          value={rh}
          onChange={e => { setRh(e.target.value); setStatus('idle') }}
          className="w-10 text-center border-2 border-gray-300 rounded-lg py-1 text-sm font-bold focus:outline-none focus:border-blue-400"
        />
        <span className="text-gray-400 font-bold text-xs">-</span>
        <input
          type="number" min="0" max="99"
          value={ra}
          onChange={e => { setRa(e.target.value); setStatus('idle') }}
          className="w-10 text-center border-2 border-gray-300 rounded-lg py-1 text-sm font-bold focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Visitante */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <span className="text-sm flex-shrink-0">{FLAGS[match.away] || ''}</span>
        <span className="text-xs font-medium text-gray-700 truncate">{match.away}</span>
      </div>

      {/* Botón */}
      <button
        onClick={handleSave}
        disabled={saving || rh === '' || ra === ''}
        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex-shrink-0 ${
          status === 'saved'
            ? 'bg-green-500 text-white'
            : status === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40'
        }`}
      >
        {saving ? '…' : status === 'saved' ? '✓' : status === 'error' ? '!' : 'Guardar'}
      </button>
    </div>
  )
}

function ThirdPlaceRankingPanel({ matches }) {
  const { rows, groupsComplete, groupsTotal } = getThirdPlaceRanking(matches)

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
        Ranking de terceros ({groupsComplete}/{groupsTotal} grupos finalizados)
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-gray-400">Todavía no hay grupos finalizados.</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 uppercase">
              <th className="text-left pb-1 font-medium">Equipo</th>
              <th className="pb-1 font-medium w-8 text-center">Grupo</th>
              <th className="pb-1 font-medium w-8 text-center">Pts</th>
              <th className="pb-1 font-medium w-8 text-center">DG</th>
              <th className="pb-1 font-medium w-8 text-center">GF</th>
              <th className="pb-1 font-medium w-16 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(r => (
              <tr key={r.group} className={r.qualifies ? 'font-semibold text-gray-800' : 'text-gray-400'}>
                <td className="py-1 flex items-center gap-1">
                  <span>{FLAGS[r.team] || '🏳'}</span> {r.team}
                </td>
                <td className="text-center">{r.group}</td>
                <td className="text-center">{r.pts}</td>
                <td className="text-center">{r.dg}</td>
                <td className="text-center">{r.gf}</td>
                <td className="text-center">
                  {r.qualifies
                    ? <span className="text-green-600">Clasifica</span>
                    : <span>Eliminado</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-[10px] text-gray-400 mt-2">
        La FIFA decide con su tabla oficial (Anexo C) a qué cruce exacto va cada tercero clasificado.
        Usá este ranking como guía y asigná manualmente cada equipo en su cruce "3º (...)" más abajo.
      </p>
    </div>
  )
}

function ThirdPlaceSlot({ match, field, placeholder, matches, onSaved }) {
  const combo = parseThirdCombo(placeholder) || []
  const { rows } = getThirdPlaceRanking(matches)

  const usedNames = new Set(
    matches.filter(m => m.phase === 'r32').flatMap(m => [m.home, m.away]).filter(isRealTeam)
  )

  const options = rows.filter(r => r.qualifies && combo.includes(r.group) && !usedNames.has(r.team))

  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAssign() {
    if (!value) return
    setSaving(true)
    await supabase.from('matches').update({ [field]: value }).eq('id', match.id)
    setSaving(false)
    onSaved()
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <select
        value={value}
        onChange={e => setValue(e.target.value)}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1 flex-1"
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.team} value={o.team}>{o.team} (3º {o.group})</option>
        ))}
      </select>
      <button
        onClick={handleAssign}
        disabled={!value || saving}
        className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold px-2 py-1 rounded-lg"
      >
        {saving ? '…' : 'Asignar'}
      </button>
    </div>
  )
}

function ScheduleEditor({ match, onSaved }) {
  const [date, setDate] = useState(match.date || '')
  const [time, setTime] = useState(match.match_time || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDate(match.date || '')
    setTime(match.match_time || '')
  }, [match.date, match.match_time])

  const isDirty = date !== (match.date || '') || time !== (match.match_time || '')

  async function handleSave() {
    if (!isDirty) return
    setSaving(true)
    await supabase.from('matches').update({ date, match_time: time }).eq('id', match.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    onSaved()
  }

  return (
    <div className="flex items-center gap-2 px-3 pt-2 pb-1">
      <span className="text-[10px] text-gray-400 font-bold w-7 flex-shrink-0">P{match.match_number}</span>
      <input
        type="text" placeholder="ej. 4 Jul" value={date}
        onChange={e => { setDate(e.target.value); setSaved(false) }}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-20"
      />
      <input
        type="text" placeholder="HH:MM" value={time}
        onChange={e => { setTime(e.target.value); setSaved(false) }}
        className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-16"
      />
      <button
        onClick={handleSave}
        disabled={!isDirty || saving}
        className="text-xs bg-gray-900 hover:bg-gray-700 disabled:opacity-30 text-white font-bold px-2 py-1 rounded-lg flex-shrink-0"
      >
        {saving ? '…' : saved ? '✓' : 'Guardar horario'}
      </button>
    </div>
  )
}

export default function ResultsAdmin({ matches, onSaved }) {
  const [selected, setSelected] = useState('A')
  const filling = useRef(false)

  useEffect(() => {
    if (filling.current) return
    const updates = getPlaceholderUpdates(matches)
    if (updates.length === 0) return

    filling.current = true
    Promise.all(
      updates.map(u => supabase.from('matches').update({ [u.field]: u.value }).eq('id', u.id))
    ).then(() => {
      filling.current = false
      onSaved()
    })
  }, [matches, onSaved])

  const isGroup   = GROUP_LETTERS.includes(selected)
  const filtered  = isGroup
    ? matches.filter(m => m.group_name === selected)
    : matches.filter(m => m.phase === selected)

  const withResult    = filtered.filter(m => m.result_home != null)
  const withoutResult = filtered.filter(m => m.result_home == null)
  const unresolvedThirds = selected === 'r32'
    ? filtered.filter(m => isUnresolvedThirdSlot(m.home) || isUnresolvedThirdSlot(m.away))
    : []

  return (
    <div className="space-y-4">
      {/* Selector de grupo/fase */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-gray-400 font-bold uppercase w-full">Grupos</span>
          {GROUP_LETTERS.map(g => (
            <button
              key={g}
              onClick={() => setSelected(g)}
              className={`w-9 h-9 rounded-lg text-sm font-black transition ${
                selected === g
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-gray-400 font-bold uppercase w-full">Eliminación</span>
          {KNOCKOUT_PHASES.map(p => (
            <button
              key={p.key}
              onClick={() => setSelected(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selected === p.key
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {selected === 'r32' && (
        <>
          <ThirdPlaceRankingPanel matches={matches} />

          {unresolvedThirds.length > 0 && (
            <div>
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">
                Cruces de tercero sin asignar ({unresolvedThirds.length})
              </p>
              <div className="space-y-2">
                {unresolvedThirds.map(m => (
                  <div key={m.id} className="bg-orange-50 border border-orange-100 rounded-xl p-2">
                    <p className="text-xs text-gray-600">
                      P{m.match_number}: <span className="font-semibold">{m.home}</span> vs <span className="font-semibold">{m.away}</span>
                    </p>
                    {isUnresolvedThirdSlot(m.home) && (
                      <ThirdPlaceSlot match={m} field="home" placeholder={m.home} matches={matches} onSaved={onSaved} />
                    )}
                    {isUnresolvedThirdSlot(m.away) && (
                      <ThirdPlaceSlot match={m} field="away" placeholder={m.away} matches={matches} onSaved={onSaved} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Partidos sin resultado */}
      {withoutResult.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Sin resultado ({withoutResult.length})
          </p>
          <div className="space-y-2">
            {withoutResult.map(m => (
              <div key={m.id} className={!isGroup ? 'bg-white border border-gray-100 rounded-xl overflow-hidden' : ''}>
                {!isGroup && <ScheduleEditor match={m} onSaved={onSaved} />}
                <MatchResultRow match={m} onSaved={onSaved} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Partidos con resultado */}
      {withResult.length > 0 && (
        <div>
          <p className="text-xs font-bold text-green-600 uppercase tracking-wider mb-2">
            Con resultado ({withResult.length})
          </p>
          <div className="space-y-2">
            {withResult.map(m => (
              <div key={m.id} className={!isGroup ? 'bg-white border border-gray-100 rounded-xl overflow-hidden' : ''}>
                {!isGroup && <ScheduleEditor match={m} onSaved={onSaved} />}
                <MatchResultRow match={m} onSaved={onSaved} />
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-center text-gray-400 py-8 text-sm">No hay partidos para esta selección</p>
      )}
    </div>
  )
}
