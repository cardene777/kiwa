# Frontend real-driver testing — 8 axis × 3 target = 24 cell grid + browser-shaped env-gate (SSOT)

kiwa's v1.16 component work covered the **6 base axes** (story registration / args resolution / play function / mount / a11y / visual regression) as unified mocks for Storybook 8 + Playwright Component Testing + Chromatic — the `docs/concepts/component-testing.md` doc is the SSOT for those 6 axes. v1.34 adds **8 advanced axes on top of that base** — the ones production frontend stacks hit once their mock-only Storybook suite is green but real React 19 + Next.js 15 behavior (RSC streaming with Suspense fallbacks, view transitions during navigation, form actions with useOptimistic + useFormStatus, revalidatePath + revalidateTag + redirect from Server Actions) starts showing up in Playwright regression reports. This concept doc is the SSOT for those 8 axes; the tutorials (67-69) and dogfood app new (v1.34-2/3/4) are the concrete implementations.

## The 8-axis grid

The 8 advanced axes are cover-oriented — each one names a real-world failure surface every non-trivial React 19 + Next.js 15 stack hits within the first month.

| Axis | Real-world failure it catches | v0.3 / v1.2 API |
|---|---|---|
| RSC harness | "Server Component streamed HTML but the Suspense fallback never got replaced by the resolved chunk" (no boundary tracking, no chunk order assertion) | `startRscHarness` / `beginRscRender` / `enterSuspenseBoundary` / `streamHtmlChunk` / `completeRscRender` |
| Streaming SSR | "Selective hydration finished 3 boundaries but the 4th stayed pending forever because the error boundary swallowed it" (no per-boundary state machine, no error correlation) | `startStreamingSsr` / `markSuspensePending` / `captureErrorBoundary` / `startProgressiveHydration` / `completeSelectiveHydration` |
| View transitions | "The document transition started but the element transition never finished because we forgot to await the animation promise" (no per-element tracking, no assertion timing) | `startViewTransitionSession` / `startElementTransition` / `finishElementTransition` / `startDocumentTransition` / `assertAnimation` |
| Form action advanced | "useOptimistic patched the UI but the resolved Server Action returned a different shape and the optimistic patch stuck" (no patch ledger, no resolved-vs-optimistic diff) | `startFormActionSession` / `markFormStatusPending` / `applyOptimisticUpdate` / `enableProgressiveEnhancement` / `resolveFormAction` / `rejectFormAction` |
| Server action advanced | "The Server Action revalidated the wrong path because the tag string was typoed" (no path prefix guard, no tag-vs-path enforcement) | `startServerActionAdvanced` / `submitFormAction` / `revalidateActionPath` / `revalidateActionTag` / `redirectAction` |
| Partial prerendering | "The static shell rendered but the dynamic hole never flushed because Suspense boundary was outside the shell" (no shell-vs-hole boundary check, no streaming assertion) | `startPartialPrerendering` / `renderStaticShell` / `openDynamicHole` / `flushStreamingBoundary` / `completePartialPrerendering` |
| Interception routes | "The modal opened via intercept.modal_opened but the current-segment matcher swallowed the wrong path prefix" (no matcher unit test, no segment-level assertion) | `startInterceptionRoutes` / `interceptCurrentSegment` / `interceptParentSegment` / `interceptRootCatchall` / `openInterceptedModal` |
| Parallel routes advanced | "The default slot rendered but the loading slot never showed because we forgot to add loading.tsx" (no slot state machine, no loading-vs-default enforcement) | `startParallelRoutesAdvanced` / `renderDefaultSlot` / `renderLoadingState` / `captureParallelError` / `navigateSlot` |

Each axis has 3 shapes — a mock-only path (fast inner loop, ms scale), a real-driver path (`KIWA_MODE=real` + Playwright + Chromium browser session, seconds scale), and a fidelity assertion that the two produce the same output. Tutorial 67 covers the RSC + streaming SSR + view-transitions axes for the Next.js 15 App Router dogfood app, tutorial 68 covers form-action-advanced + server-action-advanced for the Server Action dogfood app, tutorial 69 covers all 4 component axes exercised through Storybook 8 + MDX + interaction test + coverage report.

