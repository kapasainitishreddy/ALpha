import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Flame, Share2 } from 'lucide-react'
import { Banner, Section, Stat } from '@/components/common'
import { useStore } from '@/store/useStore'
import { monthGrid, streaks } from '@/lib/progress'
import { shareCard, shareText } from '@/lib/share'
import { useToast } from '@/components/Toast'
import { inr } from '@/lib/format'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Colour a day by P&L magnitude relative to the month's biggest day, so a quiet month still
// shows contrast instead of everything washing out to the same faint green.
// Classes are spelled out in full — Tailwind scans source statically and drops built-up strings.
const UP = ['bg-up/20 border-up/40 text-up', 'bg-up/40 border-up/50 text-up', 'bg-up/60 border-up/60 text-bg']
const DOWN = ['bg-down/20 border-down/40 text-down', 'bg-down/40 border-down/50 text-down', 'bg-down/60 border-down/60 text-bg']

function cellStyle(pnl: number, peak: number): string {
  if (pnl === 0) return 'bg-panel2 border-edge text-muted'
  const strength = peak > 0 ? Math.min(1, Math.abs(pnl) / peak) : 1
  const i = strength > 0.66 ? 2 : strength > 0.33 ? 1 : 0
  return pnl > 0 ? UP[i] : DOWN[i]
}

export default function Progress() {
  const { history, trades, journal } = useStore()
  const toast = useToast()
  const [cursor, setCursor] = useState(() => new Date())

  const s = useMemo(() => streaks(history), [history])
  const grid = useMemo(
    () => monthGrid(history, cursor.getFullYear(), cursor.getMonth()),
    [history, cursor],
  )

  const monthDays = grid.flat().filter((c) => c.inMonth && c.trades > 0)
  const monthPnl = monthDays.reduce((a, c) => a + c.pnl, 0)
  const peak = Math.max(1, ...monthDays.map((c) => Math.abs(c.pnl)))

  const shiftMonth = (by: number) =>
    setCursor((d) => new Date(d.getFullYear(), d.getMonth() + by, 1))

  const closed = trades.filter((t) => t.status === 'closed')
  const best = closed.reduce((b, t) => ((t.realizedPnl ?? 0) > (b?.realizedPnl ?? -Infinity) ? t : b), closed[0])

  const shareProgress = async () => {
    const res = await shareCard({
      headline: `${s.current > 0 ? `${s.current}-day green streak` : 'My practice progress'}`,
      sub: `${s.tradingDays} practice days · ${s.greenDays} green · ${s.redDays} red`,
      pnl: history.reduce((a, d) => a + d.pnl, 0),
      rows: [
        ['Best streak', `${s.best} days`],
        ['Trades closed', String(closed.length)],
        ['Sessions logged', String(journal.length)],
        ['Best single trade', best?.realizedPnl ? inr(best.realizedPnl) : '—'],
      ],
    })
    toast(res === 'shared' ? 'Shared.' : 'Image saved to your downloads.')
  }

  const shareStreak = async () => {
    const text = [
      `*${s.current}-day green streak* on BlackScythe 🔥`,
      ``,
      `${s.tradingDays} practice days · ${s.greenDays} green · ${s.redDays} red`,
      `Best streak: ${s.best} days`,
      ``,
      `Practising with mock money — no real trades.`,
    ].join('\n')
    toast((await shareText(text)) === 'shared' ? 'Shared.' : 'Copied — paste it into WhatsApp.')
  }

  return (
    <div className="space-y-6">
      <Banner>
        Consistency beats one lucky day. This screen tracks whether you're actually improving over time.
      </Banner>

      {/* Streak hero */}
      <div className={`card !p-5 text-center ${s.current > 0 ? 'border-up/50' : ''}`}>
        <div className="flex items-center justify-center gap-2 label">
          <Flame size={14} className={s.current > 0 ? 'text-up' : 'text-muted'} />
          Current streak
        </div>
        <div className={`text-5xl font-extrabold my-1 ${s.current > 0 ? 'text-up' : 'text-muted'}`}>
          {s.current}
        </div>
        <div className="text-xs text-muted">
          {s.current > 0
            ? `${s.current} profitable day${s.current === 1 ? '' : 's'} in a row · best ever ${s.best}`
            : s.tradingDays === 0
              ? 'Close your first trade to start tracking'
              : `Best streak so far: ${s.best} days`}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Practice days" value={String(s.tradingDays)} />
        <Stat label="Green days" value={String(s.greenDays)} tone={s.greenDays ? 1 : undefined} />
        <Stat label="Red days" value={String(s.redDays)} tone={s.redDays ? -1 : undefined} />
      </div>

      {/* Calendar */}
      <Section
        title="P&L calendar"
        right={
          <div className="flex items-center gap-1">
            <button className="p-1 text-muted hover:text-ink" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-muted w-24 text-center">
              {MONTHS[cursor.getMonth()].slice(0, 3)} {cursor.getFullYear()}
            </span>
            <button className="p-1 text-muted hover:text-ink" onClick={() => shiftMonth(1)} aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
        }
      >
        <div className="card !p-3">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DOW.map((d, i) => (
              <div key={i} className="text-center text-[10px] text-muted">{d}</div>
            ))}
          </div>
          <div className="space-y-1">
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((c) => (
                  <div
                    key={c.date}
                    title={c.trades ? `${c.date}: ${inr(c.pnl)} over ${c.trades} trade(s)` : c.date}
                    className={`aspect-square rounded-md border flex items-center justify-center text-[10px] font-semibold ${
                      c.inMonth ? cellStyle(c.pnl, peak) : 'border-transparent text-edge'
                    }`}
                  >
                    {+c.date.slice(-2)}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-edge text-xs">
            <span className="text-muted">{MONTHS[cursor.getMonth()]} total</span>
            <span className={`font-bold ${monthPnl > 0 ? 'text-up' : monthPnl < 0 ? 'text-down' : 'text-muted'}`}>
              {monthDays.length ? inr(monthPnl) : 'no trades'}
            </span>
          </div>
        </div>
      </Section>

      <Section title="Share your progress">
        <div className="flex gap-3">
          <button className="btn-ghost flex-1 flex items-center justify-center gap-2" onClick={shareStreak}>
            <Share2 size={16} /> Share as text
          </button>
          <button className="btn-primary flex-1 flex items-center justify-center gap-2" onClick={shareProgress}>
            <Share2 size={16} /> Share as image
          </button>
        </div>
      </Section>

      <Banner>All values are mock money from practice sessions. Nothing here reflects real trading.</Banner>
    </div>
  )
}
