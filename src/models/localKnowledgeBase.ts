import { TRADING_LESSONS } from '@/data/tradingLessons'
import { STRATEGY_DOCS } from '@/data/strategyDocs'

export interface KbHit {
  title: string
  text: string
  fatherText: string
  score: number
}

// Layer 2: keyword retrieval over lessons + strategy docs. No embeddings, no network.
export function retrieve(question: string): KbHit | null {
  const q = question.toLowerCase()
  let best: KbHit | null = null

  for (const lesson of TRADING_LESSONS) {
    const score = lesson.keywords.reduce((s, k) => (q.includes(k) ? s + k.length : s), 0)
    if (score > 0 && (!best || score > best.score)) {
      best = { title: lesson.title, text: lesson.beginner, fatherText: lesson.father, score }
    }
  }

  for (const doc of STRATEGY_DOCS) {
    const name = doc.name.toLowerCase()
    const id = doc.id.toLowerCase()
    let score = 0
    if (q.includes(name)) score += name.length
    if (q.includes(id.replace(/-/g, ' '))) score += id.length
    if (score > 0 && (!best || score > best.score)) {
      best = {
        title: doc.name,
        text: `${doc.beginner} Best in ${doc.bestMarket.toLowerCase()}, risky in ${doc.badMarket.toLowerCase()}. Entry: ${doc.entry}. Stop: ${doc.stopLoss}.`,
        fatherText: doc.father,
        score,
      }
    }
  }
  return best
}
