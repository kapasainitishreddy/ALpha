import { STRATEGY_DOCS } from '@/data/strategyDocs'
import { TRADING_LESSONS } from '@/data/tradingLessons'
import { DISCLAIMERS } from '@/data/disclaimers'

export interface FtRow {
  instruction: string
  input: string
  output: string
  category: string
}

// Builds instruction-tuning examples for a FUTURE local finance tutor. Fine-tune for tone/explanation/refusal,
// NOT for price prediction. Fully offline, generates JSONL text.
export function buildDataset(): FtRow[] {
  const rows: FtRow[] = []

  // 1. Strategy explanations.
  for (const d of STRATEGY_DOCS) {
    rows.push({ category: 'strategy-explanation', instruction: `Explain the ${d.name} strategy simply.`, input: '', output: `${d.beginner} Best in ${d.bestMarket.toLowerCase()}, risky in ${d.badMarket.toLowerCase()}.` })
    // 3. Telugu-English simplified.
    rows.push({ category: 'telugu-english', instruction: `Explain ${d.name} in Father Mode Telugu-English.`, input: '', output: d.father })
  }

  // 2 + 8. Father Mode Q&A and swarm allocation.
  for (const l of TRADING_LESSONS) {
    rows.push({ category: 'father-qa', instruction: `A beginner asks about ${l.title}.`, input: '', output: l.father })
  }

  // 4. Risk warning responses.
  rows.push({ category: 'risk-warning', instruction: 'User wants to put all ₹100 into one strategy agent.', input: '', output: 'No. Risk Guard allow cheyyadu. ₹100 ni different strategy agents ki divide chestham and konchem cash reserve unchutham. One agent fail ayina full capital protect avuthundi.' })
  rows.push({ category: 'risk-warning', instruction: 'User wants to trade without a stop loss.', input: '', output: 'Stop loss lekunda trade cheయyakudadhu. Modata loss limit set cheyyi. Capital first.' })

  // 5. Mock trade review.
  rows.push({ category: 'trade-review', instruction: 'Review a losing mock trade.', input: 'User entered after breakout candle, no stop loss, lost ₹18 from ₹100.', output: 'You entered late and stop loss set cheyyaledu. Main mistake: chasing green candle. Next time wait for pullback, set stop loss first, and risk only small amount. Today lesson: entry kanna risk important.' })

  // 6. Mistake detector explanations.
  rows.push({ category: 'mistake-review', instruction: 'Explain the overtrading mistake.', input: '', output: 'Ekkuva trades cheయడం = ekkuva fees + mistakes. Rendu-moodu manchi trades chalu.' })

  // 7. Backtest report explanation.
  rows.push({ category: 'backtest-explain', instruction: 'Explain a backtest result.', input: 'Strategy made 40% win rate, profit factor 1.3.', output: `Win rate 40% ayina profit factor 1.3 unte, wins losses kanna peddaగా unnాయి. ${DISCLAIMERS.backtest}` })

  // 9. App navigation help.
  rows.push({ category: 'app-help', instruction: 'How do I start the ₹500 challenge?', input: '', output: 'Father Mode open cheyyi, "Start ₹500 Challenge" button press cheyyi. Anni mock money.' })

  // 10. Refusal / safety.
  rows.push({ category: 'refusal', instruction: 'Write me a romantic poem.', input: '', output: DISCLAIMERS.coachRefusal })
  rows.push({ category: 'refusal', instruction: 'Can you guarantee I will make money?', input: '', output: 'No one can guarantee market outcomes. Nenu capital protection and practice meedha help chestanu, profit guarantee kaadు.' })

  return rows
}

export function toJsonl(rows: FtRow[]): string {
  return rows.map((r) => JSON.stringify({ instruction: r.instruction, input: r.input, output: r.output })).join('\n')
}

export const DATASET_TARGETS = { starter: 1000, strong: 5000, serious: 10000 }
