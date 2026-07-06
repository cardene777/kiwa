# dogfood-nextjs-server-action-app (v1.34-3)

A Next.js 15.4 + React 19.1 App Router app that drives Server Action + form action + useFormStatus + useOptimistic + revalidatePath + revalidateTag + redirect + progressive enhancement across a provider-neutral `ServerActionAdapter`. Both mock (`@kiwa-test/component` v0.3 form-action-advanced semantics + `@kiwa-test/nextjs` v1.2 server-action-advanced semantics) and real (Playwright + Chromium headless when `SERVER_ACTION_BROWSER_READY=1`) implementations satisfy the same 15-op contract so the fidelity harness can diff them side by side.

## Run

```bash
pnpm --filter dogfood-nextjs-server-action-app test
pnpm --filter dogfood-nextjs-server-action-app test:e2e
```

The vitest suite drives the mock adapter through the same subscribe / like / login handlers the Next.js runtime mounts in production. The Playwright suite additionally spawns a BrowserContext against a minimal HTTP server so real browser origin regression is captured.

## Real mode (opt-in)

```bash
export KIWA_MODE=real
export SERVER_ACTION_BROWSER_READY=1
pnpm --filter dogfood-nextjs-server-action-app test
```

The real adapter defers the Playwright + Chromium browser session wiring to a follow-up milestone. Until `SERVER_ACTION_BROWSER_READY=1` is set (which every non-integration environment leaves unset), every real op refuses with `KIWA_SERVER_ACTION_ENV_MISSING`. The fidelity harness records those refusals as behavioral divergences — this is expected in the real-mode-skipped baseline.

## Adapter contract

`ServerActionAdapter` covers 15 ops across 3 domain surfaces + 3 axes.

- **subscribe surface (server-action-advanced axis: form action + revalidatePath)**
  - `startSubscribe` — begin a subscribe form action session
  - `submitSubscribe` — submit the form action (fields captured)
  - `revalidateSubscribePath` — call revalidatePath after successful submit
- **like surface (form-action-advanced axis: useFormStatus + useOptimistic + revalidateTag)**
  - `startLike` — begin a like form action session
  - `markLikePending` — mark useFormStatus pending
  - `applyOptimisticLike` — apply useOptimistic patch
  - `submitLike` — submit the underlying server action
  - `revalidateLikeTag` — call revalidateTag after successful submit
  - `resolveLike` — resolve or reject the optimistic patch
- **login surface (form-action-advanced + server-action-advanced axes: progressive enhancement + redirect)**
  - `startLogin` — begin a login form action session
  - `enhanceLogin` — enable progressive enhancement (JS-off fallback)
  - `markLoginPending` — mark useFormStatus pending
  - `submitLogin` — submit the underlying server action
  - `redirectLogin` — call redirect() after successful submit
  - `resolveLogin` — resolve or reject the session

## Fidelity report

The vitest suite writes `quality-report/fidelity-latest.md` + `quality-report/fidelity-latest.json` that `@kiwa-test/quality-metrics` picks up for the 13-axis release gate. The doc counterpart lives at `docs/quality-reports/component/nextjs-server-action-app.md`.
