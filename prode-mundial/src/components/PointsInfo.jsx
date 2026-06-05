export default function PointsInfo() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-bold text-gray-700 text-lg mb-4">Sistema de puntos</h2>

        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="font-bold text-green-700">3 puntos — Resultado exacto</p>
              <p className="text-sm text-gray-500">Acertás el marcador exacto del partido</p>
              <p className="text-xs text-gray-400 mt-1">Ej: pronosticás 2-1 y el partido termina 2-1</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-yellow-700">1 punto — Ganador / empate</p>
              <p className="text-sm text-gray-500">Acertás quién gana o que hay empate, pero no el marcador exacto</p>
              <p className="text-xs text-gray-400 mt-1">Ej: pronosticás 3-0 y el partido termina 1-0</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-bold text-red-600">0 puntos — Fallo</p>
              <p className="text-sm text-gray-500">El resultado no coincide con tu pronóstico</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <h2 className="font-bold text-gray-700 text-lg mb-4">Predicciones especiales</h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="font-bold text-green-700">+20 puntos — Campeón</p>
              <p className="text-sm text-gray-500">Si acertás el campeón del mundial</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <span className="text-2xl">🥈</span>
            <div>
              <p className="font-bold text-blue-700">+10 puntos — Subcampeón</p>
              <p className="text-sm text-gray-500">Si acertás el subcampeón del mundial</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Las predicciones especiales se bloquean al inicio del torneo y no pueden modificarse.
        </p>
      </div>
    </div>
  )
}
