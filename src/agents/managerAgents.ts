import type { AgentResult, Candle, MarketMood, StrategySignal } from '@/types'
import { getStrategyDoc } from '@/data/strategyDocs'

// Distinct-role agents. Each has a single clear job (unlike the homogeneous strategy agents).

// Portfolio Manager: judges the swarm outcome and picks best/worst; enforces "no all-in" via the allocator.
export function portfolioManagerReview(agents: AgentResult[]): {
  bestId?: string
  worstId?: string
  note: string
} {
  if (!agents.length) return { note: 'No agents ran.' }
  const sorted = [...agents].sort((a, b) => b.pnl - a.pnl)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]
  return {
    bestId: best.config.id,
    worstId: worst.config.id,
    note: `${best.config.name} performed best (${best.pnl >= 0 ? '+' : ''}₹${best.pnl.toFixed(0)} mock). ` +
      `${worst.config.name} performed worst. Capital was split across agents with a cash reserve, no single agent held everything.`,
  }
}

// Risk Manager: a swarm-level veto for dangerous market moods (override every agent).
export function riskManagerVeto(mood: MarketMood): { veto: boolean; reason: string } {
  if (mood === 'panic') {
    return { veto: true, reason: 'Panic market, Risk Manager paused new entries. Capital protect first.' }
  }
  return { veto: false, reason: 'Risk Manager: normal conditions.' }
}

// Debate Agent: bull/bear/technical/risk framing for a signal (recommendation only, never executes).
export function debate(signal: StrategySignal): {
  bull: string
  bear: string
  technical: string
  risk: string
  recommendation: string
} {
  const doc = getStrategyDoc(signal.strategyId)
  const up = signal.action === 'buy'
  return {
    bull: up ? `${doc?.name}: setup favours upside.` : 'Bull case is weak here.',
    bear: up ? 'Bear case: move could fail and hit the stop.' : `${doc?.name}: setup favours downside.`,
    technical: signal.reason,
    risk: `Reward:risk is built into the stop (${signal.stopLoss.toFixed(0)}) and target (${signal.target.toFixed(0)}).`,
    recommendation: signal.confidence >= 0.55
      ? `Mock ${signal.action.toUpperCase()} with a stop loss. Recommendation only.`
      : 'Confidence low, prefer to wait.',
  }
}

// Father Coach: calm, protective, Telugu-English explanation of what happened.
export function fatherCoachSummary(pnl: number, tradeCount: number, blocked: number): string {
  if (tradeCount === 0) {
    return 'Ee session lo agents ఏ trade cheyyaledu, market clear ga ledu. Trade lekapోవడం kuda oka decision. Capital safe.'
  }
  const outcome = pnl >= 0
    ? `Chinna mock profit (+₹${pnl.toFixed(0)}) vachchindi. Luck kuda undొచ్chు, so process chudu.`
    : `Chinna mock loss (₹${pnl.toFixed(0)}) ayindi. Parవాledu, idi practice. Risk Guard ${blocked} risky trades ni block chesindi.`
  return `${outcome} Gурtupettuko: stop loss always, chinna size, overtrade వద్దు.`
}
