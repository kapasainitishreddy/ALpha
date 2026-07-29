import type { JournalEntry } from '@/types'
import { inr } from './format'
import { modeLabel } from '@/store/useStore'

// Sharing a session is how this app spreads. Every export carries the mock-money label so a
// screenshot can never be mistaken for real trading results.

const TAG = 'Practice session on BlackScythe — mock money, no real trades.'

export function sessionText(e: JournalEntry): string {
  const sign = e.pnl >= 0 ? '+' : ''
  const lines = [
    `*BlackScythe practice session*`,
    ``,
    `Mode: ${modeLabel[e.mode]}`,
    `Result: ${sign}${inr(e.pnl)}  (${e.tradeCount} trade${e.tradeCount === 1 ? '' : 's'})`,
    `Balance: ${inr(e.startBalance)} → ${inr(e.endBalance)}`,
  ]
  if (e.strategiesUsed.length) lines.push(`Strategies: ${e.strategiesUsed.join(', ')}`)
  if (e.mistakes.length) {
    lines.push(``)
    lines.push(`What I got wrong:`)
    e.mistakes.slice(0, 3).forEach((m) => lines.push(`• ${m.title}`))
  }
  if (e.tomorrowLesson) {
    lines.push(``)
    lines.push(`Lesson: ${e.tomorrowLesson}`)
  }
  lines.push(``, TAG)
  return lines.join('\n')
}

export function whatsappUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

// Prefer the native share sheet on mobile (works for WhatsApp, Telegram, anything installed);
// fall back to clipboard on desktop where navigator.share usually doesn't exist.
export async function shareText(text: string): Promise<'shared' | 'copied'> {
  if (navigator.share) {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch {
      // user dismissed the sheet, or share failed — fall through to clipboard
    }
  }
  await navigator.clipboard.writeText(text)
  return 'copied'
}

export interface CardData {
  headline: string
  sub: string
  pnl: number
  rows: [string, string][]
}

// Renders a share card to a PNG blob via canvas. No html2canvas dependency — the layout is
// simple enough that drawing it directly is smaller than pulling in a library.
export function renderCard(d: CardData): Promise<Blob> {
  const W = 1080
  const H = 1080
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const g = c.getContext('2d')!

  g.fillStyle = '#0b0e14'
  g.fillRect(0, 0, W, H)

  const accent = d.pnl >= 0 ? '#22c55e' : '#ef4444'
  g.strokeStyle = accent
  g.lineWidth = 6
  g.strokeRect(40, 40, W - 80, H - 80)

  g.fillStyle = '#7d8590'
  g.font = 'bold 30px system-ui, sans-serif'
  g.fillText('BLACKSCYTHE — PRACTICE', 90, 140)

  g.fillStyle = '#e6edf3'
  g.font = 'bold 62px system-ui, sans-serif'
  g.fillText(d.headline, 90, 250)

  g.fillStyle = '#7d8590'
  g.font = '34px system-ui, sans-serif'
  g.fillText(d.sub, 90, 310)

  g.fillStyle = accent
  g.font = 'bold 150px system-ui, sans-serif'
  g.fillText(`${d.pnl >= 0 ? '+' : ''}${inr(d.pnl)}`, 90, 500)

  g.font = '36px system-ui, sans-serif'
  d.rows.slice(0, 5).forEach(([k, v], i) => {
    const y = 620 + i * 70
    g.fillStyle = '#7d8590'
    g.fillText(k, 90, y)
    g.fillStyle = '#e6edf3'
    g.textAlign = 'right'
    g.fillText(v, W - 90, y)
    g.textAlign = 'left'
  })

  g.fillStyle = '#7d8590'
  g.font = '28px system-ui, sans-serif'
  g.fillText('Mock money. Not investment advice.', 90, H - 90)

  return new Promise((resolve) => c.toBlob((b) => resolve(b!), 'image/png'))
}

export async function shareCard(d: CardData, filename = 'blackscythe-session.png'): Promise<'shared' | 'downloaded'> {
  const blob = await renderCard(d)
  const file = new File([blob], filename, { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch {
      // dismissed — fall through to download
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  return 'downloaded'
}
