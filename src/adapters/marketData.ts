// Real, free, keyless LIVE crypto quotes from CoinGecko's public API (global, CORS-enabled, INR native).
// Indian equities/indices need a broker key or a backend proxy (not free + client-side), so those stay
// MOCK and are labelled as such, we never present mock data as real.

export interface LiveQuote {
  price: number // INR
  changePct: number // 24h % change
  quotedAt: number | null
}

// App symbol -> CoinGecko coin id.
const COINGECKO_IDS: Record<string, string> = {
  BTCUSDT: 'bitcoin',
  ETHUSDT: 'ethereum',
  SOLUSDT: 'solana',
}

export const LIVE_SYMBOLS = Object.keys(COINGECKO_IDS)

export async function fetchLiveCrypto(): Promise<Record<string, LiveQuote>> {
  const ids = Object.values(COINGECKO_IDS).join(',')
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=inr&include_24hr_change=true&include_last_updated_at=true`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`CoinGecko ${res.status}`)
  const data = (await res.json()) as Record<string, { inr: number; inr_24h_change: number; last_updated_at?: number }>
  const out: Record<string, LiveQuote> = {}
  for (const [sym, id] of Object.entries(COINGECKO_IDS)) {
    const d = data[id]
    if (d && Number.isFinite(d.inr) && d.inr > 0) out[sym] = { price: d.inr, changePct: d.inr_24h_change ?? 0, quotedAt: d.last_updated_at ?? null }
  }
  return out
}
