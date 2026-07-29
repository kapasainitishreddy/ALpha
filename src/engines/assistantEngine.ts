import { HELP_TOPICS, type HelpTopic } from '@/data/helpTopics'
import { TRADING_LESSONS } from '@/data/tradingLessons'
import { STRATEGY_DOCS } from '@/data/strategyDocs'
import { isOnTopic, violatesGuardrail } from '@/models/strategyOnlyGuardrail'
import { DISCLAIMERS } from '@/data/disclaimers'

// Offline assistant. Scores a question against a written answer bank — no model, no key, no
// network. Chosen over an LLM deliberately: this app's whole promise is $0 and no keys, and a
// small bank that is always correct about THIS app beats a chatbot that invents features.

export interface Answer {
  text: string
  topicId: string | null
  confident: boolean
  followUps: string[]
}

const STOP = new Set([
  'what', 'is', 'the', 'a', 'an', 'how', 'do', 'i', 'to', 'in', 'this', 'that', 'it', 'my',
  'me', 'you', 'and', 'or', 'of', 'for', 'on', 'can', 'does', 'did', 'why', 'are', 'was',
  'with', 'app', 'about', 'so', 'if', 'be', 'am', 'not', 'no', 'yes', 'please', 'tell',
])

// Crude suffix stripping so "trading" matches "trade" and "blocked" matches "block".
// Not a real stemmer — just enough that ordinary phrasing differences don't miss.
function stem(w: string): string {
  return w
    .replace(/(ing|ed|es|s)$/, '')
    .replace(/e$/, '') // without this "trade" and "trading" stem apart and never match
    .replace(/([^aeiou])\1$/, '$1') // "stopp" -> "stop"
}

function tokens(s: string): string[] {
  // Stopwords are dropped BOTH before and after stemming. "doing" is not a stopword but stems
  // to "do" which is — leaving it in made a filler word score as highly as a real keyword and
  // produced exact scoring ties that were then broken by array order.
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(stem)
    .filter((w) => w.length > 1 && !STOP.has(w))
}

// How many topics each token appears in. A token in one topic ("nothing") identifies intent far
// better than one in ten ("swarm"), so rare tokens must outweigh common ones — otherwise
// "why is the swarm doing nothing" loses to the generic swarm topic on sheer keyword bulk.
const DF = new Map<string, number>()
for (const t of HELP_TOPICS) {
  for (const w of new Set([...t.keywords.flatMap(tokens), ...tokens(t.question)])) {
    DF.set(w, (DF.get(w) ?? 0) + 1)
  }
}
const weight = (w: string) => 3 + 9 / (DF.get(w) ?? 1)

function scoreTopic(q: string, qTokens: string[], t: HelpTopic): number {
  const stemmed = tokens(q).join(' ')
  let score = 0

  // Whole-phrase keyword hits are the strongest signal — they encode intent, not just words.
  // Compared on stemmed text so "mock trading" still matches the keyword "mock trade".
  for (const k of t.keywords) {
    const kt = tokens(k)
    // Only multi-word keywords earn the phrase bonus. A keyword like "how to trade" reduces to
    // the single generic token "trade", which appears in nearly every question here — letting
    // that claim a phrase match made one topic swallow everything.
    if (kt.length >= 2 && stemmed.includes(kt.join(' '))) score += 10 + k.length
  }
  const bag = new Set([...t.keywords.flatMap(tokens), ...tokens(t.question)])
  for (const w of qTokens) {
    if (bag.has(w)) score += weight(w)
  }
  return score
}

