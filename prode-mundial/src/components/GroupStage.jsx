import GroupCard from './GroupCard'

const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export default function GroupStage({ matches, predictions, onSave }) {
  const groupMatches = matches.filter(m => m.phase === 'groups')

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="text-xs text-gray-400 flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-600 inline-block" /> Clasifican directo
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Posible 3º mejor
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {GROUP_LETTERS.map(group => {
          const gMatches = groupMatches
            .filter(m => m.group_name === group)
            .sort((a, b) => (a.match_number || a.id) - (b.match_number || b.id))
          return (
            <GroupCard
              key={group}
              group={group}
              matches={gMatches}
              predictions={predictions}
              onSave={onSave}
            />
          )
        })}
      </div>
    </div>
  )
}
