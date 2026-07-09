# Fidelity — dogfood-solidjs-signal-app (v1.19-2)

Real-vs-mock behavioural fidelity for the SolidJS Signal-based reactivity harness driven by `@kiwa-lab/solidjs` under mock-mode + real-mode env-skip, produced by `examples/dogfood-solidjs-signal-app/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa-lab/quality-metrics` release-gate 7-axis payload as the first modern-framework dogfood alongside `dogfood-storybook-design-system` (v1.16-2, Storybook 8 + Component test) and `dogfood-dapp-e2e-reorg` (v1.18-4, dApp e2e).

## Baseline (real mode skipped — `SOLID_LIVE` unset)

When the harness runs without `SOLID_LIVE=1` in the environment, the real adapter emits `SOLID_REAL_ENV_MISSING` for each of the six ops (`mountCounter` / `driveCounter` / `mountTodos` / `driveTodos` / `mountResource` / `driveSuspense`). Divergences are recorded so the mock is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-lab/solidjs/signal-app
version    : 0.1.0
verdict    : PASS
divergences: 6 (all six ops recorded as BEHAVIORAL_DIVERGENCE, real mode absent)
axes       : 7 (framework branch — common 7-axis release gate)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (6/6) | 70% | pass |
| perf.p95Ms | ~1.3 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 35 | 10 | pass |

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path emitted `SOLID_REAL_ENV_MISSING` — this is the expected shape in a real-mode-skipped baseline. It does not fail the gate; the fidelity ratio measures the mock-covered surface area, which is 100% for the six ops the AC scopes.

## Reproduction

Common integration path (mock + graceful-skip real).

```bash
pnpm --filter dogfood-solidjs-signal-app test
cat examples/dogfood-solidjs-signal-app/quality-report/fidelity-latest.md
```

Live real-mode (real `solid-js` + `solid-testing-library` — env-skip unless the driver is opted in).

```bash
export SOLID_LIVE=1
pnpm --filter dogfood-solidjs-signal-app test
# The v0.1 dogfood ships the skip path only; a follow-up milestone swaps
# in a real solid-testing-library driver behind the same env gate.
```

## 3 store patterns exercised

| store | reactive primitive | invariant asserted |
|---|---|---|
| Counter | `createSignal<number>` + `createEffect` | initial + N increments = `runCount = N + 1`, `Object.is` short-circuits identical writes |
| Todos | `createSignal<Todo[]>` + `batch()` | fine-grained `add()` = 1 re-run, `markAll(true)` batches N writes into 1 re-run |
| UserProfile | `createResource<Profile>` | `unresolved -> pending -> ready` / `errored`, `refetch()` transitions through `refreshing` |

## Suspense boundary

`renderWithSuspense` observes the fallback -> resolved swap plus the safety-gate `timedOut` flag. The dogfood asserts on both the happy path (fallback rendered, resolved swapped in) and the timeout path (resolved stays `null`, `timedOut = true`).

## Error boundary

`errorBoundary` catches a throw inside a component body and materializes a fallback tree. The dogfood asserts on the discriminant shape (`caught` + `fallback` fields) plus the pass-through path when no throw occurs.

## Related

- v1.19-1a `@kiwa-lab/solidjs` v0.1 (`packages/solidjs/`)
- v1.11-1 `@kiwa-lab/quality-metrics` (`packages/quality-metrics/`)
- v1.19 milestone parent [#806](https://github.com/cardene777/kiwa/issues/806), this sub [#808](https://github.com/cardene777/kiwa/issues/808)
