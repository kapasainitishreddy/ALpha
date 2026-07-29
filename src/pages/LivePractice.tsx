import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calculator, RefreshCw, Radio } from 'lucide-react'
import { Banner, Field, Section, Stat } from '@/components/common'
import { Positions } from '@/components/session'
import { MOCK_SYMBOLS } from '@/data/mockSymbols'
import { fetchLiveCrypto } from '@/adapters/marketData'
import { fetchLiveIndia, isLiveIndiaSymbol, isMarketOpen } from '@/adapters/liveIndia'
import { evaluateRisk } from '@/engines/riskGuardEngine'
import { closeTrade, grossPnl, hitStopOrTarget, openTrade } from '@/engines/tradeEngine'
import { positionSize, rewardRisk } from '@/lib/riskMath'
import { finishSession } from '@/lib/finish'
import { inr, pnlColor } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { RiskDecision, Trade } from '@/types'

const POLL_MS = 30_000
const CRYPTO = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']

// Practice against real market prices with fake money. The distinction that matters:
// the PRICE is real, the MONEY is not. Nothing here can place a broker order.
export default function LivePractice() {
  const store = useStore()
  const [symbol, setSymbol] = useState('INFY')
  const [price, setPrice] = useState<number | null>(null)
  const [changePct, setChangePct] = useState(0)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const [open, setOpen] = useState<Trade[]>([])
  const [closed, setClosed] = useState<Trade[]>([])
  const [decision, setDecision] = useState<RiskDecision | null>(null)
  const [saved, setSaved] = useState(false)

  const [qty, setQty] = useState(1)
  const [slPct, setSlPct] = useState(1)
  const [tpPct, setTpPct] = useState(2)

  const isCrypto = CRYPTO.includes(symbol)
  const marketOpen = isCrypto || isMarketOpen()

  const refresh = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const q = isCrypto ? await fetchLiveCrypto() : await fetchLiveIndia([symbol])
      const hit = q[symbol]
      if (!hit) throw new Error('no quote')
      setPrice(hit.price)
      setChangePct(hit.changePct)
      setFetchedAt(Date.now())
    } catch {
      setErr('Could not reach the live feed. Check your connection and retry.')
    } finally {
      setLoading(false)
    }
  }, [symbol, isCrypto])

  useEffect(() => { void refresh() }, [refresh])

  // Poll only while the market is actually moving — no point hammering the feed at 2am.
  useEffect(() => {
    if (!marketOpen) return
    const id = setInterval(() => void refresh(), POLL_MS)
    return () => clearInterval(id)
  }, [marketOpen, refresh])

  // Auto-close positions whose stop or target the live price has crossed.
  const openRef = useRef(open)
  openRef.current = open
  useEffect(() => {
    if (price === null) return
    const still: Trade[] = []
    for (const t of openRef.current) {
      const hit = t.symbol === symbol ? hitStopOrTarget(t, price) : null
      if (hit) {
        const c = closeTrade(t, hit === 'stop' ? t.stopLoss! : t.target!)
        store.updateTrade(c)
        store.recordClose(c.realizedPnl ?? 0)
        setClosed((p) => [c, ...p])
      } else {
        still.push(t)
      }
    }
    if (still.length !== openRef.current.length) setOpen(still)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price])

  const place = (side: 'buy' | 'sell') => {
    if (price === null) return
    const stopLoss = side === 'buy' ? price * (1 - slPct / 100) : price * (1 + slPct / 100)
    const target = side === 'buy' ? price * (1 + tpPct / 100) : price * (1 - tpPct / 100)
    const d = evaluateRisk({
      mode: 'manual',
      balance: store.balance,
      tradeValue: price * qty,
      entry: price,
      side,
      stopLoss,
      target,
      consecutiveLosses: store.consecutiveLosses,
      dailyPnl: store.dailyPnl,
      tradesToday: store.tradesToday,
    })
    setDecision(d)
    if (!d.allow) return
    const t = openTrade({ symbol, side, type: 'market', qty, stopLoss, target }, price, 'manual')
    store.addTrade(t)
    setOpen((p) => [t, ...p])
  }

  const exit = (id: string) => {
    const t = open.find((x) => x.id === id)
    if (!t || price === null) return
    const c = closeTrade(t, price)
    store.updateTrade(c)
    store.recordClose(c.realizedPnl ?? 0)
    setOpen((p) => p.filter((x) => x.id !== id))
    setClosed((p) => [c, ...p])
  }

  const openPnl = price === null ? 0 : open.reduce((s, t) => s + grossPnl(t, price), 0)
  const sessionPnl = closed.reduce((s, t) => s + (t.realizedPnl ?? 0), 0)

  // Show what a correctly-sized position would be, so the qty box isn't a blind guess.
  const suggested = price !== null
    ? positionSize({ capital: store.balance, entry: price, stopLoss: price * (1 - slPct / 100), riskPct: 1 })
    : null
  const rr = price !== null
    ? rewardRisk(price, price * (1 - slPct / 100), price * (1 + tpPct / 100))
    : null

  return (
    <div className="space-y-6">
      <Banner>
        <b>Real prices, fake money.</b> These are live market quotes — your trades are still 100% mock and
        can never reach a broker. This is the closest practice gets to the real thing.
      </Banner>

      <Field label="Instrument">
        <select className="input" value={symbol} onChange={(e) => { setSymbol(e.target.value); setDecision(null) }}>
          <optgroup label="NSE — live during market hours">
            {MOCK_SYMBOLS.filter((s) => isLiveIndiaSymbol(s.symbol)).map((s) => (
              <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>
            ))}
          </optgroup>
          <optgroup label="Crypto — live 24/7">
            {MOCK_SYMBOLS.filter((s) => CRYPTO.includes(s.symbol)).map((s) => (
              <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>
            ))}
          </optgroup>
        </select>
      </Field>

      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{symbol}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 ${
                marketOpen ? 'bg-up/15 text-up' : 'bg-warn/15 text-warn'
              }`}>
                <Radio size={9} /> {marketOpen ? 'LIVE' : 'CLOSED'}
              </span>
            </div>
            <div className="text-3xl font-extrabold mt-1">
              {price === null ? '—' : inr(price)}
            </div>
            <div className={`text-sm ${pnlColor(changePct)}`}>
              {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}% {isCrypto ? '24h' : 'today'}
            </div>
          </div>
          <button className="chip flex items-center gap-1" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            {loading ? '…' : 'Refresh'}
          </button>
        </div>
        <div className="text-[11px] text-muted mt-2 pt-2 border-t border-edge">
          {err ? <span className="text-warn">{err}</span> : fetchedAt ? (
            <>
              Updated {new Date(fetchedAt).toLocaleTimeString('en-IN')}
              {marketOpen ? ` · auto-refreshing every ${POLL_MS / 1000}s` : ' · market shut, this is the last close'}
            </>
          ) : 'Fetching…'}
        </div>
      </div>

      {!marketOpen && (
        <Banner tone="warn">
          NSE is closed (Mon–Fri, 9:15am–3:30pm IST). The price won't move, so stops and targets won't
          trigger. Practise on crypto for a live moving market, or come back during market hours.
        </Banner>
      )}

      <Section title="Place mock order">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Quantity">
            <input className="input" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value))} />
          </Field>
          <Field label="Stop loss %">
            <input className="input" type="number" min={0.1} step={0.1} value={slPct} onChange={(e) => setSlPct(Math.max(0.1, +e.target.value))} />
          </Field>
          <Field label="Target %">
            <input className="input" type="number" min={0.1} step={0.1} value={tpPct} onChange={(e) => setTpPct(Math.max(0.1, +e.target.value))} />
          </Field>
        </div>

        {suggested && rr && (
          <div className="card !p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted flex items-center gap-1.5">
                <Calculator size={13} className="text-accent" /> Sized at 1% risk
              </span>
              {suggested.valid ? (
                <button className="chip !text-accent !border-accent/40" onClick={() => setQty(suggested.qty)}>
                  use {suggested.qty}
                </button>
              ) : (
                <span className="text-xs text-warn">won't fit</span>
              )}
            </div>
            {suggested.problem && (
              <p className="text-[11px] text-warn leading-relaxed">{suggested.problem}</p>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Reward : risk</span>
              <span className={`font-bold ${rr.verdict === 'good' ? 'text-up' : rr.verdict === 'poor' ? 'text-down' : 'text-warn'}`}>
                {rr.ratio.toFixed(2)} : 1
              </span>
            </div>
            {rr.verdict === 'poor' && (
              <p className="text-[11px] text-down">
                Your target is closer than your stop. Widen the target or tighten the stop —{' '}
                <Link to="/risk" className="underline">see why</Link>.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button className="btn-up flex-1" onClick={() => place('buy')} disabled={price === null}>Buy</button>
          <button className="btn-down flex-1" onClick={() => place('sell')} disabled={price === null}>Sell</button>
        </div>

        {decision && !decision.allow && (
          <Banner tone="warn">Risk Guard blocked: {decision.reason} {decision.fatherExplanation}</Banner>
        )}
        {decision?.allow && <Banner>Mock order placed at the live price. {decision.fatherExplanation}</Banner>}
      </Section>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Open P/L" value={inr(openPnl)} tone={openPnl} />
        <Stat label="Closed P/L" value={inr(sessionPnl)} tone={sessionPnl} />
        <Stat label="Positions" value={String(open.length)} />
      </div>

      {open.length > 0 && (
        <Section title="Open positions">
          <Positions trades={open} price={price ?? 0} onExit={exit} />
        </Section>
      )}

      {closed.length > 0 && (
        <Section title="Closed this session" right={
          <button className="chip" disabled={saved} onClick={() => { finishSession('manual', closed, store.balance - sessionPnl); setSaved(true) }}>
            {saved ? 'Saved' : 'Save to journal'}
          </button>
        }>
          <div className={`text-right font-bold ${pnlColor(sessionPnl)}`}>Session: {inr(sessionPnl)}</div>
        </Section>
      )}

      <Banner tone="lock">
        Real prices do not make this real trading. No broker is connected, no order leaves this device,
        and Real Mode stays locked.
      </Banner>
    </div>
  )
}
