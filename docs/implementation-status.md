# Implementation status — 2026-10-04

Baseline: `a056aaaf5caa39a5a11abe7aa816590cea5f7dfa`, local branch `work`. No push or deployment.

## Implemented in source

| Area | Evidence |
|---|---|
| Risk invariants and reserved capital | `src/engines/riskGuardEngine.ts`, `src/engines/paperExecution.ts` |
| Persisted scoped positions and pending market/limit/stop orders | `src/hooks/useSession.ts`, `src/store/useStore.ts`, `src/pages/ManualTrade.tsx` |
| Gap exits, conservative bar ordering and terminal settlement | `src/engines/paperExecution.ts`, `src/hooks/useSession.ts`, `src/pages/Replay.tsx` |
| Father daily pause, automatic day rollover, challenge lifecycle/cap | `src/store/useStore.ts`, `src/pages/FatherMode.tsx`, `src/pages/Challenge.tsx` |
| Single account for Auto/Swarm and idempotent journals | `src/pages/AutoTrade.tsx`, `src/engines/strategySwarmEngine.ts`, `src/lib/finish.ts` |
| Saved strategies in assisted/backtest/swarm, repaired breakout rules | `src/engines/strategyEngine.ts`, `src/engines/assistedEngine.ts`, `src/lib/customStrategy.ts` |
| Shared custom scenario generator including news shocks | `src/engines/mockMarketEngine.ts`, `src/pages/ScenarioLab.tsx` |
| Daily setup identity and result locking | `src/lib/dailySetup.ts`, `src/pages/Arena.tsx`, `src/pages/ManualTrade.tsx` |
| Fees corrected and affordable sizing in backtests/quick tests | `src/engines/backtestEngine.ts`, `src/pages/StrategyBuilder.tsx` |
| Quote/history API source, proxy support, timeout/cache/whitelist | `server/market-api.mjs`, `server/start.mjs`, `netlify/functions/market.mjs` |
| Per-instrument quotes and age checks | `src/pages/LivePractice.tsx`, `src/pages/Watchlist.tsx` |
| CSV validation and chronological historical replay | `src/lib/historical.ts`, `src/pages/Replay.tsx` |
| Portfolio and credential-free backup | `src/pages/Portfolio.tsx`, `src/lib/backup.ts` |
| 24 multilingual lessons, quizzes, voice and localized onboarding | `src/data/curriculum.ts`, `src/pages/Learn.tsx`, `src/components/Onboarding.tsx`, `src/lib/i18n.ts` |
| Offline multilingual tutor and optional model timeout/context | `src/engines/aiCoachEngine.ts`, `src/engines/llmCoach.ts`, `src/adapters/llm.ts` |
| Distinct synthetic quantitative and learned-policy experiments | `src/lib/modelExperiments.ts`, `src/pages/Models.tsx` |
| Futures, option structures, Greeks, variation margin and expiry | `src/lib/derivatives.ts`, `src/pages/Derivatives.tsx` |
| Research sources, checklist and original dataset expansion | `src/pages/Research.tsx`, `src/data/researchSources.ts`, `src/engines/fineTuneDatasetBuilder.ts` |
| Reproducible install, TypeScript build, lazy pages, chart interaction, PWA | `package-lock.json`, `package.json`, `.github/workflows/check.yml`, `src/App.tsx`, `src/components/CandleChart.tsx`, `public/sw.js` |

## Verified observations

- Clean `npm ci` succeeds; the previous incomplete lockfile is repaired.
- `npm run build` runs strict TypeScript checking and produces production assets.
- `npm audit` reports zero known vulnerabilities at the time checked. This is not proof of absence of all security issues.
- Chromium rendered the new learning, manual, model, derivatives, research, portfolio and replay pages at 390×844. English/Telugu/Hindi learning views were captured; no page errors were observed. Screenshots were inspected for readable content, chart rendering, controls, translation, spacing and navigation. This was limited rendering review, not exhaustive functional testing.
- Local `/api/quote?symbols=INFY.NS` returned 200 with one quote; `/api/history?symbol=INFY.NS` returned 200 with 129 daily bars; unsupported instruments returned 400. The initial managed-proxy failure was repaired. These observations do not establish production feed availability or data licensing.
- `git diff --check` is clean. No automated test suite was run or added for this implementation request.

## Explicit limits and remaining release validation

This is a substantial paper-trading implementation, not every conceivable trading feature. Full order, migration, multi-tab, restore, edge-case, accessibility and mobile-device regression testing remains necessary before release. The existing suite was not re-run, so its compatibility with the changes is unverified.

There is no broker execution, real-income mechanism, server account sync/authentication, billing, shared leaderboard, licensed tick/order-book feed, native APK/IPA, multi-exchange real execution, live professional news/sentiment model or trained institutional/RL model. The optional LoRA script was added but neither training nor conversion was executed. The implemented Q-learning and OLS are small synthetic holdout experiments. Advanced model assumptions and some older screen text remain English; the 24-lesson curriculum and curated lesson responses are localized.

Derivatives use a separate local account with illustrative contract rules. That book and the research note are not included in the main backup. Market holidays, physical delivery, early exercise, taxes, market impact, borrow costs and accurate exchange margin models are not implemented. Any live quote is potentially delayed. PWA offline support covers previously loaded routes, not data/model calls. Local screen gating is not security authentication.

These limits are shown in the app or README rather than disguised as implemented production capabilities.
