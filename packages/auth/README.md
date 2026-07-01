# @kiwa-test/auth

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package covers the Auth surface)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the Auth surface. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

Auth test adapter for kiwa — NextAuth v5 (Auth.js) session / provider / database mocks under a single `setupNextAuthEnv` helper.

## Overview

`@kiwa-test/auth` is the Layer 2 adapter that turns an auth-shaped Layer 1 spec into a runnable Vitest suite. It provides:

- **Session mock** — jwt (stateless) and database (persistent) strategies, both round-trip through `getSession` / `signOut`.
- **Provider mocks** — Google / GitHub OAuth and Email (Magic Link), each returns the shape a real provider would.
- **Database adapter mock** — Auth.js `Adapter` contract compatible, drop-in for `@auth/prisma-adapter` and `@auth/drizzle-adapter`.

## Install

```bash
pnpm add -D @kiwa-test/auth @kiwa-test/core next-auth vitest
```

`next-auth` is declared as an **optional peer dependency** with a v5-beta constraint (`>=5.0.0-beta.0 <6`) — the helper does not import from `next-auth` directly, so the peer is only required if you also assert against the real NextAuth types in your suite.

## Quick start

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

## License

MIT