## The 3-target × 8-axis = 24 cell grid

Every target covers every axis. The mock shapes are target-neutral (the API surface is the same across Storybook 8 / Playwright CT / Chromatic for component axes, App Router / Pages Router / Edge Runtime for Next.js axes), the emitted event dialects are target-specific (`storybook.suspense.fallback` vs `pwct.locator.suspense.fallback` vs `chromatic.capture.suspense`), and the fidelity harness reports the coverage explicitly.

**Component 4 axis × 3 target grid (12 cells).**

| Target | 1 RSC | 2 SSR | 3 View | 4 Form |
|---|---|---|---|---|
| Storybook 8 | implemented | implemented | implemented | implemented |
| Playwright CT | implemented | implemented | implemented | implemented |
| Chromatic | implemented | implemented | implemented | implemented |

**Next.js 4 axis × 3 target grid (12 cells).**

| Target | 1 Server Action | 2 PPR | 3 Intercept | 4 Parallel |
|---|---|---|---|---|
| App Router | implemented | implemented | implemented | implemented |
| Pages Router | implemented | implemented | implemented | implemented |
| Edge Runtime | implemented | implemented | implemented | implemented |

Unlike v1.31 streaming (where NATS has no Kafka wire protocol, so 6 of 24 cells are `not-applicable`), the v1.34 frontend grid is fully covered — every target implements every axis because the semantics are runtime-agnostic. That is what makes cross-target reuse (a story that runs under Storybook 8 + Playwright CT + Chromatic without change) even possible.

### Why the frontend grid is fully covered while streaming is not

React 19 + Next.js 15 landed the same semantics (RSC streaming, Suspense boundary, view transitions, Server Actions with revalidatePath / revalidateTag / redirect) across App Router + Pages Router + Edge Runtime — the runtime surface converged at the framework level. Storybook 8 + Playwright CT + Chromatic each expose the same 4 component axes through different rendering pipelines but with the same neutral events. The v1.34 fidelity grid at 24/24 = 100 % implemented reflects that convergence at the framework surface.

## The `KIWA_MODE=real` env-gate contract

`resolveMode(target, env)` returns `{ mode: 'real', reason: 'kiwa-mode-real' }` when both `env.KIWA_MODE === 'real'` and the target's required env is present. `assertMode(target, 'real', env)` throws when the env is not configured — the dogfood apps use this at startup.

Per-target env mapping.

- **RSC streaming dogfood** → `RSC_STREAMING_BROWSER_READY=1` (Playwright + Chromium browser session ready)
- **Server Action dogfood** → `SERVER_ACTION_BROWSER_READY=1` (Playwright + Chromium browser session ready)
- **Storybook 8 MDX dogfood** → `STORYBOOK_URL` + `STORYBOOK_MDX_READY=1` + `STORYBOOK_TEST_READY=1` (Storybook 8 server + MDX doc + interaction runner all ready)

A test that respects the contract runs the mock path unconditionally and the real-driver path only when both `KIWA_MODE=real` and the required env are present. That means CI stays cheap by default (mock only, ms scale), the nightly Playwright job flips both envs (real browser + real Storybook server), and the fidelity harness ties the two together.

Absent env means silently fall back to mock mode with a target-specific `_ENV_MISSING` reason (`KIWA_RSC_STREAMING_ENV_MISSING` / `KIWA_SERVER_ACTION_ENV_MISSING` / `STORYBOOK_MDX_REAL_ENV_MISSING`). Absent `KIWA_MODE` means fall back with `reason: 'default-mock'`. An invalid `KIWA_MODE` value (anything other than `real` or `mock`) reports `reason: 'invalid-mode'` — the fallback is still mock so a typo does not break tests.

## The dogfood app new pattern

The 3 dogfood apps (v1.34-2/3/4) each expose a `pnpm test:real` command that flips `KIWA_MODE=real` and routes through the browser session.

