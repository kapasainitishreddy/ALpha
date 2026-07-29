import { hashSeed, mulberry32 } from './rng'
import { RISK_LIMITS } from '@/data/riskRules'

// Pure position-sizing / risk math. The teaching core: every number here is one a trader
// should compute BEFORE entering, not after. Used by the Risk Tools screen and the
// pre-trade planner. No store access, no side effects — trivially testable.
// The Monte Carlo below is seeded, so the same inputs always give the same answer.

export interface SizingInput {
  capital: number
  entry: number
  stopLoss: number
  riskPct: number // % of capital you are willing to lose on this one trade
  maxPositionFraction?: number // hard concentration cap; defaults to the Risk Guard's own limit
}

export interface SizingResult {
  qty: number
  riskPerShare: number
  totalRisk: number // rupees at risk if SL hits
  positionValue: number
  capitalUsedPct: number
  valid: boolean
  problem?: string
}

// "How many shares should I buy?" — the single most useful calculation a beginner never does.
//
// The size must clear TWO independent limits, and a beginner only ever thinks about the first:
//   1. risk limit — if the stop hits, lose no more than riskPct of capital
//   2. concentration limit — no single position may exceed maxPositionFraction of capital
// A cheap stock is usually bound by (1); an expensive one (SOL at ₹7k against a ₹10k account)
// is bound by (2). Returning a qty that satisfies only (1) hands the user an order the Risk
// Guard will reject, which is exactly how the old swarm sizing bug felt from the outside.
export function positionSize({ capital, entry, stopLoss, riskPct, maxPositionFraction = RISK_LIMITS.maxTradeValueFraction }: SizingInput): SizingResult {
  const empty: SizingResult = {
    qty: 0, riskPerShare: 0, totalRisk: 0, positionValue: 0, capitalUsedPct: 0, valid: false,
  }
  if (capital <= 0 || entry <= 0) return { ...empty, problem: 'Enter capital and entry price.' }
  if (stopLoss <= 0) return { ...empty, problem: 'Set a stop loss. Never trade without one.' }
  if (stopLoss === entry) return { ...empty, problem: 'Stop loss cannot equal entry price.' }
  if (riskPct <= 0) return { ...empty, problem: 'Risk % must be above 0.' }

  const riskPerShare = Math.abs(entry - stopLoss)
  const rupeesAtRisk = capital * (riskPct / 100)
  const byRisk = Math.floor(rupeesAtRisk / riskPerShare)
  const byConcentration = Math.floor((capital * maxPositionFraction) / entry)
  const qty = Math.min(byRisk, byConcentration)

  if (byConcentration < 1) {
    return {
      ...empty,
      riskPerShare,
      problem: `One share costs ₹${entry.toFixed(0)} — over ${(maxPositionFraction * 100).toFixed(0)}% of your ₹${capital.toFixed(0)}. Too big for this account. Practise on a cheaper instrument.`,
    }
  }
  if (byRisk < 1) {
    return {
      ...empty,
      riskPerShare,
      problem: `Your stop is ₹${riskPerShare.toFixed(2)} away, but you only risk ₹${rupeesAtRisk.toFixed(0)}. Widen risk %, tighten the stop, or pick a cheaper stock.`,
    }
  }

  const positionValue = qty * entry
  return {
    qty,
    riskPerShare,
    totalRisk: qty * riskPerShare,
    positionValue,
    capitalUsedPct: (positionValue / capital) * 100,
    valid: true,
    // Say so when concentration, not risk, is what capped the size — the reason matters.
    problem: byConcentration < byRisk
      ? `Capped at ${qty} by the ${(maxPositionFraction * 100).toFixed(0)}% position limit. Your risk budget alone would have allowed ${byRisk}.`
      : undefined,
  }
}

// "Where should my stop loss go?" — reverse of the above: fix the qty, solve for the stop.
export function stopLossFor(capital: number, entry: number, qty: number, riskPct: number, side: 'buy' | 'sell' = 'buy'): number {
  if (capital <= 0 || entry <= 0 || qty < 1 || riskPct <= 0) return 0
  const perShare = (capital * (riskPct / 100)) / qty
  const sl = side === 'buy' ? entry - perShare : entry + perShare
  return Math.max(0, +sl.toFixed(2))
}

export interface RewardRisk {
  ratio: number
  reward: number
  risk: number
  verdict: 'good' | 'ok' | 'poor'
  advice: string
}

// R:R below 1:1 means you need a >50% win rate just to break even. Beginners take these constantly.
export function rewardRisk(entry: number, stopLoss: number, target: number): RewardRisk {
  const risk = Math.abs(entry - stopLoss)
  const reward = Math.abs(target - entry)
  const ratio = risk > 0 ? reward / risk : 0

  if (ratio >= 2) {
    return { ratio, reward, risk, verdict: 'good', advice: `Risking ₹${risk.toFixed(2)} to make ₹${reward.toFixed(2)}. You can be wrong more often than right and still profit.` }
  }
  if (ratio >= 1) {
    return { ratio, reward, risk, verdict: 'ok', advice: `Fair, not great. At ${ratio.toFixed(2)}:1 you need to win more than ${(100 / (1 + ratio)).toFixed(0)}% of trades to break even.` }
  }
  return {
    ratio, reward, risk, verdict: 'poor',
    advice: `You risk ₹${risk.toFixed(2)} to make only ₹${reward.toFixed(2)}. You'd need to win over ${(100 / (1 + ratio)).toFixed(0)}% of trades just to break even. Move your target further, or your stop closer.`,
  }
}

export interface RuinResult {
  ruinPct: number // chance of a catastrophic (>=50%) drawdown over the run
  medianEndPct: number // typical ending balance as % of start
  worstEndPct: number // 5th-percentile ending balance
  expectancy: number // average profit per trade, in units of the amount risked
}

// Monte Carlo over `trades` outcomes, repeated `runs` times. Simulated rather than closed-form:
// the textbook gambler's-ruin formula assumes fixed *stake* betting and collapses to ~0% for any
// decent edge, which teaches nothing. Compounding a fixed *fraction* is what traders actually do,
// and the spread of outcomes is the whole lesson.
// "Ruin" = losing half the account, since a 50% drawdown needs a 100% gain to recover from.
export function riskOfRuin(winRatePct: number, riskPct: number, rewardRiskRatio = 1, trades = 100, runs = 400): RuinResult {
  const w = Math.min(0.99, Math.max(0.01, winRatePct / 100))
  const r = Math.max(0.001, riskPct / 100)
  const expectancy = w * rewardRiskRatio - (1 - w)

  const rng = mulberry32(hashSeed(`${winRatePct}|${riskPct}|${rewardRiskRatio}`))
  const ends: number[] = []
  let ruined = 0

  for (let i = 0; i < runs; i++) {
    let equity = 1
    let bust = false
    for (let t = 0; t < trades; t++) {
      equity *= rng() < w ? 1 + r * rewardRiskRatio : 1 - r
      if (equity <= 0.5) { bust = true; break }
    }
    if (bust) ruined++
    ends.push(Math.max(0, equity))
  }

  ends.sort((a, b) => a - b)
  return {
    ruinPct: (ruined / runs) * 100,
    medianEndPct: ends[Math.floor(runs / 2)] * 100,
    worstEndPct: ends[Math.floor(runs * 0.05)] * 100,
    expectancy,
  }
}
