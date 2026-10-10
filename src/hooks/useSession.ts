import { useCallback, useMemo, useState } from 'react'
import type { AppMode, OrderRequest, RiskDecision } from '@/types'
import { generateSession } from '@/engines/mockMarketEngine'
import { closeTrade, grossPnl } from '@/engines/tradeEngine'
import { processPaperBar, submitPaperOrder } from '@/engines/paperExecution'
import { useStore } from '@/store/useStore'

export function useSession(symbol: string, eventId: string, mode: AppMode, seedOffset = 0, explicitId?: string) {
  const customScenarios = useStore(s => s.customScenarios)
  const sessionId = explicitId ?? `mock:${mode === 'father' ? 'manual' : mode}:${symbol}:${eventId}:${seedOffset}`
  const session = useMemo(() => generateSession(symbol, eventId, 90, seedOffset), [symbol, eventId, seedOffset, customScenarios])
  const store = useStore()
  const idx = Math.min(store.sessions[sessionId]?.idx ?? 20, session.candles.length - 1)
  const [lastDecision, setLastDecision] = useState<RiskDecision | null>(null)
  const price = session.candles[idx].close
  const visible = useMemo(() => session.candles.slice(0, idx + 1), [session, idx])
  const own = store.trades.filter(t => t.sessionId === sessionId && t.symbol === symbol)
  const openTrades = own.filter(t => t.status === 'open')
  const closedTrades = own.filter(t => t.status === 'closed')
  const pendingOrders = store.pendingOrders.filter(o => o.sessionId === sessionId)
  const atEnd = idx >= session.candles.length - 1
  const step = useCallback(() => {
    const state = useStore.getState()
    const current = state.sessions[sessionId]?.idx ?? 20
    if (current >= session.candles.length - 1) return
    const next = current + 1
    state.setSession(sessionId, { ...state.sessions[sessionId], idx: next, startBalance: state.sessions[sessionId]?.startBalance ?? state.balance })
    processPaperBar(sessionId, symbol, session.candles[next])
    if (next === session.candles.length - 1) {
      for (const t of useStore.getState().trades.filter(t => t.sessionId === sessionId && t.status === 'open')) {
        useStore.getState().settleTrade(closeTrade(t, session.candles[next].close))
      }
      for (const o of useStore.getState().pendingOrders.filter(o => o.sessionId === sessionId)) useStore.getState().removePending(o.id)
    }
  }, [sessionId, session, symbol])
  const place = (order: OrderRequest) => {
    const state = useStore.getState()
    if (!state.sessions[sessionId]) state.setSession(sessionId, { idx, startBalance: state.balance })
    const decision = atEnd ? { allow: false, reason: 'Session ended. Start a new session.', fatherExplanation: 'Review your journal.', riskScore: 0 } :
      submitPaperOrder(order, price, mode, sessionId)
    setLastDecision(decision)
    return decision
  }
  const exit = (id: string) => {
    const t = useStore.getState().trades.find(t => t.id === id && t.sessionId === sessionId && t.symbol === symbol && t.status === 'open')
    if (t) useStore.getState().settleTrade(closeTrade(t, price))
  }
  const openPnl = openTrades.reduce((s, t) => s + grossPnl(t, price) - t.fees, 0)
  const sessionPnl = closedTrades.reduce((s, t) => s + (t.realizedPnl ?? 0), 0)
  return { startBalance: store.sessions[sessionId]?.startBalance ?? store.balance - sessionPnl, sessionId, session, visible, idx, price, atEnd, openTrades, closedTrades, pendingOrders, lastDecision, openPnl, sessionPnl, step, place, exit }
}
