import { useState, useEffect } from 'react'

export default function PerfilTab({ profile, onSave }) {
  const [name,      setName]      = useState('')
  const [alias,     setAlias]     = useState('')
  const [telefono,  setTelefono]  = useState('')
  const [saving,    setSaving]    = useState(false)
  const [msg,       setMsg]       = useState('')

  useEffect(() => {
    if (!profile) return
    setName(profile.name      || '')
    setAlias(profile.alias_pago || '')
    setTelefono(profile.telefono  || '')
  }, [profile])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const { error } = await onSave({
      name:       name.trim(),
      alias_pago: alias.trim(),
      telefono:   telefono.trim(),
    })
    setSaving(false)
    setMsg(error ? '✗ Error al guardar' : '✓ Guardado')
    setTimeout(() => setMsg(''), 3000)
  }

  if (!profile) {
    return <p className="text-center text-gray-400 py-12 text-sm">Cargando perfil...</p>
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-black text-gray-800 text-lg mb-5">Mi perfil</h2>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alias de pago
              <span className="ml-1 text-xs font-normal text-gray-400">para que te depositen los premios</span>
            </label>
            <input
              type="text"
              value={alias}
              onChange={e => setAlias(e.target.value)}
              placeholder="ejemplo.mercadopago"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono / WhatsApp
              <span className="ml-1 text-xs font-normal text-gray-400">opcional</span>
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder="+54 9 11 1234-5678"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            {msg && (
              <span className={`text-sm font-bold ${msg.startsWith('✗') ? 'text-red-500' : 'text-green-600'}`}>
                {msg}
              </span>
            )}
          </div>
        </form>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs text-blue-700 leading-relaxed">
          Tu alias y teléfono solo son visibles para el organizador del prode,
          para poder depositarte el premio si ganás.
        </p>
      </div>
    </div>
  )
}
