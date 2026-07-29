import { describe, expect, it } from 'vitest'
import { runSwarm } from './strategySwarmEngine'
import { allocate } from './portfolioAllocator'
import { DEFAULT_SWARM } from '@/agents/registry'
import { RISK_LIMITS } from '@/data/riskRules'

describe('portfolioAllocator', () => {
  it('keeps a cash reserve and never over-concentrates one agent', () => {
    const { agents, cashReserve } = allocate(100, DEFAULT_SWARM)
    expect(cashReserve).toBeGreaterThan(0)
    for (const a of agents) {
      expect(a.allocation).toBeLessThanOrEqual(100 * RISK_LIMITS.maxSingleAgentFraction + 0.001)
    }
    const total = agents.reduce((s, a) => s + a.allocation, 0) + cashReserve
    expect(total).toBeCloseTo(100, 5)
  })
})

describe('strategySwarmEngine', () => {
  it('runs deterministically and conserves capital accounting', () => {
    const a = runSwarm({ capital: 100, symbol: 'NIFTY50', eventId: 'normal-trend', specs: DEFAULT_SWARM })
    const b = runSwarm({ capital: 100, symbol: 'NIFTY50', eventId: 'normal-trend', specs: DEFAULT_SWARM })
    expect(a.totalPnl).toBeCloseTo(b.totalPnl, 6)
    expect(a.endingCapital).toBeCloseTo(a.startingCapital + a.totalPnl, 6)
    expect(a.agents.length).toBe(DEFAULT_SWARM.length)
  })

  it('pauses new entries in a panic market (risk manager veto)', () => {
    const r = runSwarm({ capital: 100, symbol: 'NIFTY50', eventId: 'panic-selloff', specs: DEFAULT_SWARM })
    const opened = r.agents.reduce((s, a) => s + a.trades.length, 0)
    expect(opened).toBe(0)
    expect(r.stoppedReason).toContain('Panic')
  })
})
