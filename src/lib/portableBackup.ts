import type { State } from '@/store/useStore'
import type { AppMode, JournalEntry, ModeStat, Trade } from '@/types'
import type { CustomStrategy, IndicatorId, Op, Rule } from './customStrategy'
import type { CustomScenario } from './scenario'

export const BACKUP_FORMAT = 'blackscythe-alpha-backup'
export const BACKUP_VERSION = 1
export const BACKUP_MAX_BYTES = 1024 * 1024

const MODES = new Set<AppMode>(['father', 'manual', 'assisted', 'auto', 'swarm', 'backtest'])
const SIDES = new Set(['buy', 'sell'])
const STATUSES = new Set(['open', 'closed'])
const INDICATORS = new Set<IndicatorId>(['rsi', 'priceVsEma20', 'priceVsSma20', 'volumeVsAvg', 'change3', 'priceVsHigh20', 'priceVsLow20'])
const OPS = new Set<Op>(['<', '>'])
const MOODS = new Set(['calm', 'confident', 'anxious', 'greedy', 'frustrated'])

export type PortableState = Pick<State,
  | 'fatherMode' | 'balance' | 'startingBalance' | 'trades' | 'journal' | 'modeStats'
  | 'consecutiveLosses' | 'dailyPnl' | 'tradesToday' | 'history' | 'challenge'
  | 'customStrategies' | 'customScenarios' | 'moods' | 'dailyResults' | 'onboarded'
>

export interface PortableBackup {
  format: typeof BACKUP_FORMAT
  version: typeof BACKUP_VERSION
  exportedAt: string
  state: PortableState
}

function record(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function text(v: unknown, max = 500): v is string {
  return typeof v === 'string' && v.length <= max
}

function finite(v: unknown, min = -1e12, max = 1e12): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max
}

function optionalFinite(v: unknown, min = -1e12, max = 1e12): boolean {
  return v === undefined || finite(v, min, max)
}

function stringArray(v: unknown, maxItems: number, maxLen = 500): v is string[] {
  return Array.isArray(v) && v.length <= maxItems && v.every((x) => text(x, maxLen))
}

function isTrade(v: unknown): v is Trade {
  if (!record(v)) return false
  return text(v.id, 120) && text(v.symbol, 32) && SIDES.has(v.side as string) && finite(v.qty, 0.000001, 1e7)
    && finite(v.entryPrice, 0, 1e12) && STATUSES.has(v.status as string) && finite(v.openedAt, 0, 1e15)
    && finite(v.fees, 0, 1e12) && MODES.has(v.mode as AppMode)
    && optionalFinite(v.stopLoss, 0, 1e12) && optionalFinite(v.target, 0, 1e12)
    && optionalFinite(v.exitPrice, 0, 1e12) && optionalFinite(v.closedAt, 0, 1e15)
    && optionalFinite(v.realizedPnl) && (v.strategyTag === undefined || text(v.strategyTag, 120))
    && (v.agentId === undefined || text(v.agentId, 120))
}

function isJournal(v: unknown): v is JournalEntry {
  if (!record(v) || !text(v.id, 120) || !MODES.has(v.mode as AppMode) || !finite(v.createdAt, 0, 1e15)) return false
  if (![v.startBalance, v.endBalance, v.pnl, v.bestTradePnl, v.worstTradePnl].every((x) => finite(x))) return false
  if (!finite(v.tradeCount, 0, 1e6) || typeof v.followedRules !== 'boolean' || !text(v.tomorrowLesson, 2000)) return false
  if (!stringArray(v.strategiesUsed, 100, 120) || !stringArray(v.wentWell, 100, 1000) || !stringArray(v.couldImprove, 100, 1000)) return false
  if (!Array.isArray(v.mistakes) || v.mistakes.length > 100) return false
  return v.mistakes.every((m) => record(m) && text(m.code, 120) && text(m.title, 300) && text(m.detail, 2000)
    && text(m.fatherAdvice, 2000) && ['low', 'medium', 'high'].includes(String(m.severity)))
}

function isModeStat(v: unknown): v is ModeStat {
  return record(v) && MODES.has(v.mode as AppMode) && finite(v.pnl) && finite(v.winRatePct, 0, 100)
    && finite(v.maxDrawdownPct, 0, 100) && finite(v.trades, 0, 1e7)
}

function isRule(v: unknown): v is Rule {
  return record(v) && INDICATORS.has(v.indicator as IndicatorId) && OPS.has(v.op as Op) && finite(v.value, -1e6, 1e6)
}

