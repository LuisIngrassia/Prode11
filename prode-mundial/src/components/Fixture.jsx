import { useState } from 'react'

function MatchCard({ match, prediction, onSave }) {
  const [home, setHome] = useState(prediction?.pred_home ?? '')
  const [away, setAway] = useState(prediction?.pred_away ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const hasResult = match.result_home !== null && match.result_away !== null
  const locked = hasResult

  async function handleSave() {
    if (home === '' || away === '') return
    setSaving(true)
    const err = await onSave(match.id, parseInt(home), parseInt(away))
    setSaving(false)
    if (!err) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  }

  function pointsBadge() {
    if (!hasResult || !prediction) return null
    const pts = prediction.points
    const color = pts === 3 ? 'bg-green-500' : pts === 1 ? 'bg-yellow-500' : 'bg-red-400'
    const label = pts === 3 ? '3pts ✓✓' : pts === 1 ? '1pt ✓' : '0pts'
    return <span className={`text-white text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{label}</span>
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
          {match.group_name ? `Grupo ${match.group_name}` : match.phase?.toUpperCase()} · {match.date}
        </span>
        {pointsBadge()}
      </div>

      <div className="flex items-center gap-3">
        <span className="flex-1 text-right font-semibold text-gray-800">{match.home}</span>

        <div className="flex items-center gap-2">
          {hasResult ? (
            <div className="flex items-center gap-1 font-bold text-lg text-gray-700">
              <span>{match.result_home}</span>
              <span className="text-gray-400">-</span>
              <span>{match.result_away}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="99"
                value={home}
                onChange={e => setHome(e.target.value)}
                disabled={locked}
                className="w-12 text-center border border-gray-300 rounded-lg py-1.5 font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <span className="text-gray-400 font-bold">-</span>
              <input
                type="number"
                min="0"
                max="99"
                value={away}
                onChange={e => setAway(e.target.value)}
                disabled={locked}
                className="w-12 text-center border border-gray-300 rounded-lg py-1.5 font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>
          )}
        </div>

        <span className="flex-1 font-semibold text-gray-800">{match.away}</span>
      </div>

      {hasResult && prediction && (
        <p className="text-center text-xs text-gray-400 mt-2">
          Tu pronóstico: {prediction.pred_home} - {prediction.pred_away}
        </p>
      )}

      {!locked && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={handleSave}
            disabled={saving || home === '' || away === ''}
            className="text-sm bg-green-600 hover:bg-green-700 text-white px-5 py-1.5 rounded-lg transition disabled:opacity-40 font-medium"
          >
            {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function Fixture({ matches, predictions, onSave }) {
  const groups = {}
  matches.forEach(m => {
    const key = m.group_name || m.phase || 'otro'
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  })

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([group, groupMatches]) => (
        <div key={group}>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
            {group.length === 1 ? `Grupo ${group}` : group}
          </h2>
          <div className="space-y-3">
            {groupMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predictions[match.id]}
                onSave={onSave}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
