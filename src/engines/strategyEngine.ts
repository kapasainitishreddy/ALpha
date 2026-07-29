import type { Candle, StrategySignal } from '@/types'
import { atr, closes, ema, rsi, sma, vwap } from '@/lib/indicators'

// Evaluate a strategy over a candle window ending at `idx`. Returns a signal (may be 'hold').
// Deterministic, same candles always produce the same signal.
export function evaluateStrategy(
  strategyId: string,
  candles: Candle[],
  idx: number,
): StrategySignal {
  const price = candles[idx]?.close ?? candles[candles.length - 1].close
  const c = closes(candles)
  const hold = (reason: string): StrategySignal => ({
    strategyId,
    action: 'hold',
    confidence: 0,
    entry: price,
    stopLoss: price * 0.99,
    target: price * 1.02,
    reason,
  })
  if (idx < 20) return hold('Not enough data yet.')

  const long = (conf: number, slPct: number, tpMult: number, reason: string): StrategySignal => ({
    strategyId,
    action: 'buy',
    confidence: conf,
    entry: price,
    stopLoss: price * (1 - slPct),
    target: price * (1 + slPct * tpMult),
    reason,
  })
  const short = (conf: number, slPct: number, tpMult: number, reason: string): StrategySignal => ({
    strategyId,
    action: 'sell',
    confidence: conf,
    entry: price,
    stopLoss: price * (1 + slPct),
    target: price * (1 - slPct * tpMult),
    reason,
  })

  const a = atr(candles, 14)[idx] / price || 0.01

  switch (strategyId) {
    case 'rsi-bounce': {
      const r = rsi(c, 14)
      if (r[idx] < 32 && r[idx] > r[idx - 1]) return long(0.6, a * 1.2, 2, 'RSI oversold and turning up.')
      if (r[idx] > 68 && r[idx] < r[idx - 1]) return short(0.55, a * 1.2, 2, 'RSI overbought and turning down.')
      return hold('RSI neutral.')
    }
    case 'ma-crossover': {
      const fast = sma(c, 9)
      const slow = sma(c, 21)
      if (fast[idx - 1] <= slow[idx - 1] && fast[idx] > slow[idx]) return long(0.6, a, 2, 'Fast MA crossed above slow MA.')
      if (fast[idx - 1] >= slow[idx - 1] && fast[idx] < slow[idx]) return short(0.55, a, 2, 'Fast MA crossed below slow MA.')
      return hold('No crossover.')
    }
    case 'ema-trend': {
      const e = ema(c, 20)
      const rising = e[idx] > e[idx - 3]
      if (price > e[idx] && rising) return long(0.62, a, 2.5, 'Price above a rising EMA(20).')
      if (price < e[idx] && !rising) return short(0.5, a, 2, 'Price below a falling EMA(20).')
      return hold('No clean EMA trend.')
    }
    case 'breakout-volume':
    case 'volatility-breakout': {
      const hi = Math.max(...c.slice(idx - 20, idx))
      const avgVol = candles.slice(idx - 20, idx).reduce((s, x) => s + x.volume, 0) / 20
      const volOk = candles[idx].volume > avgVol * 1.3
      if (price > hi && volOk) return long(0.65, a * 1.3, 1.8, 'Breakout above 20-bar high on rising volume.')
      return hold('No confirmed breakout.')
    }
    case 'opening-range-breakout': {
      const range = candles.slice(0, 6)
      const orHigh = Math.max(...range.map((x) => x.high))
      const orLow = Math.min(...range.map((x) => x.low))
      if (price > orHigh) return long(0.58, a * 1.2, 1.5, 'Broke above opening range.')
      if (price < orLow) return short(0.55, a * 1.2, 1.5, 'Broke below opening range.')
      return hold('Inside opening range.')
    }
    case 'support-resistance': {
      const lo = Math.min(...c.slice(idx - 20, idx))
      const hi = Math.max(...c.slice(idx - 20, idx))
      if (price <= lo * 1.005) return long(0.55, a, 2, 'Price near support.')
      if (price >= hi * 0.995) return short(0.5, a, 2, 'Price near resistance.')
      return hold('Mid-range.')
    }
    case 'mean-reversion': {
      const m = sma(c, 20)[idx]
      const dev = (price - m) / m
      if (dev < -0.02) return long(0.55, a, 1.5, 'Price well below its mean.')
      if (dev > 0.02) return short(0.5, a, 1.5, 'Price well above its mean.')
      return hold('Near mean.')
    }
    case 'vwap-reclaim': {
      const vw = vwap(candles)
      if (candles[idx - 1].close < vw[idx - 1] && price > vw[idx]) return long(0.58, a, 2, 'Price reclaimed VWAP from below.')
      if (candles[idx - 1].close > vw[idx - 1] && price < vw[idx]) return short(0.52, a, 2, 'Price lost VWAP.')
      return hold('No VWAP cross.')
    }
    case 'momentum':
    case 'news-sentiment':
    case 'tech-sentiment-score':
    case 'multi-agent-debate': {
      const chg = (price - c[idx - 3]) / c[idx - 3]
      if (chg > 0.01) return long(0.55, a, 2, 'Positive momentum over last 3 bars.')
      if (chg < -0.01) return short(0.5, a, 2, 'Negative momentum over last 3 bars.')
      return hold('Flat momentum.')
    }
    // Quant / experimental strategies: conservative range logic so they behave in the simulator.
    case 'pairs-trading':
    case 'grid':
    case 'market-making':
    case 'arbitrage':
    case 'portfolio-alloc':
    case 'rl-experiment':
    case 'risk-first-reject':
    default: {
      const m = sma(c, 20)[idx]
      const dev = (price - m) / m
      if (dev < -0.015) return long(0.5, a, 1.5, 'Below fair value (range logic).')
      if (dev > 0.015) return short(0.45, a, 1.5, 'Above fair value (range logic).')
      return hold('No edge this bar.')
    }
  }
}
