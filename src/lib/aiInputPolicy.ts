export const MAX_AI_INPUT_CHARS = 2_000

const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?(?:previous|prior|system|developer)\s+instructions?/i,
  /reveal\s+(?:the\s+)?(?:system|developer)\s+(?:prompt|message|instructions?)/i,
  /(?:jailbreak|prompt\s*injection)/i,
  /act\s+as\s+if\s+(?:the\s+)?system\s+(?:message|prompt)/i,
]

const SECRET_REQUEST = /(?:reveal|show|print|return|send|exfiltrat\w*)[\s\S]{0,80}(?:api\s*key|password|access\s*token|secret|bearer\s*token)/i

export type AiInputDecision =
  | { ok: true; text: string }
  | { ok: false; reason: 'too-long' | 'prompt-injection' | 'secret-exfiltration' }

export function normalizeUntrustedText(value: string, max = MAX_AI_INPUT_CHARS): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ').trim().slice(0, max)
}

export function validateAiUserInput(value: string): AiInputDecision {
  if (value.length > MAX_AI_INPUT_CHARS) return { ok: false, reason: 'too-long' }
  const text = normalizeUntrustedText(value)
  if (INJECTION_PATTERNS.some((pattern) => pattern.test(text))) return { ok: false, reason: 'prompt-injection' }
  if (SECRET_REQUEST.test(text)) return { ok: false, reason: 'secret-exfiltration' }
  return { ok: true, text }
}
