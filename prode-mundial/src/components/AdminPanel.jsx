import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import ResultsAdmin from './ResultsAdmin'

function LigasPendingPanel() {
  const [items,    setItems]    = useState([])
  const [profiles, setProfiles] = useState({})
  const [loading,  setLoading]  = useState(true)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('liga_members')
      .select('*, ligas(nombre, entry_amount)')
      .order('liga_id')
    setItems(data || [])

    const ids = (data || []).map(m => m.user_id)
    if (ids.length > 0) {
      const { data: profs } = await supabase.from('profiles').select('id, name').in('id', ids)
      const map = {}
      profs?.forEach(p => { map[p.id] = p.name })
      setProfiles(map)
    }
    setLoading(false)
  }, [])

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

  return (
    <div className="space-y-5">
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
            <p className="text-xs text-yellow-300">tu corte (12%)</p>
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
