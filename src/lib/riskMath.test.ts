import { describe, expect, it } from 'vitest'
import { positionSize, rewardRisk, riskOfRuin, stopLossFor } from './riskMath'

describe('positionSize', () => {
  it('sizes so a stop-out loses exactly the risk budget', () => {
    // ₹100k, risk 1% = ₹1000. Stop is ₹10 away -> 100 shares (₹10k = 10% of capital,
    // comfortably inside the concentration cap, so the risk budget is what binds).
    const r = positionSize({ capital: 100_000, entry: 100, stopLoss: 90, riskPct: 1 })
    expect(r.valid).toBe(true)
    expect(r.qty).toBe(100)
    expect(r.totalRisk).toBeCloseTo(1000)
  })

  it('refuses to size without a stop loss', () => {
    const r = positionSize({ capital: 100_000, entry: 1000, stopLoss: 0, riskPct: 1 })
    expect(r.valid).toBe(false)
    expect(r.problem).toMatch(/stop loss/i)
  })

  it('explains when the stop is too wide to afford even one share', () => {
    const r = positionSize({ capital: 100_000, entry: 5000, stopLoss: 4000, riskPct: 0.5 })
    expect(r.valid).toBe(false)
    expect(r.qty).toBe(0)
    expect(r.problem).toMatch(/stop/i)
  })

  it('never returns a size the Risk Guard would block on concentration', () => {
    // SOL at ₹7,291 against ₹10,000: the risk budget allows 1 share, but 1 share is 73%
    // of the account — over the 40% cap. Suggesting it would hand the user a rejected order.
    const r = positionSize({ capital: 10_000, entry: 7291, stopLoss: 7218, riskPct: 1 })
    expect(r.valid).toBe(false)
    expect(r.problem).toMatch(/too big|over 40/i)
  })

  it('caps by concentration and says so when risk alone would allow more', () => {
    // Tight 0.1% stop -> risk budget allows a huge qty; the 40% cap must bind instead.
    const r = positionSize({ capital: 100_000, entry: 100, stopLoss: 99.9, riskPct: 5 })
    expect(r.valid).toBe(true)
    expect(r.positionValue).toBeLessThanOrEqual(100_000 * 0.4 + 100)
    expect(r.problem).toMatch(/position limit/i)
  })
})

describe('stopLossFor', () => {
  it('is the inverse of positionSize', () => {
    const sl = stopLossFor(100_000, 100, 100, 1)
    expect(sl).toBeCloseTo(90)
    expect(positionSize({ capital: 100_000, entry: 100, stopLoss: sl, riskPct: 1 }).qty).toBe(100)
  })

  it('puts the stop above entry when shorting', () => {
    expect(stopLossFor(100_000, 1000, 100, 1, 'sell')).toBeCloseTo(1010)
  })
})

describe('rewardRisk', () => {
  it('flags a 1:2 setup as good', () => {
    expect(rewardRisk(100, 95, 110).verdict).toBe('good')
  })

  it('flags risking more than the reward as poor', () => {
    const r = rewardRisk(100, 90, 105)
    expect(r.verdict).toBe('poor')
    expect(r.ratio).toBeCloseTo(0.5)
  })
})

describe('riskOfRuin', () => {
  it('reports negative expectancy for a losing system', () => {
    expect(riskOfRuin(30, 2, 1).expectancy).toBeLessThan(0)
  })

  it('ruins a losing system far more often than a winning one', () => {
    expect(riskOfRuin(30, 5, 1).ruinPct).toBeGreaterThan(riskOfRuin(60, 5, 1).ruinPct)
  })

  it('rises as risk per trade rises, holding the edge fixed', () => {
    expect(riskOfRuin(45, 25, 1).ruinPct).toBeGreaterThan(riskOfRuin(45, 1, 1).ruinPct)
  })

  it('is deterministic for the same inputs', () => {
    expect(riskOfRuin(55, 3, 1.5)).toEqual(riskOfRuin(55, 3, 1.5))
  })
})
