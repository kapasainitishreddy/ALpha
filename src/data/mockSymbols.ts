import type { MockSymbol } from '@/types'

// Indian-market-first mock instruments. Prices are illustrative starting points for the simulator.
export const MOCK_SYMBOLS: MockSymbol[] = [
  { symbol: 'NIFTY50', name: 'Nifty 50 Index', assetClass: 'index', basePrice: 24500, tickVolatility: 0.004 },
  { symbol: 'BANKNIFTY', name: 'Bank Nifty Index', assetClass: 'index', basePrice: 52000, tickVolatility: 0.006 },
  { symbol: 'RELIANCE', name: 'Reliance Industries', assetClass: 'equity', basePrice: 2950, tickVolatility: 0.007 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', assetClass: 'equity', basePrice: 4200, tickVolatility: 0.006 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', assetClass: 'equity', basePrice: 1650, tickVolatility: 0.006 },
  { symbol: 'INFY', name: 'Infosys', assetClass: 'equity', basePrice: 1850, tickVolatility: 0.007 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', assetClass: 'equity', basePrice: 1230, tickVolatility: 0.007 },
  { symbol: 'SBIN', name: 'State Bank of India', assetClass: 'equity', basePrice: 820, tickVolatility: 0.009 },
  // Tata Motors demerged in 2025; the old TATAMOTORS listing is gone. TMPV is the passenger-vehicle successor.
  { symbol: 'TMPV', name: 'Tata Motors Passenger Vehicles', assetClass: 'equity', basePrice: 335, tickVolatility: 0.011 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises', assetClass: 'equity', basePrice: 3100, tickVolatility: 0.014 },
  { symbol: 'BTCUSDT', name: 'Bitcoin / USDT', assetClass: 'crypto', basePrice: 68000, tickVolatility: 0.012 },
  { symbol: 'ETHUSDT', name: 'Ethereum / USDT', assetClass: 'crypto', basePrice: 3400, tickVolatility: 0.015 },
  { symbol: 'SOLUSDT', name: 'Solana / USDT', assetClass: 'crypto', basePrice: 165, tickVolatility: 0.02 },
]

export function getSymbol(sym: string): MockSymbol {
  return MOCK_SYMBOLS.find((s) => s.symbol === sym) ?? MOCK_SYMBOLS[0]
}
