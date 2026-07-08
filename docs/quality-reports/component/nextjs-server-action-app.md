# Fidelity — dogfood-nextjs-server-action-app (v1.34-3)

Real-vs-mock behavioural fidelity for the Next.js 15.4 + React 19.1 App Router + Server Action dogfood, produced by `examples/dogfood-nextjs-server-action-app/tests/emit-fidelity-report.spec.ts`. Feeds `@kiwa/quality-metrics` 13-axis release gate on the common 8-axis branch (7 core axes + a11y at SaaS-tier, since the Server Action harness emits no DOM in mock mode).

## Baseline (real mode skipped — no `SERVER_ACTION_BROWSER_READY=1`)

When the harness runs without the Playwright + Chromium browser session env, the real adapter emits `KIWA_SERVER_ACTION_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa/component/nextjs-server-action-app
version    : 0.3.0
verdict    : PASS
divergences: 15 (startSubscribe / submitSubscribe / revalidateSubscribePath / startLike / markLikePending / applyOptimisticLike / submitLike / revalidateLikeTag / resolveLike / startLogin / enhanceLogin / markLoginPending / submitLogin / redirectLogin / resolveLogin — recorded as BEHAVIORAL_DIVERGENCE, real mode absent)
axes       : 8 (7 common + a11y, SaaS-tier strict 0/0/0)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 93.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (15/15) | 70% | pass |
| perf.p95Ms | ~0 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 40 | 10 | pass |
| a11y (SaaS-tier) | 0/0/0/0 | 0/0/0 | pass |

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path threw `KIWA_SERVER_ACTION_ENV_MISSING` — this is expected in a real-mode-skipped baseline and does not itself fail the gate (fidelity ratio measures the mock-covered surface area, which is 100% for the 15 ops the AC scopes).

## Reproduction

```bash
pnpm --filter dogfood-nextjs-server-action-app test
cat examples/dogfood-nextjs-server-action-app/quality-report/fidelity-latest.md
```

Live real mode.

```bash
export KIWA_MODE=real
export SERVER_ACTION_BROWSER_READY=1
pnpm --filter dogfood-nextjs-server-action-app test
```

When `SERVER_ACTION_BROWSER_READY=1` is set but the Chromium binary + Next.js dev-server bootstrap are not provisioned, the adapter downgrades to `KIWA_SERVER_ACTION_ENV_MISSING` traces. Wiring the Playwright + Chromium session into `src/adapters/real.ts` is a follow-up milestone once the browser image ships — the adapter shape is ready and every downstream trace already carries a stable `errorKind` so the drop-in change stays localised.

## Ops under measurement

Fifteen provider-neutral ops on `ServerActionAdapter`, grouped by the 3 v1.34-3 axes.

- **server-action-advanced axis (subscribe surface): form action + revalidatePath**
  - `startSubscribe` — begin a subscribe form action session
  - `submitSubscribe` — submit the form action (fields captured)
  - `revalidateSubscribePath` — call revalidatePath after successful submit
- **form-action-advanced axis (like surface): useFormStatus + useOptimistic + revalidateTag**
  - `startLike` — begin a like form action session
  - `markLikePending` — mark useFormStatus pending
  - `applyOptimisticLike` — apply useOptimistic patch
  - `submitLike` — submit the underlying server action
  - `revalidateLikeTag` — call revalidateTag after successful submit
  - `resolveLike` — resolve or reject the optimistic patch
- **form-action-advanced + server-action-advanced axes (login surface): progressive enhancement + redirect**
  - `startLogin` — begin a login form action session
  - `enhanceLogin` — enable progressive enhancement (JS-off fallback)
  - `markLoginPending` — mark useFormStatus pending
  - `submitLogin` — submit the underlying server action
  - `redirectLogin` — call redirect() after successful submit
  - `resolveLogin` — resolve or reject the session

## Notes

The mock adapter (`packages/component/src/semantics/form-action-advanced.ts` + `packages/nextjs/src/semantics/server-action-advanced.ts`) tracks one session per (routeId, actionId / formId) tuple so per-surface metrics stay isolated. The trace records the neutral event vocabulary from the parent v1.34-1 semantics helpers so the fidelity harness compares mock vs real at the neutral-event boundary, not at any Storybook 8 / Playwright CT / Chromatic dialect.