export function ask(question: string, opts: { fatherMode?: boolean; route?: string } = {}): Answer {
  const q = question.trim()
  if (!q) {
    return { text: 'Ask me anything about this app or about trading.', topicId: null, confident: false, followUps: suggestionsFor(opts.route) }
  }

  // Curated topics are matched BEFORE the off-topic guardrail. The guardrail keyword list does
  // not contain phrases like "is this real money" — the single most important question a user
  // can ask here — so running it first made the assistant refuse to answer it. Every answer in
  // HELP_TOPICS is hand-written and safe, so matching one is always the right move.
  const qTokens = tokens(q)
  let best: { topic: HelpTopic; score: number } | null = null
  for (const t of HELP_TOPICS) {
    const score = scoreTopic(q, qTokens, t)
    if (score > 0 && (!best || score > best.score)) best = { topic: t, score }
  }

  if (!best && !isOnTopic(q)) {
    return {
      text: `${DISCLAIMERS.coachRefusal}\n\nI can help with trading, risk, strategies, and how this app works.`,
      topicId: null,
      confident: true,
      followUps: suggestionsFor(opts.route),
    }
  }

  if (best && best.score >= 8) {
    const t = best.topic
    const text = opts.fatherMode && t.father ? t.father : t.answer
    return {
      text: guard(text),
      topicId: t.id,
      confident: true,
      followUps: related(t).map((x) => x.question),
    }
  }

  // Fall back to the strategy docs, but only on a distinctive match. Matching any single token
  // meant "how do i do mock trading" returned "Pairs Trading Simulation" purely on the word
  // "trading" — so generic words are excluded and the token must be a real word in the name.
  const GENERIC = new Set(['trade', 'trading', 'strategy', 'simulation', 'market', 'stock', 'mock', 'buy', 'sell', 'price'])
  const doc = STRATEGY_DOCS.find((d) => {
    const nameTokens = new Set([...tokens(d.name), ...d.id.split('-').map(stem)])
    return qTokens.some((w) => !GENERIC.has(w) && w.length > 2 && nameTokens.has(w))
  })
  if (doc) {
    return {
      text: guard(
        `${doc.name}\n\n${opts.fatherMode ? doc.father : doc.beginner}\n\nWorks best in ${doc.bestMarket.toLowerCase()}. Risky in ${doc.badMarket.toLowerCase()}.\nEntry: ${doc.entry}\nStop loss: ${doc.stopLoss}`,
      ),
      topicId: null,
      confident: true,
      followUps: ['What is the Strategy Swarm doing?', 'How many shares should I buy?'],
    }
  }

  // Word-boundary match, not substring: a bare `includes('capital')` made "capital of France"
  // return the API-key lesson. Single words also have to be reasonably specific to count.
  const hasWord = (haystack: string, needle: string) =>
    new RegExp(`(^|\\W)${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\W|$)`, 'i').test(haystack)

  const lesson = isOnTopic(q)
    ? TRADING_LESSONS.find((l) => l.keywords.some((k) => (k.includes(' ') || k.length >= 5) && hasWord(q, k)))
    : undefined
  if (lesson) {
    return {
      text: guard(`${lesson.title}\n\n${opts.fatherMode ? lesson.father : lesson.beginner}`),
      topicId: null,
      confident: true,
      followUps: suggestionsFor(opts.route),
    }
  }

  return {
    text: "I don't have a written answer for that one.\n\nI'm a small built-in helper, not a full AI — I only answer from a fixed set of topics about this app and about trading basics. Try one of these:",
    topicId: null,
    confident: false,
    followUps: suggestionsFor(opts.route),
  }
}

function related(t: HelpTopic): HelpTopic[] {
  return HELP_TOPICS.filter((x) => x.id !== t.id && x.keywords.some((k) => t.keywords.some((tk) => k.split(' ')[0] === tk.split(' ')[0]))).slice(0, 2)
}

// Screen-aware suggestions: what someone is most likely stuck on right here.
export function suggestionsFor(route?: string): string[] {
  const onScreen = route ? HELP_TOPICS.filter((t) => t.screens?.includes(route)) : []
  const general = HELP_TOPICS.filter((t) => ['is-it-real', 'how-to-mock-trade', 'where-to-start', 'how-trading-works'].includes(t.id))
  const picked = [...onScreen, ...general]
  return [...new Set(picked.map((t) => t.question))].slice(0, 4)
}

function guard(text: string): string {
  return violatesGuardrail(text) ? DISCLAIMERS.coachRefusal : text
}
