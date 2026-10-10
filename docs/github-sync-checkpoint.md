# Original cloud source recovery checkpoint

This recovery preserves the actual saved source from `/workspace/ALpha`, originally uncommitted on `work` at baseline `a056aaaf5caa39a5a11abe7aa816590cea5f7dfa`. No application source was reconstructed or changed during synchronization. The original implementation checkpoint is archived verbatim in `original-implementation-checkpoint.md`; its no-push statements describe the earlier checkpoint.

The source includes `src/engines/paperExecution.ts`, scoped account/session state, new lesson/model/derivatives/replay/portfolio/research pages, `server/market-api.mjs`, `server/start.mjs`, and `netlify/functions/market.mjs`. These are actual source files, not recovered compiled assets. `dist` and `node_modules` remain excluded.

Remote comparison found main at the baseline and `codex/alpha-release-hardening-20260827` at `53f4051a87b094403e8ed68475cc5fa39ea1339b`, with 40 commits beyond that baseline. That branch contains independent security and release work; it is preserved without merge, overwrite, or force push. This recovery branch does not incorporate those changes. Consolidation requires separate review.

## Current verification

- `npm run build`: passes TypeScript and production build; dependency module-directive warnings remain.
- `npm test`: 14 files, 91 tests pass. These existing tests do not establish comprehensive coverage of the new implementation.
- Node syntax checks: market API, Node server and Netlify market function pass.
- `git diff --check`: passes.
- Dependency audit: one high-severity advisory in `source-map-js` (GHSA-68fv-2mgg-jv7q, affected versions below 1.2.2). Earlier zero-vulnerability claims in historical checkpoints reflect their check time, not current status. Dependency upgrades are outside this source-preservation synchronization.
- Pattern-based outgoing secret scan: 151 staged files checked; no matches for private keys, common provider/GitHub/AWS/Slack tokens, JWT literals, credential URLs or long literal credential assignments. No excluded build/dependency/environment files are staged. This is not proof of absence of every possible secret.
- Preservation hashes: all 149 original repository files are staged byte-for-byte unchanged; only two archival/synchronization documents were added.

This synchronization is not a release or deployment. Full functional regression, data licensing/availability, migration and device testing, and the implementation limitations in `implementation-status.md` remain release gates.
