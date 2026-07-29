import { useState } from 'react'
import { CandleChart } from '@/components/CandleChart'
import { Banner, Section, Stat } from '@/components/common'
import { SymbolEventPicker } from '@/components/session'
import { generateSession } from '@/engines/mockMarketEngine'
import { inr } from '@/lib/format'

export default function MarketSim() {
  const [symbol, setSymbol] = useState('INFY')
  const [event, setEvent] = useState('high-vol')
  const [seed, setSeed] = useState(0)
  const session = generateSession(symbol, event, 90, seed)
  const first = session.candles[0].open
  const last = session.candles[session.candles.length - 1].close
  const changePct = ((last - first) / first) * 100

  return (
    <div className="space-y-5">
      <Banner>Realistic Indian-market scenarios. Learn which strategy fits, and which is dangerous, before trading.</Banner>
      <SymbolEventPicker symbol={symbol} event={event} onSymbol={setSymbol} onEvent={setEvent} />
      <div className="card">
        <CandleChart candles={session.candles} height={260} />
        <button className="btn-ghost w-full mt-3" onClick={() => setSeed((s) => s + 1)}>New random session</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Move" value={`${changePct >= 0 ? '+' : ''}${changePct.toFixed(1)}%`} tone={changePct} />
        <Stat label="Volatility" value={`${session.volatilityScore}/100`} />
        <Stat label="Last" value={inr(last)} />
      </div>
      <Section title={session.event.name}>
        <div className="card space-y-2 text-sm">
          <div><span className="label">Mood</span> {session.event.mood}</div>
          <div><span className="label">Ideal strategy</span> <span className="text-up">{session.event.idealStrategy}</span></div>
          <div><span className="label">Dangerous strategy</span> <span className="text-down">{session.event.dangerousStrategy}</span></div>
          <div className="text-accent pt-1">{session.event.fatherExplanation}</div>
        </div>
      </Section>
    </div>
  )
}
