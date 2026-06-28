export function computeStandings(matches, groupTeams) {
  const stats = {}
  groupTeams.forEach(t => {
    stats[t] = { name: t, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, pts: 0 }
  })

  matches.forEach(match => {
    const rh = match.result_home
    const ra = match.result_away
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

export function isGroupComplete(groupMatches) {
  return groupMatches.length > 0 && groupMatches.every(m => m.result_home != null && m.result_away != null)
}
