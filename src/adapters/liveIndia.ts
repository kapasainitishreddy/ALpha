// LIVE Indian equity/index quotes, via our own /api/quote function (Yahoo has no CORS).
// Free, no key. Delayed by up to ~15 min on Yahoo's side — we surface that in the UI rather
// than implying it's tick-accurate. Crypto stays on CoinGecko (see marketData.ts).

export interface IndiaQuote {
  price: number
  prevClose: number
  changePct: number
  dayHigh: number | null
  dayLow: number | null
  name: string
  quotedAt: number | null
}

// App symbol -> Yahoo ticker. ^ prefix = index, .NS suffix = NSE listing.
const YAHOO_TICKERS: Record<string, string> = {
  NIFTY50: '^NSEI',
  BANKNIFTY: '^NSEBANK',
  RELIANCE: 'RELIANCE.NS',
  TCS: 'TCS.NS',
  HDFCBANK: 'HDFCBANK.NS',
  INFY: 'INFY.NS',
  ICICIBANK: 'ICICIBANK.NS',
  SBIN: 'SBIN.NS',
  TMPV: 'TMPV.NS',
  ADANIENT: 'ADANIENT.NS',
}

export const LIVE_INDIA_SYMBOLS = Object.keys(YAHOO_TICKERS)

export function isLiveIndiaSymbol(sym: string): boolean {
  return sym in YAHOO_TICKERS
}

// Inside the Android APK the page is served from capacitor://localhost, so a relative
// "/api/quote" resolves to the app bundle and 404s. Fall back to the deployed function there.
const QUOTE_HOST = 'https://blackscythe-alpha.netlify.app'
const quoteUrl = (q: string) =>
  location.protocol.startsWith('http') ? `/api/quote?${q}` : `${QUOTE_HOST}/api/quote?${q}`

export async function fetchLiveIndia(symbols: string[] = LIVE_INDIA_SYMBOLS): Promise<Record<string, IndiaQuote>> {
  const wanted = symbols.filter(isLiveIndiaSymbol)
  if (!wanted.length) return {}

  const res = await fetch(quoteUrl(`symbols=${wanted.map((s) => YAHOO_TICKERS[s]).join(',')}`))
  if (!res.ok) throw new Error(`quote ${res.status}`)
  const { quotes } = (await res.json()) as { quotes: Record<string, IndiaQuote> }

  // Map Yahoo tickers back to app symbols.
  const out: Record<string, IndiaQuote> = {}
  for (const sym of wanted) {
    const q = quotes[YAHOO_TICKERS[sym]]
    if (q) out[sym] = q
  }
  return out
}

// NSE cash market: Mon-Fri 09:15-15:30 IST. Used to label quotes as live vs last close.
export function isMarketOpen(now = new Date()): boolean {
  const ist = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60_000)
  const day = ist.getDay()
  if (day === 0 || day === 6) return false
  const mins = ist.getHours() * 60 + ist.getMinutes()
  return mins >= 555 && mins <= 930
}
