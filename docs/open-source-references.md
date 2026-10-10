# Sources and open-source use

## Software bundled

React (MIT), React Router (MIT), Zustand (MIT), Lucide (ISC), Tailwind CSS (MIT), Vite (MIT), TypeScript (Apache-2.0), Undici (MIT) and TradingView Lightweight Charts (Apache-2.0). Version pins and transitive dependencies are in package-lock.json. Charts retain TradingView's logo and include a visible attribution link. No GPL code was copied into the application.

## Research references, not bundled models

- [LEAN](https://github.com/QuantConnect/Lean), Apache-2.0: event-driven research/trading architecture.
- [Backtrader](https://github.com/mementum/backtrader), GPL-3.0: Python backtesting reference, not imported into this app.
- [FinRL](https://github.com/AI4Finance-Foundation/FinRL), MIT: RL environment and evaluation patterns. This app runs its own small tabular Q-learning demonstration, not FinRL.
- [Hummingbot](https://github.com/hummingbot/hummingbot): inventory and market-making reference; check current component licenses before copying or integrating.
- [FinBERT](https://huggingface.co/ProsusAI/finbert): finance-sentiment model reference. Its weights are not downloaded or run by this app.
- [scikit-learn time-series split](https://scikit-learn.org/stable/modules/cross_validation.html#time-series-split): chronological holdout guidance. The OLS demo is a small direct implementation.

Models are not represented as profitable, trained on live financial data, or proprietary institutional systems. Source-level references do not establish performance.

## Public learning and stock research

The curriculum is original explanatory copy in English, Telugu and Hindi, with links for further reading:

- [SEBI investor education](https://investor.sebi.gov.in/)
- [NSE announcements](https://www.nseindia.com/companies-listing/corporate-filings-announcements)
- [BSE announcements](https://www.bseindia.com/corporates/ann.html)
- [Zerodha Varsity](https://zerodha.com/varsity/)
- [CME education](https://www.cmegroup.com/education)
- [Options Industry Council](https://www.optionseducation.org/)
- [Investor.gov](https://www.investor.gov/introduction-investing)
- [Screener.in](https://www.screener.in/)
- [TradingView](https://www.tradingview.com/)
- [QuantConnect research](https://www.quantconnect.com/docs/v2/research-environment/)

Primary filings should be checked before trusting summaries, screeners or social posts. External sites can require subscriptions or restrict access; this app does not purchase or scrape paid content. Representative source URLs were checked on 2026-10-04: NSE, SEBI, Varsity, Screener, TradingView, CME, OIC, QuantConnect and FinRL responded; BSE blocked the cloud request with 403. That access check does not certify every article, site claim or community script.
