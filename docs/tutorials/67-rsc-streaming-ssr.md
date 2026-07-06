# RSC streaming SSR — Server Components + Suspense + selective hydration + view transitions in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/component` v0.3 that models the 4 pieces of a real React 19 + Next.js 15 App Router streaming layer that every non-trivial app eventually needs — an RSC harness that tracks HTML chunks streamed from the server, a Suspense boundary that flips to `pending` while data loads, an error boundary that captures thrown promises without cratering the whole route, and a view transition that animates the DOM diff during navigation. `startRscHarness()` + `startStreamingSsr()` + `startViewTransitionSession()` give you every one of those pieces as a deterministic state machine — `idle` → `rendering` → `suspended` → `streaming` → `completed`, `suspense-pending` → `progressive-hydrating` → `selective-hydrated`, `element-transitioning` → `finished`. No live Next.js dev server, no Chromium browser required, no Playwright screencasts. This is the pattern kiwa's `examples/dogfood-nextjs-rsc-streaming-app` exercises against real Chromium under Playwright; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "Suspense fallback never got replaced" case a reviewer sees in prod.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-rsc-streaming && cd kiwa-rsc-streaming
pnpm init
pnpm add -D @kiwa-test/component@^0.3 vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

The v0.3 surface exports `startRscHarness` + `startStreamingSsr` + `startViewTransitionSession` from the semantics barrel. This tutorial focuses on the first 3 axes of the 4-axis v0.3 grid; tutorial 68 covers `form-action-advanced` + `server-action-advanced` for Server Actions, tutorial 69 covers all 4 axes exercised through Storybook 8 + MDX + interaction test.

### 2. `startRscHarness` — construct the RSC harness

`tests/rsc/start.test.ts` — the first thing an RSC layer does is build the session (component id + target runtime + optional Suspense fallback markup). The mock enforces the invariants a real harness would enforce (non-empty component id, default Suspense fallback markup).

```ts
import { describe, expect, it } from 'vitest';
import { startRscHarness } from '@kiwa-test/component';

describe('rsc — startRscHarness', () => {
  it('constructs a session with defaults filled in', () => {
    const session = startRscHarness({
      target: 'playwright-ct',
      componentId: 'ArticlePage',
    });

    expect(session.state).toBe('idle');
    expect(session.chunks).toEqual([]);
    expect(session.suspenseFallback).toBeNull();
    expect(session.error).toBeNull();
  });

  it('rejects an empty component id — a harness with no component is unrenderable', () => {
    expect(() =>
      startRscHarness({
        target: 'playwright-ct',
        componentId: '',
      }),
    ).toThrow(/componentId must not be empty/);
  });
});
```

The rule of thumb is that the component id is the SSOT — the same id shows up in every neutral event metadata + provider dialect. The mock enforces the non-empty invariant so a test that misconfigures the harness by passing an empty id fails immediately.

### 3. `beginRscRender` + `streamHtmlChunk` — the streaming ladder

`tests/rsc/streaming-ladder.test.ts` — the harness moves from `idle` to `rendering` on `beginRscRender`, then to `streaming` on the first `streamHtmlChunk` call. Every subsequent chunk stays in `streaming` state; the caller can assert on the chunk index + bytes per chunk without booting a real React server.

```ts
import { describe, expect, it } from 'vitest';
import { beginRscRender, startRscHarness, streamHtmlChunk } from '@kiwa-test/component';

describe('rsc — streaming ladder', () => {
  it('advances idle → rendering → streaming with per-chunk metadata', () => {
    const session = startRscHarness({
      target: 'playwright-ct',
      componentId: 'ArticlePage',
    });

    const begin = beginRscRender(session);
    const chunk1 = streamHtmlChunk(session, '<h1>Hello</h1>');
    const chunk2 = streamHtmlChunk(session, '<p>World</p>');

    expect(begin.state).toBe('rendering');
    expect(begin.neutralEvent).toBe('rsc.render_started');
    expect(chunk1.state).toBe('streaming');
    expect(chunk1.metadata.chunkIndex).toBe(0);
    expect(chunk1.metadata.bytes).toBe(14);
    expect(chunk2.metadata.chunkIndex).toBe(1);
    expect(session.chunks).toEqual(['<h1>Hello</h1>', '<p>World</p>']);
  });

  it('rejects an empty chunk — an empty chunk in the wire is a bug', () => {
    const session = startRscHarness({
      target: 'playwright-ct',
      componentId: 'ArticlePage',
    });
    beginRscRender(session);
    expect(() => streamHtmlChunk(session, '')).toThrow(/chunk must not be empty/);
  });
});
```

