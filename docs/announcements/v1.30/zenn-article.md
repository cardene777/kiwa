---
title: "kiwa v1.30 — a11y 横串 sweep で quality gate SSOT を maximum grid 化した"
emoji: "♿"
type: "tech"
topics: ["a11y", "axecore", "wcag", "testing", "oss"]
published: false
---

## 概要

kiwa v1.30 では v1.16 で SSOT 化した component test の a11y layer (axe-core + WCAG 2.1 AA gate) を、 kiwa 全 33 package + 3 dogfood app に横串で rollout した。 v1.25 (perf 横串) + v1.27 (mutation 横串) の pair pattern を **a11y 領域に第 3 応用**、 release gate を 12 → 13 axis に拡張、 **横串 milestone triple pair (perf + mutation + a11y) を完成** させた。 kiwa quality gate SSOT の maximum grid 化を達成する v1.30 milestone。

## 背景 — kiwa quality gate SSOT の縦横 2 pattern

kiwa は v1.11 以降 20 milestone 連続で「1 milestone = 1 sub-Issue set 完遂」 を維持してきた。 各 milestone は縦横 2 pattern のいずれかで quality gate を拡張する。

- **縦 pattern** — 特定 provider に advanced production semantics を追加。 例 = v1.23 payment (Stripe + Paddle + Lemon Squeezy の 9 axis advanced billing state machine) / v1.24 edge (Cloudflare Workers + Vercel Edge + Deno Deploy の 8 axis advanced edge semantics) / v1.26 orm (Postgres/MySQL/SQLite × Drizzle/Prisma/Kysely の 8 axis advanced db semantics) / v1.28 realtime (WebRTC + WebTransport + HTTP/3/QUIC の 8 axis advanced realtime semantics)。 縦は provider 内部の depth を追加。
- **横 pattern** — 全 kiwa package に同じ質軸を rollout。 例 = v1.25 perf (33 package × p95 baseline + Welch's t-test regression detection) / v1.27 mutation (33 package × Stryker kill-rate baseline + 4 tier threshold enforcement)。 横は 34 package 全体の横並び quality grid を追加。

v1.30 で **横 pattern に a11y 軸を追加** し、 「perf regression」「mutation kill-rate drop」「a11y violation」 の 3 種 quality regression が全 kiwa package で fail-fast 検出される envelope を完成させた。

## v1.30 で追加された 3 pillars

### 1. axe-core + WCAG 2.1 AA gate 一斉展開

34 package (@kiwa-lab/* 33 + release-invariants 1) + 3 dogfood app に `.axe-config.mjs` + `test:a11y` script + `.a11y-baseline/{package}.json` gitignore を追加。 各 package が個別に axe-core runner + baseline persistence を持つ。

```bash
# 34 package 並列走査
pnpm test:a11y

# 特定 package のみ
pnpm --filter @kiwa-lab/a11y test:a11y
```

各 package の a11y baseline (`.a11y-baseline/{package}.json`) は violation count を tier ごとに persist、 増加時に `pnpm test:a11y` が fail する。

### 2. 4 tier WCAG 2.1 AA threshold SSOT

kiwa package を 4 tier に分類、 tier ごとに WCAG 2.1 AA violation threshold を SSOT 化 (`docs/quality/a11y-thresholds.md`)。

| Tier | 対象 package | Critical | Serious | Moderate | Minor |
|------|-----|----------|---------|----------|-------|
| Core | core / dapp / api / ui / data / cli-test / observability / e2e / cli の 9 package | 0 | 0 | 0 | 0 |
| Framework | a11y / visual / nextjs / nuxt / sveltekit / remix / astro / solidstart / qwikcity / edge / fresh / hono / solidjs の 11 framework adapter | 0 | 0-3 | 0-10 | audit log |
| Test type | component / ai-llm / mcp / agent / search / streaming / realtime 系の 3 package | 0 | 0-10 | 0-30 | audit log |
| SaaS | auth / queue / cache / orm / payment / streaming / search / mcp / agent の 10 SaaS layer + release-invariants の 1 = 11 package | 0 | 0 | 0 | 0 + audit log |

Core と SaaS は critical / serious / moderate すべて 0 (最厳格)、 Framework と Test type は tier に応じて許容範囲を設定。 全 tier で minor は audit log として記録するが release-gate は通過。

### 3. 3-layer harness (jsdom + Playwright + SSR/hydration diff)

a11y violation は 1 経路の scan では捕捉しきれない。 v1.30 では 3 layer harness を統一実装した。

- **jsdom static** — 静的 DOM を axe-core で scan、 SSR output や component 単体 test の a11y 検証に使う (< 100 ms per test)
- **Playwright dynamic** — 実 browser (Chromium) で interactive state を含めて scan、 dropdown 展開後 / focus 移動後 / error state 表示後の a11y を検証 (~ 2-5 sec per test)
- **SSR/hydration diff** — SSR HTML と hydrated DOM の a11y violation 差分、 hydration mismatch 由来の a11y regression (label 消失、 aria-* 属性 drop) を検出

3 layer 全てで PASS した package が v1.30 baseline を確立する。 tier ごとに threshold 判定を分岐、 SaaS tier は 3 layer 全てで critical 0 + serious 0 を強制。

### 4. release gate 13 axis 拡張

`@kiwa-lab/quality-metrics` に `a11y.violation` axis を 13 番目として統合、 4 tier threshold enforcement を追加した。

```ts
import {
  evaluateReleaseGate,
  DEFAULT_A11Y_TIER_THRESHOLDS,
  resolveA11yTier,
  assertA11yTier,
} from '@kiwa-lab/quality-metrics';

const tier = resolveA11yTier('@kiwa-lab/nextjs'); // → 'Framework'
const threshold = DEFAULT_A11Y_TIER_THRESHOLDS[tier];
// { critical: 0, serious: 3, moderate: 10, minor: Infinity }

assertA11yTier(a11yReport, '@kiwa-lab/nextjs', tier);
// throws A11yTierBelowFloor if violation count exceeds threshold
```

v1.27 mutation.tier axis と同じ tier-aware pattern を踏襲、 kiwa 内部だけでなく downstream test suite (kiwa を使う SaaS app) も同じ SSOT で release-gate を組める。

## 8 milestone 連続 snippet validation streak

`packages/a11y/tests/docs-tutorial-v1.30.test.ts` が `docs/tutorials/56-a11y-baseline.md` + `57-a11y-baseline-migration.md` の全 code snippet を実 `@kiwa-lab/a11y` v1.1 API で走査、 docs drift を構造的に遮断する。 v1.23 (payment) から始まる snippet validation streak が v1.30 で 8 milestone 連続達成した。

- v1.23 payment / v1.24 edge / v1.25 perf-harness / v1.26 orm / v1.27 quality-metrics / v1.28 realtime / v1.29 release-invariants / **v1.30 a11y**

docs と実装が乖離した瞬間 CI (kiwa 内部の release-smoke) が fail する。 8 milestone 連続で streak 継続 = docs の SSOT 性が構造的に保護されている。

## 使い方 — 3 step で kiwa a11y baseline を導入

### Step 1. kiwa install + a11y package

```bash
npm install --save-dev @kiwa-lab/core @kiwa-lab/a11y
```

### Step 2. `.axe-config.mjs` を配置

```js
// .axe-config.mjs
export default {
  standard: 'WCAG21AA',
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
  rules: {
    'color-contrast': { enabled: true },
    'label': { enabled: true },
    'aria-required-attr': { enabled: true },
  },
};
```

### Step 3. `test:a11y` script + baseline persist

```json
{
  "scripts": {
    "test:a11y": "vitest --config vitest.a11y.config.ts"
  }
}
```

初回実行で `.a11y-baseline/{package}.json` が生成される。 以降は baseline との diff で release gate 通過を判定する。

## v2.0 candidates

v1.30 で横串 triple pair (perf + mutation + a11y) が完成した。 次 milestone は縦深化と横拡張の混合。

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
- **A11y sweep II — WCAG 2.2 AAA gate + screen-reader emulator (NVDA / JAWS / VoiceOver) + keyboard-only harness**

## Roadmap

- GitHub Roadmap ... https://github.com/cardene777/kiwa#roadmap
- v1.30 label ... https://github.com/cardene777/kiwa/issues?q=is%3Aissue+label%3Av1.30
- v1.30 parent Issue ... https://github.com/cardene777/kiwa/issues/991
