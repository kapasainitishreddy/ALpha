import { DISCLAIMERS } from '@/data/disclaimers'

// Mock compounding challenges. Shows the shape of compounding WITHOUT promising it.
export interface Challenge {
  id: string
  name: string
  start: number
  safeTarget: number
  aggressiveTarget: number
  note: string
}

export const CHALLENGES: Challenge[] = [
  { id: 'c100', name: '₹100 Strategy Swarm challenge', start: 100, safeTarget: 110, aggressiveTarget: 150, note: 'Small capital split across swarm agents.' },
  { id: 'c500', name: '₹500 Father Mode challenge', start: 500, safeTarget: 550, aggressiveTarget: 750, note: DISCLAIMERS.compoundWarning },
  { id: 'c1000', name: '₹1,000 practice challenge', start: 1000, safeTarget: 1100, aggressiveTarget: 1500, note: 'Larger practice account.' },
]

export interface CompoundStep {
  day: number
  balance: number
}

// Project a compounding path at a given daily return, capped at the target (stop-at-target rule).
export function projectCompound(start: number, dailyReturnPct: number, target: number, maxDays = 30): {
  path: CompoundStep[]
  reachedTargetDay?: number
  warning?: string
} {
  const path: CompoundStep[] = [{ day: 0, balance: start }]
  let balance = start
  let reachedTargetDay: number | undefined
  for (let d = 1; d <= maxDays; d++) {
    balance = balance * (1 + dailyReturnPct / 100)
    path.push({ day: d, balance: Math.round(balance) })
    if (balance >= target && reachedTargetDay === undefined) {
      reachedTargetDay = d
      break // stop at target
    }
  }
  const warning = dailyReturnPct > 3
    ? 'A steady 3%+ daily return is unrealistic in real markets. This is only a mock projection.'
    : undefined
  return { path, reachedTargetDay, warning }
}
