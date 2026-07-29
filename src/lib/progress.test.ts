import { describe, expect, it } from 'vitest'
import { monthGrid, streaks } from './progress'

const day = (date: string, pnl: number) => ({ date, pnl, trades: 1 })

describe('streaks', () => {
  it('counts a run of consecutive green days', () => {
    const s = streaks([day('2026-01-05', 10), day('2026-01-06', 20), day('2026-01-07', 5)])
    expect(s.best).toBe(3)
    expect(s.greenDays).toBe(3)
  })

  it('breaks the streak on a red day', () => {
    const s = streaks([day('2026-01-05', 10), day('2026-01-06', -20), day('2026-01-07', 5)])
    expect(s.best).toBe(1)
    expect(s.redDays).toBe(1)
  })

  it('does not count non-consecutive green days as a streak', () => {
    // Same two green days, a week apart — that is not a streak.
    const s = streaks([day('2026-01-05', 10), day('2026-01-12', 20)])
    expect(s.best).toBe(1)
  })

  it('reports no current streak when the last green day is stale', () => {
    expect(streaks([day('2020-01-05', 10)]).current).toBe(0)
  })
})

describe('monthGrid', () => {
  it('builds Monday-first weeks and maps pnl onto the right day', () => {
    const grid = monthGrid([day('2026-01-15', 250)], 2026, 0)
    expect(grid[0]).toHaveLength(7)
    const cell = grid.flat().find((c) => c.date === '2026-01-15')
    expect(cell?.pnl).toBe(250)
    expect(cell?.inMonth).toBe(true)
  })
})
