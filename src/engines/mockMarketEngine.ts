import type { Candle, MarketEventDef, MarketSession } from '@/types'
import { getSymbol } from '@/data/mockSymbols'
import { getEvent, MARKET_EVENTS } from '@/data/marketEvents'
import { gaussian, hashSeed, mulberry32 } from '@/lib/rng'

// Generate a deterministic candle series for a symbol under a given market event.
// Seed = symbol+event+seedOffset, so the same inputs always reproduce the same market (testable backtests).
export function generateSession(
  symbol: string,
  eventId: string,
  candleCount = 60,
  seedOffset = 0,
): MarketSession {
  const sym = getSymbol(symbol)
  const event = getEvent(eventId)
  const rng = mulberry32(hashSeed(`${symbol}|${eventId}|${seedOffset}`))

  const candles: Candle[] = []
  let price = sym.basePrice
  if (event.gap) price *= 1 + event.gap

  const baseVol = sym.tickVolatility * event.volMultiplier
  let realizedVol = 0

  for (let i = 0; i < candleCount; i++) {
    const shock = gaussian(rng) * baseVol
    const move = event.drift + shock
    const open = price
    const close = open * (1 + move)
    const wick = Math.abs(gaussian(rng)) * baseVol * 0.5
    const high = Math.max(open, close) * (1 + wick)
    const low = Math.min(open, close) * (1 - wick)
    // Volume rises with absolute move (confirmation dynamics).
    const volume = Math.round((1 + Math.abs(move) * 40) * (500 + rng() * 500))
    candles.push({ time: 1_700_000_000 + i * 300, open, high, low, close, volume })
    realizedVol += Math.abs(move)
    price = close
  }

  const volatilityScore = Math.min(100, Math.round((realizedVol / candleCount) / baseVol * 30))
  return { symbol, event, candles, volatilityScore }
}

// Pick an event deterministically (for a daily challenge, etc.) from a seed.
export function pickEvent(seed: string): MarketEventDef {
  const rng = mulberry32(hashSeed(seed))
  return MARKET_EVENTS[Math.floor(rng() * MARKET_EVENTS.length)]
}
