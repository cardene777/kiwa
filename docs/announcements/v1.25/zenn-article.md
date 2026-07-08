---
title: "kiwa v1.25 released — Perf-harness sweep (33 package p95 baseline + regression detection rollout)"
emoji: "⚡"
type: "tech"
topics: ["oss", "typescript", "performance", "benchmarking", "kiwa"]
published: true
---

# kiwa v1.25 released

v1.25 は kiwa の 15 milestone 目です。 v1.13-1 (時間軸、 `@kiwa/perf-harness` v0.1 で `measure` p50 / p95 / p99 + `saveBaseline` + `detectRegression` + `evaluatePerfGate` primitive を land) + v1.14-post (`runPerf3Layer` serial + concurrent + memory 3-layer harness) を基盤に、 v1.25 は同 primitive を **33 全 kiwa package** に rollout、 各 package で `tests/perf/{package}.perf.ts` + `test:perf` script + `.perf-baseline/{package}.json` を追加。 v1.13-1 primitive は first-line contract のまま維持 (v0.1 signature 完全維持)、 33 package p95 baseline + regression detection は second-line envelope として並走。 `@kiwa/perf-harness` v0.1.1 → v0.2.0 minor bump は 33 package coverage extension + 3-layer harness 標準化を反映。 v1.11 以降の連続完遂 14 milestone (release gate → 非決定性 → 時間軸 → 横軸拡張 → AI-LLM 深化 → component 縦軸 → Observability v2 → Blockchain 深化 → Framework 深化 → Streaming 深化 → Auth 深化 → Auth 深化 II → Payment 深化 → Edge / Serverless 深化) を受けて、 v1.25 は Perf-harness sweep milestone、 kiwa runtime fixture 34 packages はそのまま維持 (perf-harness 既存 package の rollout)。

## 主な追加

### `@kiwa/perf-harness` v0.2.0 (33 package coverage extension)

v1.13-1 で land した `measure` p50 / p95 / p99 + `saveBaseline` + `loadBaseline` + `detectRegression` + `evaluatePerfGate` primitive + v1.14-post `runPerf3Layer` (serial + concurrent + memory 3-layer harness) の signature を完全維持したまま、 v1.25 は 33 全 kiwa package に同 primitive を rollout。 各 package の `tests/perf/{package}.perf.ts` は shared SSOT (`docs/concepts/perf-testing-ssot.md`) に従い、 platform-specific event 名ではなく **transition** に対して assert 可能。

### 4 rule SSOT

`docs/concepts/perf-testing-ssot.md` は kiwa perf 全 suite の 4 rule を単一 SSOT 化。

1. **3 warmup + 100 iteration 共通 floor** — 少数 iteration は warmup noise 支配、 過剰 iteration は CI 時間浪費 (10 s × 33 pkg)。 Welch's t-test が null hypothesis を reject 可能な最小 sample size + full sweep 90 s 未満完遂の tradeoff。
2. **Welch's t-test |t| > 2** — 有意性 test。 delta 単独では noise 判別不能、 t-test 単独では 1 % 移動 (user 認知不能) を false-positive として発火。
3. **20 % p95 delta** — regression 判定閾値。 5 % は false-positive 頻発、 30 % は true-positive 見逃し。 20 % は Welch's t-test と組合せで最適解。
4. **baseline JSON schema** — 各 package の `.perf-baseline/{package}.json` は `{p50, p95, p99, sampleCount, timestamp, sha}` の 6 field 固定 schema、 fork 越し / milestone 越しの比較を可能にする。

### v1.25-1 core layer perf sweep (9 package)

`@kiwa/core` / `dapp` / `api` / `ui` / `data` / `cli-test` / `observability` / `e2e` / `cli` の 9 core layer package に `tests/perf/{package}.perf.ts` + `test:perf` script + `.perf-baseline/{package}.json` を追加。 各 suite は `runPerf3Layer` (serial concurrency=1 200 iter + concurrent concurrency=10 500 iter + memory heap sampling) 経由で 3 axis を 1 call gate。

