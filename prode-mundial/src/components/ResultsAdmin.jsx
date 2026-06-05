import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { FLAGS } from '../data/teams'

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

export default function ResultsAdmin({ matches, onSaved }) {
  const [selected, setSelected] = useState('A')

  const isGroup   = GROUP_LETTERS.includes(selected)
  const filtered  = isGroup
    ? matches.filter(m => m.group_name === selected)
    : matches.filter(m => m.phase === selected)

  const withResult    = filtered.filter(m => m.result_home != null)
  const withoutResult = filtered.filter(m => m.result_home == null)

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

      {/* Partidos sin resultado */}
      {withoutResult.length > 0 && (
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Sin resultado ({withoutResult.length})
          </p>
          <div className="space-y-2">
            {withoutResult.map(m => (
              <MatchResultRow key={m.id} match={m} onSaved={onSaved} />
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
              <MatchResultRow key={m.id} match={m} onSaved={onSaved} />
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
