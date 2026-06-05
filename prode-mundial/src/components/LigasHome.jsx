import { useState } from 'react'

function fmt(n) { return '$' + Number(n).toLocaleString('es-AR') }

function CreateForm({ onCreate, onCancel }) {
  const [nombre,        setNombre]        = useState('')
  const [entryAmount, setEntryAmount] = useState(1000)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await onCreate({
      nombre,
      entry_amount: Number(entryAmount),
    })
    setLoading(false)
    if (error) setError(error.message || error)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-800 text-lg mb-4">Nueva sala</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la sala</label>
          <input value={nombre} onChange={e => setNombre(e.target.value)} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            placeholder="La pena del jueves" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Entrada por participante</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input type="number" min="0" value={entryAmount} onChange={e => setEntryAmount(e.target.value)}
              className="w-full pl-6 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 font-bold"
            />
          </div>
          {entryAmount == 0
            ? <p className="text-xs text-blue-500 mt-1">Sala libre — sin pozo de premios</p>
            : <p className="text-xs text-gray-400 mt-1">Cada participante transfiere este monto al alias</p>
          }
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button type="submit" disabled={loading || !nombre}
            className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition disabled:opacity-50">
            {loading ? 'Creando...' : 'Crear sala'}
          </button>
        </div>
      </form>
    </div>
  )
}

function JoinForm({ onJoin, onCancel, initialCode = '' }) {
  const [codigo, setCodigo] = useState(initialCode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await onJoin(codigo)
    setLoading(false)
    if (error) setError(error)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-800 text-lg mb-4">Unirme a una sala</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Código de invitación</label>
          <input
            value={codigo}
            onChange={e => setCodigo(e.target.value.toUpperCase())}
            required maxLength={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 font-mono text-xl text-center tracking-widest uppercase"
            placeholder="ABCD12"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button type="submit" disabled={loading || codigo.length < 4}
            className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition disabled:opacity-50">
            {loading ? 'Buscando...' : 'Unirme'}
          </button>
        </div>
      </form>
    </div>
  )
}

function LigaCard({ liga, onSelect }) {
  const hasPrize = liga.entry_amount > 0
  return (
    <button
      onClick={() => onSelect(liga)}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-green-300 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-gray-800 truncate">{liga.nombre}</p>
          <p className="text-xs text-gray-400 font-mono mt-0.5">#{liga.codigo}</p>
        </div>
        <div className="text-right flex-shrink-0">
          {hasPrize ? (
            <span className="text-sm font-black text-green-600">{fmt(liga.entry_amount)}</span>
          ) : (
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Libre</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2">
        {liga.my_paid ? (
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">✓ Pagado</span>
        ) : liga.entry_amount > 0 ? (
          <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">⏳ Pendiente</span>
        ) : (
          <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">Participando</span>
        )}
        <span className="text-xs text-gray-400">→ ver tabla</span>
      </div>
    </button>
  )
}

export default function LigasHome({ ligas, onCreate, onJoin, onSelect, initialJoinCode }) {
  const [view, setView] = useState(initialJoinCode ? 'join' : 'list')

  if (view === 'create') return <CreateForm onCreate={async (d) => { const r = await onCreate(d); if (!r.error) setView('list'); return r }} onCancel={() => setView('list')} />
  if (view === 'join')   return <JoinForm   initialCode={initialJoinCode} onJoin={async (c)  => { const r = await onJoin(c);   if (!r.error) setView('list'); return r }} onCancel={() => setView('list')} />

  return (
    <div className="space-y-4">
      {/* Acciones */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setView('create')}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition">
          <span className="text-lg">+</span> Crear sala
        </button>
        <button onClick={() => setView('join')}
          className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl border border-gray-200 transition">
          <span className="text-lg">🔑</span> Unirme
        </button>
      </div>

      {/* Lista de salas */}
      {ligas.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🏟</p>
          <p className="font-medium">No estás en ninguna sala todavía</p>
          <p className="text-sm mt-1">Creá una o unite con un código</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tus salas</p>
          {ligas.map(liga => (
            <LigaCard key={liga.id} liga={liga} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}
