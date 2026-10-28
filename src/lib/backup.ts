import { useStore } from '@/store/useStore'
import { validateCandles } from './historical'
import { MOCK_SYMBOLS } from '@/data/mockSymbols'
import { legValue, type DerivativeBook, type OptionStructure } from './derivatives'
import { priceOption } from './options'

const mainFields = [
  'language',
  'completedLessons',
  'journaledTradeIds',
  'pendingOrders',
  'sessions',
  'dayKey',
  'dayStartBalance',
  'stoppedToday',
  'fatherMode',
  'balance',
  'startingBalance',
  'trades',
  'journal',
  'modeStats',
  'consecutiveLosses',
  'dailyPnl',
  'tradesToday',
  'history',
  'challenge',
  'customStrategies',
  'customScenarios',
  'moods',
  'dailyResults',
  'onboarded',
] as const
const fields = [...mainFields, 'orderEvents'] as const
const arrayFields = [
  'completedLessons', 'journaledTradeIds', 'pendingOrders', 'trades', 'journal',
  'modeStats', 'history', 'customStrategies', 'customScenarios', 'moods', 'dailyResults',
  'orderEvents',
] as const
const mainStorageKey = 'blackscythe-alpha'
const derivativesStorageKey = 'alpha-derivatives'
const researchStorageKey = 'alpha-research-note'
const backupFormat = 'alpha-paper-backup'
const maxBackupBytes = 5_000_000

export interface BackupPreview {
  version: 1 | 2
  savedAt: string
  balance: number
  trades: number
  openPositions: number
  pendingOrders: number
  journalEntries: number
  derivativePositions: number | null
  openDerivativePositions: number | null
  researchNoteSections: number | null
  preservesDeviceOnlyData: boolean
}

const isRecord = (v: unknown): v is Record<string, any> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n)
const text = (v: unknown, max = 2000) => typeof v === 'string' && v.length <= max

function validateDerivativeBook(value: unknown): value is DerivativeBook {
  if (!isRecord(value) || value.version !== 1 || !finite(value.balance) || value.balance < -1_000_000_000_000 ||
    !Number.isInteger(value.idx) || value.idx < 20 || value.idx >= 120 ||
    typeof value.symbol !== 'string' || !MOCK_SYMBOLS.some((s) => s.symbol === value.symbol) ||
    !Array.isArray(value.positions) || value.positions.length > 1000) return false
  const ids = new Set<string>()
  let reserved = 0
  for (const p of value.positions as unknown[]) {
    if (!isRecord(p) || !text(p.id, 120) || ids.has(p.id) ||
      !['future', 'option'].includes(p.kind) || typeof p.symbol !== 'string' ||
      !MOCK_SYMBOLS.some((s) => s.symbol === p.symbol) ||
      !finite(p.units) || p.units <= 0 || p.units > 1_000_000 ||
      ![1, -1].includes(p.side) || !finite(p.entry) ||
      !Number.isInteger(p.openedIdx) || p.openedIdx < 0 || p.openedIdx > value.idx ||
      !Number.isInteger(p.expiryIdx) || p.expiryIdx <= p.openedIdx || p.expiryIdx > 180 ||
      !finite(p.iv) || p.iv < 1 || p.iv > 100 || !finite(p.margin) || p.margin < 0 ||
      !finite(p.entryFee) || p.entryFee < 0 || !Array.isArray(p.legs) || p.legs.length > 4 ||
      (p.kind === 'future' && p.legs.length !== 0) ||
      (p.kind === 'option' && p.legs.length === 0) ||
      (p.variationPnl !== undefined && !finite(p.variationPnl)) ||
      (p.closedPnl !== undefined && !finite(p.closedPnl)) ||
      (p.closedIdx !== undefined && (!Number.isInteger(p.closedIdx) || p.closedIdx < p.openedIdx || p.closedIdx > value.idx)) ||
      (p.reason !== undefined && !text(p.reason, 300)) ||
      ((p.closedPnl === undefined) !== (p.closedIdx === undefined)) ||
      ((p.closedPnl === undefined) !== (p.reason === undefined))) return false
    ids.add(p.id)
    for (const leg of p.legs as unknown[]) {
      if (!isRecord(leg) || !['call', 'put'].includes(leg.type) ||
        !finite(leg.strike) || leg.strike <= 0 || ![1, -1].includes(leg.side)) return false
    }
    if (p.kind === 'future') {
      if (p.entry <= 0 || p.side !== 1 && p.side !== -1 || p.legs.length !== 0) return false
      const openingEntry = p.entry - (p.variationPnl ?? 0) / (p.units * p.side)
      if (!finite(openingEntry) || openingEntry <= 0) return false
      const expectedMargin = openingEntry * p.units * 0.1
      const expectedFee = openingEntry * p.units * 0.0008
      if (!closeEnough(p.margin, expectedMargin) || !closeEnough(p.entryFee, expectedFee)) return false
    } else {
      if (p.side !== 1 || p.variationPnl !== undefined) return false
      const shape = inferOptionShape(p.legs as Array<{ type: string; strike: number; side: number }>)
      if (!shape) return false
      const days = p.expiryIdx - p.openedIdx
      const expectedEntry = legValue(p.legs, shape.spot, days, p.iv)
      if (!closeEnough(p.entry, expectedEntry)) return false
      const notional = p.legs.reduce((sum: number, leg: { type: 'call' | 'put'; strike: number }) =>
        sum + priceOption(shape.spot, leg.strike, leg.type, days, p.iv).premium * p.units, 0)
      const expectedMargin = shape.structure === 'iron-condor'
        ? Math.max(0, shape.width + expectedEntry) * p.units
        : Math.max(0, expectedEntry) * p.units
      if (!closeEnough(p.margin, expectedMargin) || !closeEnough(p.entryFee, notional * 0.0008)) return false
    }
    if (p.closedPnl === undefined) reserved += p.margin + p.entryFee
  }
  const negativeBalanceHasFutureLoss = value.balance >= 0 ||
    value.positions.some((p: any) => p.kind === 'future' && p.closedPnl !== undefined)
  return Number.isFinite(reserved) && reserved <= Math.max(0, value.balance) + 1e-8 && negativeBalanceHasFutureLoss
}

