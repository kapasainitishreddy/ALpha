import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_SYMBOLS, normalizeYahooMeta, parseRequestedTickers } from './quote-policy.mjs'

test('accepts only the exact supported Indian-market ticker allowlist', () => {
  assert.deepEqual(parseRequestedTickers('INFY.NS,^NSEI,INFY.NS'), ['INFY.NS', '^NSEI'])
  assert.throws(() => parseRequestedTickers('AAPL'))
  assert.throws(() => parseRequestedTickers('https://example.com'))
})

test('bounds request cardinality and query length', () => {
  assert.throws(() => parseRequestedTickers(''))
  assert.throws(() => parseRequestedTickers('A'.repeat(257)))
  const tooMany = Array.from({ length: MAX_SYMBOLS + 1 }, (_, i) => `X${i}`).join(',')
  assert.throws(() => parseRequestedTickers(tooMany))
})

test('normalizes a valid bounded upstream metadata object', () => {
  const q = normalizeYahooMeta({
    regularMarketPrice: 110,
    chartPreviousClose: 100,
    regularMarketDayHigh: 112,
    regularMarketDayLow: 98,
    regularMarketTime: 1_700_000_000,
    shortName: 'Infosys',
  })
  assert.equal(q?.price, 110)
  assert.equal(q?.changePct, 10)
  assert.equal(q?.quotedAt, 1_700_000_000_000)
})

test('fails closed on unusable upstream prices', () => {
  assert.equal(normalizeYahooMeta({ regularMarketPrice: 0, chartPreviousClose: 100 }), null)
  assert.equal(normalizeYahooMeta({ regularMarketPrice: 100, chartPreviousClose: 'bad' }), null)
})
