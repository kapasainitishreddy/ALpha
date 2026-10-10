import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { dailySetup } from '@/lib/dailySetup'
import { useTranslation } from '@/lib/i18n'
import { todayKey } from '@/store/useStore'
import { CandleChart } from '@/components/CandleChart'
import { Banner, Field, Section, Stat } from '@/components/common'
import { ClosedList, Positions, SymbolEventPicker, PendingOrders } from '@/components/session'
import { useSession } from '@/hooks/useSession'
import { finishSession } from '@/lib/finish'
import { inr, pnlColor } from '@/lib/format'
import { STRATEGY_DOCS } from '@/data/strategyDocs'
import { useStore } from '@/store/useStore'
import type { OrderRequest, OrderType, Side } from '@/types'

export default function ManualTrade() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const dailyDate = params.get('daily') ?? undefined
  const [symbol, setSymbol] = useState(params.get('symbol') ?? 'INFY')
  const [event, setEvent] = useState(params.get('event') ?? 'normal-trend')
  const [seed, setSeed] = useState(dailyDate ? dailySetup(dailyDate).seed : Number(params.get('seed') ?? 0) || 0)
  const [saved, setSaved] = useState(false)
  const father = useStore(st => st.fatherMode)
  const custom = useStore(st => st.customStrategies)
  const dailyLocked = useStore(st => dailyDate !== undefined && (dailyDate !== todayKey() || symbol !== dailySetup(dailyDate).symbol.symbol || event !== dailySetup(dailyDate).event.id || st.dailyResults.some(d => d.date === dailyDate)))
  const s = useSession(symbol, event, father ? 'father' : 'manual', seed, dailyDate ? `daily:${dailyDate}:${symbol}:${event}` : undefined)
  useEffect(() => { setSaved(false) }, [symbol, event, seed, s.closedTrades.length])

  const [type, setType] = useState<OrderType>('market')
  const [orderPrice, setOrderPrice] = useState('')
  const [qty, setQty] = useState(1)
  const [slPct, setSlPct] = useState(1)
  const [tpPct, setTpPct] = useState(2)
  const [strategy, setStrategy] = useState('')

  const submit = (side: Side) => {
    if (dailyLocked) return
    const ref = type === 'market' ? s.price : Number(orderPrice)
    const order: OrderRequest = {
      symbol, side, type, qty,
      limitPrice: type === 'limit' ? ref : undefined,
      triggerPrice: type === 'stop' ? ref : undefined,
      stopLoss: side === 'buy' ? ref * (1 - slPct / 100) : ref * (1 + slPct / 100),
      target: side === 'buy' ? ref * (1 + tpPct / 100) : ref * (1 - tpPct / 100),
      strategyTag: strategy || undefined,
    }
    s.place(order)
  }

  return (
    <div className="space-y-6">
      {dailyLocked && <Banner>Daily attempt saved or expired. Use a regular practice session.</Banner>}
      {!dailyDate && <button className="btn-ghost w-full" disabled={s.openTrades.length > 0 || s.pendingOrders.length > 0} onClick={() => setSeed(n => n + 1)}>New generated session (positions must be closed)</button>}
      {!dailyDate && <SymbolEventPicker symbol={symbol} event={event} onSymbol={setSymbol} onEvent={(e) => { setEvent(e); setSeed((x) => x + 1); setSaved(false) }} />}

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold">{symbol} <span className="text-muted font-normal">{inr(s.price)}</span></div>
          <div className="text-xs text-muted">candle {s.idx + 1}/{s.session.candles.length} · vol {s.session.volatilityScore}</div>
        </div>
        <CandleChart candles={s.visible} />
        <div className="flex gap-2 mt-3">
          <button className="btn-ghost flex-1" onClick={s.step} disabled={s.atEnd}>{t('next')}</button>
          <button className="btn-ghost flex-1" onClick={() => { for (let i = 0; i < 5; i++) s.step() }} disabled={s.atEnd}>+5 candles</button>
        </div>
      </div>

      <Banner>Generated prices, not real historical ticks. Index units are synthetic; index values are not directly tradable shares. Crypto prices are modelled in INR.</Banner>
      <Section title="Place mock order">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Order type">
            <select className="input" value={type} onChange={(e) => setType(e.target.value as OrderType)}>
              <option value="market">Market</option>
              <option value="limit">Limit</option><option value="stop">Stop entry</option>
            </select>
          </Field>
          <Field label="Quantity">
            <input className="input" type="number" min={0.000001} step="any" value={qty} onChange={(e) => setQty(+e.target.value)} />
          </Field>
          <Field label="Stop loss %">
            <input className="input" type="number" min={0.1} step={0.1} value={slPct} onChange={(e) => setSlPct(+e.target.value)} />
          </Field>
          <Field label="Target %">
            <input className="input" type="number" min={0.1} step={0.1} value={tpPct} onChange={(e) => setTpPct(+e.target.value)} />
          </Field>
        </div>
        {type !== 'market' && <Field label={type === 'limit' ? 'Limit price' : 'Trigger price'}><input className="input" type="number" min="0.01" step="any" value={orderPrice} onChange={e => setOrderPrice(e.target.value)} /></Field>}
        <Field label="Strategy tag (optional)">
          <select className="input" value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            <option value="">None</option>
            {custom.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            {STRATEGY_DOCS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <div className="flex gap-3 mt-1">
          <button className="btn-up flex-1" disabled={dailyLocked || s.atEnd} onClick={() => submit('buy')}>{t('buy')}</button>
          <button className="btn-down flex-1" disabled={dailyLocked || s.atEnd} onClick={() => submit('sell')}>{t('sell')}</button>
        </div>
        {s.lastDecision && !s.lastDecision.allow && (
          <Banner tone="warn">Risk Guard blocked: {s.lastDecision.reason} {s.lastDecision.fatherExplanation}</Banner>
        )}
        {s.lastDecision?.allow && <Banner>{s.lastDecision.reason}</Banner>}
      </Section>

      <PendingOrders sessionId={s.sessionId} />
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
          <button className="chip" disabled={saved || s.openTrades.length > 0 || s.pendingOrders.length > 0 || dailyLocked} onClick={() => { finishSession(father ? 'father' : 'manual', s.closedTrades, s.startBalance, dailyDate); setSaved(true) }}>
            {saved ? 'Saved' : t('saveJournal')}
          </button>
        }>
          <ClosedList trades={s.closedTrades} />
          <div className={`text-right font-bold mt-1 ${pnlColor(s.sessionPnl)}`}>Session: {inr(s.sessionPnl)}</div>
        </Section>
      )}
    </div>
  )
}