```ts
import { runPerf3Layer } from '@kiwa/perf-harness';
import { parseSpec } from '@kiwa/core';

const result = await runPerf3Layer({
  name: 'core:parseSpec',
  serial: {
    fn: async () => parseSpec('# example\n'),
    iterations: 200,
    warmup: 5,
  },
  concurrent: {
    fn: async () => parseSpec('# example\n'),
    iterations: 50,
    concurrency: 10,
  },
  memory: {
    fn: async () => parseSpec('# example\n'),
    iterations: 100,
  },
});

// result.serial.p95Ms / result.concurrent.p95Ms / result.memory.heapMb
// 全 3 axis が 20 % p95 delta 超過なら regression 発火
```

### v1.25-2 framework adapter perf sweep (11 package)

`@kiwa/a11y` / `visual` / `nextjs` / `nuxt` / `sveltekit` / `remix` / `astro` / `solidstart` / `qwikcity` / `edge` / `fresh` / `hono` / `solidjs` の 11 framework adapter package に同一 pattern を適用。 framework baseline path 分離で cross-adapter noise 抑制、 3-layer perf harness 経由。

### v1.25-3 test type perf sweep (3 package)

`@kiwa/a11y` / `visual` / `component` の 3 test type package + 3-layer perf harness。 axe-core visitor tree walk / pixelmatch image diff / component mount + snapshot 各 op の p95 baseline 化。

### v1.25-4 SaaS layer perf sweep (10 package)

`@kiwa/auth` / `queue` / `cache` / `orm` / `payment` / `streaming` / `search` / `mcp` / `agent` / `ai-llm` の 10 SaaS layer package + provider 別 baseline + `KIWA_MODE=real` opt-in。 mock 経路 default で <5 ms per test、 `KIWA_MODE=real` で real sandbox (Stripe test mode / Redis / Meilisearch 等) に切替、 fidelity 比較。

### v1.25-5 release-gate 統合 + docs 補強

`perf.p95Ms` axis を 11-axis release gate に統合。 release gate は 11 axis (a11y / coverage / mutation / lint / typecheck / test / build / startup / e2e / visual / **perf.p95Ms**) を全 PASS で release 許可、 perf axis 単独 FAIL でも release-gate FAIL に反映。

docs は 3 pillar + 1 snippet validation を追加。

- **tutorial 45** (`docs/tutorials/45-perf-harness-baseline.md`) ... p95 baseline + regression detection walkthrough、 空 project → `@kiwa/perf-harness@^0.2` install → `measure` + `saveBaseline` + `detectRegression` の 15 分完走 recipe。
- **tutorial 46** (`docs/tutorials/46-perf-baseline-migration.md`) ... 3 → 33 package migration methodology、 v1.25 sweep で kiwa 33 package に適用した exact recipe を external repo で 15 分再現。
- **concept doc** (`docs/concepts/perf-testing-ssot.md`) ... 4 rule SSOT の詳細 + `measure` API reference + `runPerf3Layer` reference + baseline JSON schema。
- **migration guide** (`docs/migrations/v1.24-to-v1.25.md`) ... additive-only、 breaking change なし。
- **snippet validation** (`packages/perf-harness/tests/docs-tutorial-v1.25.test.ts`) ... tutorial 45-46 の全 code snippet を実 `@kiwa/perf-harness` API import + execute + assertion で走査、 15 test で drift を検知 (`docs-tutorial-v1.21.test.ts` / `docs-tutorial-v1.22.test.ts` / `docs-tutorial-v1.23.test.ts` / `docs-tutorial-v1.24.test.ts` と同じ pattern)。

### v1.25-6 publish (本 PR)

