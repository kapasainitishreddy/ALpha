// Guardrails for the coach, applies whether the answer comes from rules, KB, or a future LLM.

// Topics the coach is allowed to help with.
export const ALLOWED_TOPICS = [
  'trade', 'trading', 'stock', 'market', 'strategy', 'risk', 'stop', 'loss', 'profit',
  'swarm', 'agent', 'backtest', 'nifty', 'banknifty', 'crypto', 'rsi', 'ema', 'vwap',
  'father', 'mock', 'app', 'blackscythe', 'api', 'key', 'journal', 'mistake', 'candle',
  'model', 'algorithm', 'correlation', 'cointegration', 'orders', 'price', 'prices', 'shares', 'stocks', 'dividends', 'option', 'options', 'futures', 'valuation', 'earnings', 'portfolio', 'dividend', 'margin', 'research', 'arbitrage', 'hedge', 'sentiment', 'regression', 'reinforcement', 'volume', 'breakout', 'momentum', 'position', 'size', 'reward', 'compound', 'sebi',
]

const NATIVE_TOPICS = ['స్టాప్', 'రిస్క్', 'షేర్', 'ట్రేడ', 'నష్టం', 'లాభం', 'మార్కెట్', 'పరిమాణం', 'స్టాక్', 'వ్యూహ', 'ఆప్షన్', 'ఫ్యూచర్', 'స్టాప్ లాస్', 'नुकसान', 'जोखिम', 'शेयर', 'ट्रेड', 'बाजार', 'मुनाफा', 'स्टॉप', 'रणनीति', 'ऑप्शन', 'फ्यूचर्स', 'पूंजी']
export function isOnTopic(question: string): boolean {
  const q = question.toLowerCase()
  const words: string[] = q.match(/[a-z]+/g) ?? []
  return q.includes('machine learning') || ALLOWED_TOPICS.some(t => words.includes(t)) || NATIVE_TOPICS.some(t => q.includes(t))
}

// The coach must never emit these, a final safety pass strips/flags them.
export const COACH_FORBIDDEN = [
  'guaranteed profit', 'risk-free', 'never lose', 'invest all', 'all your money',
  'खतरा नहीं', 'निश्चित मुनाफा', 'गारंटीड मुनाफा', 'ప్రమాదం లేదు', 'ఖచ్చితమైన లాభం', 'స్టాప్ లాస్ అవసరం లేదు',
  'remove stop loss', 'no stop loss needed', 'use leverage', 'double your money',
]

export function violatesGuardrail(answer: string): boolean {
  const a = answer.toLowerCase()
  return COACH_FORBIDDEN.some((f) => a.includes(f))
}