function closeEnough(actual: number, expected: number): boolean {
  return Number.isFinite(expected) && Math.abs(actual - expected) <= Math.max(1, Math.abs(expected)) * 1e-9
}

function inferOptionShape(legs: Array<{ type: string; strike: number; side: number }>):
  { structure: OptionStructure; spot: number; width: number } | null {
  const is = (i: number, type: string, side: number) => legs[i]?.type === type && legs[i]?.side === side
  if (legs.length === 1 && is(0, 'call', 1)) return { structure: 'call', spot: legs[0].strike, width: 0 }
  if (legs.length === 1 && is(0, 'put', 1)) return { structure: 'put', spot: legs[0].strike, width: 0 }
  if (legs.length === 2 && is(0, 'call', 1) && is(1, 'call', -1) && legs[1].strike > legs[0].strike)
    return { structure: 'bull-call', spot: legs[0].strike, width: legs[1].strike - legs[0].strike }
  if (legs.length === 2 && is(0, 'put', 1) && is(1, 'put', -1) && legs[0].strike > legs[1].strike)
    return { structure: 'bear-put', spot: legs[0].strike, width: legs[0].strike - legs[1].strike }
  if (legs.length === 2 && is(0, 'call', 1) && is(1, 'put', 1) && legs[0].strike === legs[1].strike)
    return { structure: 'straddle', spot: legs[0].strike, width: 0 }
  if (legs.length === 4 && is(0, 'put', -1) && is(1, 'put', 1) &&
    is(2, 'call', -1) && is(3, 'call', 1)) {
    const width = legs[0].strike - legs[1].strike
    const upperWidth = legs[3].strike - legs[2].strike
    if (width > 0 && closeEnough(width, upperWidth) && legs[2].strike > legs[0].strike)
      return { structure: 'iron-condor', spot: (legs[0].strike + legs[2].strike) / 2, width }
  }
  return null
}

function validateResearchNote(value: unknown): value is string[] {
  return Array.isArray(value) && value.length <= 6 && value.every((part) => text(part, 2000))
}

function parseStored(storage: Storage, key: string): unknown {
  const raw = storage.getItem(key)
  if (raw === null) return null
  try { return JSON.parse(raw) } catch { throw new Error(`Stored ${key} data is corrupted.`) }
}

function writeStorageTransaction(storage: Storage, values: Map<string, string | null>): void {
  const before = new Map<string, string | null>()
  for (const key of values.keys()) before.set(key, storage.getItem(key))
  try {
    for (const [key, value] of values) {
      if (value === null) storage.removeItem(key)
      else storage.setItem(key, value)
    }
  } catch (error) {
    let rollbackError: unknown
    for (const [key, value] of before) {
      try {
        if (value === null) storage.removeItem(key)
        else storage.setItem(key, value)
      } catch (failure) { rollbackError ??= failure }
    }
    if (rollbackError) throw new Error('Storage update failed and rollback was incomplete. Keep this device open and export any remaining data.', { cause: error })
    throw new Error('Storage update failed. Existing device data was restored.', { cause: error })
  }
}

