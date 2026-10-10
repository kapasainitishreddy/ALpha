import { MOCK_SYMBOLS } from '@/data/mockSymbols'
import { MARKET_EVENTS } from '@/data/marketEvents'
import { hashSeed } from './rng'
export function dailySetup(date: string) {
  const seed = hashSeed(date)
  return {
    symbol: MOCK_SYMBOLS[seed % MOCK_SYMBOLS.length],
    event: MARKET_EVENTS[(seed >>> 8) % MARKET_EVENTS.length],
    seed,
  }
}
