# @kiwa-test/auth

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package covers the Auth surface)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the Auth surface. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

Auth test adapter for kiwa — NextAuth v5 (Auth.js), Lucia v3, and Better Auth session / provider / database mocks under a shared package.

## Overview

`@kiwa-test/auth` is the Layer 2 adapter that turns an auth-shaped Layer 1 spec into a runnable Vitest suite. It ships three independent helpers:

- **`setupNextAuthEnv`** — NextAuth v5 (Auth.js) session / provider / database mocks.
- **`setupLuciaEnv`** — Lucia v3 password + OAuth flows across SQLite / PostgreSQL adapter shapes.
- **`setupBetterAuthEnv`** — Better Auth email/password + magic link + 2FA (TOTP) + social sign-in + organizations / passkey plugins across Prisma / Drizzle / Kysely adapter shapes.

## Install

```bash
pnpm add -D @kiwa-test/auth @kiwa-test/core vitest
# and, per stack, any of:
pnpm add -D next-auth        # for setupNextAuthEnv
pnpm add -D lucia            # for setupLuciaEnv
pnpm add -D better-auth      # for setupBetterAuthEnv
```

`next-auth`, `lucia`, and `better-auth` are declared as **optional peer dependencies** — none of the helpers imports from the real library, so the peer is only required if you assert against the real types in your suite.

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

## Quick start — Better Auth

```ts
import { setupBetterAuthEnv, generateTotpCode } from "@kiwa-test/auth";

const env = await setupBetterAuthEnv({
  providers: ["google", "github"],
  plugins: ["emailAndPassword", "magicLink", "twoFactor", "organizations", "passkey"],
  sessionExpiration: 60 * 60 * 24 * 7, // 7 days
  database: { kind: "prisma" },          // or "drizzle" / "kysely"
});

// 1) Password sign-up — same generic error on bad email OR bad password.
const signed = await env.signUpWithPassword({
  email: "alice@example.test",
  password: "correct-horse-battery-staple",
});
signed.session.token;                    // 40-char url-safe bearer token

// 2) Magic link — the token would go in the click-through URL.
const { token } = await env.sendMagicLink({ email: "alice@example.test" });
await env.consumeMagicLink({ email: "alice@example.test", token });

// 3) 2FA / TOTP — enroll, then verify against a code the authenticator app emits.
const { secret } = await env.enrollTwoFactor({ userId: signed.user.id });
const code = generateTotpCode(secret);
await env.verifyTwoFactorCode({ userId: signed.user.id, code });

// 4) Social sign-in — Google / GitHub mocks share the same profile shape.
await env.signInWithOAuth("google", { sub: "g-42", email: "…" });

// 5) Organizations plugin — creator is auto-added as owner.
const org = await env.createOrganization({
  name: "Acme",
  slug: "acme",
  userId: signed.user.id,
});
await env.inviteToOrganization({ organizationId: org.id, userId: "…", role: "admin" });

// 6) Passkey plugin — records the WebAuthn credential shape without the ceremony.
await env.registerPasskey({
  userId: signed.user.id,
  credentialId: "cred-abc",
  publicKey: "pk-xyz",
});

// 7) Validate / invalidate.
await env.validateSession(signed.session.token);
await env.invalidateSession(signed.session.token);
await env.invalidateUserSessions(signed.user.id);

// 8) Reset between tests.
await env.stop();
```

## Prisma / Drizzle / Kysely adapter compat

`createInMemoryBetterAuthAdapter` matches the operation surface of `better-auth/adapters/prisma`, `better-auth/adapters/drizzle`, and `better-auth/adapters/kysely`. All three official adapters funnel through the same operation set at the Better Auth layer, so the mock is a drop-in for any of them — the `kind` tag is the only observable difference:

```ts
import { createInMemoryBetterAuthAdapter, setupBetterAuthEnv } from "@kiwa-test/auth";

const shared = createInMemoryBetterAuthAdapter("drizzle");
const env = await setupBetterAuthEnv({ database: shared });
env.database.kind;                       // "drizzle"
```

## Plugin surface

Plugins are opt-in — a helper method rejects with a `requires the "<plugin>" plugin to be enabled` error when the corresponding entry is missing from `plugins`.

| Plugin | Unlocks |
|---|---|
| `emailAndPassword` | `signUpWithPassword` / `signInWithPassword` |
| `magicLink` | `sendMagicLink` / `consumeMagicLink` |
| `twoFactor` | `enrollTwoFactor` / `verifyTwoFactorCode` + `generateTotpCode` for consumer tests |
| `organizations` | `createOrganization` / `inviteToOrganization` |
| `passkey` | `registerPasskey` |

Social sign-in (`signInWithOAuth`) is always available and configured through `providers`.

## Example: Better Auth PoC

See [`examples/auth-better-auth-poc/`](../../examples/auth-better-auth-poc) for the end-to-end bare-metal handler PoC: 8 tests cover password / magic link / 2FA / Google / GitHub across Prisma / Drizzle / Kysely adapter shapes.

## License

MIT
