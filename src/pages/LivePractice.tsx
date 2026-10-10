import { useEffect, useRef, useState } from 'react'
import { Banner, Field, Section, Stat } from '@/components/common'
import { Positions, PendingOrders, ClosedList } from '@/components/session'
import { MOCK_SYMBOLS } from '@/data/mockSymbols'
import { fetchLiveCrypto } from '@/adapters/marketData'
import { fetchLiveIndia, isMarketOpen } from '@/adapters/liveIndia'
import { closeTrade, grossPnl } from '@/engines/tradeEngine'
import { processPaperBar, reservedCapital, submitPaperOrder } from '@/engines/paperExecution'
import { finishSession } from '@/lib/finish'
import { inr } from '@/lib/format'
import { useStore } from '@/store/useStore'
import type { OrderType, RiskDecision } from '@/types'
import { useTranslation } from '@/lib/i18n'

interface Quote { price: number; changePct: number; quotedAt: number | null; receivedAt: number }
export default function LivePractice() {
  const store = useStore()
  const { t } = useTranslation()
  const [symbol, setSymbol] = useState('INFY')
  const [quotes, setQuotes] = useState<Record<string, Quote>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [decision, setDecision] = useState<RiskDecision | null>(null)
  const [qty, setQty] = useState(1)
  const [sl, setSl] = useState(1)
  const [tp, setTp] = useState(2)
  const [type, setType] = useState<OrderType>('market')
  const [orderPrice, setOrderPrice] = useState('')
  const request = useRef(0)
  const sessionId = `live:${symbol}`
  const open = store.trades.filter(t => t.status === 'open' && t.sessionId?.startsWith('live:'))
  const own = open.filter(t => t.symbol === symbol)
  const closed = store.trades.filter(t => t.status === 'closed' && t.sessionId === sessionId)
  const quote = quotes[symbol]
  const cryptoSymbol = symbol.endsWith('USDT')
  const marketOpen = cryptoSymbol || isMarketOpen()
  const usable = (q?: Quote) => !!q && q.quotedAt !== null && Number.isFinite(q.quotedAt) && Date.now() - q.quotedAt * 1000 >= -60000 && Date.now() - q.quotedAt * 1000 < 20 * 60000 && Date.now() - q.receivedAt < 90000
  const refresh = async () => {
    const id = ++request.current
    setLoading(true); setError('')
    const indiaSymbols = [...new Set([symbol, ...open.map(t => t.symbol), ...store.pendingOrders.filter(o => o.sessionId.startsWith('live:')).map(o => o.order.symbol)])].filter(s => !s.endsWith('USDT'))
    const [ind, cr] = await Promise.allSettled([fetchLiveIndia(indiaSymbols), fetchLiveCrypto()])
    if (id !== request.current) return
    const next: Record<string, Quote> = {}
    if (ind.status === 'fulfilled') for (const [s, q] of Object.entries(ind.value)) next[s] = { ...q, receivedAt: Date.now() }
    if (cr.status === 'fulfilled') for (const [s, q] of Object.entries(cr.value)) next[s] = { ...q, receivedAt: Date.now() }
    setQuotes(next); setLoading(false)
    if (!next[symbol]) setError(t('feedError'))
    for (const [s, q] of Object.entries(next)) {
      if (!usable(q) || (!s.endsWith('USDT') && !isMarketOpen())) continue
      // Polling supplies snapshots, not an intrabar path. Gaps fill at the observed quote.
      processPaperBar(`live:${s}`, s, { time: q.quotedAt!, open: q.price, high: q.price, low: q.price, close: q.price, volume: 0 })
    }
  }
  useEffect(() => {
    setDecision(null); setOrderPrice(''); void refresh()
    const timer = setInterval(() => void refresh(), 30000)
    return () => { clearInterval(timer); request.current++ }
    // Refresh reads current positions on the next tick; no quote is reused across instruments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, open.map(t => t.id).join(','), store.pendingOrders.length])
  const place = (side: 'buy' | 'sell') => {
    if (!usable(quote) || !marketOpen) return
    const ref = type === 'market' ? quote.price : Number(orderPrice)
    const dir = side === 'buy' ? 1 : -1
    setDecision(submitPaperOrder({ symbol, side, type, qty, limitPrice: type === 'limit' ? ref : undefined,
      triggerPrice: type === 'stop' ? ref : undefined, stopLoss: ref * (1 - dir * sl / 100), target: ref * (1 + dir * tp / 100) }, quote.price, store.fatherMode ? 'father' : 'manual', sessionId))
  }
  const exit = (id: string) => {
    const trade = useStore.getState().trades.find(t => t.id === id && t.status === 'open')
    const q = trade && quotes[trade.symbol]
    if (trade && usable(q) && (trade.symbol.endsWith('USDT') || isMarketOpen())) useStore.getState().settleTrade(closeTrade(trade, q!.price))
    else setError(t('staleQuote'))
  }
  return <div className="space-y-5">
    <h1 className="text-xl font-bold">{t('livePractice')}</h1>
    <Banner>{t('paperNotice')} {t('snapshotNotice')}</Banner>
    <Field label={t('instrument')}><select className="input" value={symbol} onChange={e => setSymbol(e.target.value)}>{MOCK_SYMBOLS.map(s => <option key={s.symbol}>{s.symbol}</option>)}</select></Field>
    <div className="card space-y-2"><div className="font-bold">{symbol} · {cryptoSymbol ? 'INR spot (not USDT)' : 'Yahoo Finance'}</div><div className="text-3xl font-bold">{quote ? inr(quote.price) : '—'}</div>
      <div className="text-xs text-muted">{quote?.quotedAt ? `${t('quoteTime')}: ${new Date(quote.quotedAt * 1000).toLocaleString()}` : t('unknownQuoteTime')} · {marketOpen ? t('delayedQuote') : t('marketClosed')}</div>
      {quote && !usable(quote) && <p className="text-warn text-sm">{t('staleQuote')}</p>}
      <button className="btn-ghost w-full" disabled={loading} onClick={() => void refresh()}>{loading ? t('loading') : t('refresh')}</button>{error && <p role="alert" className="text-warn text-sm">{error}</p>}
    </div>
    <Section title={t('paperOrder')}><div className="grid grid-cols-2 gap-3">
      <Field label={t('orderType')}><select className="input" value={type} onChange={e => setType(e.target.value as OrderType)}>{['market', 'limit', 'stop'].map(v => <option key={v} value={v}>{t(v)}</option>)}</select></Field>
      <Field label={t('quantity')}><input className="input" type="number" min="0.000001" step="any" value={qty} onChange={e => setQty(Number(e.target.value))} /></Field>
      {type !== 'market' && <Field label={t('orderPrice')}><input className="input" type="number" step="any" value={orderPrice} onChange={e => setOrderPrice(e.target.value)} /></Field>}
      <Field label={t('stopLoss')}><input className="input" type="number" min="0.1" step="0.1" value={sl} onChange={e => setSl(Number(e.target.value))} /></Field>
      <Field label={t('target')}><input className="input" type="number" min="0.1" step="0.1" value={tp} onChange={e => setTp(Number(e.target.value))} /></Field>
    </div><div className="flex gap-3"><button className="btn-up flex-1" disabled={!usable(quote) || !marketOpen || loading} onClick={() => place('buy')}>{t('buy')}</button><button className="btn-down flex-1" disabled={!usable(quote) || !marketOpen || loading} onClick={() => place('sell')}>{t('sell')}</button></div>
    {decision && <Banner tone={decision.allow ? 'info' : 'warn'}>{decision.reason}</Banner>}</Section>
    <Stat label={t('availableCapital')} value={inr(Math.max(0, store.balance - reservedCapital()))} />
    <PendingOrders sessionId={sessionId} />
    <Section title={t('openPositions')}><Positions trades={own} price={quote?.price} onExit={exit} /></Section>
    {open.filter(t => t.symbol !== symbol).map(trade => <button key={trade.id} className="card w-full text-left" onClick={() => setSymbol(trade.symbol)}>{trade.symbol} ×{trade.qty} · {quotes[trade.symbol] ? inr(grossPnl(trade, quotes[trade.symbol].price) - trade.fees) : t('loading')} →</button>)}
    {closed.length > 0 && <Section title={t('closedTrades')}><ClosedList trades={closed} /><button className="btn-ghost w-full" disabled={closed.every(t => store.journaledTradeIds.includes(t.id))} onClick={() => finishSession(store.fatherMode ? 'father' : 'manual', closed, store.balance - closed.reduce((s,t) => s + (t.realizedPnl ?? 0), 0))}>{t('saveJournal')}</button></Section>}
    <Banner tone="warn">{t('simulationCosts')}</Banner>
  </div>
}
