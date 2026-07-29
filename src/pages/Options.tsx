import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Info, TriangleAlert } from 'lucide-react'
import { Banner, Field, Section, Stat } from '@/components/common'
import { MOCK_SYMBOLS } from '@/data/mockSymbols'
import { maxLoss, payoffCurve, priceOption, strikeLadder, type OptType } from '@/lib/options'
import { inr, pnlColor } from '@/lib/format'

// Indian lot sizes are instrument-specific; these are illustrative round numbers, not exchange data.
const LOT: Record<string, number> = { NIFTY50: 75, BANKNIFTY: 35, RELIANCE: 500, TCS: 175, INFY: 400, HDFCBANK: 550 }
const OPTIONABLE = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK']

function PayoffChart({ points, spot, breakeven }: { points: { price: number; pnl: number }[]; spot: number; breakeven: number }) {
  const W = 300
  const H = 120
  const pnls = points.map((p) => p.pnl)
  const min = Math.min(...pnls)
  const max = Math.max(...pnls)
  const span = max - min || 1
  const xs = points.map((p) => p.price)
  const xMin = Math.min(...xs)
  const xSpan = Math.max(...xs) - xMin || 1

  const x = (p: number) => ((p - xMin) / xSpan) * W
  const y = (v: number) => H - ((v - min) / span) * H
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.price)} ${y(p.pnl)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Profit and loss at expiry across prices">
      <line x1="0" y1={y(0)} x2={W} y2={y(0)} stroke="#30363d" strokeDasharray="3 3" />
      <line x1={x(spot)} y1="0" x2={x(spot)} y2={H} stroke="#4da3ff" strokeWidth="1" opacity="0.5" />
      <line x1={x(breakeven)} y1="0" x2={x(breakeven)} y2={H} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      <path d={d} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

export default function Options() {
  const [symbol, setSymbol] = useState('NIFTY50')
  const [type, setType] = useState<OptType>('call')
  const [days, setDays] = useState(7)
  const [iv, setIv] = useState(18)
  const [lots, setLots] = useState(1)
  const [strike, setStrike] = useState<number | null>(null)

  const spot = MOCK_SYMBOLS.find((m) => m.symbol === symbol)?.basePrice ?? 1000
  const lotSize = LOT[symbol] ?? 100
  const ladder = useMemo(() => strikeLadder(spot), [spot])
  const active = strike ?? ladder[Math.floor(ladder.length / 2)]

  const chain = useMemo(
    () => ladder.map((k) => ({ call: priceOption(spot, k, 'call', days, iv), put: priceOption(spot, k, 'put', days, iv) })),
    [ladder, spot, days, iv],
  )
  const q = useMemo(() => priceOption(spot, active, type, days, iv), [spot, active, type, days, iv])
  const curve = useMemo(() => payoffCurve(q, lots, lotSize, spot), [q, lots, lotSize, spot])
  const cost = q.premium * lots * lotSize
  const movePct = ((q.breakeven - spot) / spot) * 100

  return (
    <div className="space-y-6">
      <Banner tone="warn">
        <b>Options are the fastest way to lose money in Indian markets.</b> SEBI's own data shows the large
        majority of retail option traders lose. This screen exists so you understand why before you ever
        consider one — not to encourage you to trade them.
      </Banner>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Instrument">
          <select className="input" value={symbol} onChange={(e) => { setSymbol(e.target.value); setStrike(null) }}>
            {OPTIONABLE.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Lots">
          <input className="input" type="number" min={1} max={10} value={lots} onChange={(e) => setLots(Math.max(1, Math.min(10, +e.target.value)))} />
        </Field>
      </div>

      <div className="flex gap-2">
        <button className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${type === 'call' ? 'bg-up text-bg' : 'bg-panel2 text-muted border border-edge'}`} onClick={() => setType('call')}>
          Call — betting up
        </button>
        <button className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${type === 'put' ? 'bg-down text-bg' : 'bg-panel2 text-muted border border-edge'}`} onClick={() => setType('put')}>
          Put — betting down
        </button>
      </div>

      <Section title="Option chain">
        <div className="card !p-0 overflow-hidden">
          <div className="grid grid-cols-3 px-3 py-2 text-[10px] uppercase tracking-wide text-muted border-b border-edge">
            <span>Call</span><span className="text-center">Strike</span><span className="text-right">Put</span>
          </div>
          {chain.map(({ call, put }, i) => {
            const k = ladder[i]
            const atm = Math.abs(k - spot) < (ladder[1] - ladder[0]) / 2
            return (
              <button
                key={k}
                onClick={() => setStrike(k)}
                className={`grid grid-cols-3 w-full px-3 py-2 text-sm border-b border-edge/40 last:border-0 transition ${
                  k === active ? 'bg-accent/10' : ''
                } ${atm ? 'font-semibold' : ''}`}
              >
                <span className={call.moneyness === 'ITM' ? 'text-up text-left' : 'text-muted text-left'}>{call.premium.toFixed(1)}</span>
                <span className={`text-center ${atm ? 'text-accent' : ''}`}>{k}{atm ? ' •' : ''}</span>
                <span className={put.moneyness === 'ITM' ? 'text-down text-right' : 'text-muted text-right'}>{put.premium.toFixed(1)}</span>
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-muted">
          Spot {inr(spot)} · dot marks at-the-money · green/red = already in the money
        </p>
      </Section>

      <Section title="Expiry & volatility">
        <Field label={`Days to expiry — ${days}`}>
          <input type="range" min={1} max={45} value={days} onChange={(e) => setDays(+e.target.value)} className="w-full accent-accent" />
        </Field>
        <Field label={`Implied volatility — ${iv}%`}>
          <input type="range" min={8} max={60} value={iv} onChange={(e) => setIv(+e.target.value)} className="w-full accent-accent" />
        </Field>
        <p className="flex gap-1.5 text-[11px] text-muted leading-relaxed">
          <Info size={12} className="shrink-0 mt-0.5 text-accent" />
          Drag expiry down and watch the premium fall even when nothing else changes. That is theta —
          time decay — and it works against you every single day you hold a bought option.
        </p>
      </Section>

      <Section title={`${symbol} ${active} ${type.toUpperCase()}`}>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Premium" value={`₹${q.premium.toFixed(1)}`} />
          <Stat label="Total cost" value={inr(cost)} />
          <Stat label="Max loss" value={inr(-maxLoss(q, lots, lotSize))} tone={-1} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Intrinsic" value={`₹${q.intrinsic.toFixed(1)}`} />
          <Stat label="Time value" value={`₹${q.timeValue.toFixed(1)}`} />
          <Stat label="Delta" value={q.delta.toFixed(2)} />
        </div>

        <div className="card !p-3">
          <PayoffChart points={curve} spot={spot} breakeven={q.breakeven} />
          <div className="flex justify-between text-[10px] text-muted mt-1">
            <span>{inr(curve[0].price)}</span>
            <span className="text-accent">spot {inr(spot)}</span>
            <span>{inr(curve[curve.length - 1].price)}</span>
          </div>
        </div>

        <Banner tone={Math.abs(movePct) > 2 ? 'warn' : 'info'}>
          You pay {inr(cost)} up front. You only start making money above {inr(q.breakeven)} — that is a{' '}
          <b>{Math.abs(movePct).toFixed(2)}% move {type === 'call' ? 'up' : 'down'}</b> in {days} day
          {days === 1 ? '' : 's'}, just to break even. Below that, you lose some or all of the premium.
        </Banner>

        <div className="card !p-3 flex gap-2">
          <TriangleAlert size={15} className="text-warn shrink-0 mt-0.5" />
          <p className="text-xs text-muted leading-relaxed">
            {q.timeValue > q.intrinsic
              ? `₹${q.timeValue.toFixed(1)} of this ₹${q.premium.toFixed(1)} premium is pure time value — it decays to zero at expiry even if the price never moves against you. You are paying for hope with an expiry date.`
              : `Most of this premium is intrinsic value, so decay hurts less — but it also costs far more up front and ties up ${inr(cost)}.`}
          </p>
        </div>
      </Section>

      <Banner tone="lock">
        Educational calculator only. Uses one flat volatility input and a simplified model — real premiums
        differ. No option is bought or sold here; this app cannot place any trade, real or mock, in options.
        Learn position sizing in <Link to="/risk" className="underline">Risk Tools</Link> before going near these.
      </Banner>
    </div>
  )
}
