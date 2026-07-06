# Server Action + optimistic UI — form action + useFormStatus + useOptimistic + revalidatePath + revalidateTag + redirect in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/component` v0.3 (form-action-advanced) + `@kiwa-test/nextjs` v1.2 (server-action-advanced) that models the 6 pieces of a real React 19 + Next.js 15 Server Action layer that every non-trivial form flow eventually needs — a form action session that tracks pending / optimistic / resolved states, a `useFormStatus` pending mark that renders the loading spinner without a client-side hook, a `useOptimistic` patch ledger that lets the UI show the resolved value before the Server Action returns, a `revalidatePath` call that invalidates the `/subscribers` cache after a successful subscribe, a `revalidateTag` call that invalidates the `like-count` tag after a successful like, and a `redirect` call that navigates to `/dashboard` after a successful login. `startFormActionSession()` + `startServerActionAdvanced()` give you every one of those pieces as a deterministic state machine — `idle` → `pending` → `optimistic` → `enhanced` → `resolved`, `idle` → `submitted` → `path-revalidated` → `tag-revalidated` → `redirected`. No live Next.js server, no browser required, no Playwright screencasts. This is the pattern kiwa's `examples/dogfood-nextjs-server-action-app` exercises against real Chromium under Playwright; the tutorial covers the mock-only path so you can iterate in milliseconds and reproduce the exact "optimistic patch stuck" case a reviewer sees in prod.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-server-action && cd kiwa-server-action
pnpm init
pnpm add -D @kiwa-test/component@^0.3 @kiwa-test/nextjs@^1.2 vitest typescript @types/node
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

The v0.3 surface exports `startFormActionSession` from the component semantics barrel; the v1.2 surface exports `startServerActionAdvanced` from the nextjs semantics barrel. This tutorial focuses on the form + server-action pair; tutorial 67 covers RSC + streaming SSR + view transitions, tutorial 69 covers all 4 component axes exercised through Storybook 8 + MDX.

### 2. `startFormActionSession` — construct the form session

`tests/form/start.test.ts` — the first thing a form action layer does is build the session (form id + target runtime + initial form state). The mock enforces the invariant that the form id must not be empty; the initial state is copied (not referenced) so mutations do not leak into the caller's state.

```ts
import { describe, expect, it } from 'vitest';
import { startFormActionSession } from '@kiwa-test/component';

interface SubscribeForm extends Record<string, unknown> {
  email: string;
  optIn: boolean;
}

describe('form — startFormActionSession', () => {
  it('constructs a session with the initial form copied in', () => {
    const session = startFormActionSession<SubscribeForm>({
      target: 'playwright-ct',
      formId: 'subscribe-form',
      initial: { email: '', optIn: false },
    });

    expect(session.state).toBe('idle');
    expect(session.form).toEqual({ email: '', optIn: false });
    expect(session.optimisticPatches).toEqual([]);
    expect(session.enhanced).toBe(false);
    expect(session.error).toBeNull();
  });

  it('rejects an empty form id — a session with no form is untrackable', () => {
    expect(() =>
      startFormActionSession({
        target: 'playwright-ct',
        formId: '',
        initial: {},
      }),
    ).toThrow(/formId must not be empty/);
  });
});
```

The rule of thumb is that the form id is the SSOT — the same id shows up in every neutral event metadata + provider dialect. The mock enforces the non-empty invariant so a test that misconfigures the session by passing an empty id fails immediately.

### 3. `markFormStatusPending` + `applyOptimisticUpdate` — the useFormStatus + useOptimistic pair

`tests/form/optimistic-ladder.test.ts` — the form session moves from `idle` to `pending` on `markFormStatusPending` (equivalent to React 19 `useFormStatus().pending === true`), then to `optimistic` on `applyOptimisticUpdate` (equivalent to React 19 `useOptimistic()` returning the patched value). The mock accumulates patches so tests can assert on the exact patch order + patched form shape.

