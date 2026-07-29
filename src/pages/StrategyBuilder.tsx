import { useMemo, useState } from 'react'
import { FlaskConical, Info, Plus, Trash2, Wand2 } from 'lucide-react'
import { Banner, Empty, Field, Section, Stat } from '@/components/common'
import { useToast } from '@/components/Toast'
import { useStore } from '@/store/useStore'
import { INDICATORS, describe, evaluateCustom, type CustomStrategy, type IndicatorId, type Rule } from '@/lib/customStrategy'
import { generateSession } from '@/engines/mockMarketEngine'
import { MARKET_EVENTS } from '@/data/marketEvents'
import { pnlColor } from '@/lib/format'

const IDS = Object.keys(INDICATORS) as IndicatorId[]

// Ready-made starting points. Copying one and tweaking it teaches faster than a blank form.
const TEMPLATES: { name: string; blurb: string; make: () => Omit<CustomStrategy, 'id'> }[] = [
  {
    name: 'Oversold bounce',
    blurb: 'Buy panic, sell relief.',
    make: () => ({ name: 'Oversold bounce', side: 'buy', stopPct: 1.5, targetPct: 3, rules: [{ indicator: 'rsi', op: '<', value: 32 }] }),
  },
  {
    name: 'Trend rider',
    blurb: 'Only buy what is already going up.',
    make: () => ({ name: 'Trend rider', side: 'buy', stopPct: 1.5, targetPct: 4, rules: [{ indicator: 'priceVsEma20', op: '>', value: 0 }, { indicator: 'change3', op: '>', value: 0.3 }] }),
  },
  {
    name: 'Volume breakout',
    blurb: 'New high, backed by real buying.',
    make: () => ({ name: 'Volume breakout', side: 'buy', stopPct: 2, targetPct: 4, rules: [{ indicator: 'priceVsHigh20', op: '>', value: 0 }, { indicator: 'volumeVsAvg', op: '>', value: 1.4 }] }),
  },
]

// Quick backtest across several market types — a strategy that only works on one is a fluke.
function quickTest(strategy: CustomStrategy) {
  const events = ['normal-trend', 'sideways', 'high-vol', 'real-breakout', 'panic-selloff']
  let trades = 0
  let wins = 0
  let pnlPct = 0

  for (const ev of events) {
    const { candles } = generateSession('INFY', ev, 120, 7)
    let open: { entry: number; stop: number; target: number; side: 'buy' | 'sell' } | null = null
    for (let i = 20; i < candles.length; i++) {
      const price = candles[i].close
      if (open) {
        const hitStop = open.side === 'buy' ? price <= open.stop : price >= open.stop
        const hitTarget = open.side === 'buy' ? price >= open.target : price <= open.target
        if (hitStop || hitTarget) {
          const dir = open.side === 'buy' ? 1 : -1
          const exit = hitStop ? open.stop : open.target
          pnlPct += ((exit - open.entry) / open.entry) * 100 * dir
          trades++
          if (hitTarget) wins++
          open = null
        }
        continue
      }
      const sig = evaluateCustom(strategy, candles, i)
      if (sig.action !== 'hold') open = { entry: sig.entry, stop: sig.stopLoss, target: sig.target, side: sig.action }
    }
  }

  return { trades, wins, pnlPct, winRate: trades ? (wins / trades) * 100 : 0, markets: events.length }
}

