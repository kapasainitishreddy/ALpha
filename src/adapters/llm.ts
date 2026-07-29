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

export async function chatComplete(messages: ChatMessage[], cfg: EndpointConfig, signal?: AbortSignal): Promise<string> {
  const base = cfg.baseUrl.replace(/\/+$/, '')
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
    },
    body: JSON.stringify({ model: cfg.model, messages, temperature: 0.3, stream: false }),
    signal,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`LLM endpoint ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> }
  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('LLM endpoint returned no content.')
  return text.trim()
}
