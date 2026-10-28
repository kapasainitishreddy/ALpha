# Education content review — 2026-10-28

This review covers the 24 records in `src/data/curriculum.ts`, all English/Telugu/Hindi title, body, quiz, answer and source fields, plus the example shown by `Learn.tsx`. Numeric worked examples are invented; they are not market observations or recommendations. Localized examples were source-checked and compared against the English meaning, not certified by native speakers.

## Lesson inventory and source scope

| Lesson | Main point checked | Reference |
| --- | --- | --- |
| ownership | A share represents ownership; dividends are not certain | [Investor.gov — Stocks](https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks) |
| orders | Market, limit and stop order behavior; execution price is not guaranteed | [Investor.gov — Types of Orders](https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders) |
| risk | Size from a loss budget and stop distance; stop orders can gap | [CME — Trade and Risk Management](https://www.cmegroup.com/education/courses/trade-and-risk-management.html) |
| expectancy | Win rate alone omits average win, loss and costs | [CME — Trade and Risk Management](https://www.cmegroup.com/education/courses/trade-and-risk-management.html) |
| candles | OHLC is a bar summary; it does not encode intrabar order | [Zerodha Varsity — Technical Analysis](https://zerodha.com/varsity/module/technical-analysis/) |
| trend | Moving averages and crossovers are rules, not proof of predictive edge | [Zerodha Varsity — Technical Analysis](https://zerodha.com/varsity/module/technical-analysis/) |
| rsi | An oversold reading does not guarantee reversal | [Zerodha Varsity — Technical Analysis](https://zerodha.com/varsity/module/technical-analysis/) |
| breakouts | Compare against prior bars; VWAP depends on its session window | [Zerodha Varsity — Technical Analysis](https://zerodha.com/varsity/module/technical-analysis/) |
| fundamentals | Ratios need context and filings; a low P/E is not a buy signal | [NSE — Corporate Filings](https://www.nseindia.com/companies-listing/corporate-filings-announcements) |
| portfolio | Asset allocation and concentration involve related exposure risks | [Investor.gov — Asset Allocation](https://www.investor.gov/introduction-investing/investing-basics/asset-allocation) |
| shorts | Short positions can have unbounded theoretical losses | [Investor.gov — Short Sales](https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks/short-sales) |
| futures | Contract multipliers, margin and settlement are contract-specific | [NSE — Equity Derivatives Contract Specifications](https://www.nseindia.com/static/products-services/equity-derivatives-contract-specifications); [CME — Mark to Market](https://www.cmegroup.com/education/courses/introduction-to-futures/mark-to-market) |
| options | Greeks are theoretical sensitivities, not exact premium changes | [Options Industry Council — Understanding Options Greeks](https://www.optionseducation.org/advancedconcepts/understanding-options-greeks) |
| spreads | Expiry payoff is not the full pre-expiry or assignment picture | [Options Industry Council — Strategies](https://www.optionseducation.org/strategies/all-strategies) |
| backtesting | Historical parameter search can overfit and future information is unavailable | [Carr & López de Prado — Determining Optimal Trading Rules without Backtesting](https://arxiv.org/abs/1408.1159) |
| pairs | Correlation does not establish cointegration or stable reversion | [Engle & Granger (1987), DOI 10.2307/1913236](https://doi.org/10.2307/1913236) |
| microstructure | Queue priority and inventory affect actual execution; candle simulation omits them | [SEC — Remarks on a Consolidated Limit Order Book](https://www.sec.gov/newsroom/speeches-statements/spch092804cag-remarks-council-institutional-investors) (illustrative US market-structure discussion from 2004, not a statement of current Indian venue rules) |
| arbitrage | Both legs, fees and execution risk matter | [Hummingbot — Strategies](https://hummingbot.org/strategies/) (describes its implementation; app semantics are checked against `src/lib/modelExperiments.ts`) |
| ml | Time-series evaluation must preserve chronological order | [scikit-learn — TimeSeriesSplit](https://scikit-learn.org/stable/modules/cross_validation.html#time-series-split) |
| rl | A reward function and simulator define what a policy learns | [FinRL — project documentation](https://github.com/AI4Finance-Foundation/FinRL); this app's small Q-learning path is separately checked in `src/lib/modelExperiments.ts` |
| sentiment | Generated-text systems have reliability risks; app demo is a keyword rule | [NIST — Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence) |
| research | Primary filings follow a screener result | [NSE — Corporate Filings](https://www.nseindia.com/companies-listing/corporate-filings-announcements) |
| psychology | Recovery math after drawdowns is asymmetric | [Investor.gov — Introduction to Investing](https://www.investor.gov/introduction-investing) |
| reality | Simulated fills and returns do not establish live execution or income | [Investor.gov — Introduction to Investing](https://www.investor.gov/introduction-investing) |

References support general education, not jurisdiction-specific advice. NSE/CME/OIC contract terms are not interchangeable. The app's option and derivatives examples use simplified synthetic inputs. In the derivatives lab specifically, futures P/L uses units × price change with multiplier 1, charges 0.03% fees plus 0.05% friction on each gross leg, and uses a simplified fixed collateral rule; it does not reproduce an exchange contract, real margin, delivery or settlement. Live quote snapshots, where present elsewhere in the app, are distinct from simulated execution. The NIST reference supports general generative-AI risk management; the claim about the app's keyword demo is verified from its code, not inferred from NIST.

## Applied examples and app-link checks

Each lesson now displays one worked synthetic example in all three locales. A wrong quiz answer exposes that localized example as corrective feedback. `src/data/curriculum.test.ts` checks all 24 lesson IDs, required localized fields, source URLs, answer-index reachability after option rotation, exact lesson-to-destination mappings, supported model experiment IDs, and replay context. Replay lesson `candles` carries `?lesson=candles`; the replay view presents the lesson and offers deterministic local bars (seed 42) without fetching external history. `/models` lesson destinations select the intended allocation, pairs, grid, arbitrage, regression or Q-learning experiment. The `spreads` lesson opens the multi-leg derivatives lab; `backtesting` opens the dedicated backtest screen.

The Options screen now says theta estimates time sensitivity and is not constant; other model inputs can offset or outweigh it. This avoids presenting an isolated Greek as a guaranteed daily loss.

## Translation and review limits

Automated checks establish that each lesson has non-empty English, Telugu and Hindi fields and mapped answer choices. The examples were source-reviewed and meaning-compared; spelling, idiom, reading level, pronunciation, screen-reader output and cultural suitability have not received native-speaker certification. The lesson batch is content-reviewed by an independent code/content reviewer, but it remains an educational prototype rather than a complete finance curriculum.
