const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

export interface SafeEndpoint {
  baseUrl: string
  local: boolean
}

/**
 * Browser BYOK policy: remote providers must use HTTPS. Plain HTTP is allowed only for
 * loopback development runtimes such as Ollama. Credentials/query/fragment are rejected
 * so an API key or prompt cannot be accidentally routed through an ambiguous URL.
 */
export function validateLlmEndpoint(raw: string): SafeEndpoint {
  const value = raw.trim()
  if (!value || value.length > 2048) throw new Error('Invalid AI endpoint URL.')

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('Invalid AI endpoint URL.')
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('AI endpoint must use HTTPS, or HTTP on localhost.')
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error('AI endpoint cannot contain credentials, query parameters, or fragments.')
  }

  const local = LOCAL_HOSTS.has(url.hostname)
  if (url.protocol === 'http:' && !local) {
    throw new Error('Remote AI endpoints must use HTTPS.')
  }

  const path = url.pathname.replace(/\/+$/, '')
  return { baseUrl: `${url.origin}${path}`, local }
}
