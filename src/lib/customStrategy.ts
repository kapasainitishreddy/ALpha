import type { Candle, StrategySignal } from '@/types'
import { atr, closes, ema, rsi, sma } from './indicators'

// Lets a user build their own strategy from plain-language rules instead of code.
// Deliberately small: a handful of indicators, one comparison each, all ANDed together.
// That constraint is the teaching — a strategy you can't state in one sentence is one you
// won't follow under pressure.

export type IndicatorId =
  | 'rsi'
  | 'priceVsEma20'
  | 'priceVsSma20'
  | 'volumeVsAvg'
  | 'change3'
  | 'priceVsHigh20'
  | 'priceVsLow20'

export type Op = '<' | '>'

export interface Rule {
  indicator: IndicatorId
  op: Op
  value: number
}

export interface CustomStrategy {
  id: string
  name: string
  side: 'buy' | 'sell'
  rules: Rule[]
  stopPct: number
  targetPct: number
}

interface IndicatorDef {
  label: string
  unit: string
  hint: string
  min: number
  max: number
  step: number
  default: number
  // Plain-English rendering of "<indicator> <op> <value>".
  phrase: (op: Op, v: number) => string
}

export const INDICATORS: Record<IndicatorId, IndicatorDef> = {
  rsi: {
    label: 'RSI (14)', unit: '', min: 5, max: 95, step: 1, default: 30,
    hint: 'Momentum meter, 0–100. Under 30 is often called oversold, over 70 overbought.',
    phrase: (op, v) => `RSI is ${op === '<' ? 'below' : 'above'} ${v}`,
  },
  priceVsEma20: {
    label: 'Price vs EMA(20)', unit: '%', min: -10, max: 10, step: 0.1, default: 0,
    hint: 'How far price sits above or below its 20-candle exponential average. Trend filter.',
    phrase: (op, v) => `price is ${op === '<' ? 'below' : 'above'} the EMA(20) by ${v}%`,
  },
  priceVsSma20: {
    label: 'Price vs SMA(20)', unit: '%', min: -10, max: 10, step: 0.1, default: 0,
    hint: 'Same idea as EMA but a plain average — slower to react, fewer false signals.',
    phrase: (op, v) => `price is ${op === '<' ? 'below' : 'above'} the SMA(20) by ${v}%`,
  },
  volumeVsAvg: {
    label: 'Volume vs 20-bar average', unit: '×', min: 0.2, max: 4, step: 0.1, default: 1.3,
    hint: 'Confirmation. A move on heavy volume means real participation, not noise.',
    phrase: (op, v) => `volume is ${op === '<' ? 'under' : 'over'} ${v}× its average`,
  },
  change3: {
    label: 'Change over last 3 candles', unit: '%', min: -10, max: 10, step: 0.1, default: 1,
    hint: 'Short-term momentum. Positive means price has been pushing up.',
    phrase: (op, v) => `price has moved ${op === '<' ? 'less than' : 'more than'} ${v}% in 3 candles`,
  },
  priceVsHigh20: {
    label: 'Price vs 20-bar high', unit: '%', min: -10, max: 5, step: 0.1, default: 0,
    hint: 'Breakout detector. Above 0% means price has cleared its recent ceiling.',
    phrase: (op, v) => `price is ${op === '<' ? 'below' : 'above'} the 20-bar high by ${v}%`,
  },
  priceVsLow20: {
    label: 'Price vs 20-bar low', unit: '%', min: -5, max: 10, step: 0.1, default: 0,
    hint: 'Support detector. Near 0% means price is testing its recent floor.',
    phrase: (op, v) => `price is ${op === '<' ? 'below' : 'above'} the 20-bar low by ${v}%`,
  },
}

// Value of each indicator at `idx`, in the units the rules are written in.
function readIndicators(candles: Candle[], idx: number): Record<IndicatorId, number> {
  const c = closes(candles)
  const price = candles[idx].close
  const win = candles.slice(Math.max(0, idx - 20), idx)
  const avgVol = win.length ? win.reduce((s, x) => s + x.volume, 0) / win.length : candles[idx].volume
  const hi = Math.max(...c.slice(Math.max(0, idx - 20), idx), price)
  const lo = Math.min(...c.slice(Math.max(0, idx - 20), idx), price)
  const e = ema(c, 20)[idx]
  const s = sma(c, 20)[idx]
  const prev3 = c[Math.max(0, idx - 3)]

  const pct = (a: number, b: number) => (b ? ((a - b) / b) * 100 : 0)
  return {
    rsi: rsi(c, 14)[idx],
    priceVsEma20: pct(price, e),
    priceVsSma20: pct(price, s),
    volumeVsAvg: avgVol ? candles[idx].volume / avgVol : 1,
    change3: pct(price, prev3),
    priceVsHigh20: pct(price, hi),
    priceVsLow20: pct(price, lo),
  }
}

export function describe(s: CustomStrategy): string {
  if (!s.rules.length) return 'No rules yet — this strategy will never trade.'
  const parts = s.rules.map((r) => INDICATORS[r.indicator].phrase(r.op, r.value))
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
  return `${s.side === 'buy' ? 'Buy' : 'Sell short'} when ${list}. Exit at ${s.stopPct}% loss or ${s.targetPct}% profit.`
}

// Same signature shape as the built-in strategies, so a custom strategy can run anywhere
// they can — backtest, swarm, assisted mode. Every rule must pass; there is no OR.
export function evaluateCustom(strategy: CustomStrategy, candles: Candle[], idx: number): StrategySignal {
  const price = candles[idx]?.close ?? candles[candles.length - 1].close
  const base = { strategyId: strategy.id, entry: price }

  if (idx < 20) {
    return { ...base, action: 'hold', confidence: 0, stopLoss: price * 0.99, target: price * 1.02, reason: 'Not enough data yet.' }
  }
  if (!strategy.rules.length) {
    return { ...base, action: 'hold', confidence: 0, stopLoss: price * 0.99, target: price * 1.02, reason: 'This strategy has no rules.' }
  }

  const vals = readIndicators(candles, idx)
  const failed = strategy.rules.filter((r) => {
    const v = vals[r.indicator]
    if (!Number.isFinite(v)) return true
    return r.op === '<' ? !(v < r.value) : !(v > r.value)
  })

  if (failed.length) {
    const f = failed[0]
    return {
      ...base,
      action: 'hold',
      confidence: 0,
      stopLoss: price * 0.99,
      target: price * 1.02,
      reason: `Waiting: ${INDICATORS[f.indicator].label} is ${vals[f.indicator].toFixed(1)}, rule needs ${f.op} ${f.value}.`,
    }
  }

  // Confidence rises with the number of independent conditions that had to line up.
  const confidence = Math.min(0.85, 0.5 + strategy.rules.length * 0.08)
  const a = atr(candles, 14)[idx] / price || 0.01
  const dir = strategy.side === 'buy' ? 1 : -1
  return {
    ...base,
    action: strategy.side,
    confidence,
    stopLoss: price * (1 - dir * (strategy.stopPct / 100)),
    target: price * (1 + dir * (strategy.targetPct / 100)),
    reason: `All ${strategy.rules.length} rule${strategy.rules.length === 1 ? '' : 's'} met (volatility ${(a * 100).toFixed(1)}%).`,
  }
}
