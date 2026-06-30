# @kiwa-test/nextjs

Next.js App Router test adapter for [kiwa](https://github.com/cardene777/kiwa) — invoke Server Actions in isolation and capture redirect / cookie / header side-effects without a running Next.js server.

```bash
pnpm add -D @kiwa-test/nextjs
```

## Why

Next.js Server Actions (`'use server'`) are async functions that can throw `redirect()`, mutate cookies, and call `revalidatePath()` — none of which return values. Integration-level testing through Playwright works but is slow and flaky. `@kiwa-test/nextjs` lets you call the action **directly in Vitest** and assert on the captured side-effects.

## Quick start

```ts
import { describe, expect, it } from 'vitest';
import { invokeServerAction, REDIRECT_SYMBOL } from '@kiwa-test/nextjs';

// app/actions.ts — your Server Action
async function login(formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) throw new Error('email required');
  // In production: redirect('/dashboard') from 'next/navigation'.
  // In tests: throw a kiwa redirect signal so the helper can capture it.
  throw {
    [REDIRECT_SYMBOL]: true,
    url: '/dashboard',
    type: 'replace',
  };
}

describe('login', () => {
  it('redirects to /dashboard on success', async () => {
    const fd = new FormData();
    fd.set('email', 'user@example.com');
    const { env, error } = await invokeServerAction({ action: login, formData: fd });
    expect(error).toBeUndefined();
    expect(env.redirect?.url).toBe('/dashboard');
  });

  it('returns validation error when email is missing', async () => {
    const { error } = await invokeServerAction({ action: login, formData: new FormData() });
    expect((error as Error).message).toBe('email required');
  });
});
```

## API

### `invokeServerAction<TResult>(opts): Promise<ServerActionResult<TResult>>`

Invokes a `'use server'` action and captures side-effects.

| `opts` field | Type | Default | Meaning |
|---|---|---|---|
| `action` | `(...args) => Promise<T> \| T` | required | The Server Action under test |
| `formData` | `FormData` | empty | First positional argument |
| `args` | `unknown[]` | `[]` | Extra args appended after `formData` (useful for `useFormState` `(prevState, formData)` shape) |
| `cookies` | `Record<string, string>` | `{}` | Initial cookie jar entries |
| `headers` | `Record<string, string>` | `{}` | Initial request headers (case-insensitive) |

The returned `ServerActionResult` exposes `result` (the resolved value), `error` (any non-redirect throw), and `env` (captured cookies / headers / redirect / revalidate signals).

### `REDIRECT_SYMBOL`

Throw a `{ [REDIRECT_SYMBOL]: true, url, type }` from your action to signal a redirect. The helper normalizes it into `env.redirect` instead of leaking it as an error. Production code keeps using `redirect()` from `next/navigation` — only the test seam differs.

## RSC streaming + Suspense boundary (v1.1+, Issue #558)

`setupNextRscEnv` extends the RSC seam to streaming chunks and Suspense boundary transitions — the cases `renderServerComponent` (leaf-level + signal capture) does not model.

```ts
import { describe, expect, it } from 'vitest';
import { setupNextRscEnv } from '@kiwa-test/nextjs';

async function* streamItems() {
  yield { type: 'div', key: null, props: { children: 'partial: 1 item' } };
  yield { type: 'div', key: null, props: { children: 'partial: 2 items' } };
  yield { type: 'ul', key: null, props: { children: ['a', 'b', 'c'] } };
}

const fallback = { type: 'div', key: null, props: { children: 'loading…' } };

describe('streamItems', () => {
  it('captures fallback then resolved subtree in order', async () => {
    const env = await setupNextRscEnv({
      dataSource: streamItems(),
      suspenseFallback: fallback,
      streamingTimeout: 1000,
    });
    expect(env.fallback).toBe(fallback);
    expect(env.chunks).toHaveLength(4); // fallback + 3 yields
    expect(env.chunks[0]).toBe(fallback);
    expect(env.resolved).not.toBeNull();
    expect(env.errorBoundary).toBeNull();
    expect(env.timedOut).toBe(false);
  });

  it('routes a thrown chunk into errorBoundary', async () => {
    async function* broken() {
      yield fallback;
      throw new Error('stream broken');
    }
    const env = await setupNextRscEnv({ dataSource: broken() });
    expect(env.errorBoundary).not.toBeNull();
    expect((env.errorBoundary?.error as Error).message).toBe('stream broken');
    expect(env.resolved).toBeNull();
  });
});
```

| `env` field | Type | Meaning |
|---|---|---|
| `chunks` | `RscNode[]` | All chunks in arrival order. `chunks[0]` is the Suspense fallback when one is provided. |
| `fallback` | `RscNode \| null` | The fallback markup the helper captured before streaming started. |
| `resolved` | `RscNode \| null` | The last chunk yielded by the source — what a real page settles on. `null` when the source threw or only the fallback was emitted. |
| `errorBoundary` | `RscErrorBoundarySignal \| null` | Set when component / stream throws or `injectError` is provided. Mirrors what `error.tsx` would see. |
| `timedOut` | `boolean` | `true` when `streamingTimeout` elapsed before the source completed. |

## Out of scope (tracked separately)

- **Real React `renderToReadableStream` rendering / flight payload byte format** — leaf-level coverage lives in `renderServerComponent`, full wire protocol stays out of scope.
- **Multiple concurrent Suspense boundaries interleaving** — one boundary per `setupNextRscEnv` call.
- **End-to-end browser flow after the action** — use `/kiwa-e2e` or `/kiwa-play` instead.

## License

MIT
