import type { AppMode, JournalEntry, Trade } from '@/types'
import { detectMistakes } from './mistakeDetectorEngine'

// Build an end-of-session journal entry from trades. Rule-based "AI" narration, no model needed.
export function buildJournal(
  mode: AppMode,
  trades: Trade[],
  startBalance: number,
  endBalance: number,
): JournalEntry {
  const closed = trades.filter((t) => t.status === 'closed')
  const pnls = closed.map((t) => t.realizedPnl ?? 0)
  const pnl = endBalance - startBalance
  const mistakes = detectMistakes(trades, mode, startBalance)
  const strategiesUsed = Array.from(new Set(trades.map((t) => t.strategyTag).filter(Boolean))) as string[]

  const wentWell: string[] = []
  const couldImprove: string[] = []

  const withSl = trades.filter((t) => t.stopLoss).length
  if (trades.length && withSl === trades.length) wentWell.push('Every trade had a stop loss, capital protection first.')
  if (mistakes.length === 0 && trades.length) wentWell.push('No major mistakes detected this session.')
  if (pnl >= 0 && trades.length) wentWell.push('Session ended in mock profit, but check if it was process or luck.')

  for (const m of mistakes) couldImprove.push(`${m.title}: ${m.fatherAdvice}`)
  if (!trades.length) couldImprove.push('No trades taken, that can be a valid, safe choice on unclear days.')

  const followedRules = mistakes.filter((m) => m.severity === 'high').length === 0

  let tomorrowLesson: string
  if (!trades.length) {
    tomorrowLesson = 'Repu oka clear setup కోసం wait cheyyi. Trade lేకపోవడం kuda ok.'
  } else if (pnl >= 0) {
    tomorrowLesson = 'Same discipline continue cheyyi: stop loss, chinna size, overtrade వద్దు.'
  } else {
    tomorrowLesson = 'Repu risk thagginchi, better setups matrame తీసుకో. Capital first, profit tarvatha.'
  }

  return {
    id: `j${Date.now().toString(36)}`,
    mode,
    createdAt: Date.now(),
    startBalance,
    endBalance,
    pnl,
    tradeCount: trades.length,
    strategiesUsed,
    bestTradePnl: pnls.length ? Math.max(...pnls) : 0,
    worstTradePnl: pnls.length ? Math.min(...pnls) : 0,
    mistakes,
    wentWell,
    couldImprove,
    followedRules,
    tomorrowLesson,
  }
}
