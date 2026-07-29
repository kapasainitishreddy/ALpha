import { describe, expect, it } from 'vitest'
import { buildJournal } from './journalEngine'
import { detectMistakes } from './mistakeDetectorEngine'
import type { Trade } from '@/types'

function trade(over: Partial<Trade>): Trade {
  return {
    id: 't1', symbol: 'NIFTY50', side: 'buy', qty: 1, entryPrice: 100,
    stopLoss: 98, target: 104, status: 'closed', openedAt: 0, closedAt: 1,
    fees: 0.1, realizedPnl: 5, mode: 'manual', ...over,
  }
}

describe('mistakeDetectorEngine', () => {
  it('flags a missing stop loss', () => {
    const m = detectMistakes([trade({ stopLoss: undefined })], 'manual', 10000)
    expect(m.some((x) => x.code === 'no-stop-loss')).toBe(true)
  })

  it('flags overtrading', () => {
    const many = Array.from({ length: 12 }, (_, i) => trade({ id: `t${i}` }))
    expect(detectMistakes(many, 'manual', 10000).some((x) => x.code === 'overtrading')).toBe(true)
  })

  it('clean disciplined trades produce no mistakes', () => {
    expect(detectMistakes([trade({})], 'manual', 10000)).toHaveLength(0)
  })
})

describe('journalEngine', () => {
  it('builds a journal and marks rule-following for clean trades', () => {
    const j = buildJournal('manual', [trade({})], 10000, 10005)
    expect(j.pnl).toBe(5)
    expect(j.followedRules).toBe(true)
    expect(j.tradeCount).toBe(1)
  })

  it('marks rule-breaking when a stop loss is missing', () => {
    const j = buildJournal('manual', [trade({ stopLoss: undefined, realizedPnl: -20 })], 10000, 9980)
    expect(j.followedRules).toBe(false)
    expect(j.mistakes.length).toBeGreaterThan(0)
  })
})
