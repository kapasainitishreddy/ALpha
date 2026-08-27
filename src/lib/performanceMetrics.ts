import type { Trade } from '@/types'

export interface PerformanceMetrics {
  closedTrades: number
  wins: number
  losses: number
  winRatePct: number
  averageWin: number
  averageLoss: number
  expectancy: number
  profitFactor: number | null
  maxDrawdown: number
}

/**
 * Deterministic paper-trading analytics derived only from closed mock trades.
 * No market prediction or financial recommendation is involved.
 */
export function performanceMetrics(trades: Trade[]): PerformanceMetrics {
  const closed = trades
    .filter((t) => t.status === 'closed' && Number.isFinite(t.realizedPnl))
    .slice()
    .sort((a, b) => (a.closedAt ?? a.openedAt) - (b.closedAt ?? b.openedAt))

  const pnls = closed.map((t) => t.realizedPnl ?? 0)
  const wins = pnls.filter((x) => x > 0)
  const losses = pnls.filter((x) => x < 0)
  const grossProfit = wins.reduce((a, b) => a + b, 0)
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0))
  const averageWin = wins.length ? grossProfit / wins.length : 0
  const averageLoss = losses.length ? grossLoss / losses.length : 0
  const expectancy = pnls.length ? pnls.reduce((a, b) => a + b, 0) / pnls.length : 0

  let equity = 0
  let peak = 0
  let maxDrawdown = 0
  for (const pnl of pnls) {
    equity += pnl
    peak = Math.max(peak, equity)
    maxDrawdown = Math.max(maxDrawdown, peak - equity)
  }

  return {
    closedTrades: pnls.length,
    wins: wins.length,
    losses: losses.length,
    winRatePct: pnls.length ? (wins.length / pnls.length) * 100 : 0,
    averageWin,
    averageLoss,
    expectancy,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? null : 0,
    maxDrawdown,
  }
}
