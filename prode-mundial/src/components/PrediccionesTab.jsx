import { useState } from 'react'
import GroupStage from './GroupStage'
import Bracket from './Bracket'

export default function PrediccionesTab({ matches, predictions, onSave }) {
  const [sub, setSub] = useState('grupos')

  return (
    <div>
      <div className="flex gap-1 bg-gray-200 p-1 rounded-xl mb-4">
        {[
          { id: 'grupos',  label: '⬡ Fase de Grupos' },
          { id: 'llaves',  label: '🏆 Llaves' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition ${
              sub === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {sub === 'grupos' && (
        <GroupStage matches={matches} predictions={predictions} onSave={onSave} />
      )}
      {sub === 'llaves' && (
        <Bracket matches={matches} predictions={predictions} onSave={onSave} />
      )}
    </div>
  )
}
