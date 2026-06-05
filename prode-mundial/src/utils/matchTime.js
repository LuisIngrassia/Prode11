// Primer partido: México vs Sudáfrica — 11 Jun 15:00 ET = 19:00 UTC
export const TOURNAMENT_START_UTC = new Date(Date.UTC(2026, 5, 11, 19, 0))
export function isTournamentStarted() {
  return Date.now() >= TOURNAMENT_START_UTC.getTime()
}

// Todos los horarios en BD son ET (Eastern Daylight Time = UTC-4 en verano)
const MONTH_MAP = {
  'Ene': 0, 'Feb': 1, 'Mar': 2, 'Abr': 3, 'May': 4, 'Jun': 5,
  'Jul': 6, 'Ago': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dic': 11
}

export function getMatchStartUTC(match) {
  if (!match.date || !match.match_time) return null

  const [dayStr, monthStr] = match.date.trim().split(' ')
  const day   = parseInt(dayStr)
  const month = MONTH_MAP[monthStr]

  if (month === undefined || isNaN(day)) return null

  const [hours, minutes] = match.match_time.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) return null

  // ET (UTC-4) → sumar 4hs para obtener UTC
  return new Date(Date.UTC(2026, month, day, hours + 4, minutes))
}

// true si el partido ya comenzó O ya tiene resultado oficial
export function isMatchLocked(match) {
  if (match.result_home != null) return true
  const start = getMatchStartUTC(match)
  if (!start) return false
  return Date.now() >= start.getTime()
}

// true si ya arrancó pero todavía no tiene resultado (en curso)
export function isMatchInProgress(match) {
  return isMatchLocked(match) && match.result_home == null
}
