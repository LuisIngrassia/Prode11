import { useState } from 'react'
import { FLAGS, isRealTeam } from '../data/teams'
import { isMatchLocked, isMatchInProgress } from '../utils/matchTime'

const PHASES = [
  { key: 'r32',   label: 'Ronda de 32',       cols: 2 },
  { key: 'r16',   label: 'Octavos de Final',  cols: 2 },
  { key: 'qf',    label: 'Cuartos de Final',  cols: 2 },
  { key: 'sf',    label: 'Semifinales',        cols: 2 },
  { key: '3rd',   label: 'Tercer Puesto',      cols: 1 },
  { key: 'final', label: '⚽ Gran Final',      cols: 1 },
]

function TeamRow({ name, score, isHome, input, onChangeInput, onBlurInput, hasResult, canPredict, locked }) {
  const flag = FLAGS[name]
  const real = isRealTeam(name)

  return (
    <div className={`flex items-center gap-2 px-3 py-2 ${isHome ? 'border-b border-gray-100' : ''}`}>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {real ? (
          <>
            <span className="text-base flex-shrink-0">{flag}</span>
            <span className="text-sm font-semibold text-gray-800 truncate">{name}</span>
          </>
        ) : (
          <span className="text-xs text-gray-400 truncate italic">{name}</span>
        )}
      </div>
      {hasResult ? (
        <span className={`text-lg font-black w-8 text-center ${score != null ? 'text-gray-800' : 'text-gray-300'}`}>
          {score ?? '–'}
        </span>
      ) : locked && real ? (
        <span className="text-base w-8 text-center">🔒</span>
      ) : canPredict ? (
        <input
          type="number" min="0" max="99"
          value={input}
          onChange={onChangeInput}
          onBlur={onBlurInput}
          className="w-9 text-center border-2 border-gray-200 rounded-md py-0.5 text-sm font-bold focus:outline-none focus:border-green-400 bg-white text-gray-800"
        />
      ) : (
        <span className="text-sm text-gray-200 font-bold w-8 text-center">–</span>
      )}
    </div>
  )
}

function MatchCard({ match, prediction, onSave }) {
  const [ph, setPh] = useState(prediction?.pred_home ?? '')
  const [pa, setPa] = useState(prediction?.pred_away ?? '')

  const hasResult  = match.result_home != null && match.result_away != null
  const locked     = isMatchLocked(match)
  const inProgress = isMatchInProgress(match)
  const canPredict = isRealTeam(match.home) && isRealTeam(match.away) && !locked

  async function handleBlur() {
    if (ph === '' || pa === '') return
    await onSave(match.id, parseInt(ph), parseInt(pa))
  }

  function pointsBadge() {
    if (inProgress) return <div className="text-center text-xs font-bold text-orange-500 py-1 animate-pulse">EN CURSO</div>
    if (!hasResult || !prediction) return null
    const pts = prediction.points
    const cfg = pts === 3
      ? 'bg-green-100 text-green-700'
      : pts === 1
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-gray-100 text-gray-500'
    return (
      <div className={`text-center text-xs font-bold py-1 ${cfg}`}>
        {pts} punto{pts !== 1 ? 's' : ''}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gray-50 px-3 py-1 flex items-center justify-between border-b border-gray-100">
        <span className="text-xs font-bold text-gray-500">P{match.match_number}</span>
        <span className="text-xs text-gray-400">{match.date}</span>
        <span className="text-xs text-gray-400 truncate max-w-[100px] text-right">{match.venue}</span>
      </div>

      <TeamRow
        name={match.home}
        score={match.result_home}
        isHome
        input={ph}
        onChangeInput={e => setPh(e.target.value)}
        onBlurInput={handleBlur}
        hasResult={hasResult}
        canPredict={canPredict}
        locked={locked}
      />
      <TeamRow
        name={match.away}
        score={match.result_away}
        isHome={false}
        input={pa}
        onChangeInput={e => setPa(e.target.value)}
        onBlurInput={handleBlur}
        hasResult={hasResult}
        canPredict={canPredict}
        locked={locked}
      />

      {pointsBadge()}
    </div>
  )
}

export default function Bracket({ matches, predictions, onSave }) {
  const knockout = matches.filter(m => m.phase !== 'groups')

  return (
    <div className="space-y-8">
      {PHASES.map(phase => {
        const phaseMatches = knockout
          .filter(m => m.phase === phase.key)
          .sort((a, b) => (a.match_number || a.id) - (b.match_number || b.id))

        if (phaseMatches.length === 0) return null

        const isFinal = phase.key === 'final' || phase.key === '3rd'

        return (
          <section key={phase.key}>
            <h2 className={`text-sm font-bold uppercase tracking-widest mb-3 px-1 ${
              phase.key === 'final' ? 'text-yellow-600 text-base' : 'text-gray-500'
            }`}>
              {phase.label}
            </h2>
            <div className={
              isFinal
                ? 'max-w-xs'
                : `grid gap-3 ${phase.cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'max-w-xs'}`
            }>
              {phaseMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  prediction={predictions[match.id]}
                  onSave={onSave}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
