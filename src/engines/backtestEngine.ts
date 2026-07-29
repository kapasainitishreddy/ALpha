import type { BacktestResult, Trade } from '@/types'
import { generateSession } from './mockMarketEngine'
import { evaluateStrategy } from './strategyEngine'
import { closeTrade, feeFor, fillPrice, grossPnl, hitStopOrTarget } from './tradeEngine'
import { getStrategyDoc } from '@/data/strategyDocs'
import { getEvent } from '@/data/marketEvents'

// Run one strategy over one generated market session. Single position at a time.
export function runBacktest(
  strategyId: string,
  symbol: string,
  eventId: string,
  startBalance = 10000,
  candleCount = 120,
): BacktestResult {
  const session = generateSession(symbol, eventId, candleCount)
  const { candles } = session
  let balance = startBalance
  let feesPaid = 0
  const closed: Trade[] = []
  const equity: number[] = [balance]
  let open: Trade | null = null

  const riskFraction = 0.05 // deploy ~5% of balance per trade in backtest

  for (let i = 20; i < candles.length; i++) {
    const price = candles[i].close
    // Manage open position.
    if (open) {
      const hit = hitStopOrTarget(open, price)
      if (hit) {
        const ref = hit === 'stop' ? open.stopLoss! : open.target!
        const c = closeTrade(open, ref)
        balance += c.realizedPnl ?? 0
        feesPaid += c.fees
        closed.push(c)
        open = null
      }
    }
    // Open a new position on a fresh signal.
    if (!open) {
      const sig = evaluateStrategy(strategyId, candles, i)
      if (sig.action !== 'hold' && sig.confidence >= 0.5) {
        const qty = Math.max(1, Math.floor((balance * riskFraction) / price))
        const entry = fillPrice(price, sig.action)
        open = {
          id: `bt${i}`,
          symbol,
          side: sig.action,
          qty,
          entryPrice: entry,
          stopLoss: sig.stopLoss,
          target: sig.target,
          status: 'open',
          openedAt: i,
          fees: feeFor(entry * qty),
          strategyTag: strategyId,
          mode: 'backtest',
        }
        feesPaid += open.fees
      }
    }
    equity.push(balance + (open ? grossPnl(open, price) : 0))
  }
  // Close any dangling position at last price.
  if (open) {
    const c = closeTrade(open, candles[candles.length - 1].close)
    balance += c.realizedPnl ?? 0
    feesPaid += c.fees
    closed.push(c)
  }

  return summarize(strategyId, symbol, eventId, startBalance, balance, closed, feesPaid, equity)
}

function summarize(
  strategyId: string,
  symbol: string,
  eventId: string,
  startBalance: number,
  endBalance: number,
  closed: Trade[],
  feesPaid: number,
  equity: number[],
): BacktestResult {
  const pnls = closed.map((t) => t.realizedPnl ?? 0)
  const wins = pnls.filter((p) => p > 0)
  const losses = pnls.filter((p) => p <= 0)
  const grossWin = wins.reduce((s, p) => s + p, 0)
  const grossLoss = Math.abs(losses.reduce((s, p) => s + p, 0))
  const profitFactor = grossLoss === 0 ? (grossWin > 0 ? 99 : 0) : grossWin / grossLoss

  // Max drawdown on equity curve.
  let peak = equity[0]
  let maxDd = 0
  for (const e of equity) {
    if (e > peak) peak = e
    const dd = (peak - e) / peak
    if (dd > maxDd) maxDd = dd
  }
  // Worst losing streak.
  let streak = 0
  let worstStreak = 0
  for (const p of pnls) {
    streak = p <= 0 ? streak + 1 : 0
    worstStreak = Math.max(worstStreak, streak)
  }

  const totalReturnPct = ((endBalance - startBalance) / startBalance) * 100
  const winRatePct = closed.length ? (wins.length / closed.length) * 100 : 0
  const doc = getStrategyDoc(strategyId)
  const ev = getEvent(eventId)

  return {
    strategyId,
    symbol,
    eventId,
    startBalance,
    endBalance: Math.round(endBalance),
    totalReturnPct: +totalReturnPct.toFixed(2),
    trades: closed.length,
    wins: wins.length,
    losses: losses.length,
    winRatePct: +winRatePct.toFixed(1),
    profitFactor: +profitFactor.toFixed(2),
    maxDrawdownPct: +(maxDd * 100).toFixed(1),
    worstLosingStreak: worstStreak,
    bestTradePnl: pnls.length ? +Math.max(...pnls).toFixed(2) : 0,
    worstTradePnl: pnls.length ? +Math.min(...pnls).toFixed(2) : 0,
    feesPaid: +feesPaid.toFixed(2),
    equityCurve: equity.map((e) => Math.round(e)),
    aiExplanation:
      `${doc?.name ?? strategyId} on ${symbol} during "${ev.name}" made ${closed.length} trades, ` +
      `win rate ${winRatePct.toFixed(0)}%, profit factor ${profitFactor.toFixed(2)}, max drawdown ${(maxDd * 100).toFixed(0)}%. ` +
      `This event favours "${ev.idealStrategy}" and punishes "${ev.dangerousStrategy}". Backtests do not guarantee real results.`,
    fatherExplanation:
      `${doc?.name ?? strategyId} ee market lo ${totalReturnPct >= 0 ? 'profit' : 'loss'} ichindi. ` +
      `${ev.fatherExplanation} Idi mock test matrame, real result guarantee kaadu.`,
  }
}
