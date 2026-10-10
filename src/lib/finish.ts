import type { AppMode, Trade } from '@/types'
import { buildJournal } from '@/engines/journalEngine'
import { useStore, todayKey } from '@/store/useStore'

// Save an end-of-session journal + a comparison stat. Used by manual/assisted/auto/swarm pages.
export function finishSession(mode: AppMode, closed: Trade[], startBalance: number, dailyDate?: string): void {
  const state = useStore.getState()
  startBalance += closed.filter(t => state.journaledTradeIds.includes(t.id)).reduce((v,t) => v + (t.realizedPnl ?? 0), 0)
  closed = closed.filter(t => !state.journaledTradeIds.includes(t.id)).sort((a, b) => (a.closedAt ?? 0) - (b.closedAt ?? 0) || (a.closeSequence ?? 0) - (b.closeSequence ?? 0))
  if (!closed.length) return
  for (const t of closed) {
    if (!useStore.getState().trades.some(old => old.id === t.id)) {
      state.addTrade({ ...t, status: 'open', realizedPnl: undefined })
      state.settleTrade(t)
    }
  }
  state.markJournaled(closed.map(t => t.id))
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
  if (dailyDate === today && closed.length && !store.dailyResults.some((d) => d.date === today)) {
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
