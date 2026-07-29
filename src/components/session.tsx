import type { Trade } from '@/types'
import { MOCK_SYMBOLS } from '@/data/mockSymbols'
import { MARKET_EVENTS } from '@/data/marketEvents'
import { inr, pnlColor } from '@/lib/format'
import { grossPnl } from '@/engines/tradeEngine'

export function SymbolEventPicker({
  symbol, event, onSymbol, onEvent,
}: { symbol: string; event: string; onSymbol: (s: string) => void; onEvent: (e: string) => void }) {
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
          {MARKET_EVENTS.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
      </label>
    </div>
  )
}

export function Positions({ trades, price, onExit }: { trades: Trade[]; price: number; onExit?: (id: string) => void }) {
  if (!trades.length) return <div className="text-sm text-muted">No open positions.</div>
  return (
    <div className="space-y-2">
      {trades.map((t) => {
        const pnl = grossPnl(t, price)
        return (
          <div key={t.id} className="card !p-3 flex items-center gap-3">
            <div>
              <div className="font-semibold">{t.symbol} <span className={`chip ${t.side === 'buy' ? '!text-up' : '!text-down'}`}>{t.side}</span></div>
              <div className="text-xs text-muted">qty {t.qty} @ {inr(t.entryPrice)} · SL {t.stopLoss ? inr(t.stopLoss) : '-'} · T {t.target ? inr(t.target) : '-'}</div>
            </div>
            <div className={`ml-auto font-bold ${pnlColor(pnl)}`}>{inr(pnl)}</div>
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
