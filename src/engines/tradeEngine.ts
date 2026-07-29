import type { OrderRequest, Side, Trade } from '@/types'

// Mock fill model: brokerage + slippage simulation. All money here is paper money.
export const BROKERAGE_RATE = 0.0003 // 0.03% per side
export const SLIPPAGE_RATE = 0.0005 // 0.05% adverse

let seq = 0
function nextId(): string {
  seq += 1
  return `t${Date.now().toString(36)}${seq}`
}

export function feeFor(value: number): number {
  return value * BROKERAGE_RATE
}

// Apply adverse slippage to a fill.
export function fillPrice(refPrice: number, side: Side): number {
  return side === 'buy' ? refPrice * (1 + SLIPPAGE_RATE) : refPrice * (1 - SLIPPAGE_RATE)
}

export function openTrade(order: OrderRequest, refPrice: number, mode: Trade['mode'], agentId?: string): Trade {
  const entry = order.type === 'limit' && order.limitPrice ? order.limitPrice : fillPrice(refPrice, order.side)
  const value = entry * order.qty
  return {
    id: nextId(),
    symbol: order.symbol,
    side: order.side,
    qty: order.qty,
    entryPrice: entry,
    stopLoss: order.stopLoss,
    target: order.target,
    status: 'open',
    strategyTag: order.strategyTag,
    openedAt: Date.now(),
    fees: feeFor(value),
    agentId,
    mode,
  }
}

export function grossPnl(trade: Trade, price: number): number {
  const dir = trade.side === 'buy' ? 1 : -1
  return (price - trade.entryPrice) * trade.qty * dir
}

export function closeTrade(trade: Trade, refPrice: number): Trade {
  const exit = fillPrice(refPrice, trade.side === 'buy' ? 'sell' : 'buy')
  const exitFee = feeFor(exit * trade.qty)
  const realized = grossPnl({ ...trade }, exit) - trade.fees - exitFee
  return {
    ...trade,
    exitPrice: exit,
    status: 'closed',
    closedAt: Date.now(),
    fees: trade.fees + exitFee,
    realizedPnl: realized,
  }
}

// Given a live price, has the trade hit its stop or target?
export function hitStopOrTarget(trade: Trade, price: number): 'stop' | 'target' | null {
  if (trade.side === 'buy') {
    if (trade.stopLoss && price <= trade.stopLoss) return 'stop'
    if (trade.target && price >= trade.target) return 'target'
  } else {
    if (trade.stopLoss && price >= trade.stopLoss) return 'stop'
    if (trade.target && price <= trade.target) return 'target'
  }
  return null
}
