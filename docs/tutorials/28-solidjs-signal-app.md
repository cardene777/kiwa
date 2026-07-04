# SolidJS Signal + Effect + Resource + Suspense (fine-grained reactivity) in 10 min

## What you'll build

A vitest suite for a SolidJS-shaped counter + async data fetcher that exercises the four v1.19 primitives — `mockSignal` for state, `mockEffect` for the fine-grained subscription contract, `batch` for a single-flush write group, and `createResourceStub` for a Suspense-shaped async fetch. The tests never boot a real Solid runtime; they drive the reactive graph through `@kiwa-test/solidjs` v0.1's brand-symbol-guarded stubs so the same suite runs in Node.js without a DOM, a Deno runtime, or a browser.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn — the tutorial uses pnpm)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-solidjs-first && cd kiwa-solidjs-first
pnpm init
pnpm add -D @kiwa-test/solidjs@0.1 vitest typescript @types/node
```

Add the vitest script and TypeScript configuration in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

Ship a `tsconfig.json` that matches the ESM shape `@kiwa-test/solidjs` exports.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

Add the counter + resource test at `tests/counter.test.ts`. The four sections walk exactly the shape Solid teams hit — signal write triggers effect, batched writes flush once, and a Suspense-adjacent resource transitions through `pending → ready → refreshing`.

```ts
import { describe, expect, it } from 'vitest';
import {
  mockSignal,
  mockEffect,
  batch,
  createResourceStub,
  isSignal,
  isResourceAccessor,
} from '@kiwa-test/solidjs';

describe('signal + effect contract', () => {
  it('effect body re-runs when a subscribed signal writes', () => {
    const [count, setCount] = mockSignal(0);
    let seen = -1;
    mockEffect(() => {
      seen = count();
    });
    setCount(3);
    expect(seen).toBe(3);
    expect(isSignal(count)).toBe(true);
  });

  it('batch dedups two writes into a single effect re-run', () => {
    const [a, setA] = mockSignal('a1');
    const [b, setB] = mockSignal('b1');
    let runs = 0;
    mockEffect(() => {
      void a();
      void b();
      runs += 1;
    });
    const baseline = runs;
    batch(() => {
      setA('a2');
      setB('b2');
    });
    // Real Solid coalesces the two writes; the stub keeps the same contract
    // so a test can assert on the flush count without a real scheduler.
    expect(runs).toBe(baseline + 1);
  });
});

describe('createResourceStub — Suspense-shaped async fetch', () => {
  it('initial fetch transitions pending → ready and exposes the value', async () => {
    const { accessor, initialFetch } = createResourceStub(async () => ({ user: 'kiwa' }));
    expect(accessor.state).toBe('pending');
    expect(accessor.loading).toBe(true);
    await initialFetch;
    expect(accessor.state).toBe('ready');
    expect(accessor.loading).toBe(false);
    expect(accessor()).toEqual({ user: 'kiwa' });
    expect(isResourceAccessor(accessor)).toBe(true);
  });

  it('refetch flips state to refreshing then back to ready', async () => {
    let call = 0;
    const { accessor, actions, initialFetch } = createResourceStub(async () => {
      call += 1;
      return call;
    });
    await initialFetch;
    const p = actions.refetch();
    expect(accessor.state).toBe('refreshing');
    const next = await p;
    expect(next).toBe(2);
    expect(accessor.state).toBe('ready');
    expect(accessor()).toBe(2);
  });
});
```

## Run

```bash
pnpm test
```

Vitest picks up the file, runs the 4 tests in a single Node.js process, and exits green in under a second. No browser, no jsdom, no Solid runtime — `mockSignal` / `mockEffect` / `batch` / `createResourceStub` deliver the observable contract that a real Solid harness enforces, without the boot cost.

## Why fine-grained reactivity needs its own testing contract

SolidJS diverges from React on one axis that shows up in every non-trivial test — component bodies run **once** and only the closures that read a signal re-run when the signal writes. React re-renders the whole component on every state change; Solid re-runs only the effect that read the changed signal. That difference means Solid bugs look like "the effect body captured a stale signal read" — and the shape of the assertion becomes "on write N, effect body re-ran K times".

`@kiwa-test/solidjs` records that in `EffectHandle.trace()`. Every re-run appends a `{ readValues }` row, so the test can assert on the exact re-run count without a `setTimeout(0)` flush.

```ts
import { mockEffect, mockSignal } from '@kiwa-test/solidjs';

const [get, set] = mockSignal(1);
const handle = mockEffect(() => {
  void get();
});
set(2);
set(3);
const trace = handle.trace();
expect(trace.map((e) => e.readValues[0])).toEqual([1, 2, 3]);
```

Three properties are load-bearing.

- **`Object.is`-based equality on the setter.** Writing the same value is a no-op; writing `NaN` is treated as equal to `NaN` (matches Solid's real behaviour).
- **Immediate first run.** `mockEffect(fn)` runs `fn` synchronously on creation, so the test's "baseline runs" count starts at 1, not 0.
- **`dispose()` stops future re-runs.** Component unmount in real Solid disposes the effect scope; `handle.dispose()` mirrors that so a leaked subscription is observable.

## What `createResourceStub` cuts down

Real Solid's `createResource(fetcher)` boots a Suspense boundary the moment the accessor is read inside a render. The stub gives you the same four states (`unresolved` / `pending` / `ready` / `refreshing` / `errored`) plus `refetch()` and `mutate()`, without a Suspense runtime.

That matters because production bugs show up as "the resource state stayed on `refreshing` after refetch resolved" or "mutate did not flip loading to false". The stub records both transitions, so the assertion is `expect(accessor.state).toBe('ready')` at every step of the lifecycle.

For a Suspense-shaped test that walks fallback → content, use `renderWithSuspense` from the same package.

```ts
import { renderWithSuspense, h, stringify } from '@kiwa-test/solidjs';

const boundary = await renderWithSuspense({
  component: () => h('p', null, 'ready'),
  fallback: () => h('p', null, 'loading'),
  waitFor: Promise.resolve('ok'),
});
expect(stringify(boundary.fallback)).toBe('<p>loading</p>');
expect(boundary.resolved && stringify(boundary.resolved)).toBe('<p>ready</p>');
expect(boundary.timedOut).toBe(false);
```

`boundary.fallback` is what the reader sees before `waitFor` resolves; `boundary.resolved` is what the tree becomes after. `boundary.timedOut` flips true when `waitFor` outruns `timeoutMs` (default 100 ms), so a Suspense assertion `expect(boundary.timedOut).toBe(false)` catches a fetcher that hangs forever.

## Related

- Concept doc — [Modern web framework testing (Signal reactivity / Islands architecture / edge runtime + RPC type-safety SSOT)](../concepts/modern-web-framework-testing)
- v1.19-1a [#813](https://github.com/cardene777/kiwa/issues/813) — `@kiwa-test/solidjs` v0.1 landing
- v1.19-2 [#808](https://github.com/cardene777/kiwa/issues/808) — `dogfood-solidjs-signal-app` (the full 3-layer dogfood this tutorial cuts down)
