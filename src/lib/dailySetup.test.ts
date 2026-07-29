import { describe, expect, it } from 'vitest'
import { hashSeed } from './rng'
import { MARKET_EVENTS } from '@/data/marketEvents'
import { MOCK_SYMBOLS } from '@/data/mockSymbols'

// Regression: the daily-challenge picker used `seed >> 8`. hashSeed returns an unsigned 32-bit
// value, so for any seed above 2^31 the signed shift went negative, the modulo stayed negative,
// and the array lookup returned undefined — which crashed the whole app, not just that screen.
// This walks two years of dates to prove every one resolves to a real symbol and event.
describe('daily challenge setup', () => {
  it('always resolves to a real symbol and event, for every date in two years', () => {
    const start = new Date(2026, 0, 1)
    let negativeSeen = 0

    for (let i = 0; i < 730; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

      const seed = hashSeed(key)
      if ((seed >> 8) < 0) negativeSeen++ // the old, broken expression

      const symbol = MOCK_SYMBOLS[seed % MOCK_SYMBOLS.length]
      const event = MARKET_EVENTS[(seed >>> 8) % MARKET_EVENTS.length]

      expect(symbol, `symbol undefined for ${key}`).toBeDefined()
      expect(event, `event undefined for ${key}`).toBeDefined()
      expect(event.name).toBeTruthy()
    }

    // Confirms the test actually exercises the case that used to break, rather than passing by luck.
    expect(negativeSeen).toBeGreaterThan(0)
  })
})
