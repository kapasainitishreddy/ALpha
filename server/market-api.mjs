import { EnvHttpProxyAgent, setGlobalDispatcher } from 'undici'
// Respect managed-environment proxies without exposing credentials or accepting a proxy from callers.
if (process.env.HTTP_PROXY || process.env.HTTPS_PROXY) setGlobalDispatcher(new EnvHttpProxyAgent())
// Keyless Yahoo chart adapter. Unofficial data may be delayed or unavailable.
// Fixed upstream and a whitelist prevent this endpoint becoming an arbitrary URL proxy.
export const tickers = [
  '^NSEI',
  '^NSEBANK',
  'RELIANCE.NS',
  'TCS.NS',
  'HDFCBANK.NS',
  'INFY.NS',
  'ICICIBANK.NS',
  'SBIN.NS',
  'TMPV.NS',
  'ADANIENT.NS',
  'BTC-INR',
  'ETH-INR',
  'SOL-INR',
]
const cache = new Map()
let inFlight = 0
async function chart(symbol, historical = false) {
  const key = `${symbol}:${historical}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < (historical ? 3600000 : 30000)) return cached.data
  if (inFlight >= 20) throw new Error('Data service busy; retry shortly.')
  inFlight++
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${historical ? '6mo' : '1d'}&interval=${historical ? '1d' : '5m'}`
    const res = await fetch(url, {
      signal: AbortSignal.timeout(12000),
      headers: { 'User-Agent': 'AlphaEducationalPaperTrading/0.2' },
    })
    if (!res.ok) throw new Error(`Upstream data unavailable (${res.status}).`)
    const body = await res.json()
    const result = body.chart?.result?.[0]
    if (!result) throw new Error('No data returned.')
    cache.set(key, { at: Date.now(), data: result })
    return result
  } finally {
    inFlight--
  }
}
export async function marketResponse(input) {
  const url = new URL(input, 'http://localhost')
  if (!['/api/quote', '/api/history'].includes(url.pathname))
    return { status: 404, body: { error: 'Unknown endpoint' } }
  const requested = [
    ...new Set(
      (url.searchParams.get('symbols') ?? url.searchParams.get('symbol') ?? '').split(','),
    ),
  ]
  if (!requested.length || requested.length > 13 || requested.some((s) => !tickers.includes(s)))
    return { status: 400, body: { error: 'Choose supported instruments.' } }
  const historical = url.pathname === '/api/history'
  if (historical && requested.length !== 1)
    return { status: 400, body: { error: 'One history instrument per request.' } }
  const quotes = {},
    errors = {}
  await Promise.all(
    requested.map(async (s) => {
      try {
        const data = await chart(s, historical)
        if (historical) {
          const q = data.indicators?.quote?.[0]
          const candles = (data.timestamp ?? [])
            .map((time, i) => ({
              time,
              open: q?.open?.[i],
              high: q?.high?.[i],
              low: q?.low?.[i],
              close: q?.close?.[i],
              volume: q?.volume?.[i] ?? 0,
            }))
            .filter((c) =>
              [c.open, c.high, c.low, c.close].every((v) => Number.isFinite(v) && v > 0),
            )
          quotes[s] = candles
        } else {
          const m = data.meta
          const prev = m.chartPreviousClose ?? m.previousClose
          if (!Number.isFinite(m.regularMarketPrice) || m.regularMarketPrice <= 0)
            throw new Error('Invalid upstream quote.')
          quotes[s] = {
            price: m.regularMarketPrice,
            prevClose: Number.isFinite(prev) ? prev : 0,
            changePct: prev > 0 ? ((m.regularMarketPrice - prev) / prev) * 100 : 0,
            dayHigh: m.regularMarketDayHigh ?? null,
            dayLow: m.regularMarketDayLow ?? null,
            name: m.shortName ?? s,
            quotedAt: m.regularMarketTime ?? null,
            currency: m.currency,
            source: 'Yahoo Finance (unofficial, may be delayed)',
          }
        }
      } catch (e) {
        errors[s] = e.message
      }
    }),
  )
  return {
    status: Object.keys(quotes).length ? 200 : 502,
    body: historical
      ? {
          candles: quotes[requested[0]] ?? [],
          errors,
          source: 'Yahoo Finance daily bars; adjusted corporate actions may differ',
        }
      : { quotes, errors, fetchedAt: Date.now() },
  }
}
export function marketMiddleware(req, res, next) {
  if (!req.url?.startsWith('/api/')) return next()
  if (req.method !== 'GET') {
    res.writeHead(405)
    return res.end()
  }
  marketResponse(req.url)
    .then(({ status, body }) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
      res.end(JSON.stringify(body))
    })
    .catch(() => {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Market service unavailable.' }))
    })
}
