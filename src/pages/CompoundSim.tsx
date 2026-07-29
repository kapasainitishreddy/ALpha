import { useState } from 'react'
import { Banner, Field, Section, Stat } from '@/components/common'
import { Sparkline } from '@/components/Sparkline'
import { CHALLENGES, projectCompound } from '@/engines/compoundSimulator'
import { inr } from '@/lib/format'

export default function CompoundSim() {
  const [id, setId] = useState('c500')
  const [daily, setDaily] = useState(2)
  const ch = CHALLENGES.find((c) => c.id === id)!
  const [target, setTarget] = useState<'safe' | 'aggressive'>('safe')
  const goal = target === 'safe' ? ch.safeTarget : ch.aggressiveTarget
  const proj = projectCompound(ch.start, daily, goal)

  return (
    <div className="space-y-5">
      <Banner tone="warn">A mock projection of compounding. Real markets can lose money, steady daily returns are not guaranteed.</Banner>

      <Field label="Challenge">
        <select className="input" value={id} onChange={(e) => setId(e.target.value)}>
          {CHALLENGES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Start" value={inr(ch.start)} />
        <Stat label="Safe target" value={inr(ch.safeTarget)} />
        <Stat label="Aggressive" value={inr(ch.aggressiveTarget)} />
      </div>

      <div className="flex gap-2">
        <button className={`chip ${target === 'safe' ? '!border-up !text-up' : ''}`} onClick={() => setTarget('safe')}>Safe target</button>
        <button className={`chip ${target === 'aggressive' ? '!border-warn !text-warn' : ''}`} onClick={() => setTarget('aggressive')}>Aggressive target</button>
      </div>

      <Field label={`Assumed daily return: ${daily}%`}>
        <input type="range" min={0.5} max={5} step={0.5} value={daily} onChange={(e) => setDaily(+e.target.value)} className="w-full" />
      </Field>

      <div className="card">
        <Sparkline data={proj.path.map((p) => p.balance)} />
        <div className="text-sm mt-2">
          {proj.reachedTargetDay !== undefined
            ? `Reaches ${inr(goal)} in ~${proj.reachedTargetDay} mock days at ${daily}%/day. App stops at target.`
            : `Did not reach ${inr(goal)} within 30 mock days at ${daily}%/day.`}
        </div>
      </div>

      {(proj.warning || target === 'aggressive') && (
        <Banner tone="warn">{proj.warning ?? ch.note}</Banner>
      )}
    </div>
  )
}