```ts
import { describe, expect, it } from 'vitest';
import {
  applyOptimisticUpdate,
  markFormStatusPending,
  startFormActionSession,
} from '@kiwa-test/component';

interface LikeForm extends Record<string, unknown> {
  postId: string;
  likeCount: number;
}

describe('form — pending → optimistic ladder', () => {
  it('advances idle → pending → optimistic with the patch applied to form state', () => {
    const session = startFormActionSession<LikeForm>({
      target: 'playwright-ct',
      formId: 'like-form',
      initial: { postId: 'post-1', likeCount: 42 },
    });

    const pending = markFormStatusPending(session, 'like-button');
    const optimistic = applyOptimisticUpdate(session, { likeCount: 43 });

    expect(pending.state).toBe('pending');
    expect(pending.neutralEvent).toBe('form.status_pending');
    expect(pending.metadata.submitter).toBe('like-button');
    expect(optimistic.state).toBe('optimistic');
    expect(optimistic.neutralEvent).toBe('form.optimistic_applied');
    expect(optimistic.metadata.patchKeys).toBe('likeCount');
    expect(optimistic.metadata.patchCount).toBe(1);
    expect(session.form.likeCount).toBe(43);
    expect(session.optimisticPatches).toEqual([{ likeCount: 43 }]);
  });

  it('rejects a double pending mark — a form that is already pending cannot re-pend', () => {
    const session = startFormActionSession({
      target: 'playwright-ct',
      formId: 'like-form',
      initial: { likeCount: 42 },
    });
    markFormStatusPending(session, 'like-button');
    expect(() => markFormStatusPending(session, 'like-button')).toThrow(/already pending/);
  });
});
```

The rule of thumb is that the optimistic ladder is what turns "the like count changes 400 ms after the click" into "the like count changes 0 ms after the click, with the resolved value replacing the optimistic patch when the Server Action returns." The mock accumulates patches so a test can assert on the exact patch order without booting a real React 19 client.

### 4. `enableProgressiveEnhancement` + `resolveFormAction` — enhancement + resolution

`tests/form/enhance-resolve.test.ts` — a form that ships with progressive enhancement records the action URL + method so JS-disabled browsers can submit the form via native HTML `<form action="/api/subscribe" method="post">`. The resolution step merges the Server Action's return value into the form state; the mock records whether the form was enhanced when resolving so the fidelity harness can assert on the exact enhancement shape.

```ts
import { describe, expect, it } from 'vitest';
import {
  enableProgressiveEnhancement,
  markFormStatusPending,
  resolveFormAction,
  startFormActionSession,
} from '@kiwa-test/component';

interface SubscribeForm extends Record<string, unknown> {
  email: string;
  subscribed: boolean;
}

describe('form — enhance + resolve', () => {
  it('advances pending → enhanced → resolved with the Server Action return value merged', () => {
    const session = startFormActionSession<SubscribeForm>({
      target: 'playwright-ct',
      formId: 'subscribe-form',
      initial: { email: 'user@example.com', subscribed: false },
    });

    markFormStatusPending(session, 'subscribe-button');
    const enhanced = enableProgressiveEnhancement(session, {
      method: 'post',
      actionUrl: '/api/subscribe',
    });
    const resolved = resolveFormAction(session, { subscribed: true });

    expect(enhanced.state).toBe('enhanced');
    expect(enhanced.neutralEvent).toBe('form.progressive_enhanced');
    expect(enhanced.metadata.actionUrl).toBe('/api/subscribe');
    expect(enhanced.metadata.method).toBe('post');
    expect(resolved.state).toBe('resolved');
    expect(resolved.neutralEvent).toBe('form.action_resolved');
    expect(resolved.metadata.enhanced).toBe(true);
    expect(session.form.subscribed).toBe(true);
  });

  it('rejects a resolve on an idle session — a session that never submitted cannot resolve', () => {
    const session = startFormActionSession({
      target: 'playwright-ct',
      formId: 'subscribe-form',
      initial: { subscribed: false },
    });
    expect(() => resolveFormAction(session, { subscribed: true })).toThrow(/was not submitted/);
  });
});
```

The rule of thumb is that progressive enhancement is what lets a form work when JS is disabled or slow. The mock records the enhancement flag on the resolution step so a test can assert that a form that was enhanced resolves with `enhanced: true` in the metadata — the fidelity harness compares that to the real React 19 output.

### 5. `startServerActionAdvanced` + `submitFormAction` — the Server Action pipeline

