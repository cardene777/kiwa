# kiwa v1.27 released — Mutation testing sweep (Stryker rollout + 4-tier threshold SSOT + 12-axis release gate + 33-package coverage)

v1.27 is out. After v1.11 landed `@kiwa/quality-metrics` v0.1 with `mutationFromCounts` and a fixed 60 % kill-rate axis on the 11-axis release gate, v1.27 stacks a **4-tier mutation threshold SSOT + Stryker infrastructure across all 33 kiwa packages + a 12-axis release gate with `mutation.tier` as the new axis**. Every axis is a `packages/quality-metrics/src/gate.ts` pure primitive (no adapter, no network) so tests / fixtures / release gates run deterministically. `@kiwa/quality-metrics` v0.2.0 → v0.3.0 minor bump reflects the tier-aware surface addition — the v0.2 API surface (`assembleReport` / `evaluateReleaseGate` / `mutationFromCounts` / `emitMarkdown`) stays completely intact.

## What shipped

- **`@kiwa/quality-metrics` v0.3.0** (4-tier mutation threshold SSOT + tier-aware 12-axis release gate minor bump). v0.2's `assembleReport` + `evaluateReleaseGate` + `mutationFromCounts` + `emitMarkdown` + every `*Metric` type alias keeps every prior signature. v0.3 layers 5 primitives on top: `DEFAULT_MUTATION_TIER_THRESHOLDS` (the 4-tier floor table) + `resolveMutationTier` + `assertMutationTier` + `MutationTier` type + `ReleaseGateContext` type. Existing 7 / 11 axis paths stay unchanged when `mutationTier` is omitted from `evaluateReleaseGate` — no v0.2 caller is asked to migrate.
- **v1.27-1 Stryker infra 基盤** (Issue #957). 34-package `stryker.config.mjs` land + `test:mutation` script + `.stryker-tmp/` gitignore + `.mutation-baseline/{package}.json` persistence + 4-tier threshold rationale SSOT (`docs/quality/mutation-thresholds.md`) — Core 80 % / Framework 70 % / SaaS 65 % / Test type 60 %, each tier justified against the shape of code Stryker runs over rather than package name. Baseline JSON schema is a single 5-field object (`package` / `tier` / `killRate` / `survivedIds` / `runAt`) — no bespoke shape per package.
- **v1.27-2 core + framework layer mutation sweep** (Issue #963). 9 core-layer packages (core / dapp / api / ui / data / cli-test / observability / e2e / cli) + 11 framework-adapter packages (a11y / visual / nextjs / nuxt / sveltekit / remix / astro / solidstart / qwikcity / edge / fresh / hono / solidjs). 3-layer harness (source + test + mutant) SSOT + parallel Stryker run across 20 packages with tier-aware gates.
- **v1.27-3 test type + SaaS layer mutation sweep** (Issue #966). 3 test-type packages (a11y / visual / component) + 10 SaaS-layer packages (auth / queue / cache / orm / payment / streaming / search / mcp / agent / realtime). Provider-specific baseline patterns kept in the same `.mutation-baseline/{package}.json` shape so `PACKAGE_TIER` map stays single-file.
- **v1.27-4 release gate 12-axis 拡張** (Issue #959). `evaluateReleaseGate(report, thresholdOverrides, { mutationTier })` opts a report into a 12th axis (`mutation.tier`) that fails when kill-rate drops below the tier floor. `resolveMutationTier` picks the tier from a `PACKAGE_TIER` map, `assertMutationTier` asserts the tier floor and throws a `MutationTierBelowFloor` error with the offending numbers when it fails.
- **v1.27-5 docs 補強** (Issue #968). tutorial 50 (Stryker + kill-rate baseline + tier gate walkthrough) + tutorial 51 (22 → 33 package sweep methodology) + concept doc `mutation-testing-ssot.md` (kill rate + 4-tier threshold + baseline persistence + 12-axis release gate SSOT) + migration guide `v1.26-to-v1.27.md` (additive-only, breaking change 0) + snippet validation `packages/quality-metrics/tests/docs-tutorial-v1.27.test.ts` (20 test) re-runs every tutorial code snippet against the real `@kiwa/quality-metrics` v0.3 API so drift is structurally blocked.
- **v1.27-6 publish** (Issue #961, this PR). plugin.json 1.26.0 → 1.27.0 + description v1.26 → v1.27 marker + new mutation-focused keywords + Roadmap ✅ v1.27 row + announcement 4 file + release-smoke `v1-27-publish.test.ts` (7 axis publish artefact invariant) + docs-e2e `V1_27_PAGES` (5 page render check) + **release script filter fix** — `@kiwa/quality-metrics` added to both build (`-F`) and publish (`--filter`) halves (v1.14 payment omission + v1.25 perf-harness lesson, 3rd application of the same pattern).

## Numbers

- **6 sub-Issues resolved** (#957 / #963 / #966 / #959 / #968 / #961)
- **6 PRs merged** (v1.27-1 through v1.27-6)
- **1 npm minor bump** (`@kiwa/quality-metrics` v0.2.0 → v0.3.0) — kiwa runtime fixture count stays 34
- **33 packages** with Stryker rollout (22 already had a config from earlier milestones, 11 new in v1.27-1 through v1.27-3)
- **4 tiers** (Core 80 % / Framework 70 % / SaaS 65 % / Test type 60 %) in the mutation threshold SSOT
- **12 axes** on the release gate (coverage + test count + fidelity + perf p95 + AI-LLM cost / latency / token / accuracy + mutation kill + mutation tier + 2 legacy = 12, tier axis is the new one)
- **20 snippet-validation tests** in `packages/quality-metrics/tests/docs-tutorial-v1.27.test.ts`

## Why 4 tiers (and not one universal floor)

Mutation tests without a shared tier system fail three ways.

- **Threshold drift**. One package uses 90 / 80 / 80 as the gate, another uses 80 / 60 / 50, a third uses 65 / 55 / 50. When a mutation regression fires on package A but not on B, the reader cannot tell whether B is genuinely fine or whether B's gate is looser than A's. The 4-tier SSOT names the **shape** of the code Stryker runs over — Core (pure primitives that everything imports) / Framework (adapter shells that translate to a framework) / SaaS (provider mocks that need to swap in for real APIs) / Test type (test-runner helpers). Every downstream config picks the tier that fits its shape — not the tier that flatters its historic score.
- **Kill-rate formula drift**. Stryker's HTML report exposes multiple numbers: `total MSI`, `covered MSI`, `killed / mutations`, `killed / (killed + survived)`. The SSOT pins the kill rate at **`killed / (killed + survived + timeout + error)`** so a package with a lot of `no-coverage` mutants is not penalised for lines the test suite never touches, and a package with `timeout` / `error` mutants is not silently rewarded.
- **Regression detection drift**. Rebuilding the baseline on every run misses regressions entirely. Comparing today's kill rate against a hard-coded number misses improvements. The SSOT pins baseline persistence at `.mutation-baseline/{package}.json`, tracked in git, so a mutation regression on a future PR shows up as a **diff on the baseline JSON alongside the code diff**.

The 4 rules in `docs/concepts/mutation-testing-ssot.md` — kill-rate formula / 4-tier floor / baseline persistence / tier-aware 12-axis gate — are the smallest set that make kiwa mutation suites comparable across packages, milestones, and forks.

## 17-milestone streak

v1.11 (release gate) → v1.12 (non-determinism) → v1.13 (time-axis) → v1.14 (horizontal expansion) → v1.15 (AI-LLM depth) → v1.16 (component depth) → v1.17 (Observability v2) → v1.18 (Blockchain depth) → v1.19 (Framework depth) → v1.20 (Streaming depth) → v1.21 (Auth depth) → v1.22 (Auth depth II) → v1.23 (Payment depth) → v1.24 (Edge / Serverless depth) → v1.25 (Perf-harness sweep) → v1.26 (Database depth) → **v1.27 (Mutation testing sweep)**. Every milestone since v1.11 has landed 6 sub-Issues in full.

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100 % milestone
- Cache / Data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- IoT depth (MQTT / CoAP / LWM2M)
- DB depth II (SurrealDB / EdgeDB / Turso / CockroachDB / TimescaleDB / QuestDB)
- Perf-harness sweep II — real-machine baseline (macOS ARM64 + Linux x86_64 + Windows x86_64 3 hardware matrix + CI reproducibility harness)
- Mutation sweep II — property-based mutation (Stryker + fast-check integration + shrink parser)

Feedback welcome on which of these should land next.
