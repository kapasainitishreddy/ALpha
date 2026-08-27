import { useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, BookOpen, Bot, Calculator, CalendarDays, ChevronRight, Compass, Database, Download, Eye,
  Flag, FlaskConical, KeyRound, LineChart, Lock, MessageCircle, NotebookPen, Radio, Scale, Sparkles,
  Swords, Upload, Wand2, Trophy, BarChart3, Clapperboard, Layers,
} from 'lucide-react'
import { Banner, Section } from '@/components/common'
import { useStore } from '@/store/useStore'
import { useToast } from '@/components/Toast'
import { BACKUP_MAX_BYTES, createPortableBackup, parsePortableBackup } from '@/lib/portableBackup'

const LINKS = [
  { to: '/live', Icon: Radio, label: 'Live Practice — real prices' },
  { to: '/risk', Icon: Calculator, label: 'Risk Tools — size, stop, R:R' },
  { to: '/builder', Icon: Wand2, label: 'Strategy Builder — no code' },
  { to: '/debate', Icon: Swords, label: 'Agent Debate — bull vs bear' },
  { to: '/arena', Icon: Trophy, label: 'Daily Challenge & Leaderboard' },
  { to: '/insights', Icon: BarChart3, label: 'Insights — what suits you' },
  { to: '/quality', Icon: BarChart3, label: 'Performance Quality — expectancy & drawdown' },
  { to: '/scenarios', Icon: Clapperboard, label: 'Scenario Lab — build a market' },
  { to: '/options', Icon: Layers, label: 'Option Chain (learn only)' },
  { to: '/challenge', Icon: Flag, label: 'Challenge Mode' },
  { to: '/progress', Icon: CalendarDays, label: 'Progress & Streaks' },
  { to: '/assisted', Icon: Compass, label: 'AI-Assisted Trading' },
  { to: '/auto', Icon: Bot, label: 'AI Auto (mock)' },
  { to: '/coach', Icon: MessageCircle, label: 'AI Coach' },
  { to: '/strategies', Icon: BookOpen, label: 'Strategy Lab' },
  { to: '/backtest', Icon: FlaskConical, label: 'Backtest Lab' },
  { to: '/compound', Icon: LineChart, label: 'Compound Simulator' },
  { to: '/journal', Icon: NotebookPen, label: 'Trade Journal & Mistakes' },
  { to: '/comparison', Icon: Scale, label: 'Comparison Dashboard' },
  { to: '/market', Icon: Activity, label: 'Market Simulator' },
  { to: '/watchlist', Icon: Eye, label: 'Watchlist (live crypto)' },
  { to: '/settings/ai', Icon: Sparkles, label: 'AI Settings' },
  { to: '/dataset', Icon: Database, label: 'Fine-Tuning Dataset Builder' },
  { to: '/settings/api', Icon: KeyRound, label: 'API Key Settings' },
  { to: '/real', Icon: Lock, label: 'Real Trading Mode (locked)' },
]

const ACCEPTED_BACKUP_MIME = new Set(['', 'application/json', 'text/json'])

export default function More() {
  const resetAll = useStore((s) => s.resetAll)
  const resetDay = useStore((s) => s.resetDay)
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useToast()

  const exportBackup = () => {
    const raw = createPortableBackup(useStore.getState())
    const blob = new Blob([raw], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blackscythe-alpha-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
    toast('Backup exported. API keys are never included.')
  }

  const importBackup = async (file?: File) => {
    if (!file) return
    try {
      if (!file.name.toLowerCase().endsWith('.json') || !ACCEPTED_BACKUP_MIME.has(file.type)) {
        throw new Error('Choose a JSON backup file.')
      }
      if (file.size <= 0 || file.size > BACKUP_MAX_BYTES) throw new Error('Backup must be between 1 byte and 1 MiB.')
      const restored = parsePortableBackup(await file.text())
      if (!confirm('Replace current mock-trading history with this backup? API keys will be cleared.')) return
      const current = useStore.getState()
      useStore.setState({ ...restored, apiKeys: {}, llm: { ...current.llm, apiKey: '' } })
      toast('Backup restored. Session API keys were cleared.')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Backup restore failed.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <Section title="All screens">
        <div className="space-y-2">
          {LINKS.map(({ to, Icon, label }) => (
            <Link key={to} to={to} className="card flex items-center gap-3 hover:border-accent transition !py-3">
              <Icon size={18} strokeWidth={1.8} className="text-accent shrink-0" />
              <span className="font-medium">{label}</span>
              <ChevronRight size={16} className="ml-auto text-muted" />
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Backup & recovery">
        <div className="card space-y-3 text-sm">
          <p className="text-muted">Export your local practice history before clearing browser data or moving devices. Backups never contain broker or AI API keys.</p>
          <div className="flex gap-3">
            <button className="btn-ghost flex-1 flex items-center justify-center gap-2" onClick={exportBackup}>
              <Download size={16} /> Export JSON
            </button>
            <button className="btn-ghost flex-1 flex items-center justify-center gap-2" onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Restore JSON
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json,text/json"
            className="hidden"
            onChange={(e) => void importBackup(e.target.files?.[0])}
          />
        </div>
      </Section>

      <Section title="Session">
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={resetDay}>Reset day counters</button>
          <button className="btn-ghost flex-1 !text-down" onClick={() => confirm('Reset all mock data?') && resetAll()}>
            Reset all mock data
          </button>
        </div>
      </Section>

      <Banner>Everything here is mock money. No keys required. No real trades.</Banner>
    </div>
  )
}
