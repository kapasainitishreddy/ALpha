import { describe, expect, it } from 'vitest'
import { evaluateRisk } from './riskGuardEngine'
import type { RiskContext } from '@/types'

const base: RiskContext = {
  mode: 'manual',
  balance: 1000,
  tradeValue: 100,
  entry: 100,
  side: 'buy',
  stopLoss: 98,
  target: 104,
  consecutiveLosses: 0,
  dailyPnl: 0,
  tradesToday: 0,
}

describe('riskGuardEngine', () => {
  it('allows a well-formed trade', () => {
    expect(evaluateRisk(base).allow).toBe(true)
  })

  it('blocks trades with no stop loss', () => {
    expect(evaluateRisk({ ...base, stopLoss: undefined }).allow).toBe(false)
  })

  it('blocks full-balance trades', () => {
    expect(evaluateRisk({ ...base, tradeValue: 900 }).allow).toBe(false)
  })

  it('blocks after daily loss limit', () => {
    expect(evaluateRisk({ ...base, dailyPnl: -150 }).allow).toBe(false)
  })

  it('stops after target reached', () => {
    expect(evaluateRisk({ ...base, dailyPnl: 250 }).allow).toBe(false)
  })

  it('blocks after too many consecutive losses in father mode', () => {
    expect(evaluateRisk({ ...base, mode: 'father', consecutiveLosses: 2 }).allow).toBe(false)
  })

  it('blocks poor risk/reward', () => {
    expect(evaluateRisk({ ...base, target: 100.5 }).allow).toBe(false)
  })

  it('never allows real auto trading', () => {
    expect(evaluateRisk({ ...base, isRealAuto: true }).allow).toBe(false)
  })

  it('is stricter on trade size in father mode', () => {
    const big = { ...base, tradeValue: 300 } // 30%, ok for manual, too big for father (15%)
    expect(evaluateRisk({ ...big, mode: 'manual' }).allow).toBe(true)
    expect(evaluateRisk({ ...big, mode: 'father' }).allow).toBe(false)
  })
})