export function exportBackup(): string {
  const s = useStore.getState()
  const storage = window.localStorage
  const derivatives = parseStored(storage, derivativesStorageKey) ?? {
    version: 1, balance: 50000, idx: 20, symbol: 'NIFTY50', positions: [],
  }
  const researchNote = parseStored(storage, researchStorageKey) ?? []
  if (!validateDerivativeBook(derivatives)) throw new Error('The derivatives lab data is invalid; export was not created.')
  if (!validateResearchNote(researchNote)) throw new Error('The research note data is invalid; export was not created.')
  return JSON.stringify(
    {
      format: backupFormat,
      version: 2,
      savedAt: new Date().toISOString(),
      state: Object.fromEntries(fields.map((k) => [k, s[k]])),
      derivatives,
      researchNote,
    },
    null,
    2,
  )
}

function parseBackup(raw: string): { version: 1 | 2; savedAt: string; state: Record<string, any>; derivatives?: DerivativeBook; researchNote?: string[] } {
  if (new TextEncoder().encode(raw).byteLength > maxBackupBytes) throw new Error('Backup exceeds 5 MB.')
  let data: any
  try { data = JSON.parse(raw) } catch { throw new Error('Backup is not valid JSON.') }
  if (!isRecord(data) || data.format !== backupFormat || ![1, 2].includes(data.version) ||
    !text(data.savedAt, 80) || !isRecord(data.state)) throw new Error('Unsupported backup format.')
  const s = data.state
  const version = data.version as 1 | 2
  const requiredFields = version === 1 ? mainFields : fields
  for (const k of requiredFields) if (!(k in s)) throw new Error(`Backup is missing ${k}.`)
  for (const k of ['balance', 'startingBalance', 'dayStartBalance'])
    if (!finite(s[k]) || s[k] <= 0) throw new Error(`Invalid ${k}`)
  for (const k of ['consecutiveLosses', 'tradesToday'])
    if (!Number.isInteger(s[k]) || s[k] < 0) throw new Error(`Invalid ${k}`)
  if (!finite(s.dailyPnl) || !['en', 'te', 'hi'].includes(s.language))
    throw new Error('Invalid account settings.')
  for (const k of ['fatherMode', 'stoppedToday', 'onboarded'])
    if (typeof s[k] !== 'boolean') throw new Error(`Invalid ${k}`)
  if (typeof s.dayKey !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.dayKey))
    throw new Error('Invalid day')
  const arraysToValidate = version === 1 ? arrayFields.filter((k) => k !== 'orderEvents') : arrayFields
  for (const k of arraysToValidate) if (!Array.isArray(s[k]) || s[k].length > 10000) throw new Error(`Invalid ${k}`)
  if (version === 2 && s.orderEvents.some((e: any) => !isRecord(e) || !text(e.sessionId, 200) || !text(e.symbol, 80) || !text(e.message, 1000) || !finite(e.at))) throw new Error('Invalid order events')
  if (
    !s.sessions ||
    typeof s.sessions !== 'object' ||
    Array.isArray(s.sessions) ||
    Object.keys(s.sessions).length > 500
  )
    throw new Error('Invalid sessions')
  for (const session of Object.values(s.sessions) as Array<{ idx: number; candles?: unknown }>) {
    if (!Number.isInteger(session.idx) || session.idx < 0)
      throw new Error('Invalid session position')
    if (session.candles) validateCandles(session.candles)
  }
  for (const t of s.trades) {
    if (
      typeof t.id !== 'string' ||
      typeof t.symbol !== 'string' ||
      !['buy', 'sell'].includes(t.side) ||
      !['open', 'closed'].includes(t.status) ||
      !finite(t.qty) ||
      t.qty <= 0 ||
      !finite(t.entryPrice) ||
      t.entryPrice <= 0 ||
      !finite(t.fees) ||
      t.fees < 0 ||
      !finite(t.openedAt) ||
      (t.status === 'closed' && !finite(t.realizedPnl))
    )
      throw new Error('Invalid trade')
    if (
      t.status === 'open' &&
      (typeof t.sessionId !== 'string' || !finite(t.stopLoss) || t.stopLoss <= 0)
    )
      throw new Error('Invalid open position')
  }
  if (new Set(s.trades.map((t: { id: string }) => t.id)).size !== s.trades.length)
    throw new Error('Duplicate trades')
  for (const o of s.pendingOrders)
    if (
      typeof o.id !== 'string' ||
      typeof o.sessionId !== 'string' ||
      !o.order ||
      !finite(o.order.qty) ||
      o.order.qty <= 0 ||
      !finite(o.order.limitPrice ?? o.order.triggerPrice) ||
      !finite(o.order.stopLoss) ||
      !['limit', 'stop'].includes(o.order.type)
    )
      throw new Error('Invalid pending order')
  for (const st of s.customStrategies)
    if (
      typeof st.id !== 'string' ||
      typeof st.name !== 'string' ||
      !Array.isArray(st.rules) ||
      !['buy', 'sell'].includes(st.side) ||
      !finite(st.stopPct) ||
      st.stopPct <= 0 ||
      !finite(st.targetPct) ||
      st.targetPct <= 0 ||
      st.rules.some(
        (r: { indicator: string; op: string; value: number }) =>
          ![
            'rsi',
            'priceVsEma20',
            'priceVsSma20',
            'volumeVsAvg',
            'change3',
            'priceVsHigh20',
            'priceVsLow20',
          ].includes(r.indicator) ||
          !['<', '>'].includes(r.op) ||
          !finite(r.value),
      )
    )
      throw new Error('Invalid strategy')
  for (const sc of s.customScenarios)
    if (
      typeof sc.id !== 'string' ||
      typeof sc.name !== 'string' ||
      !finite(sc.drift) ||
      Math.abs(sc.drift) > 0.1 ||
      !finite(sc.volMultiplier) ||
      sc.volMultiplier <= 0 ||
      sc.volMultiplier > 10 ||
      !finite(sc.gap) ||
      Math.abs(sc.gap) > 0.5
    )
      throw new Error('Invalid scenario')
  for (const k of ['completedLessons', 'journaledTradeIds'])
    if (s[k].some((id: unknown) => typeof id !== 'string')) throw new Error(`Invalid ${k}`)
  if (
    s.challenge !== null &&
    (typeof s.challenge !== 'object' ||
      !['active', 'won', 'failed'].includes(s.challenge.status) ||
      !['startCapital', 'targetCapital', 'days', 'startedAt', 'maxRiskPct'].every(
        (k) => finite(s.challenge[k]) && s.challenge[k] > 0,
      ))
  )
    throw new Error('Invalid challenge')
  const modes = ['father', 'manual', 'assisted', 'auto', 'swarm', 'backtest']
  const strings = (row: Record<string, unknown>, keys: string[]) =>
    keys.every((k) => typeof row?.[k] === 'string')
  const numbers = (row: Record<string, unknown>, keys: string[]) =>
    keys.every((k) => finite(row?.[k]))
  for (const t of s.trades) {
    if (
      !modes.includes(t.mode) ||
      (t.target !== undefined && (!finite(t.target) || t.target <= 0)) ||
      (t.stopLoss !== undefined && (!finite(t.stopLoss) || t.stopLoss <= 0))
    )
      throw new Error('Invalid trade protection')
    if (
      t.status === 'open' &&
      (t.side === 'buy' ? t.stopLoss >= t.entryPrice : t.stopLoss <= t.entryPrice)
    )
      throw new Error('Invalid trade stop direction')
    if (t.sessionId?.startsWith('replay:') && !s.sessions[t.sessionId]?.candles)
      throw new Error('Replay position has no matching candle history')
  }
  for (const o of s.pendingOrders)
    if (
      !modes.includes(o.mode) ||
      typeof o.order.symbol !== 'string' ||
      !['buy', 'sell'].includes(o.order.side) ||
      (o.order.target !== undefined && !finite(o.order.target))
    )
      throw new Error('Invalid pending order context')
  if (new Set(s.pendingOrders.map((o: { id: string }) => o.id)).size !== s.pendingOrders.length)
    throw new Error('Duplicate pending orders')
  for (const entry of s.journal) {
    if (
      !strings(entry, ['id', 'tomorrowLesson']) ||
      !modes.includes(entry.mode) ||
      !numbers(entry, [
        'createdAt',
        'startBalance',
        'endBalance',
        'pnl',
        'tradeCount',
        'bestTradePnl',
        'worstTradePnl',
      ]) ||
      typeof entry.followedRules !== 'boolean'
    )
      throw new Error('Invalid journal entry')
    for (const key of ['strategiesUsed', 'wentWell', 'couldImprove'])
      if (!Array.isArray(entry[key]) || entry[key].some((v: unknown) => typeof v !== 'string'))
        throw new Error('Invalid journal text')
    if (
      !Array.isArray(entry.mistakes) ||
      entry.mistakes.some(
        (m: Record<string, unknown>) =>
          !strings(m, ['code', 'title', 'detail', 'fatherAdvice']) ||
          !['low', 'medium', 'high'].includes(String(m.severity)),
      )
    )
      throw new Error('Invalid journal mistakes')
  }
  for (const st of s.modeStats)
    if (
      !modes.includes(st?.mode) ||
      !numbers(st, ['pnl', 'winRatePct', 'maxDrawdownPct', 'trades'])
    )
      throw new Error('Invalid mode statistics')
  for (const h of s.history)
    if (!strings(h, ['date']) || !numbers(h, ['pnl', 'trades'])) throw new Error('Invalid history')
  for (const d of s.dailyResults)
    if (!strings(d, ['date']) || !numbers(d, ['pnlPct', 'trades']))
      throw new Error('Invalid daily result')
  for (const m of s.moods)
    if (
      !['calm', 'confident', 'anxious', 'greedy', 'frustrated'].includes(m?.mood) ||
      !finite(m.at) ||
      (m.pnlAfter !== null && !finite(m.pnlAfter))
    )
      throw new Error('Invalid mood record')
  if (
    s.challenge &&
    (!strings(s.challenge, ['id', 'name']) ||
      s.challenge.maxRiskPct > 100 ||
      s.challenge.days > 365)
  )
    throw new Error('Invalid challenge')
  let derivatives: DerivativeBook | undefined
  let researchNote: string[] | undefined
  if (version === 2) {
    if (!validateDerivativeBook(data.derivatives)) throw new Error('Invalid derivatives lab data.')
    if (!validateResearchNote(data.researchNote)) throw new Error('Invalid research note data.')
    derivatives = data.derivatives
    researchNote = data.researchNote
  }
  return { version, savedAt: data.savedAt, state: s, derivatives, researchNote }
}

