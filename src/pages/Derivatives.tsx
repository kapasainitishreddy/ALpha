import { useState } from 'react'
import { Banner, Field, Section, Stat } from '@/components/common'
import { MOCK_SYMBOLS } from '@/data/mockSymbols'
import { generateSession } from '@/engines/mockMarketEngine'
import { useTranslation } from '@/lib/i18n'
import { inr, pnlColor } from '@/lib/format'
import {
  legValue,
  optionLegs,
  optionGreeks,
  markPosition,
  createLabPosition,
  closeLabPosition,
  type DerivativeBook,
  type OptionStructure,
} from '@/lib/derivatives'
import { Link } from 'react-router-dom'
const fresh = (): DerivativeBook => ({
  version: 1,
  balance: 50000,
  idx: 20,
  symbol: 'NIFTY50',
  positions: [],
})
function savedBook(): DerivativeBook {
  try {
    const b = JSON.parse(localStorage.getItem('alpha-derivatives') ?? 'null')
    return b?.version === 1 &&
      Number.isFinite(b.balance) &&
      Number.isInteger(b.idx) &&
      b.idx >= 20 &&
      b.idx < 120 &&
      MOCK_SYMBOLS.some((s) => s.symbol === b.symbol) &&
      Array.isArray(b.positions) &&
      b.positions.length <= 1000
      ? b
      : fresh()
  } catch {
    return fresh()
  }
}
export default function Derivatives() {
  const { t } = useTranslation()
  const [book, setBook] = useState<DerivativeBook>(savedBook)
  const [kind, setKind] = useState<'future' | 'option'>('option')
  const [structure, setStructure] = useState<OptionStructure>('bull-call')
  const [units, setUnits] = useState(10)
  const [days, setDays] = useState(7)
  const [iv, setIv] = useState(18)
  const [message, setMessage] = useState('')
  const candles = generateSession(book.symbol, 'high-vol', 120, 34).candles
  const spot = candles[book.idx].close
  const width = spot * 0.02
  const open = book.positions.filter((p) => p.closedPnl === undefined)
  const unrealized = open.reduce((v, p) => v + markPosition(p, spot, book.idx) - p.entryFee, 0)
  const reserved = open.reduce((v, p) => v + p.margin + p.entryFee, 0)
  const persist = (b: DerivativeBook) => {
    setBook(b)
    localStorage.setItem('alpha-derivatives', JSON.stringify(b))
  }
  const close = (id: string) => {
    const p = open.find((p) => p.id === id)
    if (!p) return
    const closed = closeLabPosition(p, spot, book.idx, 'Manual exit')
    persist({
      ...book,
      balance: book.balance + closed.closedPnl! - (p.variationPnl ?? 0),
      positions: book.positions.map((x) => (x.id === id ? closed : x)),
    })
  }
  const advance = () => {
    if (book.idx >= 119) return
    const idx = book.idx + 1
    const next = candles[idx].close
    let balance = book.balance
    let positions = book.positions.map((original) => {
      if (original.closedPnl !== undefined) return original
      let p = original
      if (p.kind === 'future') {
        const variation = markPosition(p, next, idx)
        balance += variation
        p = { ...p, entry: next, variationPnl: (p.variationPnl ?? 0) + variation }
      }
      const pnl = (p.variationPnl ?? 0) + markPosition(p, next, idx) - p.entryFee
      const forced = p.kind === 'future' && p.margin + pnl < p.margin * 0.5
      if (idx >= p.expiryIdx || forced || idx === 119) {
        const c = closeLabPosition(
          p,
          next,
          idx,
          forced
            ? 'Maintenance margin breach'
            : idx >= p.expiryIdx
              ? 'Expiry cash settlement'
              : 'Session ended',
        )
        balance += c.closedPnl! - (p.variationPnl ?? 0)
        return c
      }
      return p
    })
    // Account equity falling below half of reserved collateral liquidates all remaining lab positions.
    const active = positions.filter((p) => p.closedPnl === undefined)
    if (
      balance + active.reduce((v, p) => v + markPosition(p, next, idx) - p.entryFee, 0) <
      active.reduce((v, p) => v + p.margin * 0.5, 0)
    ) {
      positions = positions.map((p) => {
        if (p.closedPnl !== undefined) return p
        const c = closeLabPosition(p, next, idx, 'Account margin liquidation')
        balance += c.closedPnl! - (p.variationPnl ?? 0)
        return c
      })
    }
    persist({ ...book, idx, balance, positions })
  }
  const place = (side: 1 | -1) => {
    try {
      if (book.idx >= 119) throw new Error('Session ended. Reset the lab to practise again.')
      const p = createLabPosition(
        kind,
        book.symbol,
        spot,
        book.idx,
        side,
        units,
        structure,
        days,
        iv,
        width,
      )
      if (p.margin + p.entryFee > book.balance - reserved)
        throw new Error('Insufficient lab collateral. Reduce units.')
      if (kind === 'option' && p.margin > book.balance * 0.15)
        throw new Error('Option maximum loss exceeds the lab 15% cap.')
      if (kind === 'future' && spot * units > book.balance)
        throw new Error('Lab futures notional cannot exceed lab balance.')
      persist({ ...book, positions: [p, ...book.positions] })
      setMessage('Lab contract opened. Virtual money only.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Invalid contract')
    }
  }
  const legs = optionLegs(structure, spot, width),
    greeks = optionGreeks(legs, spot, days, iv),
    premium = legValue(legs, spot, days, iv)
  const curve = Array.from({ length: 41 }, (_, i) => {
    const price = spot * (0.85 + (i * 0.3) / 40)
    return { price, pnl: (legValue(legs, price, 0, iv) - premium) * units }
  })
  const ys = curve.map((p) => p.pnl),
    lo = Math.min(...ys),
    range = Math.max(...ys) - lo || 1
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">{t('Futures & options practice')}</h1>
      <Banner>
        {t('paperNotice')} Separate ₹50,000 derivatives lab account. One candle = one hypothetical
        day; prices are generated, not an exchange option chain. No broker orders.
      </Banner>
      <Field label={t('instrument')}>
        <select
          className="input"
          disabled={open.length > 0}
          value={book.symbol}
          onChange={(e) => persist({ ...fresh(), symbol: e.target.value })}
        >
          {MOCK_SYMBOLS.filter((s) => s.assetClass !== 'crypto').map((s) => (
            <option key={s.symbol}>{s.symbol}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Underlying spot" value={inr(spot)} />
        <Stat label="Lab cash equity" value={inr(book.balance)} />
        <Stat label="Mark to market" value={inr(unrealized)} tone={unrealized} />
        <Stat label="Available collateral" value={inr(book.balance - reserved)} />
      </div>
      <button className="btn-ghost w-full" disabled={book.idx >= 119} onClick={advance}>
        {t('next')} · day {book.idx - 20}
      </button>
      <Section title="Contract settings">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Product">
            <select
              className="input"
              value={kind}
              onChange={(e) => setKind(e.target.value as 'future' | 'option')}
            >
              <option value="option">Options structure</option>
              <option value="future">Futures (10% initial margin)</option>
            </select>
          </Field>
          <Field label="Units (illustrative multiplier)">
            <input
              type="number"
              className="input"
              min="1"
              value={units}
              onChange={(e) => setUnits(Number(e.target.value))}
            />
          </Field>
          <Field label="Days to expiry">
            <input
              type="number"
              className="input"
              min="1"
              max="60"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </Field>
          {kind === 'option' && (
            <>
              <Field label="Structure">
                <select
                  className="input"
                  value={structure}
                  onChange={(e) => setStructure(e.target.value as OptionStructure)}
                >
                  {['call', 'put', 'bull-call', 'bear-put', 'straddle', 'iron-condor'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Flat IV %">
                <input
                  type="number"
                  className="input"
                  min="1"
                  max="100"
                  value={iv}
                  onChange={(e) => setIv(Number(e.target.value))}
                />
              </Field>
            </>
          )}
        </div>
        <button className="btn-up w-full" onClick={() => place(1)}>
          {kind === 'option' ? 'Open structure (mock)' : 'Long futures (mock)'}
        </button>
        {kind === 'future' && (
          <button className="btn-down w-full" onClick={() => place(-1)}>
            Short futures (mock)
          </button>
        )}
        {message && (
          <p role="status" className="text-sm text-warn">
            {message}
          </p>
        )}
      </Section>
      {kind === 'option' && (
        <Section title="Preview: expiry P/L and Greeks">
          <div className="card">
            <svg
              viewBox="0 0 300 140"
              className="w-full"
              role="img"
              aria-label="Options structure expiry payoff"
            >
              <line
                x1="0"
                x2="300"
                y1={130 - ((0 - lo) / range) * 120}
                y2={130 - ((0 - lo) / range) * 120}
                stroke="#8b98ad"
              />
              <polyline
                points={curve
                  .map((p, i) => `${(i / 40) * 300},${130 - ((p.pnl - lo) / range) * 120}`)
                  .join(' ')}
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
              />
            </svg>
            <p className="text-xs text-muted">
              Spot range: {inr(spot * 0.85)}–{inr(spot * 1.15)} · fees excluded from preview
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(greeks).map(([key, value]) => (
              <Stat key={key} label={key} value={Number.isFinite(value) ? value.toFixed(3) : '—'} />
            ))}
          </div>
          <p className="text-xs text-muted">
            Per unit. Theta: one day decay; vega: +1 percentage point IV. European Black–Scholes
            with flat IV and no dividends. Not real premiums.
          </p>
        </Section>
      )}
      <Section title={t('openPositions')}>
        {open.map((p) => (
          <div className="card text-sm space-y-2" key={p.id}>
            <b>
              {p.symbol} {p.kind} ×{p.units} · {p.side === 1 ? 'long' : 'short'}
            </b>
            <p className={pnlColor(markPosition(p, spot, book.idx) - p.entryFee)}>
              {inr((p.variationPnl ?? 0) + markPosition(p, spot, book.idx) - p.entryFee)} · expires
              day {p.expiryIdx - 20}
            </p>
            <p className="text-xs text-muted">
              Collateral {inr(p.margin)}{' '}
              {p.legs
                .map((l) => `${l.side === 1 ? '+' : '−'}${l.type} ${l.strike.toFixed(0)}`)
                .join(' / ')}
            </p>
            <button className="chip" onClick={() => close(p.id)}>
              Close at model price
            </button>
          </div>
        ))}
      </Section>
      <Section title={t('closedTrades')}>
        {book.positions
          .filter((p) => p.closedPnl !== undefined)
          .slice(0, 20)
          .map((p) => (
            <div key={p.id} className="card text-sm">
              <b>
                {p.symbol} {p.kind}
              </b>{' '}
              · {inr(p.closedPnl!)}
              <p className="text-xs text-muted">{p.reason}</p>
            </div>
          ))}
      </Section>
      <Banner tone="warn">
        Units and margin are teaching assumptions, not current exchange lots. Entry and exit each
        charge 0.03% fees + 0.05% friction on gross leg value. Futures variation is credited or
        debited daily in this lab. Isolated maintenance is 50% of initial margin. Futures margin is
        collateral, not maximum loss; gaps can create losses beyond it. No physical delivery, early
        exercise, funding or tax model.
      </Banner>
      <Link className="text-accent underline" to="/learn">
        {t('learn')} →
      </Link>
      <button
        className="btn-ghost w-full"
        onClick={() => {
          if (confirm('Reset the derivatives lab, including its open positions?')) persist(fresh())
        }}
      >
        Reset derivatives lab
      </button>
    </div>
  )
}
