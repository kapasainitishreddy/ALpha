# Competitor experiment: TradingView and Webull

Reviewed 2026-10-28 from public product listings and dated app-store reviews. These are external observations, not a usability study of BlackScythe Alpha. No proprietary screenshots, artwork or layouts were copied.

## Current product surfaces observed

| Product | Verified product focus | BlackScythe Alpha comparison |
|---|---|---|
| TradingView | The current Google Play listing (updated 2026-10-27) describes paper trading, broker-linked orders, watchlists and alerts, mobile technical charts, hundreds of indicators, community scripts, and Bar Replay. It also describes chart/watchlist/alert sync and paid feature tiers. [Google Play listing](https://play.google.com/store/apps/details?id=com.tradingview.tradingviewapp) | Alpha has deterministic local replay, orders and risk lessons, but not TradingView's chart breadth, scripts, social network, cross-device sync or licensed real-time data. No screen recording was available to verify whether Alpha's journey solves a specific TradingView complaint. |
| Webull | The current US App Store listing describes 60+ technical indicators, charting tools, paper trading, overnight trading, and paper-trading feature limitations compared with real scenarios. [App Store listing](https://apps.apple.com/us/app/webull-investing-trading/id1179213067) | Alpha's differentiator remains multilingual educational practice with explicit modeled-fill limitations and a separate virtual derivatives ledger. It does not offer Webull's broker, funding or overnight trading flow. A matched journey comparison was not recorded. |

## Dated firsthand review sample

| App | Date and platform | Sentiment | Reported context | Counterexample / limit |
|---|---|---|---|---|
| TradingView | 2026-09-20, Google Play, Ki Toni | Negative | Reports price lag relative to the reviewer's broker and indicators disappearing, with cost complaints. TradingView replied 2026-09-22 directing the reviewer to support. [Review and response](https://play.google.com/store/apps/details?id=com.tradingview.tradingviewapp) | This is one self-reported case, does not isolate paper fills from quote feeds, and does not establish prevalence. A 2023 Apple App Store reviewer praised chart types, custom timeframes and drawing tools. [Positive review](https://apps.apple.com/us/app/tradingview-track-all-markets/id1205990992) |
| Webull | 2021-01-15, Apple App Store, leigharchangel | Positive / mixed | Praises the interface, support by phone, charting and paper-trading competitions; also warns about community spam and advice. [Review](https://apps.apple.com/us/app/webull-investing-trading/id1179213067?see-all=reviews) | One review is old and largely covers the general brokerage app. A 2021-04-16 reviewer described Webull as difficult for a beginner and complained about options quotes and slow settlement; those points concern broader brokerage use, not a controlled paper-trading task. [Review](https://apps.apple.com/us/app/webull-investing-trading/id1179213067?see-all=reviews) |

The review sample is too small, old for Webull, and region-specific to validate a market-wide pain point. It does not justify a new feature. Keep the working hypothesis—clearly separating educational hypothetical fills from quote freshness and real-market execution—as **unverified by competitor reviews**. The product already labels third-party quote limitations, simplified market hours and hypothetical fills in its README; this source inspection is not proof of screen-level comprehension.

## Safe design implications

- Preserve Alpha's English, Telugu and Hindi learning paths and restrained, non-celebratory simulated outcomes.
- Keep quote age/source labels adjacent to use, and distinguish bar-based model fills from live order-book execution.
- Keep data and learning controls usable without optional AI or paid services.
- Do not infer that a complaint applies to Alpha without a screen recording and corresponding test.
