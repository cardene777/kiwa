# Modern web framework testing — Signal reactivity / Islands architecture / edge runtime + RPC type-safety (SSOT)

kiwa's v1.14 horizontal framework expansion (Next.js / Nuxt / Remix / Astro / Qwik / SvelteKit / SolidStart) covered the request/response mock case for 7 web frameworks. v1.19 adds **four axes on top of that base** — the ones production teams hit once their `Next.js + wagmi` or `Express + fetch` suite is green but the modern web framework introduces a runtime characteristic the existing mocks do not capture. This concept doc is the SSOT for those four axes; the tutorials and dogfood apps are the concrete implementations.

## Axis 1 — Signal-based fine-grained reactivity (SolidJS)

React and Solid share the same JSX syntax and the same "component returns a tree" mental model. Everything below that is different — React's Virtual DOM re-renders the whole component on every state change and diffs the tree, while Solid's Signal-based reactivity re-runs **only the closures that read the signal that wrote**.

That divergence matters for tests because Solid bugs look like:

- "The effect body captured a stale signal read" — the effect subscribed at mount but the signal getter it read went out of scope
- "Two writes fired the effect twice instead of once" — `batch()` was missing, or the batch scope leaked outside the write group
- "The Suspense boundary showed `fallback` forever" — the resource state stayed on `pending` because the fetcher promise was replaced without a `refetch()`

kiwa surfaces the pattern in three places.

