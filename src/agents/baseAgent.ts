import type { AgentConfig, Candle, RiskContext, StrategySignal } from '@/types'
import { evaluateStrategy } from '@/engines/strategyEngine'
import { evaluateRisk } from '@/engines/riskGuardEngine'

// A strategy agent is config + strategy logic. One implementation, many configs, no per-strategy class needed.
// Each agent reads market data, applies its strategy, and MUST pass Risk Guard before trading.
export interface AgentDecision {
  signal: StrategySignal
  allowed: boolean
  reason: string
  qty: number
  value: number
}

export function agentDecide(
  config: AgentConfig,
  candles: Candle[],
  idx: number,
  ctx: Omit<RiskContext, 'tradeValue' | 'entry' | 'side' | 'stopLoss' | 'target' | 'strategyId' | 'agentAllocation'>,
): AgentDecision {
  const signal = evaluateStrategy(config.strategyId, candles, idx)
  if (signal.action === 'hold' || signal.confidence < 0.5) {
    return { signal, allowed: false, reason: 'No trade signal.', qty: 0, value: 0 }
  }
  const price = signal.entry
  // Position size MUST stay under RISK_LIMITS.maxTradeValueFraction (0.4) or the Risk Guard
  // blocks every agent trade and the swarm never does anything. 0.3 leaves rounding margin.
  const qty = Math.max(1, Math.floor((config.allocation * 0.3) / price))
  const value = qty * price
  const risk = evaluateRisk({
    ...ctx,
    tradeValue: value,
    entry: price,
    side: signal.action,
    stopLoss: signal.stopLoss,
    target: signal.target,
    strategyId: config.strategyId,
    agentAllocation: config.allocation,
  })
  return { signal, allowed: risk.allow, reason: risk.reason, qty, value }
}