`tests/action/submit.test.ts` — the Next.js side of the pair (`@kiwa-test/nextjs` v1.2 server-action-advanced axis) tracks form submission on the server. The mock enforces that the action must move `idle` → `submitted` before any revalidation / redirect step; the form fields are recorded so tests can assert on the exact field names + values.

```ts
import { describe, expect, it } from 'vitest';
import { startServerActionAdvanced, submitFormAction } from '@kiwa-test/nextjs';

describe('action — submitFormAction', () => {
  it('advances idle → submitted with the form fields captured', () => {
    const session = startServerActionAdvanced({
      target: 'app-router',
      actionId: 'subscribeAction',
    });

    const step = submitFormAction(session, { email: 'user@example.com', optIn: 'true' });

    expect(step.state).toBe('submitted');
    expect(step.neutralEvent).toBe('action.form_submitted');
    expect(step.metadata.fieldCount).toBe(2);
    expect(step.metadata.fields).toBe('email,optIn');
    expect(session.form).toEqual({ email: 'user@example.com', optIn: 'true' });
  });

  it('rejects a double submit — a session that already submitted cannot re-submit', () => {
    const session = startServerActionAdvanced({
      target: 'app-router',
      actionId: 'subscribeAction',
    });
    submitFormAction(session, { email: 'user@example.com' });
    expect(() => submitFormAction(session, { email: 'other@example.com' })).toThrow(
      /is submitted, not idle/,
    );
  });
});
```

The rule of thumb is that the server-side submission is the SSOT for the form's shape. The mock captures every field name + value so a test can assert on the exact shape a Server Action receives without booting a real Next.js dev server.

### 6. `revalidateActionPath` + `revalidateActionTag` + `redirectAction` — the revalidate + redirect ladder

`tests/action/revalidate-redirect.test.ts` — after a successful submit, a Server Action calls `revalidatePath('/subscribers')` to invalidate the subscribers list cache, `revalidateTag('like-count')` to invalidate the like count tag, and `redirect('/dashboard')` to navigate the user. The mock tracks the exact paths + tags + redirect URL so a test can assert on the invalidation shape without booting Next.js.

```ts
import { describe, expect, it } from 'vitest';
import {
  redirectAction,
  revalidateActionPath,
  revalidateActionTag,
  startServerActionAdvanced,
  submitFormAction,
} from '@kiwa-test/nextjs';

describe('action — revalidate + redirect ladder', () => {
  it('advances submitted → path-revalidated → tag-revalidated → redirected', () => {
    const session = startServerActionAdvanced({
      target: 'app-router',
      actionId: 'subscribeAction',
    });
    submitFormAction(session, { email: 'user@example.com' });

    const pathStep = revalidateActionPath(session, '/subscribers');
    const tagStep = revalidateActionTag(session, 'subscriber-count');
    const redirectStep = redirectAction(session, '/dashboard');

    expect(pathStep.state).toBe('path-revalidated');
    expect(pathStep.neutralEvent).toBe('action.revalidate_path');
    expect(pathStep.metadata.path).toBe('/subscribers');
    expect(tagStep.state).toBe('tag-revalidated');
    expect(tagStep.neutralEvent).toBe('action.revalidate_tag');
    expect(tagStep.metadata.tag).toBe('subscriber-count');
    expect(redirectStep.state).toBe('redirected');
    expect(redirectStep.neutralEvent).toBe('action.redirected');
    expect(redirectStep.metadata.url).toBe('/dashboard');
    expect(session.revalidatedPaths).toEqual(['/subscribers']);
    expect(session.revalidatedTags).toEqual(['subscriber-count']);
    expect(session.redirectUrl).toBe('/dashboard');
  });

  it('rejects a revalidatePath that does not start with slash — path invariant guard', () => {
    const session = startServerActionAdvanced({
      target: 'app-router',
      actionId: 'subscribeAction',
    });
    submitFormAction(session, { email: 'user@example.com' });
    expect(() => revalidateActionPath(session, 'subscribers')).toThrow(/path must start with \//);
  });

  it('rejects a revalidateTag on an idle session — cannot revalidate without submit', () => {
    const session = startServerActionAdvanced({
      target: 'app-router',
      actionId: 'subscribeAction',
    });
    expect(() => revalidateActionTag(session, 'subscriber-count')).toThrow(/was not submitted/);
  });
});
```

