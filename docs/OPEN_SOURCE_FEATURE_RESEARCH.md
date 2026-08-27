# Alpha open-source feature research

Date: 2026-08-27

BlackScythe Alpha stays a paper-trading/training product. Research was used to identify useful learning, review, privacy, and reliability patterns; no upstream source code or assets were copied.

## References

- Tradicted Journal — https://github.com/tradicted/tradicted-journal — MIT. Relevant ideas: offline-first journal, risk/reward tooling, rule adherence, expectancy, profit factor, drawdown and streak analytics.
- eJournal — https://github.com/earlisreal/eJournal — MIT. Relevant ideas: local-first private journal, performance dashboard, expectancy, profit factor, average win/loss and equity review.
- QSTrader — https://github.com/mhallsmoore/qstrader — MIT. Relevant ideas: separate simulation from execution and evaluate strategy/trade performance with explicit statistics.
- Open-Papertrade — https://github.com/Open-Papertrade/Open-Papertrade — used for paper-trading product research only. No source copied.

## Features adopted independently

1. Performance Quality dashboard
   - Uses only Alpha's own closed mock trades.
   - Adds win rate, expectancy per trade, profit factor, average win/loss and peak-to-trough drawdown.
   - Explicitly says the statistics are backward-looking practice metrics, not predictions.

2. Portable local backup/recovery
   - Versioned JSON, strict schema and collection bounds, 1 MiB ceiling.
   - Broker and AI credentials are excluded.
   - Restore is explicit and destructive, with confirmation and credentials cleared afterwards.

3. Local-first credential boundary
   - Optional broker and AI keys are session-memory only.
   - Legacy localStorage credentials are purged before hydration.

## Deliberately not adopted

- Real-money order execution: v1 intentionally keeps Real Mode locked.
- Automated copy trading or broker execution: conflicts with the training-only safety boundary.
- Cloud accounts/sync: unnecessary for the local-first v1 and would add authentication/privacy attack surface.
- Third-party strategy code: Alpha's deterministic mock engines remain independent rather than importing trading logic from research projects.
