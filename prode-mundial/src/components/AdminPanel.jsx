import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import ResultsAdmin from './ResultsAdmin'

function LigaCutEditor({ liga, onSave }) {
  const [enabled, setEnabled] = useState((liga.organizer_cut ?? 0) > 0)
  const [pct, setPct]         = useState(liga.organizer_cut > 0 ? liga.organizer_cut : 10)
  const [saving, setSaving]   = useState(false)
  const [msg,    setMsg]      = useState('')

  async function handleSave() {
    setSaving(true)
    setMsg('')
    const cut = enabled ? Math.max(0, Math.min(100, Number(pct))) : 0
    const { error } = await onSave(liga.id, cut)
    setSaving(false)
    setMsg(error ? '✗ Error al guardar' : '✓ Guardado')
    setTimeout(() => setMsg(''), 2000)
  }

  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
      <span className="text-xs text-gray-500 flex-shrink-0">Comisión:</span>
      <button
        type="button"
        onClick={() => setEnabled(e => !e)}
        className={`relative inline-flex w-9 h-5 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
      {enabled ? (
        <>
          <input
            type="number" min="1" max="100" value={pct}
            onChange={e => setPct(e.target.value)}
            className="w-14 text-xs border border-gray-300 rounded px-2 py-0.5 text-center"
          />
          <span className="text-xs text-gray-500">%</span>
        </>
      ) : (
        <span className="text-xs text-gray-400">Sin comisión</span>
      )}
      {msg ? (
        <span className={`ml-auto text-xs font-bold ${msg.startsWith('✗') ? 'text-red-500' : 'text-green-600'}`}>{msg}</span>
      ) : (
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-2.5 py-1 rounded-lg transition disabled:opacity-50"
        >
          {saving ? '…' : 'Guardar'}
        </button>
      )}
    </div>
  )
}

function LigasPendingPanel() {
  const [items,    setItems]    = useState([])
  const [ligas,    setLigas]    = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    const [{ data: members }, { data: allLigas }] = await Promise.all([
      supabase.from('liga_members').select('*, ligas(id, nombre, entry_amount)').order('liga_id'),
      supabase.from('ligas').select('id, nombre, entry_amount, pending_entry_amount, codigo, organizer_cut').order('created_at'),
    ])
    setItems(members || [])
    setLigas(allLigas || [])

    const ids = (members || []).map(m => m.user_id)
    if (ids.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('id, name').in('id', ids)
      const map = {}
      profs?.forEach(p => { map[p.id] = p.name })
      setProfiles(map)
    }
    setLoading(false)
  }, [])

  async function updateLigaCut(ligaId, cut) {
    const { error } = await supabase.from('ligas').update({ organizer_cut: cut }).eq('id', ligaId)
    if (!error) await load()
    return { error }
  }

  async function approvePriceChange(ligaId, newAmount) {
    await supabase.from('ligas')
      .update({ entry_amount: newAmount, pending_entry_amount: null })
      .eq('id', ligaId)
    await supabase.from('liga_members')
      .update({ paid: false, paid_at: null, note: null })
      .eq('liga_id', ligaId)
    await load()
  }

  async function rejectPriceChange(ligaId) {
    await supabase.from('ligas')
      .update({ pending_entry_amount: null })
      .eq('id', ligaId)
    await load()
  }

  async function deleteLiga(ligaId, nombre) {
    if (!confirm(`¿Borrar la sala "${nombre}"? Se eliminarán todos sus miembros.`)) return
    setDeleting(ligaId)
    await supabase.from('ligas').delete().eq('id', ligaId)
    await load()
    setDeleting(null)
  }

  useEffect(() => { load() }, [load])

  const pending   = items.filter(m => !m.paid)
  const confirmed = items.filter(m =>  m.paid)

  async function confirm(ligaId, userId) {
    await supabase.from('liga_members')
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq('liga_id', ligaId).eq('user_id', userId)
    await load()
  }

  async function reject(ligaId, userId) {
    await supabase.from('liga_members')
      .delete().eq('liga_id', ligaId).eq('user_id', userId)
    await load()
  }

  if (loading) return <p className="text-center text-gray-400 py-8 text-sm">Cargando...</p>

  function MemberRow({ m, isPending }) {
    const [busy, setBusy] = useState(false)
    return (
      <div className={`flex items-center gap-3 p-3 rounded-xl border ${isPending ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{profiles[m.user_id] || '—'}</p>
          <p className="text-xs text-gray-500 truncate">
            {m.ligas?.nombre} · {m.note || 'Sin referencia'}
          </p>
        </div>
        {m.ligas?.entry_amount > 0 && (
          <p className="font-black text-gray-800 flex-shrink-0">
            ${Number(m.ligas.entry_amount).toLocaleString('es-AR')}
          </p>
        )}
        {isPending ? (
          <div className="flex gap-1.5 flex-shrink-0">
            <button disabled={busy} onClick={async () => { setBusy(true); await confirm(m.liga_id, m.user_id) }}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50">✓</button>
            <button disabled={busy} onClick={async () => { setBusy(true); await reject(m.liga_id, m.user_id) }}
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50">✕</button>
          </div>
        ) : (
          <span className="text-green-600 text-lg flex-shrink-0">✓</span>
        )}
      </div>
    )
  }

  const pendingPriceChanges = ligas.filter(l => l.pending_entry_amount != null)

  function fmtARS(n) { return '$' + Number(n).toLocaleString('es-AR') }

  return (
    <div className="space-y-5">

      {/* Cambios de precio pendientes */}
      {pendingPriceChanges.length > 0 && (
        <div>
          <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            💲 Cambios de precio pendientes
            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pendingPriceChanges.length}
            </span>
          </h2>
          <div className="space-y-2">
            {pendingPriceChanges.map(liga => (
              <div key={liga.id} className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate">{liga.nombre}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">#{liga.codigo}</p>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="line-through text-gray-400">{fmtARS(liga.entry_amount || 0)}</span>
                      {' → '}
                      <span className="font-bold text-orange-700">{fmtARS(liga.pending_entry_amount)}</span>
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Al aprobar se anulan todos los depósitos confirmados de esta sala.
                    </p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => approvePriceChange(liga.id, liga.pending_entry_amount)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => rejectPriceChange(liga.id)}
                      className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de salas con opción de borrar */}
      <div>
        <h2 className="font-bold text-gray-700 mb-3">🏟 Salas ({ligas.length})</h2>
        {ligas.length === 0
          ? <p className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl p-4 text-center">No hay salas creadas</p>
          : <div className="space-y-2">
              {ligas.map(liga => {
                const memberCount = items.filter(m => m.liga_id === liga.id).length
                const confirmedCount = items.filter(m => m.liga_id === liga.id && m.paid).length
                return (
                  <div key={liga.id} className="p-3 bg-white rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{liga.nombre}</p>
                        <p className="text-xs text-gray-400 font-mono">
                          #{liga.codigo}
                          {liga.entry_amount > 0 && ` · $${Number(liga.entry_amount).toLocaleString('es-AR')}`}
                          {` · ${confirmedCount}/${memberCount} confirmados`}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteLiga(liga.id, liga.nombre)}
                        disabled={deleting === liga.id}
                        className="text-xs bg-red-100 hover:bg-red-500 hover:text-white text-red-600 font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50 flex-shrink-0"
                      >
                        {deleting === liga.id ? '…' : '🗑 Borrar'}
                      </button>
                    </div>
                    {liga.entry_amount > 0 && <LigaCutEditor liga={liga} onSave={updateLigaCut} />}
                  </div>
                )
              })}
            </div>
        }
      </div>

      <div>
        <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          ⏳ Pendientes
          {pending.length > 0 && (
            <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pending.length}</span>
          )}
        </h2>
        {pending.length === 0
          ? <p className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl p-4 text-center">No hay pagos pendientes</p>
          : <div className="space-y-2">{pending.map(m => <MemberRow key={`${m.liga_id}-${m.user_id}`} m={m} isPending />)}</div>
        }
      </div>
      <div>
        <h2 className="font-bold text-gray-700 mb-3">✅ Confirmados ({confirmed.length})</h2>
        {confirmed.length === 0
          ? <p className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl p-4 text-center">Aún no hay confirmados</p>
          : <div className="space-y-2">{confirmed.map(m => <MemberRow key={`${m.liga_id}-${m.user_id}`} m={m} isPending={false} />)}</div>
        }
      </div>
    </div>
  )
}

