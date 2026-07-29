import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Banner } from '@/components/common'
import { MOCK_SYMBOLS } from '@/data/mockSymbols'
import { generateSession, pickEvent } from '@/engines/mockMarketEngine'
import { fetchLiveCrypto, type LiveQuote } from '@/adapters/marketData'
import { fetchLiveIndia, isMarketOpen, type IndiaQuote } from '@/adapters/liveIndia'
import { inr, pnlColor } from '@/lib/format'
import { DISCLAIMERS } from '@/data/disclaimers'

export default function Watchlist() {
  const [tick, setTick] = useState(0)
  const [crypto, setCrypto] = useState<Record<string, LiveQuote>>({})
  const [india, setIndia] = useState<Record<string, IndiaQuote>>({})
  const [status, setStatus] = useState<'loading' | 'live' | 'partial' | 'offline'>('loading')

  useEffect(() => {
    let cancelled = false
    setStatus('loading')
    // Two independent feeds — one failing shouldn't blank the other.
    Promise.allSettled([fetchLiveCrypto(), fetchLiveIndia()]).then(([c, i]) => {
      if (cancelled) return
      const gotCrypto = c.status === 'fulfilled'
      const gotIndia = i.status === 'fulfilled' && Object.keys(i.value).length > 0
      if (gotCrypto) setCrypto(c.value)
      if (gotIndia) setIndia(i.value)
      setStatus(gotCrypto && gotIndia ? 'live' : gotCrypto || gotIndia ? 'partial' : 'offline')
    })
    return () => { cancelled = true }
  }, [tick])

  const open = isMarketOpen()

  const rows = MOCK_SYMBOLS.map((s) => {
    const c = crypto[s.symbol]
    if (c) return { ...s, last: c.price, changePct: c.changePct, tag: 'LIVE' as const, note: '24h' }

    const i = india[s.symbol]
    if (i) {
      return {
        ...s,
        last: i.price,
        changePct: i.changePct,
        tag: open ? ('LIVE' as const) : ('CLOSE' as const),
        note: open ? 'NSE' : 'last close',
      }
    }

    // Fallback only — the simulated stream, clearly labelled so it can't be mistaken for real.
    const ev = pickEvent(`${s.symbol}|${tick}`)
    const session = generateSession(s.symbol, ev.id, 30, tick)
    const last = session.candles[session.candles.length - 1].close
    return { ...s, last, changePct: ((last - s.basePrice) / s.basePrice) * 100, tag: 'mock' as const, note: 'simulated' }
  })

  return (
    <div className="space-y-4">
      <Banner tone={status === 'offline' ? 'warn' : 'info'}>
        {DISCLAIMERS.watchOnly}{' '}
        {status === 'offline' ? (
          <>Live feeds unreachable — everything below is simulated.</>
        ) : (
          <>
            Indian stocks are <b>real NSE prices</b>{open ? '' : ' (last close — market shut)'}; crypto is{' '}
            <b>live</b> from CoinGecko. Prices can lag by a few minutes. You can practise against these,
            but every trade is still mock money.
          </>
        )}
      </Banner>

      <div className="card !p-0 overflow-hidden">
        {rows.map((r) => (
          <div key={r.symbol} className="flex items-center justify-between px-3 py-3 border-b border-edge/50 last:border-0">
            <div className="min-w-0">
              <div className="font-semibold flex items-center gap-2">
                {r.symbol}
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                  r.tag === 'LIVE' ? 'bg-up/15 text-up'
                    : r.tag === 'CLOSE' ? 'bg-warn/15 text-warn'
                      : 'bg-panel2 text-muted'
                }`}>
                  {r.tag}
                </span>
              </div>
              <div className="text-xs text-muted truncate">{r.name} · {r.note}</div>
            </div>
            <div className="text-right shrink-0 pl-2">
              <div className="font-bold">{inr(r.last)}</div>
              <div className={`text-xs ${pnlColor(r.changePct)}`}>
                {r.changePct >= 0 ? '+' : ''}{r.changePct.toFixed(2)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-ghost w-full flex items-center justify-center gap-2" onClick={() => setTick((t) => t + 1)} disabled={status === 'loading'}>
        <RefreshCw size={15} className={status === 'loading' ? 'animate-spin' : ''} />
        {status === 'loading' ? 'Fetching…' : 'Refresh prices'}
      </button>
    </div>
  )
}
