# @kiwa-lab/auth

<p align="center">
  <img src="https://raw.githubusercontent.com/cardene777/kiwa/main/assets/kiwa-promo-en.gif" alt="kiwa 127s overview — generate full-spec tests across Web (Next.js) / Contract (Solidity) / dApp (Playwright) in 6 steps (this package covers the Auth surface)" width="640" />
  <br />
  <sub>Full <a href="https://github.com/cardene777/kiwa">kiwa</a> overview (127s) — this package covers the Auth surface. <a href="https://github.com/cardene777/kiwa/blob/main/assets/kiwa-promo-en.mp4">▶ Full-quality MP4 (2.9 MB)</a>.</sub>
</p>

Auth test adapter for kiwa — NextAuth v5 (Auth.js), Lucia v3, Better Auth, Clerk, Auth0, and Supabase Auth core session / provider / database mocks under a shared package.

## Overview

`@kiwa-lab/auth` is the Layer 2 adapter that turns an auth-shaped Layer 1 spec into a runnable Vitest suite. It ships six independent helpers:

- **`setupNextAuthEnv`** — NextAuth v5 (Auth.js) session / provider / database mocks.
- **`setupLuciaEnv`** — Lucia v3 password + OAuth flows across SQLite / PostgreSQL adapter shapes.
- **`setupBetterAuthEnv`** — Better Auth email/password + magic link + 2FA (TOTP) + social sign-in + organizations / passkey plugins across Prisma / Drizzle / Kysely adapter shapes.
- **`setupClerkEnv`** — Clerk hosted-auth mock with JWT verification, `users` / `sessions` / `organizations` APIs mirroring `@clerk/backend`, and multi-tenant org roles (owner / admin / member).
- **`setupAuth0Env`** — Auth0 enterprise-tenant mock with id_token + access_token issuance, `users` (Management API) + `authenticate` (Authentication API) surfaces, rules pipeline, and actions triggers (post-login / pre-user-registration / post-user-registration / post-change-password).
- **`setupSupabaseAuthEnv`** — Supabase Auth (GoTrue) core mock — email/password + OAuth (Google / GitHub / Apple) PKCE + magic link + SMS OTP + JWT session (HS256 access_token / opaque refresh_token) mirroring `@supabase/supabase-js`'s `client.auth.*` + `admin.*` API. RLS / MFA / SSO SAML / Web3 wallet auth are covered by the advanced adapter in v1.10-2.

## Install

```bash
pnpm add -D @kiwa-lab/auth @kiwa-lab/core vitest
# and, per stack, any of:
pnpm add -D next-auth        # for setupNextAuthEnv
pnpm add -D lucia            # for setupLuciaEnv
pnpm add -D better-auth      # for setupBetterAuthEnv
pnpm add -D @clerk/backend           # for setupClerkEnv (optional — mock is standalone)
pnpm add -D auth0                    # for setupAuth0Env  (optional — mock is standalone)
pnpm add -D @supabase/supabase-js    # for setupSupabaseAuthEnv (optional — mock is standalone)
```

`next-auth`, `lucia`, `better-auth`, `@clerk/backend`, and `auth0` are declared as **optional peer dependencies** — none of the helpers imports from the real library, so the peer is only required if you assert against the real types in your suite.

## Quick start — NextAuth v5

```ts
import { setupNextAuthEnv } from "@kiwa-lab/auth";

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
import { createInMemoryAdapter, setupNextAuthEnv } from "@kiwa-lab/auth";

const shared = createInMemoryAdapter(); // or your real adapter
const env = await setupNextAuthEnv({ database: shared });

await env.signIn("google", { email: "alice@example.test" });
await shared.getUserByEmail("alice@example.test"); // observed the write
```

## Example: NextAuth v5 PoC

See [`examples/auth-nextjs-nextauth-poc/`](../../examples/auth-nextjs-nextauth-poc) for the end-to-end Route Handler PoC: 8 tests cover Google / GitHub / Email flows across jwt and database strategies.

## Quick start — Lucia v3

