---
title: "kiwa v1.19 released — Framework 深化 (SolidJS Signal + Deno Fresh Islands + HonoJS Cloudflare Workers)"
emoji: "🌱"
type: "tech"
topics: ["oss", "typescript", "solidjs", "deno", "kiwa"]
published: true
---

# kiwa v1.19 released

v1.19 は kiwa の 9 milestone 目です。 v1.18 (Blockchain 深化 縦軸、 `kiwa-test-rs` v0.5 で Reth EL client integration + Foundry-rs invariant / fuzz runner 深化 + Alloy encoder helpers (EIP-712 / Multicall3 / Permit2) + `@kiwa-test/dapp` reorg helpers を統一 mock harness に land) の後、 v1.19 は 2026 modern web team が実運用で必要な **modern web framework 3 種 (SolidJS (Signal-based fine-grained reactivity) + Deno Fresh (Islands architecture + partial hydration) + HonoJS (Cloudflare Workers + hc RPC type-safe client + middleware chain)) を 3 統一 test adapter として同時 land** しました。

v1.11 以降の縦軸 8 連続 (release gate → 非決定性 → 時間軸 → 横軸拡張 → AI-LLM 深化 → component 縦軸 → Observability v2 → Blockchain 深化) を受けて、 v1.19 は横軸 reset milestone、 kiwa web framework coverage を 8 → 11 に拡張します (Next.js / Nuxt / SvelteKit / Remix / Astro / SolidStart / Qwik City / Edge + SolidJS / Fresh / HonoJS)。

## 主な追加

### `@kiwa-test/solidjs` v0.1.0 (new package)

SolidJS の Signal-based fine-grained reactivity testing pattern を 1 package に集約。 SolidJS runtime 起動なし + deterministic scheduler + framework-agnostic MockNode tree の 3 特徴。

```ts
import { createSignal, createEffect, createResource, flushSync } from '@kiwa-test/solidjs';
import { renderComponent, SuspenseBoundary } from '@kiwa-test/solidjs';

// 1. Signal + Effect auto-tracking
const [count, setCount] = createSignal(0);
const effectFn = vi.fn(() => console.log('count changed:', count()));
createEffect(effectFn);
setCount(1);
flushSync();  // deterministic scheduler
expect(effectFn).toHaveBeenCalledTimes(2);  // initial run + count=1 run

// 2. createResource + Suspense boundary
const [user] = createResource(userId, fetchUser);
const boundary = new SuspenseBoundary({ fallback: <Spinner /> });
const fallbackMarkup = boundary.captureFallback();
expect(fallbackMarkup).toContain('Spinner');
await boundary.resumeSuspense(user.id);
expect(boundary.state).toBe('resolved');
```

`createSignal(initial)` は `[getter, setter]` pair を返し、 `getter()` 呼出中に active な effect / memo / resource を auto-track する dependency graph mock。 `createEffect(fn)` は microtask queue に依存せず `flushSync()` で決定的に effect を実行 (`vi.useFakeTimers()` と組合わせなくても効くのが利点)。 `createResource(fetcher)` は `loading` / `error` / `latest` state を持つ Suspense-aware async signal で、 fetcher の promise 解決前に `renderComponent` を呼ぶと最も近い `SuspenseBoundary` の fallback がマウントされる。 `SuspenseBoundary.captureFallback()` で fallback markup、 `resumeSuspense(id)` で state を `resolved` に遷移させ boundary 内の component を再 render。 framework-agnostic MockNode tree は `@kiwa-test/component` v0.1 (v1.16) の基盤を再利用、 assertion API (`getByText` / `getByRole` / `queryAll`) が Solid 特有の runtime 抜きで走る。

### `@kiwa-test/fresh` v0.1.0 (new package)

Deno Fresh の Islands architecture testing pattern を 1 package に集約。 Deno runtime 起動なし + island boundary detection + Head fragment merge の 3 特徴。

