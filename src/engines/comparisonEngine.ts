import type { ComparisonReport, ModeStat } from '@/types'

// Compare performance across modes (manual vs assisted vs auto vs swarm). Pure aggregation.
export function buildComparison(stats: ModeStat[]): ComparisonReport {
  if (!stats.length) {
    return { stats, bestLearningPoint: 'Run a few sessions in different modes to compare.' }
  }
  // Aggregate duplicate modes.
  const byMode = new Map<string, ModeStat>()
  for (const s of stats) {
    const cur = byMode.get(s.mode)
    if (!cur) { byMode.set(s.mode, { ...s }); continue }
    const n = cur.trades + s.trades
    byMode.set(s.mode, {
      mode: s.mode,
      pnl: cur.pnl + s.pnl,
      trades: n,
      winRatePct: n ? (cur.winRatePct * cur.trades + s.winRatePct * s.trades) / n : 0,
      maxDrawdownPct: Math.max(cur.maxDrawdownPct, s.maxDrawdownPct),
    })
  }
  const merged = Array.from(byMode.values())
  const best = merged.reduce((a, b) => (b.pnl > a.pnl ? b : a))
  const safest = merged.reduce((a, b) => (b.maxDrawdownPct < a.maxDrawdownPct ? b : a))

  return {
    stats: merged,
    bestMode: best.mode,
    safestMode: safest.mode,
    bestLearningPoint:
      `Highest mock P/L came from "${best.mode}"; the smoothest ride (lowest drawdown) was "${safest.mode}". ` +
      `Best P/L is not always the best process, low drawdown means fewer scary moments. Judge process, not just profit.`,
  }
}
