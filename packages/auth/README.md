# @kiwa-test/auth

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package covers the Auth surface)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the Auth surface. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

Auth test adapter for kiwa — NextAuth v5 (Auth.js) and Lucia v3 session / provider / database mocks under a shared package.

## Overview

`@kiwa-test/auth` is the Layer 2 adapter that turns an auth-shaped Layer 1 spec into a runnable Vitest suite. It ships two independent helpers:

- **`setupNextAuthEnv`** — NextAuth v5 (Auth.js) session / provider / database mocks.
- **`setupLuciaEnv`** — Lucia v3 password + OAuth flows across SQLite / PostgreSQL adapter shapes.

## Install

```bash
pnpm add -D @kiwa-test/auth @kiwa-test/core vitest
# and, per stack, either / both of:
pnpm add -D next-auth        # for setupNextAuthEnv
pnpm add -D lucia            # for setupLuciaEnv
```

Both `next-auth` and `lucia` are declared as **optional peer dependencies** — neither helper imports from the real library, so the peer is only required if you assert against the real types in your suite.

## Quick start — NextAuth v5

```ts
import { setupNextAuthEnv } from "@kiwa-test/auth";

const env = await setupNextAuthEnv({
  providers: ["google", "github", "email"],
  session: { strategy: "jwt" }, // or "database"
});

// 1) Sign in through a provider.
const signed = await env.signIn("google", { email: "alice@example.test" });
signed.session.sessionToken;      // opaque token
signed.user.id;                   // "user-1"

// 2) Resolve the session server-side.
const session = await env.getSession(signed.session.sessionToken);
session?.user.email;              // "alice@example.test"

// 3) Sign out (database strategy invalidates the token; jwt is stateless).
await env.signOut(signed.session.sessionToken);

// 4) Reset between tests.
await env.stop();
```

## Three provider mocks

```ts
// Google — OAuth, synthetic providerAccountId when none is passed.
await env.providers.google.signIn({ sub: "g-42", email: "a@example.test" });

// GitHub — OAuth, same shape as Google, distinct provider identifier.
await env.providers.github.signIn({ sub: "gh-1", email: "b@example.test" });

// Email — Magic Link, refuses to sign in without an email.
await env.providers.email.signIn({ email: "c@example.test" });
```

## Injecting a Prisma / Drizzle adapter

The default in-memory adapter matches the Auth.js `Adapter` contract, so you can swap it for a real Prisma or Drizzle adapter in integration tests:

```ts
import { createInMemoryAdapter, setupNextAuthEnv } from "@kiwa-test/auth";

const shared = createInMemoryAdapter(); // or your real adapter
const env = await setupNextAuthEnv({ database: shared });

await env.signIn("google", { email: "alice@example.test" });
await shared.getUserByEmail("alice@example.test"); // observed the write
```

## Example: NextAuth v5 PoC

See [`examples/auth-nextjs-nextauth-poc/`](../../examples/auth-nextjs-nextauth-poc) for the end-to-end Route Handler PoC: 8 tests cover Google / GitHub / Email flows across jwt and database strategies.

## Quick start — Lucia v3

```ts
import { setupLuciaEnv } from "@kiwa-test/auth";

const env = await setupLuciaEnv({
  providers: ["google", "github"],
  sessionExpiration: 60 * 60 * 24 * 30, // 30 days
  database: { kind: "sqlite" },          // or { kind: "postgresql" }
});

// 1) Password sign-up (Argon2-shaped hash, never plain text).
const signed = await env.signUpWithPassword({
  email: "alice@example.test",
  password: "correct-horse-battery-staple",
});
signed.session.id;                       // 40-char url-safe id
signed.session.fresh;                    // true on first issue

// 2) Password sign-in — same generic error on bad email OR bad password.
await env.signInWithPassword({ email: "alice@example.test", password: "…" });

// 3) OAuth sign-in — Google / GitHub mocks share the same profile shape.
await env.signInWithOAuth("google", { sub: "g-42", email: "…" });

// 4) Validate a session — rolling expiry flips `fresh: true` on refresh.
const validated = await env.validateSession(signed.session.id);
validated?.session.fresh;                // true when the session was rotated

// 5) Invalidate a single session or every session for a user.
await env.invalidateSession(signed.session.id);
await env.invalidateUserSessions(signed.user.id);

// 6) Reset between tests.
await env.stop();
```

## SQLite / PostgreSQL adapter compat

`createInMemoryLuciaAdapter` matches the surface of `@lucia-auth/adapter-sqlite` and `@lucia-auth/adapter-postgresql`. Both official adapters expose the same method names, so the mock is a drop-in for either — the `kind` tag is the only observable difference:

```ts
import { createInMemoryLuciaAdapter, setupLuciaEnv } from "@kiwa-test/auth";

const shared = createInMemoryLuciaAdapter("postgresql");
const env = await setupLuciaEnv({ database: shared });
env.database.kind;                       // "postgresql"
```

## Example: Lucia v3 PoC

See [`examples/auth-lucia-poc/`](../../examples/auth-lucia-poc) for the end-to-end bare-metal handler PoC: 8 tests cover password / Google / GitHub / rolling session refresh across SQLite and PostgreSQL adapter shapes.

## License

MIT