export default function StrategyBuilder() {
  const { customStrategies, saveStrategy, deleteStrategy } = useStore()
  const toast = useToast()
  const [draft, setDraft] = useState<CustomStrategy | null>(null)

  const result = useMemo(() => (draft ? quickTest(draft) : null), [draft])

  const startBlank = () =>
    setDraft({ id: `custom-${Date.now()}`, name: 'My strategy', side: 'buy', stopPct: 1.5, targetPct: 3, rules: [] })

  const patch = (p: Partial<CustomStrategy>) => setDraft((d) => (d ? { ...d, ...p } : d))
  const setRule = (i: number, r: Partial<Rule>) =>
    setDraft((d) => (d ? { ...d, rules: d.rules.map((x, j) => (j === i ? { ...x, ...r } : x)) } : d))

  const addRule = () =>
    setDraft((d) => {
      if (!d) return d
      const unused = IDS.find((id) => !d.rules.some((r) => r.indicator === id)) ?? IDS[0]
      return { ...d, rules: [...d.rules, { indicator: unused, op: '<', value: INDICATORS[unused].default }] }
    })

  if (!draft) {
    return (
      <div className="space-y-6">
        <Banner>
          Build a strategy from plain rules, test it across five market types, and run it in the Backtest
          Lab. No code. The point isn't a perfect strategy — it's seeing why most rules stop working when
          the market changes.
        </Banner>

        <Section title="Start from a template">
          <div className="space-y-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                className="card w-full text-left !p-4 hover:border-accent transition"
                onClick={() => setDraft({ ...t.make(), id: `custom-${Date.now()}` })}
              >
                <div className="flex items-center gap-2">
                  <Wand2 size={15} className="text-accent shrink-0" />
                  <span className="font-semibold">{t.name}</span>
                </div>
                <div className="text-xs text-muted mt-1">{t.blurb}</div>
              </button>
            ))}
            <button className="btn-ghost w-full flex items-center justify-center gap-2" onClick={startBlank}>
              <Plus size={16} /> Start from scratch
            </button>
          </div>
        </Section>

        <Section title={`Your strategies (${customStrategies.length})`}>
          {customStrategies.length === 0 ? (
            <Empty
              icon={<FlaskConical size={30} />}
              title="Nothing saved yet"
              body="Pick a template above, adjust a rule or two, and save it. Saved strategies show up as a tag you can attach to trades."
            />
          ) : (
            <div className="space-y-2">
              {customStrategies.map((s) => (
                <div key={s.id} className="card !p-3">
                  <div className="flex items-center justify-between gap-2">
                    <button className="font-semibold text-left flex-1 min-w-0 truncate" onClick={() => setDraft(s)}>
                      {s.name}
                    </button>
                    <button
                      className="text-muted hover:text-down shrink-0"
                      aria-label={`Delete ${s.name}`}
                      onClick={() => { deleteStrategy(s.id); toast(`Deleted "${s.name}".`, 'info') }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{describe(s)}</p>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    )
  }

  const d = draft
  return (
    <div className="space-y-6">
      <Field label="Strategy name">
        <input className="input" value={d.name} onChange={(e) => patch({ name: e.target.value })} />
      </Field>

      <Section title="Direction">
        <div className="flex gap-2">
          <button className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${d.side === 'buy' ? 'bg-up text-bg' : 'bg-panel2 text-muted border border-edge'}`} onClick={() => patch({ side: 'buy' })}>
            Buy (go long)
          </button>
          <button className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${d.side === 'sell' ? 'bg-down text-bg' : 'bg-panel2 text-muted border border-edge'}`} onClick={() => patch({ side: 'sell' })}>
            Sell (go short)
          </button>
        </div>
      </Section>

      <Section title="Entry rules — all must be true" right={
        <button className="chip flex items-center gap-1 !text-accent !border-accent/40" onClick={addRule}>
          <Plus size={12} /> add
        </button>
      }>
        {d.rules.length === 0 ? (
          <Empty
            title="No rules yet"
            body="A strategy with no rules never trades. Add at least one condition that has to be true before you buy."
            action={<button className="btn-primary" onClick={addRule}>Add first rule</button>}
          />
        ) : (
          <div className="space-y-2">
            {d.rules.map((r, i) => {
              const def = INDICATORS[r.indicator]
              return (
                <div key={i} className="card !p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <select
                      className="input !py-1.5 text-sm flex-1"
                      value={r.indicator}
                      onChange={(e) => {
                        const id = e.target.value as IndicatorId
                        setRule(i, { indicator: id, value: INDICATORS[id].default })
                      }}
                    >
                      {IDS.map((id) => <option key={id} value={id}>{INDICATORS[id].label}</option>)}
                    </select>
                    <button
                      className="text-muted hover:text-down shrink-0 pt-2"
                      aria-label="Remove rule"
                      onClick={() => patch({ rules: d.rules.filter((_, j) => j !== i) })}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {(['<', '>'] as const).map((op) => (
                        <button
                          key={op}
                          className={`w-10 rounded-lg py-1.5 text-sm font-bold ${r.op === op ? 'bg-accent text-bg' : 'bg-panel2 text-muted border border-edge'}`}
                          onClick={() => setRule(i, { op })}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                    <input
                      className="input !py-1.5 text-sm flex-1"
                      type="number"
                      step={def.step}
                      value={r.value}
                      onChange={(e) => setRule(i, { value: +e.target.value })}
                    />
                    {def.unit && <span className="text-xs text-muted w-4">{def.unit}</span>}
                  </div>

                  <p className="flex gap-1.5 text-[11px] text-muted leading-relaxed">
                    <Info size={12} className="shrink-0 mt-0.5 text-accent" />
                    {def.hint}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </Section>

      <Section title="Exit rules">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Stop loss %">
            <input className="input" type="number" step={0.1} min={0.1} value={d.stopPct} onChange={(e) => patch({ stopPct: Math.max(0.1, +e.target.value) })} />
          </Field>
          <Field label="Target %">
            <input className="input" type="number" step={0.1} min={0.1} value={d.targetPct} onChange={(e) => patch({ targetPct: Math.max(0.1, +e.target.value) })} />
          </Field>
        </div>
        <p className="text-xs text-muted">
          Reward to risk: <b className={d.targetPct / d.stopPct >= 2 ? 'text-up' : d.targetPct / d.stopPct >= 1 ? 'text-warn' : 'text-down'}>
            {(d.targetPct / d.stopPct).toFixed(2)} : 1
          </b>{' '}
          {d.targetPct / d.stopPct < 1 && '— you risk more than you stand to make.'}
        </p>
      </Section>

      <Section title="In plain English">
        <Banner>{describe(d)}</Banner>
      </Section>

      {result && (
        <Section title="Quick test — 5 market types">
          {result.trades === 0 ? (
            <Banner tone="warn">
              This never triggered across {result.markets} different markets. Your rules are too strict —
              loosen a threshold, or drop a condition.
            </Banner>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Trades" value={String(result.trades)} />
                <Stat label="Win rate" value={`${result.winRate.toFixed(0)}%`} />
                <Stat label="Total move" value={`${result.pnlPct >= 0 ? '+' : ''}${result.pnlPct.toFixed(1)}%`} tone={result.pnlPct} />
              </div>
              <p className={`text-xs leading-relaxed ${pnlColor(result.pnlPct)}`}>
                {result.pnlPct > 0
                  ? `Profitable across mixed conditions on simulated data. That is a starting point, not proof — run it in the Backtest Lab on individual scenarios to see where it breaks.`
                  : `Lost money across mixed conditions. Most rule sets do. Try a wider target, a tighter entry, or a different market type.`}
              </p>
            </>
          )}
          <p className="text-[11px] text-muted">
            Simulated candles, no fees or slippage. Real results would be worse.
          </p>
        </Section>
      )}

      <div className="flex gap-3">
        <button className="btn-ghost flex-1" onClick={() => setDraft(null)}>Cancel</button>
        <button
          className="btn-primary flex-1"
          disabled={!d.rules.length || !d.name.trim()}
          onClick={() => { saveStrategy(d); setDraft(null); toast(`Saved "${d.name}".`) }}
        >
          Save strategy
        </button>
      </div>
    </div>
  )
}
