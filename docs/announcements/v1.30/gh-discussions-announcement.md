# kiwa v1.30 released — a11y 横串 sweep (@kiwa-lab/a11y v1.1.0 + 34 package baseline + WCAG 2.1 AA gate + release gate 13 axis + 8 milestone snippet streak)

v1.30 is out. v1.16 の component test a11y layer (axe-core + WCAG 2.1 AA) を kiwa 全 33 package + 3 dogfood app に横串適用、 現状 0 package cover の盲点を解消して kiwa quality gate SSOT の **maximum grid 化** を達成する milestone。 v1.25 (perf 横串) + v1.27 (mutation 横串) の pair pattern を **a11y 領域に第 3 応用**、 release gate 12 → 13 axis 拡張、 **横串 milestone triple pair (perf + mutation + a11y) 完成**。

## What shipped

- **`@kiwa-lab/a11y` v1.0.1 → v1.1.0 minor bump**。 axe-core integration + WCAG 2.1 AA gate + 3-layer harness (jsdom DOM 静的 + Playwright dynamic + SSR/hydration 差分) + 4 tier threshold enforcement + `resolveA11yTier` / `assertA11yTier` / `DEFAULT_A11Y_TIER_THRESHOLDS` primitive を追加。 v1.0.x API は完全維持 (additive-only 契約)。
- **v1.30-1 axe-core infra 基盤** (Issue #992)。 34 package (@kiwa-lab/* 33 + release-invariants 1) + 3 dogfood app に `.axe-config.mjs` + `test:a11y` script + `.a11y-baseline/{package}.json` gitignore を新規追加。 4 tier WCAG 2.1 AA threshold rationale SSOT を `docs/quality/a11y-thresholds.md` に確立 — Core AA critical 0 / Framework AA critical 0 + serious 0-3 / Test type AA moderate 0-10 / SaaS AA 全 tier 0 + audit log。
- **v1.30-2 core + framework layer a11y sweep** (Issue #993)。 core 9 + framework 11 = 20 package の a11y baseline 一斉確立、 3-layer harness (jsdom static + Playwright dynamic + SSR/hydration diff) を統一実装。 `pnpm test:a11y` 20 package 並列走査 PASS。
- **v1.30-3 test type + SaaS layer a11y sweep** (Issue #994)。 test type 3 + SaaS 10 + release-invariants 1 = 14 package baseline 確立、 provider 別 baseline (auth 6+4 / queue 5 / cache 3 / payment 3+9 / streaming 3×5 / orm 3×3×8) を追加。
- **v1.30-4 release gate 13 axis 拡張** (Issue #995)。 `@kiwa-lab/quality-metrics` に `a11y.violation` axis を 13 番目として統合、 4 tier threshold enforcement 追加、 dogfood 3 app (v1.28-2/3/4) に a11y gate 統合、 `scripts/check-a11y-gates.mjs` を 4 tier threshold 経路化 (v1.27 mutation pattern 転写)。
- **v1.30-5 docs 補強** (Issue #996)。 `docs/tutorials/56-a11y-baseline.md` (axe-core setup + WCAG 2.1 AA gate + 3-layer harness walkthrough) + `docs/tutorials/57-a11y-baseline-migration.md` (0 → 34 migration methodology) + `docs/migrations/v1.29-to-v1.30.md` (additive-only、 breaking change 0) + `docs/concepts/a11y-testing-ssot.md` (WCAG 2.1 AA SSOT + 4 tier + 3-layer harness) + `packages/a11y/tests/docs-tutorial-v1.30.test.ts` snippet validation で **8 milestone 連続 snippet validation pattern** (v1.23-v1.30) 達成。
- **v1.30-6 publish** (Issue #997, this PR)。 `.claude-plugin/plugin.json` 1.29.0 → 1.30.0 + description v1.30 section + 33 new a11y keywords + Roadmap ✅ v1.30 row + announcement 4 file + release-smoke `v1-30-publish.test.ts` (7 axis publish artefact invariant) + docs-e2e `V1_30_PAGES` (5 page render check) + `pnpm run release` 経由 npm publish (`@kiwa-lab/a11y` v1.1.0) + `/docs-publish-kiwa` 経由 gh-pages 反映。

## Numbers

- **6 sub-Issues resolved** (#992 / #993 / #994 / #995 / #996 / #997)
- **6 PRs merged** (v1.30-1 through v1.30-6)
- **1 npm minor bump** (`@kiwa-lab/a11y` v1.0.1 → v1.1.0) — kiwa runtime fixture **35 packages** 維持
- **34 package a11y baseline** 一斉確立 (core 9 + framework 11 + test type 3 + SaaS 10 + release-invariants 1)
- **13 axis release gate** (a11y violation axis 12 → 13)
- **4 tier WCAG 2.1 AA threshold** SSOT
- **3-layer a11y harness** (jsdom + Playwright + SSR/hydration)
- **8 milestone 連続 snippet validation streak** (v1.23-v1.30) — payment / edge / perf-harness / orm / quality-metrics / realtime / release-invariants / a11y

## Why 横串 triple pair (perf + mutation + a11y)

kiwa quality gate SSOT は milestone ごとに縦横 2 pattern で拡張してきた。 縦 = 特定 provider に advanced semantics を追加 (v1.23 payment / v1.24 edge / v1.26 orm / v1.28 realtime)、 横 = 全 package に同じ質軸を rollout (v1.25 perf / v1.27 mutation)。 v1.30 で **横 pattern に a11y 軸を追加** し、 kiwa quality gate SSOT の maximum grid 化を達成。

- **perf (v1.25)**  ... 33 package × p95 baseline + regression detection + Welch's t-test |t| > 2 threshold
- **mutation (v1.27)** ... 33 package × Stryker kill-rate baseline + 4 tier threshold (Core 80 % / Framework 70 % / SaaS 65 % / Test type 60 %)
- **a11y (v1.30)** ... 34 package × axe-core violation baseline + 4 tier WCAG 2.1 AA threshold (Core AA critical 0 / Framework AA critical 0 + serious 0-3 / Test type AA moderate 0-10 / SaaS AA 全 tier 0)

3 横串 pattern で「perf regression」「mutation kill-rate drop」「a11y violation」 の 3 種 quality regression が全 kiwa package で fail-fast 検出される envelope が完成した。 kiwa 内部だけでなく、 kiwa を使う downstream test suite でも 3 pattern を横展開できる。

## 19 → 20 milestone streak

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → v1.24 (Edge / Serverless 深化) → v1.25 (Perf-harness sweep) → v1.26 (Database 深化) → v1.27 (Mutation testing sweep) → v1.28 (Realtime 深化 II) → v1.29 (release script filter SSOT) → **v1.30 (a11y 横串 sweep)**。 v1.11 以降 20 milestone 連続完遂、 全 sub-Issue land 維持。

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
- A11y sweep II — WCAG 2.2 AAA gate + screen-reader emulator (NVDA / JAWS / VoiceOver) + keyboard-only harness

Feedback welcome on which of these should land next.
