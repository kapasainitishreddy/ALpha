import { useStore } from '@/store/useStore'
import type { Trade } from '@/types'
import { MOCK_SYMBOLS } from '@/data/mockSymbols'
import { MARKET_EVENTS } from '@/data/marketEvents'
import { inr, pnlColor } from '@/lib/format'
import { grossPnl } from '@/engines/tradeEngine'

export function SymbolEventPicker({
  symbol, event, onSymbol, onEvent,
}: { symbol: string; event: string; onSymbol: (s: string) => void; onEvent: (e: string) => void }) {
  const custom = useStore(s => s.customScenarios)
  return (
    <div className="grid grid-cols-2 gap-3">
      <label className="space-y-1">
        <span className="label">Symbol</span>
        <select className="input" value={symbol} onChange={(e) => onSymbol(e.target.value)}>
          {MOCK_SYMBOLS.map((s) => <option key={s.symbol} value={s.symbol}>{s.symbol}</option>)}
        </select>
      </label>
      <label className="space-y-1">
        <span className="label">Market scenario</span>
        <select className="input" value={event} onChange={(e) => onEvent(e.target.value)}>
          {custom.map(ev => <option key={ev.id} value={ev.id}>Custom: {ev.name}</option>)}
          {MARKET_EVENTS.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
      </label>
    </div>
  )
}

export function Positions({ trades, price, onExit }: { trades: Trade[]; price?: number; onExit?: (id: string) => void }) {
  if (!trades.length) return <div className="text-sm text-muted">No open positions.</div>
  return (
    <div className="space-y-2">
      {trades.map((t) => {
        const pnl = price === undefined ? null : grossPnl(t, price) - t.fees
        return (
          <div key={t.id} className="card !p-3 flex items-center gap-3">
            <div>
              <div className="font-semibold">{t.symbol} <span className={`chip ${t.side === 'buy' ? '!text-up' : '!text-down'}`}>{t.side}</span></div>
              <div className="text-xs text-muted">qty {t.qty} @ {inr(t.entryPrice)} · SL {t.stopLoss ? inr(t.stopLoss) : '-'} · T {t.target ? inr(t.target) : '-'}</div>
            </div>
            <div className={`ml-auto font-bold ${pnlColor(pnl ?? 0)}`}>{pnl === null ? 'Quote unavailable' : inr(pnl)}</div>
            {onExit && <button className="btn-ghost !py-2 !px-3" onClick={() => onExit(t.id)}>Exit</button>}
          </div>
        )
      })}
    </div>
  )
}

export function ClosedList({ trades }: { trades: Trade[] }) {
  if (!trades.length) return null
  return (
    <div className="space-y-1">
      {trades.map((t) => (
        <div key={t.id} className="flex justify-between text-sm border-b border-edge/50 py-1">
          <span className="text-muted">{t.symbol} {t.side} ×{t.qty}</span>
          <span className={pnlColor(t.realizedPnl ?? 0)}>{inr(t.realizedPnl ?? 0)}</span>
        </div>
      ))}
    </div>
  )
}

export function PendingOrders({ sessionId }: { sessionId: string }) {
  const { pendingOrders, removePending, orderEvents, logOrderEvent } = useStore()
  const orders = pendingOrders.filter(o => o.sessionId === sessionId)
  const events = orderEvents.filter(e => e.sessionId === sessionId).slice(0,3)
  if (!orders.length && !events.length) return null
  return <div className="card space-y-2"><h3 className="font-bold">Pending paper orders</h3>{orders.map(o => <div key={o.id} className="text-sm flex justify-between gap-2"><span>{o.order.symbol} {o.order.side} {o.order.type} ×{o.order.qty} @ {inr(o.order.limitPrice ?? o.order.triggerPrice ?? 0)}</span><button className="chip" onClick={() => { removePending(o.id); logOrderEvent(sessionId, o.order.symbol, 'Pending order cancelled by user.') }}>Cancel</button></div>)}{events.map((e,i) => <p key={`${e.at}:${i}`} className="text-xs text-muted" role="status">{e.symbol} · {e.message}</p>)}</div>
}