```ts
import { setupLuciaEnv } from "@kiwa-lab/auth";

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
import { createInMemoryLuciaAdapter, setupLuciaEnv } from "@kiwa-lab/auth";

const shared = createInMemoryLuciaAdapter("postgresql");
const env = await setupLuciaEnv({ database: shared });
env.database.kind;                       // "postgresql"
```

## Example: Lucia v3 PoC

See [`examples/auth-lucia-poc/`](../../examples/auth-lucia-poc) for the end-to-end bare-metal handler PoC: 8 tests cover password / Google / GitHub / rolling session refresh across SQLite and PostgreSQL adapter shapes.

## Quick start — Better Auth

```ts
import { setupBetterAuthEnv, generateTotpCode } from "@kiwa-lab/auth";

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
import { createInMemoryBetterAuthAdapter, setupBetterAuthEnv } from "@kiwa-lab/auth";

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

## Quick start — Clerk

```ts
import { setupClerkEnv } from "@kiwa-lab/auth";

const env = await setupClerkEnv({
  users: [{ primaryEmailAddress: "alice@example.test" }],
  orgs: [
    { name: "Acme", slug: "acme", createdByEmail: "alice@example.test" },
  ],
  tokens: [{ userEmail: "alice@example.test", organizationSlug: "acme" }],
});

// 1) Seeded token — ready to drop into an Authorization header.
const seeded = env.seededTokens["alice@example.test"];
seeded.token;                            // signed JWT

// 2) Verify the token — mirrors @clerk/backend `verifyToken`.
const claims = await env.verifyToken(seeded.token);
claims.sub;                              // "user_000001"
claims.org_id;                           // "org_000001"
claims.org_role;                         // "owner"

// 3) Ad-hoc signIn.
const signed = await env.signIn({ email: "alice@example.test" });
signed.token;                            // fresh JWT for a new session

// 4) Users / sessions / organizations API mirror @clerk/backend.
await env.users.getUser(signed.user.id);
await env.sessions.revokeSession(signed.session.id);
await env.organizations.createMembership({
  organizationId: claims.org_id!,
  userId: signed.user.id,
  role: "admin",
});

// 5) Reset between tests.
await env.stop();
```

## `@clerk/backend` API surface

`env.users` / `env.sessions` / `env.organizations` match the shape of `@clerk/backend`'s client. The mock is drop-in for call sites that pass around a Clerk client — swap `createClerkClient({ secretKey })` for the env in the test setup and every call resolves against the in-memory store.

| Surface | Methods |
|---|---|
| `env.users` | `createUser` / `getUser` / `getUserByEmail` / `updateUser` / `deleteUser` / `listUsers` |
| `env.sessions` | `createSession` / `getSession` / `revokeSession` / `listSessionsForUser` |
| `env.organizations` | `createOrganization` / `getOrganization` / `getOrganizationBySlug` / `createMembership` / `getOrganizationMembership` / `listMembershipsForUser` / `listMembershipsForOrganization` / `updateMembership` / `deleteMembership` |

## JWT session claims

`env.verifyToken` returns Clerk-shaped session claims:

```ts
{
  sub: "user_000001",     // Clerk user id
  sid: "sess_000001",     // Clerk session id
  org_id: "org_000001",   // active organization (when scoped)
  org_role: "owner",      // owner | admin | member
  org_slug: "acme",       // active organization slug
  iat: 1699999999,        // issued at (seconds since epoch)
  exp: 1700604799,        // expires at
  iss: "https://mock.clerk.accounts.dev",
}
```

The mock signs tokens with HS256 (real Clerk uses RS256) — the on-the-wire shape is identical, and every consumer that decodes with `base64url` sees the same three-segment structure. Tokens issued by one env cannot be verified by another (per-env signing secret), which matches Clerk's per-instance signing key semantics.

## Example: Clerk PoC

See [`examples/auth-clerk-poc/`](../../examples/auth-clerk-poc) for the end-to-end bare-metal handler PoC: 8 tests cover token verification, session revocation, multi-tenant org role gating, and seeded-token flows.

## Quick start — Auth0

```ts
import { setupAuth0Env } from "@kiwa-lab/auth";

