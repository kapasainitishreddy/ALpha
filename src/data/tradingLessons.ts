export interface Lesson {
  id: string
  title: string
  keywords: string[]
  beginner: string
  father: string
}

export const TRADING_LESSONS: Lesson[] = [
  { id: 'stop-loss', title: 'Stop loss', keywords: ['stop', 'stoploss', 'stop loss', 'sl', 'loss limit'],
    beginner: 'A stop loss is a price where you exit a losing trade automatically to cap the loss. Set it before you enter.',
    father: 'Stop loss ante loss ni limit cheyyadam. Price wrong side ki velthe app exit chesthundi. First capital protect cheyyali, profit tarvatha.' },
  { id: 'position-size', title: 'Position size', keywords: ['size', 'quantity', 'qty', 'how much', 'position'],
    beginner: 'Position size is how much you put into one trade. Risk only a small fraction so one loss cannot hurt badly.',
    father: 'Oke trade lo entha pettali? Chinna amount. One loss tho capital pోkుండా.' },
  { id: 'risk-reward', title: 'Risk / reward', keywords: ['risk reward', 'risk/reward', 'rr', 'reward'],
    beginner: 'Risk/reward compares how much you can lose vs gain. Aim for reward at least 1.2x the risk.',
    father: 'Risk konchem, reward ekkuva unte manchi trade. Reward risk kanna 1.2x undali.' },
  { id: 'overtrading', title: 'Overtrading', keywords: ['overtrade', 'overtrading', 'too many trades', 'how many'],
    beginner: 'Overtrading means taking too many trades. More trades = more fees and more mistakes. Quality over quantity.',
    father: 'Ekkuva trades cheయyaku. Rendu-moodు manchi trades chalu. Overtrade = fees + tension.' },
  { id: 'swarm', title: 'Strategy Swarm', keywords: ['swarm', 'agents', 'allocation', 'divide capital', 'multi agent'],
    beginner: 'The Strategy Swarm splits mock capital across several strategy agents and keeps a cash reserve, so no single strategy holds everything.',
    father: 'Swarm ante capital ni different strategy agents ki divide chestham, konchem cash reserve unchutham. One agent fail ayina full capital safe.' },
  { id: 'backtest', title: 'Backtesting', keywords: ['backtest', 'test strategy', 'historical'],
    beginner: 'Backtesting runs a strategy over past/simulated data to see how it would have done. It does not guarantee future results.',
    father: 'Backtest ante strategy ni past data meedha test cheయyడం. Kani real result guarantee kaadu.' },
  { id: 'market-condition', title: 'Market condition', keywords: ['market', 'trend', 'sideways', 'volatile', 'condition'],
    beginner: 'Match strategy to market: trend strategies in trends, mean-reversion in ranges. Wrong strategy in wrong market loses.',
    father: 'Market trend lo unte trend strategy, range lo unte mean-reversion. Tappు strategy tappు market lo loss.' },
  { id: 'india-basics', title: 'Indian market basics', keywords: ['nifty', 'banknifty', 'nse', 'bse', 'india', 'sensex'],
    beginner: 'NIFTY 50 and BANK NIFTY are key Indian indices. Trading hours and events like RBI announcements move them.',
    father: 'NIFTY 50, BANK NIFTY India main indices. RBI news, results roju big moves.' },
  { id: 'api-keys', title: 'API key setup', keywords: ['api', 'key', 'broker', 'connect', 'upstox', 'zerodha', 'dhan'],
    beginner: 'API keys are optional. The app works fully in mock mode with no keys. If you add keys, they stay in your browser.',
    father: 'API keys avసరం ledు. App mock mode lo keys lేకుండా పని chesthundi.' },
]
