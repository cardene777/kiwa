# Fresh Islands + Route Handler + Head normalize (Deno partial hydration) in 10 min

## What you'll build

A vitest suite for a Deno Fresh-shaped route + Islands app that exercises the three v1.19 primitives — `invokeFreshHandler` for GET / POST route handlers, `defineIsland` + `hydrateIslands` for partial-hydration Islands, and `defineHead` + `mergeHead` for meta tag normalization. The suite never boots the Deno runtime; it drives the handler contract through `@kiwa-test/fresh` v0.1's brand-symbol-guarded stubs so the same tests run in Node.js against a Fresh-shaped surface.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn — the tutorial uses pnpm)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-fresh-first && cd kiwa-fresh-first
pnpm init
pnpm add -D @kiwa-test/fresh@0.1 vitest typescript @types/node
```

Add the vitest script + ESM configuration in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

Ship a `tsconfig.json` compatible with the ESM shape `@kiwa-test/fresh` exports.

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

Add the route + island test at `tests/route.test.ts`. The three sections walk exactly the shape Fresh teams hit — GET returns a JSON body, POST hits a redirect, and an island placeholder round-trips through hydration.

```ts
import { describe, expect, it } from 'vitest';
import {
  invokeFreshHandler,
  redirect,
  isRedirectSignal,
  h,
  stringify,
  defineIsland,
  islandPlaceholder,
  hydrateIslands,
  defineHead,
  mergeHead,
  renderHead,
  type FreshHandlers,
} from '@kiwa-test/fresh';

describe('invokeFreshHandler — route contract', () => {
  it('GET handler renders JSON body + 200 status', async () => {
    const handlers: FreshHandlers = {
      GET: () =>
        new Response(JSON.stringify({ ok: 1 }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    };
    const { response, error } = await invokeFreshHandler({
      handlers,
      req: new Request('http://x/api/health'),
    });
    expect(error).toBeUndefined();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: 1 });
  });

  it('POST handler throws redirect() + result exposes redirect signal', async () => {
    const handlers: FreshHandlers = {
      POST: () => {
        throw redirect('/login', 302);
      },
    };
    const { redirect: r, response } = await invokeFreshHandler({
      handlers,
      req: new Request('http://x/api/session', { method: 'POST' }),
    });
    expect(r).not.toBeNull();
    expect(r?.location).toBe('/login');
    expect(r?.status).toBe(302);
    expect(response.status).toBe(302);
    expect(isRedirectSignal(r!)).toBe(true);
  });
});

describe('Islands — placeholder + hydration', () => {
  it('placeholder serializes data-island + data-props for the client', () => {
    const Counter = defineIsland<{ start: number }>({
      name: 'Counter',
      component: (p) => h('span', null, String(p.start)),
    });
    const ph = islandPlaceholder(Counter, { start: 3 });
    const html = stringify(ph);
    expect(html).toContain('data-island="Counter"');
    expect(html).toContain('data-props="{&quot;start&quot;:3}"');
  });

  it('hydrateIslands walks a page tree + mounts every placeholder', () => {
    const Counter = defineIsland<{ start: number }>({
      name: 'Counter',
      component: (p) => h('span', null, String(p.start)),
    });
    const ssrTree = h(
      'main',
      null,
      islandPlaceholder(Counter, { start: 1 }),
      islandPlaceholder(Counter, { start: 2 }),
    );
    const { hydrated, missing, unregistered } = hydrateIslands({ ssrTree, islands: [Counter] });
    expect(hydrated).toHaveLength(2);
    expect(hydrated[0]?.name).toBe('Counter');
    expect(hydrated[1]?.mount.props).toEqual({ start: 2 });
    expect(missing).toEqual([]);
    expect(unregistered).toEqual([]);
  });
});

describe('Head — meta tag normalization', () => {
  it('mergeHead + renderHead produces a canonical fragment', () => {
    const base = defineHead({
      title: 'kiwa',
      meta: [{ name: 'viewport', content: 'width=device-width' }],
    });
    const route = defineHead({
      title: 'kiwa — home',
      meta: [{ name: 'description', content: 'test framework' }],
    });
    const merged = mergeHead([base, route]);
    const html = renderHead(merged);
    // Route title wins over base title. Both meta rows survive the merge.
    expect(html).toContain('<title>kiwa — home</title>');
    expect(html).toContain('name="viewport"');
    expect(html).toContain('name="description"');
  });
});
```

## Run

```bash
pnpm test
```

Vitest picks up the file, runs the 5 tests in Node.js, and exits green in under a second. No Deno runtime, no `fresh` binary, no browser bundle — `invokeFreshHandler` / `defineIsland` / `defineHead` deliver the observable contract that a real Fresh app enforces, without booting Deno.

## Why Islands architecture needs its own testing contract

Fresh diverges from Next.js on the axis that shows up in every Islands regression — routes render **entirely** on the server and only components explicitly marked as islands hydrate on the client. Other frameworks send the whole component tree twice (SSR + hydration). Fresh sends the server render, plus a small `data-island` marker and a `data-props` blob for each interactive block.

That means Fresh bugs look like "the island did not hydrate because the marker was missing" or "the client-side island received stale props". The shape of the assertion becomes "the server HTML contains a `data-island` element per island call, with its serialized props".

`@kiwa-test/fresh` records the marker shape through `stringify(islandPlaceholder(Island, props))`. The output is exactly what a Fresh server ships to the browser — `<div data-island="Counter" data-props="{&quot;start&quot;:3}"></div>` — so a downstream client harness picks the marker up and drives hydration through the registry pattern.

## Why `defineHead` merges instead of concatenates

Real Fresh flows meta tags top-down — the root layout defines viewport + charset, and per-route Head fragments add the route-specific title / description / OpenGraph tags. If the merge concatenated blindly the browser would see two `<title>` elements, and the tab would show whichever the browser picked last.

`mergeHead(fragments[])` implements the canonical Fresh rule — later fragments override the earlier `title` / `base`, meta rows dedup by `name` / `property` (or singleton for `charset`), links dedup by `rel + href`, and external scripts dedup by `src`. That means a test asserting on the merged output surfaces the exact HTML the browser sees.

```ts
import { defineHead, mergeHead, renderHead } from '@kiwa-test/fresh';

const layout = defineHead({ title: 'kiwa', meta: [{ name: 'viewport', content: 'width=device-width' }] });
const page = defineHead({ title: 'kiwa — home', meta: [{ name: 'description', content: 'test framework' }] });
expect(renderHead(mergeHead([layout, page]))).toContain('<title>kiwa — home</title>');
```

Three properties are load-bearing.

- **Route title wins.** `mergeHead([layout, page])` uses the last non-empty title, so a per-route override always beats the layout default.
- **Meta dedups by `name` / `property`.** A duplicate `description` collapses to the last override; a `charset` is a singleton emitted first. Deduplication is what keeps the browser from picking a stale value.
- **`renderHead` returns canonical HTML.** Order is `title → base → meta → link → script`, so a snapshot diff catches an unintended tag reshuffling.

## Related

- Concept doc — [Modern web framework testing (Signal reactivity / Islands architecture / edge runtime + RPC type-safety SSOT)](../concepts/modern-web-framework-testing)
- v1.19-1b [#814](https://github.com/cardene777/kiwa/issues/814) — `@kiwa-test/fresh` v0.1 landing
- v1.19-3 [#809](https://github.com/cardene777/kiwa/issues/809) — `dogfood-fresh-islands` (the full 3-layer dogfood this tutorial cuts down)
