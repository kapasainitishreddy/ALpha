import { useState } from 'react'
import { CandleChart } from '@/components/CandleChart'
import { Banner, Field, Section, Stat } from '@/components/common'
import { Positions, ClosedList, PendingOrders } from '@/components/session'
import { useStore } from '@/store/useStore'
import { useTranslation } from '@/lib/i18n'
import { parseCandleCsv, validateCandles } from '@/lib/historical'
import { YAHOO_TICKERS } from '@/adapters/liveIndia'
import { submitPaperOrder, processPaperBar } from '@/engines/paperExecution'
import { closeTrade, grossPnl } from '@/engines/tradeEngine'
import { finishSession } from '@/lib/finish'
import { inr } from '@/lib/format'
import { hashSeed } from '@/lib/rng'
import type { Candle, OrderType } from '@/types'
export default function Replay() {
  const store = useStore()
  const { t } = useTranslation()
  const [symbol, setSymbol] = useState('INFY')
  const [id, setId] = useState('')
  const [source, setSource] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [qty, setQty] = useState(1)
  const [sl, setSl] = useState(2)
  const [tp, setTp] = useState(4)
  const [type, setType] = useState<OrderType>('market')
  const [level, setLevel] = useState('')
  const replay = store.sessions[id]
  const candles = replay?.candles ?? []
  const idx = replay?.idx ?? 20
  const bar = candles[idx]
  const all = store.trades.filter((t) => t.sessionId === id)
  const open = all.filter((t) => t.status === 'open')
  const closed = all.filter((t) => t.status === 'closed')
  const atEnd = idx >= candles.length - 1
  const load = (bars: Candle[], description: string) => {
    const key = `replay:${symbol}:${hashSeed(JSON.stringify(bars))}`
    if (!useStore.getState().sessions[key])
      store.setSession(key, {
        idx: 20,
        candles: bars,
        source: description,
        startBalance: store.balance,
      })
    setId(key)
    setSource(description)
    setError('')
  }
  const fetchHistory = async () => {
    setLoading(true)
    setError('')
    try {
      const ticker =
        YAHOO_TICKERS[symbol] ??
        ({ BTCUSDT: 'BTC-INR', ETHUSDT: 'ETH-INR', SOLUSDT: 'SOL-INR' } as Record<string, string>)[
          symbol
        ]
      const res = await fetch(`/api/history?symbol=${encodeURIComponent(ticker)}`, {
        signal: AbortSignal.timeout(20000),
      })
      if (!res.ok) throw new Error(t('feedError'))
      const data = await res.json()
      load(validateCandles(data.candles), data.source)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'History unavailable')
    } finally {
      setLoading(false)
    }
  }
  const step = () => {
    if (atEnd) return
    const next = idx + 1
    store.setSession(id, { ...replay, idx: next })
    processPaperBar(id, symbol, candles[next])
    if (next === candles.length - 1) {
      for (const trade of useStore
        .getState()
        .trades.filter((t) => t.sessionId === id && t.status === 'open'))
        store.settleTrade(closeTrade(trade, candles[next].close))
      for (const o of useStore.getState().pendingOrders.filter((o) => o.sessionId === id))
        store.removePending(o.id)
    }
  }
  const place = (side: 'buy' | 'sell') => {
    if (!bar || atEnd) return
    const ref = type === 'market' ? bar.close : Number(level)
    const dir = side === 'buy' ? 1 : -1
    const d = submitPaperOrder(
      {
        symbol,
        side,
        qty,
        type,
        limitPrice: type === 'limit' ? ref : undefined,
        triggerPrice: type === 'stop' ? ref : undefined,
        stopLoss: ref * (1 - (dir * sl) / 100),
        target: ref * (1 + (dir * tp) / 100),
      },
      bar.close,
      store.fatherMode ? 'father' : 'manual',
      id,
    )
    setError(d.reason)
  }
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">{t('replay')}</h1>
      <Banner>
        {t('paperNotice')} Replay reveals one completed bar at a time. Historical knowledge can
        still bias your decisions; it is practice, not proof of a live edge.
      </Banner>
      <Field label={t('instrument')}>
        <select
          className="input"
          disabled={open.length > 0}
          value={symbol}
          onChange={(e) => {
            setSymbol(e.target.value)
            setId('')
          }}
        >
          {[...Object.keys(YAHOO_TICKERS), 'BTCUSDT', 'ETHUSDT', 'SOLUSDT'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <button
        className="btn-primary w-full"
        disabled={loading || open.length > 0}
        onClick={() => void fetchHistory()}
      >
        {loading ? t('loading') : 'Load 6 months of daily bars'}
      </button>
      <Field label="Or import your licensed CSV: time,open,high,low,close,volume">
        <input
          type="file"
          className="input"
          accept=".csv,text/csv"
          disabled={open.length > 0}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            try {
              if (file.size > 2000000) throw new Error('CSV exceeds 2 MB.')
              load(parseCandleCsv(await file.text()), `CSV: ${file.name}`)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Invalid CSV')
            } finally {
              e.target.value = ''
            }
          }}
        />
      </Field>
      {Object.entries(store.sessions)
        .filter(([k, v]) => k.startsWith(`replay:${symbol}:`) && v.candles)
        .map(([key, v]) => (
          <button
            key={key}
            className="chip mr-2"
            disabled={open.length > 0}
            onClick={() => {
              setId(key)
              setSource(v.source ?? '')
            }}
          >
            Resume {v.source ?? key}
          </button>
        ))}
      {error && (
        <p role="status" className="text-sm text-warn">
          {error}
        </p>
      )}
      {bar && (
        <>
          <div className="card space-y-3">
            <p className="text-xs text-muted">
              {source || replay.source} · {new Date(bar.time * 1000).toLocaleDateString()} ·{' '}
              {idx + 1}/{candles.length}
            </p>
            <CandleChart candles={candles.slice(0, idx + 1)} />
            <button className="btn-ghost w-full" disabled={atEnd} onClick={step}>
              {t('next')}
            </button>
          </div>
          <Section title={t('paperOrder')}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('orderType')}>
                <select
                  className="input"
                  value={type}
                  onChange={(e) => setType(e.target.value as OrderType)}
                >
                  {['market', 'limit', 'stop'].map((v) => (
                    <option value={v} key={v}>
                      {t(v)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('quantity')}>
                <input
                  className="input"
                  type="number"
                  min="0.000001"
                  step="any"
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </Field>
              {type !== 'market' && (
                <Field label={t('orderPrice')}>
                  <input
                    className="input"
                    type="number"
                    step="any"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  />
                </Field>
              )}
              <Field label={t('stopLoss')}>
                <input
                  type="number"
                  className="input"
                  step="0.1"
                  value={sl}
                  onChange={(e) => setSl(Number(e.target.value))}
                />
              </Field>
              <Field label={t('target')}>
                <input
                  type="number"
                  className="input"
                  step="0.1"
                  value={tp}
                  onChange={(e) => setTp(Number(e.target.value))}
                />
              </Field>
            </div>
            <div className="flex gap-3">
              <button className="btn-up flex-1" disabled={atEnd} onClick={() => place('buy')}>
                {t('buy')}
              </button>
              <button className="btn-down flex-1" disabled={atEnd} onClick={() => place('sell')}>
                {t('sell')}
              </button>
            </div>
          </Section>
          <PendingOrders sessionId={id} />
          <Stat
            label="Open P/L"
            value={inr(open.reduce((v, t) => v + grossPnl(t, bar.close) - t.fees, 0))}
          />
          <Positions
            trades={open}
            price={bar.close}
            onExit={(tradeId) => {
              const trade = open.find((t) => t.id === tradeId)
              if (trade) store.settleTrade(closeTrade(trade, bar.close))
            }}
          />
          {closed.length > 0 && (
            <Section title={t('closedTrades')}>
              <ClosedList trades={closed} />
              <button
                className="btn-ghost w-full"
                disabled={closed.every((t) => store.journaledTradeIds.includes(t.id))}
                onClick={() =>
                  finishSession(
                    'manual',
                    closed,
                    replay.startBalance ??
                      store.balance - closed.reduce((v, t) => v + (t.realizedPnl ?? 0), 0),
                  )
                }
              >
                {t('saveJournal')}
              </button>
            </Section>
          )}
        </>
      )}
      <Banner>
        {t('simulationCosts')} On a bar touching both exits, the stop is chosen conservatively. A
        pending order filled within a bar cannot take a same-bar target unless the order was
        executable at the open. Corporate actions and survivorship bias are not corrected by this
        simulator.
      </Banner>
    </div>
  )
}
