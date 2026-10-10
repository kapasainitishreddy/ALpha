import { localId } from '@/lib/id'
import { priceOption, type OptType } from './options'
export interface OptionLeg {
  type: OptType
  strike: number
  side: 1 | -1
}
export type OptionStructure = 'call' | 'put' | 'bull-call' | 'bear-put' | 'straddle' | 'iron-condor'
export function optionLegs(structure: OptionStructure, strike: number, width: number): OptionLeg[] {
  switch (structure) {
    case 'call':
      return [{ type: 'call', strike, side: 1 }]
    case 'put':
      return [{ type: 'put', strike, side: 1 }]
    case 'bull-call':
      return [
        { type: 'call', strike, side: 1 },
        { type: 'call', strike: strike + width, side: -1 },
      ]
    case 'bear-put':
      return [
        { type: 'put', strike, side: 1 },
        { type: 'put', strike: strike - width, side: -1 },
      ]
    case 'straddle':
      return [
        { type: 'call', strike, side: 1 },
        { type: 'put', strike, side: 1 },
      ]
    case 'iron-condor':
      return [
        { type: 'put', strike: strike - width, side: -1 },
        { type: 'put', strike: strike - 2 * width, side: 1 },
        { type: 'call', strike: strike + width, side: -1 },
        { type: 'call', strike: strike + 2 * width, side: 1 },
      ]
  }
}
export function legValue(legs: OptionLeg[], spot: number, days: number, iv: number): number {
  return legs.reduce(
    (v, l) =>
      v +
      l.side *
        (days <= 0
          ? Math.max(0, l.type === 'call' ? spot - l.strike : l.strike - spot)
          : priceOption(spot, l.strike, l.type, days, iv).premium),
    0,
  )
}
export function optionGreeks(legs: OptionLeg[], spot: number, days: number, iv: number) {
  const h = spot * 0.001,
    value = legValue(legs, spot, days, iv),
    up = legValue(legs, spot + h, days, iv),
    down = legValue(legs, spot - h, days, iv)
  return {
    delta: (up - down) / (2 * h),
    gamma: (up - 2 * value + down) / (h * h),
    theta: legValue(legs, spot, Math.max(0, days - 1), iv) - value,
    vega: legValue(legs, spot, days, iv + 1) - value,
  }
}
export interface LabPosition {
  id: string
  kind: 'future' | 'option'
  symbol: string
  units: number
  side: 1 | -1
  entry: number
  openedIdx: number
  expiryIdx: number
  legs: OptionLeg[]
  iv: number
  margin: number
  entryFee: number
  variationPnl?: number
  closedPnl?: number
  closedIdx?: number
  reason?: string
}
export interface DerivativeBook {
  version: 1
  balance: number
  idx: number
  symbol: string
  positions: LabPosition[]
}
export function markPosition(p: LabPosition, spot: number, idx: number): number {
  const mark = p.kind === 'future' ? spot : legValue(p.legs, spot, p.expiryIdx - idx, p.iv)
  return (mark - p.entry) * p.units * p.side
}
export function collateral(p: LabPosition): number {
  return p.margin
}
export function createLabPosition(
  kind: 'future' | 'option',
  symbol: string,
  spot: number,
  idx: number,
  side: 1 | -1,
  units: number,
  structure: OptionStructure,
  days: number,
  iv: number,
  width: number,
): LabPosition {
  if (
    ![spot, units, days, iv, width].every(Number.isFinite) ||
    spot <= 0 ||
    units <= 0 ||
    days < 1 ||
    days > 60 ||
    iv < 1 ||
    iv > 100 ||
    width <= 0 ||
    spot - 2 * width <= 0
  )
    throw new Error('Invalid contract settings.')
  const legs = kind === 'option' ? optionLegs(structure, spot, width) : []
  const entry = kind === 'future' ? spot : legValue(legs, spot, days, iv)
  const notional =
    kind === 'future'
      ? spot * units
      : legs.reduce((v, l) => v + priceOption(spot, l.strike, l.type, days, iv).premium * units, 0)
  // Credit iron condor has bounded strike width exposure. No naked short options offered.
  const margin =
    kind === 'future'
      ? spot * units * 0.1
      : structure === 'iron-condor'
        ? Math.max(0, width + entry) * units
        : Math.max(0, entry) * units
  return {
    id: localId(),
    kind,
    symbol,
    units,
    side: kind === 'future' ? side : 1,
    entry,
    openedIdx: idx,
    expiryIdx: idx + days,
    legs,
    iv,
    margin,
    entryFee: notional * 0.0008,
  }
}
export function closeLabPosition(
  p: LabPosition,
  spot: number,
  idx: number,
  reason: string,
): LabPosition {
  const exitNotional =
    p.kind === 'future'
      ? spot * p.units
      : p.legs.reduce(
          (v, l) =>
            v +
            (p.expiryIdx <= idx
              ? Math.max(0, l.type === 'call' ? spot - l.strike : l.strike - spot)
              : priceOption(spot, l.strike, l.type, p.expiryIdx - idx, p.iv).premium) *
              p.units,
          0,
        )
  const pnl =
    (p.variationPnl ?? 0) + markPosition(p, spot, idx) - p.entryFee - exitNotional * 0.0008
  return { ...p, closedPnl: pnl, closedIdx: idx, reason }
}
