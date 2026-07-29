// Hard-coded, non-negotiable safety limits. The Risk Guard reads ONLY from here.
// These are invariants, do not make them user-editable in a way that removes protection.

import type { RiskLevel } from '@/types'

export const RISK_LIMITS = {
  // Fraction of balance a single trade may risk/deploy.
  maxTradeValueFraction: 0.4, // never let 40%+ of balance go into one position
  fatherMaxTradeValueFraction: 0.15,
  // Session stops.
  dailyLossFraction: 0.1, // stop the day after losing 10% of starting balance
  targetProfitFraction: 0.2, // default aggressive target flag threshold
  maxTradesPerDay: 8,
  fatherMaxTradesPerDay: 3,
  fatherMaxConsecutiveLosses: 2,
  maxConsecutiveLosses: 4,
  minRiskReward: 1.2, // reject trades with reward:risk below this
  // Swarm.
  minCashReserveFraction: 0.1,
  maxSingleAgentFraction: 0.35, // never all-in on one agent
  // Future real mode (LOCKED in v1, enforced by the UI never wiring a broker).
  realMaxExposure: 1000,
  realMaxPerTrade: 250,
  realMaxDailyLoss: 50,
  realMaxTradesPerDay: 3,
} as const

export function maxTradeFraction(mode: string): number {
  return mode === 'father'
    ? RISK_LIMITS.fatherMaxTradeValueFraction
    : RISK_LIMITS.maxTradeValueFraction
}

export function maxTradesFor(mode: string): number {
  return mode === 'father' ? RISK_LIMITS.fatherMaxTradesPerDay : RISK_LIMITS.maxTradesPerDay
}

export function maxConsecutiveLossesFor(mode: string): number {
  return mode === 'father'
    ? RISK_LIMITS.fatherMaxConsecutiveLosses
    : RISK_LIMITS.maxConsecutiveLosses
}

// Allocation weights by risk level (relative, normalized by allocator).
export const RISK_LEVEL_WEIGHT: Record<RiskLevel, number> = {
  low: 1.0,
  medium: 0.8,
  high: 0.6, // riskier strategies get LESS capital by default
}
