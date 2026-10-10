import { useStore } from '@/store/useStore'
import { validateCandles } from './historical'
const fields = [
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
export function exportBackup(): string {
  const s = useStore.getState()
  return JSON.stringify(
    {
      format: 'alpha-paper-backup',
      version: 1,
      savedAt: new Date().toISOString(),
      state: Object.fromEntries(fields.map((k) => [k, s[k]])),
    },
    null,
    2,
  )
}
export function restoreBackup(text: string): void {
  if (text.length > 5_000_000) throw new Error('Backup exceeds 5 MB.')
  const data = JSON.parse(text)
  if (data?.format !== 'alpha-paper-backup' || data.version !== 1 || !data.state)
    throw new Error('Unsupported backup format.')
  const s = data.state
  const finite = (n: unknown) => typeof n === 'number' && Number.isFinite(n)
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
  for (const k of fields) {
    const current = useStore.getState()[k]
    if (Array.isArray(current) && (!Array.isArray(s[k]) || s[k].length > 10000))
      throw new Error(`Invalid ${k}`)
  }
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
  // Only state fields are imported; credentials and action implementations never enter the file.
  useStore.setState({ ...Object.fromEntries(fields.map((k) => [k, s[k]])), orderEvents: [] })
  useStore.getState().ensureDay()
}
export function downloadText(filename: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
