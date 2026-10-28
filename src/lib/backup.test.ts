import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStore } from '@/store/useStore'
import { closeLabPosition, createLabPosition, type OptionStructure } from './derivatives'
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

function createOption(structure: OptionStructure, units = 1) {
  return createLabPosition('option', 'NIFTY50', 20_000, 20, 1, units, structure, 30, 20, 200)
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
    const openFuture = {
      ...createLabPosition('future', 'NIFTY50', 24_000, 25, 1, 1, 'call', 15, 18, 200),
      entry: 24_100,
      variationPnl: 100,
    }
    const closedOption = closeLabPosition(
      createLabPosition('option', 'BANKNIFTY', 45_000, 23, 1, 1, 'call', 6, 20, 200),
      45_000, 29, 'Expiry cash settlement',
    )
    storage.setItem(derivativesKey, JSON.stringify({
      version: 1, balance: 48_250, idx: 32, symbol: 'NIFTY50', positions: [
        { ...openFuture, id: 'open-future' },
        { ...closedOption, id: 'closed-option' },
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

  it.each(['call', 'put', 'bull-call', 'bear-put', 'straddle', 'iron-condor'] as const)(
    'round trips model-generated %s option positions', (structure) => {
      const position = createOption(structure, structure === 'iron-condor' ? 10 : 1)
      const book = { version: 1, balance: 50_000, idx: 20, symbol: 'NIFTY50', positions: [position] }
      storage.setItem(derivativesKey, JSON.stringify(book))
      const raw = exportBackup()

      if (structure === 'iron-condor') expect(position.entry).toBeLessThan(0)
      else expect(position.entry).toBeGreaterThan(0)

      storage.setItem(derivativesKey, JSON.stringify({ ...book, positions: [] }))
      restoreBackup(raw)
      expect(JSON.parse(storage.getItem(derivativesKey)!)).toEqual(book)
      expect(inspectBackup(raw)).toMatchObject({ derivativePositions: 1, openDerivativePositions: 1 })
    },
  )

  it('accepts the zero-cash empty-ledger boundary and preserves zero variation context', () => {
    const position = { ...createLabPosition('future', 'NIFTY50', 20_000, 20, 1, 1, 'call', 30, 20, 200), variationPnl: 0 }
    const book = { version: 1, balance: 50_000, idx: 20, symbol: 'NIFTY50', positions: [position] }
    storage.setItem(derivativesKey, JSON.stringify({ ...book, balance: 0, positions: [] }))
    const emptyBackup = exportBackup()
    restoreBackup(emptyBackup)
    expect(JSON.parse(storage.getItem(derivativesKey)!)).toMatchObject({ balance: 0, positions: [] })

    storage.setItem(derivativesKey, JSON.stringify(book))
    const backup = exportBackup()
    storage.setItem(derivativesKey, JSON.stringify({ ...book, positions: [] }))
    restoreBackup(backup)
    expect(JSON.parse(storage.getItem(derivativesKey)!).positions[0].variationPnl).toBe(0)
  })

  it.each([1, -1] as const)('round trips a futures position after %s-side daily settlement', (side) => {
    const opening = 24_000
    const current = 24_100
    const initial = createLabPosition('future', 'NIFTY50', opening, 20, side, 2, 'call', 30, 20, 200)
    const variationPnl = (current - opening) * initial.units * side
    const position = { ...initial, entry: current, variationPnl }
    const book = { version: 1, balance: 50_000 + variationPnl, idx: 21, symbol: 'NIFTY50', positions: [position] }
    storage.setItem(derivativesKey, JSON.stringify(book))
    const raw = exportBackup()
    storage.setItem(derivativesKey, JSON.stringify({ ...book, positions: [] }))
    restoreBackup(raw)
    expect(JSON.parse(storage.getItem(derivativesKey)!)).toEqual(book)
  })

  it('preserves a negative lab cash balance caused by a modeled short-futures gap loss', () => {
    const opening = createLabPosition('future', 'NIFTY50', 24_000, 20, -1, 2, 'call', 30, 20, 200)
    const closed = closeLabPosition(opening, 50_000, 21, 'Manual exit')
    const book = {
      version: 1, balance: 50_000 + closed.closedPnl!, idx: 21, symbol: 'NIFTY50', positions: [closed],
    }
    expect(book.balance).toBeLessThan(0)
    storage.setItem(derivativesKey, JSON.stringify(book))
    const raw = exportBackup()
    storage.setItem(derivativesKey, JSON.stringify({ ...book, balance: 0, positions: [] }))
    restoreBackup(raw)
    expect(JSON.parse(storage.getItem(derivativesKey)!)).toEqual(book)
  })

  it('preserves fractional option units accepted by the derivatives model', () => {
    const position = createOption('put', 0.5)
    const book = { version: 1, balance: 50_000, idx: 20, symbol: 'NIFTY50', positions: [position] }
    storage.setItem(derivativesKey, JSON.stringify(book))
    const raw = exportBackup()
    storage.setItem(derivativesKey, JSON.stringify({ ...book, positions: [] }))
    restoreBackup(raw)
    expect(JSON.parse(storage.getItem(derivativesKey)!).positions[0].units).toBe(0.5)
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

  it.each([
    ['unsupported leg strategy', (p: any) => { p.legs = [{ type: 'call', strike: 20_000, side: -1 }] }],
    ['non-finite quantity', (p: any) => { p.units = Number.NaN }],
    ['oversized quantity', (p: any) => { p.units = 1_000_001 }],
    ['forged collateral', (p: any) => { p.margin += 1 }],
  ])('rejects %s without changing any ledger', (_name, alter) => {
    const source = JSON.parse(exportBackup())
    const position = createOption('bull-call')
    source.derivatives.positions = [position]
    alter(source.derivatives.positions[0])
    const before = storage.snapshot()

    expect(() => restoreBackup(JSON.stringify(source))).toThrow()
    expect(storage.snapshot()).toEqual(before)
  })

  it('rejects corrupt JSON without changing any ledger', () => {
    const before = storage.snapshot()
    expect(() => restoreBackup('{"format":"alpha-paper-backup","version":2,"state":NaN}')).toThrow()
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
