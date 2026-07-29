import { useState } from 'react'
import { Copy, Newspaper, Plus, Trash2, Wand2 } from 'lucide-react'
import { Banner, Empty, Field, Section } from '@/components/common'
import { useToast } from '@/components/Toast'
import { CandleChart } from '@/components/CandleChart'
import { useStore } from '@/store/useStore'
import { generateSession } from '@/engines/mockMarketEngine'
import { MOCK_SYMBOLS } from '@/data/mockSymbols'
import {
  NEWS_TEMPLATES, decodeScenario, describeScenario, encodeScenario, toEventDef, type CustomScenario,
} from '@/lib/scenario'
import { shareText } from '@/lib/share'

const blank = (): CustomScenario => ({
  id: `sc-${Date.now()}`, name: 'My scenario', drift: 0.0008, volMultiplier: 1.2, gap: 0,
})

// Preview candles for whatever the sliders currently say. The news shock is applied on top of
// the generated series so the user can see the exact bar where the headline lands.
function preview(s: CustomScenario, symbol: string) {
  const session = generateSession(symbol, 'normal-trend', 90, 3)
  const ev = toEventDef(s)
  const base = MOCK_SYMBOLS.find((m) => m.symbol === symbol)?.basePrice ?? 1000

  let price = base * (1 + (ev.gap ?? 0))
  return session.candles.map((c, i) => {
    const noise = ((c.close - base) / base) * ev.volMultiplier
    const shock = s.newsAt !== undefined && i === s.newsAt ? (s.newsImpact ?? 0) : 0
    price = price * (1 + ev.drift + shock) + base * noise * 0.02
    const close = Math.max(base * 0.4, price)
    const wick = close * 0.004 * ev.volMultiplier
    return { time: c.time, open: close - wick / 2, high: close + wick, low: close - wick, close, volume: c.volume }
  })
}

