import { useState } from 'react'
import { CheckCircle2, Info, MinusCircle, TriangleAlert } from 'lucide-react'
import { Banner, Field, Section, Stat } from '@/components/common'
import { SymbolEventPicker } from '@/components/session'
import { SpeakButton } from '@/components/SpeakButton'
import { runSwarm } from '@/engines/strategySwarmEngine'
import { DEFAULT_SWARM } from '@/agents/registry'
import { getEvent } from '@/data/marketEvents'
import { explainAgent, explainSwarm } from '@/lib/explainSwarm'
import { finishSession } from '@/lib/finish'
import { useToast } from '@/components/Toast'
import { inr, pnlColor } from '@/lib/format'
import type { SwarmResult } from '@/types'

export default function Swarm() {
  const toast = useToast()
  const [symbol, setSymbol] = useState('INFY')
  const [event, setEvent] = useState('real-breakout')
  const [capital, setCapital] = useState(50000)
  const [res, setRes] = useState<SwarmResult | null>(null)
  const [saved, setSaved] = useState(false)

  const run = () => { setRes(runSwarm({ capital, symbol, eventId: event, specs: DEFAULT_SWARM })); setSaved(false) }

  const ev = getEvent(event)
  const explain = res ? explainSwarm(res, ev) : null
  const allLost = res ? res.agents.every((a) => a.pnl <= 0) : false

  return (
    <div className="space-y-6">
      <Banner>
        Five different strategies trade the same market at the same time, with your mock capital split
        between them. The point is to see them disagree — not to find a winner.
      </Banner>

      <SymbolEventPicker symbol={symbol} event={event} onSymbol={setSymbol} onEvent={setEvent} />
      <Field label="Mock capital ₹">
        <input className="input" type="number" min={100} step={1000} value={capital} onChange={(e) => setCapital(Math.max(100, +e.target.value))} />
        <p className="text-xs text-muted mt-1">Use ₹50,000+ for best results — agents need enough to buy shares.</p>
      </Field>
      <button className="btn-primary w-full" onClick={run}>
        {res ? 'Run again' : 'Run Strategy Swarm'}
      </button>

      {res && explain && (
        <>
          {/* Plain-English verdict comes FIRST — the numbers below only make sense after it. */}
          <div className={`card !p-4 space-y-2 ${res.totalPnl > 0 ? 'border-up/50' : res.totalPnl < 0 ? 'border-down/50' : ''}`}>
            <div className="flex items-start justify-between gap-2">
              <h2 className={`font-bold ${pnlColor(res.totalPnl)}`}>{explain.verdict}</h2>
              <SpeakButton text={`${explain.verdict} ${explain.detail} ${explain.lesson}`} label="Listen" />
            </div>
            <p className="text-sm text-muted leading-relaxed">{explain.detail}</p>
          </div>

          <div className="card !p-3 space-y-2">
            {explain.bullets.map((b, i) => (
              <p key={i} className="flex gap-2 text-xs text-muted leading-relaxed">
                <Info size={13} className="shrink-0 mt-0.5 text-accent" />{b}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Stat label="Total P/L" value={inr(res.totalPnl)} tone={res.totalPnl} />
            <Stat label="Ending" value={inr(res.endingCapital)} />
            <Stat label="Kept in cash" value={inr(res.cashReserve)} />
          </div>

          {res.stoppedReason && <Banner tone="warn">{res.stoppedReason}</Banner>}

          <Section title="What each strategy did">
            <div className="space-y-2">
              {res.agents.map((a) => {
                const isBest = a.config.id === res.bestAgentId
                const isWorst = a.config.id === res.worstAgentId
                const e = explainAgent(a, ev, isBest, isWorst, allLost)
                return (
                  <div key={a.config.id} className={`card !p-3 space-y-1.5 ${isBest ? 'border-up/50' : isWorst ? 'border-down/50' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm flex items-center gap-1.5 min-w-0">
                        <span className="truncate">{a.config.name.replace(/ Agent$/, '')}</span>
                        {e.suited === 'ideal' && (
                          <span className="chip !text-up !border-up/40 shrink-0 flex items-center gap-0.5">
                            <CheckCircle2 size={9} /> suits this market
                          </span>
                        )}
                        {e.suited === 'dangerous' && (
                          <span className="chip !text-warn !border-warn/40 shrink-0 flex items-center gap-0.5">
                            <TriangleAlert size={9} /> wrong tool here
                          </span>
                        )}
                        {!a.trades.length && (
                          <span className="chip shrink-0 flex items-center gap-0.5"><MinusCircle size={9} /> sat out</span>
                        )}
                      </span>
                      <span className={`font-bold shrink-0 ${pnlColor(a.pnl)}`}>{inr(a.pnl)}</span>
                    </div>
                    <div className="text-xs font-medium">{e.headline}</div>
                    <p className="text-xs text-muted leading-relaxed">{e.why}</p>
                    <div className="text-[10px] text-muted pt-1 border-t border-edge">
                      given {inr(a.config.allocation)} to trade with · {a.config.riskLevel} risk
                      {a.blockedTrades > 0 && ` · ${a.blockedTrades} order${a.blockedTrades === 1 ? '' : 's'} blocked by Risk Guard`}
                    </div>
                  </div>
                )
              })}
            </div>
          </Section>

          <Banner tone={res.totalPnl >= 0 ? 'info' : 'warn'}>{explain.lesson}</Banner>

          <button
            className="btn-ghost w-full"
            disabled={saved}
            onClick={() => {
              finishSession('swarm', res.agents.flatMap((a) => a.trades), capital)
              setSaved(true)
              toast('Saved to journal.')
            }}
          >
            {saved ? 'Saved to journal' : 'Save this session to journal'}
          </button>
        </>
      )}
    </div>
  )
}
