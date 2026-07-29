import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, Medal, Share2, Trophy } from 'lucide-react'
import { Banner, Empty, Section, Stat } from '@/components/common'
import { useToast } from '@/components/Toast'
import { useStore, modeLabel, todayKey, type Mood } from '@/store/useStore'
import { leaderboard } from '@/lib/insights'
import { MARKET_EVENTS } from '@/data/marketEvents'
import { MOCK_SYMBOLS } from '@/data/mockSymbols'
import { hashSeed } from '@/lib/rng'
import { shareText } from '@/lib/share'
import { inr, pnlColor } from '@/lib/format'

const MOODS: { id: Mood; label: string; hint: string }[] = [
  { id: 'calm', label: 'Calm', hint: 'Clear head, no rush' },
  { id: 'confident', label: 'Confident', hint: 'Feeling sharp' },
  { id: 'anxious', label: 'Anxious', hint: 'Uneasy, unsure' },
  { id: 'greedy', label: 'Greedy', hint: 'Chasing a big one' },
  { id: 'frustrated', label: 'Frustrated', hint: 'Want it back' },
]

// The daily challenge is derived from the date, so everyone gets the same market on the same
// day and results are comparable — without any server.
function todaysSetup(date: string) {
  const seed = hashSeed(date)
  // >>> not >>: hashSeed returns an unsigned 32-bit value, and a signed shift turns anything
  // above 2^31 negative — which then indexes the array out of bounds and yields undefined.
  const symbol = MOCK_SYMBOLS[seed % MOCK_SYMBOLS.length]
  const event = MARKET_EVENTS[(seed >>> 8) % MARKET_EVENTS.length]
  return { symbol, event }
}

export default function Arena() {
  const { journal, dailyResults, moods, logMood } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<'daily' | 'board'>('daily')

  const today = todayKey()
  const setup = useMemo(() => todaysSetup(today), [today])
  const doneToday = dailyResults.find((d) => d.date === today)
  const board = useMemo(() => leaderboard(journal), [journal])
  const moodToday = moods.filter((m) => new Date(m.at).toDateString() === new Date().toDateString()).slice(-1)[0]

  const best = dailyResults.reduce((b, d) => (d.pnlPct > (b?.pnlPct ?? -Infinity) ? d : b), dailyResults[0])

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button className={`flex-1 rounded-xl py-2 text-xs font-semibold ${tab === 'daily' ? 'bg-accent text-bg' : 'bg-panel2 text-muted border border-edge'}`} onClick={() => setTab('daily')}>
          Daily challenge
        </button>
        <button className={`flex-1 rounded-xl py-2 text-xs font-semibold ${tab === 'board' ? 'bg-accent text-bg' : 'bg-panel2 text-muted border border-edge'}`} onClick={() => setTab('board')}>
          Best sessions
        </button>
      </div>

      {tab === 'daily' ? (
        <>
          <Banner>
            One market, one day, everyone gets the same one. Come back tomorrow for a different market —
            the point is a short honest rep, not a grind.
          </Banner>

          <div className="card !p-5 text-center">
            <div className="flex items-center justify-center gap-2 label">
              <CalendarClock size={14} className="text-accent" />
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div className="text-2xl font-extrabold my-2">{setup.symbol.symbol}</div>
            <div className="text-sm text-muted">{setup.event.name}</div>
            <p className="text-xs text-muted mt-3 leading-relaxed border-t border-edge pt-3">
              {setup.event.fatherExplanation}
            </p>
          </div>

          {doneToday ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Today's result" value={`${doneToday.pnlPct >= 0 ? '+' : ''}${doneToday.pnlPct.toFixed(2)}%`} tone={doneToday.pnlPct} />
                <Stat label="Trades" value={String(doneToday.trades)} />
              </div>
              <Banner>Already played today. Your result is locked in — no re-rolling until tomorrow.</Banner>
              <button
                className="btn-ghost w-full flex items-center justify-center gap-2"
                onClick={async () => {
                  const r = await shareText(
                    `BlackScythe daily — ${setup.symbol.symbol} on a ${setup.event.name.toLowerCase()}\n` +
                    `My result: ${doneToday.pnlPct >= 0 ? '+' : ''}${doneToday.pnlPct.toFixed(2)}% over ${doneToday.trades} trades.\n\n` +
                    `Practice with mock money — no real trades.`,
                  )
                  toast(r === 'shared' ? 'Shared.' : 'Copied.')
                }}
              >
                <Share2 size={16} /> Share today's result
              </button>
            </>
          ) : (
            <>
              <Section title="Before you start — how do you feel?">
                {moodToday ? (
                  <Banner>Logged as <b>{MOODS.find((m) => m.id === moodToday.mood)?.label}</b>. Your result gets matched against this in Insights.</Banner>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {MOODS.map((m) => (
                        <button key={m.id} className="card !p-3 text-left hover:border-accent transition" onClick={() => { logMood(m.id); toast(`Logged: ${m.label}.`) }}>
                          <div className="font-semibold text-sm">{m.label}</div>
                          <div className="text-[11px] text-muted">{m.hint}</div>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted leading-relaxed">
                      Honestly. Over time this reveals which emotional state costs you money — usually the
                      most useful number in the whole app, and the one people least want to look at.
                    </p>
                  </>
                )}
              </Section>

              <Link to={`/manual?symbol=${setup.symbol.symbol}&event=${setup.event.id}`} className="btn-primary w-full block text-center">
                Play today's market
              </Link>
              <p className="text-xs text-muted text-center">
                Trade it in Manual mode, then save the session to your journal to lock in a result.
              </p>
            </>
          )}

          {dailyResults.length > 0 && (
            <Section title="Your daily history">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Days played" value={String(dailyResults.length)} />
                <Stat label="Best day" value={best ? `${best.pnlPct >= 0 ? '+' : ''}${best.pnlPct.toFixed(1)}%` : '—'} tone={best?.pnlPct} />
              </div>
            </Section>
          )}
        </>
      ) : (
        <>
          <Banner>
            Your best sessions, ranked by return on the balance you started with — so a small account
            can top the board. Stored on this device only.
          </Banner>

          {board.length === 0 ? (
            <Empty
              icon={<Trophy size={30} />}
              title="No ranked sessions yet"
              body="Save a session to your journal and it lands here. Ranking is by percentage return, not rupees."
              action={<Link to="/manual" className="btn-primary inline-block">Practise a session</Link>}
            />
          ) : (
            <div className="space-y-2">
              {board.map(({ entry, returnPct, rank }) => (
                <div key={entry.id} className={`card !p-3 flex items-center gap-3 ${rank === 1 ? 'border-up/50' : ''}`}>
                  <span className={`w-7 text-center font-extrabold ${rank === 1 ? 'text-up' : rank <= 3 ? 'text-accent' : 'text-muted'}`}>
                    {rank <= 3 ? <Medal size={16} className="inline" /> : rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm">{modeLabel[entry.mode]}</div>
                    <div className="text-[11px] text-muted">
                      {new Date(entry.createdAt).toLocaleDateString('en-IN')} · {entry.tradeCount} trades ·{' '}
                      {entry.followedRules ? 'followed rules' : 'broke a rule'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-bold ${pnlColor(returnPct)}`}>{returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%</div>
                    <div className="text-[11px] text-muted">{inr(entry.pnl)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {board.length >= 3 && (
            <p className="text-xs text-muted leading-relaxed">
              Worth checking: did your top sessions follow the rules, or did they break them and get lucky?
              A rule-breaking win is the most expensive thing you can learn from.
            </p>
          )}
        </>
      )}
    </div>
  )
}
