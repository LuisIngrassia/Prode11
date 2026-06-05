export default function Leaderboard({ leaderboard, currentUserId }) {
  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-3">🏆</div>
        <p>Aún no hay puntos para mostrar</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {leaderboard.map((entry, idx) => {
        const isMe = entry.id === currentUserId
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null

        return (
          <div
            key={entry.id}
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              isMe
                ? 'bg-green-50 border-green-300 shadow-sm'
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="w-8 text-center">
              {medal ? (
                <span className="text-xl">{medal}</span>
              ) : (
                <span className="text-sm font-bold text-gray-400">#{idx + 1}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`font-semibold truncate ${isMe ? 'text-green-700' : 'text-gray-800'}`}>
                {entry.name} {isMe && <span className="text-xs font-normal">(vos)</span>}
              </p>
              <p className="text-xs text-gray-400">
                {entry.exact_count} exactos · {entry.winner_count} ganador
              </p>
            </div>

            <div className="text-right">
              <p className="text-xl font-bold text-gray-800">{entry.total_pts}</p>
              <p className="text-xs text-gray-400">pts</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
