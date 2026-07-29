// All user-facing safety copy lives here so a single test can assert no banned phrases exist.
// Never promise profit. Never say "risk-free". Never use hype targets.

export const DISCLAIMERS = {
  mockBadge: 'MOCK · paper money · no real trade',
  watchOnly: 'Watch-only. No real money used.',
  realLocked: 'Real Mode is locked in this version. Practice in mock mode first.',
  backtest: 'Backtests do not guarantee real results.',
  compoundWarning:
    '₹500 to ₹750 is a high-risk mock target. Real markets can lose money.',
  general:
    'This app is for education and practice only. It is not investment advice. All trades here use fake money.',
  coachRefusal:
    'I can help only with trading education, mock trading, strategy, risk, and the BlackScythe Alpha app.',
} as const

// Phrases that must NEVER appear anywhere in the product copy.
// The safety test greps source files for these.
export const BANNED_PHRASES: string[] = [
  'guaranteed profit',
  'guarantee profit',
  'guaranteed returns',
  'risk-free',
  'risk free',
  'never lose',
  'make money automatically',
  '₹500 to ₹5 lakh',
  '500 to 5 lakh',
  'double your money',
  'sure shot',
]
