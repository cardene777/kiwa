# Testing Next.js Server Actions with @kiwa-lab/nextjs

## What you'll build

A vitest test that drives a Next.js App Router server action (`'use server'`) end-to-end — with cookies, headers, and the built-in `redirect` signal — without booting a Next.js dev server.

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- An empty directory (or an existing Next.js project)

## Step-by-step build

```bash
mkdir kiwa-nextjs-actions && cd kiwa-nextjs-actions
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-lab/nextjs
```

Set `type: module` in `package.json`:

```json
{
  "type": "module",
  "scripts": { "test": "vitest run" }
}
```

Add a minimal `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "es2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  }
}
```

Add a server action at `app/actions.ts`:

```ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  if (email === 'alice@example.test' && password === 'strong') {
    cookies().set('session', `sess-${email}`, { httpOnly: true, path: '/' });
    redirect('/dashboard');
  }
  throw new Error('invalid credentials');
}
```

Add a test at `tests/login.spec.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { invokeServerAction } from '@kiwa-lab/nextjs';
import { login } from '../app/actions.js';

describe('login server action', () => {
  it('sets a session cookie and redirects to /dashboard on success', async () => {
    const form = new FormData();
    form.set('email', 'alice@example.test');
    form.set('password', 'strong');

    const result = await invokeServerAction({
      action: () => login(form),
    });

    expect(result.cookies['session']?.value).toBe('sess-alice@example.test');
    expect(result.redirect?.destination).toBe('/dashboard');
  });

  it('throws on wrong password', async () => {
    const form = new FormData();
    form.set('email', 'alice@example.test');
    form.set('password', 'wrong');

    await expect(
      invokeServerAction({ action: () => login(form) }),
    ).rejects.toThrow(/invalid credentials/);
  });
});
```

Run:

```bash
pnpm test
```

## Explanation

- `invokeServerAction({ action })` runs the action within a simulated Next.js request scope so `cookies()` + `headers()` + `redirect()` behave the same as they do in production.
- The returned `result` captures every side effect the action produced — the cookies it set, the headers it wrote, and the redirect it threw.
- Because the harness is in-process, tests run in milliseconds — no Next.js compile step, no port bind, no cleanup.

## Troubleshoot

- **`redirect() is not a function`** — Make sure `next/navigation` resolves to the Next.js 14+ runtime. `@kiwa-lab/nextjs` peer-depends on `next@^14 || ^15`.
- **`cookies() outside request scope`** — You called `login()` outside `invokeServerAction`. The harness sets up the request scope on entry; anything that reads `cookies()` must run inside its callback.
- **Redirect never fires** — Server actions raise the redirect as a distinguished throw. `invokeServerAction` catches it; your own `try/catch` around `action()` would swallow it before the harness sees it.

## Next steps

- [Multi-provider auth](./05-multi-provider-auth.md) shows how to plug NextAuth + Clerk + Auth0 into the same action.
- The App Router variants of the harness cover middleware, RSC, and RSC streaming — see [`@kiwa-lab/nextjs`](../../packages/nextjs/README.md).
