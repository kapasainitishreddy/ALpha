import { describe, expect, it } from 'vitest'
import { equityCurves, leaderboard, replayTrade, strategyFitness } from './insights'
import type { JournalEntry, Trade } from '@/types'

const trade = (over: Partial<Trade> = {}): Trade => ({
  id: Math.random().toString(36),
  symbol: 'INFY',
  side: 'buy',
  qty: 10,
  entryPrice: 100,
  stopLoss: 98,
  target: 104,
  exitPrice: 104,
  status: 'closed',
  openedAt: 1,
  closedAt: 2,
  fees: 0,
  realizedPnl: 40,
  mode: 'manual',
  ...over,
})

describe('strategyFitness', () => {
  it('ignores trades with no strategy tag', () => {
    expect(strategyFitness([trade()])).toHaveLength(0)
  })

  it('ranks a profitable strategy above a losing one', () => {
    const winners = Array.from({ length: 20 }, () => trade({ strategyTag: 'good', realizedPnl: 40 }))
    const losers = Array.from({ length: 20 }, () => trade({ strategyTag: 'bad', realizedPnl: -40 }))
    const [first, second] = strategyFitness([...winners, ...losers])
    expect(first.strategyId).toBe('good')
    expect(first.score).toBeGreaterThan(second.score)
  })

  it('damps the score toward neutral on a tiny sample', () => {
    const few = strategyFitness([trade({ strategyTag: 'x', realizedPnl: 500 })])[0]
    const many = strategyFitness(Array.from({ length: 20 }, () => trade({ strategyTag: 'x', realizedPnl: 500 })))[0]
    // Same per-trade result, but 1 trade must not score as confidently as 20.
    expect(few.score).toBeLessThan(many.score)
    expect(few.verdict).toMatch(/too few/i)
  })
})

describe('equityCurves', () => {
  it('accumulates P&L per mode in close order', () => {
    const curves = equityCurves([
      trade({ mode: 'manual', realizedPnl: 100, closedAt: 1 }),
      trade({ mode: 'manual', realizedPnl: -30, closedAt: 2 }),
      trade({ mode: 'swarm', realizedPnl: 10, closedAt: 3 }),
    ])
    const manual = curves.find((c) => c.mode === 'manual')!
    expect(manual.points).toEqual([0, 100, 70])
    expect(manual.final).toBe(70)
  })

  it('ignores open trades', () => {
    expect(equityCurves([trade({ status: 'open', realizedPnl: undefined })])).toHaveLength(0)
  })
})

describe('replayTrade', () => {
  it('calls out a missing stop loss as the real mistake, not the loss', () => {
    const steps = replayTrade(trade({ stopLoss: undefined, realizedPnl: -200, exitPrice: 80 }))
    expect(steps.some((s) => s.tone === 'bad' && /no stop loss/i.test(s.detail))).toBe(true)
    expect(steps[steps.length - 1].detail).toMatch(/not the mistake/i)
  })

  it('warns when a profitable trade had no stop', () => {
    const steps = replayTrade(trade({ stopLoss: undefined, realizedPnl: 200 }))
    expect(steps[steps.length - 1].detail).toMatch(/wrong lesson/i)
  })

  it('treats a stopped-out planned loss as acceptable', () => {
    const steps = replayTrade(trade({ realizedPnl: -20, exitPrice: 98 }))
    expect(steps[steps.length - 1].detail).toMatch(/cost of doing business/i)
  })
})

describe('leaderboard', () => {
  it('ranks by return percent, not raw rupees', () => {
    const j = (id: string, pnl: number, start: number): JournalEntry => ({
      id, mode: 'manual', createdAt: 1, startBalance: start, endBalance: start + pnl, pnl,
      tradeCount: 1, strategiesUsed: [], bestTradePnl: pnl, worstTradePnl: pnl,
      mistakes: [], wentWell: [], couldImprove: [], followedRules: true, tomorrowLesson: '',
    })
    // Big account made more rupees; small account made a better return and should win.
    const rows = leaderboard([j('big', 1000, 1_000_000), j('small', 500, 1000)])
    expect(rows[0].entry.id).toBe('small')
    expect(rows[0].rank).toBe(1)
  })
})
