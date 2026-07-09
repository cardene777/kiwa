---
title: "kiwa v1.11 リリース — quality gate 補強 (5 軸 harness + dogfood 3 app + docs 3 pillars + GitHub Pages)"
emoji: "🌱"
type: "tech"
topics: ["oss", "testing", "supabase", "rabbitmq", "rust"]
published: false
---

## TL;DR

kiwa v1.11 milestone (**6/6 GitHub Issues resolved**) を land した。 v1.10 まで「provider 数を増やす」 直交軸で拡張してきたが、 v1.11 は **「release 品質を数値で判断可能にする」 縦軸** に思想シフト。 5 軸統一 harness `@kiwa-lab/quality-metrics` v0.1、 dogfood 3 app (real vs mock の fidelity 実測)、 docs 3 pillars (tutorial + migration + API reference)、 VitePress + GitHub Pages publication まで同時 land。

- 親 Issue: [#680](https://github.com/cardene777/kiwa/issues/680)
- 6 sub-Issue: [#681](https://github.com/cardene777/kiwa/issues/681) - [#686](https://github.com/cardene777/kiwa/issues/686)

## 1. `@kiwa-lab/quality-metrics` v0.1 — 5 軸統一 harness (v1.11-1)

kiwa の全 provider adapter が同一 shape の score を出す統一 API。 v1.10 まで「mock 忠実度が provider によって濃淡がある」 「性能 / coverage / regression detection が SSOT 数値化されていない」 課題を、 5 軸で release gate 判定可能な形に落とし込む。

### 5 測定軸

- `coverage` — line / branch / function %
- `testCount` — behavior / integration / e2e で kind 分け
- `fidelity` — mock 実装済 method 数 / real provider の全 method 数、 optional で dogfood 実測の `behavioralDivergences` 数
- `perf` — p50 / p95 / p99 latency (nearest-rank)
- `mutation` — stryker / cargo-mutants の kill rate

### Release gate SSOT

```ts
export const DEFAULT_RELEASE_GATE_THRESHOLDS: ReleaseGateThresholds = {
  coverageLine: 85,
  coverageBranch: 80,
  coverageFunction: 90,
  fidelityRatio: 70,
  perfP95Ms: 100,
  mutationKillRate: 60,
  behaviorTests: 10,
};
```

7 軸全てクリアで release 可、 1 軸でも不足で blocker として PR に明示。

## 2. dogfood 3 app (v1.11-2 / -3 / -4)

v1.10 で追加した provider (Supabase / RabbitMQ / Foundry-rs + alloy.rs) を、 実 app 相当で `KIWA_MODE=real` vs `KIWA_MODE=mock` の 2 mode 駆動、 trace 差分から fidelity 実測する pattern を確立。

### Adapter template (3 app 共通)

```
examples/dogfood-<provider>-app/
├── src/
│   ├── adapters/
│   │   ├── interface.ts   (provider-neutral trace-recording shape)
│   │   ├── mock.ts        (kiwa mock adapter)
│   │   └── real.ts        (real provider + graceful skip)
│   └── flows/
│       ├── <domain>-flows.ts
│       └── fidelity.ts     (trace diff + quality-metrics 呼出)
└── tests/
    ├── e2e-mock-mode.test.ts
    ├── fidelity-report.test.ts
    └── emit-fidelity-report.test.ts  (quality-report/ に snapshot 出力)
```

TypeScript (v1.11-2 supabase / v1.11-3 rabbitmq) と Rust (v1.11-4 foundry) の 2 言語で同 template 再利用性実証。

### 実運用初検証

v1.11-3 rabbitmq dogfood で release gate が **FAIL 判定** — perf p95 548ms が 100ms 上限超過。 harness の SSOT 閾値が机上ではなく実運用意味を持つことを実測データで実証。

## 3. Docs 3 pillars (v1.11-5)

現状の「README + SKILL.md + announcement + PR body の 4 経路散逸」 状態を、 tutorial + migration guide + API reference の 3 pillars で統一。

### 5 本 tutorial (5 セクション統一テンプレ)

- 01: Your first Supabase Auth test in 5 min
- 02: RabbitMQ DLX test recipe
- 03: Rust contract test from zero
- 04: Testing Next.js Server Actions with @kiwa-lab/nextjs
- 05: Multi-provider auth (NextAuth + Clerk + Auth0)

全て `What you'll build / Prerequisites / Step-by-step / Explanation / Troubleshoot` の 5 セクション、 full copy-pasteable。

### 2 本 migration guide

- v1.9 → v1.10 (Supabase Auth + RabbitMQ + Rust contract layer)
- v1.10 → v1.11 (quality-metrics harness + dogfood app pattern + GitHub Pages)

両方 additive-only、 diff 形式で code 変更を明示、 verification コマンド付。

### 3 系統 API reference + `/docs-generate` skill

- TypeScript = typedoc (23 packages)
- Rust = cargo doc (kiwa-test-rs)
- Solidity = forge doc (dogfood-foundry-dapp)

`/docs-generate` local skill が 3 CLI 一括起動、 CI 全面禁止規約 (`rules/git-workflow.md`) 下で local build のみで完結。

## 4. VitePress + GitHub Pages (v1.11-6)

docs 全部を VitePress で build、 `/docs-publish-kiwa` local skill で gh-pages branch に push、 `https://cardene777.github.io/kiwa/` で公開。 CI 全面禁止規約下で GitHub Actions 一切使わず。

```bash
# 生成 → build → 公開の 3 step
claude /docs-generate       # typedoc + cargo doc + forge doc
pnpm docs:build             # VitePress build → docs/.vitepress/dist/
claude /docs-publish-kiwa   # gh-pages branch push
```

Playwright E2E (`tests/docs-site-e2e/`) が 5 canonical page (landing / tutorial index / tutorial 01 / migration v1.10→v1.11 / release-gate SSOT) の rendering + search widget の動作を実測、 build 後の verification に組み込み。

## Migration

v1.10 user は zero-migration。 既存 test file はそのまま動く。 v1.11 追加は全て opt-in。

```bash
pnpm add -D @kiwa-lab/quality-metrics
```

詳細: [v1.10 → v1.11 migration guide](https://github.com/cardene777/kiwa/blob/main/docs/migrations/v1.10-to-v1.11.md)。

## v1.12 候補

- Storybook integration (v2.0 pull-forward)
- Dragonfly (2025 新興 Redis 互換 cache)
- Reth (Rust Ethereum execution client)
- Go Iris + Chi (framework 縦深化続き)
- Realtime layer (Supabase Realtime / Ably / Pusher / Socket.io / SSE)
- AI/LLM 系 (OpenAI / Anthropic / Vercel AI SDK / LangChain mock)
- Payment 系 (Stripe / Paddle / Lemon Squeezy webhook mock)
- Search 系 (Meilisearch / Algolia / Typesense)

## 参考

- v1.11 親 Issue: https://github.com/cardene777/kiwa/issues/680
- v1.10 完遂時の弱点分析 (release gate SSOT 化の source of truth)
- @kiwa-lab/quality-metrics: `packages/quality-metrics/`
- dogfood 3 app: `examples/dogfood-{supabase-saas,rabbitmq-worker,foundry}-app/`
- VitePress: https://vitepress.dev/
- GitHub Pages Free plan: https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages
