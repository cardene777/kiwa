---
name: kiwa-edge
description: |
  Layer 1 spec (`tests/spec/integration/test-spec-{module}.edge.md`) を Edge runtime (Cloudflare Workers / Vercel Edge / 汎用 ESM fetch handler) の test (Vitest + @kiwa-test/edge) に変換する Layer 2 skill。
  `fetch(request, env, ctx)` を `invokeEdgeHandler({ handler, url, method, headers, formData, jsonBody, env })` 経由で direct invoke、 env binding (KV / R2 / D1 / vars) を test ごとに seed、 ExecutionContext の `waitUntil` / `passThroughOnException` を捕捉する。
  KV namespace は `createKvNamespace(initial)` の純 JS mock を提供 (Miniflare / workerd 不要)、 R2 / D1 / DurableObject は test 側で必要に応じて mock 投入。
  `/kiwa-design --layer edge-handler` が出力する 9 column 表を `@kiwa-test/edge` の API に機械的に変換する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# /kiwa-edge — Edge runtime fetch handler test 生成 (Layer 2)

`/kiwa-design --layer edge-handler` が出力した 9 column 表を、 `@kiwa-test/edge` v1.0+ の `invokeEdgeHandler` を使った Vitest test に機械変換する。

対象は **Cloudflare Workers**、 **Vercel Edge Functions**、 **汎用 ESM 形式 fetch handler** (`export default { fetch(request, env, ctx) { ... } }`)。 Next.js Edge runtime と直接統合する場合は `/kiwa-nextjs` (middleware mode) を併用、 SvelteKit Cloudflare adapter は `/kiwa-sveltekit` + 本 skill を併用。

## 前提

- Edge runtime project (Cloudflare Workers / Vercel Edge / etc) が存在
- Layer 1 spec が存在
- `@kiwa-test/edge` v1.0+ install 済 (`pnpm add -D @kiwa-test/edge`)
- vitest standard 開発環境

## 9 column 拡張表 (`/kiwa-design --layer edge-handler`)

| 項目 | 内容 |
|---|---|
| ID | `T-EDGE-001` 等の連番 |
| Observation | 観点 (正常 / GET / POST / KV read / KV write / waitUntil / redirect / 異常系 / passThroughOnException 等) |
| Given | URL + method + headers + body + env bindings seed (`{ MY_KV: createKvNamespace({...}), API_KEY: 'secret' }`) |
| Method | `GET` / `POST` / `PUT` / `DELETE` / `PATCH` |
| Then | 期待 (`response.status===200` / `await response.json()===...` / `ctx.waitedPromises.length===1` / `redirect.url==='/login'` / `await env.MY_KV.get('foo')==='bar'` 等) |
| Priority | `P0` / `P1` / `P2` / `P3` |
| Automation | `yes` / `no` / `manual` |
| Handler | 対象 edge handler の identifier (`export default` / `worker.fetch` 等) |
| Bindings | 使用 env binding (`KV: MY_KV` / `R2: BUCKET` / `D1: DB` / `var: API_KEY` 等) |

## test 生成 template

```ts
import { invokeEdgeHandler, createKvNamespace, type EdgeFetchHandler } from '@kiwa-test/edge';
import worker from '../src/index.ts';

it('{ID} {Observation}', async () => {
  const kv = createKvNamespace({Given.kv 初期 entries});
  const { response, redirect, ctx, error } = await invokeEdgeHandler({
    handler: worker.fetch as EdgeFetchHandler,
    url: 'https://{Given.host}{Given.path}',
    method: '{Method}',
    headers: {Given.headers},
    formData: {Given.formData},  // or jsonBody
    env: {
      MY_KV: kv,
      ...{Given.env vars / bindings},
    },
  });
  {Then を expect(response.status).toBe(...) や expect(ctx.waitedPromises.length).toBe(N) に展開}
});
```

## 関連

- 上流 ... `/kiwa-design --layer edge-handler`
- runtime fixture ... `@kiwa-test/edge` v1.0+ (`packages/edge/`)
- 下流 ... `/kiwa-review --layer edge-handler`
- Next.js Edge runtime ... `/kiwa-nextjs` (middleware mode) を併用
- SvelteKit Cloudflare adapter ... `/kiwa-sveltekit` + 本 skill 併用

## Out of scope (本 v1.0 では未対応、 需要次第で別 Issue)

- R2 bucket binding mock (file blob 操作)
- D1 database binding mock (SQL execute)
- Durable Object binding mock (state coordination)
- Queue producer / consumer binding mock
- Service binding (other Worker calls)
- Hyperdrive binding

これらは test 側で `vi.fn()` 等で都度 mock 投入してください。
