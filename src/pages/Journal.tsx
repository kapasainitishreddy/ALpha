import { Link } from 'react-router-dom'
import { ImageDown, NotebookPen, Share2 } from 'lucide-react'
import { Banner, Empty, Section } from '@/components/common'
import { SpeakButton } from '@/components/SpeakButton'
import { useStore, modeLabel } from '@/store/useStore'
import { inr, pnlColor } from '@/lib/format'
import { sessionText, shareCard, shareText } from '@/lib/share'
import { useToast } from '@/components/Toast'
import type { JournalEntry } from '@/types'

function ShareRow({ j }: { j: JournalEntry }) {
  const toast = useToast()

  const asText = async () => {
    toast((await shareText(sessionText(j))) === 'shared' ? 'Shared.' : 'Copied — paste it into WhatsApp.')
  }
  const asImage = async () => {
    const res = await shareCard({
      headline: `${modeLabel[j.mode]} session`,
      sub: new Date(j.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      pnl: j.pnl,
      rows: [
        ['Trades', String(j.tradeCount)],
        ['Best trade', inr(j.bestTradePnl)],
        ['Worst trade', inr(j.worstTradePnl)],
        ['Rules', j.followedRules ? 'Followed' : 'Broke a rule'],
      ],
    }, `blackscythe-${j.id}.png`)
    toast(res === 'shared' ? 'Shared.' : 'Image saved to your downloads.')
  }

  return (
    <div className="pt-2 border-t border-edge">
      <div className="flex gap-2">
        <button className="btn-ghost flex-1 !py-2 !text-xs flex items-center justify-center gap-1.5" onClick={asText}>
          <Share2 size={13} /> Share text
        </button>
        <button className="btn-ghost flex-1 !py-2 !text-xs flex items-center justify-center gap-1.5" onClick={asImage}>
          <ImageDown size={13} /> Share card
        </button>
      </div>
    </div>
  )
}

export default function Journal() {
  const journal = useStore((s) => s.journal)

  if (!journal.length) {
    return (
      <Empty
        icon={<NotebookPen size={30} />}
        title="No sessions reviewed yet"
        body="Finish a session in any practice mode and tap “Save to journal”. You'll get a breakdown of what went well, the mistakes worth fixing, and one lesson for next time."
        action={<Link to="/manual" className="btn-primary inline-block">Place your first practice trade</Link>}
      />
    )
  }

  return (
    <div className="space-y-4">
      <Banner>AI review of each mock session, what went well, mistakes, and tomorrow's lesson.</Banner>
      {journal.map((j) => (
        <div key={j.id} className="card space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{modeLabel[j.mode]}</span>
            <span className={`font-bold ${pnlColor(j.pnl)}`}>{inr(j.pnl)}</span>
          </div>
          <div className="text-xs text-muted">
            {new Date(j.createdAt).toLocaleString('en-IN')} · {j.tradeCount} trades · {j.followedRules ? 'followed rules' : 'broke a rule'}
          </div>

          {j.mistakes.length > 0 && (
            <Section title="Mistakes">
              <div className="space-y-1">
                {j.mistakes.map((m, i) => (
                  <div key={i} className="text-sm">
                    <span className={`chip mr-1 ${m.severity === 'high' ? '!text-down' : m.severity === 'medium' ? '!text-warn' : ''}`}>{m.severity}</span>
                    <b>{m.title}.</b> <span className="text-accent">{m.fatherAdvice}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {j.wentWell.length > 0 && (
            <div className="text-sm"><span className="label">Went well</span>
              <ul className="list-disc list-inside text-up/90">{j.wentWell.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
          {j.couldImprove.length > 0 && (
            <div className="text-sm"><span className="label">Could improve</span>
              <ul className="list-disc list-inside text-muted">{j.couldImprove.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
          <div className="flex items-start gap-2">
            <div className="flex-1"><Banner>{j.tomorrowLesson}</Banner></div>
            <SpeakButton text={`${j.tomorrowLesson}. ${j.mistakes.map((m) => m.fatherAdvice).join('. ')}`} />
          </div>
          <ShareRow j={j} />
        </div>
      ))}
    </div>
  )
}
