export const PERSIST_KEY = 'blackscythe-alpha'

export interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Return a shallow state copy with all API credentials removed.
 * Provider/model preferences remain portable, but bearer/API keys never do.
 */
export function scrubCredentialFields<T extends Record<string, unknown>>(state: T): T {
  const next: Record<string, unknown> = { ...state, apiKeys: {} }
  if (isRecord(state.llm)) next.llm = { ...state.llm, apiKey: '' }
  return next as T
}

/**
 * Remove credentials left by older builds before Zustand hydrates them into memory.
 * The function is injectable so the migration can be regression-tested without a browser.
 */
export function purgeLegacyPersistedSecrets(storage?: StorageLike): boolean {
  if (!storage) return false
  const raw = storage.getItem(PERSIST_KEY)
  if (!raw) return false

  try {
    const envelope = JSON.parse(raw) as unknown
    if (!isRecord(envelope) || !isRecord(envelope.state)) return false
    const state = envelope.state
    const hadApiKeys = isRecord(state.apiKeys) && Object.values(state.apiKeys).some((v) => typeof v === 'string' && v.length > 0)
    const hadLlmKey = isRecord(state.llm) && typeof state.llm.apiKey === 'string' && state.llm.apiKey.length > 0
    if (!hadApiKeys && !hadLlmKey) return false

    envelope.state = scrubCredentialFields(state)
    storage.setItem(PERSIST_KEY, JSON.stringify(envelope))
    return true
  } catch {
    // Corrupt storage must never turn credential cleanup into a startup crash.
    return false
  }
}

export function persistedLlmPreferences(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) return {}
  const { apiKey: _apiKey, ...preferences } = value
  return preferences
}
