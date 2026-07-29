import { useState } from 'react'
import { CandleChart } from '@/components/CandleChart'
import { Banner, Field, Section, Stat } from '@/components/common'
import { ClosedList, Positions, SymbolEventPicker } from '@/components/session'
import { useSession } from '@/hooks/useSession'
import { finishSession } from '@/lib/finish'
import { inr, pnlColor } from '@/lib/format'
import { STRATEGY_DOCS } from '@/data/strategyDocs'
import { useStore } from '@/store/useStore'
import type { OrderRequest, OrderType, Side } from '@/types'

export default function ManualTrade() {
  const [symbol, setSymbol] = useState('INFY')
  const [event, setEvent] = useState('normal-trend')
  const [seed, setSeed] = useState(0)
  const [saved, setSaved] = useState(false)
  const s = useSession(symbol, event, 'manual', seed)
  const start = useStore((st) => st.balance)

  const [type, setType] = useState<OrderType>('market')
  const [qty, setQty] = useState(1)
  const [slPct, setSlPct] = useState(1)
  const [tpPct, setTpPct] = useState(2)
  const [strategy, setStrategy] = useState('')

  const submit = (side: Side) => {
    const order: OrderRequest = {
      symbol, side, type, qty,
      limitPrice: type === 'limit' ? s.price : undefined,
      stopLoss: side === 'buy' ? s.price * (1 - slPct / 100) : s.price * (1 + slPct / 100),
      target: side === 'buy' ? s.price * (1 + tpPct / 100) : s.price * (1 - tpPct / 100),
      strategyTag: strategy || undefined,
    }
    s.place(order)
  }

  return (
    <div className="space-y-6">
      <SymbolEventPicker symbol={symbol} event={event} onSymbol={setSymbol} onEvent={(e) => { setEvent(e); setSeed((x) => x + 1); setSaved(false) }} />

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold">{symbol} <span className="text-muted font-normal">{inr(s.price)}</span></div>
          <div className="text-xs text-muted">candle {s.idx + 1}/{s.session.candles.length} · vol {s.session.volatilityScore}</div>
        </div>
        <CandleChart candles={s.visible} />
        <div className="flex gap-2 mt-3">
          <button className="btn-ghost flex-1" onClick={s.step} disabled={s.atEnd}>Next candle</button>
          <button className="btn-ghost flex-1" onClick={() => { for (let i = 0; i < 5; i++) s.step() }} disabled={s.atEnd}>+5 candles</button>
        </div>
      </div>

      <Section title="Place mock order">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Order type">
            <select className="input" value={type} onChange={(e) => setType(e.target.value as OrderType)}>
              <option value="market">Market</option>
              <option value="limit">Limit (@ current)</option>
            </select>
          </Field>
          <Field label="Quantity">
            <input className="input" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} />
          </Field>
          <Field label="Stop loss %">
            <input className="input" type="number" min={0.1} step={0.1} value={slPct} onChange={(e) => setSlPct(+e.target.value)} />
          </Field>
          <Field label="Target %">
            <input className="input" type="number" min={0.1} step={0.1} value={tpPct} onChange={(e) => setTpPct(+e.target.value)} />
          </Field>
        </div>
        <Field label="Strategy tag (optional)">
          <select className="input" value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            <option value="">None</option>
            {STRATEGY_DOCS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <div className="flex gap-3 mt-1">
          <button className="btn-up flex-1" onClick={() => submit('buy')}>Buy</button>
          <button className="btn-down flex-1" onClick={() => submit('sell')}>Sell</button>
        </div>
        {s.lastDecision && !s.lastDecision.allow && (
          <Banner tone="warn">Risk Guard blocked: {s.lastDecision.reason} {s.lastDecision.fatherExplanation}</Banner>
        )}
        {s.lastDecision?.allow && <Banner>Order placed. {s.lastDecision.fatherExplanation}</Banner>}
      </Section>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Open P/L" value={inr(s.openPnl)} tone={s.openPnl} />
        <Stat label="Closed P/L" value={inr(s.sessionPnl)} tone={s.sessionPnl} />
        <Stat label="Positions" value={String(s.openTrades.length)} />
      </div>

      <Section title="Open positions">
        <Positions trades={s.openTrades} price={s.price} onExit={s.exit} />
      </Section>

      {s.closedTrades.length > 0 && (
        <Section title="Closed this session" right={
          <button className="chip" disabled={saved} onClick={() => { finishSession('manual', s.closedTrades, start - s.sessionPnl); setSaved(true) }}>
            {saved ? 'Saved' : 'Save to journal'}
          </button>
        }>
          <ClosedList trades={s.closedTrades} />
          <div className={`text-right font-bold mt-1 ${pnlColor(s.sessionPnl)}`}>Session: {inr(s.sessionPnl)}</div>
        </Section>
      )}
    </div>
  )
}
