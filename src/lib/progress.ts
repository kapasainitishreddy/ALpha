import type { DayRecord } from '@/store/useStore'

// Streak + calendar math over the day history. Pure — the UI just renders what this returns.

export interface Streaks {
  current: number // consecutive profitable days ending today/yesterday
  best: number
  tradingDays: number
  greenDays: number
  redDays: number
}

const dayMs = 86_400_000
const toDate = (key: string) => new Date(`${key}T00:00:00`)

export function streaks(history: DayRecord[]): Streaks {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
  const green = sorted.filter((d) => d.pnl > 0).length
  const red = sorted.filter((d) => d.pnl < 0).length

  let best = 0
  let run = 0
  let prev: Date | null = null
  for (const d of sorted) {
    const date = toDate(d.date)
    // A gap in dates breaks the run even if both days were green — a streak means consecutive days.
    const consecutive = prev !== null && Math.round((date.getTime() - prev.getTime()) / dayMs) === 1
    run = d.pnl > 0 ? (consecutive ? run + 1 : 1) : 0
    best = Math.max(best, run)
    prev = date
  }

  // `run` is only the live streak if the last green day was today or yesterday.
  const last = sorted[sorted.length - 1]
  const staleness = last ? Math.round((Date.now() - toDate(last.date).getTime()) / dayMs) : Infinity
  const current = staleness <= 1 ? run : 0

  return { current, best, tradingDays: sorted.length, greenDays: green, redDays: red }
}

export interface CalendarCell {
  date: string
  pnl: number
  trades: number
  inMonth: boolean
}

// Weeks (Mon-first) covering the given month, padded so the grid is always rectangular.
export function monthGrid(history: DayRecord[], year: number, month: number): CalendarCell[][] {
  const byDate = new Map(history.map((d) => [d.date, d]))
  const first = new Date(year, month, 1)
  const start = new Date(first)
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7)) // back up to Monday

  const weeks: CalendarCell[][] = []
  const cur = new Date(start)
  for (let w = 0; w < 6; w++) {
    const week: CalendarCell[] = []
    for (let d = 0; d < 7; d++) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`
      const rec = byDate.get(key)
      week.push({ date: key, pnl: rec?.pnl ?? 0, trades: rec?.trades ?? 0, inMonth: cur.getMonth() === month })
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(week)
    if (cur.getMonth() !== month && w >= 3) break // stop once we've cleared the month
  }
  return weeks
}
