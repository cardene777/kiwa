# kiwa v1.29 released — release script filter systematic root cause SSOT 化 (release-invariants v0.1 + hook + release-smoke axis + tutorial 55 + 7 milestone snippet streak)

v1.29 is out. After 4 milestones (v1.14 payment / v1.25 perf-harness / v1.27 quality-metrics / v1.28 realtime) rediscovered the exact same "package missing from either build filter or publish filter half" bug in `scripts.release`, v1.29 stacks **4 layer automation** (release-smoke test axis + PostToolUse hook + SSOT docs + new npm package) to close the release-gate final hole. Every layer is a stateless check — repository under audit can adopt any subset and gain fail-fast semantics.

## What shipped

- **`@kiwa-lab/release-invariants` v0.1.0** (3 pure invariant checker + 1-shot aggregator, brand-new package). Pure functions — no filesystem, no network, no kiwa-specific dependency. `checkReleaseScriptFilter` (per-package both-halves check), `checkProvenanceFlagAbsence` (v1.14 removed the flag; must not creep back), `checkGateScriptPackageCoverage` (`test:mutation` must cover every publishable), `buildReleaseInvariantsSummary` (1-shot summary with `ok: boolean` + 3 sub-results). 8 behavior test PASS. kiwa runtime fixture count 34 → **35**.
- **v1.29-1 release-smoke test axis** (Issue #986, PR #989). `tests/release-smoke/tests/release-script-filter.test.ts` (167 lines) with dynamic package discovery + 40 per-package `it.each` assertions. Walks `packages/*/package.json`, filters by `@kiwa-lab/*` scope + `private: false`, checks each publishable package appears in **both** halves. Fail-fast **before** the milestone finisher. Landed 6 previously-missing packages (agent / ai-llm / component / mcp / search / streaming) in the same PR.
- **v1.29-2 PostToolUse hook + `/issue-plan` checklist SSOT** (Issue #987). `hooks/post-tool-use/release-script-filter-guard.sh` proactive prevention. When Write / Edit tools touch `packages/*/package.json`, the hook scans the root release script for the package's filter presence and warns (does not hard-deny) if either half is missing. `/issue-plan` skill body embeds a checklist for new package additions so the invariant is called out in Issue body before implementation.
- **v1.29-3 docs + publish** (Issue #988, this PR). `@kiwa-lab/release-invariants` v0.1.0 first-time npm publish + tutorial 55 (`release-script-filter-ssot.md` = systematic root cause pattern SSOT walkthrough with mock adapter + file adapter + 4 RED/GREEN behavior tests) + concept doc (`release-invariants.md` = 3 invariants catalog + systematic root cause pattern + 4-time rediscovery ledger + 7-milestone snippet validation streak) + migration guide (`v1.28-to-v1.29.md` = additive-only, breaking change 0) + snippet validation (`packages/release-invariants/tests/docs-tutorial-v1.29.test.ts` = 8 test) + VitePress publish. plugin.json 1.28.0 → 1.29.0 + new keywords + Roadmap ✅ v1.29 row + announcement 4 file + release-smoke `v1-29-publish.test.ts` (7 axis publish artefact invariant) + docs-e2e `V1_29_PAGES` (4 page render check) + **release script filter check** — verify `@kiwa-lab/release-invariants` present in both `-F` and `--filter` halves.

## Numbers

- **3 sub-Issues resolved** (#986 / #987 / #988) — smallest sprint in kiwa milestone history
- **3 PRs merged** (v1.29-1 through v1.29-3)
- **1 npm major addition** (`@kiwa-lab/release-invariants` v0.1.0) — kiwa runtime fixture 34 → **35 packages**
- **3 invariants** + **1 aggregator**
- **40 per-package assertions** in the fail-fast release-smoke axis
- **8 snippet-validation tests**
- **7-milestone snippet validation streak** (v1.23 payment / v1.24 edge / v1.25 perf-harness / v1.26 orm / v1.27 quality-metrics / v1.28 realtime / v1.29 release-invariants)

## Why 4 layers (and not just one)

Release scripts without a shared standard fail three ways.

- **Filter symmetry drift**. `-F` build filter and `--filter` publish filter are two separate halves. A contributor adds a new package to one half. Release runs green. Registry never receives the package. v1.14 / v1.25 / v1.27 / v1.28 each hit it independently.
- **Provenance flag creep**. `--provenance` came with npm CLI 10 for OIDC signing. Inside pnpm monorepos + GitHub Actions, OIDC federation is not stable. v1.14 removed it. Every subsequent milestone risks a contributor re-adding.
- **Gate script coverage drift**. `test:mutation` drives the mutation baseline. Missing a publishable package = the gate reads a partial baseline. Regression only surfaces one milestone later.

The 4 rules in `docs/concepts/release-invariants.md` — 3 invariants + 1 aggregator + 1 auxiliary rule for the 7-milestone snippet streak — are the smallest set that make kiwa release scripts comparable across milestones, forks, and downstream users.

## 18-milestone streak → 19

v1.11 (release gate) → v1.12 (non-determinism) → v1.13 (time-axis) → v1.14 (horizontal expansion) → v1.15 (AI-LLM depth) → v1.16 (component depth) → v1.17 (Observability v2) → v1.18 (Blockchain depth) → v1.19 (Framework depth) → v1.20 (Streaming depth) → v1.21 (Auth depth) → v1.22 (Auth depth II) → v1.23 (Payment depth) → v1.24 (Edge / Serverless depth) → v1.25 (Perf-harness sweep) → v1.26 (Database depth) → v1.27 (Mutation testing sweep) → v1.28 (Realtime depth II) → **v1.29 (release script filter systematic root cause SSOT)**. Every milestone since v1.11 has landed its sub-Issues in full. v1.29 is the lightest sprint yet.

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100 % milestone
- Cache / Data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- IoT depth (MQTT / CoAP / LWM2M)
- DB depth II (SurrealDB / EdgeDB / Turso / CockroachDB / TimescaleDB / QuestDB)
- Perf-harness sweep II — real-machine baseline (macOS ARM64 + Linux x86_64 + Windows x86_64 3 hardware matrix)
- Mutation sweep II — property-based mutation (Stryker + fast-check integration + shrink parser)
- Realtime depth III — WebCodecs / WebGPU compute + AV1/VP9 hardware encoding + WHIP/WHEP ingest fidelity
- Release-invariants II — provenance flag re-enablement path (OIDC federation stable + pnpm publish integration)

Feedback welcome on which of these should land next.
