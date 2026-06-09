import { useState } from 'react'

const STEPS = [
  {
    emoji: '⚽',
    color: '#15803d',
    title: '¡Bienvenido al Prode!',
    desc: 'Predecí los resultados del Mundial, competí con tus amigos y jugá tu propio pozo.',
  },
  {
    emoji: '🎯',
    color: '#1d4ed8',
    title: 'Hacé tus predicciones',
    desc: 'En Grupos y Llaves cargás el resultado de cada partido. Exacto vale más que solo el ganador.',
  },
  {
    emoji: '✨',
    color: '#7c3aed',
    title: 'Predicciones especiales',
    desc: 'Antes de que arranque, predecí el campeón, el goleador y más. Valen puntos extra.',
  },
  {
    emoji: '💰',
    color: '#b45309',
    title: 'El Pozo global',
    desc: 'En Tabla podés entrar al pozo global. El 1° se lleva 60%, el 2° 25% y el 3° 15%.',
  },
  {
    emoji: '🏟',
    color: '#c2410c',
    title: 'Salas con amigos',
    desc: 'Creá una sala privada, compartí el código y armén su propio pozo entre ustedes.',
  },
  {
    emoji: '🚀',
    color: '#0f172a',
    title: '¡Todo listo!',
    desc: 'Empezá cargando tus predicciones y que gane el mejor. ¡Buena suerte!',
  },
]

export default function OnboardingTutorial({ onDone }) {
  const [step, setStep]       = useState(0)
  const [exiting, setExiting] = useState(false)

  const current  = STEPS[step]
  const isLast   = step === STEPS.length - 1

  function finish() {
    setExiting(true)
    localStorage.setItem('prode_tutorial_seen', '1')
    setTimeout(onDone, 350)
  }

  function next() {
    if (isLast) finish()
    else setStep(s => s + 1)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        opacity:    exiting ? 0 : 1,
        transition: 'opacity 350ms ease',
        background: `linear-gradient(160deg, ${current.color}dd, ${current.color}99)`,
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* Skip */}
      {!isLast && (
        <div className="flex justify-end p-5">
          <button
            onClick={finish}
            className="text-white/50 text-sm font-medium px-3 py-1 rounded-full hover:text-white/80 transition"
          >
            Saltar
          </button>
        </div>
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center text-white">
        {/* Icono en círculo */}
        <div
          className="w-32 h-32 rounded-full flex items-center justify-center mb-8 text-6xl"
          style={{ background: 'rgba(255,255,255,0.12)' }}
        >
          {current.emoji}
        </div>

        <h1
          key={`title-${step}`}
          className="text-3xl font-black mb-4 leading-tight"
          style={{ animation: 'fadeSlideUp 300ms ease both' }}
        >
          {current.title}
        </h1>
        <p
          key={`desc-${step}`}
          className="text-base text-white/75 leading-relaxed max-w-xs"
          style={{ animation: 'fadeSlideUp 300ms 60ms ease both' }}
        >
          {current.desc}
        </p>
      </div>

      {/* Footer */}
      <div className="px-6 pb-10 space-y-5">
        {/* Dots */}
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              className="rounded-full cursor-pointer transition-all duration-300"
              style={{
                width:   i === step ? '24px' : '8px',
                height:  '8px',
                background: i === step ? 'white' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white transition"
              style={{ border: '1.5px solid rgba(255,255,255,0.35)' }}
            >
              ← Anterior
            </button>
          )}
          <button
            onClick={next}
            className="flex-1 py-3.5 rounded-2xl font-black text-sm transition active:scale-95"
            style={{ background: 'white', color: current.color }}
          >
            {isLast ? '¡Empezar a jugar!' : 'Siguiente →'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
