const TABS = [
  { id: 'grupos',     label: 'Grupos',     icon: '⬡' },
  { id: 'bracket',    label: 'Fase Final', icon: '🏆' },
  { id: 'salas',      label: 'Salas',      icon: '🏟' },
  { id: 'especiales', label: 'Especiales', icon: '⭐' },
  { id: 'puntos',     label: 'Puntos',     icon: 'ℹ' },
]

export default function Header({ name, onSignOut, activeTab, onTabChange, isAdmin }) {
  return (
    <header className="bg-gray-900 text-white shadow-lg sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <div className="leading-tight">
              <p className="font-black text-base tracking-tight">PRODE 11</p>
              <p className="text-xs text-gray-400 font-medium">Mundial 2026</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => onTabChange('admin')}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-bold transition ${
                  activeTab === 'admin'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-700 text-red-400 hover:bg-gray-600'
                }`}
              >
                Admin
              </button>
            )}
            <span className="text-sm text-gray-300 hidden sm:block truncate max-w-[130px]">{name}</span>
            <button
              onClick={onSignOut}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg transition font-medium"
            >
              Salir
            </button>
          </div>
        </div>
        <nav className="flex gap-0.5 overflow-x-auto pb-0 scrollbar-none">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap rounded-t-lg transition border-b-2 ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 border-white'
                  : 'text-gray-400 border-transparent hover:text-white hover:bg-gray-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
