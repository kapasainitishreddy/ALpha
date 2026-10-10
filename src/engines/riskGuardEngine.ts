import type { RiskContext, RiskDecision } from '@/types'
import {
  RISK_LIMITS,
  maxConsecutiveLossesFor,
  maxTradeFraction,
  maxTradesFor,
} from '@/data/riskRules'

// THE single risk chokepoint. Every order (manual, assisted, auto, swarm agent) routes through here.
// Returns allow/deny + a plain reason + a Father-Mode explanation. Never mutates state.
export function evaluateRisk(ctx: RiskContext): RiskDecision {
  const deny = (reason: string, father: string, score: number, action?: string): RiskDecision => ({
    allow: false,
    reason,
    fatherExplanation: father,
    riskScore: Math.min(100, score),
    requiredAction: action,
  })

  const numeric = [ctx.balance, ctx.tradeValue, ctx.entry, ctx.dailyPnl, ctx.tradesToday, ctx.consecutiveLosses,
    ctx.stopLoss ?? 1, ctx.target ?? 1, ctx.reservedCapital ?? 0, ctx.dayStartBalance ?? ctx.balance,
    ctx.maxRiskPct ?? 1, ctx.riskCapital ?? ctx.balance, ctx.agentAllocation ?? 0]
  if (numeric.some(v => !Number.isFinite(v)) || ctx.balance <= 0 || ctx.tradeValue <= 0 || ctx.entry <= 0 ||
      ctx.tradesToday < 0 || ctx.consecutiveLosses < 0 || !['buy', 'sell'].includes(ctx.side)) {
    return deny('Order contains invalid numbers or size.', 'Enter valid price and quantity.', 100)
  }
  if (ctx.stoppedToday) return deny('Trading stopped for today.', 'Take a break. Resume tomorrow.', 100)
  if (ctx.stopLoss !== undefined && (ctx.side === 'buy' ? ctx.stopLoss >= ctx.entry : ctx.stopLoss <= ctx.entry)) {
    return deny('Stop loss must be on the loss side of entry.', 'Check the stop direction.', 90)
  }
  if (ctx.target !== undefined && (ctx.target <= 0 || (ctx.side === 'buy' ? ctx.target <= ctx.entry : ctx.target >= ctx.entry))) {
    return deny('Target must be on the profit side of entry.', 'Check the target direction.', 90)
  }
  if ((ctx.reservedCapital ?? 0) + ctx.tradeValue * 1.001 > ctx.balance) {
    return deny('Insufficient available paper capital, including costs and existing orders.', 'Reduce quantity or close a position.', 90)
  }
  if (ctx.maxRiskPct !== undefined) {
    const loss = Math.abs(ctx.entry - (ctx.stopLoss ?? ctx.entry)) * ctx.tradeValue / ctx.entry + ctx.tradeValue * 0.0016
    if (loss > (ctx.riskCapital ?? ctx.balance) * ctx.maxRiskPct / 100) {
      return deny(`Estimated stop loss and costs exceed the ${ctx.maxRiskPct}% risk cap.`, 'Use a smaller position.', 90)
    }
  }
  const effectiveMode = ctx.fatherMode ? 'father' : ctx.mode
  const dayCapital = ctx.dayStartBalance ?? ctx.balance

  // 0. Real auto-trading is never allowed in v1, hard block.
  if (ctx.isRealAuto) {
    return deny(
      'Real-money auto-trading is disabled in this version.',
      'Real money tho auto trade ee version lo ledu. Mock lo practice cheyyi.',
      100,
      'Use mock mode.',
    )
  }

  // 1. Stop loss is mandatory.
  if (ctx.stopLoss === undefined || ctx.stopLoss <= 0) {
    return deny(
      'No stop loss set.',
      'Stop loss lekunda trade cheyyakudadhu. Modata loss limit set cheyyi.',
      90,
      'Set a stop loss first.',
    )
  }

  // 2. No full-balance / oversized trade.
  const frac = ctx.tradeValue / Math.max(ctx.balance, 1)
  const cap = maxTradeFraction(effectiveMode)
  if (frac > cap) {
    return deny(
      `Trade uses ${(frac * 100).toFixed(0)}% of balance (max ${(cap * 100).toFixed(0)}%).`,
      `Balance lo ${(frac * 100).toFixed(0)}% okే trade lo pettadam risky. Chinna size cheyyi.`,
      80,
      'Reduce quantity.',
    )
  }

  // 3. Daily loss stop.
  if (ctx.dailyPnl <= -RISK_LIMITS.dailyLossFraction * dayCapital) {
    return deny(
      'Daily loss limit reached. Stop for today.',
      'Ee roju loss limit ayipoyindi. Today aapedham. Repu malli.',
      70,
      'Stop trading today.',
    )
  }

  // 4. Target reached.
  if (ctx.dailyPnl >= RISK_LIMITS.targetProfitFraction * dayCapital) {
    return deny(
      'Daily target reached. Protect your gains.',
      'Target vachchindi. Profit protect cheyyi, aapedham.',
      30,
      'Stop and book profit.',
    )
  }

  // 5. Consecutive losses.
  const maxCL = maxConsecutiveLossesFor(effectiveMode)
  if (ctx.consecutiveLosses >= maxCL) {
    return deny(
      `${ctx.consecutiveLosses} losses in a row. Take a break.`,
      `Vరుసగా ${ctx.consecutiveLosses} losses. Break తీసుకో, emotion tho trade cheyyaku.`,
      65,
      'Pause and review.',
    )
  }

  // 6. Too many trades.
  const maxTr = maxTradesFor(effectiveMode)
  if (ctx.tradesToday >= maxTr) {
    return deny(
      `Trade count ${ctx.tradesToday} reached the limit (${maxTr}).`,
      `Ee roju ${maxTr} trades chesav. Overtrade cheyyaku. Aapedham.`,
      55,
      'Stop for today.',
    )
  }

  // 7. Risk/reward quality.
  const risk = Math.abs(ctx.entry - ctx.stopLoss)
  const reward = ctx.target ? Math.abs(ctx.target - ctx.entry) : 0
  if (risk > 0 && reward > 0) {
    const rr = reward / risk
    if (rr < RISK_LIMITS.minRiskReward) {
      return deny(
        `Risk/reward ${rr.toFixed(2)} is below ${RISK_LIMITS.minRiskReward}.`,
        `Risk ekkuva, reward takkuva (${rr.toFixed(2)}). Better setup wait cheyyi.`,
        50,
        'Improve target or stop.',
      )
    }
  }

  // 8. Agent over-allocation (swarm).
  if (ctx.agentAllocation !== undefined && ctx.tradeValue > ctx.agentAllocation) {
    return deny(
      'Agent exceeded its allocation.',
      'Ee agent daggara unna money kanna ekkuva trade. Allow cheyyalేదు.',
      60,
      'Reduce size.',
    )
  }

  // Allowed, score by how much of the cap is used.
  const score = Math.round(frac / cap * 40)
  return {
    allow: true,
    reason: 'Trade passes risk checks.',
    fatherExplanation: 'Risk okే undi. Stop loss set undi, size chinnaga undi. Careful ga trade cheyyi.',
    riskScore: score,
  }
}
