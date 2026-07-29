import { describe as group, expect, it } from 'vitest'
import { describe, evaluateCustom, type CustomStrategy } from './customStrategy'
import type { Candle } from '@/types'

// Straight uptrend: every close higher than the last, steady volume.
function rising(n = 60): Candle[] {
  return Array.from({ length: n }, (_, i) => {
    const close = 100 + i
    return { time: i, open: close - 0.5, high: close + 0.5, low: close - 1, close, volume: 1000 }
  })
}

const strat = (over: Partial<CustomStrategy> = {}): CustomStrategy => ({
  id: 'c1', name: 'Test', side: 'buy', rules: [], stopPct: 1, targetPct: 2, ...over,
})

group('evaluateCustom', () => {
  it('holds when a strategy has no rules', () => {
    const s = evaluateCustom(strat(), rising(), 40)
    expect(s.action).toBe('hold')
    expect(s.reason).toMatch(/no rules/i)
  })

  it('fires when every rule passes', () => {
    // In a steady uptrend price sits above its EMA(20) and 3-bar change is positive.
    const s = evaluateCustom(
      strat({ rules: [{ indicator: 'priceVsEma20', op: '>', value: 0 }, { indicator: 'change3', op: '>', value: 0 }] }),
      rising(), 40,
    )
    expect(s.action).toBe('buy')
    expect(s.confidence).toBeGreaterThan(0.5)
  })

  it('holds if any single rule fails, and names the one that blocked it', () => {
    const s = evaluateCustom(
      strat({ rules: [
        { indicator: 'priceVsEma20', op: '>', value: 0 },   // passes
        { indicator: 'rsi', op: '<', value: 20 },            // fails in an uptrend
      ] }),
      rising(), 40,
    )
    expect(s.action).toBe('hold')
    expect(s.reason).toMatch(/RSI/i)
  })

  it('places stop below and target above entry for a long', () => {
    const s = evaluateCustom(
      strat({ rules: [{ indicator: 'change3', op: '>', value: 0 }], stopPct: 2, targetPct: 5 }),
      rising(), 40,
    )
    expect(s.stopLoss).toBeLessThan(s.entry)
    expect(s.target).toBeGreaterThan(s.entry)
  })

  it('flips stop and target for a short', () => {
    const s = evaluateCustom(
      strat({ side: 'sell', rules: [{ indicator: 'change3', op: '>', value: 0 }] }),
      rising(), 40,
    )
    expect(s.action).toBe('sell')
    expect(s.stopLoss).toBeGreaterThan(s.entry)
    expect(s.target).toBeLessThan(s.entry)
  })

  it('holds before there is enough history', () => {
    expect(evaluateCustom(strat({ rules: [{ indicator: 'change3', op: '>', value: 0 }] }), rising(), 5).action).toBe('hold')
  })
})

group('describe', () => {
  it('reads as a plain English sentence', () => {
    const text = describe(strat({ rules: [
      { indicator: 'rsi', op: '<', value: 30 },
      { indicator: 'volumeVsAvg', op: '>', value: 1.5 },
    ] }))
    expect(text).toMatch(/Buy when RSI is below 30 and volume is over 1.5/)
    expect(text).toMatch(/Exit at 1% loss or 2% profit/)
  })
})
