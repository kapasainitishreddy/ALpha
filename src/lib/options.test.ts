import { describe, expect, it } from 'vitest'
import { maxLoss, payoffCurve, priceOption, strikeLadder } from './options'

describe('priceOption', () => {
  it('prices a deep ITM call near its intrinsic value', () => {
    const q = priceOption(1000, 800, 'call', 30, 20)
    expect(q.intrinsic).toBeCloseTo(200, 0)
    expect(q.premium).toBeGreaterThan(200)
    expect(q.premium).toBeLessThan(230)
    expect(q.moneyness).toBe('ITM')
  })

  it('gives an OTM option no intrinsic value, only time value', () => {
    const q = priceOption(1000, 1100, 'call', 30, 20)
    expect(q.intrinsic).toBe(0)
    expect(q.timeValue).toBeCloseTo(q.premium, 5)
    expect(q.moneyness).toBe('OTM')
  })

  it('decays time value as expiry approaches', () => {
    const far = priceOption(1000, 1000, 'call', 60, 20)
    const near = priceOption(1000, 1000, 'call', 5, 20)
    expect(near.premium).toBeLessThan(far.premium)
  })

  it('raises the premium when volatility rises', () => {
    const calm = priceOption(1000, 1000, 'call', 30, 10)
    const wild = priceOption(1000, 1000, 'call', 30, 40)
    expect(wild.premium).toBeGreaterThan(calm.premium)
  })

  it('keeps call delta positive and put delta negative', () => {
    expect(priceOption(1000, 1000, 'call', 30, 20).delta).toBeGreaterThan(0)
    expect(priceOption(1000, 1000, 'put', 30, 20).delta).toBeLessThan(0)
  })

  it('puts breakeven above the strike for a call', () => {
    const q = priceOption(1000, 1000, 'call', 30, 20)
    expect(q.breakeven).toBeCloseTo(q.strike + q.premium, 5)
  })
})

describe('strikeLadder', () => {
  it('centres strikes on the money', () => {
    const l = strikeLadder(1000, 9)
    expect(l).toHaveLength(9)
    expect(l[4]).toBe(1000)
    expect(l[0]).toBeLessThan(l[8])
  })
})

describe('payoffCurve', () => {
  it('caps a long option loss at the premium paid', () => {
    const q = priceOption(1000, 1000, 'call', 30, 20)
    const curve = payoffCurve(q, 1, 100, 1000)
    const worst = Math.min(...curve.map((p) => p.pnl))
    expect(worst).toBeCloseTo(-maxLoss(q, 1, 100), 5)
  })

  it('turns profitable above breakeven for a call', () => {
    const q = priceOption(1000, 1000, 'call', 30, 20)
    const curve = payoffCurve(q, 1, 100, 1000)
    const above = curve.filter((p) => p.price > q.breakeven)
    expect(above.every((p) => p.pnl > 0)).toBe(true)
  })
})
