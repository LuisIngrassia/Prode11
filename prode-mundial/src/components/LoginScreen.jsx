import { useState } from 'react'

export default function LoginScreen({ onSignIn, onSignUp, onResetPassword, onUpdatePassword, isRecovery }) {
  const [mode, setMode]       = useState(isRecovery ? 'update' : 'login')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { error } = await onSignIn(email, password)
        if (error) setError(error.message)
      } else if (mode === 'register') {
        const { error } = await onSignUp(email, password, name)
        if (error) setError(error.message)
        else setError('Revisá tu email para confirmar el registro.')
      } else if (mode === 'reset') {
        const { error } = await onResetPassword(email)
        if (error) setError(error.message)
        else setError('Te enviamos un email para recuperar tu contraseña.')
      } else if (mode === 'update') {
        const { error } = await onUpdatePassword(password)
        if (error) setError(error.message)
      }
    } finally {
      setLoading(false)
    }
  }

  function subtitle() {
    if (mode === 'login')    return 'Ingresá a tu cuenta'
    if (mode === 'register') return 'Creá tu cuenta'
    if (mode === 'reset')    return 'Recuperar contraseña'
    if (mode === 'update')   return 'Elegí una nueva contraseña'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">⚽</div>
          <h1 className="text-2xl font-bold text-gray-800">Prode Mundial 2026</h1>
          <p className="text-gray-500 text-sm mt-1">{subtitle()}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Tu nombre"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'reset') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="email@ejemplo.com"
              />
            </div>
          )}

          {(mode === 'login' || mode === 'register' || mode === 'update') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mode === 'update' ? 'Nueva contraseña' : 'Contraseña'}
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={mode === 'update' ? 6 : undefined}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <p className={`text-sm px-3 py-2 rounded-lg ${
              error.includes('Revisá') || error.includes('enviamos')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-600'
            }`}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Cargando...' : (
              mode === 'login'    ? 'Ingresar'          :
              mode === 'register' ? 'Registrarse'       :
              mode === 'reset'    ? 'Enviar link'       :
                                    'Guardar contraseña'
            )}
          </button>
        </form>

        {mode === 'login' && (
          <p className="text-center mt-3">
            <button
              onClick={() => { setMode('reset'); setError('') }}
              className="text-sm text-gray-400 hover:text-green-600 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </p>
        )}

        {(mode === 'login' || mode === 'register') && (
          <p className="text-center text-sm text-gray-500 mt-4">
            {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="text-green-600 font-semibold hover:underline"
            >
              {mode === 'login' ? 'Registrate' : 'Ingresá'}
            </button>
          </p>
        )}

        {mode === 'reset' && (
          <p className="text-center text-sm text-gray-500 mt-4">
            <button
              onClick={() => { setMode('login'); setError('') }}
              className="text-green-600 font-semibold hover:underline"
            >
              Volver al inicio de sesión
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
