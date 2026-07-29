import type { AgentConfig, RiskLevel } from '@/types'
import { RISK_LEVEL_WEIGHT, RISK_LIMITS } from '@/data/riskRules'

export interface AgentSpec {
  id: string
  name: string
  strategyId: string
  riskLevel: RiskLevel
}

// Divide mock capital across agents by risk-weighted allocation.
// Invariants: keep a cash reserve, never put more than maxSingleAgentFraction into one agent.
export function allocate(capital: number, specs: AgentSpec[]): { agents: AgentConfig[]; cashReserve: number } {
  const reserve = capital * RISK_LIMITS.minCashReserveFraction
  const investable = capital - reserve

  const weights = specs.map((s) => RISK_LEVEL_WEIGHT[s.riskLevel])
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1

  const cap = capital * RISK_LIMITS.maxSingleAgentFraction
  let agents: AgentConfig[] = specs.map((s, i) => {
    const raw = (weights[i] / totalWeight) * investable
    const allocation = Math.min(raw, cap)
    return {
      id: s.id,
      name: s.name,
      strategyId: s.strategyId,
      allocation,
      maxTrades: 4,
      maxLoss: allocation * 0.3,
      riskLevel: s.riskLevel,
    }
  })

  // Any capital clipped by the per-agent cap returns to the cash reserve (never over-concentrate).
  const used = agents.reduce((s, a) => s + a.allocation, 0)
  const cashReserve = capital - used

  return { agents, cashReserve }
}

// After a losing session an agent's next-round allocation is trimmed (de-risk, never martingale).
export function derisk(config: AgentConfig, lastPnl: number): AgentConfig {
  if (lastPnl >= 0) return config
  return { ...config, allocation: config.allocation * 0.7, maxLoss: config.maxLoss * 0.7 }
}
