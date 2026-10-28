# Security and privacy review — local paper-trading checkpoint

Reviewed 2026-10-28 from source and automated checks on the isolated checkpoint branch. This is a bounded engineering review, not a certification, legal opinion, or complete OWASP assessment.

## Data-flow inventory

| Data | Storage / destination | Controls observed | Remaining issue |
|---|---|---|---|
| Main account, lesson progress, replay sessions and event history | Browser `localStorage` key `blackscythe-alpha` | Zustand persistence; migration strips legacy API keys and drops legacy open trades lacking session identity; v2 backup validates and excludes secrets | Browser storage is not encrypted and same-origin script execution can read or alter it. No account boundary or server-side access control exists. |
| Derivatives practice ledger | Browser `localStorage` key `alpha-derivatives` | Separate balance from main paper account; v2 backup schema validates symbol, balances, positions and option legs | Separate key still has same-origin access; no server synchronization or encryption. |
| Saved research checklist | Browser `localStorage` key `alpha-research-note` | Six bounded text areas; v2 backup validates field count and length | Retained until device/browser clearing or the Portfolio delete action. |
| Imported replay CSV | File selected in browser, validated by `src/lib/historical.ts`, then stored in local replay session | Row/size and OHLC checks; replay is labeled historical simulation | Complete hostile-file browser test has not been run in this checkpoint. |
| Quote requests | App server proxies a fixed Yahoo Finance symbol allowlist; crypto snapshots use CoinGecko directly | GET-only paths, allowlist, timeout, concurrency cap and short cache; responses identify unofficial/delayed feed limits | Provider requests expose selected symbols to those providers; licensing, market-hour and corporate-action coverage are not established. |
| Optional AI tutoring and debate | Browser sends the question and limited simulated account context to the user-configured endpoint | Explicit optional enable control, client-side question/response checks, timeout/fallback, keys excluded from persistence and backups | External endpoint receives prompt and included fake balance, daily P/L, trade count, pause state or mock setup. Local rate limiting is not a secure spending limit. Provider retention, privacy and charges depend on the selected service. |
| Broker API settings | In-memory fields only | No broker connector is implemented; settings screen says orders are locked | No authentication, broker authorization, consent, order or account integration exists. Do not represent these fields as a working connector. |

## Threat and control notes

- **Account boundaries / authorization:** There are no server accounts, shared workspaces or remote user records, so RBAC is not applicable to the current local-only app. Any future sync or brokerage work needs a separate account, authorization and reconciliation design.
- **Secrets:** `useStore` persistence strips API keys and the LLM key. New exports omit them; restore resets persisted credential values. Automated test verifies no synthetic key sentinel appears in a backup. Source scans should still run against the exact candidate before release.
- **Input / restore:** Backup parser caps UTF-8 size, checks required state fields, numeric ranges, duplicate trade/order IDs, replay candle validity, derivatives shape and note length. Tests cover malformed JSON, oversized input, corrupt derivatives, retry idempotence, v1 behavior, injected storage write/removal failures and rollback. Browser quota and multi-tab races were not simulated.
- **Restore/delete:** A preview precedes explicit replacement confirmation. V2 covers all three storage keys and preserves capped order events. V1 imports preserve device-only records absent from that old format. Delete is explicit and limited to the three app data keys. Failure paths retain prior values when storage permits rollback.
- **AI / prompt injection:** User input is filtered before optional model calls and outputs are checked before display; deterministic local tutor remains available after provider failure. These phrase/topic checks are not a formal prompt-injection defense and are not a substitute for human review. No models, API keys or paid calls were used in this review.
- **Retention / consent:** Local records remain until the user deletes them or browser data is cleared. Optional AI is off by default and the API key screen is an explicit enable-and-enter flow; no durable consent record exists. A configured endpoint may retain submitted content under its own terms.
- **Dependencies:** `npm audit` initially reported advisories in `source-map-js`, `undici` and Vite. Same-major patched versions were applied: `source-map-js` 1.2.2, `undici` 8.12.2 and Vite 8.3.3. The exact lockfile then reported zero audit findings and the test/build checks passed.

## Applicability and release gates

- No live brokerage, account funding, investment advice sale, medical function, purchase flow or billing is in this checkpoint.
- OWASP ASVS/MASVS mapping, WCAG 2.2 conformance, store-policy review, NIST AI RMF mapping, privacy-law scope, financial-sector/legal classification, user-age and geographic scope are **not reviewed**. No compliance or certification claim is made.
- Physical Android/iOS testing is not applicable to this PWA-only source and was not performed. Permission-denied, offline/reload, screen-reader, 200% text, reduced-motion and small/large device functional scenarios remain open.
- The existing passcode option is a cosmetic local gate, not authentication. No security setting was weakened in this checkpoint.