export function inspectBackup(raw: string): BackupPreview {
  const backup = parseBackup(raw)
  const openPositions = backup.state.trades.filter((t: any) => t.status === 'open').length
  const derivativePositions = backup.derivatives?.positions.length ?? null
  return {
    version: backup.version,
    savedAt: backup.savedAt,
    balance: backup.state.balance,
    trades: backup.state.trades.length,
    openPositions,
    pendingOrders: backup.state.pendingOrders.length,
    journalEntries: backup.state.journal.length,
    derivativePositions,
    openDerivativePositions: backup.derivatives?.positions.filter((p) => p.closedPnl === undefined).length ?? null,
    researchNoteSections: backup.researchNote?.filter((part) => part.trim().length > 0).length ?? null,
    preservesDeviceOnlyData: backup.version === 1,
  }
}

export function restoreBackup(raw: string): void {
  const backup = parseBackup(raw)
  const storage = window.localStorage
  const existingMain = parseStored(storage, mainStorageKey)
  const oldState = isRecord(existingMain) && isRecord(existingMain.state) ? existingMain.state : {}
  const legacyOrderEvents = Array.isArray(oldState.orderEvents) ? oldState.orderEvents : []
  const state = Object.fromEntries((backup.version === 1 ? mainFields : fields).map((k) => [k, backup.state[k]]))
  if (backup.version === 1) state.orderEvents = legacyOrderEvents
  // Credentials and executable actions are never imported or serialized into this backup.
  const persisted = JSON.stringify({ state: { ...state, apiKeys: {}, llm: { enabled: false, provider: 'groq', baseUrl: 'https://api.groq.com/openai/v1', apiKey: '', model: 'llama-3.3-70b-versatile' } }, version: 2 })
  const writes = new Map<string, string>([[mainStorageKey, persisted]])
  if (backup.version === 2) {
    writes.set(derivativesStorageKey, JSON.stringify(backup.derivatives))
    writes.set(researchStorageKey, JSON.stringify(backup.researchNote))
  }
  writeStorageTransaction(storage, writes)
}

export function deleteAllLocalData(): void {
  writeStorageTransaction(window.localStorage, new Map([
    [mainStorageKey, null],
    [derivativesStorageKey, null],
    [researchStorageKey, null],
  ]))
}
export function downloadText(filename: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
