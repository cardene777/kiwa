# dogfood-solidjs-signal-app

Dogfood app (v1.19-2) — a SolidJS Signal-based reactivity harness that exercises **3 store patterns** (counter Signal / todos Signal / userProfile createResource) inside `Counter` / `TodoList` / `UserProfile` components with a **Suspense boundary + error boundary**. Drivable in both `KIWA_MODE=real` (spawns real `solid-js` + `solid-testing-library` through env-skip when `SOLID_LIVE=1`) and `KIWA_MODE=mock` (`@kiwa-lab/solidjs` `mockSignal` + `mockEffect` + `createResourceStub` + `renderWithSuspense`). Behavioural fidelity feeds `@kiwa-lab/quality-metrics` 7-axis release gate.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa-lab/solidjs` `mockSignal` + `mockEffect` + `renderSolid` + `stringify` + `renderWithSuspense`).
- `KIWA_MODE=real` — driven by `makeRealAdapter()`, which detects `SOLID_LIVE=1`. Without the env var each method reports `SOLID_REAL_ENV_MISSING` and throws `SkippedError`; with the env var each method reports `SOLID_LIVE_NOT_IMPLEMENTED` (a placeholder trace that keeps the divergence shape stable for follow-up work that swaps in a real `solid-testing-library` driver).

Real-mode envs.

- `SOLID_LIVE` — set to `1` to enable real mode (requires a workspace where `solid-js` + `solid-testing-library` are actually installed and a browser-shaped runtime is available)

## Layout

```
src/
  store/
    counter.ts         -- CounterStore = createSignal + createEffect + observed trace
    todos.ts           -- TodosStore   = createSignal<Todo[]> + batch markAll
    user-profile.ts    -- UserProfileStore = createResourceStub + refresh / mutate
  components/
    Counter.ts         -- 1 Signal read + 2 buttons (increment / reset)
    TodoList.ts        -- 1 Signal read + N li rows + 2 batch controls
    UserProfile.ts     -- Signal-driven state switch + loading / ready / error / boundary fallback
  adapters/
    interface.ts       -- provider-neutral 6-op contract
    mock.ts            -- kiwa mock adapter (@kiwa-lab/solidjs)
    real.ts            -- real solid-js adapter with env-skip when SOLID_LIVE is unset
  flows/
    signal-flows.ts    -- 4 user-facing flows (counter / todos / resource / suspense)
    fidelity.ts        -- trace-diffing harness feeding @kiwa-lab/quality-metrics
tests/
  counter-store.test.ts       -- 6 counter Signal + Effect invariants
  todos-store.test.ts         -- 6 todos batch + fine-grained update tests
  user-profile-store.test.ts  -- 6 createResource lifecycle tests
  components-render.test.ts   -- 7 component render assertions
  suspense-boundary.test.ts   -- 4 Suspense + ErrorBoundary tests
  signal-flows.test.ts        -- 5 end-to-end flow tests
  fidelity-report.test.ts     -- 3 harness contract tests
  emit-fidelity-report.test.ts -- writes the JSON + markdown snapshot (1)
  e2e-mock-mode.test.ts       -- 5 end-to-end mock-mode flows
  perf/
    dogfood-solidjs-signal-app.perf.ts -- 3-layer perf (serial + concurrent + memory)
```

## Emit a fidelity report

```bash
pnpm --filter dogfood-solidjs-signal-app test
cat examples/dogfood-solidjs-signal-app/quality-report/fidelity-latest.md
cat examples/dogfood-solidjs-signal-app/quality-report/fidelity-latest.json
```

The `quality-report/` directory is git-ignored — promote snapshots to `docs/quality-reports/framework/solidjs-signal-app.md` when they become canonical for a release.

## The 6-op Solid surface

The whole point of the signal-app dogfood is to exercise the mock's reactive surface in the exact shape a real `solid-js` + `solid-testing-library` runtime implements.

1. `mountCounter` — initialise a Counter Signal + Effect + record the initial run trace.
2. `driveCounter` — dispatch N increments and snapshot the observed value sequence + effect runCount.
3. `mountTodos` — initialise a Todos Signal with seed items and render the summary.
4. `driveTodos` — apply a mix of add / toggle / markAll batch operations and observe the effect runCount collapse.
5. `mountResource` — invoke `createResource` fetcher, walk the `unresolved -> pending -> ready` state transitions.
6. `driveSuspense` — mount a Suspense boundary that swaps `fallbackMarkup -> resolvedMarkup` when the pending promise settles.

Every method emits at least 1 trace event, so the fidelity harness can diff the mock vs the real Solid runtime without adding shape-level noise.

## Release gate (7 axes)

Because the provider string is `@kiwa-lab/solidjs/signal-app`, `evaluateReleaseGate` includes the common 7 axes (coverage 3 / fidelity / perf p95 / mutation / behavior tests). The AI-LLM 4 axes (cost / latency / token / accuracy) do not apply — Signal reactivity is not a token-priced generative surface.

- coverage — line >= 85%, branch >= 80%, function >= 90%
- fidelity — ratio >= 70% (mock covered ops / real total ops, penalised by behavioural divergences)
- perf — p95 <= 100 ms for the mount + drive round-trip
- mutation — kill rate >= 60%
- behavior tests — >= 10 (this dogfood ships 35+)

## Signal / Effect invariants

Each of the 6 signal-driven invocations exercises 1 specific reactivity contract so the fidelity harness can compare the mock's `runCount()` counter against a real Solid `createEffect` runner.

| store | invariant |
|---|---|
| Counter | initial run + N re-runs = `runCount = N + 1` |
| Counter | write with `Object.is`-equal value short-circuits (no re-run) |
| Todos | 1 `add()` = 1 re-run (fine-grained) |
| Todos | `markAll(true)` batches N writes into `+1` re-run regardless of item count |
| UserProfile | `unresolved -> pending -> ready` on the happy path, `unresolved -> pending -> errored` on throw |
| UserProfile | `refetch()` transitions `ready -> refreshing -> ready` (or `errored`) |

## Suspense boundary contract

| observation | assertion |
|---|---|
| `boundary.fallback` | rendered before `waitFor` settles |
| `boundary.resolved` | swapped in after `waitFor` resolves, `null` if `timedOut` |
| `boundary.timedOut` | `true` when `waitFor` takes longer than `timeoutMs` |

## Related

- v1.19-1a `@kiwa-lab/solidjs` v0.1 (`packages/solidjs/`)
- v1.11-1 `@kiwa-lab/quality-metrics` (`packages/quality-metrics/`)
- v1.19 milestone parent [#806](https://github.com/cardene777/kiwa/issues/806), this sub [#808](https://github.com/cardene777/kiwa/issues/808)
