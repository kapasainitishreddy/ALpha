import { useState } from 'react'
import { Banner, Section } from '@/components/common'
import { STRATEGY_DOCS, type StrategyDoc } from '@/data/strategyDocs'

const CATS: { id: StrategyDoc['category']; label: string }[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'quant', label: 'Quant / Bot' },
  { id: 'ai', label: 'AI' },
]

export default function StrategyLab() {
  const [cat, setCat] = useState<StrategyDoc['category']>('beginner')
  const [open, setOpen] = useState<string | null>(null)
  const list = STRATEGY_DOCS.filter((s) => s.category === cat)

  return (
    <div className="space-y-4">
      <Banner>{STRATEGY_DOCS.length} strategies. Each shows when it works, when it fails, and a Father-Mode explanation.</Banner>
      <div className="flex gap-2">
        {CATS.map((c) => (
          <button key={c.id} className={`chip ${cat === c.id ? '!border-accent !text-accent' : ''}`} onClick={() => setCat(c.id)}>{c.label}</button>
        ))}
      </div>
      <Section title={`${list.length} strategies`}>
        <div className="space-y-2">
          {list.map((d) => (
            <div key={d.id} className="card">
              <button className="w-full text-left" onClick={() => setOpen(open === d.id ? null : d.id)}>
                <div className="flex justify-between">
                  <span className="font-semibold">{d.name}</span>
                  <span className="chip">{d.type}</span>
                </div>
                <div className="text-xs text-muted mt-1">{d.beginner}</div>
              </button>
              {open === d.id && (
                <div className="mt-3 space-y-1 text-sm border-t border-edge pt-3">
                  <Row k="Best market" v={d.bestMarket} />
                  <Row k="Bad market" v={d.badMarket} />
                  <Row k="Entry" v={d.entry} />
                  <Row k="Exit" v={d.exit} />
                  <Row k="Stop loss" v={d.stopLoss} />
                  <Row k="Target" v={d.target} />
                  <Row k="Risk/reward" v={d.riskReward} />
                  <div className="text-accent text-xs pt-1">{d.father}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex gap-2"><span className="label w-24 shrink-0">{k}</span><span>{v}</span></div>
}
