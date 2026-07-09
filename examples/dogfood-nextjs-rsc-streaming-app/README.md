# dogfood-nextjs-rsc-streaming-app (v1.34-2)

A Next.js 15.4 + React 19.1 App Router app that drives RSC render + Suspense + streaming HTML chunks + selective hydration + view transitions + form action advanced across a provider-neutral `RscStreamingAdapter`. Both mock (`@kiwa-lab/component` v0.3 rsc-harness + streaming-ssr + view-transitions + form-action-advanced semantics + `@kiwa-lab/nextjs` v1.2 renderServerComponent + setupNextRscEnv helpers) and real (Playwright + Chromium headless when `RSC_STREAMING_BROWSER_READY=1`) implementations satisfy the same 15-op contract so the fidelity harness can diff them side by side.

## Run

```bash
pnpm --filter dogfood-nextjs-rsc-streaming-app test
pnpm --filter dogfood-nextjs-rsc-streaming-app test:e2e
```

The vitest suite drives the mock adapter through the same article / catalog / signaling handlers the Next.js runtime mounts in production. The Playwright suite additionally spawns a BrowserContext against a minimal HTTP server so real browser origin regression is captured.

## Real mode (opt-in)

```bash
export KIWA_MODE=real
export RSC_STREAMING_BROWSER_READY=1
pnpm --filter dogfood-nextjs-rsc-streaming-app test
```

The real adapter defers the Playwright + Chromium browser session wiring to a follow-up milestone. Until `RSC_STREAMING_BROWSER_READY=1` is set (which every non-integration environment leaves unset), every real op refuses with `KIWA_RSC_STREAMING_ENV_MISSING`. The fidelity harness records those refusals as behavioral divergences — this is expected in the real-mode-skipped baseline.

## Adapter contract

`RscStreamingAdapter` covers 15 ops across 3 domain surfaces + 4 axes.

- **article surface (rsc-harness axis)**
  - `renderArticle` — begin RSC render, receive first HTML chunk
  - `enterSuspense` — mark a Suspense boundary + stream its fallback
  - `streamChunk` — stream one resolved HTML chunk into the response
  - `completeArticle` — finalize the render + assemble the full HTML
- **catalog surface (streaming-ssr axis)**
  - `startCatalog` — begin streaming SSR for a catalog route
  - `pendCatalogBoundary` — mark a boundary as suspense-pending
  - `captureCatalogError` — capture an error boundary (recoverable or not)
  - `hydrateCatalogBoundary` — progressive → selective hydration for a boundary
- **signaling surface (view-transitions + form-action-advanced axes)**
  - `startTransition` — element / document view transition
  - `finishTransition` — retire an active element transition
  - `assertAnimation` — assert a completed animation (duration + easing)
  - `markFormPending` — mark a form action pending
  - `applyOptimistic` — apply an optimistic patch to the form state
  - `enhanceForm` — enable progressive enhancement for the form
  - `resolveForm` — resolve or reject the form action

## Fidelity report

The vitest suite writes `quality-report/fidelity-latest.md` + `quality-report/fidelity-latest.json` that `@kiwa-lab/quality-metrics` picks up for the 13-axis release gate. The doc counterpart lives at `docs/quality-reports/component/nextjs-rsc-streaming-app.md`.
