# @kiwa/fresh

Deno Fresh Islands + Route Handler + Head normalization test adapter for [kiwa](https://github.com/cardene777/kiwa) — model Fresh's server route + partial-hydration + `<Head>` merge contract in Vitest without a Deno runtime.

```bash
pnpm add -D @kiwa/fresh
```

## Why

Deno Fresh routes ship mostly static HTML and hydrate any component under `islands/` on the client with its `props`. Testing the observable behavior — handler dispatch, `ctx.render(data)` capture, island mount + interaction, `<Head>` merge — normally means spinning up Deno + esbuild + preact. `@kiwa/fresh` gives you standalone helpers that model the same shape so tests assert directly on the response, the hydrated tree, and the merged head.

## Quick start

### Route Handler

```ts
import { describe, expect, it } from 'vitest';
import { invokeFreshHandler, h, type FreshHandlers } from '@kiwa/fresh';

describe('GET /api/ping', () => {
  it('returns pong', async () => {
    const handlers: FreshHandlers = {
      GET: () => new Response('pong', { status: 200 }),
    };
    const { response } = await invokeFreshHandler({
      handlers,
      req: new Request('http://x/api/ping'),
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('pong');
  });

  it('renders a page when handler calls ctx.render(data)', async () => {
    const handlers: FreshHandlers<{ name: string }> = {
      GET: (_req, ctx) => ctx.render({ name: 'kiwa' }),
    };
    const { renderData, page } = await invokeFreshHandler({
      handlers,
      req: new Request('http://x/'),
      page: ({ data }) => h('p', null, `hello ${data?.name}`),
    });
    expect(renderData).toEqual({ name: 'kiwa' });
    expect(page).toBeTruthy();
  });
});
```

### defineRoute

```ts
import { expect, it } from 'vitest';
import { defineRoute, invokeDefineRoute, h, stringify, redirect } from '@kiwa/fresh';

it('renders page with params', async () => {
  const route = defineRoute((_req, ctx) => h('article', null, `id=${ctx.params.id}`));
  const { tree } = await invokeDefineRoute({
    route,
    req: new Request('http://x/post/42'),
    params: { id: '42' },
  });
  expect(tree && stringify(tree)).toBe('<article>id=42</article>');
});

it('captures redirect() throw', async () => {
  const route = defineRoute(() => {
    throw redirect('/login', 302);
  });
  const { redirect: r } = await invokeDefineRoute({
    route,
    req: new Request('http://x/private'),
  });
  expect(r?.location).toBe('/login');
});
```

### Islands + partial hydration

```ts
import { expect, it } from 'vitest';
import { defineIsland, islandPlaceholder, hydrateIslands, simulateInteraction, h } from '@kiwa/fresh';

it('hydrates a Counter island and dispatches a click', () => {
  let count = 0;
  const Counter = defineIsland<{ start: number }>({
    name: 'Counter',
    component: (p) =>
      h('button', { onClick: () => (count = p.start + 1) }, `n=${p.start}`),
  });
  const ssrTree = h('main', null, islandPlaceholder(Counter, { start: 5 }));
  const { hydrated, html } = hydrateIslands({ ssrTree, islands: [Counter] });
  expect(html).toContain('<button');
  const result = simulateInteraction({ mount: hydrated[0]!.mount, event: 'click' });
  expect(result.invoked).toBe(1);
  expect(count).toBe(6);
});
```

### Head normalization

```ts
import { expect, it } from 'vitest';
import { defineHead, mergeHead, renderHead, extractHead, h } from '@kiwa/fresh';

it('later fragment overrides title + dedups meta by name', () => {
  const merged = mergeHead([
    defineHead({ title: 'Home', meta: [{ name: 'description', content: 'first' }] }),
    defineHead({ title: 'About', meta: [{ name: 'description', content: 'second' }] }),
  ]);
  expect(merged.title).toBe('About');
  expect(merged.meta[0]?.content).toBe('second');
});

it('extracts + renders in canonical order (title → base → meta → link → script)', () => {
  const tree = h(
    'html',
    null,
    h('Head', null, h('title', null, 'x'), h('meta', { name: 'description', content: 'd' })),
    h('body', null, h('p', null, 'body')),
  );
  const merged = extractHead(tree);
  expect(renderHead(merged)).toBe('<title>x</title><meta name="description" content="d" />');
});
```

## API

| Export | Purpose |
|---|---|
| `invokeFreshHandler(opts)` | Dispatches a Fresh handler by request method, captures `ctx.render(data)` + `redirect` + `renderNotFound`, returns `{ response, renderData, page, redirect, notFound, error }` |
| `defineRoute(fn)` / `invokeDefineRoute(opts)` | `defineRoute` wrapper + runner with signal capture + `{ tree, redirect, notFound, error, html }` |
| `redirect(location, status?)` / `notFound()` | Signal helpers thrown from handler or defineRoute body |
| `defineIsland({ name, component, defaultProps })` | Register an island (brand + name + component + default props) |
| `islandPlaceholder(island, props?)` | SSR placeholder: `<div data-island="Name" data-props="{...}">` |
| `mountIsland(island, props?)` | Synchronously mount an island + capture the returned tree + handler map |
| `hydrateIslands({ ssrTree, islands })` | Walk SSR tree, mount matched islands, return `{ hydrated, missing, unregistered, html }` |
| `simulateInteraction({ mount, event, value?, targetType? })` | Dispatch a synthetic event to every collected handler, expose `preventDefault()` |
| `defineHead({ title, meta, link, script, base })` | Build a `HeadFragment` from typed spec |
| `mergeHead([...fragments])` | Merge N fragments in order with Fresh-shaped dedup rules |
| `renderHead(head)` | Stringify a merged head into an HTML fragment in canonical order |
| `extractHead(tree)` | Walk a virtual tree, harvest every `<Head>` or `<head>` block, return a merged fragment |
| `h(type, props, ...children)` / `stringify(tree)` / `findNodes(tree, predicate)` | JSX-shaped factory + serializer + depth-first walker (void elements self-close per HTML5 spec) |

Brand symbols: `FRESH_REDIRECT_SYMBOL` / `FRESH_NOT_FOUND_SYMBOL` / `FRESH_ROUTE_SYMBOL` / `ISLAND_SYMBOL` / `ISLAND_MOUNT_SYMBOL` / `HEAD_SYMBOL`.

## Limits

- Real Deno runtime + file-system router are **not** in scope for v0.1. Tests invoke handlers + defineRoute wrappers + islands directly.
- Middleware chain (`_middleware.ts`) traversal is out of scope for v0.1 — tests can compose middlewares by hand.
- `_app.tsx` / `_layout.tsx` nesting is out of scope for v0.1 — call each layer explicitly.
- `simulateInteraction` doesn't bubble events; it invokes each collected handler once with a synthetic event object.

Companion: v1.19-1b of the [kiwa test framework](https://github.com/cardene777/kiwa) — released alongside `@kiwa/solidjs` (#813) + `@kiwa/hono` (v1.19-1c) as part of the v1.19 modern framework depth-drive.
