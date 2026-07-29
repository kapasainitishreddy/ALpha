// Shared domain models for BlackScythe Alpha. All monetary values are MOCK (paper) rupees.

export type AssetClass = 'index' | 'equity' | 'crypto'

export interface MockSymbol {
  symbol: string
  name: string
  assetClass: AssetClass
  basePrice: number
  tickVolatility: number // fractional per-candle vol
}

export interface Candle {
  time: number // unix seconds (sequential simulation clock)
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type MarketMood = 'trending-up' | 'trending-down' | 'sideways' | 'volatile' | 'panic'

export interface MarketEventDef {
  id: string
  name: string
  mood: MarketMood
  drift: number // per-candle directional bias
  volMultiplier: number
  gap?: number // opening gap fraction (+/-)
  idealStrategy: string
  dangerousStrategy: string
  fatherExplanation: string
}

export interface MarketSession {
  symbol: string
  event: MarketEventDef
  candles: Candle[]
  volatilityScore: number // 0..100
}

export type Side = 'buy' | 'sell'
export type OrderType = 'market' | 'limit'

export interface OrderRequest {
  symbol: string
  side: Side
  type: OrderType
  qty: number
  limitPrice?: number
  stopLoss?: number
  target?: number
  strategyTag?: string
}

export type TradeStatus = 'open' | 'closed'

export interface Trade {
  id: string
  symbol: string
  side: Side
  qty: number
  entryPrice: number
  stopLoss?: number
  target?: number
  exitPrice?: number
  status: TradeStatus
  strategyTag?: string
  openedAt: number
  closedAt?: number
  fees: number
  realizedPnl?: number
  agentId?: string
  mode: AppMode
}

export interface StrategySignal {
  strategyId: string
  action: Side | 'hold'
  confidence: number // 0..1
  entry: number
  stopLoss: number
  target: number
  reason: string
}

export interface RiskDecision {
  allow: boolean
  reason: string
  fatherExplanation: string
  riskScore: number // 0..100 (higher = riskier)
  requiredAction?: string
}

export interface RiskContext {
  mode: AppMode
  balance: number
  tradeValue: number
  stopLoss?: number
  target?: number
  entry: number
  side: Side
  strategyId?: string
  marketMood?: MarketMood
  consecutiveLosses: number
  dailyPnl: number
  tradesToday: number
  agentAllocation?: number // remaining allocation for an agent
  isRealAuto?: boolean
}

export type RiskLevel = 'low' | 'medium' | 'high'

export interface AgentConfig {
  id: string
  name: string
  strategyId: string
  allocation: number // mock rupees assigned
  maxTrades: number
  maxLoss: number
  riskLevel: RiskLevel
}

export interface AgentResult {
  config: AgentConfig
  trades: Trade[]
  pnl: number
  wins: number
  losses: number
  blockedTrades: number
  ending: number
  note: string
}

export interface SwarmResult {
  startingCapital: number
  cashReserve: number
  agents: AgentResult[]
  totalPnl: number
  endingCapital: number
  bestAgentId?: string
  worstAgentId?: string
  stoppedReason?: string
  fatherSummary: string
}

export interface BacktestResult {
  strategyId: string
  symbol: string
  eventId: string
  startBalance: number
  endBalance: number
  totalReturnPct: number
  trades: number
  wins: number
  losses: number
  winRatePct: number
  profitFactor: number
  maxDrawdownPct: number
  worstLosingStreak: number
  bestTradePnl: number
  worstTradePnl: number
  feesPaid: number
  equityCurve: number[]
  aiExplanation: string
  fatherExplanation: string
}

export interface Mistake {
  code: string
  title: string
  detail: string
  fatherAdvice: string
  severity: 'low' | 'medium' | 'high'
}

export interface JournalEntry {
  id: string
  mode: AppMode
  createdAt: number
  startBalance: number
  endBalance: number
  pnl: number
  tradeCount: number
  strategiesUsed: string[]
  bestTradePnl: number
  worstTradePnl: number
  mistakes: Mistake[]
  wentWell: string[]
  couldImprove: string[]
  followedRules: boolean
  tomorrowLesson: string
}

export type AppMode =
  | 'father'
  | 'manual'
  | 'assisted'
  | 'auto'
  | 'swarm'
  | 'backtest'

export interface ModeStat {
  mode: AppMode
  pnl: number
  winRatePct: number
  maxDrawdownPct: number
  trades: number
}

export interface ComparisonReport {
  stats: ModeStat[]
  safestMode?: AppMode
  bestMode?: AppMode
  bestLearningPoint: string
}
