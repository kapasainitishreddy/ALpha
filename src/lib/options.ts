// A deliberately simplified option chain. Real pricing needs Black-Scholes with a live
// volatility surface; this uses a normal-approximation BS with one flat IV input.
// ponytail: close enough to teach how strikes, expiry and IV move a premium — explicitly
// NOT close enough to price a real option, and the UI says so.

export type OptType = 'call' | 'put'

export interface OptionQuote {
  strike: number
  type: OptType
  premium: number
  intrinsic: number
  timeValue: number
  delta: number
  moneyness: 'ITM' | 'ATM' | 'OTM'
  breakeven: number
}

// Abramowitz-Stegun normal CDF — a few lines, no dependency, plenty accurate here.
function normCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const d = 0.3989423 * Math.exp((-x * x) / 2)
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
  return x > 0 ? 1 - p : p
}

export function priceOption(spot: number, strike: number, type: OptType, daysToExpiry: number, ivPct: number, ratePct = 6.5): OptionQuote {
  const T = Math.max(daysToExpiry, 0.5) / 365
  const iv = Math.max(ivPct, 1) / 100
  const r = ratePct / 100

  const d1 = (Math.log(spot / strike) + (r + (iv * iv) / 2) * T) / (iv * Math.sqrt(T))
  const d2 = d1 - iv * Math.sqrt(T)
  const disc = Math.exp(-r * T)

  const call = spot * normCdf(d1) - strike * disc * normCdf(d2)
  const put = strike * disc * normCdf(-d2) - spot * normCdf(-d1)
  const premium = Math.max(0.05, type === 'call' ? call : put)

  const intrinsic = Math.max(0, type === 'call' ? spot - strike : strike - spot)
  const delta = type === 'call' ? normCdf(d1) : normCdf(d1) - 1
  const gap = Math.abs(spot - strike) / spot

  return {
    strike,
    type,
    premium,
    intrinsic,
    timeValue: Math.max(0, premium - intrinsic),
    delta,
    moneyness: gap < 0.005 ? 'ATM' : intrinsic > 0 ? 'ITM' : 'OTM',
    breakeven: type === 'call' ? strike + premium : strike - premium,
  }
}

// Strikes around spot, rounded to a sensible step for the instrument's price level.
export function strikeLadder(spot: number, count = 9): number[] {
  const step = spot > 20000 ? 100 : spot > 5000 ? 50 : spot > 1000 ? 20 : spot > 200 ? 10 : 5
  const atm = Math.round(spot / step) * step
  const half = Math.floor(count / 2)
  return Array.from({ length: count }, (_, i) => atm + (i - half) * step)
}

export interface Payoff {
  price: number
  pnl: number
}

// Payoff at expiry for one long option position — the picture that makes options click.
export function payoffCurve(q: OptionQuote, lots: number, lotSize: number, spot: number): Payoff[] {
  const lo = spot * 0.85
  const hi = spot * 1.15
  const steps = 40
  return Array.from({ length: steps + 1 }, (_, i) => {
    const price = lo + ((hi - lo) * i) / steps
    const intrinsic = Math.max(0, q.type === 'call' ? price - q.strike : q.strike - price)
    return { price, pnl: (intrinsic - q.premium) * lots * lotSize }
  })
}

export function maxLoss(q: OptionQuote, lots: number, lotSize: number): number {
  // Buying an option: the premium is the entire downside. That bounded risk is the one
  // genuinely beginner-friendly property options have, and the reason we only model longs.
  return q.premium * lots * lotSize
}
