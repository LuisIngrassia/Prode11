import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useMatches } from './hooks/useMatches'
import { usePredictions } from './hooks/usePredictions'
import { useSpecialPredictions } from './hooks/useSpecialPredictions'
import { useLeaderboard } from './hooks/useLeaderboard'
import { useEntries } from './hooks/useEntries'
import { useProfile } from './hooks/useProfile'
import { useLigas } from './hooks/useLigas'
import LoginScreen from './components/LoginScreen'
import Header from './components/Header'
import PreTournament from './components/PreTournament'
import PointsInfo from './components/PointsInfo'
import AdminPanel from './components/AdminPanel'
import LigasHome from './components/LigasHome'
import LigaView from './components/LigaView'
import OnboardingTutorial from './components/OnboardingTutorial'
import PrediccionesTab from './components/PrediccionesTab'

export default function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth()
  const [activeTab, setActiveTab]       = useState('grupos')
  const [selectedLiga, setSelectedLiga] = useState(null)
  const [initialJoinCode, setInitialJoinCode] = useState('')
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code   = params.get('join')
    if (code) {
      setInitialJoinCode(code.toUpperCase())
      setActiveTab('salas')
      // Limpia la URL sin recargar
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (user && !localStorage.getItem('prode_tutorial_seen')) {
      setShowTutorial(true)
    }
  }, [user])

  const profile  = useProfile(user?.id)
  const { matches, refreshMatches } = useMatches()
  const { predictions, savePrediction } = usePredictions(user?.id)
  const { special, saveSpecial }        = useSpecialPredictions(user?.id)
  const leaderboard    = useLeaderboard()
  const { ligas, createLiga, joinLiga, refresh: refreshLigas } = useLigas(user?.id)
  const {
    confirmed, pending,
    totalGross, organizerCut, netPool,
    confirmEntry, rejectEntry,
  } = useEntries(user?.id)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⚽</div>
          <p className="text-gray-400 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <LoginScreen onSignIn={signIn} onSignUp={signUp} />

  const userName = profile?.name || user.user_metadata?.name || user.email
  const isAdmin  = profile?.is_admin === true

  function handleTabChange(tab) {
    setActiveTab(tab)
    if (tab !== 'salas') setSelectedLiga(null)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        name={userName}
        onSignOut={signOut}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isAdmin={isAdmin}
      />

      <main className="max-w-7xl mx-auto px-4 py-5">
        {activeTab === 'grupos' && (
          <PrediccionesTab matches={matches} predictions={predictions} onSave={savePrediction} />
        )}
        {activeTab === 'salas' && (
          selectedLiga
            ? <LigaView
                liga={selectedLiga}
                leaderboard={leaderboard}
                userId={user.id}
                onBack={() => setSelectedLiga(null)}
              />
            : <LigasHome
                ligas={ligas}
                onCreate={createLiga}
                onJoin={joinLiga}
                onSelect={liga => setSelectedLiga(liga)}
                initialJoinCode={initialJoinCode}
              />
        )}
        {activeTab === 'especiales' && (
          <PreTournament special={special} onSave={saveSpecial} matches={matches} />
        )}
        {activeTab === 'puntos' && <PointsInfo />}
        {activeTab === 'admin' && isAdmin && (
          <AdminPanel
            entries={[...confirmed, ...pending]}
            confirmed={confirmed}
            pending={pending}
            totalGross={totalGross}
            organizerCut={organizerCut}
            netPool={netPool}
            onConfirm={confirmEntry}
            onReject={rejectEntry}
            matches={matches}
            onResultSaved={refreshMatches}
          />
        )}
      </main>

      {showTutorial && (
        <OnboardingTutorial onDone={() => setShowTutorial(false)} />
      )}
    </div>
  )
}
