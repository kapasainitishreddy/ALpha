import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStore } from '@/store/useStore'
import { deleteAllLocalData, exportBackup, inspectBackup, restoreBackup } from './backup'

class MemoryStorage {
  values = new Map<string, string>()
  failNextKey: string | null = null
  failNextRemoveKey: string | null = null
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) {
    if (this.failNextRemoveKey === key) {
      this.failNextRemoveKey = null
      throw new Error('Injected storage removal failure')
    }
    this.values.delete(key)
  }
  setItem(key: string, value: string) {
    if (this.failNextKey === key) {
      this.failNextKey = null
      throw new Error('Injected storage write failure')
    }
    this.values.set(key, String(value))
  }
  snapshot() { return new Map(this.values) }
}

const mainKey = 'blackscythe-alpha'
const derivativesKey = 'alpha-derivatives'
const researchKey = 'alpha-research-note'
let storage: MemoryStorage

function seedCurrentDevice() {
  storage.setItem(derivativesKey, JSON.stringify({
    version: 1, balance: 48250, idx: 32, symbol: 'NIFTY50', positions: [],
  }))
  storage.setItem(researchKey, JSON.stringify(['Existing research note']))
}

describe('versioned paper-account backup', () => {
  beforeEach(() => {
    storage = new MemoryStorage()
    vi.stubGlobal('window', { localStorage: storage, setTimeout, location: { reload: vi.fn() } })
    useStore.setState({
      balance: 12_345,
      startingBalance: 10_000,
      dayStartBalance: 12_000,
      pendingOrders: [], sessions: {}, trades: [], journal: [], orderEvents: [],
      language: 'en', completedLessons: [], journaledTradeIds: [], dayKey: '2026-10-28',
      stoppedToday: false, fatherMode: false, modeStats: [], consecutiveLosses: 0,
      dailyPnl: 0, tradesToday: 0, history: [], challenge: null, customStrategies: [],
      customScenarios: [], moods: [], dailyResults: [], onboarded: false,
      apiKeys: { openai: 'never-export-this' },
      llm: { enabled: true, provider: 'groq', baseUrl: 'https://api.groq.com/openai/v1', apiKey: 'never-export-this-either', model: 'test' },
    })
    seedCurrentDevice()
  })

  it('exports the separate derivatives and research ledgers without credentials', () => {
    storage.setItem(derivativesKey, JSON.stringify({
      version: 1, balance: 48_250, idx: 32, symbol: 'NIFTY50', positions: [
        { id: 'open-future', kind: 'future', symbol: 'NIFTY50', units: 1, side: 1, entry: 24_000, openedIdx: 25, expiryIdx: 40, legs: [], iv: 18, margin: 2_400, entryFee: 2, variationPnl: 100 },
        { id: 'closed-option', kind: 'option', symbol: 'BANKNIFTY', units: 1, side: 1, entry: 100, openedIdx: 23, expiryIdx: 29, legs: [{ type: 'call', strike: 45_000, side: 1 }], iv: 20, margin: 100, entryFee: 1, closedPnl: -101, closedIdx: 29, reason: 'Expiry cash settlement' },
      ],
    }))
    const backup = JSON.parse(exportBackup())
    expect(backup.version).toBe(2)
    expect(backup.derivatives.balance).toBe(48_250)
    expect(backup.derivatives.positions.map((p: { id: string }) => p.id)).toEqual(['open-future', 'closed-option'])
    expect(backup.researchNote).toEqual(['Existing research note'])
    expect(JSON.stringify(backup)).not.toContain('never-export-this')
    expect(backup.state.orderEvents).toEqual([])
    expect(inspectBackup(JSON.stringify(backup))).toMatchObject({
      version: 2, balance: 12_345, derivativePositions: 2, openDerivativePositions: 1, researchNoteSections: 1,
    })
  })

  it('preserves replay sessions and order-event context', () => {
    const candles = Array.from({ length: 25 }, (_, i) => ({
      time: i + 1, open: 100, high: 101, low: 99, close: 100, volume: 10,
    }))
    const event = { sessionId: 'replay:demo', symbol: 'NIFTY50', message: 'Pending order filled.', at: 1 }
    useStore.setState({
      sessions: { 'replay:demo': { idx: 4, startBalance: 10_000, candles, source: 'CSV' } },
      orderEvents: [event],
    })

    const raw = exportBackup()
    storage.setItem(mainKey, JSON.stringify({ state: {}, version: 2 }))
    restoreBackup(raw)
    const restored = JSON.parse(storage.getItem(mainKey)!).state

    expect(restored.sessions['replay:demo']).toMatchObject({ idx: 4, source: 'CSV', candles })
    expect(restored.orderEvents).toEqual([event])
  })

  it('restores all three ledgers exactly and safely supports repeated restore', () => {
    const source = JSON.parse(exportBackup())
    source.derivatives.balance = 43_210
    source.researchNote = ['A saved thesis', '', 'Invalidation evidence']
    const raw = JSON.stringify(source)

    restoreBackup(raw)
    const once = [storage.getItem(mainKey), storage.getItem(derivativesKey), storage.getItem(researchKey)]
    restoreBackup(raw)

    expect([storage.getItem(mainKey), storage.getItem(derivativesKey), storage.getItem(researchKey)]).toEqual(once)
    expect(JSON.parse(storage.getItem(mainKey)!).state.balance).toBe(12_345)
    expect(JSON.parse(storage.getItem(derivativesKey)!).balance).toBe(43_210)
    expect(JSON.parse(storage.getItem(researchKey)!)).toEqual(source.researchNote)
  })

  it('rejects hostile derivative data before changing any ledger', () => {
    const bad = JSON.parse(exportBackup())
    bad.derivatives.balance = -1
    const before = storage.snapshot()

    expect(() => restoreBackup(JSON.stringify(bad))).toThrow('Invalid derivatives lab data')
    expect(storage.snapshot()).toEqual(before)
  })

  it('rolls all written keys back if a later storage write fails', () => {
    const raw = exportBackup()
    const before = storage.snapshot()
    storage.failNextKey = researchKey

    expect(() => restoreBackup(raw)).toThrow('Existing device data was restored')
    expect(storage.snapshot()).toEqual(before)
  })

  it('deletes all modeled ledgers and leaves unrelated browser data alone', () => {
    storage.setItem('unrelated-app-key', 'keep')

    deleteAllLocalData()

    expect(storage.getItem(mainKey)).toBeNull()
    expect(storage.getItem(derivativesKey)).toBeNull()
    expect(storage.getItem(researchKey)).toBeNull()
    expect(storage.getItem('unrelated-app-key')).toBe('keep')
  })

  it('rolls deletion back after an injected remove failure', () => {
    storage.setItem(mainKey, JSON.stringify({ state: { balance: 10_000 }, version: 2 }))
    const before = storage.snapshot()
    storage.failNextRemoveKey = researchKey

    expect(() => deleteAllLocalData()).toThrow('Existing device data was restored')
    expect(storage.snapshot()).toEqual(before)
  })

  it('imports v1 main-account backups while preserving device-only ledgers and order events', () => {
    const current = JSON.parse(exportBackup())
    const legacyState = { ...current.state }
    delete legacyState.orderEvents
    const legacy = JSON.stringify({ format: current.format, version: 1, savedAt: current.savedAt, state: legacyState })
    const deviceEvents = [{ sessionId: 's1', symbol: 'NIFTY50', message: 'Existing event', at: 1 }]
    storage.setItem(mainKey, JSON.stringify({ state: { orderEvents: deviceEvents }, version: 2 }))
    const derivatives = storage.getItem(derivativesKey)
    const research = storage.getItem(researchKey)

    expect(inspectBackup(legacy)).toMatchObject({ version: 1, preservesDeviceOnlyData: true })
    restoreBackup(legacy)

    expect(JSON.parse(storage.getItem(mainKey)!).state.orderEvents).toEqual(deviceEvents)
    expect(storage.getItem(derivativesKey)).toBe(derivatives)
    expect(storage.getItem(researchKey)).toBe(research)
  })

  it('rejects malformed JSON and oversized files', () => {
    expect(() => inspectBackup('{')).toThrow('not valid JSON')
    expect(() => inspectBackup(`{"padding":"${'x'.repeat(5_000_000)}"}`)).toThrow('exceeds 5 MB')
  })
})
