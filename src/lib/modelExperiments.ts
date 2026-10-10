import type { Candle } from '@/types'
import { gaussian, hashSeed, mulberry32 } from './rng'
export type Experiment =
  | 'pairs'
  | 'grid'
  | 'market-making'
  | 'arbitrage'
  | 'allocation'
  | 'regression'
  | 'q-learning'
export interface ExperimentResult {
  equity: number[]
  pnl: number
  fills: number
  fees: number
  drawdown: number
  trainBars: number
  note: string
}
const fee = 0.0003
export function runExperiment(kind: Experiment, bars: Candle[], seed = 42): ExperimentResult {
  if (bars.length < 50) throw new Error('At least 50 bars required.')
  const rng = mulberry32(hashSeed(`${kind}:${seed}`))
  const start = 10000
  const split = Math.floor(bars.length * 0.6)
  const price = bars.map((b) => b.close)
  const equity: number[] = [start]
  let cash = start,
    fills = 0,
    fees = 0
  let trainBars = 0
  let note = ''
  const charge = (value: number) => {
    const cost = Math.abs(value) * fee
    fees += cost
    cash -= cost
    fills++
  }
  if (kind === 'pairs') {
    // Second asset explicitly synthetic: correlated base plus a mean-reverting log spread.
    let noise = 0
    const second = price.map((p) => {
      noise = 0.8 * noise + gaussian(rng) * 0.005
      return p * Math.exp(noise)
    })
    let position = 0,
      entryA = 0,
      entryB = 0,
      qtyA = 0,
      qtyB = 0
    for (let i = 20; i < price.length; i++) {
      const spreads = price.slice(i - 20, i).map((p, j) => Math.log(p / second[i - 20 + j]))
      const mean = spreads.reduce((a, b) => a + b, 0) / 20
      const std = Math.sqrt(spreads.reduce((a, b) => a + (b - mean) ** 2, 0) / 20) || 1
      const z = (Math.log(price[i] / second[i]) - mean) / std
      if (position && (position * z >= 0 || Math.abs(z) > 4 || i === price.length - 1)) {
        cash += position * ((price[i] - entryA) * qtyA - (second[i] - entryB) * qtyB)
        charge(price[i] * qtyA)
        charge(second[i] * qtyB)
        position = 0
      }
      if (!position && Math.abs(z) > 2 && i < price.length - 1) {
        position = z > 0 ? -1 : 1
        entryA = price[i]
        entryB = second[i]
        qtyA = (cash * 0.05) / entryA
        qtyB = (cash * 0.05) / entryB
        charge(entryA * qtyA)
        charge(entryB * qtyB)
      }
      equity.push(
        cash +
          (position ? position * ((price[i] - entryA) * qtyA - (second[i] - entryB) * qtyB) : 0),
      )
    }
    note =
      'Two synthetic correlated assets, prior-window spread z-score, dollar-neutral 5% per leg. Correlation is not a cointegration test; borrow and simultaneous fills are omitted.'
  } else if (kind === 'grid') {
    const base = price[20]
    const step = base * 0.01
    const levels = [1, 2, 3, 4, 5].map((n) => base - n * step)
    const positions = new Map<number, { entry: number; qty: number }>()
    for (let i = 21; i < bars.length; i++) {
      for (const [level, p] of [...positions])
        if (bars[i].high >= p.entry + step) {
          cash += (p.entry + step - p.entry) * p.qty
          charge((p.entry + step) * p.qty)
          positions.delete(level)
        }
      for (const level of levels)
        if (
          !positions.has(level) &&
          bars[i].low <= level &&
          bars[i].high >= level &&
          i < bars.length - 1
        ) {
          const qty = (start * 0.03) / level
          positions.set(level, { entry: level, qty })
          charge(level * qty)
        }
      equity.push(
        cash + [...positions.values()].reduce((v, p) => v + (price[i] - p.entry) * p.qty, 0),
      )
    }
    for (const p of positions.values()) {
      cash += (price.at(-1)! * 0.9995 - p.entry) * p.qty
      charge(price.at(-1)! * p.qty)
    }
    note =
      'Long-only 1% grid, five fixed buy levels, 3% notional per level. New inventory cannot exit on the same bar. Falling trends can leave losing inventory.'
  } else if (kind === 'market-making') {
    let inventory = 0
    const size = (start * 0.01) / price[20]
    for (let i = 21; i < price.length; i++) {
      const prev = price[i - 1]
      const bid = prev * 0.999,
        ask = prev * 1.001
      // Synthetic adverse flow: the side facing the next price move is more likely to fill.
      if (price[i] < bid && inventory < 5 * size) {
        inventory += size
        cash -= bid * size
        charge(bid * size)
      }
      if (price[i] > ask && inventory > -5 * size) {
        inventory -= size
        cash += ask * size
        charge(ask * size)
      }
      equity.push(cash + inventory * price[i])
    }
    cash += inventory * price.at(-1)!
    if (inventory) charge(inventory * price.at(-1)!)
    note =
      'Synthetic bid/ask flow with bounded inventory and adverse selection. No real order book, queue priority, latency or exchange rebates; spread income is not guaranteed.'
  } else if (kind === 'arbitrage') {
    for (let i = 20; i < price.length; i++) {
      const gap = gaussian(rng) * 0.002
      const a = price[i],
        b = a * (1 + gap)
      const qty = (start * 0.02) / a
      if (Math.abs(gap) > 0.0016) {
        const secondLegFails = rng() < 0.08
        cash += secondLegFails ? -a * qty * 0.01 : Math.abs(a - b) * qty - a * qty * 0.001
        charge(a * qty)
        charge(b * qty)
      }
      equity.push(cash)
    }
    note =
      'Two synthetic venues; spread less both fees and 0.1% combined slippage. An illustrative 8% second-leg failure loses 1% of notional. This is an assumption, not measured exchange behavior.'
  } else if (kind === 'allocation') {
    trainBars = split
    const assets = [
      price,
      price.map((p, i) => p * (1 + Math.sin(i * 0.15) * 0.03)),
      price.map((p, i) => p * (1 + Math.sin(i * 0.09) * 0.06)),
    ]
    const vols = assets.map((a) => {
      const r = a.slice(1, split).map((p, i) => p / a[i] - 1)
      const m = r.reduce((x, y) => x + y, 0) / r.length
      return Math.sqrt(r.reduce((x, y) => x + (y - m) ** 2, 0) / r.length) || 0.0001
    })
    const total = vols.reduce((v, x) => v + 1 / x, 0)
    const weights = vols.map((v) => 1 / v / total)
    const qty = assets.map((a, j) => (start * weights[j]) / a[split])
    for (let j = 0; j < 3; j++) charge(start * weights[j])
    for (let i = split; i < price.length; i++)
      equity.push(start - fees + assets.reduce((v, a, j) => v + (a[i] - a[split]) * qty[j], 0))
    cash = equity.at(-1)!
    for (let j = 0; j < 3; j++) charge(assets[j].at(-1)! * qty[j])
    note = `Three synthetic correlated assets, inverse volatility estimated only on the first 60%, fixed weights ${weights.map((w) => (w * 100).toFixed(1) + '%').join('/')}. Covariance, rebalancing and real asset selection are omitted.`
  } else {
    trainBars = split
    const momentum = (i: number) => price[i] / price[i - 3] - 1
    const state = (i: number, position: number) =>
      `${momentum(i) > 0.003 ? 2 : momentum(i) < -0.003 ? 0 : 1}:${position + 1}`
    let predict: (i: number, pos: number) => number
    if (kind === 'regression') {
      const samples = Array.from({ length: split - 4 }, (_, j) => {
        const i = j + 3
        return { x: momentum(i), y: price[i + 1] / price[i] - 1 }
      })
      const mx = samples.reduce((v, s) => v + s.x, 0) / samples.length,
        my = samples.reduce((v, s) => v + s.y, 0) / samples.length
      const slope =
        samples.reduce((v, s) => v + (s.x - mx) * (s.y - my), 0) /
        (samples.reduce((v, s) => v + (s.x - mx) ** 2, 0) || 1)
      const intercept = my - slope * mx
      predict = (i) => {
        const forecast = intercept + slope * momentum(i)
        return forecast > 0.0016 ? 1 : forecast < -0.0016 ? -1 : 0
      }
      note = `Univariate OLS predicts next-bar return from three-bar momentum. Fit on first 60%, coefficients frozen. Slope ${slope.toFixed(3)}; not a trained institutional model.`
    } else {
      const q: Record<string, number[]> = {}
      const values = (key: string) => q[key] ?? (q[key] = [0, 0, 0])
      const best = (v: number[]) => v.indexOf(Math.max(...v))
      for (let epoch = 0; epoch < 60; epoch++) {
        let pos = 0
        for (let i = 3; i < split - 1; i++) {
          const key = state(i, pos)
          const vals = values(key)
          const action = rng() < 0.2 ? Math.floor(rng() * 3) : best(vals)
          const next = action - 1
          const reward = next * (price[i + 1] / price[i] - 1) - Math.abs(next - pos) * 0.0016
          const continuation = i === split - 2 ? 0 : Math.max(...values(state(i + 1, next)))
          vals[action] += 0.1 * (reward + 0.9 * continuation - vals[action])
          pos = next
        }
      }
      predict = (i, pos) => best(values(state(i, pos))) - 1
      note =
        'Tabular Q-learning: 9 momentum/position states, 3 actions, 60 train episodes with fixed seed, 60/40 chronological split, no updates during evaluation. Rewards charge turnover costs. This small synthetic environment is not FinRL training or a production policy.'
    }
    let pos = 0
    for (let i = split; i < price.length - 1; i++) {
      const next = predict(i, pos)
      const turnover = Math.abs(next - pos) * cash * 0.1
      if (turnover) charge(turnover)
      const slip = turnover * 0.001
      cash -= slip
      fees += slip
      cash += next * (price[i + 1] / price[i] - 1) * cash * 0.1
      pos = next
      equity.push(cash)
    }
    const turnover = Math.abs(pos) * cash * 0.1
    if (turnover) {
      charge(turnover)
      cash -= turnover * 0.001
      fees += turnover * 0.001
    }
  }
  equity.push(cash)
  let peak = start,
    drawdown = 0
  for (const v of equity) {
    peak = Math.max(peak, v)
    drawdown = Math.max(drawdown, ((peak - v) / peak) * 100)
  }
  return { equity, pnl: cash - start, fills, fees, drawdown, trainBars, note }
}
export function headlineSentiment(text: string): {
  score: number
  positive: string[]
  negative: string[]
} {
  const words: string[] = text.toLowerCase().match(/[a-z]+/g) ?? []
  const positive = ['beat', 'growth', 'upgrade', 'profit', 'win', 'improved'].filter((w) =>
    words.includes(w),
  )
  const negative = ['miss', 'loss', 'downgrade', 'fraud', 'inquiry', 'default'].filter((w) =>
    words.includes(w),
  )
  return { score: positive.length - negative.length, positive, negative }
}
