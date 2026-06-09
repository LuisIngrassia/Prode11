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
import Leaderboard from './components/Leaderboard'
import TablaPaywall from './components/TablaPaywall'
import PrizePool from './components/PrizePool'
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
    myEntry, confirmed, pending,
    totalGross, organizerCut, netPool,
    submitEntry, confirmEntry, rejectEntry,
  } = useEntries(user?.id)

  // Solo los usuarios con pago confirmado aparecen en la tabla global
  const confirmedIds    = new Set(confirmed.map(e => e.user_id))
  const paidLeaderboard = leaderboard.filter(e => confirmedIds.has(e.id))

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
        {activeTab === 'tabla' && (() => {
          const paid = myEntry?.confirmed || isAdmin
          return (
            <div className="space-y-5">
              {paid ? (
                <>
                  {/* Banner recordatorio */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">⚠️</span>
                    <p className="text-sm text-yellow-800 leading-relaxed">
                      <span className="font-bold">Recordá:</span> una vez que sumás tu primer punto
                      no podés depositar más plata al pozo. Si alguien todavía no depositó, puede hacerlo
                      mientras no tenga puntos.
                    </p>
                  </div>

                  {/* Tabla primero */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">
                      Tabla global
                    </p>
                    <Leaderboard leaderboard={paidLeaderboard} currentUserId={user.id} />
                  </div>

                  {/* Pozo abajo (sin formulario, solo stats) */}
                  <PrizePool
                    leaderboard={paidLeaderboard}
                    myEntry={myEntry}
                    confirmed={confirmed}
                    pending={pending}
                    totalGross={totalGross}
                    organizerCut={organizerCut}
                    netPool={netPool}
                    onSubmit={submitEntry}
                  />
                </>
              ) : (
                <>
                  {/* CTA arriba de todo si nunca depositó */}
                  {!myEntry && (
                    <div className="bg-green-600 text-white rounded-2xl p-5">
                      <p className="text-2xl font-black mb-1">💰 Entrar al pozo</p>
                      <p className="text-sm text-green-100 mb-0.5">
                        Transferí mínimo <span className="font-bold text-white">${Number(import.meta.env.VITE_MONTO_MINIMO || 1000).toLocaleString('es-AR')}</span> al alias{' '}
                        <span className="font-mono font-bold text-white">{import.meta.env.VITE_ALIAS_PAGO}</span>
                      </p>
                      <p className="text-xs text-green-200">y declaralo abajo para desbloquear la tabla ↓</p>
                    </div>
                  )}

                  {/* Pozo con formulario */}
                  <PrizePool
                    leaderboard={paidLeaderboard}
                    myEntry={myEntry}
                    confirmed={confirmed}
                    pending={pending}
                    totalGross={totalGross}
                    organizerCut={organizerCut}
                    netPool={netPool}
                    onSubmit={submitEntry}
                  />

                  {/* Tabla bloqueada abajo */}
                  <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                    <p className="text-4xl mb-3">🔒</p>
                    <p className="font-bold text-gray-700">Tabla bloqueada</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Confirmá tu depósito para ver las posiciones
                    </p>
                  </div>
                </>
              )}
            </div>
          )
        })()}
        {activeTab === 'especiales' && (
          <PreTournament special={special} onSave={saveSpecial} />
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