const env = await setupAuth0Env({
  tenant: "kiwa-test",
  audience: "https://api.kiwa.test/",
  users: [{ email: "alice@example.test", password: "pw-1", app_metadata: { role: "admin" } }],
  actions: {
    "post-login": [
      (event, api) => {
        const role = event.user.app_metadata?.role;
        if (role) api.accessToken.setCustomClaim("https://kiwa.test/roles", [role]);
      },
    ],
  },
});

// 1) signIn returns id_token + access_token (both JWTs).
const { id_token, access_token, user } = await env.authenticate.signIn({
  email: "alice@example.test",
  password: "pw-1",
});

// 2) Verify tokens — mirrors express-jwt + jwks-rsa in real backends.
const idClaims = await env.verifyIdToken(id_token);
idClaims.sub;                    // "auth0|000000000000000000000001"
idClaims.aud;                    // env.clientId
idClaims.iss;                    // "https://kiwa-test.auth0.com/"

const accessClaims = await env.verifyAccessToken(access_token);
accessClaims.aud;                // "https://api.kiwa.test/"
accessClaims["https://kiwa.test/roles"];  // ["admin"] — injected by the post-login action

// 3) signUp creates a new user + issues fresh tokens.
const signup = await env.authenticate.signUp({
  email: "new@example.test",
  password: "pw-signup",
  user_metadata: { locale: "ja" },
});

// 4) Reset between tests.
await env.stop();
```

## `auth0` SDK API surface

`env.users` mirrors `ManagementClient.users.*` and `env.authenticate` mirrors `AuthenticationClient.*` from the real `auth0` node SDK. The mock is drop-in for call sites that pass around either client — swap the constructors for the env in the test setup and every call resolves against the in-memory tenant.

| Surface | Methods |
|---|---|
| `env.users` (Management API) | `create` / `get` / `getByEmail` / `update` / `delete` / `list` |
| `env.authenticate` (Authentication API) | `signIn` / `signUp` |
| `env.rules` (legacy pipeline) | `add` / `list` / `clear` |
| `env.actions` (triggers) | `add(trigger, action)` / `list(trigger)` / `clear(trigger?)` |
| `env.verifyIdToken` / `env.verifyAccessToken` | HS256 JWT verify against per-env signing secret |

Supported action triggers ... `post-login` / `pre-user-registration` / `post-user-registration` / `post-change-password`. The `api` object mirrors Auth0's real Actions runtime — `api.idToken.setCustomClaim` / `api.accessToken.setCustomClaim` / `api.accessToken.addScope` / `api.user.setAppMetadata` / `api.user.setUserMetadata` / `api.redirect.sendUserTo` / `api.access.deny`.

## JWT token claims

`env.verifyIdToken` / `env.verifyAccessToken` return Auth0-shaped claims:

```ts
// id_token
{
  sub: "auth0|000000000000000000000001",
  aud: "mock-client-id",             // client id
  iss: "https://kiwa-test.auth0.com/",
  iat: 1699999999,
  exp: 1700086399,
  azp: "mock-client-id",
  email: "alice@example.test",
  email_verified: true,
  // + namespaced custom claims from rules / actions
}

// access_token
{
  sub: "auth0|000000000000000000000001",
  aud: "https://api.kiwa.test/",     // API audience
  iss: "https://kiwa-test.auth0.com/",
  iat: 1699999999,
  exp: 1700086399,
  azp: "mock-client-id",
  permissions: ["read:profile"],     // Auth0 RBAC (from api.accessToken.addScope)
}
```

The mock signs tokens with HS256 (real Auth0 uses RS256 + JWKS) — the on-the-wire shape is identical, and every consumer that decodes with `base64url` sees the same three-segment structure. Tokens issued by one env cannot be verified by another (per-env signing secret), which matches Auth0's per-tenant signing key semantics.

## Example: Auth0 PoC

See [`examples/auth-auth0-poc/`](../../examples/auth-auth0-poc) for the end-to-end bare-metal handler PoC: 8 tests cover access_token verification, cross-tenant rejection, rules + actions role injection, and signUp round trips.

## Quick start — Supabase Auth core

```ts
import { setupSupabaseAuthEnv } from "@kiwa-lab/auth";

