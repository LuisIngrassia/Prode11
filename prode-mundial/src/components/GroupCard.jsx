import { useState } from 'react'
import { FLAGS, GROUPS, GROUP_COLORS } from '../data/teams'
import { isMatchLocked, isMatchInProgress } from '../utils/matchTime'

function computeStandings(matches, predictions, groupTeams) {
  const stats = {}
  groupTeams.forEach(t => {
    stats[t] = { name: t, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }
  })

  matches.forEach(match => {
    const rh = match.result_home ?? predictions[match.id]?.pred_home
    const ra = match.result_away ?? predictions[match.id]?.pred_away
    if (rh == null || ra == null) return

    const h = stats[match.home]
    const a = stats[match.away]
    if (!h || !a) return

    h.pj++; a.pj++
    h.gf += Number(rh); h.gc += Number(ra)
    a.gf += Number(ra); a.gc += Number(rh)

    if (rh > ra)      { h.g++; h.pts += 3; a.p++ }
    else if (rh < ra) { a.g++; a.pts += 3; h.p++ }
    else              { h.e++; h.pts++;    a.e++; a.pts++ }
  })

  return Object.values(stats).sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    const dga = a.gf - a.gc, dgb = b.gf - b.gc
    if (dgb !== dga) return dgb - dga
    return b.gf - a.gf
  })
}

function MatchRow({ match, prediction, onSave, color }) {
  const [ph, setPh] = useState(prediction?.pred_home ?? '')
  const [pa, setPa] = useState(prediction?.pred_away ?? '')

  const hasResult   = match.result_home != null && match.result_away != null
  const inProgress  = isMatchInProgress(match)
  const locked      = isMatchLocked(match)

  async function handleBlur() {
    if (locked || ph === '' || pa === '') return
    await onSave(match.id, parseInt(ph), parseInt(pa))
  }

  function pointsBadge() {
    if (inProgress) return <span className="text-xs text-orange-500 font-bold animate-pulse">EN CURSO</span>
    if (!hasResult || !prediction) return null
    const pts = prediction.points
    const cls = pts === 3 ? 'bg-green-500' : pts === 1 ? 'bg-yellow-400' : 'bg-gray-300 text-gray-600'
    return (
      <span className={`text-white text-xs font-bold px-1.5 py-0.5 rounded ${cls}`}>
        {pts}p
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition">
      {/* Local */}
      <div className="flex items-center gap-1 flex-1 justify-end min-w-0">
        <span className="text-xs font-medium text-gray-700 text-right truncate leading-tight">
          {match.home}
        </span>
        <span className="text-sm flex-shrink-0">{FLAGS[match.home] || '🏳'}</span>
      </div>

      {/* Marcador */}
      <div className="flex items-center gap-0.5 mx-1 flex-shrink-0">
        {hasResult ? (
          <div className="flex items-center gap-1 min-w-[52px] justify-center">
            <span className="text-base font-black text-gray-800">{match.result_home}</span>
            <span className="text-gray-300 font-bold">-</span>
            <span className="text-base font-black text-gray-800">{match.result_away}</span>
          </div>
        ) : locked ? (
          <div className="flex items-center gap-1 min-w-[52px] justify-center">
            <span className="text-lg">🔒</span>
          </div>
        ) : (
          <div className="flex items-center gap-0.5 min-w-[64px] justify-center">
            <input
              type="number" min="0" max="99"
              value={ph}
              onChange={e => setPh(e.target.value)}
              onBlur={handleBlur}
              className={`w-9 text-center border-2 rounded-md py-0.5 text-sm font-bold focus:outline-none focus:border-current ${color.border} bg-white text-gray-800`}
            />
            <span className="text-gray-300 font-bold text-xs">-</span>
            <input
              type="number" min="0" max="99"
              value={pa}
              onChange={e => setPa(e.target.value)}
              onBlur={handleBlur}
              className={`w-9 text-center border-2 rounded-md py-0.5 text-sm font-bold focus:outline-none focus:border-current ${color.border} bg-white text-gray-800`}
            />
          </div>
        )}
      </div>

      {/* Visitante */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <span className="text-sm flex-shrink-0">{FLAGS[match.away] || '🏳'}</span>
        <span className="text-xs font-medium text-gray-700 truncate leading-tight">
          {match.away}
        </span>
      </div>

      <div className="w-7 flex justify-center flex-shrink-0">
        {pointsBadge()}
      </div>
    </div>
  )
}

export default function GroupCard({ group, matches, predictions, onSave }) {
  const color = GROUP_COLORS[group] || GROUP_COLORS.A
  const groupTeams = GROUPS[group] || []
  const standings = computeStandings(matches, predictions, groupTeams)

  const md = [matches.slice(0, 2), matches.slice(2, 4), matches.slice(4, 6)]

  const qualifyDot = (idx) => {
    if (idx === 0 || idx === 1)
      return <span className={`w-1.5 h-1.5 rounded-full ${color.bg} inline-block ml-1 opacity-90`} />
    if (idx === 2)
      return <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block ml-1 opacity-90" />
    return null
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className={`${color.bg} px-4 py-3 flex items-center gap-3`}>
        <span className="text-3xl font-black text-white leading-none">{group}</span>
        <span className="text-white/80 text-sm font-medium">Grupo {group}</span>
      </div>

      {/* Tabla de posiciones */}
      <div className="px-3 pt-3 pb-1 border-b border-gray-100">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 uppercase tracking-wide">
              <th className="text-left pb-1 font-medium pl-0.5 w-auto">Equipo</th>
              <th className="pb-1 font-medium w-5 text-center">PJ</th>
              <th className="pb-1 font-medium w-5 text-center">G</th>
              <th className="pb-1 font-medium w-5 text-center">E</th>
              <th className="pb-1 font-medium w-5 text-center">P</th>
              <th className="pb-1 font-medium w-5 text-center">GF</th>
              <th className="pb-1 font-medium w-5 text-center">GC</th>
              <th className={`pb-1 font-bold w-6 text-center ${color.text}`}>Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {standings.map((team, idx) => (
              <tr key={team.name} className={idx < 2 ? 'font-semibold' : 'text-gray-500'}>
                <td className="py-1 pl-0.5">
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{FLAGS[team.name] || '🏳'}</span>
                    <span className={`truncate max-w-[90px] ${idx < 2 ? 'text-gray-800' : 'text-gray-500'}`}>
                      {team.name}
                    </span>
                    {qualifyDot(idx)}
                  </div>
                </td>
                <td className="text-center">{team.pj}</td>
                <td className="text-center">{team.g}</td>
                <td className="text-center">{team.e}</td>
                <td className="text-center">{team.p}</td>
                <td className="text-center">{team.gf}</td>
                <td className="text-center">{team.gc}</td>
                <td className={`text-center font-bold ${idx < 2 ? color.text : ''}`}>{team.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Partidos por fecha */}
      <div className="px-2 py-2 space-y-1">
        {md.map((fecha, i) => (
          <div key={i}>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider px-2 pt-1 pb-0.5">
              Fecha {i + 1}
              {fecha[0] && <span className="font-normal normal-case ml-1">— {fecha[0].date}</span>}
            </p>
            {fecha.map(match => (
              <MatchRow
                key={match.id}
                match={match}
                prediction={predictions[match.id]}
                onSave={onSave}
                color={color}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
