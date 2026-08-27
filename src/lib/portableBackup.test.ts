import { describe, expect, it } from 'vitest'
import { BACKUP_FORMAT, BACKUP_MAX_BYTES, createPortableBackup, parsePortableBackup } from './portableBackup'
import type { State } from '@/store/useStore'

function state(): State {
  return {
    fatherMode: false,
    balance: 12_000,
    startingBalance: 10_000,
    trades: [],
    journal: [],
    modeStats: [],
    apiKeys: { zerodha: 'must-not-export' },
    llm: { enabled: true, provider: 'groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'm', apiKey: 'must-not-export' },
    consecutiveLosses: 0,
    dailyPnl: 50,
    tradesToday: 2,
    history: [],
    challenge: null,
    customStrategies: [],
    customScenarios: [],
    moods: [],
    dailyResults: [],
    onboarded: true,
  } as State
}

describe('portable backup', () => {
  it('round-trips learning data without credentials', () => {
    const raw = createPortableBackup(state(), new Date('2026-08-27T00:00:00Z'))
    expect(raw).not.toContain('must-not-export')
    const parsed = parsePortableBackup(raw)
    expect(parsed.balance).toBe(12_000)
    expect(parsed.dailyPnl).toBe(50)
    expect((parsed as unknown as Record<string, unknown>).apiKeys).toBeUndefined()
  })

  it('rejects wrong format and malformed state', () => {
    expect(() => parsePortableBackup(JSON.stringify({ format: 'other', version: 1, exportedAt: 'x', state: {} }))).toThrow()
    expect(() => parsePortableBackup(JSON.stringify({ format: BACKUP_FORMAT, version: 1, exportedAt: 'x', state: { balance: 'oops' } }))).toThrow()
  })

  it('rejects oversized backup text before parsing', () => {
    expect(() => parsePortableBackup(' '.repeat(BACKUP_MAX_BYTES + 1))).toThrow(/larger/)
  })
})