The rule of thumb is that revalidate + redirect are the SSOT for the post-submit side effects. The mock tracks each path + tag + redirect URL so a test can assert on the exact invalidation shape a Next.js cache actually sees — the fidelity harness compares that to real Next.js dev server output under `KIWA_MODE=real`.

### 7. Wire the fidelity harness — both packages

`tests/fidelity/frontend.test.ts` — the fidelity harness reports which targets cover which axes across both packages so the release-gate can render "3 target × 4 axis × 2 package = 24 cells" for the v0.3 + v1.2 frontend slice.

```ts
import { describe, expect, it } from 'vitest';
import { collectFidelityCoverage as componentCoverage } from '@kiwa-test/component';
import { collectFidelityCoverage as nextCoverage } from '@kiwa-test/nextjs';

describe('frontend — fidelity coverage', () => {
  it('component covers 3 target × 4 axis = 12 cells', () => {
    const coverage = componentCoverage(['storybook8', 'playwright-ct', 'chromatic']);
    expect(coverage.rows).toHaveLength(12);
    expect(coverage.axes).toContain('form-action-advanced');
  });

  it('nextjs covers 3 target × 4 axis = 12 cells with the server-action-advanced axis', () => {
    const coverage = nextCoverage(['app-router', 'pages-router', 'edge-runtime']);
    expect(coverage.rows).toHaveLength(12);
    expect(coverage.axes).toContain('server-action-advanced');

    const actionRows = coverage.rows.filter((r) => r.axis === 'server-action-advanced');
    expect(actionRows).toHaveLength(3);
    for (const row of actionRows) {
      expect(row.neutralEvents).toEqual([
        'action.form_submitted',
        'action.revalidate_path',
        'action.revalidate_tag',
        'action.redirected',
      ]);
    }
  });
});
```

The rule of thumb is that the fidelity harness is what turns "we mocked React 19 Server Actions" into "we mocked the intersection of Storybook 8 + Playwright CT + Chromatic on the client side AND App Router + Pages Router + Edge Runtime on the server side for all 4 axes with the same 16 neutral events." The mock exposes both grids so the release-gate can assert on the shape without walking every event by hand.

## Run it

```bash
pnpm test
```

All 6 files pass in under 3 seconds. The full v0.3 form-action-advanced surface + v1.2 server-action-advanced surface — 11 state transitions across 2 axes — is exercised by `packages/component/tests/docs-tutorial-v1.34.test.ts` + `packages/nextjs/tests/docs-tutorial-v1.34.test.ts` for every code snippet in this tutorial so a public API drift breaks CI before the reader sees a broken example.

## What you learned

- The 6 pieces of a real Server Action layer (pending mark + optimistic patch + progressive enhancement + form submit + revalidatePath + revalidateTag + redirect) map to 8 neutral events (`form.*` × 4 + `action.*` × 4) that every target emits under its own dialect.
- The 4 shape invariants (formId non-empty + actionId non-empty + path starts with `/` + tag non-empty) are enforced at the mock level — a test that misconfigures the pipeline fails immediately.
- The optimistic ladder + revalidate ladder cross the client-server boundary — the client-side `applyOptimisticUpdate` patches the UI while the server-side `revalidateActionPath` invalidates the cache, and both meet at the resolved form state.
- The fidelity harness reports 24 cells across both packages (3 target × 4 axis × 2 package); the release-gate reads this to render the coverage grid without calling every event by hand.

## Next steps

- Tutorial 67 walks RSC + streaming SSR + view transitions for the RSC streaming dogfood app.
- Tutorial 69 walks Storybook 8 + MDX + interaction test + coverage report for the Storybook 8 MDX dogfood app.
- Concept doc `docs/concepts/frontend-real-driver-testing.md` documents the 8-axis SSOT + 3 target × 8 axis = 24 cell grid + `KIWA_MODE=real` env-gate + `RSC_STREAMING_BROWSER_READY` / `SERVER_ACTION_BROWSER_READY` / `STORYBOOK_MDX_READY` per-target mapping.
