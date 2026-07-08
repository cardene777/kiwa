# dogfood-fresh-islands

Dogfood app (v1.19-3) — a Deno Fresh Islands + Route Handler + partial hydration + edge runtime harness that exercises **4 flows** (route Handler dispatch / defineRoute page tree / island mount + interaction / Head merge + edge env) inside `GreetRoute` / `Counter Island` / `TodoList Island` / `SiteHead` components. Drivable in both `KIWA_MODE=real` (spawns real Deno Fresh + `fresh-testing-library` through env-skip when `DENO_INSTALLED=1`) and `KIWA_MODE=mock` (`@kiwa/fresh` `invokeFreshHandler` + `invokeDefineRoute` + `hydrateIslands` + `simulateInteraction` + `mergeHead`). Behavioural fidelity feeds `@kiwa/quality-metrics` 7-axis release gate.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa/fresh` `invokeFreshHandler` + `invokeDefineRoute` + `hydrateIslands` + `simulateInteraction` + `mergeHead` + `renderHead` + `withEdgeEnv`).
- `KIWA_MODE=real` — driven by `makeRealAdapter()`, which detects `DENO_INSTALLED=1`. Without the env var each method reports `FRESH_REAL_ENV_MISSING` and throws `SkippedError`; with the env var each method reports `FRESH_LIVE_NOT_IMPLEMENTED` (a placeholder trace that keeps the divergence shape stable for follow-up work that swaps in a real `fresh-testing-library` driver).

Real-mode envs.

- `DENO_INSTALLED` — set to `1` to enable real mode (requires a workspace where Deno is actually installed and `fresh-testing-library` can be resolved)

## Layout

```
src/
  routes/
    greet.ts               -- greetHandlers (GET / POST) + greetDefineRoute + greetPage
  islands/
    counter-island.ts      -- CounterIsland (click → increment side-effect state)
    todo-list-island.ts    -- TodoListIsland (input → draft + submit → append)
  head/
    site-head.ts           -- defineSiteHead / defineRouteHead / defineIslandHead + buildSiteHead
  edge/
    env-mock.ts            -- withEdgeEnv (Deno.env + Deno.serve mock) + sampleEdgeHandler
  adapters/
    interface.ts           -- provider-neutral 6-op contract
    mock.ts                -- kiwa mock adapter (@kiwa/fresh)
    real.ts                -- real Deno Fresh adapter with env-skip when DENO_INSTALLED is unset
  flows/
    fresh-flows.ts         -- 4 user-facing flows (route / island / head / edge)
    fidelity.ts            -- trace-diffing harness feeding @kiwa/quality-metrics
tests/
  greet-route.test.ts          -- 8 defineRoute + Handler invariants
  counter-island.test.ts       -- 6 Counter island mount + hydrate + interaction tests
  todo-list-island.test.ts     -- 6 TodoList island tests (input / submit / dedup)
  site-head.test.ts            -- 7 Head merge + dedup tests
  edge-env.test.ts             -- 6 edge runtime env mock tests
  fresh-flows.test.ts          -- 5 end-to-end flow tests
  fidelity-report.test.ts      -- 3 harness contract tests
  emit-fidelity-report.test.ts -- writes the JSON + markdown snapshot (1)
  e2e-mock-mode.test.ts        -- 5 end-to-end mock-mode flows
  perf/
    dogfood-fresh-islands.perf.ts -- 3-layer perf (serial + concurrent + memory)
```

## Emit a fidelity report

```bash
pnpm --filter dogfood-fresh-islands test
cat examples/dogfood-fresh-islands/quality-report/fidelity-latest.md
cat examples/dogfood-fresh-islands/quality-report/fidelity-latest.json
```

The `quality-report/` directory is git-ignored — promote snapshots to `docs/quality-reports/framework/fresh-islands.md` when they become canonical for a release.

## The 6-op Fresh surface

The whole point of the fresh-islands dogfood is to exercise the mock's Fresh surface in the exact shape a real Deno Fresh + `fresh-testing-library` runtime implements.

1. `mountRoute` — invoke a `defineRoute`-wrapped page under a synthesized `ctx` (params / url / state) and capture the returned tree + HTML.
2. `driveHandler` — dispatch a Fresh `Handlers` object by HTTP method, capture `ctx.render(data)` and the resulting HTML / status.
3. `mountIsland` — walk an SSR tree containing `<div data-island="Name">`, hydrate the matching island definition, and capture the mounted HTML + collected event handlers.
4. `driveInteraction` — dispatch a synthetic click / input / submit event against a mounted island and observe the handler invocations + `preventDefault` calls + out-of-tree state mutation.
5. `mountHead` — merge N `<Head>` fragments (site / route / island) with the canonical dedup rules (title last-wins, meta by name, link by rel+href).
6. `driveEdgeEnv` — install a mocked Deno global (`Deno.env.get` / `Deno.serve`) around a handler call, capture which env keys were read + how many serve calls happened.

Every method emits at least 1 trace event, so the fidelity harness can diff the mock vs the real Deno Fresh runtime without adding shape-level noise.

## Release gate (7 axes)

Because the provider string is `@kiwa/fresh/islands-app`, `evaluateReleaseGate` includes the common 7 axes (coverage 3 / fidelity / perf p95 / mutation / behavior tests). The AI-LLM 4 axes (cost / latency / token / accuracy) do not apply — Route Handler + Islands are not token-priced generative surfaces.

- coverage — line >= 85%, branch >= 80%, function >= 90%
- fidelity — ratio >= 70% (mock covered ops / real total ops, penalised by behavioural divergences)
- perf — p95 <= 100 ms for the mount + drive round-trip
- mutation — kill rate >= 60%
- behavior tests — >= 10 (this dogfood ships 34+)

## Route + Handler invariants

Each of the 6 Fresh-driven invocations exercises 1 specific Fresh contract so the fidelity harness can compare the mock's behaviour against a real Deno Fresh runner.

| surface | invariant |
|---|---|
| Route (defineRoute) | ctx.params.name > ctx.url.searchParams.get('name') > default 'world' |
| Route (defineRoute) | route path is passed through to the page component |
| Handler GET | ctx.render(data) captures data + status defaults to 200 |
| Handler POST | JSON body { name } decodes into data.name |
| Handler unknown method | 405 with `allow` header listing available methods |
| Islands | placeholder `<div data-island="Name">` hydrates + returns mount handlers |
| Islands | simulateInteraction invokes every collected handler once |
| Head | 3 fragments merge into canonical (title last-wins, meta by name, link by rel+href) |
| Edge env | Deno.env.get returns injected env, Deno.serve counter increments |
| Edge env | denoInstalled=false removes the global entirely |

## Head merge contract

| observation | assertion |
|---|---|
| `merged.title` | last non-empty fragment title wins across N inputs |
| `merged.meta` | dedup by `name` / `property` / `httpEquiv`, later wins |
| `merged.link` | dedup by `rel + href`, first wins for identical pairs |
| `merged.html` | canonical order = title → base → meta → link → script |

## Related

- v1.19-1b `@kiwa/fresh` v0.1 (`packages/fresh/`)
- v1.11-1 `@kiwa/quality-metrics` (`packages/quality-metrics/`)
- v1.19 milestone parent [#806](https://github.com/cardene777/kiwa/issues/806), this sub [#809](https://github.com/cardene777/kiwa/issues/809)
