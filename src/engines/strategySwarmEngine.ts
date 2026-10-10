import { localId } from '@/lib/id'
import { useStore } from '@/store/useStore'
import { accountRisk, reservedCapital, exitReference } from './paperExecution'
import { evaluateRisk } from './riskGuardEngine'
import type { AgentResult, RiskLevel, SwarmResult, Trade } from '@/types'
import { generateSession } from './mockMarketEngine'
import { agentDecide } from '@/agents/baseAgent'
import { allocate, AgentSpec } from './portfolioAllocator'
import { closeTrade, feeFor, fillPrice } from './tradeEngine'
import { fatherCoachSummary, portfolioManagerReview, riskManagerVeto } from '@/agents/managerAgents'
import { RISK_LIMITS } from '@/data/riskRules'

export interface SwarmOptions {
  capital: number
  symbol: string
  eventId: string
  specs: AgentSpec[]
  riskLevel?: RiskLevel
  candleCount?: number
  commitToAccount?: boolean
}

// Runs the whole swarm (mock only): allocate -> loop candles -> each agent decides -> Risk Guard filters ->
// mock fills -> per-agent P&L -> Portfolio Manager review + Father Coach summary. Stops on daily loss/target.
export function runSwarm(opts: SwarmOptions): SwarmResult {
  const { symbol, eventId, specs, candleCount = 120 } = opts
  const capital = opts.commitToAccount ? Math.min(opts.capital, Math.max(0, useStore.getState().balance - reservedCapital())) : opts.capital
  const runId = opts.commitToAccount ? `swarm:${localId()}` : 'swarm'
  const settle = (t: Trade) => { if (opts.commitToAccount) useStore.getState().settleTrade(t) }

  const { agents: configs, cashReserve } = allocate(capital, specs)
  const session = generateSession(symbol, eventId, candleCount)
  const { candles } = session
  const veto = riskManagerVeto(session.event.mood)

  const results: AgentResult[] = configs.map((config) => ({
    config,
    trades: [],
    pnl: 0,
    wins: 0,
    losses: 0,
    blockedTrades: 0,
    ending: config.allocation,
    note: '',
  }))
  const open: Record<string, Trade | null> = {}

  let dailyPnl = 0
  let stoppedReason: string | undefined
  const dailyLossCap = RISK_LIMITS.dailyLossFraction * capital
  const targetCap = RISK_LIMITS.targetProfitFraction * capital

  let lastIdx = 20
  for (let i = 20; i < candles.length; i++) {
    lastIdx = i
    if (dailyPnl <= -dailyLossCap) { stoppedReason = 'Daily loss limit reached, swarm stopped.'; break }
    if (dailyPnl >= targetCap) { stoppedReason = 'Daily target reached, swarm stopped.'; break }
    const price = candles[i].close

    results.forEach((res) => {
      // Manage open position for this agent.
      const cur = open[res.config.id]
      if (cur) {
        const ref = exitReference(cur, candles[i])
        if (ref !== null) {
          const closed = closeTrade(cur, ref)
          settle(closed)
          const pnl = closed.realizedPnl ?? 0
          res.pnl += pnl
          res.ending += pnl
          dailyPnl += pnl
          pnl > 0 ? res.wins++ : res.losses++
          res.trades.push(closed)
          open[res.config.id] = null
        }
        return
      }
      if (veto.veto) return
      if (res.trades.length >= res.config.maxTrades) return

      const decision = agentDecide(res.config, candles, i, {
        mode: 'swarm',
        balance: res.config.allocation,
        consecutiveLosses: res.losses,
        dailyPnl: res.pnl,
        tradesToday: res.trades.length,
      }, symbol.endsWith('USDT'))
      const side = decision.signal.action
      if (!decision.allowed || side === 'hold') {
        if (side !== 'hold') res.blockedTrades++
        return
      }
      const entry = fillPrice(decision.signal.entry, side)
      if (opts.commitToAccount) {
        const global = evaluateRisk({ ...accountRisk('swarm'), entry, tradeValue: entry * decision.qty, side,
          stopLoss: decision.signal.stopLoss, target: decision.signal.target, agentAllocation: res.config.allocation })
        if (!global.allow) { res.blockedTrades++; return }
      }

      open[res.config.id] = {
        id: `${runId}-${res.config.id}-${i}`,
        symbol,
        side,
        qty: decision.qty,
        entryPrice: entry,
        stopLoss: decision.signal.stopLoss,
        target: decision.signal.target,
        status: 'open',
        openedAt: opts.commitToAccount ? Date.now() : i,
        sessionId: runId,
        fees: feeFor(entry * decision.qty),
        strategyTag: res.config.strategyId,
        agentId: res.config.id,
        mode: 'swarm',
      }
      if (opts.commitToAccount) useStore.getState().addTrade(open[res.config.id]!)
    })
  }

  // Close dangling positions at last price.
  const last = candles[lastIdx].close
  results.forEach((res) => {
    const cur = open[res.config.id]
    if (cur) {
      const closed = closeTrade(cur, last)
      settle(closed)
      const pnl = closed.realizedPnl ?? 0
      res.pnl += pnl
      res.ending += pnl
      dailyPnl += pnl
      pnl > 0 ? res.wins++ : res.losses++
      res.trades.push(closed)
    }
    res.note = res.trades.length
      ? `${res.trades.length} trades, ${res.wins}W/${res.losses}L, ${res.blockedTrades} blocked by Risk Guard.`
      : `No trades, no valid signal or Risk Guard blocked all.`
  })

  const review = portfolioManagerReview(results)
  const totalPnl = results.reduce((s, r) => s + r.pnl, 0)
  const blocked = results.reduce((s, r) => s + r.blockedTrades, 0)
  const tradeCount = results.reduce((s, r) => s + r.trades.length, 0)

  return {
    startingCapital: capital,
    cashReserve,
    agents: results,
    totalPnl,
    endingCapital: capital + totalPnl,
    bestAgentId: review.bestId,
    worstAgentId: review.worstId,
    stoppedReason: stoppedReason ?? (veto.veto ? veto.reason : undefined),
    fatherSummary: `${review.note} ${fatherCoachSummary(totalPnl, tradeCount, blocked)}`,
  }
}
