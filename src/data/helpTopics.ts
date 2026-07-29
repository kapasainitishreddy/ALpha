// Offline answer bank for the built-in assistant. No model, no API key, no network — just
// written answers matched by keyword. That is a deliberate trade: a small local bank that is
// always right about THIS app beats a chatbot that hallucinates and needs a paid key.

export interface HelpTopic {
  id: string
  question: string // canonical phrasing, shown as a suggested question
  keywords: string[]
  answer: string
  father?: string // Telugu-English rendering for Father Mode
  screens?: string[] // routes where this is offered as a suggestion
}

export const HELP_TOPICS: HelpTopic[] = [
  // --- The big one: is this real -------------------------------------------------
  {
    id: 'is-it-real',
    question: 'Can I buy real shares with this app?',
    keywords: ['real money', 'real share', 'actually buy', 'real trade', 'real trading', 'withdraw', 'is this real', 'buy real'],
    answer:
      'No. This app cannot buy or sell anything real. There is no broker connected and no order ever leaves your phone. It is a practice simulator.\n\nTo trade real shares in India you need an account with a SEBI-registered broker — Zerodha, Groww, Upstox, Angel One — which needs KYC with PAN and Aadhaar. That happens in their app, never here.\n\nThe prices in Live Practice and Watchlist are real. Your money is not.',
    father: 'Ledu. Ee app lo real shares konalemu. Broker connect ledu. Idi practice matrame. Real trading kosam Zerodha, Groww lanti broker account kavali.',
  },
  {
    id: 'how-trading-works',
    question: 'How does trading actually work?',
    keywords: ['how does trading', 'how trading works', 'what is trading', 'how to trade', 'trading work'],
    answer:
      'You buy a share hoping to sell it higher, or short-sell hoping to buy it back lower. The difference is your profit or loss.\n\nEvery trade has four numbers you should decide BEFORE you enter:\n1. Entry — the price you get in at\n2. Quantity — how many shares\n3. Stop loss — the price where you admit you were wrong and get out\n4. Target — the price where you take profit\n\nBeginners pick entry and quantity, then guess the rest. Professionals decide the stop first, and let it decide the quantity. That is what Risk Tools does for you.',
    father: 'Share konali, price penchi ammali. Difference profit. Kani ముందు 4 things decide cheyyali: entry, quantity, stop loss, target. Stop loss mundu decide cheyyi, adi quantity ni decide chestundi.',
  },
  {
    id: 'how-to-mock-trade',
    question: 'How do I place a mock trade?',
    keywords: ['mock trade', 'place a trade', 'how to trade here', 'place order', 'first trade', 'how do i trade', 'start trading'],
    answer:
      'Go to Manual Trade. You will see a candle chart with a Buy and Sell button.\n\n1. Pick a symbol and a market scenario\n2. Set quantity, stop loss % and target %\n3. Press Buy (betting price goes up) or Sell (betting it goes down)\n4. Press "Next candle" or "+5 candles" to move time forward\n5. Your trade closes automatically if price hits your stop or target — or press Exit to close it yourself\n6. Press "Save to journal" to get a review of what you did\n\nThe market does not move on its own. You advance it candle by candle, so you can think.',
    father: 'Manual Trade ki vellu. Symbol select cheyyi, quantity, stop loss, target pettu. Buy or Sell nokku. Taruvata "Next candle" nokkitе market munduku vellutundi. Stop loss or target tagilite trade automatic ga close autundi.',
    screens: ['/manual', '/'],
  },
  {
    id: 'swarm-explained',
    question: 'What is the Strategy Swarm doing?',
    keywords: ['swarm', 'agents', 'five strategies', '5 strategies', 'strategy swarm'],
    answer:
      'The Swarm runs five different trading strategies over the same market at the same time, each with a slice of your mock capital.\n\nIt is not trying to make money. It is showing you that five reasonable methods, given identical information, reach different conclusions — and that the "best" one changes with the market.\n\nEach strategy card tells you what it did, why it turned out that way, and whether that strategy suits this market type. If they all lost, that is a real result: some markets punish every approach, and the right answer was to sit out.',
    father: 'Swarm anedi 5 different strategies ni oke market meeda run chestundi. Prathi dhaniki konchem money istundi. Money sampadinchadam kadu — different methods different results istayi ani chupinchadam.',
    screens: ['/swarm'],
  },
  {
    id: 'swarm-no-trades',
    question: 'Why did the Swarm do nothing?',
    keywords: ['no trades', 'swarm nothing', 'did nothing', 'doing nothing', 'swarm not working', 'not doing anything', 'nobody traded', 'zero trades'],
    answer:
      'Two usual causes.\n\n1. Not enough capital. Each strategy only gets a slice of what you put in. If that slice cannot afford even one share, it cannot trade. Use ₹50,000 or more.\n\n2. Nothing triggered. A flat market like "Normal trend day" may never produce a setup some strategies need. Try "Real breakout" — it reliably triggers several.\n\nIf you see "blocked by Risk Guard", the strategies did want to trade but the order broke a safety rule, usually position size.',
    father: 'Rendu karanalu. Okati — capital takkuva. ₹50,000 pettu. Rendu — market lo signal raledu. "Real breakout" scenario try cheyyi.',
    screens: ['/swarm'],
  },
  {
    id: 'risk-guard',
    question: 'Why was my trade blocked?',
    keywords: ['order blocked', 'trade blocked', 'blocked', 'risk guard', 'rejected', 'not allowed', 'cannot place', 'why block'],
    answer:
      'The Risk Guard blocks any order that breaks a safety rule. The common ones:\n\n• No stop loss set\n• Position too big — over 40% of your balance in one trade (15% in Father Mode)\n• You already hit the daily loss limit\n• Too many losing trades in a row\n• Reward is smaller than the risk\n\nIt is not a bug. Every one of those rules exists because breaking it is how beginners lose accounts. Use Risk Tools to size the trade correctly first.',
    father: 'Risk Guard oka safety net. Stop loss lekapote, size peddaga unte, daily loss limit ayipote, or reward takkuva unte block chestundi. Idi meeku manchi cheyyadaniki.',
  },
  {
    id: 'position-size',
    question: 'How many shares should I buy?',
    keywords: ['how many shares', 'position size', 'quantity', 'how much to buy', 'sizing', 'lot size'],
    answer:
      'Never a round number you picked. Work it out:\n\nDecide what you are willing to lose on this trade — 1% of your capital is the professional standard. Then measure how far your stop loss is from your entry. Divide.\n\nExample: ₹10,000 capital, risking 1% = ₹100. Stop is ₹15 below entry. ₹100 ÷ ₹15 = 6 shares.\n\nThe stop distance decides the quantity. Not your confidence, not the price of the share. Risk Tools does this maths for you.',
    father: 'Round number pettaku. Ela lekkinchali: capital lo 1% risk cheyyi. Stop loss entry nunchi enta duram undo choodu. Bhaginchu. ₹10,000 lo 1% = ₹100. Stop ₹15 duram. ₹100 ÷ ₹15 = 6 shares.',
    screens: ['/risk', '/manual', '/live'],
  },
  {
    id: 'stop-loss',
    question: 'What is a stop loss and why do I need one?',
    keywords: ['stop loss', 'stoploss', 'what is sl', 'why stop'],
    answer:
      'A stop loss is a price where you have decided in advance to get out and accept you were wrong.\n\nWithout one, a small loss becomes a large one, because the hardest thing in trading is admitting a position has failed while you are still in it. The stop makes that decision for you when you are calm, instead of leaving it to you when you are not.\n\nA trade with no stop is not a trade, it is a hope. The Risk Guard will not let you place one here.',
    father: 'Stop loss ante — mundu ye price daggara bayataki vachestamo decide chesukovadam. Stop loss lekunda trade cheyyadam ante hope matrame. Chinna loss peddadi avutundi.',
  },
  {
    id: 'reward-risk',
    question: 'What is reward to risk?',
    keywords: ['reward risk', 'risk reward', 'r:r', 'rr ratio', 'ratio'],
    answer:
      'How much you stand to make compared to how much you stand to lose.\n\nRisk ₹10 to make ₹20 and that is 2:1. At 2:1 you can be wrong 6 times out of 10 and still make money.\n\nRisk ₹10 to make ₹5 and that is 0.5:1. Now you need to win 7 times out of 10 just to break even — and nobody wins 7 out of 10 consistently.\n\nThis is why professionals win under half their trades and still profit. The size of the wins does the work, not the frequency.',
    father: 'Enta risk chesi enta sampadistunnavo. ₹10 risk chesi ₹20 vaste 2:1. 2:1 unte 10 lo 6 sarlu tappu ayina profit vastundi. Win rate kanna reward:risk mukhyam.',
    screens: ['/risk'],
  },
  {
    id: 'candles',
    question: 'How do I read a candlestick chart?',
    keywords: ['candle', 'candlestick', 'chart', 'green red bar', 'how to read chart'],
    answer:
      'Each candle covers one time period and shows four prices.\n\nThe thick body spans the open and close. Green means it closed higher than it opened, red means lower. The thin lines above and below — wicks — show the highest and lowest price reached in that period.\n\nA long upper wick means buyers pushed up but sellers forced it back down. A long lower wick means the opposite. A body with almost no wicks means one side was in control the whole time.',
    father: 'Prathi candle oka time period. Motta bhagam open-close. Pacha ante penchindi, erra ante taggindi. Paina kinda unde sannati gerlu — aa time lo highest, lowest price.',
  },
  {
    id: 'live-data',
    question: 'Are the prices real or fake?',
    keywords: ['real price', 'live price', 'live data', 'fake price', 'real market', 'live feed', 'delayed'],
    answer:
      'Both, depending on the screen.\n\nReal: Watchlist and Live Practice show actual NSE prices for Indian stocks and live crypto prices. These can lag by a few minutes and only move while the market is open — NSE runs Monday to Friday, 9:15am to 3:30pm. Crypto moves 24/7.\n\nSimulated: Manual Trade, Swarm, Backtest and Market Simulator all use a generated market. That is deliberate — it lets you replay a crash or a breakout on demand instead of waiting for one.\n\nEither way, the money is always fake.',
    father: 'Rendu unnai. Watchlist and Live Practice lo real NSE prices. Manual Trade, Swarm lo computer generate chesina market. Money maatram eppudu fake.',
  },
  {
    id: 'father-mode',
    question: 'What is Father Mode?',
    keywords: ['father mode', 'beginner mode', 'simple mode', 'big buttons'],
    answer:
      'A simplified version of the whole app for absolute beginners.\n\nBigger buttons and text, tighter safety limits (max 15% of balance per trade instead of 40%, 3 trades a day instead of 8, stops you after 2 losses in a row), and explanations written in Telugu-English rather than trading jargon.\n\nIt is the same engine underneath — just harder to hurt yourself with.',
    father: 'Modati sari nerchukune vari kosam simple version. Pedda buttons, kathina safety limits, Telugu lo explanations. 15% kanna ekkuva oka trade lo pettalemu.',
  },
  {
    id: 'where-to-start',
    question: 'Where should I start?',
    keywords: ['where to start', 'how to begin', 'first time', 'getting started', 'new here', 'what do i do'],
    answer:
      'In this order:\n\n1. Risk Tools — learn how to size a trade. This one screen matters more than everything else.\n2. Manual Trade — place a few trades, let some stops hit, save to journal.\n3. Agent Debate — a few rounds. It teaches that a convincing argument is not the same as a correct one.\n4. Strategy Swarm — ₹50,000, "Real breakout". Watch five strategies disagree.\n5. Insights — after about 20 trades, this tells you what actually suits you.\n\nSkip Options entirely until the rest feels natural.',
    father: 'Ee order lo cheyyi: 1. Risk Tools 2. Manual Trade 3. Agent Debate 4. Strategy Swarm 5. Insights. Options ki mundu vellaku.',
    screens: ['/'],
  },
  {
    id: 'why-losing',
    question: 'Why do I keep losing?',
    keywords: ['keep losing', 'always lose', 'losing money', 'why lose', 'every trade loses', 'all losses'],
    answer:
      'The three usual causes, in order of how common they are:\n\n1. Stop too tight. Ordinary price wobble knocks you out before your idea has room to work. Widen the stop and buy fewer shares to keep the same rupee risk.\n\n2. Reward smaller than risk. If you aim for ₹10 while risking ₹20, the maths beats you even with good entries.\n\n3. Wrong strategy for the market. Mean reversion in a strong trend, breakout trading in a sideways market. Check the strategy card in Swarm — it tells you which suits which.\n\nAnd sometimes: the market was simply not tradeable that day. Sitting out is a position.',
    father: 'Moodu karanalu. Okati — stop loss chala daggara pettadam. Rendu — reward risk kanna takkuva. Moodu — market ki sariponi strategy. Kondhi rojullo trade cheyyakapovadame correct.',
  },
  {
    id: 'options',
    question: 'Should I trade options?',
    keywords: ['option', 'call put', 'f&o', 'fno', 'derivative', 'expiry'],
    answer:
      'Almost certainly not, and definitely not yet.\n\nSEBI\'s own studies have found the large majority of retail option traders lose money. Options add two ways to lose that shares do not have: the option expires worthless on a date, and its value decays every single day you hold it even if the price never moves against you.\n\nThe Option Chain screen here exists so you can see that decay happen. It is a warning, not a product. Learn position sizing on plain shares first.',
    father: 'Vaddu. SEBI research prakaram chala mandi retail option traders dabbulu pogottukuntaru. Options lo time decay untundi — rojuku value taggutundi. Mundu shares meeda nerchuko.',
    screens: ['/options'],
  },
  {
    id: 'journal',
    question: 'What is the journal for?',
    keywords: ['journal', 'review', 'session review', 'save session'],
    answer:
      'After a session, press "Save to journal". You get an automatic review: what went well, what mistakes showed up, and one lesson to carry forward.\n\nIt detects specific patterns — trading without a stop, oversizing, overtrading, chasing a move, using a strategy that fights the market.\n\nThe value is not any single review. It is that after ten sessions the same mistake keeps appearing, and that is far harder to argue with than a one-off loss.',
    father: 'Session tarvata "Save to journal" nokku. Automatic review vastundi — em bagundi, em tappu chesavu, repu em nerchukovali. Padi sessions tarvata oke tappu malli malli kanipistundi.',
    screens: ['/journal'],
  },
  {
    id: 'my-data',
    question: 'Where is my data stored?',
    keywords: ['data stored', 'privacy', 'account', 'login', 'sign up', 'my data', 'saved where'],
    answer:
      'On your device only, in the browser or app storage. There is no account, no login, and nothing is sent to a server.\n\nThat means your practice history stays private — and also that clearing app data or browser storage erases it permanently. There is no cloud backup to restore from.\n\nUse the Performance Report in Insights if you want a copy you can keep.',
    father: 'Mee phone lone save autundi. Account ledu, login ledu, server ki emi vellaledu. Kani app data clear cheste antha pothundi.',
  },
]