const env = await setupSupabaseAuthEnv({
  projectUrl: "https://my.supabase.co",
  users: [
    { email: "alice@example.test", password: "secret", emailConfirmed: true },
  ],
});

// Password sign-in — returns a full session (access_token + refresh_token).
const { session } = await env.auth.signInWithPassword({
  email: "alice@example.test",
  password: "secret",
});

// Magic-link OTP flow.
const { otp } = await env.auth.signInWithOtp({ email: "new@example.test" });
otp.magicLink;   // "https://my.supabase.co/auth/v1/verify?token=..."
otp.code;        // "654321" — 6-digit OTP surfaced for direct verification
await env.auth.verifyOtp({
  email: "new@example.test",
  token: otp.code,
  type: "magiclink",
});

// OAuth PKCE flow.
const authUrl = await env.auth.signInWithOAuth({ provider: "github" });
const { session: ghSession } = await env.auth.exchangeCodeForSession({
  code: authUrl.code,
  codeVerifier: authUrl.codeVerifier,
});

// JWT verification — access_token is HS256-signed with a per-env secret.
const claims = await env.verifyToken(session.accessToken);
claims.sub;                // Supabase user id
claims.role;               // "authenticated"
claims.amr[0]?.method;     // "password" / "oauth:github" / "otp:magiclink" / "refresh_token"

// Admin (service-role) API — mirrors @supabase/supabase-js's admin surface.
const created = await env.admin.createUser({
  email: "admin-created@example.test",
  password: "x",
  emailConfirm: true,
  appMetadata: { role: "internal" },
});

// Introspection — every OTP delivery + pending OAuth URL is captured so tests
// never have to mock the email / SMS inbox.
env.listOtpDeliveries("email").length;   // number of magic links sent
env.listOAuthPending().length;            // number of authorization URLs in flight

await env.stop();
```

`setupSupabaseAuthEnv` is standalone — no `@supabase/supabase-js` install needed to drive the mock. Real Supabase clients can be layered on top by pointing them at the exposed access / refresh tokens.

### JWT claim shape

```ts
// access_token — HS256-signed, verifiable with env.verifyToken.
{
  sub: "user-1",
  aud: "authenticated",
  role: "authenticated",              // "authenticated" | "anon" | "service_role"
  email: "alice@example.test",
  phone: undefined,
  app_metadata: { provider: "email" },  // writeable only via admin API
  user_metadata: { firstName: "Alice" },
  session_id: "session-1",              // links access + refresh tokens
  iat: 1699999999,
  exp: 1700003599,                       // default 1h expiration
  iss: "https://my.supabase.co/auth/v1",
  amr: [{ method: "password", timestamp: 1699999999 }],
}
```

Real Supabase signs tokens with HS256 by default (the project-level `JWT_SECRET`) — the on-the-wire shape is identical. Tokens issued by one env cannot be verified by another (per-env signing secret), matching Supabase's per-project JWT_SECRET separation.

## Example: Supabase Auth core PoC

See [`examples/auth-supabase-core-poc/`](../../examples/auth-supabase-core-poc) for the end-to-end signup flow PoC: 8 tests cover signUp + magic link + verifyOtp, OAuth PKCE callback, session verification middleware, and session refresh + revocation.

<!-- kiwa-docs:start -->
## Documentation

公開ドキュメントを正本として管理しています。

- [概要](https://cardene777.github.io/kiwa/libraries/services/auth/)
- [はじめる](https://cardene777.github.io/kiwa/libraries/services/auth/quickstart)
- [使い方](https://cardene777.github.io/kiwa/libraries/services/auth/how-to)
- [リファレンス](https://cardene777.github.io/kiwa/libraries/services/auth/reference)

編集元は [docs/libraries/services/auth](../../docs/libraries/services/auth/) です。
<!-- kiwa-docs:end -->

## License

MIT