export default function ScenarioLab() {
  const { customScenarios, saveScenario, deleteScenario } = useStore()
  const toast = useToast()
  const [draft, setDraft] = useState<CustomScenario | null>(null)
  const [symbol, setSymbol] = useState('INFY')
  const [code, setCode] = useState('')

  const patch = (p: Partial<CustomScenario>) => setDraft((d) => (d ? { ...d, ...p } : d))

  const importCode = () => {
    const s = decodeScenario(code)
    if (!s) return toast('That code is not valid. Codes start with BS1~', 'warn')
    setDraft(s)
    setCode('')
    toast(`Loaded "${s.name}".`)
  }

  if (!draft) {
    return (
      <div className="space-y-6">
        <Banner>
          Build the exact market you keep losing money in, then practise that specific thing. Share a
          scenario with a code so someone else faces the identical market.
        </Banner>

        <button className="btn-primary w-full flex items-center justify-center gap-2" onClick={() => setDraft(blank())}>
          <Plus size={16} /> Create a scenario
        </button>

        <Section title="Load a shared scenario">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Paste a code, e.g. BS1~..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <button className="btn-ghost !px-4" onClick={importCode} disabled={!code.trim()}>Load</button>
          </div>
        </Section>

        <Section title={`Your scenarios (${customScenarios.length})`}>
          {customScenarios.length === 0 ? (
            <Empty
              icon={<Wand2 size={30} />}
              title="No custom scenarios yet"
              body="The 25 built-in scenarios cover common market days. Build your own when you want to drill something specific — a gap down with a news shock, say."
            />
          ) : (
            <div className="space-y-2">
              {customScenarios.map((s) => (
                <div key={s.id} className="card !p-3">
                  <div className="flex items-center justify-between gap-2">
                    <button className="font-semibold text-left flex-1 truncate" onClick={() => setDraft(s)}>{s.name}</button>
                    <button
                      className="chip flex items-center gap-1"
                      onClick={async () => {
                        const r = await shareText(`Try this market on BlackScythe:\n\n${encodeScenario(s)}\n\n${describeScenario(s)}`)
                        toast(r === 'shared' ? 'Shared.' : 'Code copied.')
                      }}
                    >
                      <Copy size={11} /> share
                    </button>
                    <button className="text-muted hover:text-down" aria-label={`Delete ${s.name}`} onClick={() => { deleteScenario(s.id); toast('Deleted.', 'info') }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{describeScenario(s)}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    )
  }

  const d = draft
  const candles = preview(d, symbol)

  return (
    <div className="space-y-6">
      <Field label="Scenario name">
        <input className="input" value={d.name} onChange={(e) => patch({ name: e.target.value })} />
      </Field>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <select className="input !py-1 !w-auto text-sm" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
            {MOCK_SYMBOLS.map((m) => <option key={m.symbol} value={m.symbol}>{m.symbol}</option>)}
          </select>
          <span className="text-xs text-muted">live preview</span>
        </div>
        <CandleChart candles={candles} />
      </div>

      <Section title="Shape the market">
        <Field label={`Direction — ${d.drift > 0.0006 ? 'strong up' : d.drift > 0.0002 ? 'mild up' : d.drift < -0.0006 ? 'strong down' : d.drift < -0.0002 ? 'mild down' : 'flat'}`}>
          <input type="range" min={-0.002} max={0.002} step={0.0001} value={d.drift} onChange={(e) => patch({ drift: +e.target.value })} className="w-full accent-accent" />
        </Field>
        <Field label={`Choppiness — ${d.volMultiplier.toFixed(1)}×`}>
          <input type="range" min={0.4} max={3} step={0.1} value={d.volMultiplier} onChange={(e) => patch({ volMultiplier: +e.target.value })} className="w-full accent-accent" />
        </Field>
        <Field label={`Opening gap — ${(d.gap * 100).toFixed(1)}%`}>
          <input type="range" min={-0.05} max={0.05} step={0.002} value={d.gap} onChange={(e) => patch({ gap: +e.target.value })} className="w-full accent-accent" />
        </Field>
      </Section>

      <Section title="News shock" right={
        d.newsText
          ? <button className="chip" onClick={() => patch({ newsText: undefined, newsAt: undefined, newsImpact: undefined })}>remove</button>
          : undefined
      }>
        {d.newsText ? (
          <div className="space-y-3">
            <div className="card !p-3 flex items-start gap-2">
              <Newspaper size={15} className="text-accent shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold">{d.newsText}</div>
                <div className="text-xs text-muted">
                  lands at candle {d.newsAt} · {(d.newsImpact ?? 0) >= 0 ? '+' : ''}{((d.newsImpact ?? 0) * 100).toFixed(1)}% shock
                </div>
              </div>
            </div>
            <Field label={`Arrives at candle ${d.newsAt}`}>
              <input type="range" min={25} max={80} step={1} value={d.newsAt ?? 40} onChange={(e) => patch({ newsAt: +e.target.value })} className="w-full accent-accent" />
            </Field>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {NEWS_TEMPLATES.map((n) => (
              <button
                key={n.text}
                className="card !p-2.5 text-left text-xs hover:border-accent transition"
                onClick={() => patch({ newsText: n.text, newsImpact: n.impact, newsAt: 40 })}
              >
                <div className="font-medium leading-snug">{n.text}</div>
                <div className={n.impact >= 0 ? 'text-up mt-1' : 'text-down mt-1'}>
                  {n.impact >= 0 ? '+' : ''}{(n.impact * 100).toFixed(1)}%
                </div>
              </button>
            ))}
          </div>
        )}
      </Section>

      <Section title="In plain English">
        <Banner>{describeScenario(d)}</Banner>
      </Section>

      <div className="flex gap-3">
        <button className="btn-ghost flex-1" onClick={() => setDraft(null)}>Cancel</button>
        <button className="btn-primary flex-1" onClick={() => { saveScenario(d); setDraft(null); toast(`Saved "${d.name}".`) }}>
          Save scenario
        </button>
      </div>

      <Banner tone="warn">
        Simulated candles only. A scenario you invent is a training drill, not a forecast of any real stock.
      </Banner>
    </div>
  )
}
