import { useState } from 'react'
import { Banner, Field, Section, Stat } from '@/components/common'
import { Sparkline } from '@/components/Sparkline'
import { runBacktest } from '@/engines/backtestEngine'
import { STRATEGY_DOCS } from '@/data/strategyDocs'
import { MOCK_SYMBOLS } from '@/data/mockSymbols'
import { MARKET_EVENTS } from '@/data/marketEvents'
import { inr } from '@/lib/format'
import type { BacktestResult } from '@/types'

export default function BacktestLab() {
  const [strategy, setStrategy] = useState('ema-trend')
  const [symbol, setSymbol] = useState('INFY')
  const [event, setEvent] = useState('normal-trend')
  const [res, setRes] = useState<BacktestResult | null>(null)

  return (
    <div className="space-y-5">
      <Banner tone="warn">Backtests do not guarantee real results. Mock data only.</Banner>
      <div className="grid grid-cols-1 gap-3">
        <Field label="Strategy">
          <select className="input" value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            {STRATEGY_DOCS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Symbol">
            <select className="input" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              {MOCK_SYMBOLS.map((s) => <option key={s.symbol} value={s.symbol}>{s.symbol}</option>)}
            </select>
          </Field>
          <Field label="Scenario">
            <select className="input" value={event} onChange={(e) => setEvent(e.target.value)}>
              {MARKET_EVENTS.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </Field>
        </div>
      </div>
      <button className="btn-primary w-full" onClick={() => setRes(runBacktest(strategy, symbol, event))}>Run backtest</button>

      {res && (
        <>
          <div className="card">
            <div className="label mb-1">Equity curve (mock)</div>
            <Sparkline data={res.equityCurve} />
            <div className="flex justify-between text-xs text-muted mt-1">
              <span>{inr(res.startBalance)}</span><span>{inr(res.endBalance)}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Return" value={`${res.totalReturnPct >= 0 ? '+' : ''}${res.totalReturnPct}%`} tone={res.totalReturnPct} />
            <Stat label="Win rate" value={`${res.winRatePct}%`} />
            <Stat label="Trades" value={String(res.trades)} />
            <Stat label="Profit factor" value={String(res.profitFactor)} />
            <Stat label="Max DD" value={`${res.maxDrawdownPct}%`} />
            <Stat label="Worst streak" value={String(res.worstLosingStreak)} />
            <Stat label="Best trade" value={inr(res.bestTradePnl)} tone={res.bestTradePnl} />
            <Stat label="Worst trade" value={inr(res.worstTradePnl)} tone={res.worstTradePnl} />
            <Stat label="Fees" value={inr(res.feesPaid)} />
          </div>
          <Section title="AI read"><div className="card text-sm">{res.aiExplanation}</div></Section>
          <Banner>{res.fatherExplanation}</Banner>
        </>
      )}
    </div>
  )
}
