import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppMode, JournalEntry, ModeStat, Trade } from '@/types'
import type { LlmConfig } from '@/engines/llmCoach'
import type { CustomStrategy } from '@/lib/customStrategy'
import type { CustomScenario } from '@/lib/scenario'

export interface ApiKeys {
  // Optional user-provided keys. NEVER required. Stored in localStorage (with a UI warning).
  upstox?: string
  dhan?: string
  zerodha?: string
  angelone?: string
  coingecko?: string
  binance?: string
  openai?: string
  claude?: string
  gemini?: string
  deepseek?: string
  qwen?: string
  ollamaEndpoint?: string
  localModelPath?: string
}

export interface Challenge {
  id: string
  name: string
  startCapital: number
  targetCapital: number
  days: number
  startedAt: number
  maxRiskPct: number // per-trade cap this challenge enforces
  status: 'active' | 'won' | 'failed'
}

// One row per calendar day the user actually traded. Feeds the streak + P&L calendar.
export interface DayRecord {
  date: string // YYYY-MM-DD, local
  pnl: number
  trades: number
}

export type Mood = 'calm' | 'confident' | 'anxious' | 'greedy' | 'frustrated'

// How you felt BEFORE the session, logged against what you then earned. The correlation is
// usually the most uncomfortable and most useful number in the app.
export interface MoodLog {
  at: number
  mood: Mood
  pnlAfter: number | null // filled in when the session is saved
}

// One attempt at the fixed daily scenario. Everyone gets the same market on the same date.
export interface DailyResult {
  date: string
  pnlPct: number
  trades: number
}

interface State {
  fatherMode: boolean
  balance: number // MOCK rupees
  startingBalance: number
  trades: Trade[]
  journal: JournalEntry[]
  modeStats: ModeStat[]
  apiKeys: ApiKeys
  llm: LlmConfig
  // session counters (reset per "day")
  consecutiveLosses: number
  dailyPnl: number
  tradesToday: number
  // progress + challenges
  history: DayRecord[]
  challenge: Challenge | null
  customStrategies: CustomStrategy[]
  customScenarios: CustomScenario[]
  moods: MoodLog[]
  dailyResults: DailyResult[]
  onboarded: boolean

  setFatherMode: (v: boolean) => void
  setLlm: (patch: Partial<LlmConfig>) => void
  addTrade: (t: Trade) => void
  updateTrade: (t: Trade) => void
  recordClose: (realized: number) => void
  addJournal: (e: JournalEntry) => void
  pushModeStat: (s: ModeStat) => void
  setKey: (k: keyof ApiKeys, v: string) => void
  startChallenge: (c: Omit<Challenge, 'startedAt' | 'status'>) => void
  endChallenge: (status: 'won' | 'failed') => void
  saveStrategy: (s: CustomStrategy) => void
  deleteStrategy: (id: string) => void
  saveScenario: (s: CustomScenario) => void
  deleteScenario: (id: string) => void
  logMood: (m: Mood) => void
  settleMood: (pnl: number) => void
  recordDaily: (r: DailyResult) => void
  setOnboarded: (v: boolean) => void
  resetDay: () => void
  resetAll: () => void
}

export const todayKey = (d = new Date()): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const START = 10000

