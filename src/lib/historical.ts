import type { Candle } from '@/types'
export function validateCandles(input: unknown): Candle[] {
  if (!Array.isArray(input) || input.length < 25 || input.length > 5000)
    throw new Error('Use 25–5,000 OHLCV rows.')
  let previous = -Infinity
  return input.map((row) => {
    const c = row as Candle
    if (
      ![c.time, c.open, c.high, c.low, c.close, c.volume].every(Number.isFinite) ||
      c.time <= previous ||
      c.low <= 0 ||
      c.high < Math.max(c.open, c.close) ||
      c.low > Math.min(c.open, c.close) ||
      c.volume < 0
    )
      throw new Error(
        'Invalid candle: prices must be positive, OHLC consistent and times strictly increasing.',
      )
    previous = c.time
    return {
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }
  })
}
export function parseCandleCsv(text: string): Candle[] {
  if (text.length > 2_000_000) throw new Error('CSV exceeds 2 MB.')
  const lines = text.trim().split(/\r?\n/)
  const headers = lines
    .shift()!
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
  if (!['time', 'open', 'high', 'low', 'close', 'volume'].every((h) => headers.includes(h)))
    throw new Error(
      'CSV header: time,open,high,low,close,volume (time = Unix seconds or ISO date).',
    )
  return validateCandles(
    lines.map((line) => {
      const cells = line.split(',').map((s) => s.trim())
      const value = (key: string) => cells[headers.indexOf(key)]
      const ts = value('time')
      const time = /^\d+(\.\d+)?$/.test(ts) ? Number(ts) : Date.parse(ts) / 1000
      return {
        time,
        open: Number(value('open')),
        high: Number(value('high')),
        low: Number(value('low')),
        close: Number(value('close')),
        volume: Number(value('volume')),
      }
    }),
  )
}
