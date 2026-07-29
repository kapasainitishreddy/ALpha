import { useMemo, useState } from 'react'
import { ArrowRight, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import { Banner, Section, Stat } from '@/components/common'
import { SymbolEventPicker } from '@/components/session'
import { CandleChart } from '@/components/CandleChart'
import { generateSession } from '@/engines/mockMarketEngine'
import { buildDebate, outcome, type Case } from '@/lib/debate'
import { useToast } from '@/components/Toast'
import { inr, pnlColor } from '@/lib/format'

const HORIZON = 10

function CaseCard({ c, picked, onPick, disabled }: { c: Case; picked: boolean; onPick: () => void; disabled: boolean }) {
  const bull = c.side === 'buy'
  return (
    <button
      onClick={onPick}
      disabled={disabled}
      className={`card w-full text-left !p-4 transition disabled:cursor-default ${
        picked ? (bull ? 'border-up' : 'border-down') : 'hover:border-accent'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`flex items-center gap-1.5 font-bold ${bull ? 'text-up' : 'text-down'}`}>
          {bull ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          {bull ? 'Bull Agent' : 'Bear Agent'}
        </span>
        <span className="chip">{(c.strength * 100).toFixed(0)}% of evidence</span>
      </div>
      <ul className="space-y-1.5">
        {c.points.map((p, i) => (
          <li key={i} className="text-sm text-muted leading-relaxed flex gap-1.5">
            <span className={bull ? 'text-up' : 'text-down'}>•</span>{p}
          </li>
        ))}
      </ul>
    </button>
  )
}

export default function Debate() {
  const toast = useToast()
  const [symbol, setSymbol] = useState('INFY')
  const [event, setEvent] = useState('normal-trend')
  const [round, setRound] = useState(0)
  const [idx, setIdx] = useState(35)
  const [pick, setPick] = useState<'buy' | 'sell' | 'skip' | null>(null)
  const [score, setScore] = useState({ right: 0, wrong: 0, skipped: 0 })

  const session = useMemo(() => generateSession(symbol, event, 120, round), [symbol, event, round])
  const debate = useMemo(() => buildDebate(session.candles, idx), [session, idx])
  const truth = useMemo(() => outcome(session.candles, idx, HORIZON), [session, idx])

  const decide = (choice: 'buy' | 'sell' | 'skip') => {
    setPick(choice)
    if (!truth) return
    if (choice === 'skip') {
      setScore((s) => ({ ...s, skipped: s.skipped + 1 }))
      return
    }
    const correct = (choice === 'buy') === truth.wentUp
    setScore((s) => ({ ...s, right: s.right + (correct ? 1 : 0), wrong: s.wrong + (correct ? 0 : 1) }))
    toast(correct ? 'You read that one right.' : 'That went the other way.', correct ? 'ok' : 'warn')
  }

  const next = () => {
    setPick(null)
    // Walk forward; start a fresh market once we run out of room for the reveal window.
    const nextIdx = idx + HORIZON
    if (nextIdx + HORIZON >= session.candles.length) {
      setRound((r) => r + 1)
      setIdx(35)
    } else {
      setIdx(nextIdx)
    }
  }

  const decided = score.right + score.wrong
  const accuracy = decided ? (score.right / decided) * 100 : 0

  return (
    <div className="space-y-6">
      <Banner>
        Two agents read the same chart and argue opposite sides. Both are citing real signals. Your job
        is to decide which case is stronger — or to walk away.
      </Banner>

      <SymbolEventPicker
        symbol={symbol}
        event={event}
        onSymbol={(s) => { setSymbol(s); setIdx(35); setPick(null) }}
        onEvent={(e) => { setEvent(e); setIdx(35); setPick(null) }}
      />

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold">{symbol} <span className="text-muted font-normal">{inr(session.candles[idx].close)}</span></span>
          <span className="text-xs text-muted">candle {idx + 1}</span>
        </div>
        {/* Only the candles up to now — showing the future would give the answer away. */}
        <CandleChart candles={session.candles.slice(0, idx + 1)} />
      </div>

      <div className="space-y-3">
        <CaseCard c={debate.bull} picked={pick === 'buy'} onPick={() => decide('buy')} disabled={pick !== null} />
        <CaseCard c={debate.bear} picked={pick === 'sell'} onPick={() => decide('sell')} disabled={pick !== null} />
      </div>

      {pick === null ? (
        <>
          <p className="text-xs text-muted text-center">Tap the case you find more convincing.</p>
          <button className="btn-ghost w-full flex items-center justify-center gap-2" onClick={() => decide('skip')}>
            <Scale size={16} /> Not convincing enough — skip this one
          </button>
        </>
      ) : (
        <Section title="What actually happened">
          {truth ? (
            <>
              <div className={`card !p-4 text-center ${truth.wentUp ? 'border-up/60' : 'border-down/60'}`}>
                <div className="label">Next {HORIZON} candles</div>
                <div className={`text-3xl font-extrabold my-1 ${pnlColor(truth.movePct)}`}>
                  {truth.movePct >= 0 ? '+' : ''}{truth.movePct.toFixed(2)}%
                </div>
                <div className="text-xs text-muted">
                  {pick === 'skip'
                    ? 'You skipped. No profit, no loss — and no regret either.'
                    : (pick === 'buy') === truth.wentUp
                      ? 'Your read was correct.'
                      : 'Your read was wrong.'}
                </div>
              </div>
              <Banner tone={pick === 'skip' ? 'info' : 'warn'}>{debate.verdictNote}</Banner>
              {pick !== 'skip' && (pick === 'buy') !== truth.wentUp && (
                <p className="text-xs text-muted leading-relaxed">
                  Being wrong here costs nothing, which is the point. Note <i>why</i> the losing case sounded
                  good — that reasoning will show up again when real money is on the line.
                </p>
              )}
            </>
          ) : (
            <Banner tone="warn">Not enough future candles left. Starting a fresh market.</Banner>
          )}
          <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={next}>
            Next debate <ArrowRight size={16} />
          </button>
        </Section>
      )}

      <Section title="Your record">
        <div className="grid grid-cols-4 gap-2">
          <Stat label="Right" value={String(score.right)} tone={score.right ? 1 : undefined} />
          <Stat label="Wrong" value={String(score.wrong)} tone={score.wrong ? -1 : undefined} />
          <Stat label="Skipped" value={String(score.skipped)} />
          <Stat label="Accuracy" value={decided ? `${accuracy.toFixed(0)}%` : '—'} />
        </div>
        {decided >= 5 && (
          <p className="text-xs text-muted leading-relaxed">
            {accuracy >= 60
              ? `${accuracy.toFixed(0)}% over ${decided} calls. Above a coin flip — but direction is the easy part. Position sizing and stops are what turn a good read into money.`
              : accuracy >= 45
                ? `${accuracy.toFixed(0)}% over ${decided} calls — essentially a coin flip, which is normal and honest. Most professionals win under 50% and profit through reward-to-risk, not accuracy.`
                : `${accuracy.toFixed(0)}% over ${decided} calls. Worth asking whether you are consistently drawn to one side regardless of the evidence.`}
          </p>
        )}
      </Section>
    </div>
  )
}
