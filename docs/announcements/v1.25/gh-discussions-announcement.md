# kiwa v1.25 released — Perf-harness sweep (33 package p95 baseline + regression detection rollout)

v1.25 is out. After v1.13-1's `@kiwa-test/perf-harness` v0.1 landed the `measure` p50 / p95 / p99 + `saveBaseline` + `detectRegression` + `evaluatePerfGate` primitives, and v1.14-post landed `runPerf3Layer` (serial + concurrent + memory 3-layer harness), v1.25 rolls the exact same primitives out to **all 33 kiwa packages**. Every package now ships `tests/perf/{package}.perf.ts` + `test:perf` script + `.perf-baseline/{package}.json` under one shared SSOT (3 warmup + 100 iteration + 20 % p95 delta + Welch's t-test |t| > 2). `@kiwa-test/perf-harness` v0.1.1 → v0.2.0 minor bump reflects the 33 package coverage extension.

## What shipped

- **`@kiwa-test/perf-harness` v0.2.0** (33 package coverage extension + 3-layer harness 標準化). v0.1's `measure` / `saveBaseline` / `loadBaseline` / `detectRegression` / `evaluatePerfGate` primitives + v1.14-post's `runPerf3Layer` keep every prior signature. v0.2 is a **coverage extension**, not a surface extension — every one of the 33 kiwa packages now consumes the same primitives under one shared SSOT (`docs/concepts/perf-testing-ssot.md`).
- **v1.25-1 core layer perf sweep** (Issue #927). 9 package (`@kiwa-test/core` / `dapp` / `api` / `ui` / `data` / `cli-test` / `observability` / `e2e` / `cli`) each grew a `tests/perf/{package}.perf.ts` suite + `test:perf` script + `.perf-baseline/{package}.json`. Every suite uses the same `runPerf3Layer` primitive (serial concurrency=1 200 iter + concurrent concurrency=10 500 iter + memory heap sampling).
- **v1.25-2 framework adapter perf sweep** (Issue #928). 11 framework adapter (`a11y` / `visual` / `nextjs` / `nuxt` / `sveltekit` / `remix` / `astro` / `solidstart` / `qwikcity` / `edge` / `fresh` / `hono` / `solidjs`) each grew the same pattern. Framework baseline path separation prevents cross-adapter noise.
- **v1.25-3 test type perf sweep** (Issue #929). 3 test type package (`a11y` / `visual` / `component`) + 3-layer perf harness.
- **v1.25-4 SaaS layer perf sweep** (Issue #930). 10 SaaS layer package (`auth` / `queue` / `cache` / `orm` / `payment` / `streaming` / `search` / `mcp` / `agent` / `ai-llm`) + provider 別 baseline + `KIWA_MODE=real` opt-in for real sandbox measurement.
- **v1.25-5 release-gate 統合 + docs 補強** (Issue #931). `perf.p95Ms` axis integration with the 11-axis release gate. 2 tutorials (45 perf-harness baseline p95 walkthrough + 46 perf baseline migration methodology) + concept doc `perf-testing-ssot.md` (4 rule SSOT: 3 warmup + 100 iteration / Welch's t-test |t| > 2 / 20 % p95 delta / baseline JSON schema) + migration guide v1.24 → v1.25 (additive-only) + snippet validation `docs-tutorial-v1.25.test.ts` (15 test) re-runs every code snippet against the real `@kiwa-test/perf-harness` API.
- **v1.25-6 publish** (Issue #932, this PR). plugin.json 1.25.0 + description v1.25 marker + 26 new perf keywords + Roadmap ✅ v1.25 row + announcement 4 file + release-smoke `v1-25-publish.test.ts` (7 axis publish artefact invariant) + docs-e2e `V1_25_PAGES` (5 page render check) + `@kiwa-test/perf-harness` v0.2.0 minor bump + release script filter に `@kiwa-test/perf-harness` 追加 (v1.14 payment 漏れ再発防止、 v1.23 v1-23-payment fix 教訓反映).

## Numbers

- **6 sub-Issues resolved** (#927-#932)
- **6 PRs merged** (v1.25-1 + v1.25-2 + v1.25-3 + v1.25-4 + v1.25-5 + this publish PR)
- **1 npm minor bump** (`@kiwa-test/perf-harness` v0.1.1 → v0.2.0) — kiwa runtime fixture count stays 34
- **33 package perf sweep 完了** (core layer 9 + framework adapter 11 + test type 3 + SaaS layer 10)
- **release script filter fix** — `@kiwa-test/perf-harness` を含めて v1.14 payment 漏れ再発防止

## Why 33 package coverage (and not just 3 pilot package)

Perf harness rollout has 3 failure modes that a 3-pilot-package rollout can't catch, no matter how strict the pilot gate is.

- **Threshold drift**. One package uses `p50 < 5 ms` as the gate, another uses `p95 < 10 ms`, a third uses `mean < 8 ms`. When a regression fires on package A but not on B, the reader cannot tell whether B is genuinely fine or whether B's gate is looser than A's. The 11-axis release gate defines `perf.p95Ms` as the single perf axis; every downstream suite converges on that same metric.
- **Iteration count drift**. A suite that runs 10 iterations gives a p95 dominated by warmup noise. A suite that runs 10 000 iterations wastes 10 seconds per package × 33 packages. The SSOT pins **3 warmup + 100 iteration** as the shared floor — enough samples to make Welch's t-test meaningful, few enough that the full sweep completes in under 90 seconds.
- **Regression detection drift**. Deltas of 5 % / 10 % / 30 % all get called "regression" in different suites. The SSOT pins the delta threshold at **20 %** and the significance test at Welch's t-test (`|t| > 2`). Both conditions must hold for a `regressed` verdict — a delta alone can be noise, and a t-test alone can flag a statistically-significant 1 % move that no user notices.

The 4 rules in `docs/concepts/perf-testing-ssot.md` are the smallest set that make kiwa perf suites comparable across packages, milestones, and forks.

## 15-milestone streak

v1.11 (release gate) → v1.12 (non-determinism) → v1.13 (time-axis) → v1.14 (horizontal expansion) → v1.15 (AI-LLM depth) → v1.16 (component depth) → v1.17 (Observability v2) → v1.18 (Blockchain depth) → v1.19 (Framework depth) → v1.20 (Streaming depth) → v1.21 (Auth depth) → v1.22 (Auth depth II) → v1.23 (Payment depth) → v1.24 (Edge / Serverless depth) → **v1.25 (Perf-harness sweep)**. Every milestone since v1.11 has landed 6 sub-Issues in full.

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100% milestone
- Cache / Data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- IoT depth (MQTT / CoAP / LWM2M)
- DB depth (SurrealDB / EdgeDB / Turso)
- Perf-harness sweep II — real-machine baseline (macOS ARM64 + Linux x86_64 + Windows x86_64 3 hardware matrix + CI reproducibility harness)

Feedback welcome on which of these should land next.
