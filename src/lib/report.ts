import type { JournalEntry, Trade } from '@/types'
import { modeLabel, type DayRecord } from '@/store/useStore'
import { strategyFitness } from './insights'
import { streaks } from './progress'
import { inr } from './format'

// Printable performance report. Opens the browser's own print dialog, which on both Android
// and desktop offers "Save as PDF".
// ponytail: no jsPDF/html2pdf dependency — window.print already does this, and a 200KB library
// to avoid one CSS block is a bad trade.

export interface ReportInput {
  journal: JournalEntry[]
  trades: Trade[]
  history: DayRecord[]
  balance: number
  startingBalance: number
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

export function buildReportHtml({ journal, trades, history, balance, startingBalance }: ReportInput): string {
  const closed = trades.filter((t) => t.status === 'closed')
  const wins = closed.filter((t) => (t.realizedPnl ?? 0) > 0)
  const pnl = closed.reduce((s, t) => s + (t.realizedPnl ?? 0), 0)
  const s = streaks(history)
  const fit = strategyFitness(trades).slice(0, 5)

  const allMistakes = journal.flatMap((j) => j.mistakes)
  const mistakeCounts = new Map<string, { title: string; n: number; advice: string }>()
  for (const m of allMistakes) {
    const cur = mistakeCounts.get(m.code) ?? { title: m.title, n: 0, advice: m.fatherAdvice }
    mistakeCounts.set(m.code, { ...cur, n: cur.n + 1 })
  }
  const topMistakes = [...mistakeCounts.values()].sort((a, b) => b.n - a.n).slice(0, 5)

  const row = (a: string, b: string) => `<tr><td>${esc(a)}</td><td class="r">${esc(b)}</td></tr>`

  return `<!doctype html><html><head><meta charset="utf-8"><title>BlackScythe practice report</title>
<style>
  @page { margin: 16mm; }
  * { box-sizing: border-box; }
  body { font: 13px/1.5 system-ui, -apple-system, sans-serif; color: #111; max-width: 720px; margin: 0 auto; padding: 24px; }
  h1 { font-size: 22px; margin: 0 0 2px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .06em; color: #666; margin: 26px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .sub { color: #666; margin: 0 0 20px; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 5px 0; border-bottom: 1px solid #eee; }
  td.r { text-align: right; font-weight: 600; }
  .up { color: #0a7d33; } .down { color: #c0272d; }
  .grid { display: flex; gap: 10px; margin: 10px 0; }
  .kpi { flex: 1; border: 1px solid #ddd; border-radius: 8px; padding: 10px; text-align: center; }
  .kpi .n { font-size: 19px; font-weight: 700; }
  .kpi .l { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: .05em; }
  .note { background: #f6f6f6; border-left: 3px solid #999; padding: 9px 11px; font-size: 12px; margin: 8px 0; }
  .foot { margin-top: 28px; padding-top: 10px; border-top: 1px solid #ddd; color: #666; font-size: 11px; }
  @media print { .noprint { display: none; } }
</style></head><body>

<h1>BlackScythe practice report</h1>
<p class="sub">Generated ${esc(new Date().toLocaleString('en-IN'))} &middot; simulated trading only</p>

<div class="grid">
  <div class="kpi"><div class="n ${pnl >= 0 ? 'up' : 'down'}">${esc(inr(pnl))}</div><div class="l">Net P&amp;L</div></div>
  <div class="kpi"><div class="n">${closed.length}</div><div class="l">Trades</div></div>
  <div class="kpi"><div class="n">${closed.length ? ((wins.length / closed.length) * 100).toFixed(0) : 0}%</div><div class="l">Win rate</div></div>
  <div class="kpi"><div class="n">${s.tradingDays}</div><div class="l">Practice days</div></div>
</div>

<h2>Account</h2>
<table>
  ${row('Starting balance', inr(startingBalance))}
  ${row('Current balance', inr(balance))}
  ${row('Sessions reviewed', String(journal.length))}
  ${row('Green days / red days', `${s.greenDays} / ${s.redDays}`)}
  ${row('Best green streak', `${s.best} days`)}
</table>

${fit.length ? `<h2>Which strategies suit you</h2><table>${fit.map((f) =>
  `<tr><td>${esc(f.strategyId)}<div style="color:#666;font-size:11px">${esc(f.verdict)}</div></td>
   <td class="r ${f.totalPnl >= 0 ? 'up' : 'down'}">${esc(inr(f.totalPnl))}<div style="color:#666;font-size:11px;font-weight:400">${f.trades} trades &middot; ${f.winRatePct.toFixed(0)}% win</div></td></tr>`,
).join('')}</table>` : ''}

${topMistakes.length ? `<h2>Recurring mistakes</h2><table>${topMistakes.map((m) =>
  `<tr><td>${esc(m.title)}<div style="color:#666;font-size:11px">${esc(m.advice)}</div></td><td class="r">${m.n}×</td></tr>`,
).join('')}</table>` : ''}

${journal.length ? `<h2>Recent sessions</h2><table>${journal.slice(0, 10).map((j) =>
  `<tr><td>${esc(modeLabel[j.mode])}<div style="color:#666;font-size:11px">${esc(new Date(j.createdAt).toLocaleDateString('en-IN'))} &middot; ${j.tradeCount} trades</div></td>
   <td class="r ${j.pnl >= 0 ? 'up' : 'down'}">${esc(inr(j.pnl))}</td></tr>`,
).join('')}</table>` : ''}

<div class="note"><b>What this is.</b> A record of practice sessions using simulated money in a training
app. Market prices are either simulated or delayed public quotes. No broker was connected and no real
order was ever placed.</div>

<div class="note"><b>What this is not.</b> Evidence of trading ability with real money, investment advice,
or any indication of future results. Practice results do not transfer to live markets, where slippage,
liquidity, taxes and emotion all behave differently.</div>

<p class="foot">BlackScythe Alpha &middot; mock trading trainer &middot; not a broker, not investment advice</p>
<p class="noprint" style="text-align:center;margin-top:18px">
  <button onclick="window.print()" style="padding:9px 18px;font-size:14px;cursor:pointer">Save as PDF / Print</button>
</p>
</body></html>`
}

export function openReport(input: ReportInput): boolean {
  const w = window.open('', '_blank')
  if (!w) return false // popup blocked — caller tells the user
  w.document.write(buildReportHtml(input))
  w.document.close()
  return true
}
