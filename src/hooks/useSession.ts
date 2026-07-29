import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AppMode, Candle, OrderRequest, RiskDecision, Trade } from '@/types'
import { generateSession } from '@/engines/mockMarketEngine'
import { evaluateRisk } from '@/engines/riskGuardEngine'
import { closeTrade, hitStopOrTarget, openTrade } from '@/engines/tradeEngine'
import { grossPnl } from '@/engines/tradeEngine'
import { useStore } from '@/store/useStore'

// Drives one interactive mock session: a market plays forward candle-by-candle; user/AI places mock trades.
export function useSession(symbol: string, eventId: string, mode: AppMode, seedOffset = 0) {
  const session = useMemo(() => generateSession(symbol, eventId, 90, seedOffset), [symbol, eventId, seedOffset])
  const [idx, setIdx] = useState(20)
  const [openTrades, setOpenTrades] = useState<Trade[]>([])
  const [closedTrades, setClosedTrades] = useState<Trade[]>([])
  const [lastDecision, setLastDecision] = useState<RiskDecision | null>(null)

  const store = useStore()
  const price = session.candles[Math.min(idx, session.candles.length - 1)].close
  const visible: Candle[] = session.candles.slice(0, idx + 1)

  // Auto-close on stop/target as the market advances.
  const openRef = useRef(openTrades)
  openRef.current = openTrades
  useEffect(() => {
    const still: Trade[] = []
    for (const t of openRef.current) {
      const hit = hitStopOrTarget(t, price)
      if (hit) {
        const ref = hit === 'stop' ? t.stopLoss! : t.target!
        const c = closeTrade(t, ref)
        store.updateTrade(c)
        store.recordClose(c.realizedPnl ?? 0)
        setClosedTrades((p) => [c, ...p])
      } else {
        still.push(t)
      }
    }
    if (still.length !== openRef.current.length) setOpenTrades(still)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

  const step = useCallback(() => setIdx((i) => Math.min(i + 1, session.candles.length - 1)), [session.candles.length])
  const atEnd = idx >= session.candles.length - 1

  const place = useCallback(
    (order: OrderRequest): RiskDecision => {
      const value = (order.limitPrice ?? price) * order.qty
      const decision = evaluateRisk({
        mode,
        balance: store.balance,
        tradeValue: value,
        entry: order.limitPrice ?? price,
        side: order.side,
        stopLoss: order.stopLoss,
        target: order.target,
        strategyId: order.strategyTag,
        marketMood: session.event.mood,
        consecutiveLosses: store.consecutiveLosses,
        dailyPnl: store.dailyPnl,
        tradesToday: store.tradesToday,
      })
      setLastDecision(decision)
      if (decision.allow) {
        const t = openTrade(order, price, mode)
        store.addTrade(t)
        setOpenTrades((p) => [t, ...p])
      }
      return decision
    },
    [mode, price, store, session.event.mood],
  )

  const exit = useCallback(
    (id: string) => {
      const t = openTrades.find((x) => x.id === id)
      if (!t) return
      const c = closeTrade(t, price)
      store.updateTrade(c)
      store.recordClose(c.realizedPnl ?? 0)
      setOpenTrades((p) => p.filter((x) => x.id !== id))
      setClosedTrades((p) => [c, ...p])
    },
    [openTrades, price, store],
  )

  const openPnl = openTrades.reduce((s, t) => s + grossPnl(t, price), 0)
  const sessionPnl = closedTrades.reduce((s, t) => s + (t.realizedPnl ?? 0), 0)

  return { session, visible, idx, price, atEnd, openTrades, closedTrades, lastDecision, openPnl, sessionPnl, step, place, exit }
}
