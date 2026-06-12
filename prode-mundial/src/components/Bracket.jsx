import { useState, useRef, useEffect } from 'react'
import { FLAGS, isRealTeam } from '../data/teams'
import { isMatchLocked, isMatchInProgress } from '../utils/matchTime'

// ── Tree layout constants ──────────────────────────────────
const CW  = 108
const CH  = 66
const VG  = 10
const U   = CH + VG
const HG  = 16
const TOP = 24
const TW  = 9 * CW + 8 * HG
const BH  = TOP + 8 * U

const ROUND_COLOR = ['#4b5563', '#3b82f6', '#8b5cf6', '#f59e0b']

function cY(round, idx) {
  const span = U * Math.pow(2, round)
  return TOP + idx * span + span / 2
}
function tY(round, idx) { return cY(round, idx) - CH / 2 }

function arms(round, fromX, toX, prefix) {
  const count = 8 / Math.pow(2, round)
  const midX  = (fromX + toX) / 2
  const color = ROUND_COLOR[round]
  const els   = []
  for (let p = 0; p < count / 2; p++) {
    const y0 = cY(round, p * 2), y1 = cY(round, p * 2 + 1), my = (y0 + y1) / 2
    els.push(
      <line key={`${prefix}a${p}`} x1={fromX} y1={y0}  x2={midX} y2={y0}  stroke={color} strokeWidth="1.5" strokeOpacity=".55"/>,
      <line key={`${prefix}b${p}`} x1={fromX} y1={y1}  x2={midX} y2={y1}  stroke={color} strokeWidth="1.5" strokeOpacity=".55"/>,
      <line key={`${prefix}c${p}`} x1={midX}  y1={y0}  x2={midX} y2={y1}  stroke={color} strokeWidth="1.5" strokeOpacity=".55"/>,
      <line key={`${prefix}d${p}`} x1={midX}  y1={my}  x2={toX}  y2={my}  stroke={color} strokeWidth="1.5" strokeOpacity=".55"/>,
    )
  }
  return els
}

// ── Shared dark team row (tree + mobile) ───────────────────
function DarkTeamRow({ name, score, val, setVal, onBlur, hasResult, canPredict, locked,
                       border, isWinner, isFinal, is3rd, compact }) {
  const real  = isRealTeam(name)
  const flag  = FLAGS[name]
  const medal = isFinal && hasResult && isWinner ? '🏆'
              : is3rd   && hasResult && isWinner ? '🥉'
              : null
  const h = compact ? (CH - 20) / 2 : 38

  return (
    <div style={{ height: h }}
         className={`flex items-center gap-1 ${compact ? 'px-1.5' : 'px-3 gap-2'} ${border ? 'border-b border-white/10' : ''} ${isWinner && hasResult ? 'bg-white/5' : ''}`}>
      {medal && <span style={{ fontSize: compact ? 11 : 15, flexShrink: 0 }}>{medal}</span>}
      <div className="flex-1 flex items-center gap-1 min-w-0">
        {real && flag && <span style={{ fontSize: compact ? 11 : 14, flexShrink: 0, lineHeight: 1 }}>{flag}</span>}
        <span style={{ fontSize: compact ? 11 : 13 }}
              className={`font-semibold truncate leading-tight ${
                real
                  ? isWinner && hasResult
                    ? isFinal ? 'text-yellow-300' : 'text-white'
                    : 'text-gray-300'
                  : 'text-gray-600 italic'
              }`}>
          {name}
        </span>
      </div>
      {hasResult ? (
        <span style={{ fontSize: compact ? 11 : 14, width: compact ? 18 : 24 }}
              className={`font-black text-center flex-shrink-0 ${isWinner ? 'text-white' : 'text-gray-500'}`}>
          {score ?? '–'}
        </span>
      ) : locked && real ? (
        <span style={{ fontSize: 10, width: compact ? 18 : 24 }} className="text-center flex-shrink-0">🔒</span>
      ) : canPredict ? (
        <input type="number" min="0" max="99" value={val}
               onChange={e => setVal(e.target.value)} onBlur={onBlur}
               style={{
                 width: compact ? 24 : 36, height: compact ? 18 : 28,
                 padding: 0, fontSize: compact ? 11 : 13, textAlign: 'center',
                 background: 'rgba(255,255,255,0.1)', color: 'white',
                 border: '1px solid rgba(255,255,255,0.2)', borderRadius: 4, outline: 'none',
               }}
        />
      ) : (
        <span style={{ fontSize: 10, width: compact ? 18 : 24, color: '#374151' }} className="text-center flex-shrink-0">–</span>
      )}
    </div>
  )
}

