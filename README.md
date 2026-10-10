# BlackScythe Alpha

A local-first paper trading and multilingual learning app. **All profits are virtual and cannot be withdrawn. There is no broker execution or promise of earnings.**

## Run

Node **22.19+** (Node 24 recommended).

```sh
npm ci
npm run dev -- --host 0.0.0.0
```

The Vite server includes the repository-owned quote/history API. No broker or market-data key is required. In a managed workspace with a restricted home directory:

```sh
npm_config_cache=/tmp/alpha-npm-cache npm ci
```

Production preview, including the API:

```sh
npm run build
npm start
```

Open `http://localhost:4173`. `PORT` can override 4173. A static `dist/` host alone does **not** supply the API: use the Node server or the included Netlify function/config. Nothing has been deployed by this change.

## Start learning

- `/learn`: 24 lessons in English, Telugu and Hindi, quizzes, read aloud and practice links. Language also controls onboarding, navigation, common order controls and curated tutor responses. Some older advanced explanations, model experiment details and source documents remain English.
- `/manual`: deterministic scenarios, market/limit/stop-entry orders, long/short paper positions, risk limits and journals. Crypto supports fractional quantities; equity and synthetic index units are whole quantities. A new session requires closing that session's positions and pending orders.
- `/live`: Yahoo Finance equity/index quotes and CoinGecko INR crypto snapshots. Source time and freshness checks are shown. Polling cannot reproduce tick execution or order-book depth.
- `/replay`: chronological daily history or CSV import, with persistent resume and paper orders. CSV header: `time,open,high,low,close,volume`; time is Unix seconds or an ISO date. Use 25–5,000 ascending rows and positive consistent OHLC values.
- `/portfolio`: shared paper ledger, reserved capital, position resume links and credential-free backup/restore.
- `/derivatives`: a **separate** ₹50,000 lab for futures, long options, debit spreads, straddles and bounded iron condors. Modelled marks, Greeks, daily futures variation margin, expiry and maintenance liquidation. Lot/margin assumptions are educational, not current exchange specifications.
- `/models`: distinct pairs, inventory-grid, market-making, two-venue arbitrage, inverse-volatility, OLS and tabular Q-learning experiments. Synthetic inputs, explicit assumptions, fees and held-out evaluation for learned policies. These do not change the paper account or represent institutional models. The headline demo uses keywords, not FinBERT.
- `/research`: public source directory and a saved thesis checklist. Screeners and community posts are starting points; verify original filings. There is no secret website that identifies certain winners.

Existing risk tools, challenges, strategy/scenario builders, Auto/Swarm, progress, debate, journal, insights, options calculator and comparison screens remain available through More.

## Execution and risk assumptions

The common account reserves full entry notional plus fees for longs and shorts, and reserves pending orders until fill/cancellation. It does not offer real leverage. Default market friction is 0.03% fee per side and 0.05% adverse slippage; actual brokerage, taxes, liquidity and funding differ.

Orders are checked for finite positive values, stop/target direction, individual and aggregate exposure, Father limits, challenge risk including estimated costs, daily limits and explicit pauses. Calendar-day limits roll automatically and use day-start capital. Pausing cancels pending orders but existing exits remain active.

A bar hitting both stop and target chooses the stop. Stop gaps fill at the open/observed quote rather than at a price unavailable in the gap. A pending fill within a bar cannot take a same-bar target unless executable at the open. Pending fills are rechecked against current account risk and cancellations appear in the order log. Terminal mock/replay bars liquidate positions and cancel remaining orders.

Auto and Swarm update the shared account as trades execute. Journal saving is idempotent and cannot credit a closed trade twice. Backtests and model experiments are research results, not account deposits. Fixed compounding is arithmetic, not a forecast.

## Data and privacy

Yahoo's chart endpoint is an **unofficial third-party source**, may be delayed or unavailable, and is not a licensed tick feed. CoinGecko can rate-limit requests. The server accepts only whitelisted instruments, has bounded upstream concurrency, fixed upstream URLs, timeouts and short caching, and respects managed HTTP/HTTPS proxies. Market hours are a weekday/time approximation without a holiday calendar; stale quotes prevent live practice orders. CSV and generated markets remain available when a provider fails. Historical corporate actions and survivorship bias are not corrected by this app.

Data is stored on this device, without server accounts, cloud sync or a public leaderboard. Main-account backups exclude credentials. Derivatives and research notes have separate local storage and are not part of the main-account backup. Export main account data before clearing browser storage. The v2 migration preserves closed history but discards legacy open trades because the previous version did not retain their market/session identity. It does not invent closes or P/L for those positions.

API keys stay in memory and are cleared on reload. Optional LLM requests go to the endpoint the user configures, may incur provider charges, time out after 20 seconds and fall back to curated tutoring. The client limiter and phrase/topic checks are convenience controls, not secure quota enforcement or a comprehensive safety system. The optional Vite passcode is a cosmetic local gate, not authentication.

The offline shell caches only same-origin app assets/pages, never quotes or AI responses. Routes must have been visited once to be available offline. Speech availability depends on device voices. PWA installation is not a native Android/iOS package.

## Checks and references

```sh
npm run typecheck
npm run build
npm audit
```

The existing test command remains `npm test`; no new test suite was added or executed for this implementation request. CI installs from the repaired lockfile and builds with TypeScript checks. Build/dependency verification and limited browser rendering observations are recorded in [implementation notes](docs/implementation-status.md). These are not a full functional regression sign-off.

[Open-source and education references](docs/open-source-references.md) · [Optional tutor training](docs/finetune/README.md) · [Real-mode prerequisites](docs/future-real-mode-compliance.md)

[Bundled third-party license notices](public/third-party-notices.txt)
