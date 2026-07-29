import { describe, expect, it } from 'vitest'
import { runBacktest } from './backtestEngine'

describe('backtestEngine', () => {
  it('is deterministic for the same inputs', () => {
    const a = runBacktest('ema-trend', 'NIFTY50', 'normal-trend')
    const b = runBacktest('ema-trend', 'NIFTY50', 'normal-trend')
    expect(a.endBalance).toBe(b.endBalance)
    expect(a.trades).toBe(b.trades)
  })

  it('produces a coherent result shape', () => {
    const r = runBacktest('breakout-volume', 'BANKNIFTY', 'real-breakout')
    expect(r.trades).toBe(r.wins + r.losses)
    expect(r.winRatePct).toBeGreaterThanOrEqual(0)
    expect(r.winRatePct).toBeLessThanOrEqual(100)
    expect(r.equityCurve.length).toBeGreaterThan(0)
    expect(r.aiExplanation).toContain('Backtests do not guarantee')
  })

  it('never loses more than the account (sane bounds)', () => {
    const r = runBacktest('mean-reversion', 'RELIANCE', 'panic-selloff', 10000)
    expect(r.endBalance).toBeGreaterThan(0)
  })
})