// ── Shared dark match card ─────────────────────────────────
function DarkCard({ match, prediction, onSave, accentColor, isFinal = false, is3rd = false, compact = true }) {
  const [ph, setPh]         = useState(prediction?.pred_home ?? '')
  const [pa, setPa]         = useState(prediction?.pred_away ?? '')
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const hasResult  = match.result_home != null && match.result_away != null
  const locked     = isMatchLocked(match)
  const inProgress = isMatchInProgress(match)
  const canPredict = isRealTeam(match.home) && isRealTeam(match.away) && !locked

  const isDirty = canPredict && ph !== '' && pa !== '' && (
    String(ph) !== String(prediction?.pred_home ?? '') ||
    String(pa) !== String(prediction?.pred_away ?? '')
  )

  async function handleBlur() {
    if (!compact || ph === '' || pa === '') return
    await onSave(match.id, +ph, +pa)
  }

  async function handleSave() {
    if (!isDirty) return
    setSaving(true)
    await onSave(match.id, +ph, +pa)
    setSaving(false)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 2000)
  }

  const homeWins = hasResult && match.result_home > match.result_away
  const awayWins = hasResult && match.result_away > match.result_home
  const pts    = prediction?.points
  const ptsBg  = hasResult && pts != null
    ? pts === 3 ? '#16a34a' : pts === 1 ? '#ca8a04' : '#374151'
    : null

  const w = compact ? CW  : '100%'
  const h = compact ? CH  : 'auto'

  return (
    <div style={{
      width: w, height: h,
      border: isFinal ? `2px solid ${accentColor}` : '1px solid rgba(255,255,255,0.08)',
      boxShadow: isFinal ? `0 0 18px ${accentColor}55, 0 2px 8px rgba(0,0,0,.5)` : '0 1px 4px rgba(0,0,0,.4)',
      background: '#1e293b', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ height: compact ? 20 : 26, background: '#0f172a', display: 'flex', alignItems: 'center', padding: '0 6px', gap: 4, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <span style={{ fontSize: compact ? 8 : 10, fontWeight: 700, color: accentColor || '#6b7280' }}>P{match.match_number}</span>
        {!compact && <span style={{ fontSize: 10, color: '#6b7280' }}>{match.date}</span>}
        {inProgress && <span style={{ fontSize: compact ? 7 : 9, fontWeight: 800, color: '#f97316' }}>● VIVO</span>}
        {ptsBg && <span style={{ marginLeft: 'auto', fontSize: compact ? 7 : 9, fontWeight: 800, color: 'white', background: ptsBg, padding: '1px 4px', borderRadius: 3 }}>{pts}pt</span>}
      </div>
      <DarkTeamRow name={match.home} score={match.result_home} val={ph} setVal={v => { setPh(v); setJustSaved(false) }}
                   onBlur={handleBlur} hasResult={hasResult} canPredict={canPredict} locked={locked}
                   border isWinner={homeWins} isFinal={isFinal} is3rd={is3rd} compact={compact} />
      <DarkTeamRow name={match.away} score={match.result_away} val={pa} setVal={v => { setPa(v); setJustSaved(false) }}
                   onBlur={handleBlur} hasResult={hasResult} canPredict={canPredict} locked={locked}
                   isWinner={awayWins} isFinal={isFinal} is3rd={is3rd} compact={compact} />
      {!compact && canPredict && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)', padding: '6px 8px' }}>
          {justSaved ? (
            <div style={{ textAlign: 'center', color: '#4ade80', fontSize: 12, fontWeight: 700 }}>✓ Guardado</div>
          ) : isDirty ? (
            <button onClick={handleSave} disabled={saving}
                    style={{ width: '100%', background: '#16a34a', color: 'white', fontSize: 12, fontWeight: 700, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? '…' : 'Guardar predicción'}
            </button>
          ) : prediction?.pred_home != null ? (
            <div style={{ textAlign: 'center', color: '#4b5563', fontSize: 11 }}>✓ Guardado</div>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ── Mobile: round navigator ────────────────────────────────
const MOBILE_ROUNDS = [
  { key: 'r32',   label: 'Ronda 32',      color: ROUND_COLOR[0] },
  { key: 'r16',   label: 'Octavos',       color: ROUND_COLOR[1] },
  { key: 'qf',    label: 'Cuartos',       color: ROUND_COLOR[2] },
  { key: 'sf',    label: 'Semis',         color: ROUND_COLOR[3] },
  { key: 'final', label: '⚽ Final',      color: '#f59e0b'      },
  { key: '3rd',   label: '🥉 3er Puesto', color: '#a16207'      },
]

function MobileNavigator({ phaseMap, predictions, onSave }) {
  const available = MOBILE_ROUNDS.filter(r => phaseMap[r.key]?.length > 0)
  const [active, setActive] = useState(available[0]?.key || 'r32')
  const round    = MOBILE_ROUNDS.find(r => r.key === active)
  const matches  = phaseMap[active] || []
  const isFinal  = active === 'final'
  const is3rd    = active === '3rd'

  const finM = phaseMap['final']?.[0]
  const winnerName = isFinal && finM?.result_home != null
    ? finM.result_home > finM.result_away ? finM.home
    : finM.result_away > finM.result_home ? finM.away
    : null
    : null

  return (
    <div style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1a1035 50%,#0f172a 100%)', borderRadius: 16, overflow: 'hidden' }}>
      {/* Round pills */}
      <div className="flex overflow-x-auto gap-2 p-3 scrollbar-none">
        {available.map(r => (
          <button key={r.key} onClick={() => setActive(r.key)}
                  style={{
                    border:      `1.5px solid ${active === r.key ? r.color : 'transparent'}`,
                    color:       active === r.key ? r.color : '#6b7280',
                    background:  active === r.key ? `${r.color}18` : 'rgba(255,255,255,.04)',
                    fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
                    transition: 'all 150ms',
                  }}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="px-3 pb-4">
        {/* Champion banner */}
        {winnerName && (
          <div className="text-center py-4 mb-3" style={{ borderBottom: '1px solid rgba(245,158,11,.2)' }}>
            <div style={{ fontSize: 44 }}>🏆</div>
            <p style={{ color: '#fbbf24', fontSize: 11, fontWeight: 800, letterSpacing: 2, marginTop: 4 }}>CAMPEÓN</p>
            <p style={{ color: '#fde68a', fontSize: 18, fontWeight: 700, marginTop: 2 }}>{winnerName}</p>
          </div>
        )}

        {/* Match grid */}
        <div className={`grid gap-3 ${matches.length >= 4 ? 'grid-cols-2' : matches.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : 'grid-cols-2'}`}>
          {matches.map(m => (
            <DarkCard key={m.id} match={m} prediction={predictions[m.id]} onSave={onSave}
                      accentColor={round?.color} isFinal={isFinal} is3rd={is3rd} compact={false} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Desktop: full tree bracket ─────────────────────────────
function TreeBracket({ phaseMap, predictions, onSave, scale }) {
  const cx     = Array.from({ length: 9 }, (_, i) => i * (CW + HG))
  const trdTop = tY(3, 0) + CH + 24
  const svgH   = Math.max(BH, trdTop + CH + 12)

  const { r32, r16, qf, sf, final: fin, '3rd': trd } = phaseMap
  const lr32 = r32.slice(0,8), rr32 = r32.slice(8)
  const lr16 = r16.slice(0,4), rr16 = r16.slice(4)
  const lqf  = qf.slice(0,2),  rqf  = qf.slice(2)
  const lsf  = sf.slice(0,1),  rsf  = sf.slice(1)

  const finM       = fin[0]
  const winnerName = finM?.result_home != null
    ? finM.result_home > finM.result_away ? finM.home
    : finM.result_away > finM.result_home ? finM.away
    : null : null

  const COL_LABELS = ['Ronda 32','Octavos','Cuartos','Semis','⚽ Final','Semis','Cuartos','Octavos','Ronda 32']

  function place(m, col, round, idx) {
    const isF = m.phase === 'final', is3 = m.phase === '3rd'
    const col4 = isF ? '#f59e0b' : is3 ? '#a16207' : ROUND_COLOR[round] || ROUND_COLOR[0]
    return (
      <div key={m.id} style={{ position: 'absolute', left: cx[col], top: tY(round, idx) }}>
        <DarkCard match={m} prediction={predictions[m.id]} onSave={onSave}
                  accentColor={col4} isFinal={isF} is3rd={is3} compact />
      </div>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(160deg,#0f172a 0%,#1a1035 50%,#0f172a 100%)',
      borderRadius: 16, padding: 12,
      height: svgH * scale + 24,
    }}>
      <div style={{ width: TW, height: svgH, position: 'relative', transformOrigin: 'top left', transform: `scale(${scale})` }}>

        <svg width={TW} height={svgH} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <ellipse cx={cx[4]+CW/2} cy={cY(3,0)} rx={CW*.9} ry={CH*1.2} fill="#f59e0b" fillOpacity=".06"/>

          {COL_LABELS.map((label, i) => {
            const c = i === 4 ? '#f59e0b' : i < 4 ? ROUND_COLOR[3-i] : ROUND_COLOR[8-i] ?? ROUND_COLOR[0]
            return <text key={i} x={cx[i]+CW/2} y={TOP-8} textAnchor="middle" fontSize="8" fontWeight="700" fill={c} fillOpacity=".9" fontFamily="system-ui">{label}</text>
          })}

          {arms(0, cx[0]+CW, cx[1], 'L0')}
          {arms(1, cx[1]+CW, cx[2], 'L1')}
          {arms(2, cx[2]+CW, cx[3], 'L2')}
          <line x1={cx[3]+CW} y1={cY(3,0)} x2={cx[4]}    y2={cY(3,0)} stroke="#f59e0b" strokeWidth="1.5" strokeOpacity=".5"/>

          {arms(0, cx[8],    cx[7]+CW, 'R0')}
          {arms(1, cx[7],    cx[6]+CW, 'R1')}
          {arms(2, cx[6],    cx[5]+CW, 'R2')}
          <line x1={cx[5]}   y1={cY(3,0)} x2={cx[4]+CW}  y2={cY(3,0)} stroke="#f59e0b" strokeWidth="1.5" strokeOpacity=".5"/>

          {winnerName && <>
            <text x={cx[4]+CW/2} y={tY(3,0)-22} textAnchor="middle" fontSize="24">🏆</text>
            <text x={cx[4]+CW/2} y={tY(3,0)-7}  textAnchor="middle" fontSize="8" fontWeight="800" fill="#fbbf24" letterSpacing="1" fontFamily="system-ui">CAMPEÓN</text>
          </>}

          <text x={cx[4]+CW/2} y={trdTop-8} textAnchor="middle" fontSize="8" fontWeight="700" fill="#a16207" fillOpacity=".9" fontFamily="system-ui">Tercer Puesto</text>
        </svg>

        {lr32.map((m,i) => place(m, 0, 0, i))}
        {lr16.map((m,i) => place(m, 1, 1, i))}
        {lqf.map( (m,i) => place(m, 2, 2, i))}
        {lsf.map( (m,i) => place(m, 3, 3, i))}
        {fin.map(m => (
          <div key={m.id} style={{ position: 'absolute', left: cx[4], top: tY(3,0) }}>
            <DarkCard match={m} prediction={predictions[m.id]} onSave={onSave} accentColor="#f59e0b" isFinal compact />
          </div>
        ))}
        {rsf.map( (m,i) => place(m, 5, 3, i))}
        {rqf.map( (m,i) => place(m, 6, 2, i))}
        {rr16.map((m,i) => place(m, 7, 1, i))}
        {rr32.map((m,i) => place(m, 8, 0, i))}
        {trd.map(m => (
          <div key={m.id} style={{ position: 'absolute', left: cx[4], top: trdTop }}>
            <DarkCard match={m} prediction={predictions[m.id]} onSave={onSave} accentColor="#a16207" is3rd compact />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Root component ─────────────────────────────────────────
export default function Bracket({ matches, predictions, onSave }) {
  const containerRef = useRef(null)
  const [scale, setScale]   = useState(null)

  useEffect(() => {
    function measure() {
      if (!containerRef.current) return
      const w = containerRef.current.offsetWidth
      setScale(Math.min(1.5, (w - 24) / TW))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const ko = matches.filter(m => m.phase !== 'groups')
  function ph(key) {
    return ko.filter(m => m.phase === key)
             .sort((a, b) => (a.match_number || a.id) - (b.match_number || b.id))
  }

  const phaseMap = {
    r32:   ph('r32'), r16: ph('r16'), qf: ph('qf'),
    sf:    ph('sf'),
    final: ph('final'),
    '3rd': ph('3rd'),
  }

  // Threshold: show tree when scale ≥ 0.62 (fits well on tablet landscape+)
  const THRESHOLD = 0.62
  const showTree  = scale !== null && scale >= THRESHOLD

  return (
    <div ref={containerRef} className="-mx-4">
      {scale === null && (
        <div style={{ height: 8 }} />
      )}
      {scale !== null && (
        showTree
          ? <TreeBracket phaseMap={phaseMap} predictions={predictions} onSave={onSave} scale={scale} />
          : <MobileNavigator phaseMap={phaseMap} predictions={predictions} onSave={onSave} />
      )}
    </div>
  )
}
