import { Link } from 'react-router-dom'
import {
  Bot, Calculator, CandlestickChart, Compass, Flag, Flame, FlaskConical, Lock,
  MessageCircle, Network, NotebookPen, Radio, Swords, Trophy, UserRound, Wand2, BarChart3,
} from 'lucide-react'
import { Banner, Section } from '@/components/common'
import { useStore } from '@/store/useStore'
import { streaks } from '@/lib/progress'
import { inr, pnlColor } from '@/lib/format'
import { DISCLAIMERS } from '@/data/disclaimers'

const TILES = [
  { to: '/father', Icon: UserRound, title: 'Father Mode', desc: 'Simple, safe practice' },
  { to: '/manual', Icon: CandlestickChart, title: 'Manual Trade', desc: 'Place mock trades yourself' },
  { to: '/live', Icon: Radio, title: 'Live Practice', desc: 'Real prices, fake money' },
  { to: '/risk', Icon: Calculator, title: 'Risk Tools', desc: 'Size before you buy' },
  { to: '/challenge', Icon: Flag, title: 'Challenge', desc: 'Practice with a deadline' },
  { to: '/assisted', Icon: Compass, title: 'AI-Assisted', desc: 'AI suggests, you approve' },
  { to: '/auto', Icon: Bot, title: 'AI Auto (mock)', desc: 'AI trades fake money' },
  { to: '/swarm', Icon: Network, title: 'Strategy Swarm', desc: 'Split capital across agents' },
  { to: '/debate', Icon: Swords, title: 'Agent Debate', desc: 'Bull vs bear — you judge' },
  { to: '/builder', Icon: Wand2, title: 'Strategy Builder', desc: 'Make your own, no code' },
  { to: '/backtest', Icon: FlaskConical, title: 'Backtest Lab', desc: 'Test a strategy' },
  { to: '/coach', Icon: MessageCircle, title: 'AI Coach', desc: 'Ask in English or Telugu' },
  { to: '/arena', Icon: Trophy, title: 'Daily Challenge', desc: 'One market a day' },
  { to: '/insights', Icon: BarChart3, title: 'Insights', desc: 'What actually suits you' },
  { to: '/journal', Icon: NotebookPen, title: 'Journal', desc: 'Review your sessions' },
]

export default function Home() {
  const { balance, journal, history, challenge } = useStore()
  const last = journal[0]
  const s = streaks(history)

  return (
    <div className="space-y-6">
      <Banner>{DISCLAIMERS.general}</Banner>

      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <div className="label">Mock portfolio</div>
            <div className="text-3xl font-extrabold">{inr(balance)}</div>
            {last && (
              <div className="text-sm text-muted mt-1">
                Last session ({last.mode}): <span className={pnlColor(last.pnl)}>{inr(last.pnl)}</span>
              </div>
            )}
          </div>
          {s.current > 0 && (
            <Link to="/progress" className="text-right shrink-0">
              <div className="flex items-center gap-1 text-up justify-end">
                <Flame size={16} />
                <span className="text-2xl font-extrabold">{s.current}</span>
              </div>
              <div className="text-[10px] text-muted">day streak</div>
            </Link>
          )}
        </div>
      </div>

      {challenge?.status === 'active' && (
        <Link to="/challenge" className="block">
          <div className="card !py-3 border-accent/50 flex items-center gap-3">
            <Flag size={18} className="text-accent shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-sm truncate">{challenge.name}</div>
              <div className="text-xs text-muted">
                {inr(balance)} of {inr(challenge.targetCapital)} target
              </div>
            </div>
            <div className="text-xs font-bold text-accent shrink-0">
              {Math.max(0, Math.min(100, ((balance - challenge.startCapital) / (challenge.targetCapital - challenge.startCapital)) * 100)).toFixed(0)}%
            </div>
          </div>
        </Link>
      )}

      <Section title="Practice modes">
        <div className="grid grid-cols-2 gap-3">
          {TILES.map(({ to, Icon, title, desc }) => (
            <Link key={to} to={to} className="card hover:border-accent transition">
              <Icon size={22} strokeWidth={1.8} className="text-accent" />
              <div className="font-semibold mt-2">{title}</div>
              <div className="text-xs text-muted">{desc}</div>
            </Link>
          ))}
        </div>
      </Section>

      <Link to="/real" className="block">
        <Banner tone="lock">
          <Lock size={14} className="inline mr-1" />
          {DISCLAIMERS.realLocked}
        </Banner>
      </Link>
    </div>
  )
}
