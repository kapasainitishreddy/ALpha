import { askCoach, type CoachReply } from './aiCoachEngine'
import { FINANCE_TUTOR_SYSTEM_PROMPT } from '@/models/financeTutorSystemPrompt'
import { isOnTopic, violatesGuardrail } from '@/models/strategyOnlyGuardrail'
import { DISCLAIMERS } from '@/data/disclaimers'
import { chatComplete, type ChatMessage } from '@/adapters/llm'

export interface LlmConfig {
  enabled: boolean
  provider: string // preset id, for the settings UI only
  baseUrl: string
  apiKey: string
  model: string
}

export interface LlmCoachReply extends CoachReply {
  engine: 'rules' | 'llm'
  rateLimited?: boolean
}

// Client-side rate limit so a shared API key can't be drained by tap-spamming.
export const LLM_CALLS_PER_MINUTE = 8
const stamps: number[] = []
function hitRateLimit(): boolean {
  const now = Date.now()
  while (stamps.length && now - stamps[0] > 60_000) stamps.shift()
  if (stamps.length >= LLM_CALLS_PER_MINUTE) return true
  stamps.push(now)
  return false
}

// LLM coach with guardrails on BOTH sides:
//   1. off-topic questions are refused BEFORE any model call,
//   2. model output is re-checked for banned phrases; violations fall back to the safe rule answer.
// Any failure (endpoint down, CORS, bad key) falls back to the offline rule coach. Nothing breaks.
export async function askCoachLLM(
  question: string,
  cfg: LlmConfig,
  fatherMode = false,
): Promise<LlmCoachReply> {
  const ruleReply = askCoach(question, fatherMode)

  if (!cfg.enabled || !cfg.baseUrl || !cfg.model) {
    return { ...ruleReply, engine: 'rules' }
  }
  if (!isOnTopic(question)) {
    return { text: DISCLAIMERS.coachRefusal, source: 'refusal', engine: 'rules' }
  }
  if (hitRateLimit()) {
    return {
      ...ruleReply,
      engine: 'rules',
      rateLimited: true,
      text: `${ruleReply.text}\n\n(AI limit: max ${LLM_CALLS_PER_MINUTE} AI answers per minute. This was the built-in coach; try again in a minute.)`,
    }
  }

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        FINANCE_TUTOR_SYSTEM_PROMPT +
        (fatherMode ? '\nFather Mode is ON: answer in very simple Telugu-English (Tenglish), short sentences.' : ''),
    },
    // one-shot refusal anchor
    { role: 'user', content: 'Write me a poem.' },
    { role: 'assistant', content: DISCLAIMERS.coachRefusal },
    { role: 'user', content: question },
  ]

  try {
    const raw = await chatComplete(messages, { baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, model: cfg.model })
    if (!raw || violatesGuardrail(raw)) {
      return { ...ruleReply, engine: 'rules' }
    }
    return { text: raw, source: 'knowledge-base', engine: 'llm' }
  } catch {
    return { ...ruleReply, engine: 'rules' }
  }
}

// Real LLM analyst debate (TradingAgents concept): four AI analysts argue a proposed mock trade.
// Called on demand (button per trade card) so it never auto-drains the user's key quota.
export interface AiDebate {
  bull: string
  bear: string
  risk: string
  verdict: string
}

export async function llmDebate(
  setup: { strategyName: string; action: string; entry: number; stopLoss: number; target: number; reason: string; marketEvent: string },
  cfg: LlmConfig,
): Promise<AiDebate | null> {
  if (!cfg.enabled || !cfg.baseUrl || !cfg.model || hitRateLimit()) return null
  const messages: ChatMessage[] = [
    { role: 'system', content: FINANCE_TUTOR_SYSTEM_PROMPT },
    {
      role: 'user',
      content:
        `A MOCK (paper money) trade candidate on the Indian market simulator:\n` +
        `Strategy: ${setup.strategyName}. Action: ${setup.action}. Entry ${setup.entry.toFixed(2)}, stop loss ${setup.stopLoss.toFixed(2)}, target ${setup.target.toFixed(2)}.\n` +
        `Signal reason: ${setup.reason}. Market scenario: ${setup.marketEvent}.\n\n` +
        `Act as four analysts debating this mock trade. Reply in EXACTLY this format, one line each, max 20 words per line:\n` +
        `BULL: <strongest case for the trade>\n` +
        `BEAR: <strongest case against it>\n` +
        `RISK: <what the risk manager insists on>\n` +
        `VERDICT: <take it or skip it, and why, for a beginner>`,
    },
  ]
  try {
    const raw = await chatComplete(messages, { baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, model: cfg.model })
    if (!raw || violatesGuardrail(raw)) return null
    const grab = (label: string) => raw.match(new RegExp(`${label}:\\s*(.+)`, 'i'))?.[1]?.trim() ?? ''
    const debate = { bull: grab('BULL'), bear: grab('BEAR'), risk: grab('RISK'), verdict: grab('VERDICT') }
    return debate.bull || debate.verdict ? debate : null
  } catch {
    return null
  }
}

// Provider presets for the settings screen. All are OpenAI-compatible chat/completions.
// Note: some cloud providers block direct browser calls (CORS). Groq and local Ollama are
// browser-friendly; if a provider fails, the coach silently falls back to the rule engine.
export interface ProviderPreset {
  id: string
  name: string
  baseUrl: string
  model: string
  keyHint: string
  note: string
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  { id: 'groq', name: 'Groq (free tier)', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile', keyHint: 'gsk_...', note: 'Fast, free tier, browser-friendly. Good Telugu-English.' },
  { id: 'nvidia', name: 'NVIDIA (free credits)', baseUrl: 'https://integrate.api.nvidia.com/v1', model: 'meta/llama-3.1-8b-instruct', keyHint: 'nvapi-...', note: 'Free key from build.nvidia.com. Any catalog model name works.' },
  { id: 'minimax', name: 'MiniMax', baseUrl: 'https://api.minimax.io/v1', model: 'MiniMax-M2', keyHint: 'your MiniMax key', note: 'Use the model name your plan includes.' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', keyHint: 'sk-...', note: 'Cheap and capable.' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini', keyHint: 'sk-...', note: 'May block direct browser calls (CORS).' },
  { id: 'ollama', name: 'Ollama on your PC (your fine-tuned model)', baseUrl: 'http://localhost:11434/v1', model: 'blackscythe-coach', keyHint: 'no key needed', note: 'Serves YOUR fine-tuned model. See docs/finetune/README.md.' },
  { id: 'custom', name: 'Custom endpoint', baseUrl: '', model: '', keyHint: 'optional', note: 'Any OpenAI-compatible /v1 endpoint.' },
]