- `examples/dogfood-nextjs-rsc-streaming-app` new — Next.js 15.4 App Router + React 19.1 + RSC + Suspense + view transitions + form action advanced + Playwright e2e that walks the streaming flow (article render → catalog Suspense boundary → view transition → form action submit → optimistic patch → resolve).
- `examples/dogfood-nextjs-server-action-app` new — Next.js 15.4 + Server Actions + useFormStatus + useOptimistic + revalidatePath + revalidateTag + redirect + progressive enhancement + Playwright e2e that walks the form flow (subscribe → like optimistic → login redirect → all 3 surface revalidate).
- `examples/dogfood-storybook-8-mdx-app` new — Storybook 8 + MDX doc + interaction runner + coverage reporter + a11y checker + Playwright e2e that walks the story flow (12 primitive + 3 layout + 5 interaction focus story → MDX render → play interaction → a11y assert → coverage report).

The pattern each new app follows.

1. Keep the mock-only path (`pnpm test`) green — the fast inner loop stays sub-second.
2. Add a `pnpm test:e2e` command that spins Playwright + Chromium and walks the real browser flow.
3. Add a `pnpm test:real` command that requires the browser-ready env (`RSC_STREAMING_BROWSER_READY=1` / `SERVER_ACTION_BROWSER_READY=1` / `STORYBOOK_MDX_READY=1` + `STORYBOOK_TEST_READY=1`) and routes through the real Storybook + Playwright session.
4. Run the same fidelity-harness assertions against the real driver; failure means "the mock diverged from real browser behavior" — the mock gets the fix.
5. Emit a `quality-report/fidelity-latest.md` + `.json` that the v1.29 3-layer defensive structure (release-invariants + docs-e2e + release-smoke) picks up on merge.

## The `not-implemented` failure mode

If the fidelity harness has a `planned` cell, the corresponding tutorial + dogfood + snippet-validation-test trio does not exist yet. The 24-cell grid at v1.34 has 0 `planned` cells — every intended cell is `implemented`. When a future milestone adds a 9th axis (e.g., `react-19-actions-hook` or `next-15-typed-routes`), it will start as `planned` for all 3 targets, then transition to `implemented` for the ones that cover it as the milestone lands its tutorial + dogfood + snippet test.

## How this ties into the 13-axis release gate

v1.34 does not add a 14th release-gate axis. The 8 advanced frontend axes gate the component + nextjs package's own tests (via `pnpm --filter @kiwa-test/component test` and `pnpm --filter @kiwa-test/nextjs test`) but do not surface as a per-package `@kiwa-test/quality-metrics` axis. The reasoning — the fidelity harness is target-shape-specific, and a package that does not use Storybook 8 / Playwright CT / Chromatic or App Router / Pages Router / Edge Runtime has nothing to assert on. When a future milestone adds a `frontend.fidelity` axis that describes "which frontend targets this package's tests hit," it will slot into the 13-axis release gate as the 14th; v1.34 keeps the axis count at 13.

## SSOT boundaries

- The 6 base component axes (story registration / args / play / mount / a11y / visual regression) live in `docs/concepts/component-testing.md`. v1.34 does not modify that doc.
- The 8 advanced axes (4 component + 4 nextjs) live in this doc. Tutorials 67-69 and the migration guide (v1.33 → v1.34) link back here for the axis SSOT.
- The 3-target × 8-axis grid is the harness's data structure. The `collectFidelityCoverage()` implementations in `packages/component/src/semantics/fidelity.ts` + `packages/nextjs/src/semantics/fidelity.ts` are the code SSOT — this doc's grid tables are derived from that code.
- The `KIWA_MODE=real` env-gate contract is shared with the v1.22 real-driver testing tutorial (auth adapters + Keycloak), the v1.31 streaming real-driver concept doc, the v1.32 database real-driver concept doc, and the v1.33 payment real-driver concept doc. All five use the same pattern; the frontend axes just add browser-ready envs (`RSC_STREAMING_BROWSER_READY` / `SERVER_ACTION_BROWSER_READY` / `STORYBOOK_MDX_READY` / `STORYBOOK_TEST_READY`) instead of provider `_KEY` envs.
