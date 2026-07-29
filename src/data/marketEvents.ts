import type { MarketEventDef } from '@/types'

// The 25 simulated market scenarios from the spec. drift = per-candle bias, volMultiplier scales noise.
export const MARKET_EVENTS: MarketEventDef[] = [
  { id: 'normal-trend', name: 'Normal trend day', mood: 'trending-up', drift: 0.0008, volMultiplier: 1, idealStrategy: 'ema-trend', dangerousStrategy: 'mean-reversion', fatherExplanation: 'Slow steady up day. Trend follow strategies work. Against trend trade cheyyaku.' },
  { id: 'sideways', name: 'Sideways market', mood: 'sideways', drift: 0, volMultiplier: 0.7, idealStrategy: 'mean-reversion', dangerousStrategy: 'breakout-volume', fatherExplanation: 'Market range lo undi. Breakout traps ekkuva. Patience important.' },
  { id: 'high-vol', name: 'High volatility day', mood: 'volatile', drift: 0, volMultiplier: 2.2, idealStrategy: 'volatility-breakout', dangerousStrategy: 'mean-reversion', fatherExplanation: 'Peddha swings. Small quantity, wide stop loss thinking. Careful.' },
  { id: 'gap-up', name: 'Gap up', mood: 'trending-up', drift: 0.0006, volMultiplier: 1.3, gap: 0.015, idealStrategy: 'opening-range-breakout', dangerousStrategy: 'chase', fatherExplanation: 'Market gap up open ayindi. Chase cheyyaku, pullback wait cheyyi.' },
  { id: 'gap-down', name: 'Gap down', mood: 'trending-down', drift: -0.0006, volMultiplier: 1.3, gap: -0.015, idealStrategy: 'support-resistance', dangerousStrategy: 'chase', fatherExplanation: 'Gap down. Fear ekkuva. Capital protect first.' },
  { id: 'rbi-event', name: 'RBI event', mood: 'volatile', drift: 0, volMultiplier: 2.5, idealStrategy: 'vwap-reclaim', dangerousStrategy: 'breakout-volume', fatherExplanation: 'RBI news day. News tarvatha whipsaw. Event varaku wait.' },
  { id: 'earnings', name: 'Earnings event', mood: 'volatile', drift: 0.0003, volMultiplier: 2, idealStrategy: 'momentum', dangerousStrategy: 'mean-reversion', fatherExplanation: 'Results day. Big move possible. Position size chinnaga.' },
  { id: 'sector-rotation', name: 'Sector rotation', mood: 'trending-up', drift: 0.0005, volMultiplier: 1.1, idealStrategy: 'momentum', dangerousStrategy: 'support-resistance', fatherExplanation: 'Money one sector nunchi vere sector ki move authundi.' },
  { id: 'false-breakout', name: 'False breakout', mood: 'sideways', drift: 0, volMultiplier: 1.4, idealStrategy: 'vwap-reclaim', dangerousStrategy: 'breakout-volume', fatherExplanation: 'Breakout laga kanipisthundi kani fail authundi. Volume confirm cheyyi.' },
  { id: 'real-breakout', name: 'Real breakout', mood: 'trending-up', drift: 0.0012, volMultiplier: 1.4, idealStrategy: 'breakout-volume', dangerousStrategy: 'mean-reversion', fatherExplanation: 'Strong volume tho breakout. Trend strategies best.' },
  { id: 'sl-cascade', name: 'Stop-loss cascade', mood: 'panic', drift: -0.0015, volMultiplier: 2.4, idealStrategy: 'support-resistance', dangerousStrategy: 'chase', fatherExplanation: 'Stop losses trigger avuthunnai, fast fall. Away undadam better.' },
  { id: 'liquidity-trap', name: 'Liquidity trap', mood: 'sideways', drift: 0, volMultiplier: 1.6, idealStrategy: 'mean-reversion', dangerousStrategy: 'breakout-volume', fatherExplanation: 'Fake move tho traders ni trap chesthundi. Confirmation wait.' },
  { id: 'low-vol-fake', name: 'Low-volume fake move', mood: 'sideways', drift: 0.0002, volMultiplier: 0.9, idealStrategy: 'vwap-reclaim', dangerousStrategy: 'breakout-volume', fatherExplanation: 'Volume ledu, move nammakam ledu. Skip cheyyadam ok.' },
  { id: 'strong-vol-confirm', name: 'Strong-volume confirmation', mood: 'trending-up', drift: 0.001, volMultiplier: 1.5, idealStrategy: 'breakout-volume', dangerousStrategy: 'mean-reversion', fatherExplanation: 'Volume support tho move. Confidence ekkuva.' },
  { id: 'late-reversal', name: 'Late-day reversal', mood: 'volatile', drift: -0.0004, volMultiplier: 1.6, idealStrategy: 'vwap-reclaim', dangerousStrategy: 'momentum', fatherExplanation: 'End lo direction maruthundi. Late entries risky.' },
  { id: 'crypto-pump', name: 'Crypto pump', mood: 'trending-up', drift: 0.002, volMultiplier: 2, idealStrategy: 'momentum', dangerousStrategy: 'mean-reversion', fatherExplanation: 'Crypto fast pump. Greed control cheyyali, profit book cheyyi.' },
  { id: 'crypto-dump', name: 'Crypto dump', mood: 'panic', drift: -0.002, volMultiplier: 2.2, idealStrategy: 'support-resistance', dangerousStrategy: 'chase', fatherExplanation: 'Fast fall. Falling knife pattukోvaddu.' },
  { id: 'global-negative', name: 'Global negative open', mood: 'trending-down', drift: -0.0009, volMultiplier: 1.5, idealStrategy: 'support-resistance', dangerousStrategy: 'momentum', fatherExplanation: 'Global markets red. India kuda pressure lo.' },
  { id: 'news-rally', name: 'News-driven rally', mood: 'trending-up', drift: 0.0014, volMultiplier: 1.7, idealStrategy: 'momentum', dangerousStrategy: 'mean-reversion', fatherExplanation: 'Positive news tho rally. Kani news already priced undocchu.' },
  { id: 'panic-selloff', name: 'Panic selloff', mood: 'panic', drift: -0.0022, volMultiplier: 2.6, idealStrategy: 'support-resistance', dangerousStrategy: 'chase', fatherExplanation: 'Panic selling. Emotion tho trade cheyyaku. Cash safe.' },
  { id: 'banknifty-am', name: 'Bank Nifty volatile morning', mood: 'volatile', drift: 0.0003, volMultiplier: 2.3, idealStrategy: 'opening-range-breakout', dangerousStrategy: 'mean-reversion', fatherExplanation: 'Bank Nifty morning lo peddha swings. Small size.' },
  { id: 'nifty-grind', name: 'Nifty slow grind up', mood: 'trending-up', drift: 0.0005, volMultiplier: 0.8, idealStrategy: 'ema-trend', dangerousStrategy: 'volatility-breakout', fatherExplanation: 'Slow steady up. Patience tho hold.' },
  { id: 'it-rally', name: 'IT sector rally', mood: 'trending-up', drift: 0.0009, volMultiplier: 1.1, idealStrategy: 'momentum', dangerousStrategy: 'mean-reversion', fatherExplanation: 'IT stocks (TCS, INFY) rally. Sector strength.' },
  { id: 'reliance-shock', name: 'Reliance news shock', mood: 'volatile', drift: -0.0006, volMultiplier: 2.1, idealStrategy: 'vwap-reclaim', dangerousStrategy: 'chase', fatherExplanation: 'Reliance lo news shock. Sudden move, careful.' },
  { id: 'reversal-breakout', name: 'Sudden reversal after breakout', mood: 'volatile', drift: -0.0007, volMultiplier: 1.8, idealStrategy: 'support-resistance', dangerousStrategy: 'breakout-volume', fatherExplanation: 'Breakout tarvatha reverse. Trap. Stop loss must.' },
]

export function getEvent(id: string): MarketEventDef {
  return MARKET_EVENTS.find((e) => e.id === id) ?? MARKET_EVENTS[0]
}
