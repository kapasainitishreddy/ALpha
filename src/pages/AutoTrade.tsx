import { useState } from 'react'
import { Banner, Field, Section, Stat } from '@/components/common'
import { ClosedList, SymbolEventPicker } from '@/components/session'
import { CandleChart } from '@/components/CandleChart'
import { generateSession } from '@/engines/mockMarketEngine'
import { scanCandidates } from '@/engines/assistedEngine'
import { evaluateRisk } from '@/engines/riskGuardEngine'
import { closeTrade, feeFor, fillPrice, hitStopOrTarget } from '@/engines/tradeEngine'
import { finishSession } from '@/lib/finish'
import { inr, pnlColor } from '@/lib/format'
import { RISK_LIMITS } from '@/data/riskRules'
import type { RiskLevel, Trade } from '@/types'

// AI auto trading runs the whole session in mock mode only. Risk Guard + stop conditions enforced each bar.
export default function AutoTrade() {
  const [symbol, setSymbol] = useState('INFY')
  const [event, setEvent] = useState('news-rally')
  const [capital, setCapital] = useState(1000)
  const [risk, setRisk] = useState<RiskLevel>('low')
  const [saved, setSaved] = useState(false)
  const [result, setResult] = useState<{ closed: Trade[]; pnl: number; stopped?: string; visible: ReturnType<typeof generateSession>['candles'] } | null>(null)

  const run = () => {
    const session = generateSession(symbol, event, 120)
    const { candles } = session
    const closed: Trade[] = []
    let open: Trade | null = null
    let dailyPnl = 0
    let consecutiveLosses = 0
    let stopped: string | undefined
    const sizeFactor = risk === 'low' ? 0.03 : risk === 'medium' ? 0.05 : 0.07

    for (let i = 20; i < candles.length; i++) {
      const price = candles[i].close
      if (dailyPnl <= -RISK_LIMITS.dailyLossFraction * capital) { stopped = 'Daily loss limit reached, auto stopped.'; break }
      if (dailyPnl >= RISK_LIMITS.targetProfitFraction * capital) { stopped = 'Daily target reached, auto stopped.'; break }

      if (open) {
        const hit = hitStopOrTarget(open, price)
        if (hit) {
          const c = closeTrade(open, hit === 'stop' ? open.stopLoss! : open.target!)
          const p = c.realizedPnl ?? 0
          dailyPnl += p
          consecutiveLosses = p < 0 ? consecutiveLosses + 1 : 0
          closed.push(c)
          open = null
        }
        continue
      }
      const cand = scanCandidates(candles, i, 1)[0]
      if (!cand) continue
      const qty = Math.max(1, Math.floor((capital * sizeFactor) / price))
      const decision = evaluateRisk({
        mode: 'auto', balance: capital, tradeValue: qty * price, entry: price, side: cand.signal.action as 'buy' | 'sell',
        stopLoss: cand.signal.stopLoss, target: cand.signal.target, marketMood: session.event.mood,
        consecutiveLosses, dailyPnl, tradesToday: closed.length,
      })
      if (!decision.allow) continue
      const entry = fillPrice(price, cand.signal.action as 'buy' | 'sell')
      open = {
        id: `auto${i}`, symbol, side: cand.signal.action as 'buy' | 'sell', qty, entryPrice: entry,
        stopLoss: cand.signal.stopLoss, target: cand.signal.target, status: 'open', openedAt: i,
        fees: feeFor(entry * qty), strategyTag: cand.signal.strategyId, mode: 'auto',
      }
    }
    if (open) { const c = closeTrade(open, candles[candles.length - 1].close); dailyPnl += c.realizedPnl ?? 0; closed.push(c) }
    setResult({ closed, pnl: dailyPnl, stopped, visible: candles })
    setSaved(false)
  }

  return (
    <div className="space-y-6">
      <Banner tone="warn">AI trades <b>fake money only</b>. Real-money auto-trading is disabled. Risk Guard can stop it any time.</Banner>
      <SymbolEventPicker symbol={symbol} event={event} onSymbol={setSymbol} onEvent={setEvent} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Mock capital ₹">
          <input className="input" type="number" min={100} step={100} value={capital} onChange={(e) => setCapital(Math.max(100, +e.target.value))} />
        </Field>
        <Field label="Risk level">
          <select className="input" value={risk} onChange={(e) => setRisk(e.target.value as RiskLevel)}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </Field>
      </div>
      <button className="btn-primary w-full" onClick={run}>Run AI auto session (mock)</button>

      {result && (
        <>
          <div className="card"><CandleChart candles={result.visible} /></div>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Session P/L" value={inr(result.pnl)} tone={result.pnl} />
            <Stat label="Trades" value={String(result.closed.length)} />
            <Stat label="Win rate" value={`${result.closed.length ? Math.round(result.closed.filter((t) => (t.realizedPnl ?? 0) > 0).length / result.closed.length * 100) : 0}%`} />
          </div>
          {result.stopped && <Banner tone="warn">{result.stopped}</Banner>}
          <Section title="Trades" right={
            <button className="chip" disabled={saved} onClick={() => { finishSession('auto', result.closed, capital); setSaved(true) }}>
              {saved ? 'Saved' : 'Save to journal'}
            </button>
          }>
            <ClosedList trades={result.closed} />
            <div className={`text-right font-bold mt-1 ${pnlColor(result.pnl)}`}>Total: {inr(result.pnl)}</div>
          </Section>
        </>
      )}
    </div>
  )
}
