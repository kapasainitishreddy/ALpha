import type { MarketEventDef } from '@/types'

// Custom market scenarios + shareable codes. Lets a user build the exact conditions they keep
// losing money in and practise those specifically, then hand the setup to someone else.

export interface CustomScenario {
  id: string
  name: string
  drift: number
  volMultiplier: number
  gap: number
  newsAt?: number // candle index where a headline lands
  newsText?: string
  newsImpact?: number // one-off price shock as a fraction
}

export const NEWS_TEMPLATES: { text: string; impact: number }[] = [
  { text: 'Quarterly results beat estimates', impact: 0.03 },
  { text: 'Quarterly results miss estimates', impact: -0.035 },
  { text: 'Large block deal spotted', impact: 0.015 },
  { text: 'Regulator opens inquiry', impact: -0.05 },
  { text: 'Analyst upgrade, target raised', impact: 0.02 },
  { text: 'Promoter pledges more shares', impact: -0.025 },
  { text: 'Big order win announced', impact: 0.04 },
  { text: 'Global markets sell off overnight', impact: -0.03 },
]

export function toEventDef(s: CustomScenario): MarketEventDef {
  return {
    id: s.id,
    name: s.name,
    mood: s.drift > 0.0006 ? 'trending-up' : s.drift < -0.0006 ? 'trending-down' : s.volMultiplier > 1.8 ? 'volatile' : 'sideways',
    drift: s.drift,
    volMultiplier: s.volMultiplier,
    gap: s.gap || undefined,
    idealStrategy: s.drift > 0.0006 ? 'ema-trend' : s.volMultiplier > 1.8 ? 'volatility-breakout' : 'mean-reversion',
    dangerousStrategy: s.drift > 0.0006 ? 'mean-reversion' : 'breakout-volume',
    fatherExplanation: describeScenario(s),
  }
}

export function describeScenario(s: CustomScenario): string {
  const dir = s.drift > 0.0008 ? 'a strong uptrend' : s.drift > 0.0002 ? 'a mild uptrend'
    : s.drift < -0.0008 ? 'a sharp downtrend' : s.drift < -0.0002 ? 'a mild downtrend' : 'no clear direction'
  const vol = s.volMultiplier > 2 ? 'very choppy' : s.volMultiplier > 1.3 ? 'choppy' : s.volMultiplier < 0.8 ? 'unusually quiet' : 'normal'
  const gap = s.gap > 0.005 ? ` It opens with a gap up of ${(s.gap * 100).toFixed(1)}%.`
    : s.gap < -0.005 ? ` It opens with a gap down of ${(Math.abs(s.gap) * 100).toFixed(1)}%.` : ''
  const news = s.newsText ? ` Around candle ${s.newsAt}, news hits: "${s.newsText}".` : ''
  return `A market with ${dir} and ${vol} price action.${gap}${news}`
}

// --- Share codes -------------------------------------------------------------
// Compact, typo-tolerant, no server. A code round-trips a whole scenario so one person can
// tell another "try BS-1A2B3C" and land on the identical market.

const FIELDS: (keyof CustomScenario)[] = ['drift', 'volMultiplier', 'gap', 'newsAt', 'newsImpact']

export function encodeScenario(s: CustomScenario): string {
  // Fixed-point ints keep the payload short and avoid float formatting noise.
  const nums = [
    Math.round(s.drift * 1e5),
    Math.round(s.volMultiplier * 100),
    Math.round(s.gap * 1e4),
    s.newsAt ?? 0,
    Math.round((s.newsImpact ?? 0) * 1e4),
  ]
  const body = nums.map((n) => n.toString(36)).join('.')
  const name = encodeURIComponent(s.name).slice(0, 40)
  const text = s.newsText ? encodeURIComponent(s.newsText).slice(0, 60) : ''
  return `BS1~${body}~${name}~${text}`
}

export function decodeScenario(code: string): CustomScenario | null {
  const clean = code.trim()
  if (!clean.startsWith('BS1~')) return null
  const [, body, name, text] = clean.split('~')
  if (!body) return null

  const parts = body.split('.')
  if (parts.length !== FIELDS.length) return null
  const nums = parts.map((p) => parseInt(p, 36))
  if (nums.some((n) => !Number.isFinite(n))) return null

  const [drift, vol, gap, newsAt, newsImpact] = nums
  return {
    id: `shared-${Math.abs(drift)}-${vol}-${gap}`,
    name: name ? decodeURIComponent(name) : 'Shared scenario',
    drift: drift / 1e5,
    volMultiplier: Math.max(0.2, vol / 100),
    gap: gap / 1e4,
    newsAt: newsAt || undefined,
    newsText: text ? decodeURIComponent(text) : undefined,
    newsImpact: newsImpact ? newsImpact / 1e4 : undefined,
  }
}
