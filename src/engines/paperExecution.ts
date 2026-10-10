import { localId } from '@/lib/id'
import type { AppMode, Candle, OrderRequest, RiskDecision, Trade } from '@/types'
import { useStore } from '@/store/useStore'
import { evaluateRisk } from './riskGuardEngine'
import { closeTrade, fillPrice, openTrade } from './tradeEngine'

export function reservedCapital(excludeOrder?: string): number {
  const s = useStore.getState()
  return (
    s.trades
      .filter((t) => t.status === 'open')
      .reduce((v, t) => v + t.entryPrice * t.qty + t.fees, 0) +
    s.pendingOrders
      .filter((o) => o.id !== excludeOrder)
      .reduce(
        (v, o) => v + (o.order.limitPrice ?? o.order.triggerPrice ?? 0) * o.order.qty * 1.001,
        0,
      )
  )
}
export function accountRisk(mode: AppMode) {
  useStore.getState().ensureDay()
  const s = useStore.getState()
  return {
    mode,
    balance: s.balance,
    fatherMode: s.fatherMode,
    dailyPnl: s.dailyPnl,
    tradesToday: s.tradesToday,
    consecutiveLosses: s.consecutiveLosses,
    dayStartBalance: s.dayStartBalance,
    stoppedToday: s.stoppedToday,
    reservedCapital: reservedCapital(),
    maxRiskPct: s.challenge?.status === 'active' ? s.challenge.maxRiskPct : undefined,
    riskCapital: s.challenge?.startCapital ?? s.balance,
  }
}
const invalid = (reason: string): RiskDecision => ({
  allow: false,
  reason,
  fatherExplanation: reason,
  riskScore: 100,
})
export function submitPaperOrder(
  order: OrderRequest,
  price: number,
  mode: AppMode,
  sessionId: string,
): RiskDecision {
  if (
    !Number.isFinite(order.qty) ||
    order.qty <= 0 ||
    !Number.isFinite(price) ||
    price <= 0 ||
    !order.symbol
  )
    return invalid('Enter a valid quantity and quote.')
  if (!order.symbol.endsWith('USDT') && !Number.isInteger(order.qty))
    return invalid(
      'Shares and synthetic index units require whole quantities. Crypto supports fractional quantities.',
    )
  if (!['market', 'limit', 'stop'].includes(order.type)) return invalid('Unknown order type.')
  const reference =
    order.type === 'limit' ? order.limitPrice : order.type === 'stop' ? order.triggerPrice : price
  if (!reference || !Number.isFinite(reference) || reference <= 0)
    return invalid('Enter a valid order price.')
  const marketable =
    order.type === 'market' ||
    (order.type === 'limit' && (order.side === 'buy' ? price <= reference : price >= reference)) ||
    (order.type === 'stop' && (order.side === 'buy' ? price >= reference : price <= reference))
  const expected = marketable
    ? order.type === 'limit'
      ? order.side === 'buy'
        ? Math.min(reference, price)
        : Math.max(reference, price)
      : price
    : reference
  const entry = order.type === 'limit' ? expected : fillPrice(expected, order.side)
  const risk = accountRisk(mode)
  const decision = evaluateRisk({
    ...risk,
    tradeValue: entry * order.qty,
    entry,
    side: order.side,
    stopLoss: order.stopLoss,
    target: order.target,
  })
  if (!decision.allow) return decision
  if (marketable) {
    const t = openTrade(
      order.type === 'limit'
        ? {
            ...order,
            limitPrice:
              order.side === 'buy' ? Math.min(reference, price) : Math.max(reference, price),
          }
        : { ...order, type: 'market' },
      price,
      mode,
    )
    useStore.getState().addTrade({ ...t, sessionId })
  } else {
    useStore
      .getState()
      .addPending({ id: localId(), order, mode, sessionId, createdAt: Date.now() })
  }
  useStore
    .getState()
    .logOrderEvent(
      sessionId,
      order.symbol,
      marketable ? 'Paper order filled.' : 'Paper order queued; capital reserved.',
    )
  return {
    ...decision,
    reason: marketable
      ? 'Paper order filled.'
      : 'Paper order queued; capital reserved until fill or cancellation.',
  }
}

// Bar model: orders active before this bar. A stop has priority when both exits touch,
// because the intrabar path is unknown. Stop gaps fill at the open, never at an unavailable stop.
export function exitReference(trade: Trade, bar: Candle): number | null {
  const { stopLoss: sl, target: tp } = trade
  if (trade.side === 'buy') {
    if (sl && bar.low <= sl) return Math.min(sl, bar.open)
    if (tp && bar.high >= tp) return Math.max(tp, bar.open)
  } else {
    if (sl && bar.high >= sl) return Math.max(sl, bar.open)
    if (tp && bar.low <= tp) return Math.min(tp, bar.open)
  }
  return null
}
export function processPaperBar(sessionId: string, symbol: string, bar: Candle) {
  const state = useStore.getState()
  for (const t of state.trades.filter(
    (t) => t.sessionId === sessionId && t.symbol === symbol && t.status === 'open',
  )) {
    const ref = exitReference(t, bar)
    if (ref !== null) useStore.getState().settleTrade(closeTrade(t, ref))
  }
  for (const pending of state.pendingOrders.filter(
    (o) => o.sessionId === sessionId && o.order.symbol === symbol,
  )) {
    const o = pending.order
    const ref = o.limitPrice ?? o.triggerPrice!
    const touched =
      o.type === 'limit'
        ? o.side === 'buy'
          ? bar.low <= ref
          : bar.high >= ref
        : o.side === 'buy'
          ? bar.high >= ref
          : bar.low <= ref
    if (!touched) continue
    const fill =
      o.type === 'limit'
        ? o.side === 'buy'
          ? Math.min(bar.open, ref)
          : Math.max(bar.open, ref)
        : o.side === 'buy'
          ? Math.max(bar.open, ref)
          : Math.min(bar.open, ref)
    useStore.getState().removePending(pending.id)
    const decision = submitPaperOrder(
      { ...o, type: o.type === 'limit' ? 'limit' : 'market', limitPrice: fill },
      fill,
      pending.mode,
      sessionId,
    )
    // An order that no longer passes account limits is cancelled. It is never silently filled.
    if (!decision.allow)
      useStore
        .getState()
        .logOrderEvent(sessionId, symbol, `Pending order cancelled: ${decision.reason}`)
    if (decision.allow) {
      const filled = useStore
        .getState()
        .trades.find(
          (t) => t.sessionId === sessionId && !state.trades.some((old) => old.id === t.id),
        )
      if (filled) {
        const stop = exitReference(filled, bar)
        const atOpen =
          o.type === 'limit'
            ? o.side === 'buy'
              ? bar.open <= ref
              : bar.open >= ref
            : o.side === 'buy'
              ? bar.open >= ref
              : bar.open <= ref
        const stopIsLoss =
          stop !== null &&
          (filled.side === 'buy' ? stop < filled.entryPrice : stop > filled.entryPrice)
        if (stop !== null && (atOpen || stopIsLoss))
          useStore.getState().settleTrade(closeTrade(filled, stop))
      }
    }
  }
}
