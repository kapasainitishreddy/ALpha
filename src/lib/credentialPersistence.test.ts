import { describe, expect, it } from 'vitest'
import { PERSIST_KEY, purgeLegacyPersistedSecrets, scrubCredentialFields } from './credentialPersistence'

function memoryStorage(seed?: string) {
  const map = new Map<string, string>()
  if (seed !== undefined) map.set(PERSIST_KEY, seed)
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => map.set(key, value),
    read: () => map.get(PERSIST_KEY) ?? '',
  }
}

describe('credential persistence guard', () => {
  it('scrubs broker and AI credentials while preserving normal preferences', () => {
    const safe = scrubCredentialFields({
      balance: 12_345,
      apiKeys: { zerodha: 'broker-secret', coingecko: 'market-secret' },
      llm: { enabled: true, provider: 'groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'm', apiKey: 'llm-secret' },
    })

    expect(safe.apiKeys).toEqual({})
    expect((safe.llm as { apiKey: string }).apiKey).toBe('')
    expect((safe.llm as { provider: string }).provider).toBe('groq')
    expect(safe.balance).toBe(12_345)
  })

  it('purges credentials from legacy Zustand storage before hydration', () => {
    const storage = memoryStorage(JSON.stringify({
      state: {
        balance: 10_000,
        apiKeys: { upstox: 'old-broker-secret' },
        llm: { enabled: true, apiKey: 'old-ai-secret', model: 'm' },
      },
      version: 0,
    }))

    expect(purgeLegacyPersistedSecrets(storage)).toBe(true)
    const persisted = JSON.parse(storage.read())
    expect(persisted.state.apiKeys).toEqual({})
    expect(persisted.state.llm.apiKey).toBe('')
    expect(persisted.state.balance).toBe(10_000)
  })

  it('fails closed without crashing on malformed persisted JSON', () => {
    const storage = memoryStorage('{not-json')
    expect(purgeLegacyPersistedSecrets(storage)).toBe(false)
    expect(storage.read()).toBe('{not-json')
  })
})
