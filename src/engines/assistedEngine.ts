import type { Candle, StrategySignal } from '@/types'
import { evaluateStrategy } from './strategyEngine'
import { debate } from '@/agents/managerAgents'
import { getStrategyDoc } from '@/data/strategyDocs'

const CANDIDATE_STRATEGIES = [
  'ema-trend', 'rsi-bounce', 'breakout-volume', 'vwap-reclaim', 'momentum', 'mean-reversion', 'support-resistance',
]

export interface Candidate {
  signal: StrategySignal
  strategyName: string
  debate: ReturnType<typeof debate>
  whyItMayFail: string
  father: string
}

// AI-assisted: scan strategies, keep actionable signals, rank by confidence, attach explanations.
export function scanCandidates(candles: Candle[], idx: number, max = 3): Candidate[] {
  const out: Candidate[] = []
  for (const id of CANDIDATE_STRATEGIES) {
    const signal = evaluateStrategy(id, candles, idx)
    if (signal.action === 'hold' || signal.confidence < 0.5) continue
    const doc = getStrategyDoc(id)
    out.push({
      signal,
      strategyName: doc?.name ?? id,
      debate: debate(signal),
      whyItMayFail: `If this turns into a "${doc?.badMarket.toLowerCase()}" it can hit the stop. Volume/confirmation may be weak.`,
      father: `${doc?.father ?? ''} Approve chesthe stop loss tho matrame. Nచ్chకపోతే reject.`,
    })
  }
  return out.sort((a, b) => b.signal.confidence - a.signal.confidence).slice(0, max)
}
