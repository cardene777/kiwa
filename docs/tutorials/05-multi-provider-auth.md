# Multi-provider auth testing (NextAuth + Clerk + Auth0)

## What you'll build

A single vitest test file that runs the same login-then-fetch-profile flow against three different auth providers — NextAuth v5, Clerk, Auth0 — using `@kiwa-test/auth`'s per-provider adapters. The point is to prove that a provider-neutral shape you write once can be swapped freely.

## Prerequisites

- Node.js ≥ 20
- `pnpm`
- An empty directory

## Step-by-step build

```bash
mkdir kiwa-multi-provider && cd kiwa-multi-provider
pnpm init -y
pnpm add -D vitest typescript @types/node @kiwa-test/auth @kiwa-test/core
```

Set `type: module` + test script in `package.json`:

```json
{
  "type": "module",
  "scripts": { "test": "vitest run" }
}
```

Add `tsconfig.json`:

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

Create `src/provider-adapter.ts` — the neutral shape:

```ts
export interface Session {
  userId: string;
  email: string;
}

export interface ProviderAdapter {
  readonly name: string;
  signIn(email: string): Promise<Session>;
  stop(): Promise<void>;
}
```

Create `src/adapters.ts` — one per provider:

```ts
import { setupAuth0Env, setupClerkEnv, setupNextAuthEnv } from '@kiwa-test/auth';
import type { ProviderAdapter } from './provider-adapter.js';

export async function nextauthAdapter(): Promise<ProviderAdapter> {
  const env = await setupNextAuthEnv({
    users: [{ email: 'alice@example.test', name: 'Alice' }],
  });
  return {
    name: 'nextauth',
    async signIn(email) {
      const session = await env.callbacks.session(email);
      return { userId: session.user.id, email: session.user.email! };
    },
    stop: env.stop,
  };
}

export async function clerkAdapter(): Promise<ProviderAdapter> {
  const env = await setupClerkEnv({
    users: [{ id: 'user_1', email: 'alice@example.test' }],
  });
  return {
    name: 'clerk',
    async signIn(email) {
      await env.signIn('user_1');
      const claims = await env.assertSignedIn();
      return { userId: claims.userId, email };
    },
    stop: env.stop,
  };
}

export async function auth0Adapter(): Promise<ProviderAdapter> {
  const env = await setupAuth0Env({ tenant: 'example-corp' });
  const user = await env.mgmt.users.create({
    email: 'alice@example.test',
    connection: 'email',
  });
  return {
    name: 'auth0',
    async signIn() {
      return { userId: user.user_id, email: user.email };
    },
    stop: env.stop,
  };
}
```

Add `tests/matrix.spec.ts`:

```ts
import { afterEach, describe, expect, it } from 'vitest';
import {
  auth0Adapter,
  clerkAdapter,
  nextauthAdapter,
} from '../src/adapters.js';
import type { ProviderAdapter } from '../src/provider-adapter.js';

const adapters: ProviderAdapter[] = [];

afterEach(async () => {
  while (adapters.length > 0) {
    const a = adapters.pop();
    await a?.stop();
  }
});

async function withAdapter(factory: () => Promise<ProviderAdapter>): Promise<ProviderAdapter> {
  const a = await factory();
  adapters.push(a);
  return a;
}

describe.each([
  ['nextauth', nextauthAdapter],
  ['clerk', clerkAdapter],
  ['auth0', auth0Adapter],
] as const)('provider matrix — %s', (label, factory) => {
  it(`${label} signs in alice + surfaces her email`, async () => {
    const adapter = await withAdapter(factory);
    const session = await adapter.signIn('alice@example.test');
    expect(session.email).toBe('alice@example.test');
    expect(session.userId).toBeTruthy();
  });
});
```

Run:

```bash
pnpm test
```

You should see 3 passing tests — one per provider.

## Explanation

- The `ProviderAdapter` interface is small on purpose. Only the shape the test actually needs is exposed; the provider-specific surface (Clerk's `assertOrgRole`, Auth0's rules, NextAuth's callbacks) stays behind the adapter.
- `describe.each` iterates the matrix so adding a fourth provider is one factory + one line in the tuple list.
- Every adapter's `stop()` cleans in-memory state so tests are independent.

## Troubleshoot

- **`env.callbacks.session is not a function`** — NextAuth v5 renamed callbacks; make sure `@kiwa-test/auth` is on v0.3+.
- **`Clerk.signIn` throws `user_1 not found`** — Clerk envs are seeded via the `users: [{ id: ... }]` array. Check the id matches what you pass to `signIn`.
- **Auth0 mgmt.users.create returns `null`** — The tenant name is required. Setup with `setupAuth0Env({ tenant: '<name>' })`.

## Next steps

- The Supabase Auth provider (v1.10-1) fits the same interface — try adding it as a fourth adapter.
- For multi-provider queue matrices see [`packages/queue/README.md`](../../packages/queue/README.md) (BullMQ / Inngest / SQS / Cloudflare / RabbitMQ).