- `plugin.json` v1.24.0 → v1.25.0 + description v1.24 → v1.25 marker + 26 perf keyword 追加 (`perf` / `perf-harness` / `perf-testing` / `p50` / `p95` / `p99` / `latency-percentile` / `regression-detection` / `welch-t-test` / `baseline-persistence` / `perf-baseline` / `perf-regression` / `3-layer-harness` / `serial-perf` / `concurrent-perf` / `memory-perf` / `heap-sampling` / `33-package-coverage` / `perf-sweep` / `release-gate-perf` / `p95-baseline` / `iteration-warmup` 他)。
- `@kiwa/perf-harness` v0.1.1 → v0.2.0 minor bump。
- README `Roadmap ✅ v1.25` row を追加、 6 sub-Issue #927-#932 全 link + `6/6 resolved` copy。
- 4 announcement file (gh-discussions + x-thread-en + x-thread-ja + zenn-article) 新規追加。
- `tests/release-smoke/tests/v1-25-publish.test.ts` (7 axis publish artefact invariant) 新規 + `v1-24-publish.test.ts` 削除。
- `tests/docs-site-e2e/site.spec.ts` に `V1_25_PAGES` (5 page: tutorial 45 + tutorial 46 + concept `perf-testing-ssot` + migration `v1.24-to-v1.25`、 nav + search widget mount check) 追加。
- **`package.json` release script filter に `@kiwa/perf-harness` 追加** (v1.14 payment 漏れ再発防止、 v1.23 v1-23-payment fix の教訓反映)。 build + publish 両 filter に含める。

## Numbers

- **6 sub-Issue 解決** (#927-#932)
- **6 PR merge** (v1.25-1 + v1.25-2 + v1.25-3 + v1.25-4 + v1.25-5 + 本 publish PR)
- **1 npm minor bump** (`@kiwa/perf-harness` v0.1.1 → v0.2.0) — kiwa runtime fixture 34 packages 維持
- **33 package perf sweep 完了** (core layer 9 + framework adapter 11 + test type 3 + SaaS layer 10)
- **release script filter fix** — `@kiwa/perf-harness` を含めて v1.14 payment 漏れ再発防止

## なぜ 33 package coverage (3 pilot ではなく)

perf harness rollout には 3 pilot package rollout で捕捉不能な 3 失敗 mode がある、 pilot gate を幾ら厳しくしても。

- **threshold drift** — package A は `p50 < 5 ms` gate、 package B は `p95 < 10 ms`、 package C は `mean < 8 ms`。 package A で regression 発火、 package B で発火しないとき、 reader は「B は本当に問題ないのか / B の gate が緩いだけか」 を判別不能。 11-axis release gate が `perf.p95Ms` を single perf axis と定義、 全 downstream suite が同 metric に収束。
- **iteration count drift** — 10 iter suite は warmup noise 支配の p95、 10 000 iter suite は 10 秒 × 33 package = CI に 5 分負荷。 SSOT が **3 warmup + 100 iteration** を shared floor に pin、 Welch's t-test の null hypothesis reject に十分 + full sweep が 90 秒未満で完遂。
- **regression detection drift** — 5 % / 10 % / 30 % delta が異なる suite で「regression」 と呼ばれる。 SSOT が delta threshold を **20 %** に、 significance test を Welch's t-test (`|t| > 2`) に pin。 両条件同時充足で `regressed` verdict — delta 単独は noise 判別不能、 t-test 単独は user 認知不能な 1 % 移動を有意化。

4 rule (`docs/concepts/perf-testing-ssot.md`) は kiwa perf suite を package 越し・ milestone 越し・ fork 越しで比較可能にする最小 set。

## 15 milestone 連続完遂

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → v1.24 (Edge / Serverless 深化) → **v1.25 (Perf-harness sweep)**。 v1.11 以降の全 milestone で 6 sub-Issue を完遂。

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100% milestone
- Cache / Data 深化 (Dragonfly / Materialize / Neon)
- L2 深化 (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK 深化 (Noir / Circom / RISC Zero test harness)
- IoT 深化 (MQTT / CoAP / LWM2M)
- DB 深化 (SurrealDB / EdgeDB / Turso)
- Perf-harness sweep II — real machine baseline (macOS ARM64 + Linux x86_64 + Windows x86_64 3 hardware matrix + CI reproducibility harness)

Feedback welcome on which of these should land next. どれから land するかの投票は GitHub Discussions で募集中。
