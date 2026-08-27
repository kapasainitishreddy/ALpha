import { validateLlmEndpoint } from '@/lib/llmEndpointPolicy'

// OpenAI-compatible chat-completions client. Works with Ollama (local, serving YOUR fine-tuned model
// at http://localhost:11434/v1), OpenAI, Groq, DeepSeek, Together, and Google's OpenAI-compat endpoint.
// No SDK, one fetch. The app never REQUIRES this; it's an optional Layer-3 upgrade over the rule coach.

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface EndpointConfig {
  baseUrl: string // e.g. http://localhost:11434/v1
  apiKey?: string
  model: string
}

export const LLM_RESPONSE_MAX_BYTES = 64 * 1024
export const LLM_TIMEOUT_MS = 15_000

export async function chatComplete(messages: ChatMessage[], cfg: EndpointConfig, signal?: AbortSignal): Promise<string> {
  const endpoint = validateLlmEndpoint(cfg.baseUrl)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })

  try {
    const res = await fetch(`${endpoint.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
      },
      body: JSON.stringify({ model: cfg.model, messages, temperature: 0.3, stream: false }),
      signal: controller.signal,
      redirect: 'error',
    })

    const declaredLength = Number(res.headers.get('content-length') ?? 0)
    if (Number.isFinite(declaredLength) && declaredLength > LLM_RESPONSE_MAX_BYTES) {
      throw new Error('AI endpoint response was too large.')
    }

    const body = await res.text()
    if (new TextEncoder().encode(body).byteLength > LLM_RESPONSE_MAX_BYTES) {
      throw new Error('AI endpoint response was too large.')
    }
    if (!res.ok) throw new Error(`AI endpoint request failed (${res.status}).`)

    let data: { choices?: Array<{ message?: { content?: string } }> }
    try {
      data = JSON.parse(body) as typeof data
    } catch {
      throw new Error('AI endpoint returned invalid JSON.')
    }

    const text = data.choices?.[0]?.message?.content
    if (!text || typeof text !== 'string') throw new Error('AI endpoint returned no content.')
    return text.trim()
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', onAbort)
  }
}
