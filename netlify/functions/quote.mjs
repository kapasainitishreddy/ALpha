import { normalizeYahooMeta, parseRequestedTickers } from './quote-policy.mjs'

const UPSTREAM_TIMEOUT_MS = 8_000
const UPSTREAM_MAX_BYTES = 128 * 1024

const baseHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
  'Netlify-CDN-Cache-Control': 'public, s-maxage=20, stale-while-revalidate=60',
}

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...baseHeaders, ...extra } })
}

async function fetchMeta(ticker) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'User-Agent': 'BlackScythe-Alpha/0.1' },
      redirect: 'error',
      signal: controller.signal,
    })
    if (!response.ok) return null
    const declared = Number(response.headers.get('content-length') ?? 0)
    if (Number.isFinite(declared) && declared > UPSTREAM_MAX_BYTES) return null
    const text = await response.text()
    if (new TextEncoder().encode(text).byteLength > UPSTREAM_MAX_BYTES) return null
    const parsed = JSON.parse(text)
    const meta = parsed?.chart?.result?.[0]?.meta
    return normalizeYahooMeta(meta)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

export default async (request) => {
  if (request.method !== 'GET') {
    return json({ error: 'method_not_allowed' }, 405, { Allow: 'GET' })
  }

  let tickers
  try {
    const url = new URL(request.url)
    tickers = parseRequestedTickers(url.searchParams.get('symbols'))
  } catch {
    return json({ error: 'invalid_symbols' }, 400)
  }

  const results = await Promise.all(tickers.map(async (ticker) => [ticker, await fetchMeta(ticker)]))
  const quotes = Object.fromEntries(results.filter(([, quote]) => quote))
  if (!Object.keys(quotes).length) return json({ error: 'quote_unavailable', quotes: {} }, 502)
  return json({ quotes })
}
