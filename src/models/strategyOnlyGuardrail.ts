// Guardrails for the coach, applies whether the answer comes from rules, KB, or a future LLM.

// Topics the coach is allowed to help with.
export const ALLOWED_TOPICS = [
  'trade', 'trading', 'stock', 'market', 'strategy', 'risk', 'stop', 'loss', 'profit',
  'swarm', 'agent', 'backtest', 'nifty', 'banknifty', 'crypto', 'rsi', 'ema', 'vwap',
  'father', 'mock', 'app', 'blackscythe', 'api', 'key', 'journal', 'mistake', 'candle',
  'volume', 'breakout', 'momentum', 'position', 'size', 'reward', 'compound', 'sebi',
]

// Common Roman-Telugu trading words beginners actually type.
const TELUGU_ROMAN = ['dabbu', 'nashtam', 'labham', 'ammali', 'konali', 'cheyyali', 'cheyyi', 'enta', 'ela']

export function isOnTopic(question: string): boolean {
  const q = question.toLowerCase()
  if (ALLOWED_TOPICS.some((t) => q.includes(t))) return true
  // Telugu script or Roman Telugu: let it through to the coach (output guardrail still applies;
  // the LLM system prompt enforces topic refusal in Telugu too).
  if (/[ఀ-౿]/.test(question)) return true
  return TELUGU_ROMAN.some((t) => q.includes(t))
}

// The coach must never emit these, a final safety pass strips/flags them.
export const COACH_FORBIDDEN = [
  'guaranteed profit', 'risk-free', 'never lose', 'invest all', 'all your money',
  'remove stop loss', 'no stop loss needed', 'use leverage', 'double your money',
]

export function violatesGuardrail(answer: string): boolean {
  const a = answer.toLowerCase()
  return COACH_FORBIDDEN.some((f) => a.includes(f))
}
