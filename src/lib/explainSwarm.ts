import type { AgentResult, MarketEventDef, SwarmResult } from '@/types'

// Turns a SwarmResult into plain English. The raw output ("Ema Trend Agent — best, -₹10.25,
// 4 trades, 1W/3L, 0 blocked") is accurate and unreadable: calling a loss "best" reads like a
// win, and nothing says WHY five strategies all lost. This is the explanation layer.

export interface AgentExplain {
  headline: string // what this agent did, in one line
  why: string // why it turned out that way
  suited: 'ideal' | 'dangerous' | 'neutral'
}

export function explainAgent(r: AgentResult, event: MarketEventDef, isBest: boolean, isWorst: boolean, allLost: boolean): AgentExplain {
  const s = r.config.strategyId
  const suited: AgentExplain['suited'] =
    s === event.idealStrategy ? 'ideal' : s === event.dangerousStrategy ? 'dangerous' : 'neutral'

  if (!r.trades.length) {
    return {
      headline: r.blockedTrades > 0
        ? `Sat out — Risk Guard blocked all ${r.blockedTrades} of its attempts.`
        : 'Sat out — never saw a setup it was willing to take.',
      why: r.blockedTrades > 0
        ? 'It wanted to trade but every order broke a safety rule, usually position size against the capital it was given.'
        : 'Its entry conditions never lined up in this market. Doing nothing is a valid result, not a failure.',
      suited,
    }
  }

  const rank = isBest
    ? allLost ? 'Lost the least of the five.' : 'Made the most of the five.'
    : isWorst ? 'Lost the most of the five.' : ''

  const winRate = r.wins / r.trades.length
  const headline = [
    rank,
    `${r.trades.length} trades, won ${r.wins}.`,
  ].filter(Boolean).join(' ')

  // The dominant failure mode in this simulator is being stopped out by ordinary noise —
  // worth naming explicitly, because beginners read it as "the strategy was wrong".
  const why =
    winRate === 0
      ? `Every trade hit its stop loss. That usually means the stop sat too close to the entry, so normal price wobble knocked it out before the idea had room to work.`
      : winRate < 0.4
        ? `Most trades got stopped out. The wins were real but too few to cover the losses — the classic shape of a strategy fighting the market it is in.`
        : winRate >= 0.6
          ? `It won more often than it lost, which is why it came out ahead here.`
          : `Roughly half its trades worked. At that hit rate the result comes down entirely to whether wins are bigger than losses.`

  const fit =
    suited === 'ideal' ? ` This strategy is the natural fit for a ${event.name.toLowerCase()} — when even the right tool loses, the market simply did not offer a clean setup.`
      : suited === 'dangerous' ? ` This is the wrong strategy for a ${event.name.toLowerCase()}, and the result shows it. Expected, and worth seeing.`
        : ''

  return { headline, why: why + fit, suited }
}

export interface SwarmExplain {
  verdict: string
  detail: string
  lesson: string
  bullets: string[]
}

export function explainSwarm(res: SwarmResult, event: MarketEventDef): SwarmExplain {
  const traded = res.agents.filter((a) => a.trades.length > 0)
  const totalTrades = res.agents.reduce((s, a) => s + a.trades.length, 0)
  const totalBlocked = res.agents.reduce((s, a) => s + a.blockedTrades, 0)
  const winners = res.agents.filter((a) => a.pnl > 0)
  const pctMove = (res.totalPnl / res.startingCapital) * 100

  if (totalTrades === 0) {
    return {
      verdict: 'Nobody traded.',
      detail: totalBlocked > 0
        ? `All ${totalBlocked} attempted orders were blocked by the Risk Guard — almost always because the position size was too large for the capital each agent was given.`
        : 'No strategy saw a setup it was willing to take in this market.',
      lesson: 'Give the swarm more capital (₹50,000+) so each agent can afford a position, or pick a market with clearer moves like "Real breakout".',
      bullets: [],
    }
  }

  const verdict = res.totalPnl > 0
    ? `The swarm made ${fmt(res.totalPnl)} — up ${Math.abs(pctMove).toFixed(2)}%.`
    : res.totalPnl < 0
      ? `The swarm lost ${fmt(Math.abs(res.totalPnl))} — down ${Math.abs(pctMove).toFixed(2)}%.`
      : 'The swarm broke even.'

  const detail = winners.length === 0
    ? `All ${traded.length} strategies lost money on this market. That is a normal and useful outcome — it means this particular market punished every approach, not that the strategies are broken.`
    : winners.length === res.agents.length
      ? `Every strategy made money. Markets like this flatter everyone, which is exactly when overconfidence starts.`
      : `${winners.length} of ${traded.length} strategies made money. The same market, the same moment, opposite results — the difference is method, not luck.`

  const bullets: string[] = [
    `Your ₹${res.startingCapital.toLocaleString('en-IN')} was split between ${res.agents.length} strategies, keeping ${fmt(res.cashReserve)} in cash. No single strategy ever gets everything.`,
    `${totalTrades} trades were placed in total across all of them.`,
  ]
  if (totalBlocked > 0) {
    bullets.push(`${totalBlocked} orders were blocked by the Risk Guard before they could be placed. That is the safety net working.`)
  }
  const ideal = res.agents.find((a) => a.config.strategyId === event.idealStrategy)
  if (ideal) {
    bullets.push(
      ideal.pnl >= 0
        ? `${ideal.config.name} is the textbook fit for this market and it did come out ahead.`
        : `${ideal.config.name} is the textbook fit for this market — and it still lost. Being right about the market type does not guarantee a profit.`,
    )
  }

  const lesson = winners.length === 0
    ? 'When everything loses, the question is not "which strategy is best" but "should I have traded this market at all". Sitting out is a position.'
    : res.totalPnl > 0
      ? 'Check which strategy won before deciding it is the good one. One session is noise — the Insights screen tells you what holds up over many.'
      : 'Losing overall while some strategies won is the most common outcome. It is why professionals diversify method, not just stock.'

  return { verdict, detail, lesson, bullets }
}

const fmt = (n: number) => `₹${Math.round(Math.abs(n)).toLocaleString('en-IN')}`