export const useStore = create<State>()(
  persist(
    (set) => ({
      fatherMode: false,
      balance: START,
      startingBalance: START,
      trades: [],
      journal: [],
      modeStats: [],
      apiKeys: {},
      llm: {
        enabled: false,
        provider: 'groq',
        baseUrl: 'https://api.groq.com/openai/v1',
        apiKey: '',
        model: 'llama-3.3-70b-versatile',
      },
      consecutiveLosses: 0,
      dailyPnl: 0,
      tradesToday: 0,
      history: [],
      challenge: null,
      customStrategies: [],
      customScenarios: [],
      moods: [],
      dailyResults: [],
      onboarded: false,

      setFatherMode: (v) => set({ fatherMode: v }),
      setOnboarded: (v) => set({ onboarded: v }),
      setLlm: (patch) => set((s) => ({ llm: { ...s.llm, ...patch } })),
      addTrade: (t) => set((s) => ({ trades: [t, ...s.trades], tradesToday: s.tradesToday + 1 })),
      updateTrade: (t) => set((s) => ({ trades: s.trades.map((x) => (x.id === t.id ? t : x)) })),
      recordClose: (realized) =>
        set((s) => {
          // Roll the closed trade into today's row so the calendar and streak stay accurate
          // without a separate "end of day" step the user would forget to press.
          const key = todayKey()
          const seen = s.history.some((d) => d.date === key)
          const history = seen
            ? s.history.map((d) => (d.date === key ? { ...d, pnl: d.pnl + realized, trades: d.trades + 1 } : d))
            : [...s.history, { date: key, pnl: realized, trades: 1 }]

          const balance = s.balance + realized
          // Auto-resolve an active challenge the moment its target or floor is crossed.
          let challenge = s.challenge
          if (challenge?.status === 'active') {
            const expired = Date.now() > challenge.startedAt + challenge.days * 86_400_000
            if (balance >= challenge.targetCapital) challenge = { ...challenge, status: 'won' }
            else if (balance <= challenge.startCapital * 0.5 || expired) challenge = { ...challenge, status: 'failed' }
          }

          return {
            balance,
            dailyPnl: s.dailyPnl + realized,
            consecutiveLosses: realized < 0 ? s.consecutiveLosses + 1 : 0,
            history: history.slice(-365),
            challenge,
          }
        }),
      addJournal: (e) => set((s) => ({ journal: [e, ...s.journal].slice(0, 100) })),
      pushModeStat: (st) => set((s) => ({ modeStats: [...s.modeStats, st].slice(-50) })),
      setKey: (k, v) => set((s) => ({ apiKeys: { ...s.apiKeys, [k]: v } })),
      startChallenge: (c) =>
        set({
          challenge: { ...c, startedAt: Date.now(), status: 'active' },
          // A challenge is a fresh run — it owns the balance for its duration.
          balance: c.startCapital,
          startingBalance: c.startCapital,
          consecutiveLosses: 0,
          dailyPnl: 0,
          tradesToday: 0,
        }),
      endChallenge: (status) => set((s) => ({ challenge: s.challenge ? { ...s.challenge, status } : null })),
      saveStrategy: (st) =>
        set((s) => ({
          customStrategies: s.customStrategies.some((x) => x.id === st.id)
            ? s.customStrategies.map((x) => (x.id === st.id ? st : x))
            : [...s.customStrategies, st],
        })),
      deleteStrategy: (id) => set((s) => ({ customStrategies: s.customStrategies.filter((x) => x.id !== id) })),
      saveScenario: (sc) =>
        set((s) => ({
          customScenarios: s.customScenarios.some((x) => x.id === sc.id)
            ? s.customScenarios.map((x) => (x.id === sc.id ? sc : x))
            : [...s.customScenarios, sc],
        })),
      deleteScenario: (id) => set((s) => ({ customScenarios: s.customScenarios.filter((x) => x.id !== id) })),
      logMood: (mood) => set((s) => ({ moods: [...s.moods, { at: Date.now(), mood, pnlAfter: null }].slice(-200) })),
      // Attach the session result to the most recent unsettled mood entry.
      settleMood: (pnl) =>
        set((s) => {
          const i = s.moods.map((m) => m.pnlAfter).lastIndexOf(null)
          if (i === -1) return {}
          return { moods: s.moods.map((m, j) => (j === i ? { ...m, pnlAfter: pnl } : m)) }
        }),
      recordDaily: (r) =>
        set((s) => ({ dailyResults: [...s.dailyResults.filter((x) => x.date !== r.date), r].slice(-90) })),
      resetDay: () => set({ consecutiveLosses: 0, dailyPnl: 0, tradesToday: 0 }),
      resetAll: () =>
        set({
          balance: START,
          startingBalance: START,
          trades: [],
          journal: [],
          modeStats: [],
          consecutiveLosses: 0,
          dailyPnl: 0,
          tradesToday: 0,
          history: [],
          challenge: null,
          customStrategies: [],
          customScenarios: [],
          moods: [],
          dailyResults: [],
        }),
    }),
    { name: 'blackscythe-alpha' },
  ),
)

export const modeLabel: Record<AppMode, string> = {
  father: 'Father Mode',
  manual: 'Manual',
  assisted: 'AI-Assisted',
  auto: 'AI Auto',
  swarm: 'Strategy Swarm',
  backtest: 'Backtest',
}
