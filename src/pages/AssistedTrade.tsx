import { useMemo, useState } from 'react'
import { ShieldAlert, Sparkles } from 'lucide-react'
import { CandleChart } from '@/components/CandleChart'
import { Banner, Section, Stat } from '@/components/common'
import { ClosedList, Positions, SymbolEventPicker } from '@/components/session'
import { useSession } from '@/hooks/useSession'
import { scanCandidates } from '@/engines/assistedEngine'
import { llmDebate, type AiDebate } from '@/engines/llmCoach'
import { finishSession } from '@/lib/finish'
import { inr } from '@/lib/format'
import { useStore } from '@/store/useStore'

export default function AssistedTrade() {
  const [symbol, setSymbol] = useState('INFY')
  const [event, setEvent] = useState('it-rally')
  const [seed, setSeed] = useState(0)
  const [saved, setSaved] = useState(false)
  const s = useSession(symbol, event, 'assisted', seed)
  const start = useStore((st) => st.balance)
  const llm = useStore((st) => st.llm)
  const [aiDebates, setAiDebates] = useState<Record<string, AiDebate | 'loading' | 'failed'>>({})

  const candidates = useMemo(() => scanCandidates(s.session.candles, s.idx), [s.session, s.idx])

  const runAiDebate = async (i: number) => {
    const c = candidates[i]
    const key = `${s.idx}-${c.signal.strategyId}`
    setAiDebates((d) => ({ ...d, [key]: 'loading' }))
    const result = await llmDebate(
      {
        strategyName: c.strategyName,
        action: c.signal.action,
        entry: c.signal.entry,
        stopLoss: c.signal.stopLoss,
        target: c.signal.target,
        reason: c.signal.reason,
        marketEvent: s.session.event.name,
      },
      llm,
    )
    setAiDebates((d) => ({ ...d, [key]: result ?? 'failed' }))
  }

  const approve = (i: number) => {
    const c = candidates[i]
    const qty = Math.max(1, Math.floor((start * 0.05) / c.signal.entry))
    s.place({
      symbol, side: c.signal.action as 'buy' | 'sell', type: 'market', qty,
      stopLoss: c.signal.stopLoss, target: c.signal.target, strategyTag: c.signal.strategyId,
    })
  }

  return (
    <div className="space-y-6">
      <Banner>AI suggests trades, you approve or reject. Nothing trades without your tap. Mock money.</Banner>
      <SymbolEventPicker symbol={symbol} event={event} onSymbol={setSymbol} onEvent={(e) => { setEvent(e); setSeed((x) => x + 1); setSaved(false) }} />

      <div className="card">
        <div className="flex justify-between mb-2">
          <div className="font-bold">{symbol} <span className="text-muted font-normal">{inr(s.price)}</span></div>
          <div className="text-xs text-muted">candle {s.idx + 1}/{s.session.candles.length}</div>
        </div>
        <CandleChart candles={s.visible} />
        <button className="btn-ghost w-full mt-3" onClick={s.step} disabled={s.atEnd}>Next candle (rescan)</button>
      </div>

      <Section title="AI trade candidates">
        {candidates.length === 0 && <div className="text-sm text-muted">No safe setups right now. Waiting is fine. Advance the market.</div>}
        {candidates.map((c, i) => (
          <div key={i} className="card space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{c.strategyName}
                <span className={`chip ml-2 ${c.signal.action === 'buy' ? '!text-up' : '!text-down'}`}>{c.signal.action}</span>
              </div>
              <span className="chip">conf {(c.signal.confidence * 100).toFixed(0)}%</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div><span className="label">Entry</span><div>{inr(c.signal.entry)}</div></div>
              <div><span className="label">Stop</span><div className="text-down">{inr(c.signal.stopLoss)}</div></div>
              <div><span className="label">Target</span><div className="text-up">{inr(c.signal.target)}</div></div>
            </div>
            {/* Analyst debate, borrowed from the TradingAgents multi-agent pattern.
                Rule-based by default; a real LLM debate on demand when an AI key is configured. */}
            {(() => {
              const ai = aiDebates[`${s.idx}-${c.signal.strategyId}`]
              if (ai && ai !== 'loading' && ai !== 'failed') {
                return (
                  <div className="rounded-xl bg-panel2 border border-accent/40 p-2 space-y-1 text-xs">
                    <div className="flex items-center gap-1 text-accent font-semibold"><Sparkles size={11} /> AI analyst debate</div>
                    <div><span className="text-up font-semibold">Bull:</span> {ai.bull}</div>
                    <div><span className="text-down font-semibold">Bear:</span> {ai.bear}</div>
                    <div><span className="text-warn font-semibold">Risk:</span> {ai.risk}</div>
                    <div><span className="text-accent font-semibold">Verdict:</span> {ai.verdict}</div>
                  </div>
                )
              }
              return (
                <div className="rounded-xl bg-panel2 border border-edge p-2 space-y-1 text-xs">
                  <div><span className="text-up font-semibold">Bull:</span> {c.debate.bull}</div>
                  <div><span className="text-down font-semibold">Bear:</span> {c.debate.bear}</div>
                  <div><span className="text-accent font-semibold">Technical:</span> {c.debate.technical}</div>
                  <div><span className="text-warn font-semibold">Risk:</span> {c.debate.risk}</div>
                  {llm.enabled && (
                    <button className="chip !text-accent mt-1" disabled={ai === 'loading'} onClick={() => runAiDebate(i)}>
                      {ai === 'loading' ? 'AI analysts thinking...' : ai === 'failed' ? 'AI unavailable, retry?' : 'Run AI analyst debate'}
                    </button>
                  )}
                </div>
              )
            })()}
            <div className="text-xs text-muted">Why it may fail: {c.whyItMayFail}</div>
            <div className="text-xs text-accent">Coach: {c.father}</div>
            <div className="flex gap-2">
              <button className="btn-up flex-1" onClick={() => approve(i)}>Approve</button>
              <button className="btn-ghost flex-1">Reject</button>
            </div>
          </div>
        ))}
        {s.lastDecision && !s.lastDecision.allow && (
          <Banner tone="warn"><ShieldAlert size={14} className="inline mr-1" />{s.lastDecision.reason}</Banner>
        )}
      </Section>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Open P/L" value={inr(s.openPnl)} tone={s.openPnl} />
        <Stat label="Closed P/L" value={inr(s.sessionPnl)} tone={s.sessionPnl} />
        <Stat label="Positions" value={String(s.openTrades.length)} />
      </div>

      <Section title="Open positions"><Positions trades={s.openTrades} price={s.price} onExit={s.exit} /></Section>

      {s.closedTrades.length > 0 && (
        <Section title="Closed" right={
          <button className="chip" disabled={saved} onClick={() => { finishSession('assisted', s.closedTrades, start - s.sessionPnl); setSaved(true) }}>
            {saved ? 'Saved' : 'Save to journal'}
          </button>
        }>
          <ClosedList trades={s.closedTrades} />
        </Section>
      )}
    </div>
  )
}
