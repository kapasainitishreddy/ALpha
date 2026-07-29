import { describe, expect, it } from 'vitest'
import { explainAgent, explainSwarm } from './explainSwarm'
import { getEvent } from '@/data/marketEvents'
import type { AgentResult, SwarmResult, Trade } from '@/types'

const event = getEvent('normal-trend') // ideal: ema-trend, dangerous: mean-reversion

const trade = (pnl: number): Trade => ({
  id: 't', symbol: 'INFY', side: 'buy', qty: 1, entryPrice: 100, status: 'closed',
  openedAt: 1, closedAt: 2, fees: 0, realizedPnl: pnl, mode: 'swarm',
})

const agent = (over: Partial<AgentResult> & { strategyId?: string } = {}): AgentResult => {
  const { strategyId = 'rsi-bounce', ...rest } = over
  return {
    config: { id: `${strategyId}-agent`, name: 'Test Agent', strategyId, allocation: 10000, maxTrades: 4, maxLoss: 3000, riskLevel: 'low' },
    trades: [], pnl: 0, wins: 0, losses: 0, blockedTrades: 0, ending: 10000, note: '',
    ...rest,
  }
}

describe('explainAgent', () => {
  it('says "lost the least" instead of "best" when everything lost money', () => {
    const a = agent({ trades: [trade(-10)], losses: 1, pnl: -10 })
    const e = explainAgent(a, event, true, false, true)
    expect(e.headline).toMatch(/lost the least/i)
    expect(e.headline).not.toMatch(/made the most/i)
  })

  it('says "made the most" when the swarm was profitable', () => {
    const a = agent({ trades: [trade(50)], wins: 1, pnl: 50 })
    expect(explainAgent(a, event, true, false, false).headline).toMatch(/made the most/i)
  })

  it('explains a total wipeout as stops being too tight, not a broken strategy', () => {
    const a = agent({ trades: [trade(-5), trade(-5), trade(-5)], losses: 3, pnl: -15 })
    expect(explainAgent(a, event, false, true, true).why).toMatch(/stop loss.*too close|too close/i)
  })

  it('distinguishes a blocked agent from one that simply had no setup', () => {
    expect(explainAgent(agent({ blockedTrades: 3 }), event, false, false, false).headline).toMatch(/blocked/i)
    expect(explainAgent(agent(), event, false, false, false).headline).toMatch(/never saw a setup/i)
  })

  it('flags whether the strategy suited this market', () => {
    expect(explainAgent(agent({ strategyId: 'ema-trend' }), event, false, false, false).suited).toBe('ideal')
    expect(explainAgent(agent({ strategyId: 'mean-reversion' }), event, false, false, false).suited).toBe('dangerous')
    expect(explainAgent(agent({ strategyId: 'momentum' }), event, false, false, false).suited).toBe('neutral')
  })
})

const swarm = (agents: AgentResult[], over: Partial<SwarmResult> = {}): SwarmResult => ({
  startingCapital: 50000,
  cashReserve: 5000,
  agents,
  totalPnl: agents.reduce((s, a) => s + a.pnl, 0),
  endingCapital: 50000,
  fatherSummary: '',
  ...over,
})

describe('explainSwarm', () => {
  it('explains a no-trade run as a capital or blocking problem, with a fix', () => {
    const e = explainSwarm(swarm([agent({ blockedTrades: 4 })]), event)
    expect(e.verdict).toMatch(/nobody traded/i)
    expect(e.detail).toMatch(/blocked/i)
    expect(e.lesson).toMatch(/50,000|more capital/i)
  })

  it('normalises an all-lost run instead of implying the strategies are broken', () => {
    const e = explainSwarm(swarm([
      agent({ trades: [trade(-20)], losses: 1, pnl: -20 }),
      agent({ strategyId: 'ema-trend', trades: [trade(-10)], losses: 1, pnl: -10 }),
    ]), event)
    expect(e.verdict).toMatch(/lost/i)
    expect(e.detail).toMatch(/normal and useful/i)
    expect(e.lesson).toMatch(/sitting out|should I have traded/i)
  })

  it('points out when the textbook-fit strategy still lost', () => {
    const e = explainSwarm(swarm([
      agent({ strategyId: 'ema-trend', trades: [trade(-10)], losses: 1, pnl: -10 }),
    ]), event)
    expect(e.bullets.join(' ')).toMatch(/still lost|does not guarantee/i)
  })

  it('warns about overconfidence when everything wins', () => {
    const e = explainSwarm(swarm([
      agent({ trades: [trade(100)], wins: 1, pnl: 100 }),
      agent({ strategyId: 'ema-trend', trades: [trade(80)], wins: 1, pnl: 80 }),
    ]), event)
    expect(e.detail).toMatch(/overconfidence/i)
  })
})
