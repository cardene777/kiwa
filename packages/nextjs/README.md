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

## Out of scope (tracked separately)

- **React Server Components (RSC) render assertions** — [#494](https://github.com/cardene777/kiwa/issues/494)
- **`middleware.ts` invocation** — [#495](https://github.com/cardene777/kiwa/issues/495)
- **End-to-end browser flow after the action** — use `/kiwa-e2e` or `/kiwa-play` instead

## License

MIT
