import { describe, expect, it } from 'vitest'
import { performanceMetrics } from './performanceMetrics'
import type { Trade } from '@/types'

function trade(id: string, pnl: number, closedAt: number): Trade {
  return {
    id,
    symbol: 'TEST',
    side: 'buy',
    qty: 1,
    entryPrice: 100,
    exitPrice: 100 + pnl,
    status: 'closed',
    openedAt: closedAt - 1,
    closedAt,
    fees: 0,
    realizedPnl: pnl,
    mode: 'manual',
  }
}

describe('performance metrics', () => {
  it('computes expectancy, win rate, profit factor and drawdown from closed trades', () => {
    const m = performanceMetrics([trade('a', 100, 1), trade('b', -50, 2), trade('c', 150, 3), trade('d', -100, 4)])
    expect(m.closedTrades).toBe(4)
    expect(m.winRatePct).toBe(50)
    expect(m.expectancy).toBe(25)
    expect(m.profitFactor).toBeCloseTo(250 / 150)
    expect(m.maxDrawdown).toBe(100)
  })

  it('ignores open and non-finite trades', () => {
    const open = { ...trade('open', 999, 1), status: 'open' as const }
    const invalid = { ...trade('bad', 10, 2), realizedPnl: Number.NaN }
    expect(performanceMetrics([open, invalid]).closedTrades).toBe(0)
  })

  it('handles all-winning history without reporting an infinite profit factor', () => {
    const m = performanceMetrics([trade('a', 10, 1), trade('b', 20, 2)])
    expect(m.profitFactor).toBeNull()
    expect(m.maxDrawdown).toBe(0)
  })
})
