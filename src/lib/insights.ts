import type { AppMode, JournalEntry, Trade } from '@/types'

// Post-session analysis: which strategy actually suits this person, how their modes compare,
// and what a losing trade looked like moment by moment. All derived from stored trades —
// no new state, no engine changes.

export interface Fitness {
  strategyId: string
  trades: number
  wins: number
  winRatePct: number
  totalPnl: number
  avgPnl: number
  expectancy: number // avg win/loss ratio weighted by hit rate
  score: number // 0..100, comparable across strategies
  verdict: string
}

// A strategy "fits you" if YOUR execution of it made money, not if the strategy is famous.
// Score blends profitability and consistency, then damps it by sample size — 2 lucky trades
// should never outrank 20 steady ones.
export function strategyFitness(trades: Trade[]): Fitness[] {
  const closed = trades.filter((t) => t.status === 'closed' && t.strategyTag)
  const byId = new Map<string, Trade[]>()
  for (const t of closed) {
    const k = t.strategyTag!
    byId.set(k, [...(byId.get(k) ?? []), t])
  }

  const out: Fitness[] = []
  for (const [strategyId, ts] of byId) {
    const pnls = ts.map((t) => t.realizedPnl ?? 0)
    const wins = pnls.filter((p) => p > 0)
    const losses = pnls.filter((p) => p <= 0)
    const totalPnl = pnls.reduce((a, b) => a + b, 0)
    const winRatePct = (wins.length / ts.length) * 100

    const avgWin = wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0
    const avgLoss = losses.length ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0
    const rr = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 2 : 0
    const expectancy = (winRatePct / 100) * rr - (1 - winRatePct / 100)

    // Confidence ramps to full only around 20 trades; below that the score is pulled to neutral.
    const confidence = Math.min(1, ts.length / 20)
    const raw = 50 + expectancy * 40
    const score = Math.max(0, Math.min(100, 50 + (raw - 50) * confidence))

    out.push({
      strategyId,
      trades: ts.length,
      wins: wins.length,
      winRatePct,
      totalPnl,
      avgPnl: totalPnl / ts.length,
      expectancy,
      score,
      verdict:
        ts.length < 5
          ? `Only ${ts.length} trade${ts.length === 1 ? '' : 's'} — far too few to judge. Keep using it.`
          : expectancy > 0.3
            ? 'Working well in your hands. This is worth doubling down on.'
            : expectancy > 0
              ? 'Marginally positive. Real, but thin — the edge could be noise.'
              : 'Losing money as you trade it. Either the strategy or your execution of it needs work.',
    })
  }

  return out.sort((a, b) => b.score - a.score)
}

export interface ModeCurve {
  mode: AppMode
  points: number[] // cumulative P&L after each closed trade
  final: number
}

// Cumulative P&L per mode, for overlaying manual vs assisted vs auto vs swarm on one chart.
export function equityCurves(trades: Trade[]): ModeCurve[] {
  const closed = trades.filter((t) => t.status === 'closed').sort((a, b) => (a.closedAt ?? 0) - (b.closedAt ?? 0))
  const byMode = new Map<AppMode, number[]>()

  for (const t of closed) {
    const cur = byMode.get(t.mode) ?? [0]
    cur.push(cur[cur.length - 1] + (t.realizedPnl ?? 0))
    byMode.set(t.mode, cur)
  }

  return [...byMode.entries()]
    .map(([mode, points]) => ({ mode, points, final: points[points.length - 1] }))
    .sort((a, b) => b.final - a.final)
}

export interface ReplayStep {
  label: string
  detail: string
  tone: 'ok' | 'bad' | 'info'
}

// Walks a single trade and narrates each decision point. Used on losing trades, where the
// useful question is never "why did it lose" but "which decision was actually wrong".
export function replayTrade(t: Trade): ReplayStep[] {
  const steps: ReplayStep[] = []
  const pnl = t.realizedPnl ?? 0
  const risk = t.stopLoss ? Math.abs(t.entryPrice - t.stopLoss) * t.qty : 0
  const reward = t.target ? Math.abs(t.target - t.entryPrice) * t.qty : 0

  steps.push({
    label: 'Entry',
    detail: `${t.side === 'buy' ? 'Bought' : 'Sold short'} ${t.qty} ${t.symbol} at ₹${t.entryPrice.toFixed(2)}.`,
    tone: 'info',
  })

  if (!t.stopLoss) {
    steps.push({ label: 'Stop loss', detail: 'You placed this trade with no stop loss. Every other decision after this one was made without a safety net.', tone: 'bad' })
  } else {
    steps.push({
      label: 'Stop loss',
      detail: `Stop at ₹${t.stopLoss.toFixed(2)} — risking ₹${risk.toFixed(2)} if wrong.`,
      tone: 'ok',
    })
  }

  if (!t.target) {
    steps.push({ label: 'Target', detail: 'No target set. Without one there is no plan for taking profit, so exits become emotional.', tone: 'bad' })
  } else {
    const rr = risk > 0 ? reward / risk : 0
    steps.push({
      label: 'Target',
      detail: `Target ₹${t.target.toFixed(2)} — aiming for ₹${reward.toFixed(2)}. Reward to risk ${rr.toFixed(2)}:1.`,
      tone: rr >= 1.5 ? 'ok' : 'bad',
    })
  }

  if (t.exitPrice !== undefined) {
    const hitStop = t.stopLoss !== undefined && Math.abs(t.exitPrice - t.stopLoss) < Math.abs(t.exitPrice - (t.target ?? Infinity))
    steps.push({
      label: 'Exit',
      detail: `Closed at ₹${t.exitPrice.toFixed(2)} for ${pnl >= 0 ? '+' : ''}₹${pnl.toFixed(2)}${hitStop && pnl < 0 ? ' — the stop did its job and capped the damage.' : '.'}`,
      tone: pnl >= 0 ? 'ok' : 'info',
    })
  }

  steps.push({
    label: 'Verdict',
    detail:
      pnl >= 0
        ? !t.stopLoss
          ? 'This one made money, but it was placed without a stop. A profitable bad habit is the most dangerous kind — it teaches you the wrong lesson.'
          : 'Planned and executed properly. Repeatable.'
        : !t.stopLoss
          ? 'The loss is not the mistake. Trading without a stop is the mistake — this time it just happened to be the trade that caught you.'
          : risk > 0 && reward / risk < 1
            ? 'You risked more than you stood to gain. Even a good entry cannot fix that maths over time.'
            : 'A planned loss with a stop that worked. Nothing here needs fixing — this is simply the cost of doing business.',
    tone: pnl >= 0 && t.stopLoss ? 'ok' : pnl < 0 && t.stopLoss ? 'info' : 'bad',
  })

  return steps
}

// Best sessions ranked by return on the balance they started with, not raw rupees —
// otherwise a big account always wins.
export interface LeaderRow {
  entry: JournalEntry
  returnPct: number
  rank: number
}

export function leaderboard(journal: JournalEntry[], limit = 10): LeaderRow[] {
  return journal
    .filter((j) => j.startBalance > 0)
    .map((entry) => ({ entry, returnPct: (entry.pnl / entry.startBalance) * 100, rank: 0 }))
    .sort((a, b) => b.returnPct - a.returnPct)
    .slice(0, limit)
    .map((r, i) => ({ ...r, rank: i + 1 }))
}