The rule of thumb is that the streaming ladder is what separates "we render the page in one shot at 800 ms TTFB" from "we stream 4 chunks at 200 ms each with a hydratable Suspense boundary at chunk 2." The mock tracks per-chunk index + bytes so the fidelity harness can assert the streaming shape matches real React 19 streaming output.

### 4. `enterSuspenseBoundary` + `completeRscRender` — Suspense + completion

`tests/rsc/suspense.test.ts` — a Suspense boundary flips the state from `rendering` to `suspended` and records the fallback markup. `completeRscRender` finalizes the session (state = `completed`, `chunkCount` + concatenated `html` in metadata).

```ts
import { describe, expect, it } from 'vitest';
import {
  beginRscRender,
  completeRscRender,
  enterSuspenseBoundary,
  startRscHarness,
  streamHtmlChunk,
} from '@kiwa-test/component';

describe('rsc — Suspense boundary + completion', () => {
  it('advances rendering → suspended → streaming → completed with resolved chunks', () => {
    const session = startRscHarness({
      target: 'playwright-ct',
      componentId: 'ArticlePage',
      suspenseFallback: '<div data-suspense="pending">loading</div>',
    });

    beginRscRender(session);
    const boundary = enterSuspenseBoundary(session);
    streamHtmlChunk(session, '<article>Hello</article>');
    const done = completeRscRender(session);

    expect(boundary.state).toBe('suspended');
    expect(boundary.neutralEvent).toBe('rsc.suspense_boundary');
    expect(boundary.metadata.fallback).toBe('<div data-suspense="pending">loading</div>');
    expect(done.state).toBe('completed');
    expect(done.neutralEvent).toBe('rsc.render_completed');
    expect(done.metadata.chunkCount).toBe(1);
    expect(done.metadata.html).toBe('<article>Hello</article>');
  });
});
```

The rule of thumb is that the Suspense boundary + completion pair is what lets a reviewer assert on "the boundary emitted a fallback then the chunks streamed then the render completed with the fallback replaced" without booting a real React 19 server. The mock records the fallback markup + concatenated html so tests can assert on the shape a real user sees.

### 5. `startStreamingSsr` + `markSuspensePending` + `completeSelectiveHydration` — the selective hydration state machine

`tests/ssr/selective-hydration.test.ts` — a real streaming SSR pipeline tracks N Suspense boundaries in parallel; each one moves through `suspense-pending` → `progressive-hydrating` → `selective-hydrated` independently. The mock records pending + hydrated boundaries per session so tests can assert on the exact boundary count without walking a real DOM.

```ts
import { describe, expect, it } from 'vitest';
import {
  completeSelectiveHydration,
  markSuspensePending,
  startProgressiveHydration,
  startStreamingSsr,
} from '@kiwa-test/component';

describe('ssr — selective hydration ladder', () => {
  it('tracks pending → hydrating → hydrated per boundary', () => {
    const session = startStreamingSsr({
      target: 'playwright-ct',
      routeId: 'route-articles',
    });

    markSuspensePending(session, 'boundary-header');
    markSuspensePending(session, 'boundary-body');
    startProgressiveHydration(session, 'boundary-header');
    const hydrated = completeSelectiveHydration(session, 'boundary-header');

    expect(hydrated.state).toBe('selective-hydrated');
    expect(hydrated.neutralEvent).toBe('ssr.selective_hydration_completed');
    expect(hydrated.metadata.hydratedCount).toBe(1);
    expect(hydrated.metadata.remainingPending).toBe(1);
    expect(session.pendingBoundaries.has('boundary-body')).toBe(true);
    expect(session.hydratedBoundaries.has('boundary-header')).toBe(true);
  });

  it('rejects hydration on an unknown boundary — a hydrate call for a boundary that was never pending is a bug', () => {
    const session = startStreamingSsr({
      target: 'playwright-ct',
      routeId: 'route-articles',
    });

    expect(() => startProgressiveHydration(session, 'boundary-unknown')).toThrow(/is not pending/);
  });
});
```

The rule of thumb is that selective hydration is what turns "the entire page freezes for 400 ms while React hydrates" into "the header hydrates first at 80 ms, the body at 220 ms, the footer at 340 ms." The mock tracks per-boundary state so a test can assert on the exact hydration order + timing without booting a real React 19 client.

### 6. `startViewTransitionSession` + `startElementTransition` + `finishElementTransition` — the view transition state machine

`tests/view/element-transition.test.ts` — the View Transitions API assigns a name to each transitioning element (via `view-transition-name` CSS property) and animates the DOM diff between old and new snapshots. The mock records active elements per session so tests can assert on the exact element count + finish order.

