# @kiwa/solidjs

SolidJS Signal + Effect + createResource + Suspense boundary test adapter for [kiwa](https://github.com/cardene777/kiwa) — model Solid's fine-grained reactivity graph in Vitest without a Solid runtime.

```bash
pnpm add -D @kiwa/solidjs
```

## Why

SolidJS is a fine-grained reactive framework where `createSignal`, `createEffect`, and `createResource` form the core primitives. Real Solid needs a runtime with an owner tree + reactive graph. `@kiwa/solidjs` gives you standalone mock primitives that model the same accessor / setter / effect-run / resource-fetch contract so tests can assert on signal transitions + effect traces + resource state directly.

## Quick start

### Signal + Effect

```ts
import { describe, expect, it } from 'vitest';
import { mockSignal, mockEffect, batch } from '@kiwa/solidjs';

describe('counter', () => {
  it('effect re-runs on signal write', () => {
    const [count, setCount] = mockSignal(0);
    let observed = -1;
    mockEffect(() => {
      observed = count();
    });
    setCount(5);
    expect(observed).toBe(5);
  });

  it('batched writes dedup into a single effect run', () => {
    const [a, setA] = mockSignal(1);
    const [b, setB] = mockSignal(2);
    let runs = 0;
    mockEffect(() => {
      void a();
      void b();
      runs += 1;
    });
    const baseline = runs;
    batch(() => {
      setA(10);
      setB(20);
    });
    expect(runs).toBe(baseline + 1);
  });
});
```

### createResource

```ts
import { expect, it } from 'vitest';
import { createResourceStub } from '@kiwa/solidjs';

it('resource lifecycle', async () => {
  const { accessor, actions, initialFetch } = createResourceStub(async () => ({ ok: 1 }));
  expect(accessor.state).toBe('pending');
  await initialFetch;
  expect(accessor.state).toBe('ready');
  expect(accessor()).toEqual({ ok: 1 });

  const refetch = actions.refetch();
  expect(accessor.state).toBe('refreshing');
  await refetch;
  expect(accessor.state).toBe('ready');
});
```

### Suspense boundary

```ts
import { expect, it } from 'vitest';
import { renderWithSuspense, h, stringify } from '@kiwa/solidjs';

it('fallback → resolved swap', async () => {
  const boundary = await renderWithSuspense({
    component: () => h('p', null, 'ready'),
    fallback: h('p', null, 'loading'),
    waitFor: Promise.resolve('ok'),
  });
  expect(stringify(boundary.fallback)).toBe('<p>loading</p>');
  expect(boundary.resolved && stringify(boundary.resolved)).toBe('<p>ready</p>');
  expect(boundary.timedOut).toBe(false);
});
```

### SolidStart route

```ts
import { expect, it } from 'vitest';
import { invokeSolidRoute, h, stringify, redirect } from '@kiwa/solidjs';

it('renders page with loader data', async () => {
  const { tree, data, redirect: r } = await invokeSolidRoute({
    page: (props) => h('article', null, String(props.data)),
    load: async ({ params }) => `id=${params.id}`,
    params: { id: '42' },
  });
  expect(r).toBeNull();
  expect(data).toBe('id=42');
  expect(tree && stringify(tree)).toBe('<article>id=42</article>');
});

it('loader redirect surfaces on the result', async () => {
  const { redirect: r } = await invokeSolidRoute({
    page: () => h('p', null, 'unreachable'),
    load: async () => {
      throw redirect('/login', 302);
    },
  });
  expect(r?.url).toBe('/login');
});
```

## API

| Export | Purpose |
|---|---|
| `mockSignal(initial)` | `[getter, setter]` with subscribe / Object.is short-circuit / updater-fn form |
| `mockEffect(fn)` | Reactive re-run with `runCount()` / `trace()` / `dispose()` |
| `batch(fn)` | Group writes so subscribed effects dedup to a single run |
| `track(fn)` | Capture signal reads inside the callback |
| `createResourceStub(fetcher)` | `unresolved → pending → ready / errored / refreshing` state machine |
| `renderSolid({ component, props })` | Synchronous mount + `dispose()` + `html()` |
| `hydrate({ component, ssrMarkup })` | Client / SSR diff with `hydrated` + `mismatch` |
| `createRoot(fn)` | Solid-shaped `createRoot(dispose => ...)` with scope tracking |
| `h(type, props, ...children)` | Lightweight JSX-shaped factory |
| `findElements(tree, predicate)` | Depth-first virtual DOM walker |
| `stringify(tree)` | SSR-shaped HTML string |
| `invokeSolidRoute(opts)` | SolidStart route runner with `redirect()` / `notFound()` signal capture |
| `renderWithSuspense(opts)` | Fallback → resolved swap + `timedOut` safety gate |
| `errorBoundary(opts)` | Component throws land in a fallback signal |

Brand symbols: `SIGNAL_SYMBOL` / `EFFECT_SYMBOL` / `RESOURCE_SYMBOL` / `SOLID_ELEMENT_SYMBOL` / `SOLID_REDIRECT_SYMBOL` / `SOLID_NOT_FOUND_SYMBOL` / `SUSPENSE_BOUNDARY_SYMBOL` / `ERROR_BOUNDARY_SYMBOL`.

## Limits

- Real Solid runtime binding (`solid-js` package integration) is **not** in scope for v0.1. Tests use standalone mocks with the same brand symbols.
- `mockEffect` only subscribes to signals it reads through the getter — downstream computations are not tracked.
- `renderWithSuspense` follows a deterministic 2-phase model (fallback first, then resolved / timedOut). Real Solid can pause mid-render; that's out of scope here.

Companion: v1.19-1a of the [kiwa test framework](https://github.com/cardene777/kiwa) — released alongside `@kiwa/fresh` (#814) + `@kiwa/hono` (v1.19-1c) as part of the v1.19 modern framework depth-drive.
