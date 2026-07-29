import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Flag, Share2, Trophy, XCircle } from 'lucide-react'
import { Banner, Field, Section, Stat } from '@/components/common'
import { useStore } from '@/store/useStore'
import { inr } from '@/lib/format'
import { shareCard } from '@/lib/share'
import { useToast } from '@/components/Toast'

// Challenge Mode gives practice a finish line. The presets are deliberately ordered from
// realistic to reckless, and the reckless one says so — the lesson is in the odds, not the win.
const PRESETS = [
  {
    id: 'steady', name: 'Steady Builder', startCapital: 50_000, targetCapital: 55_000, days: 30, maxRiskPct: 1,
    blurb: '+10% in 30 days, risking 1% a trade.',
    reality: 'Demanding but achievable. This is roughly what a good professional year looks like, compressed into a month.',
  },
  {
    id: 'growth', name: 'Growth Push', startCapital: 25_000, targetCapital: 37_500, days: 30, maxRiskPct: 2,
    blurb: '+50% in 30 days, risking 2% a trade.',
    reality: 'Aggressive. Possible in a favourable market, but most attempts end below break-even.',
  },
  {
    id: 'double', name: 'Double or Nothing', startCapital: 10_000, targetCapital: 20_000, days: 14, maxRiskPct: 5,
    blurb: 'Double ₹10,000 in 14 days, risking 5% a trade.',
    reality: 'This is the challenge social media sells you. Run it and watch how it usually ends — that IS the lesson.',
  },
]