```ts
import { defineRoute, Handler, renderIsland, mergeHead } from '@kiwa-test/fresh';

// 1. defineRoute + Handler mock
const route = defineRoute({
  handler: async (req, ctx) => {
    const data = await ctx.state.db.get('key');
    return ctx.render(data);
  },
  component: ({ data }) => <div>{data.title}</div>,
});

const res = await Handler.invoke(route.handler, {
  req: new Request('http://x/'),
  state: { db: mockDb },
});
expect(res.data.title).toBe('...');

// 2. renderIsland + partial hydration
const { markup, mountBoundary } = renderIsland(CounterIsland, { initial: 0 });
expect(mountBoundary).toEqual({ name: 'CounterIsland', hydrationScope: 'client' });
expect(markup).not.toContain('_full_page_bundle');  // partial hydration only

// 3. Head fragment merge
const head = mergeHead([
  { title: 'Home', meta: { description: 'landing' } },
  { title: 'Products', meta: { 'og:type': 'website' } },
]);
expect(head.title).toBe('Products');  // last-write-wins on title
expect(head.meta.description).toBe('landing');  // preserved
expect(head.meta['og:type']).toBe('website');  // merged
```

`defineRoute({ handler, component })` は Fresh の `{ handler, component }` route shape を normalize、 handler / component 単独取出も handler + component pair 取出も両対応。 `Handler.invoke(handler, { req, params, state, render })` は Fresh の `Handler<Data>` / `HandlerContext<Data>` を Deno runtime 抜きで invoke — `state.db` 等の per-request context も mock で inject 可能。 `renderIsland(Island, props)` は virtual tree にマウントし `mountBoundary` metadata (island name + hydration scope) を返す、 `partialHydration` helper は SSR markup に island interactive script のみが含まれ full-page bundle が inlined でないことを assert。 `mergeHead([f1, f2, ...])` は nested layout の Head fragment (meta / title / link) を Fresh の merge 規則に従って合成 — title は last-write-wins、 meta は key ごとに last-write-wins、 link は array append、 deduplicated。

### `@kiwa-test/hono` v0.1.0 (new package)

HonoJS の Cloudflare Workers testing pattern を 1 package に集約。 Workers runtime 起動なし + hc type-safe RPC preservation + Workers env binding (KV / D1 / R2 / ExecutionContext) の 3 特徴。

```ts
import { createApp, hc, middlewareChain, mockEnv } from '@kiwa-test/hono';

// 1. createApp + app.request handler
const app = createApp<Env>()
  .get('/api/users/:id', async (c) => {
    const user = await c.env.KV.get(`user:${c.req.param('id')}`);
    return c.json({ user });
  });

const res = await app.request('/api/users/1', {}, {
  env: mockEnv({ KV: { get: vi.fn().mockResolvedValue('alice') } }),
});
expect(await res.json()).toEqual({ user: 'alice' });

// 2. hc type-safe RPC client
const client = hc<typeof app>('http://x');
const typed = await client.api.users[':id'].$get({ param: { id: '1' } });
// hc は AppType inference を end-to-end 保持、 typed.json() は { user: string } に narrow される
const body = await typed.json();
type BodyType = typeof body;  // { user: string }

// 3. middleware chain trace
const trace = await middlewareChain([cors(), bearerAuth({ token: 'x' }), logger()])
  .invoke({ req: new Request('http://x/'), env: mockEnv({}) });
expect(trace.executionOrder).toEqual(['cors', 'bearerAuth', 'logger']);
expect(trace.contextState).toEqual({ ... });

// 4. Workers env (KV / D1 / R2)
const env = mockEnv({
  KV: { get: vi.fn(), put: vi.fn(), list: vi.fn() },
  D1: { prepare: (sql) => ({ bind: (...args) => ({ all: vi.fn(), first: vi.fn() }) }) },
  R2: { get: vi.fn(), put: vi.fn(), delete: vi.fn(), list: vi.fn() },
  ExecutionContext: { waitUntil: vi.fn(), passThroughOnException: vi.fn() },
});
```

`createApp<Env>()` は Hono の HonoLike stub を返し `.get / .post / .put / .delete / .patch / .all / .use` を full support、 `app.request(path, init, ctx)` は handler chain を Workers runtime なしで invoke (fetch API polyfill は `Request` / `Response` shim で済ませる)。 `hc<typeof app>(baseUrl)` は type-safe RPC client mock で `AppType` inference chain を end-to-end 保持 (`hc<typeof app>('...')['api']['users'][':id'].$get({param: {id: '1'}})` の呼出は response type が `{ user: string }` に narrow される、 IDE の autocompletion + type check が real Hono と同等)。 `middlewareChain([m1, m2, ...])` は chain execution order + context state を `MiddlewareTrace` shape で trace、 pre / post / error hook それぞれの capture、 `c.set('key', value)` / `c.get('key')` の per-request store の tracking にも対応。 `mockEnv(bindings)` で Workers `env` binding surface を提供、 `KV` (`get` / `put` / `list` / `delete`) + `D1` (`prepare(sql).bind(...).all() / .first() / .run()`) + `R2` (`get` / `put` / `delete` / `list`) + `ExecutionContext` (`waitUntil` / `passThroughOnException`) を統一 shape で扱う。 pure TypeScript — `wrangler` / `miniflare` 依存なしで test 時実行、 CI cold start が数十 ms。

