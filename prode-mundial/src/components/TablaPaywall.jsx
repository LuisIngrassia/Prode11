export default function TablaPaywall({ onGoToPozo }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full">
        <div className="text-6xl mb-4">🔒</div>

        <h2 className="text-xl font-black text-gray-800 mb-2">
          Tabla bloqueada
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Para ver la tabla de posiciones y los puntos de todos los participantes
          tenés que entrar al pozo de premios.
        </p>

        <button
          onClick={onGoToPozo}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-white font-bold py-3 rounded-xl transition text-base"
        >
          💰 Entrar al pozo
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Mínimo ${Number(import.meta.env.VITE_MONTO_MINIMO || 1000).toLocaleString('es-AR')} por transferencia al alias{' '}
          <span className="font-mono font-semibold text-gray-600">
            {import.meta.env.VITE_ALIAS_PAGO || '—'}
          </span>
        </p>
      </div>
    </div>
  )
}
