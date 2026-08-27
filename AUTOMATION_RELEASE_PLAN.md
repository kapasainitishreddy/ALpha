# BlackScythe Alpha release plan

Status: EXTERNAL-BLOCKED / FROZEN
Evidence score: 83/100
Date: 2026-08-27

## Canonical scope

Repository: `kapasainitishreddy/ALpha`

Alpha is a local-first mock/paper-trading trainer for Indian markets. Real-money execution is intentionally locked and is not a v1 requirement. The confirmed v1 includes onboarding, manual/assisted/auto/swarm mock practice, risk tools, strategy/backtest/scenario labs, live-price paper practice, journal/progress/insights, optional BYOK AI coaching, and local practice data.

## Evidence rubric

- Core journeys: 28/30
- Bugs/reliability: 19/20
- Persistence/recovery/data integrity: 9/10
- Loading/error/offline: 7/10
- Accessibility/responsive/performance: 7/10
- Security/privacy/permissions/entitlements: 9/10
- Release verification: 4/10
- Total: 83/100

No 95+ claim is allowed until the mandatory exact-head and deployed/runtime gates below actually pass.

## Release-critical work completed in this branch

- Removed broker/market-data and AI API credentials from Zustand persistence; old persisted credentials are purged before hydration and never rehydrated.
- Added session-only key copy in API/AI settings.
- Added secure BYOK endpoint policy: remote HTTPS only, loopback-only plain HTTP, no URL credentials/query/fragment, redirect denial, 15 s timeout, 64 KiB response ceiling and malformed-response failure.
- Added prompt-injection/secret-exfiltration input guard, bounded AI input, explicit untrusted-data separation and no-tool/no-secret system rules.
- Added strict versioned JSON backup/restore with 1 MiB ceiling, bounded schema validation, destructive confirmation and credential exclusion.
- Added local paper-trading Performance Quality metrics: expectancy, profit factor, average win/loss, win rate and max drawdown.
- Added version-controlled Netlify `/api/quote` function with exact Indian-ticker allowlist, request/cardinality bounds, upstream timeout/response ceiling, response field allowlist, no arbitrary URL fetch, CDN caching and security headers.
- Added reproducible Netlify build/function redirects and static HSTS/CSP/frame/referrer/permissions/COOP/CORP headers.
- Added high-confidence committed-secret scanner and exact-head CI using `npm ci`, tests, quote regressions, typecheck, Vite build and production dependency audit.

## Executed verification

The following checks were actually run in a dependency-free local harness against GitHub-hash-matched current helper/source blobs:

- credential + AI endpoint policy smoke: PASS
  - credential helper blob `31c6ee489419ec5b6c5c9051423610a1ae727404`
  - endpoint policy blob `7484d76e1117e9cacb1d0c3834a619517ee56021`
  - covered persistent-secret scrubbing, legacy cleanup, HTTPS/loopback policy and hostile URL rejection.
- performance metrics smoke: PASS
  - blob `4d5bad97eb437ee251687ed2234472d88009a3fa`
  - covered expectancy, profit factor, win rate, drawdown and open-trade exclusion.
- portable backup smoke: PASS
  - blob `7de6c57667ebdc9ecd25f4f6f0f46553b2e3665d`
  - covered secret exclusion, valid roundtrip, malformed/wrong-format rejection and 1 MiB rejection.
- AI input abuse smoke: PASS
  - blob `2a4b4d119f2bfda7889d361a03e73080ab76ccc6`
  - covered normal input, prompt injection, secret exfiltration, oversize and control-character normalization.
- LLM transport smoke: PASS
  - endpoint policy blob `7484d76e1117e9cacb1d0c3834a619517ee56021`
  - adapter blob `22e8909a2fb4c442e71e868289fa728de4873a4f`
  - covered HTTPS target construction, Authorization transport, redirect denial and declared/actual response ceilings.
- quote policy exact Node regression: 4/4 PASS
  - policy blob `ac191553e934e4f638afc6096e99360f8d057a90`
  - covered exact allowlist, duplicate normalization, unsupported/URL input rejection, query/cardinality bounds and upstream-meta normalization.
