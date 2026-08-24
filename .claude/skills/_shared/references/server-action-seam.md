# Server Action injectable seam pattern

Next.js production code uses `redirect()` / `cookies()` / `revalidatePath()` from `next/navigation` / `next/headers` / `next/cache`. These imports throw / mutate global request scope and **cannot run inside a unit test** without a live Next.js server.

`@kiwa-lab/nextjs` works around this by requiring the Server Action under test to accept its environment via an **injectable seam** — a parameter or a module-level setter that defaults to the real Next.js bindings in production but can be replaced in tests.

This file covers the **env seam only**. An action also leaks state between test cases when it reads or writes module-level data (an in-memory store, a cache, a connection pool), and no amount of env refactoring fixes that. That axis is handled in the test rather than in the action — see `SKILL.md` § data seam (seed する軸).

## Pattern A — env parameter (recommended)

The action takes an optional `env` parameter holding `redirect` / `cookies` / `revalidatePath` callables. Production code passes nothing (the parameter defaults to the real Next.js bindings); tests pass a kiwa-friendly env.

```ts
// app/actions/login.ts
import { redirect as nextRedirect } from 'next/navigation';
import { cookies as nextCookies } from 'next/headers';
import { REDIRECT_SYMBOL } from '@kiwa-lab/nextjs';

type LoginEnv = {
  redirect: (url: string) => never;
  cookies: { set: (name: string, value: string) => void };
};

const defaultEnv: LoginEnv = {
  redirect: (url) => nextRedirect(url),
  cookies: {
    set: (name, value) => nextCookies().set(name, value),
  },
};

export async function login(formData: FormData, env: LoginEnv = defaultEnv) {
  'use server';
  const email = formData.get('email') as string;
  if (!email) throw new Error('email required');
  env.cookies.set('session', `sid_${email}`);
  env.redirect('/dashboard');
}
```

The kiwa test supplies its own env that throws a `REDIRECT_SYMBOL` signal and writes into the captured cookie jar:

```ts
import { invokeServerAction, REDIRECT_SYMBOL } from '@kiwa-lab/nextjs';
import { login } from '../app/actions/login.js';

const env = await invokeServerAction({
  action: async (fd) =>
    login(fd as FormData, {
      redirect: (url) => {
        throw { [REDIRECT_SYMBOL]: true, url, type: 'replace' };
      },
      cookies: {
        set: (name, value) => env.cookies.set(name, value),
      },
    }),
  formData: (() => {
    const fd = new FormData();
    fd.set('email', 'user@example.com');
    return fd;
  })(),
});
```

This is the **default pattern `/kiwa-nextjs` generates**. The action stays 1 import away from production behavior and the test stays fully synchronous + deterministic.

## Pattern B — module-level setter (legacy code)

If the action cannot accept a parameter (e.g. it is called by Next.js form binding via raw `action={login}`), use a module-level setter:

```ts
// app/actions/login.ts
let _redirect: (url: string) => never = (url) => {
  // production binding
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { redirect } = require('next/navigation') as { redirect: (u: string) => never };
  return redirect(url);
};

export function __setRedirectForTesting(fn: typeof _redirect) {
  _redirect = fn;
}

export async function login(formData: FormData) {
  'use server';
  // ...
  _redirect('/dashboard');
}
```

The test sets the binding before calling `invokeServerAction`. Less clean than Pattern A — avoid for new code, but it works for refactoring legacy actions in place.

## When the seam is missing

`/kiwa-nextjs` detects unrefactored actions (no `env` parameter and no setter export) and **fails the test generation** rather than producing a stub that cannot run. The user receives the action path and a one-shot refactor suggestion (this file's Pattern A snippet).

## Limitations

- `revalidatePath` / `revalidateTag` capturing is **not implemented in v1.0** — the action's revalidate call is silently no-op'd during tests. Tracked separately if real-world demand surfaces.
- `headers().get()` reading from inside the action requires the same env-parameter pattern. The kiwa helper exposes a captured headers `Map` via the result for assertions.
