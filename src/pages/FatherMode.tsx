import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CandlestickChart, MessageCircle, NotebookPen, OctagonX, Target } from 'lucide-react'
import { Banner } from '@/components/common'
import { useStore } from '@/store/useStore'
import { inr } from '@/lib/format'
import { pickEvent } from '@/engines/mockMarketEngine'
import { TRADING_LESSONS } from '@/data/tradingLessons'

export default function FatherMode() {
  const { setFatherMode, fatherMode, balance, resetDay } = useStore()
  useEffect(() => { setFatherMode(true) }, [setFatherMode])

  // Deterministic "daily" lesson + market note (seeded by date).
  const today = new Date().toISOString().slice(0, 10)
  const lesson = TRADING_LESSONS[Math.abs(hash(today)) % TRADING_LESSONS.length]
  const ev = pickEvent(today)

  return (
    <div className="space-y-5">
      <Banner>Father Mode: pedda buttons, simple explanations. Anni mock money. Real trade ledu.</Banner>

      <div className="card">
        <div className="label">Ee roju lesson</div>
        <div className="font-bold text-lg">{lesson.title}</div>
        <div className="text-sm mt-1">{lesson.father}</div>
      </div>

      <div className="card">
        <div className="label">Market ee roju</div>
        <div className="font-semibold">{ev.name}</div>
        <div className="text-sm text-muted mt-1">{ev.fatherExplanation}</div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Link to="/manual" className="btn-primary flex items-center justify-center gap-2">
          <CandlestickChart size={20} /> Safe mock trade cheyyi
        </Link>
        <Link to="/coach" className="btn-ghost flex items-center justify-center gap-2">
          <MessageCircle size={20} /> AI Coach ni adugu
        </Link>
        <Link to="/journal" className="btn-ghost flex items-center justify-center gap-2">
          <NotebookPen size={20} /> Naa mistakes chudu
        </Link>
        <Link to="/compound" className="btn-ghost flex items-center justify-center gap-2">
          <Target size={20} /> ₹500 Challenge start cheyyi
        </Link>
        <button className="btn-down flex items-center justify-center gap-2" onClick={resetDay}>
          <OctagonX size={20} /> Ee roju aapedham (Stop Today)
        </button>
      </div>

      <div className="text-center text-sm text-muted">Mock balance: <b className="text-ink">{inr(balance)}</b></div>

      {fatherMode && (
        <button className="btn-ghost w-full !text-muted" onClick={() => setFatherMode(false)}>Switch to normal mode</button>
      )}
    </div>
  )
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}