- `mockSignal(initial)` — returns a `[getter, setter]` pair. The setter is `Object.is`-guarded so writing the same value is a no-op, and NaN writes are treated as equal to NaN (matches Solid's real behaviour).
- `mockEffect(fn)` — runs `fn` synchronously on creation and re-runs it whenever a signal read inside the closure writes. Returns an `EffectHandle` with `.trace()` for observability, `.runCount()` for assertion, and `.dispose()` for cleanup.
- `createResourceStub(fetcher)` — awaits the fetcher, exposes a `resource()` accessor + `resource.state` + `refetch()` + `mutate()`. The five-state lifecycle (`unresolved / pending / ready / refreshing / errored`) matches real Solid, so a test asserting `expect(accessor.state).toBe('refreshing')` mid-refetch catches a stuck state machine.

The **contract** each helper enforces is symmetric — every `signal` write triggers exactly one `effect` re-run per subscribed closure, every `batch` scope flushes exactly once regardless of nesting, and every `resource` refetch transitions `ready → refreshing → ready` on success or `ready → refreshing → errored` on throw. Mock components implement the same shape so a fidelity harness can diff mock vs a real Solid runtime run on the same 4-op trace.

### Why fine-grained matters more than Virtual DOM diff

The classic React pattern "the component re-renders on every state change and React diffs the output" costs ~200 μs per re-render even with `memo`. Solid's fine-grained rebuild is closer to 5 μs — but only if the effect subscribed exactly the signals it needed. Over-subscribe (touch every signal in the store) and Solid becomes React with extra syntax. Under-subscribe (miss a signal that should have triggered a re-run) and the UI silently shows stale data.

`mockEffect(fn).trace()` records the `readValues` array on every re-run. That means the test asserts on both dimensions — the exact re-run count via `handle.runCount()` and the exact values read via `trace().map((e) => e.readValues)`. Under-subscription surfaces as a missing re-run; over-subscription surfaces as an unexpected re-run row.

## Axis 2 — Islands architecture + partial hydration (Fresh)

Deno Fresh (Deno.land's SSR framework) diverges from Next.js on one axis that shows up in every non-trivial test — routes render **entirely** on the server and only components explicitly marked as islands ship JavaScript to the client. Next.js hydrates the whole tree; Fresh hydrates only the islands, and each island receives its props through a `data-props` blob serialized into the SSR HTML.

That divergence matters for tests because Fresh bugs look like:

- "The island did not hydrate on the client because its `data-island` marker was missing"
- "The client-side island received stale props because the `data-props` blob was serialized before the loader ran"
- "The page rendered but the interactive island never mounted" — the island was registered in the layout but the placeholder was never emitted

kiwa surfaces the pattern in four places.

- `invokeFreshHandler({ handlers, req, page? })` — dispatches `GET` / `POST` / `PATCH` / `PUT` / `DELETE` handlers, surfaces thrown `redirect()` / `notFound()` signals through `result.redirect` / `result.notFound`, captures `ctx.render(data)` into `result.renderData`, and returns 405 + `Allow` header for unhandled methods.
- `defineIsland({ name, component, defaultProps? })` — brands the island definition. `islandPlaceholder(Island, props)` emits a `<div data-island="Name" data-props="...">` marker that the server sends and the client hydrator picks up.
- `hydrateIslands({ ssrTree, islands })` — walks the SSR tree, decodes each `data-props` blob, and returns `{ hydrated, missing, unregistered, html }`. `missing` catches islands registered but never placed; `unregistered` catches placeholders referencing an unregistered island.
- `defineHead({ title, meta, link, script, base })` + `mergeHead(fragments[])` + `renderHead(fragment)` — Head fragment normalize. Route title wins over layout title, meta rows dedup by `name` / `property` (or singleton for `charset`), links dedup by `rel + href`, external scripts dedup by `src`.

The **contract** each helper enforces is symmetric — every island marker emitted server-side matches a hydration mount client-side, every Head fragment merges into a canonical HTML order, and every route handler either returns a Response, throws a redirect / notFound signal, or falls through to `ctx.render(data)`.

### Why Islands need dedicated hydration assertions

The Next.js pattern "hydrate everything" costs ~200 KB of JavaScript per page. Fresh's Islands pattern is closer to 5 KB per page — but only if the developer marks exactly the components that need interactivity. Over-mark (turn every static block into an island) and Fresh becomes Next.js with extra syntax. Under-mark (miss a component that should have been interactive) and the button silently does nothing.

`hydrateIslands({ ssrTree, islands }).missing` catches under-marking (an island registered in the layout but never placed on a route). `hydrateIslands({ ssrTree, islands }).unregistered` catches over-marking (a placeholder that references an island the client-side hydrator does not know about). Both classes surface at test time with the exact island name that drifted.

## Axis 3 — Edge runtime + hc RPC type-safety (HonoJS)

HonoJS is the standard on Cloudflare Workers. `hc` is Hono's typed RPC client — a Proxy that reflects the app's route tree back at the caller as a TypeScript object graph. Instead of `fetch('/users/42')` with a stringly typed URL, the caller writes `client.users[':id'].$get({ param: { id: '42' } })` and the TypeScript compiler catches param name typos, missing body fields, and method mismatches at compile time.

That divergence matters for tests because Hono + Workers bugs look like:

- "The RPC client sent an unexpected header because the client contract diverged from the server contract"
- "The middleware trace missed the auth entry because a `use()` pattern did not match the request path"
- "The handler returned 500 because a Workers env binding threw at runtime"

kiwa surfaces the pattern in three places.

- `createHonoApp()` — chainable app with every HTTP method + `use()` for middleware. `invokeRoute({ app, method, path, headers?, body? })` dispatches through the middleware chain and returns `{ matched, response, trace, error }`.
- `createRpcClient(app, { baseUrl? })` — Proxy client that mirrors the app's route tree. Terminals are `$get` / `$post` / `$put` / `$delete` / `$patch`, and every response carries `res.status` / `res.matched` / `res.error` / `res.trace` alongside `res.json()` / `res.text()`.
- `mockKVNamespace()` / `mockD1Database()` / `mockR2Bucket()` — Workers env binding mocks. `mockKVNamespace` honours `expirationTtl` by reading `Date.now`. `mockD1Database.__setResponse(sql, rows)` seeds canned rows for prepared statements. All three expose `__snapshot()` / `__log()` escape hatches.

The **contract** each helper enforces is symmetric — every middleware that matches records a trace entry, every RPC terminal call generates exactly the request shape a real `fetch(URL)` would send, and every env binding round-trips through the same put / get / delete / list / expire / snapshot surface as the real Workers runtime.

### Why edge runtime + typed RPC beats fetch mocks

The classic pattern "mock `fetch` and assert on the URL" costs ~10 lines per endpoint and breaks the moment the URL scheme changes. The RPC client keeps the caller code in sync with the server code — a route renamed on the server surfaces as a TypeScript error at the call site, before any test runs.

`client.trace` surfaces every middleware hop plus the terminal handler. When a downstream harness catches a regression the test names the exact hop that changed (e.g., `trace[0].pattern === '/api/*'` instead of the expected `/api/auth/*`).

The Workers env mocks share the same 6-op surface as the real Workers runtime, so a Layer 1 unit test asserting on the mock behaviour maps 1:1 onto a Layer 3 fidelity harness driving the same operations against `wrangler dev`. The `__snapshot()` escape hatch on every mock returns the whole store as a plain object — a test can assert on the exact key set after a batch of puts, catching leaked keys that a real KV would silently accept.

## Axis 4 — Fidelity vs cost trade-off (release gate axis)

The 3 dogfood apps (`dogfood-solidjs-signal-app` + `dogfood-fresh-islands` + `dogfood-hono-workers-rpc`) each produce a **fidelity report** that measures the mock behaviour against the real runtime. The report walks the same trace shape through both surfaces and computes a fidelity ratio in `[0, 1]`.

Three properties are load-bearing.

- **Fidelity ≥ 0.7 is the release-gate floor.** Below that the mock is lying to the caller — a test that passes against the mock but fails against a real runtime tells the reviewer the mock needs work.
- **Fidelity 1.0 is a warning sign, not a goal.** A mock that reproduces the real runtime byte-for-byte is either a real runtime in disguise (slow) or a mock that tracks every irrelevant timing detail (brittle). The target is 0.85–0.95 with intentional divergence documented per axis.
- **The fidelity harness runs Layer 3, not Layer 1.** Layer 1 (unit tests) drives the mock. Layer 3 (fidelity harness) drives both mock and real, diffs traces, and emits the fidelity ratio. Layer 2 (integration) rides on the mock — the fidelity harness is what tells the reviewer the mock is worth riding on.

The `evaluateReleaseGate` 11-axis contract reads the fidelity ratio through the common 7-axis branch, alongside coverage / test count / perf p95 / mutation kill rate. The AI-LLM 4 axes (cost / latency / token / accuracy) do not apply to modern web framework surfaces — there is no token pricing to measure.

## Assertion patterns

The 4 axes produce four assertion patterns.

- **Signal + Effect trace assertions** — every effect re-run appends a `{ readValues }` row to `handle.trace()`, and the assertion is `expect(handle.trace().map((e) => e.readValues[0])).toEqual([1, 2, 3])`. This catches "the effect body captured a stale signal read".
- **Island hydration assertions** — every `data-island` placeholder that ships from the server matches a hydration mount client-side, and `hydrateIslands` returns `{ hydrated, missing, unregistered }`. The assertion is `expect(missing).toEqual([])` + `expect(unregistered).toEqual([])`. Missing islands → under-mark; unregistered placeholders → over-mark.
- **RPC middleware trace assertions** — every middleware that matches records a `{ kind, pattern }` entry in `result.trace`. The assertion is `expect(trace.map((e) => e.kind)).toEqual(['middleware', 'handler'])`. This catches "the auth middleware silently short-circuited without recording a reason".
- **Fidelity ratio assertions** — the release gate reads `fidelity.ratio >= 0.7`. Below the threshold the deploy is blocked. Above it the mock is trusted enough to run in unit-test frequency.

All four patterns are pure — they add no runtime overhead beyond the mock call. The test grows one function call per assertion and gains a machine-verifiable contract.

## Test count baseline

The v1.19 dogfood harness ships the following behaviour test counts per axis.

- Axis 1 (Signal reactivity) — `packages/solidjs/tests/signal.test.ts` × 18 + `packages/solidjs/tests/render.test.ts` × 14 + `packages/solidjs/tests/route.test.ts` × 12 = **44 tests**
- Axis 2 (Islands + partial hydration) — `packages/fresh/tests/route.test.ts` × 26 + `packages/fresh/tests/islands.test.ts` × 16 + `packages/fresh/tests/head.test.ts` × 10 = **52 tests**
- Axis 3 (edge runtime + hc RPC + Workers env) — `packages/hono/tests/app.test.ts` × 30 + `packages/hono/tests/rpc.test.ts` × 12 + `packages/hono/tests/workers.test.ts` × 32 = **74 tests**
- Axis 4 (fidelity ratio) — 3 dogfood apps × 3-5 scenarios each + Layer 3 fidelity walker = **12–15 tests**

Every count sits above the 10-test release-gate floor so the 11-axis check passes without special-casing the modern web framework surfaces.

## References

- [Tutorial 28 — SolidJS Signal + Effect + Resource + Suspense](../tutorials/28-solidjs-signal-app)
- [Tutorial 29 — Fresh Islands + Route Handler + Head normalize](../tutorials/29-fresh-islands)
- [Tutorial 30 — HonoJS + hc RPC type-safe client + Workers env (KV / D1 / R2)](../tutorials/30-hono-workers-rpc)
- [Migration v1.18 → v1.19](../migrations/v1.18-to-v1.19)
- v1.14 baseline — [Testing Next.js Server Actions with @kiwa-lab/nextjs](../tutorials/04-nextjs-server-actions)