- quote handler exact Node regression (before later header-only HSTS change): 3/3 PASS
  - handler tested at blob `c01bacb89b2745debd8ad69f7905d3706868fd44`; current handler differs only by adding the HSTS response header.
  - covered GET-only behavior, upstream redirect denial, output field allowlist and oversize-upstream fail closed.

Direct exact-branch clone was attempted but the execution environment could not resolve `github.com`; therefore a complete installed-repository verification is not claimed.

## Current deployment evidence

Netlify project `blackscythe-alpha` exists and its currently published production deploy is `6a5ce179f4321eb69119bcc6`, published 2026-07-19. It contains one `quote` function but reports no custom header rules. That deploy predates this release-hardening branch, is not commit-linked, and does not count as verification of the current candidate.

## Security launch gate

- HSTS/static browser headers: PASS committed config / BLOCKED deployed observation.
- Cookies/session/password/reset/MFA/CSRF: N/A — no first-party account or cookie-authenticated mutation surface in v1.
- Live quote API: PASS targeted/source for GET-only allowlist, bounded inputs, upstream timeout/body limits, output allowlist, CDN caching and no arbitrary fetch / BLOCKED current deployment verification.
- Database/tenant isolation/service permissions: N/A — no app-owned database or account backend in v1.
- Uploads: N/A — no user upload surface in confirmed v1. Backup restore is bounded local JSON and is covered separately.
- Backup/import abuse: PASS targeted for format/version/schema/size limits and credential exclusion / BLOCKED real browser file-picker roundtrip.
- AI quota/budget: PASS best-effort client quota for optional user-owned BYOK key; app-owned provider budget N/A because Alpha owns no model account. Provider-side quota is external.
- AI prompt injection / secret exfiltration / tool abuse: PASS targeted/source for pre-provider hostile-input checks, untrusted-data separation, no secret persistence/prompting, no tool surface and redirect denial / BLOCKED live-provider adversarial runtime.
- Payments/webhooks/entitlements: N/A — no payments.
- Secret scan: scanner committed / full exact-repository execution BLOCKED.
- Dependency audit: BLOCKED exact-head runner/install.

## User-flow status

Implemented/source-audited: onboarding, manual mock trading, assisted/auto/swarm simulation, risk guard/tools, backtest/strategy/scenario labs, journal, progress/challenges, insights, live-price paper practice with explicit feed error state, AI coach fallback, Real Mode lock, backup/export/restore, performance-quality review.

Targeted PASS: credential persistence boundary, backup validation, AI endpoint/input safety, deterministic performance metrics, quote request/upstream boundary.

BLOCKED / NOT RUN on exact candidate: full browser onboarding→practice→close→journal→reload→backup→reset→restore; real CoinGecko and Netlify quote feed; deployed quote abuse tests; responsive/keyboard/screen-reader/zoom/performance; provider-backed AI fallback/abuse; production headers; full dependency install/test/typecheck/build/audit/secret scan.

## Remaining checklist

1. Healthy exact-head runner: `npm ci`, `npm run verify`, `node scripts/secret-scan.mjs`, `npm audit --omit=dev --audit-level=high`.
2. Resolve any resulting type/build/test findings without weakening the gates.
3. Deploy the exact candidate to Netlify; verify `_headers`, `/api/quote`, invalid/unsupported symbols, method rejection, upstream failure, caching and HSTS.
4. Browser journey: fresh install, mock trade close/journal, reload persistence, export, destructive reset, restore, legacy-key purge.
5. Live CoinGecko/NSE quote error/recovery testing.
6. AI-provider adversarial smoke using a disposable/restricted BYOK key; verify prompt injection, secret requests, redirects, timeout/fallback and quota behavior.
7. Keyboard, screen-reader, zoom/mobile responsive and sustained-use performance checks.

Because these remaining gates require a working dependency runner, live deployment/browser, and optional provider credentials rather than unfinished v1 product logic, Alpha is frozen as EXTERNAL-BLOCKED rather than promoted above 94.
