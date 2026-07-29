import type { Mistake, Trade } from '@/types'
import { maxTradesFor } from '@/data/riskRules'

// Detect common beginner mistakes from a set of (mostly closed) trades. Pure, no side effects.
export function detectMistakes(trades: Trade[], mode: string, startBalance: number): Mistake[] {
  const mistakes: Mistake[] = []
  const closed = trades.filter((t) => t.status === 'closed')

  // 1. Trades without a stop loss.
  const noSl = trades.filter((t) => !t.stopLoss).length
  if (noSl > 0) {
    mistakes.push({
      code: 'no-stop-loss',
      title: 'Traded without a stop loss',
      detail: `${noSl} trade(s) had no stop loss.`,
      fatherAdvice: 'Stop loss lekunda enduku trade cheyyaku. Modata loss limit set cheyyi.',
      severity: 'high',
    })
  }

  // 2. Overtrading.
  if (trades.length > maxTradesFor(mode)) {
    mistakes.push({
      code: 'overtrading',
      title: 'Overtrading',
      detail: `${trades.length} trades in one session (limit ${maxTradesFor(mode)}).`,
      fatherAdvice: 'Ekkuva trades = ekkuva fees + tension. Rendu-moodu manchi trades chాలు.',
      severity: 'medium',
    })
  }

  // 3. Oversizing (any single trade > 40% of starting balance).
  const oversized = trades.filter((t) => t.entryPrice * t.qty > startBalance * 0.4).length
  if (oversized > 0) {
    mistakes.push({
      code: 'oversizing',
      title: 'Position too large',
      detail: `${oversized} trade(s) used a very large share of the balance.`,
      fatherAdvice: 'Oke trade lo ekkuva money pettaku. Chinna size, capital safe.',
      severity: 'high',
    })
  }

  // 4. Poor risk/reward on closed losers.
  const badRR = closed.filter((t) => {
    if (!t.stopLoss || !t.target) return false
    const risk = Math.abs(t.entryPrice - t.stopLoss)
    const reward = Math.abs(t.target - t.entryPrice)
    return risk > 0 && reward / risk < 1.2
  }).length
  if (badRR > 0) {
    mistakes.push({
      code: 'bad-risk-reward',
      title: 'Weak risk/reward',
      detail: `${badRR} trade(s) risked more than the reward was worth.`,
      fatherAdvice: 'Reward risk kanna ekkuva undali. Chinna reward ki peddha risk vద్దు.',
      severity: 'medium',
    })
  }

  // 5. Revenge trading signal: a loss immediately followed by a bigger trade.
  for (let i = 1; i < closed.length; i++) {
    const prev = closed[i - 1]
    const cur = closed[i]
    if ((prev.realizedPnl ?? 0) < 0 && cur.entryPrice * cur.qty > prev.entryPrice * prev.qty * 1.5) {
      mistakes.push({
        code: 'revenge-trading',
        title: 'Possible revenge trading',
        detail: 'A bigger trade was placed right after a loss.',
        fatherAdvice: 'Loss tarvatha peddha trade tho recover cheయyాలని chudaku. Emotion danger.',
        severity: 'high',
      })
      break
    }
  }

  return mistakes
}