function isStrategy(v: unknown): v is CustomStrategy {
  return record(v) && text(v.id, 120) && text(v.name, 120) && SIDES.has(v.side as string)
    && Array.isArray(v.rules) && v.rules.length <= 20 && v.rules.every(isRule)
    && finite(v.stopPct, 0.01, 100) && finite(v.targetPct, 0.01, 1000)
}

function isScenario(v: unknown): v is CustomScenario {
  return record(v) && text(v.id, 120) && text(v.name, 120) && finite(v.drift, -1, 1)
    && finite(v.volMultiplier, 0.01, 20) && finite(v.gap, -1, 1)
    && optionalFinite(v.newsAt, 0, 1e6) && (v.newsText === undefined || text(v.newsText, 1000))
    && optionalFinite(v.newsImpact, -1, 1)
}

function isPortableState(v: unknown): v is PortableState {
  if (!record(v) || typeof v.fatherMode !== 'boolean' || typeof v.onboarded !== 'boolean') return false
  if (![v.balance, v.startingBalance].every((x) => finite(x, 0, 1e12))) return false
  if (![v.consecutiveLosses, v.tradesToday].every((x) => finite(x, 0, 1e7)) || !finite(v.dailyPnl)) return false
  if (!Array.isArray(v.trades) || v.trades.length > 2000 || !v.trades.every(isTrade)) return false
  if (!Array.isArray(v.journal) || v.journal.length > 200 || !v.journal.every(isJournal)) return false
  if (!Array.isArray(v.modeStats) || v.modeStats.length > 200 || !v.modeStats.every(isModeStat)) return false
  if (!Array.isArray(v.history) || v.history.length > 730 || !v.history.every((x) => record(x) && text(x.date, 16) && finite(x.pnl) && finite(x.trades, 0, 1e7))) return false
  if (v.challenge !== null && !(record(v.challenge) && text(v.challenge.id, 120) && text(v.challenge.name, 200)
    && finite(v.challenge.startCapital, 0, 1e12) && finite(v.challenge.targetCapital, 0, 1e12)
    && finite(v.challenge.days, 1, 3650) && finite(v.challenge.startedAt, 0, 1e15)
    && finite(v.challenge.maxRiskPct, 0, 100) && ['active', 'won', 'failed'].includes(String(v.challenge.status)))) return false
  if (!Array.isArray(v.customStrategies) || v.customStrategies.length > 100 || !v.customStrategies.every(isStrategy)) return false
  if (!Array.isArray(v.customScenarios) || v.customScenarios.length > 100 || !v.customScenarios.every(isScenario)) return false
  if (!Array.isArray(v.moods) || v.moods.length > 500 || !v.moods.every((x) => record(x) && finite(x.at, 0, 1e15)
    && MOODS.has(String(x.mood)) && (x.pnlAfter === null || finite(x.pnlAfter)))) return false
  if (!Array.isArray(v.dailyResults) || v.dailyResults.length > 365 || !v.dailyResults.every((x) => record(x) && text(x.date, 16)
    && finite(x.pnlPct, -100, 1e6) && finite(x.trades, 0, 1e7))) return false
  return true
}

export function createPortableBackup(state: State, now = new Date()): string {
  const portable: PortableState = {
    fatherMode: state.fatherMode,
    balance: state.balance,
    startingBalance: state.startingBalance,
    trades: state.trades,
    journal: state.journal,
    modeStats: state.modeStats,
    consecutiveLosses: state.consecutiveLosses,
    dailyPnl: state.dailyPnl,
    tradesToday: state.tradesToday,
    history: state.history,
    challenge: state.challenge,
    customStrategies: state.customStrategies,
    customScenarios: state.customScenarios,
    moods: state.moods,
    dailyResults: state.dailyResults,
    onboarded: state.onboarded,
  }
  return JSON.stringify({ format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: now.toISOString(), state: portable } satisfies PortableBackup, null, 2)
}

export function parsePortableBackup(raw: string): PortableState {
  if (new TextEncoder().encode(raw).byteLength > BACKUP_MAX_BYTES) throw new Error('Backup is larger than 1 MiB.')
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Backup is not valid JSON.')
  }
  if (!record(parsed) || parsed.format !== BACKUP_FORMAT || parsed.version !== BACKUP_VERSION || !text(parsed.exportedAt, 80)) {
    throw new Error('This is not a supported BlackScythe Alpha backup.')
  }
  if (!isPortableState(parsed.state)) throw new Error('Backup data is malformed or outside safe limits.')
  return parsed.state
}
