# @kiwa-test/spec

## 0.1.0

### Minor Changes

- e16898f: v1 — 汎用テストツール化 MVP: spec / api 新設 + core を spec ベースに整理

  kiwa を dApp E2E 専用から汎用テストツールへ拡大する v1。
  spec 共通基盤を `@kiwa-test/spec` として新設、 HTTP API adapter を `@kiwa-test/api` として新設し、 `@kiwa-test/core` は `@kiwa-test/spec` を peer dep として依存しつつ既存 dApp E2E API を完全互換で維持する。

  ## 新規 package

  ### @kiwa-test/spec 0.1.0 (新設)

  - `parseSpec(markdown)` ... kiwa-design 9 column markdown を `SpecDoc` (cases, layer, mode, route) にパース
  - `createPool({ size, acquire, reset, release })` ... 汎用 borrow / release pool、 anvil pool の基底
  - `TestEnvBase<TMode>` / `Lease` / `Pool` / `TestLayer` / `TestMode` ... 全 adapter 共通の型

  ### @kiwa-test/api 0.1.0 (新設)

  - `setupApiServer({ mode })` ... HTTP API テストの 3 経路統合 helper
    - `mode: 'mock'` ... msw v2 handler で固定応答
    - `mode: 'live'` ... 実 HTTP server を free port で起動 (Next.js Route Handler / Express / Fastify / NestJS 対応)
    - `mode: 'hybrid'` ... live + msw 共存 (path 単位の override 可能)
  - 統一 `request` client (`get` / `post` / `put` / `patch` / `delete`) + `ApiResponseSnapshot` (`status` / `headers` / `bodyText` / `json<T>()`)
  - msw / supertest / vitest は optional peer dep

  ## 変更 package

  ### @kiwa-test/core 0.2.0 → 0.3.0 (minor)

  - `@kiwa-test/spec` を dependency として参照、 spec の共通型 (`TestLayer` / `TestMode` / `Lease` / `Pool` / `SpecDoc`) を main entry から re-export
  - `parseSpec` も core から re-export (既存 user が `@kiwa-test/core` の単一 install で spec parser を使える経路を確保)
  - 既存 API 完全互換、 既存 118 件 test PASS

  ## PoC

  - `examples/nextjs-api-poc/` ... Next.js App Router Route Handler 1 つ + Layer 1 spec.md + Vitest test 9 件 (`live` / `mock` / `hybrid` の 3 経路) PASS

  ## skill SSOT

  - `.claude/skills/kiwa-design/SKILL.md` ... `--layer api` の出力 path (`tests/spec/integration/test-spec-{module}.api.md`) + api 専用 9 column 表 (Mode / Route 追加) を追記
  - `.claude/skills/kiwa-api/SKILL.md` ... `@kiwa-test/api` 経路 + msw / supertest mapping + 実装例を追記
