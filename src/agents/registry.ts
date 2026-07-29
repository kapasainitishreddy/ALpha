import type { RiskLevel } from '@/types'
import type { AgentSpec } from '@/engines/portfolioAllocator'

// The swarm's strategy agents. Homogeneous agents = data, not 18 duplicated classes (see baseAgent.ts).
// Distinct-role agents (portfolio manager, risk manager, debate, father coach) are their own modules.
const riskByStrategy: Record<string, RiskLevel> = {
  'rsi-bounce': 'low',
  'ema-trend': 'low',
  'ma-crossover': 'low',
  'support-resistance': 'low',
  'mean-reversion': 'medium',
  'vwap-reclaim': 'medium',
  'breakout-volume': 'medium',
  'opening-range-breakout': 'medium',
  momentum: 'high',
  'volatility-breakout': 'high',
  'news-sentiment': 'medium',
}

export const SWARM_AGENTS: AgentSpec[] = Object.entries(riskByStrategy).map(([strategyId, riskLevel]) => ({
  id: `${strategyId}-agent`,
  name: agentName(strategyId),
  strategyId,
  riskLevel,
}))

function agentName(strategyId: string): string {
  return strategyId
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ') + ' Agent'
}

// Default swarm = a diversified subset (the spec's ₹100 example: RSI, breakout, trend, mean-reversion, news).
export const DEFAULT_SWARM: AgentSpec[] = SWARM_AGENTS.filter((a) =>
  ['rsi-bounce-agent', 'breakout-volume-agent', 'ema-trend-agent', 'mean-reversion-agent', 'news-sentiment-agent'].includes(a.id),
)
