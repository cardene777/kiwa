# Your first Supabase Auth test in 5 min

## What you'll build

A single vitest test that signs a user up with email + password, verifies the JWT, and asserts the emitted access token comes back with the expected `email` claim. Zero Supabase account needed — the whole flow runs against `@kiwa-lab/auth`'s in-memory Supabase core adapter (v1.10-1).

## Prerequisites

- Node.js ≥ 20 on your PATH
- `pnpm` or `npm` (the snippets use `pnpm`)
- An empty directory to work in

## Step-by-step build

```bash
mkdir kiwa-supabase-first-test && cd kiwa-supabase-first-test
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-lab/auth @kiwa-lab/core
```

Create `tsconfig.json`:

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

Create `src/first-supabase-test.spec.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';
import { setupSupabaseAuthEnv, type SupabaseAuthTestEnv } from '@kiwa-lab/auth';

let env: SupabaseAuthTestEnv;

afterEach(async () => {
  await env?.stop();
});

describe('supabase first test', () => {
  it('issues an access token whose claims match the signed-in user', async () => {
    env = await setupSupabaseAuthEnv({
      users: [{ email: 'alice@example.test', password: 'strong', emailConfirmed: true }],
    });
    const { session } = await env.auth.signInWithPassword({
      email: 'alice@example.test',
      password: 'strong',
    });
    const claims = await env.verifyToken(session.accessToken);
    expect(claims.email).toBe('alice@example.test');
  });
});
```

Add the test script to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run"
  },
  "type": "module"
}
```

Run:

```bash
pnpm test
```

You should see one passing test in under 500ms.

## Explanation

- `setupSupabaseAuthEnv` returns an `env` shaped like `@supabase/supabase-js`'s `client.auth.*` surface. The `users` seed pre-provisions accounts so the test skips signup.
- `env.auth.signInWithPassword` returns the same `{ user, session }` shape production Supabase returns. Sessions carry HS256 JWTs signed with a per-env secret, so tests can't accidentally accept tokens from another test's env.
- `env.verifyToken` decodes the JWT and returns the claim payload. If the token was tampered or expired, it throws.
- `afterEach(env.stop)` clears the in-memory state so each test starts fresh.

## Troubleshoot

- **`Cannot find module '@kiwa-lab/auth'`** — Delete `node_modules` + reinstall. When `@kiwa-lab/core` is not resolvable, pnpm sometimes silently skips the peer dep.
- **`signature mismatch`** — You are verifying a token from a *different* `setupSupabaseAuthEnv()` call. Each env has its own secret; do not share tokens across envs.
- **`invalid login credentials`** — The seed user had `password: 'strong'` but you signed in with a different password. The seed values are literal strings, not placeholders.

## Next steps

- Try [RabbitMQ DLX test recipe](./02-rabbitmq-dlx-recipe.md) for the queue side.
- The Supabase advanced adapter ([`setupSupabaseAdvancedEnv`](https://github.com/cardene777/kiwa/blob/main/packages/auth/README.md)) adds RLS + MFA + SSO + SIWE.
