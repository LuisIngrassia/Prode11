import { GROUPS, isRealTeam } from '../data/teams'
import { computeStandings, isGroupComplete } from './standings'

const FIRST_RE  = /^1º Grupo ([A-L])$/
const SECOND_RE = /^2º Grupo ([A-L])$/
const THIRD_RE  = /^3º \(([A-L](?:\/[A-L])*)\)$/

function groupStandings(matches, letter) {
  const groupMatches = matches.filter(m => m.group_name === letter)
  if (!isGroupComplete(groupMatches)) return null
  return computeStandings(groupMatches, GROUPS[letter] || [])
}

// 1º/2º Grupo X no dependen de otros grupos: se pueden completar apenas ese grupo termina.
export function getPlaceholderUpdates(matches) {
  const updates = []
  const cache = {}
  const standingsFor = letter => {
    if (!(letter in cache)) cache[letter] = groupStandings(matches, letter)
    return cache[letter]
  }

  matches
    .filter(m => m.phase === 'r32')
    .forEach(m => {
      ;[['home', m.home], ['away', m.away]].forEach(([field, value]) => {
        if (isRealTeam(value)) return

        const firstMatch = value?.match(FIRST_RE)
        if (firstMatch) {
          const st = standingsFor(firstMatch[1])
          if (st) updates.push({ id: m.id, field, value: st[0].name })
          return
        }

        const secondMatch = value?.match(SECOND_RE)
        if (secondMatch) {
          const st = standingsFor(secondMatch[1])
          if (st) updates.push({ id: m.id, field, value: st[1].name })
        }
      })
    })

  return updates
}

// Ranking de los terceros de cada grupo ya finalizado, para guiar la asignación manual
// de los cruces "3º (...)" — la tabla oficial FIFA de 495 combinaciones (Anexo C) decide
// a qué cruce exacto va cada tercero, y no se puede reproducir de forma confiable aquí.
export function getThirdPlaceRanking(matches) {
  const letters = Object.keys(GROUPS)
  const rows = []
  let completeCount = 0

  letters.forEach(letter => {
    const st = standingsCacheSafe(matches, letter)
    if (!st) return
    completeCount++
    const team = st[2]
    if (!team) return
    rows.push({
      group: letter,
      team: team.name,
      pts: team.pts,
      gf: team.gf,
      gc: team.gc,
      dg: team.gf - team.gc,
    })
  })

  rows.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    if (b.dg !== a.dg) return b.dg - a.dg
    return b.gf - a.gf
  })

  rows.forEach((r, idx) => { r.qualifies = idx < 8 })

  return { rows, groupsComplete: completeCount, groupsTotal: letters.length }
}

function standingsCacheSafe(matches, letter) {
  return groupStandings(matches, letter)
}

export function parseThirdCombo(placeholder) {
  const m = placeholder?.match(THIRD_RE)
  return m ? m[1].split('/') : null
}

export function isUnresolvedThirdSlot(value) {
  return THIRD_RE.test(value || '')
}
