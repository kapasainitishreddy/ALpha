import { DISCLAIMERS } from '@/data/disclaimers'
import { retrieve } from '@/models/localKnowledgeBase'
import { isOnTopic, violatesGuardrail } from '@/models/strategyOnlyGuardrail'

export interface CoachReply {
  text: string
  fatherText?: string
  source: 'refusal' | 'knowledge-base' | 'rule' | 'fallback'
}

// 3-layer coach. Works fully offline with $0 cost. Layer 3 (LLM) is optional and not wired by default.
export function askCoach(question: string, fatherMode = false): CoachReply {
  const q = question.trim()
  if (!q) return { text: 'Ask me about trading, strategy, risk, or this app.', source: 'fallback' }

  // Guardrail: off-topic → refuse.
  if (!isOnTopic(q)) {
    return { text: DISCLAIMERS.coachRefusal, source: 'refusal' }
  }

  // Layer 2: knowledge base retrieval.
  const hit = retrieve(q)
  if (hit) {
    const reply: CoachReply = {
      text: `${hit.title}: ${hit.text}`,
      fatherText: hit.fatherText,
      source: 'knowledge-base',
    }
    return safe(reply, fatherMode)
  }

  // Layer 1: rule fallbacks for common intents.
  if (/why.*(block|reject|not allow)/i.test(q)) {
    return safe({
      text: 'Risk Guard blocks a trade when there is no stop loss, the size is too big, you hit the daily loss/target, too many losses in a row, or the risk/reward is poor.',
      fatherText: 'Risk Guard trade ni block chesthundi: stop loss lేకపోతే, size peddaga unte, daily limit ayipోతే, or reward takkuva unte.',
      source: 'rule',
    }, fatherMode)
  }

  return safe({
    text: 'I can explain strategies, risk, stop loss, position sizing, the Strategy Swarm, backtesting, and the Indian market. ' + DISCLAIMERS.general,
    fatherText: 'Nenu strategy, risk, stop loss, position size, swarm, backtest gurinchi cheppagalanu. Anni mock money.',
    source: 'fallback',
  }, fatherMode)
}

// Final safety pass: never emit a guardrail-violating answer.
function safe(reply: CoachReply, fatherMode: boolean): CoachReply {
  const check = `${reply.text} ${reply.fatherText ?? ''}`
  if (violatesGuardrail(check)) {
    return { text: DISCLAIMERS.coachRefusal, source: 'refusal' }
  }
  if (fatherMode && reply.fatherText) return { ...reply, text: reply.fatherText }
  return reply
}
