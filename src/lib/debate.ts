import type { Candle } from '@/types'
import { atr, closes, ema, rsi, sma } from './indicators'

// Two agents read the SAME candles and argue opposite sides. Neither is lying — each is
// citing real indicators that genuinely point their way. The lesson is that evidence for both
// directions almost always exists, so "I found a reason to buy" is not a reason to buy.

export interface Case {
  side: 'buy' | 'sell'
  headline: string
  points: string[]
  strength: number // 0..1, how much the readings actually favour this side
}

export interface Debate {
  bull: Case
  bear: Case
  verdictNote: string
}

export function buildDebate(candles: Candle[], idx: number): Debate {
  const c = closes(candles)
  const price = candles[idx].close
  const r = rsi(c, 14)[idx]
  const e = ema(c, 20)[idx]
  const s = sma(c, 20)[idx]
  const win = candles.slice(Math.max(0, idx - 20), idx)
  const avgVol = win.reduce((a, x) => a + x.volume, 0) / (win.length || 1)
  const volRatio = avgVol ? candles[idx].volume / avgVol : 1
  const hi = Math.max(...c.slice(Math.max(0, idx - 20), idx))
  const lo = Math.min(...c.slice(Math.max(0, idx - 20), idx))
  const chg3 = ((price - c[Math.max(0, idx - 3)]) / c[Math.max(0, idx - 3)]) * 100
  const atrPct = (atr(candles, 14)[idx] / price) * 100
  const emaRising = e > ema(c, 20)[Math.max(0, idx - 3)]

  const bullPoints: string[] = []
  const bearPoints: string[] = []
  let bullScore = 0
  let bearScore = 0

  if (r < 40) { bullPoints.push(`RSI is ${r.toFixed(0)} — sellers look exhausted, bounces often start here.`); bullScore += 1 }
  if (r > 60) { bearPoints.push(`RSI is ${r.toFixed(0)} — buyers are stretched, pullbacks often start here.`); bearScore += 1 }

  if (price > e && emaRising) { bullPoints.push('Price is above a rising EMA(20). That is the textbook definition of an uptrend.'); bullScore += 1.5 }
  if (price < e && !emaRising) { bearPoints.push('Price is below a falling EMA(20). The trend is pointing down.'); bearScore += 1.5 }

  if (chg3 > 0.5) { bullPoints.push(`Up ${chg3.toFixed(1)}% over the last 3 candles — momentum is with the buyers.`); bullScore += 1 }
  if (chg3 < -0.5) { bearPoints.push(`Down ${Math.abs(chg3).toFixed(1)}% over the last 3 candles — sellers are in control.`); bearScore += 1 }

  if (price >= hi * 0.999) {
    if (volRatio > 1.3) { bullPoints.push(`Breaking to a 20-bar high on ${volRatio.toFixed(1)}× normal volume. Real buying, not drift.`); bullScore += 1.5 }
    else { bearPoints.push(`At a 20-bar high but volume is only ${volRatio.toFixed(1)}× average. Breakouts without volume usually fail.`); bearScore += 1 }
  }
  if (price <= lo * 1.001) { bullPoints.push('Price is testing its 20-bar low — support buyers often step in here.'); bullScore += 0.5 }

  const devSma = ((price - s) / s) * 100
  if (devSma > 2) { bearPoints.push(`Price is ${devSma.toFixed(1)}% above its 20-bar average. Stretched moves tend to snap back.`); bearScore += 1 }
  if (devSma < -2) { bullPoints.push(`Price is ${Math.abs(devSma).toFixed(1)}% below its 20-bar average. Cheap relative to recent history.`); bullScore += 1 }

  if (atrPct > 2) {
    bearPoints.push(`Volatility is high (${atrPct.toFixed(1)}% ATR). Wide swings punish tight stops in either direction.`)
    bearScore += 0.5
  }

  // Neither side is ever allowed to run out of things to say — that is the whole point.
  if (!bullPoints.length) bullPoints.push('Nothing here is decisively bearish. Sideways markets resolve upward more often than not.')
  if (!bearPoints.length) bearPoints.push('Nothing here is decisively bullish either. Doing nothing is a position too.')

  const total = bullScore + bearScore || 1
  const lean = Math.abs(bullScore - bearScore) / total

  return {
    bull: {
      side: 'buy',
      headline: bullScore > bearScore ? 'The stronger case right now' : 'The weaker case right now',
      points: bullPoints,
      strength: bullScore / total,
    },
    bear: {
      side: 'sell',
      headline: bearScore > bullScore ? 'The stronger case right now' : 'The weaker case right now',
      points: bearPoints,
      strength: bearScore / total,
    },
    verdictNote: lean < 0.2
      ? 'These two are nearly tied. When the evidence is this balanced, the professional move is usually to skip the trade — not to pick a coin-flip.'
      : bullScore > bearScore
        ? 'The bull case is better supported, but "better supported" is not "certain". Size accordingly.'
        : 'The bear case is better supported, but "better supported" is not "certain". Size accordingly.',
  }
}

// What the market actually did over the next `horizon` candles.
export function outcome(candles: Candle[], idx: number, horizon = 10): { movePct: number; wentUp: boolean } | null {
  const end = idx + horizon
  if (end >= candles.length) return null
  const movePct = ((candles[end].close - candles[idx].close) / candles[idx].close) * 100
  return { movePct, wentUp: movePct > 0 }
}
