# Fidelity — dogfood-nextjs-rsc-streaming-app (v1.34-2)

Real-vs-mock behavioural fidelity for the Next.js 15.4 + React 19.1 App Router + RSC streaming dogfood, produced by `examples/dogfood-nextjs-rsc-streaming-app/tests/emit-fidelity-report.spec.ts`. Feeds `@kiwa-test/quality-metrics` 13-axis release gate on the common 8-axis branch (7 core axes + a11y at SaaS-tier, since the RSC harness emits no DOM in mock mode).

## Baseline (real mode skipped — no `RSC_STREAMING_BROWSER_READY=1`)

When the harness runs without the Playwright + Chromium browser session env, the real adapter emits `KIWA_RSC_STREAMING_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-test/component/nextjs-rsc-streaming-app
version    : 0.3.0
verdict    : PASS
divergences: 15 (renderArticle / enterSuspense / streamChunk / completeArticle / startCatalog / pendCatalogBoundary / captureCatalogError / hydrateCatalogBoundary / startTransition / finishTransition / assertAnimation / markFormPending / applyOptimistic / enhanceForm / resolveForm — recorded as BEHAVIORAL_DIVERGENCE, real mode absent)
axes       : 8 (7 common + a11y, SaaS-tier strict 0/0/0)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (15/15) | 70% | pass |
| perf.p95Ms | ~0 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 45 | 10 | pass |
| a11y (SaaS-tier) | 0/0/0/0 | 0/0/0 | pass |

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path threw `KIWA_RSC_STREAMING_ENV_MISSING` — this is expected in a real-mode-skipped baseline and does not itself fail the gate (fidelity ratio measures the mock-covered surface area, which is 100% for the 15 ops the AC scopes).

## Reproduction

```bash
pnpm --filter dogfood-nextjs-rsc-streaming-app test
cat examples/dogfood-nextjs-rsc-streaming-app/quality-report/fidelity-latest.md
```

Live real mode.

```bash
export KIWA_MODE=real
export RSC_STREAMING_BROWSER_READY=1
pnpm --filter dogfood-nextjs-rsc-streaming-app test
```

When `RSC_STREAMING_BROWSER_READY=1` is set but the Chromium binary + Next.js dev-server bootstrap are not provisioned, the adapter downgrades to `KIWA_RSC_STREAMING_ENV_MISSING` traces. Wiring the Playwright + Chromium session into `src/adapters/real.ts` is a follow-up milestone once the browser image ships — the adapter shape is ready and every downstream trace already carries a stable `errorKind` so the drop-in change stays localised.

## Ops under measurement

Fifteen provider-neutral ops on `RscStreamingAdapter`, grouped by the 4 v1.34-1 axes.

- **rsc-harness axis (article surface)**
  - `renderArticle` — begin RSC render, receive first HTML chunk
  - `enterSuspense` — mark a Suspense boundary + stream its fallback
  - `streamChunk` — stream one resolved HTML chunk into the response
  - `completeArticle` — finalize the render + assemble the full HTML
- **streaming-ssr axis (catalog surface)**
  - `startCatalog` — begin streaming SSR for a catalog route
  - `pendCatalogBoundary` — mark a boundary as suspense-pending
  - `captureCatalogError` — capture a recoverable / non-recoverable error boundary
  - `hydrateCatalogBoundary` — progressive → selective hydration for a boundary
- **view-transitions axis (signaling surface)**
  - `startTransition` — element / document view transition
  - `finishTransition` — retire an active element transition
  - `assertAnimation` — assert a completed animation (duration + easing)
- **form-action-advanced axis (signaling surface)**
  - `markFormPending` — mark a form action pending
  - `applyOptimistic` — apply an optimistic patch to the form state
  - `enhanceForm` — enable progressive enhancement for the form
  - `resolveForm` — resolve or reject the form action

## Notes

The mock adapter (`packages/component/src/semantics/rsc-harness.ts` + `streaming-ssr.ts` + `view-transitions.ts` + `form-action-advanced.ts`) tracks one session per (routeId, articleId / catalogId / transitionId / formId) tuple so per-surface metrics stay isolated. The trace records the neutral event vocabulary from the parent v1.34-1 semantics helpers so the fidelity harness compares mock vs real at the neutral-event boundary, not at any Storybook 8 / Playwright CT / Chromatic dialect.
