import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, FileDown, Rewind, Smile } from 'lucide-react'
import { Banner, Empty, Section, Stat } from '@/components/common'
import { useToast } from '@/components/Toast'
import { useStore, modeLabel, type Mood } from '@/store/useStore'
import { equityCurves, replayTrade, strategyFitness } from '@/lib/insights'
import { openReport } from '@/lib/report'
import { inr, pnlColor } from '@/lib/format'
import type { Trade } from '@/types'

const MOOD_LABEL: Record<Mood, string> = {
  calm: 'Calm', confident: 'Confident', anxious: 'Anxious', greedy: 'Greedy', frustrated: 'Frustrated',
}

function Curves({ curves }: { curves: ReturnType<typeof equityCurves> }) {
  const all = curves.flatMap((c) => c.points)
  const min = Math.min(0, ...all)
  const max = Math.max(0, ...all)
  const span = max - min || 1
  const W = 300
  const H = 110
  const COLOR = ['#4da3ff', '#22c55e', '#f59e0b', '#a78bfa', '#ef4444', '#14b8a6']

  return (
    <div className="card !p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Cumulative profit by practice mode">
        {/* Break-even line — above it you made money, below it you didn't. */}
        <line x1="0" y1={H - ((0 - min) / span) * H} x2={W} y2={H - ((0 - min) / span) * H} stroke="#30363d" strokeDasharray="3 3" />
        {curves.map((c, i) => {
          if (c.points.length < 2) return null
          const d = c.points
            .map((p, j) => `${j === 0 ? 'M' : 'L'} ${(j / (c.points.length - 1)) * W} ${H - ((p - min) / span) * H}`)
            .join(' ')
          return <path key={c.mode} d={d} fill="none" stroke={COLOR[i % COLOR.length]} strokeWidth="2" strokeLinejoin="round" />
        })}
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {curves.map((c, i) => (
          <span key={c.mode} className="flex items-center gap-1 text-[11px]">
            <span className="w-2.5 h-0.5 rounded" style={{ background: COLOR[i % COLOR.length] }} />
            <span className="text-muted">{modeLabel[c.mode]}</span>
            <span className={pnlColor(c.final)}>{inr(c.final)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Replay({ trade, onClose }: { trade: Trade; onClose: () => void }) {
  const steps = replayTrade(trade)
  return (
    <div className="card !p-4 space-y-3 border-accent/50">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm">{trade.symbol} {trade.side} × {trade.qty}</span>
        <button className="chip" onClick={onClose}>close</button>
      </div>
      <ol className="space-y-2.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2.5">
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${s.tone === 'bad' ? 'bg-down' : s.tone === 'ok' ? 'bg-up' : 'bg-muted'}`} />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">{s.label}</div>
              <p className="text-sm leading-relaxed">{s.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function Insights() {
  const { trades, journal, history, balance, startingBalance, moods } = useStore()
  const toast = useToast()
  const [replaying, setReplaying] = useState<Trade | null>(null)

  const fitness = useMemo(() => strategyFitness(trades), [trades])
  const curves = useMemo(() => equityCurves(trades), [trades])
  const closed = useMemo(
    () => trades.filter((t) => t.status === 'closed').sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0)).slice(0, 12),
    [trades],
  )

  // Average result per mood, over settled entries only.
  const moodStats = useMemo(() => {
    const by = new Map<Mood, number[]>()
    for (const m of moods) {
      if (m.pnlAfter === null) continue
      by.set(m.mood, [...(by.get(m.mood) ?? []), m.pnlAfter])
    }
    return [...by.entries()]
      .map(([mood, xs]) => ({ mood, n: xs.length, avg: xs.reduce((a, b) => a + b, 0) / xs.length }))
      .sort((a, b) => b.avg - a.avg)
  }, [moods])

  if (!trades.length) {
    return (
      <Empty
        icon={<BarChart3 size={30} />}
        title="Nothing to analyse yet"
        body="Place and close a few practice trades. This screen then shows which strategies actually work in your hands, how your modes compare, and what went wrong on individual trades."
        action={<Link to="/manual" className="btn-primary inline-block">Start practising</Link>}
      />
    )
  }

  return (
    <div className="space-y-6">
      <Banner>
        Analysis of your own trading, not the market's. The useful question is never "did I make money"
        but "which of my decisions were repeatable".
      </Banner>

      {curves.length > 0 && (
        <Section title="How your modes compare">
          <Curves curves={curves} />
          <p className="text-xs text-muted leading-relaxed">
            {curves.length === 1
              ? 'Only one mode so far. Try the same market in AI-Assisted and Swarm to see whether the AI beats you — and by how much.'
              : `${modeLabel[curves[0].mode]} is ahead. If an AI mode is beating your manual trading, the gap is worth studying: it is almost always discipline, not stock picking.`}
          </p>
        </Section>
      )}

      {fitness.length > 0 && (
        <Section title="Which strategies suit you">
          <div className="space-y-2">
            {fitness.map((f) => (
              <div key={f.strategyId} className="card !p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm truncate">{f.strategyId}</span>
                  <span className={`font-bold ${pnlColor(f.totalPnl)}`}>{inr(f.totalPnl)}</span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-panel2 overflow-hidden">
                  <div
                    className={`h-full ${f.score >= 60 ? 'bg-up' : f.score >= 45 ? 'bg-warn' : 'bg-down'}`}
                    style={{ width: `${f.score}%` }}
                  />
                </div>
                <div className="text-[11px] text-muted mt-1.5">
                  fit {f.score.toFixed(0)}/100 · {f.trades} trades · {f.winRatePct.toFixed(0)}% win
                </div>
                <p className="text-xs text-muted mt-1 leading-relaxed">{f.verdict}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted">
            Fit measures how <i>you</i> traded it, not how good the strategy is in theory. Scores stay near
            50 until you have around 20 trades with it.
          </p>
        </Section>
      )}

      {moodStats.length > 0 && (
        <Section title="Mood vs results">
          <div className="card !p-3 space-y-2">
            {moodStats.map((m) => (
              <div key={m.mood} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted">
                  <Smile size={13} /> {MOOD_LABEL[m.mood]}
                  <span className="text-[11px]">({m.n})</span>
                </span>
                <span className={`font-bold ${pnlColor(m.avg)}`}>{inr(m.avg)} avg</span>
              </div>
            ))}
          </div>
          {moodStats.length >= 2 && (
            <p className="text-xs text-muted leading-relaxed">
              You do best when {MOOD_LABEL[moodStats[0].mood].toLowerCase()} and worst when{' '}
              {MOOD_LABEL[moodStats[moodStats.length - 1].mood].toLowerCase()}. Noticing that pattern before
              you place a trade is worth more than any indicator.
            </p>
          )}
        </Section>
      )}

      <Section title="Replay a trade">
        {replaying ? (
          <Replay trade={replaying} onClose={() => setReplaying(null)} />
        ) : (
          <>
            <p className="text-xs text-muted mb-2">Tap any trade to walk through the decisions behind it.</p>
            <div className="space-y-1.5">
              {closed.map((t) => (
                <button key={t.id} className="card w-full !p-2.5 flex items-center justify-between hover:border-accent transition" onClick={() => setReplaying(t)}>
                  <span className="flex items-center gap-2 text-sm">
                    <Rewind size={13} className="text-accent" />
                    {t.symbol} <span className="text-muted">{t.side} × {t.qty}</span>
                    {!t.stopLoss && <span className="chip !text-down !border-down/40">no SL</span>}
                  </span>
                  <span className={`font-bold text-sm ${pnlColor(t.realizedPnl ?? 0)}`}>{inr(t.realizedPnl ?? 0)}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </Section>

      <Section title="Export">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Sessions" value={String(journal.length)} />
          <Stat label="Trades closed" value={String(trades.filter((t) => t.status === 'closed').length)} />
        </div>
        <button
          className="btn-ghost w-full flex items-center justify-center gap-2"
          onClick={() => {
            const ok = openReport({ journal, trades, history, balance, startingBalance })
            if (!ok) toast('Your browser blocked the popup. Allow popups for this site and try again.', 'warn')
          }}
        >
          <FileDown size={16} /> Performance report (save as PDF)
        </button>
        <p className="text-[11px] text-muted">
          Opens a printable page — choose "Save as PDF" in the print dialog. The report states clearly
          that these are simulated results.
        </p>
      </Section>
    </div>
  )
}