```ts
import { describe, expect, it } from 'vitest';
import {
  assertAnimation,
  finishElementTransition,
  startElementTransition,
  startViewTransitionSession,
} from '@kiwa-test/component';

describe('view — element transition + animation assertion', () => {
  it('advances idle → element-transitioning → finished when the last active element finishes', () => {
    const session = startViewTransitionSession({
      target: 'playwright-ct',
      transitionId: 'article-to-detail',
    });

    startElementTransition(session, {
      elementId: 'article-cover',
      from: '/articles',
      to: '/articles/hello',
    });
    const asserted = assertAnimation(session, {
      assertionId: 'article-cover-fade',
      durationMs: 320,
      easing: 'ease-out',
    });
    const finished = finishElementTransition(session, 'article-cover');

    expect(session.activeElements.size).toBe(0);
    expect(asserted.state).toBe('asserted');
    expect(asserted.neutralEvent).toBe('transition.animation_asserted');
    expect(asserted.metadata.durationMs).toBe(320);
    expect(asserted.metadata.easing).toBe('ease-out');
    expect(finished.state).toBe('finished');
    expect(finished.neutralEvent).toBe('transition.element_finished');
  });

  it('rejects a finish call on an inactive element — a finish for a never-started element is a bug', () => {
    const session = startViewTransitionSession({
      target: 'playwright-ct',
      transitionId: 'article-to-detail',
    });

    expect(() => finishElementTransition(session, 'article-cover')).toThrow(/is not active/);
  });
});
```

The rule of thumb is that view transitions is what turns "the whole page flashes when navigating between routes" into "the article cover fades to the detail hero over 320 ms with an ease-out curve." The mock records active elements + assertion metadata (durationMs + easing) so a test can assert on the exact animation shape a designer expects.

### 7. Wire the fidelity harness

`tests/fidelity/component.test.ts` — the fidelity harness reports which targets cover which axes so the release-gate can render "3 target × 4 axis = 12 cells" for the component v0.3 slice.

```ts
import { describe, expect, it } from 'vitest';
import { collectFidelityCoverage } from '@kiwa-test/component';

describe('component — fidelity coverage', () => {
  it('every target covers every axis with 4 neutral events per axis', () => {
    const coverage = collectFidelityCoverage(['storybook8', 'playwright-ct', 'chromatic']);

    expect(coverage.rows).toHaveLength(12);
    expect(coverage.axes).toEqual([
      'rsc-harness',
      'streaming-ssr',
      'view-transitions',
      'form-action-advanced',
    ]);

    const rscRows = coverage.rows.filter((r) => r.axis === 'rsc-harness');
    expect(rscRows).toHaveLength(3);
    for (const row of rscRows) {
      expect(row.neutralEvents).toEqual([
        'rsc.render_started',
        'rsc.suspense_boundary',
        'rsc.html_chunk_streamed',
        'rsc.render_completed',
      ]);
    }
  });
});
```

The rule of thumb is that the fidelity harness is what turns "we mocked React 19" into "we mocked the intersection of Storybook 8 + Playwright CT + Chromatic for all 4 component axes with the same 16 neutral events." The mock exposes the axis grid so the release-gate can assert on the shape without walking every event by hand.

## Run it

```bash
pnpm test
```

All 6 files pass in under 3 seconds. The full v0.3 rsc-harness + streaming-ssr + view-transitions surface — 13 state transitions across 3 axes — is exercised by `packages/component/tests/docs-tutorial-v1.34.test.ts` for every code snippet in this tutorial so a public API drift breaks CI before the reader sees a broken example.

## What you learned

- The 3 pieces of a real streaming SSR layer (RSC chunk streaming + Suspense boundary + selective hydration + view transitions) map to 12 neutral events (`rsc.*` × 4 + `ssr.*` × 4 + `transition.*` × 4) that every target emits under its own dialect.
- The 4 timing knobs (chunk bytes + Suspense fallback markup + boundary count + animation durationMs) are the SSOT — the same 4 knobs show up in every production streaming pipeline.
- The mock refuses illegal transitions (empty chunk, hydrate on unknown boundary, finish on inactive element) so tests fail loud on misuse instead of silently producing "would-work-in-mock, fail-in-prod" scenarios.
- The fidelity harness reports 3 target × 4 axis = 12 cells for the component v0.3 slice; the release-gate reads this to render the coverage grid without calling every event by hand.

## Next steps

- Tutorial 68 walks Server Actions + useOptimistic + revalidatePath + revalidateTag + redirect for the Server Action dogfood app.
- Tutorial 69 walks Storybook 8 + MDX + interaction test + coverage report for the Storybook 8 MDX dogfood app.
- Concept doc `docs/concepts/frontend-real-driver-testing.md` documents the 8-axis SSOT + 3 target × 8 axis = 24 cell grid + `KIWA_MODE=real` env-gate + `RSC_STREAMING_BROWSER_READY` / `SERVER_ACTION_BROWSER_READY` / `STORYBOOK_MDX_READY` per-target mapping.
