import type { AppMode, Trade } from '@/types'
import { buildJournal } from '@/engines/journalEngine'
import { useStore, todayKey } from '@/store/useStore'

// Save an end-of-session journal + a comparison stat. Used by manual/assisted/auto/swarm pages.
export function finishSession(mode: AppMode, closed: Trade[], startBalance: number): void {
  const pnl = closed.reduce((s, t) => s + (t.realizedPnl ?? 0), 0)
  const endBalance = startBalance + pnl
  const journal = buildJournal(mode, closed, startBalance, endBalance)
  const wins = closed.filter((t) => (t.realizedPnl ?? 0) > 0).length

  const store = useStore.getState()
  store.addJournal(journal)
  store.pushModeStat({
    mode,
    pnl,
    trades: closed.length,
    winRatePct: closed.length ? (wins / closed.length) * 100 : 0,
    maxDrawdownPct: estimateDrawdown(closed, startBalance),
  })

  // Close the loop on the two features that depend on a finished session: pair today's mood
  // with what it earned, and lock in a daily-challenge result if one isn't recorded yet.
  store.settleMood(pnl)
  const today = todayKey()
  if (closed.length && !store.dailyResults.some((d) => d.date === today)) {
    store.recordDaily({
      date: today,
      pnlPct: startBalance > 0 ? (pnl / startBalance) * 100 : 0,
      trades: closed.length,
    })
  }
}

function estimateDrawdown(closed: Trade[], start: number): number {
  let bal = start
  let peak = start
  let maxDd = 0
  for (const t of closed) {
    bal += t.realizedPnl ?? 0
    if (bal > peak) peak = bal
    maxDd = Math.max(maxDd, (peak - bal) / peak)
  }
  return +(maxDd * 100).toFixed(1)
}
