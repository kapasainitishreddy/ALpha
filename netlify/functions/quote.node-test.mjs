import test from 'node:test'
import assert from 'node:assert/strict'
import quote from './quote.mjs'

const originalFetch = globalThis.fetch

test.afterEach(() => { globalThis.fetch = originalFetch })

test('rejects non-GET methods and unsupported symbols before upstream fetch', async () => {
  globalThis.fetch = async () => { throw new Error('must not fetch') }
  const post = await quote(new Request('https://alpha.example/api/quote?symbols=INFY.NS', { method: 'POST' }))
  assert.equal(post.status, 405)
  const bad = await quote(new Request('https://alpha.example/api/quote?symbols=AAPL'))
  assert.equal(bad.status, 400)
})

test('returns only normalized allowlisted quote fields', async () => {
  globalThis.fetch = async (_url, init) => {
    assert.equal(init.redirect, 'error')
    return new Response(JSON.stringify({ chart: { result: [{ meta: {
      regularMarketPrice: 150,
      chartPreviousClose: 125,
      regularMarketDayHigh: 155,
      regularMarketDayLow: 120,
      regularMarketTime: 1_700_000_000,
      shortName: 'Infosys',
      dangerousExtraField: 'not returned',
    } }] } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }
  const response = await quote(new Request('https://alpha.example/api/quote?symbols=INFY.NS'))
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.deepEqual(Object.keys(body.quotes['INFY.NS']).sort(), ['changePct', 'dayHigh', 'dayLow', 'name', 'prevClose', 'price', 'quotedAt'].sort())
  assert.equal(body.quotes['INFY.NS'].changePct, 20)
})

test('fails closed when upstream response declares an excessive body', async () => {
  globalThis.fetch = async () => new Response('{}', { status: 200, headers: { 'Content-Length': String(200 * 1024) } })
  const response = await quote(new Request('https://alpha.example/api/quote?symbols=INFY.NS'))
  assert.equal(response.status, 502)
  assert.deepEqual(await response.json(), { error: 'quote_unavailable', quotes: {} })
})
