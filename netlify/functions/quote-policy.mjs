export const MAX_SYMBOLS = 10
export const ALLOWED_TICKERS = new Set([
  '^NSEI', '^NSEBANK', 'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS',
  'ICICIBANK.NS', 'SBIN.NS', 'TMPV.NS', 'ADANIENT.NS',
])

export function parseRequestedTickers(raw) {
  if (typeof raw !== 'string' || !raw || raw.length > 256) throw new Error('Invalid symbols query.')
  const tickers = [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))]
  if (!tickers.length || tickers.length > MAX_SYMBOLS) throw new Error('Invalid symbol count.')
  if (tickers.some((ticker) => !ALLOWED_TICKERS.has(ticker))) throw new Error('Unsupported symbol.')
  return tickers
}

export function normalizeYahooMeta(meta = {}) {
  const price = Number(meta.regularMarketPrice)
  const prevClose = Number(meta.chartPreviousClose ?? meta.previousClose)
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(prevClose) || prevClose <= 0) return null

  const high = Number(meta.regularMarketDayHigh)
  const low = Number(meta.regularMarketDayLow)
  const quotedAt = Number(meta.regularMarketTime)
  return {
    price,
    prevClose,
    changePct: ((price - prevClose) / prevClose) * 100,
    dayHigh: Number.isFinite(high) && high > 0 ? high : null,
    dayLow: Number.isFinite(low) && low > 0 ? low : null,
    name: typeof meta.shortName === 'string' && meta.shortName.length <= 160 ? meta.shortName : '',
    quotedAt: Number.isFinite(quotedAt) && quotedAt > 0 ? quotedAt * 1000 : null,
  }
}
