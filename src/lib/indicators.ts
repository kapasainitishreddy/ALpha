import type { Candle } from '@/types'

export function sma(values: number[], period: number): number[] {
  const out: number[] = []
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= period) sum -= values[i - period]
    out.push(i >= period - 1 ? sum / period : NaN)
  }
  return out
}

export function ema(values: number[], period: number): number[] {
  const out: number[] = []
  const k = 2 / (period + 1)
  let prev = values[0]
  for (let i = 0; i < values.length; i++) {
    prev = i === 0 ? values[0] : values[i] * k + prev * (1 - k)
    out.push(prev)
  }
  return out
}

export function rsi(values: number[], period = 14): number[] {
  const out: number[] = [NaN]
  let gain = 0
  let loss = 0
  for (let i = 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1]
    const g = Math.max(diff, 0)
    const l = Math.max(-diff, 0)
    if (i <= period) {
      gain += g
      loss += l
      if (i === period) {
        gain /= period
        loss /= period
        out.push(100 - 100 / (1 + gain / (loss || 1e-9)))
      } else {
        out.push(NaN)
      }
    } else {
      gain = (gain * (period - 1) + g) / period
      loss = (loss * (period - 1) + l) / period
      out.push(100 - 100 / (1 + gain / (loss || 1e-9)))
    }
  }
  return out
}

export function vwap(candles: Candle[]): number[] {
  const out: number[] = []
  let cumPV = 0
  let cumV = 0
  for (const c of candles) {
    const typical = (c.high + c.low + c.close) / 3
    cumPV += typical * c.volume
    cumV += c.volume
    out.push(cumPV / (cumV || 1))
  }
  return out
}

export function atr(candles: Candle[], period = 14): number[] {
  const trs: number[] = []
  for (let i = 0; i < candles.length; i++) {
    if (i === 0) {
      trs.push(candles[i].high - candles[i].low)
      continue
    }
    const c = candles[i]
    const prevClose = candles[i - 1].close
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose)))
  }
  return ema(trs, period)
}

export const closes = (candles: Candle[]): number[] => candles.map((c) => c.close)
