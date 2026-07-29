// Thin adapter stubs. The app is $0 and works with NO keys, these exist so real integrations can be
// wired later WITHOUT touching app logic. None make network calls in v1.
// ponytail: one factory instead of 18 identical stub files. Add a real client body per adapter only when
// someone actually connects that account.

export type AdapterKind = 'broker' | 'exchange' | 'llm' | 'local'

export interface Adapter {
  id: string
  kind: AdapterKind
  configured(): boolean
  // Market data (brokers/exchanges), returns null until wired.
  quote?(symbol: string): Promise<null>
  // LLM adapters, returns "not configured" until wired.
  complete?(prompt: string): Promise<string>
  note: string
}

function makeAdapter(id: string, kind: AdapterKind, note: string): Adapter {
  const configured = () => false // never configured in v1
  const base: Adapter = { id, kind, configured, note }
  if (kind === 'broker' || kind === 'exchange') {
    base.quote = async () => null // watch-only; no real orders ever
  }
  if (kind === 'llm' || kind === 'local') {
    base.complete = async () => 'LLM adapter not configured. The app runs fully on the built-in rule-based coach.'
  }
  return base
}

// Indian brokers (market data only, no order routing in v1; Real Mode is locked).
export const zerodhaAdapter = makeAdapter('zerodha', 'broker', 'Zerodha Kite, market data only, locked for orders.')
export const upstoxAdapter = makeAdapter('upstox', 'broker', 'Upstox, market data only, locked for orders.')
export const dhanAdapter = makeAdapter('dhan', 'broker', 'Dhan, market data only, locked for orders.')
export const angelOneAdapter = makeAdapter('angelone', 'broker', 'Angel One SmartAPI, market data only, locked for orders.')

// Crypto / data.
export const binanceAdapter = makeAdapter('binance', 'exchange', 'Binance public data, watch-only.')
export const coingeckoAdapter = makeAdapter('coingecko', 'exchange', 'CoinGecko, price data only.')

// Cloud LLMs (optional, never required).
export const openaiAdapter = makeAdapter('openai', 'llm', 'OpenAI, optional deep explanations.')
export const claudeAdapter = makeAdapter('claude', 'llm', 'Claude, optional deep explanations.')
export const geminiAdapter = makeAdapter('gemini', 'llm', 'Gemini, optional deep explanations.')
export const deepseekAdapter = makeAdapter('deepseek', 'llm', 'DeepSeek, optional deep explanations.')
export const qwenAdapter = makeAdapter('qwen', 'llm', 'Qwen hosted, optional deep explanations.')

// Local inference.
export const ollamaAdapter = makeAdapter('ollama', 'local', 'Local Ollama endpoint, optional desktop testing.')
export const localLlmAdapter = makeAdapter('local-llm', 'local', 'On-device GGUF model (e.g. Qwen3 1.7B, Gemma 3 1B), optional.')

// Open-source trading-bot reference adapters (concepts only, see docs/open-source-references).
export const freqtradeAdapter = makeAdapter('freqtrade', 'broker', 'Freqtrade, strategy/backtest concepts referenced, no code copied.')
export const hummingbotAdapter = makeAdapter('hummingbot', 'exchange', 'Hummingbot, market-making/arb concepts referenced.')
export const finrlAdapter = makeAdapter('finrl', 'llm', 'FinRL, RL/portfolio concepts referenced.')
export const tradingAgentsAdapter = makeAdapter('tradingagents', 'llm', 'TradingAgents, multi-agent analyst concepts referenced.')
export const tensortradeAdapter = makeAdapter('tensortrade', 'llm', 'TensorTrade, RL environment concepts referenced.')
export const vibeTradingAdapter = makeAdapter('vibe-trading', 'llm', 'Vibe-Trading, NL-to-strategy concept referenced.')

export const ALL_ADAPTERS: Adapter[] = [
  zerodhaAdapter, upstoxAdapter, dhanAdapter, angelOneAdapter,
  binanceAdapter, coingeckoAdapter,
  openaiAdapter, claudeAdapter, geminiAdapter, deepseekAdapter, qwenAdapter,
  ollamaAdapter, localLlmAdapter,
  freqtradeAdapter, hummingbotAdapter, finrlAdapter, tradingAgentsAdapter, tensortradeAdapter, vibeTradingAdapter,
]