## dogfood 3 app

- **`examples/dogfood-solidjs-signal-app`** — SolidJS + createResource + Suspense + fine-grained update。 `makeMockAdapter` は `@kiwa-test/solidjs` の deterministic scheduler + Signal + Effect + Resource + Suspense fixture、 `makeRealAdapter` は lightweight SolidJS-like runtime harness。 `SignalFidelityReport` は 5 scenario (setter → effect fires / getter reactivity chain / `createMemo` cache hit-miss / `createResource` loading → resolved transition / Suspense boundary fallback → resumed) の mock vs real 差分を出力。 7 軸 release gate PASS。
- **`examples/dogfood-fresh-islands`** — Deno Fresh + Islands + partial hydration + edge runtime。 `makeMockAdapter` は `@kiwa-test/fresh` で marketing page + 3 island (`CounterIsland` / `NewsletterIsland` / `SearchIsland`) を render、 mount boundary set + SSR-rendered HTML skeleton を capture、 `makeRealAdapter` は minimal Deno-shaped runtime。 `IslandsFidelityReport` は 5 scenario (island mount count / partial hydration markup / `defineRoute` handler branch / `Head` fragment merge / SSR-first output) を比較。 7 軸 release gate PASS。
- **`examples/dogfood-hono-workers-rpc`** — Cloudflare Workers + Hono RPC type-safe + middleware chain + KV/D1/R2 bindings。 `makeMockAdapter` は `@kiwa-test/hono` `createApp()` + `mockEnv({ KV, D1, R2 })` + `hc` client、 `makeRealAdapter` は Workers-shaped runtime with `Request` / `Response` polyfills。 `HonoFidelityReport` は 5 scenario (`app.request` handler dispatch / `hc<AppType>` type inference preservation / middleware chain execution order / `env.KV.get/put` binding call / `env.D1.prepare(...).all()` prepared statement) を比較。 7 軸 release gate PASS。

## docs

- tutorial 3 本 (28 SolidJS Signal + Effect + Resource + Suspense / 29 Fresh Islands + Route Handler + Head normalize / 30 HonoJS + hc RPC + middleware + KV/D1/R2)
- additive migration v1.18 → v1.19 (v1.18 の Blockchain 深化 module に触れず、 新 3 package の adapter 追加のみ)
- concept doc `modern-web-framework-testing.md` (Signal reactivity / Islands architecture / edge runtime + RPC type-safety の 3 追加軸 × 6 semantic axis SSOT、 v1.11-v1.18 の 8 縦軸との棲み分け表付き)

VitePress sidebar には `Framework 深化 (v1.19)` セクションを追加、 gh-pages 反映済 (https://cardene777.github.io/kiwa/)。

## 数値サマリ

- **6 sub-Issues resolved** (#807-#812)
- **6 PRs merged** (v1.19-1a/b/c + v1.19-2/3/4/5 + 本 publish PR)
- **3 new npm package** (`@kiwa-test/solidjs` v0.1.0 + `@kiwa-test/fresh` v0.1.0 + `@kiwa-test/hono` v0.1.0)
- **3 new dogfood app** (189 test 合計、 全 7 軸 release gate PASS)
- **3 追加軸** (Signal reactivity / Islands architecture / edge runtime + RPC type-safety)
- **kiwa web framework coverage 8 → 11** (Next.js / Nuxt / SvelteKit / Remix / Astro / SolidStart / Qwik City / Edge + SolidJS / Fresh / HonoJS)

## 9 milestone streak

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → **v1.19 (Framework 深化)**。 v1.11 以降の 9 milestone は全て 6 sub-Issue land 完遂。

## v2.0 candidates

- multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- desktop (Electron / Tauri) + mobile (React Native / Expo) adapter
- coverage 100% milestone
- cache / data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)

feedback 歓迎です。 どれを次に land すべきか issue で議論しましょう。