export default function Challenge() {
  const { challenge, balance, startChallenge, endChallenge, trades } = useStore()
  const toast = useToast()
  const [picked, setPicked] = useState(PRESETS[0].id)

  if (challenge) {
    const gain = balance - challenge.startCapital
    const need = challenge.targetCapital - challenge.startCapital
    const pct = Math.max(0, Math.min(100, (gain / need) * 100))
    const elapsed = Math.floor((Date.now() - challenge.startedAt) / 86_400_000)
    const left = Math.max(0, challenge.days - elapsed)
    const floor = challenge.startCapital * 0.5
    const done = challenge.status !== 'active'
    const traded = trades.filter((t) => t.openedAt >= challenge.startedAt && t.status === 'closed')
    const wins = traded.filter((t) => (t.realizedPnl ?? 0) > 0).length

    const share = async () => {
      const res = await shareCard({
        headline: challenge.status === 'won' ? `Beat the ${challenge.name}` : challenge.status === 'failed' ? `${challenge.name}: failed` : `${challenge.name} in progress`,
        sub: `${inr(challenge.startCapital)} → target ${inr(challenge.targetCapital)} in ${challenge.days} days`,
        pnl: gain,
        rows: [
          ['Progress', `${pct.toFixed(0)}%`],
          ['Days left', String(left)],
          ['Trades', String(traded.length)],
          ['Win rate', traded.length ? `${((wins / traded.length) * 100).toFixed(0)}%` : '—'],
        ],
      })
      toast(res === 'shared' ? 'Shared.' : 'Image saved to your downloads.')
    }

    return (
      <div className="space-y-6">
        {done ? (
          <Banner tone={challenge.status === 'won' ? 'info' : 'warn'}>
            {challenge.status === 'won'
              ? 'Challenge complete. Now check the journal — did you win on skill, or on one lucky trade?'
              : 'Challenge over. This is the cheapest possible way to learn that lesson — it cost you nothing real.'}
          </Banner>
        ) : (
          <Banner>Challenge running. Every trade counts toward it. Mock money only.</Banner>
        )}

        <div className={`card !p-5 text-center ${challenge.status === 'won' ? 'border-up/60' : challenge.status === 'failed' ? 'border-down/60' : ''}`}>
          <div className="flex items-center justify-center gap-2 label">
            {challenge.status === 'won' ? <Trophy size={14} className="text-up" />
              : challenge.status === 'failed' ? <XCircle size={14} className="text-down" />
                : <Flag size={14} className="text-accent" />}
            {challenge.name}
          </div>
          <div className={`text-4xl font-extrabold my-2 ${gain >= 0 ? 'text-up' : 'text-down'}`}>
            {inr(balance)}
          </div>
          <div className="text-xs text-muted">
            started {inr(challenge.startCapital)} · target {inr(challenge.targetCapital)}
          </div>

          <div className="mt-4 h-3 rounded-full bg-panel2 overflow-hidden border border-edge">
            <div
              className={`h-full transition-all ${challenge.status === 'failed' ? 'bg-down' : 'bg-up'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-muted">{pct.toFixed(0)}% of the way to target</div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="P&L" value={inr(gain)} tone={gain} />
          <Stat label="Days left" value={done ? '—' : String(left)} />
          <Stat label="Trades" value={String(traded.length)} />
        </div>

        <Section title="Challenge rules">
          <div className="card !p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted">Max risk per trade</span><span className="font-semibold">{challenge.maxRiskPct}% ({inr(challenge.startCapital * challenge.maxRiskPct / 100)})</span></div>
            <div className="flex justify-between"><span className="text-muted">Blow-up floor</span><span className="font-semibold text-down">{inr(floor)}</span></div>
            <div className="flex justify-between"><span className="text-muted">Time limit</span><span className="font-semibold">{challenge.days} days</span></div>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Drop below the floor or run out of days and the challenge fails automatically. Use the{' '}
            <Link to="/risk" className="text-accent underline">Risk Tools</Link> to size every trade
            to {challenge.maxRiskPct}% before you place it.
          </p>
        </Section>

        <div className="flex gap-3">
          <button className="btn-ghost flex-1 flex items-center justify-center gap-2" onClick={share}>
            <Share2 size={16} /> Share
          </button>
          <button
            className="btn-ghost flex-1 !text-down"
            onClick={() => confirm('Give up this challenge?') && endChallenge('failed')}
          >
            {done ? 'Clear' : 'Give up'}
          </button>
        </div>
      </div>
    )
  }

  const p = PRESETS.find((x) => x.id === picked)!
  return (
    <div className="space-y-6">
      <Banner>
        A challenge gives your practice a deadline and a target — the two things that make people trade
        badly. That's the point: learn how pressure changes your decisions, with fake money.
      </Banner>

      <Section title="Pick a challenge">
        <div className="space-y-2">
          {PRESETS.map((x) => (
            <button
              key={x.id}
              onClick={() => setPicked(x.id)}
              className={`card w-full text-left !p-4 transition ${picked === x.id ? 'border-accent' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{x.name}</span>
                <span className="chip">{x.days}d</span>
              </div>
              <div className="text-xs text-muted mt-1">{x.blurb}</div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="What you're signing up for">
        <div className="card !p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><div className="label">Start</div><div className="font-bold">{inr(p.startCapital)}</div></div>
            <div><div className="label">Target</div><div className="font-bold text-up">{inr(p.targetCapital)}</div></div>
            <div><div className="label">Max risk</div><div className="font-bold">{p.maxRiskPct}%</div></div>
          </div>
          <p className="text-xs text-muted leading-relaxed border-t border-edge pt-3">{p.reality}</p>
        </div>
      </Section>

      <Field label="Starting balance will be reset to the challenge amount">
        <button
          className="btn-primary w-full"
          onClick={() => startChallenge({ id: p.id, name: p.name, startCapital: p.startCapital, targetCapital: p.targetCapital, days: p.days, maxRiskPct: p.maxRiskPct })}
        >
          Start {p.name}
        </button>
      </Field>

      <Banner tone="warn">
        Mock money only. Targets like these are shown to teach you what chasing them feels like — they are
        not a plan for real money, and no result here predicts a real one.
      </Banner>
    </div>
  )
}
