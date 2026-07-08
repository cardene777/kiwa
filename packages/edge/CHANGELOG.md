# @kiwa/edge

## 1.0.2

### Patch Changes

- re-publish 3 packages with version 1.0.2 — previous 1.0.1 publish + unpublish の履歴により同 version 再 publish 不可、 1.0.2 へ bump して registry に再登録。

  実装変更なし、 package.json version + CHANGELOG.md だけの patch bump。 npm registry に v1.0.2 として appear し、 v1.2 milestone (Issue #518/#519/#522) の publish 完了状態化する。

## 1.0.1

### Patch Changes

- 7c60a7e: 🎉 New package `@kiwa/edge` v1.0 — Edge runtime fetch handler test adapter (Issue #522、 v1.2 milestone 4/10).

  ## What's in the box

  - `invokeEdgeHandler<TEnv>({ handler, url, method, headers, formData, jsonBody, env })` — invoke `fetch(request, env, ctx)` style handlers (Cloudflare Workers / Vercel Edge / generic ESM) with a simulated ExecutionContext and capture `response` / `redirect` / `ctx.waitedPromises` / `ctx.passThroughCalled` / `error`.
  - `createKvNamespace(initial?)` — pure JS Cloudflare KV mock implementing `get` (text / json / arrayBuffer types) / `put` (with metadata) / `delete` / `list` (prefix + limit). Strongly consistent (no eventual-consistency simulation) so tests stay deterministic.
  - types: `EdgeFetchHandler` / `EdgeEnvBindings` / `SimulatedExecutionContext` / `KVNamespace` / `KVMockEntry` / `KVNamespacePutOptions` / `KVNamespaceListOptions` / `KVNamespaceListResult` / `InvokeEdgeHandlerOptions` / `InvokeEdgeHandlerResult`.

  ## Coverage

  24 unit tests passing (edge-handler 12 + kv-mock 12)、 coverage `lines / branches / functions / statements` 全 100%.

  ## Companion

  - New skill `/kiwa-edge` — Layer 2 generator with 9 column extension table for `edge-handler` mode.
  - `kiwa-design` / `kiwa-review` の `--layer` 選択肢に `edge-handler` 追加。
  - `release.yml` + `scripts/check-coverage-gates.mjs` + `scripts/check-mutation-gates.mjs` + `tests/release-smoke/` 4 file + `package.json` release / mutation script を **19 packages 化**。
  - packages/edge/{stryker.config.mjs,vitest.stryker.config.mjs} 配置で mutation gate 統合。
  - README Limitations 表で Edge runtime ❌ → ✅ production-ready (v1.0.0+)。

  ## Out of scope (separate Issues)

  - R2 bucket binding mock (blob 操作) — 需要次第で別 Issue。
  - D1 database binding mock (SQL execute) — `@kiwa/orm` (#527) で testcontainers + Postgres 経路と整合検討。
  - Durable Object binding mock (state coordination) — 別 Issue。
  - Queue producer / consumer / Service binding / Hyperdrive — 個別 Issue で対応。

  これらは test 側で `vi.fn()` 等で都度 mock 投入可能。