function fmt(n) {
  return '$' + Number(n).toLocaleString('es-AR')
}

function EntryRow({ entry, profileName, onConfirm, onReject, isPending }) {
  const [loading, setLoading] = useState(false)

  async function handle(fn) {
    setLoading(true)
    await fn(entry.id)
    setLoading(false)
  }

  const date = entry.confirmed_at || entry.created_at
  const dateStr = date ? new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  }) : '—'

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${
      isPending ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'
    }`}>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{profileName || 'Sin nombre'}</p>
        <p className="text-xs text-gray-500 truncate">
          {entry.note || 'Sin referencia'} · {dateStr}
        </p>
      </div>
      <p className="font-black text-gray-800 text-lg flex-shrink-0">{fmt(entry.amount)}</p>
      {isPending && (
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={() => handle(onConfirm)}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            ✓
          </button>
          <button
            onClick={() => handle(onReject)}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            ✕
          </button>
        </div>
      )}
      {!isPending && (
        <span className="text-green-600 text-lg flex-shrink-0">✓</span>
      )}
    </div>
  )
}

export default function AdminPanel({ entries, confirmed, pending, totalGross, organizerCut, netPool, onConfirm, onReject, matches, onResultSaved }) {
  const [profiles, setProfiles] = useState({})
  const [tab, setTab] = useState('pozo')

  useEffect(() => {
    if (entries.length === 0) return
    const ids = entries.map(e => e.user_id)
    supabase.from('profiles').select('id, name').in('id', ids)
      .then(({ data }) => {
        const map = {}
        data?.forEach(p => { map[p.id] = p.name })
        setProfiles(map)
      })
  }, [entries.length])

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 bg-gray-200 p-1 rounded-xl">
        {[{ id: 'pozo', label: '💰 Pozo' }, { id: 'salas', label: '🏟 Salas' }, { id: 'resultados', label: '⚽ Resultados' }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
              tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resultados' && (
        <ResultsAdmin matches={matches} onSaved={onResultSaved} />
      )}

      {tab === 'salas' && <LigasPendingPanel />}

      {tab === 'pozo' && <div className="space-y-6">
      {/* Stats */}
      <div className="bg-gray-900 rounded-2xl p-5 text-white">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Panel Admin — Pozo</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-800 rounded-xl p-3">
            <p className="text-2xl font-black">${totalGross.toLocaleString('es-AR')}</p>
            <p className="text-xs text-gray-400">recaudado</p>
          </div>
          <div className="bg-green-800 rounded-xl p-3">
            <p className="text-2xl font-black">${netPool.toLocaleString('es-AR')}</p>
            <p className="text-xs text-green-300">pozo neto</p>
          </div>
          <div className="bg-yellow-800 rounded-xl p-3">
            <p className="text-2xl font-black">${organizerCut.toLocaleString('es-AR')}</p>
            <p className="text-xs text-yellow-300">tu corte (10%)</p>
          </div>
        </div>
      </div>

      {/* Pendientes */}
      <div>
        <h2 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          ⏳ Pendientes de confirmación
          {pending.length > 0 && (
            <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          )}
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl p-4 text-center">
            No hay pagos pendientes
          </p>
        ) : (
          <div className="space-y-2">
            {pending.map(e => (
              <EntryRow
                key={e.id}
                entry={e}
                profileName={profiles[e.user_id]}
                onConfirm={onConfirm}
                onReject={onReject}
                isPending
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirmados */}
      <div>
        <h2 className="font-bold text-gray-700 mb-3">
          ✅ Confirmados ({confirmed.length})
        </h2>
        {confirmed.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white border border-gray-100 rounded-xl p-4 text-center">
            Aún no hay pagos confirmados
          </p>
        ) : (
          <div className="space-y-2">
            {confirmed.map(e => (
              <EntryRow
                key={e.id}
                entry={e}
                profileName={profiles[e.user_id]}
                onConfirm={onConfirm}
                onReject={onReject}
                isPending={false}
              />
            ))}
          </div>
        )}
      </div>
      </div>}
    </div>
  )
}
