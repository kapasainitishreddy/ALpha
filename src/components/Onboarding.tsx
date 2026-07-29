import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Calculator, Lock, Network, ShieldCheck, UserRound } from 'lucide-react'

// First-run explainer. A beginner opening this app sees 20 screens and no idea where to start;
// four cards fix that. Shown once, dismissible, never blocks the app.

const STEPS = [
  {
    Icon: ShieldCheck,
    title: 'This is practice, not trading',
    body: 'Every rupee here is fake. There is no broker connected and no way to lose real money. Make your expensive mistakes on this screen instead of a real one.',
  },
  {
    Icon: Calculator,
    title: 'Learn to size before you learn to pick',
    body: 'Most beginners obsess over what to buy. What actually decides whether you survive is how much you buy. Risk Tools shows you the maths in one screen.',
  },
  {
    Icon: Network,
    title: 'Watch AI strategies disagree',
    body: 'Run the Strategy Swarm and five different strategies trade the same market at once. Seeing them disagree teaches more than any single winning trade.',
  },
  {
    Icon: UserRound,
    title: 'Father Mode for absolute beginners',
    body: 'Bigger buttons, tighter safety limits, and explanations in Telugu-English. Built for someone who has never traded before.',
  },
]

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const navigate = useNavigate()
  const step = STEPS[i]
  const last = i === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md m-4 card !p-6 space-y-5">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-accent/10 border border-accent/30 p-4">
            <step.Icon size={30} className="text-accent" strokeWidth={1.6} />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-extrabold">{step.title}</h2>
          <p className="text-sm text-muted leading-relaxed">{step.body}</p>
        </div>

        <div className="flex justify-center gap-1.5">
          {STEPS.map((_, j) => (
            <div key={j} className={`h-1.5 rounded-full transition-all ${j === i ? 'w-6 bg-accent' : 'w-1.5 bg-edge'}`} />
          ))}
        </div>

        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onDone}>
            {last ? 'Explore on my own' : 'Skip'}
          </button>
          <button
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            onClick={() => {
              if (!last) return setI(i + 1)
              onDone()
              navigate('/risk')
            }}
          >
            {last ? 'Start with Risk Tools' : 'Next'}
            <ArrowRight size={16} />
          </button>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <Lock size={11} /> Real trading is permanently locked in this version.
        </p>
      </div>
    </div>
  )
}
