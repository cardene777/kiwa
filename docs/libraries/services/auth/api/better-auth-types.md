---
title: "@kiwa-lab/auth better-auth-types の API 契約"
---

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>better-auth-types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>BetterAuthAccount</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L66) <code v-pre>packages/auth/src/better-auth/types.ts</code>

```ts
export interface BetterAuthAccount {
    userId: string;
    provider: BetterAuthProviderKind;
    providerAccountId: string;
}
```

#### <code v-pre>BetterAuthDatabaseAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L125) <code v-pre>packages/auth/src/better-auth/types.ts</code>

Minimal, Better-Auth-compatible database adapter surface. `betterAuth/adapters/prisma`, `betterAuth/adapters/drizzle`, and `betterAuth/adapters/kysely` all funnel through the same operation set at the Better Auth layer.

```ts
export interface BetterAuthDatabaseAdapter {
    kind: BetterAuthDatabaseKind;
    createUser: (user: Omit<BetterAuthUser, 'id' | 'emailVerified'> & {
        emailVerified?: boolean;
    }) => Promise<BetterAuthUser>;
    getUser: (id: string) => Promise<BetterAuthUser | null>;
    getUserByEmail: (email: string) => Promise<BetterAuthUser | null>;
    updateUser: (user: Partial<BetterAuthUser> & {
        id: string;
    }) => Promise<BetterAuthUser>;
    deleteUser: (id: string) => Promise<void>;
    createSession: (session: BetterAuthSession) => Promise<BetterAuthSession>;
    getSession: (id: string) => Promise<BetterAuthSession | null>;
    getSessionByToken: (token: string) => Promise<BetterAuthSession | null>;
    deleteSession: (id: string) => Promise<void>;
    deleteUserSessions: (userId: string) => Promise<number>;
    linkAccount: (account: BetterAuthAccount) => Promise<BetterAuthAccount>;
    getUserByAccount: (input: {
        provider: BetterAuthProviderKind;
        providerAccountId: string;
    }) => Promise<BetterAuthUser | null>;
    createVerification: (verification: BetterAuthVerification) => Promise<BetterAuthVerification>;
    consumeVerification: (identifier: string, value: string) => Promise<BetterAuthVerification | null>;
    createOrganization: (input: Omit<BetterAuthOrganization, 'id'>) => Promise<BetterAuthOrganization>;
    getOrganization: (id: string) => Promise<BetterAuthOrganization | null>;
    addMembership: (membership: BetterAuthMembership) => Promise<BetterAuthMembership>;
    getMemberships: (userId: string) => Promise<BetterAuthMembership[]>;
    registerPasskey: (passkey: BetterAuthPasskey) => Promise<BetterAuthPasskey>;
    getPasskeysForUser: (userId: string) => Promise<BetterAuthPasskey[]>;
    /** Test-only affordance not present in the real adapters. */
    reset: () => void;
}
```

#### <code v-pre>BetterAuthDatabaseKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L10) <code v-pre>packages/auth/src/better-auth/types.ts</code>

Better Auth ships three official database adapter shapes — `betterAuth/adapters/prisma`, `betterAuth/adapters/drizzle`, and `betterAuth/adapters/kysely`. All three expose the same operation surface at the Better Auth layer (create / findOne / findMany / update / delete / count), so the mock is a drop-in for any of them. The `kind` tag surfaces the dialect for tests that assert against it without changing behaviour.

```ts
export type BetterAuthDatabaseKind = 'prisma' | 'drizzle' | 'kysely';
```

#### <code v-pre>BetterAuthMembership</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L103) <code v-pre>packages/auth/src/better-auth/types.ts</code>

```ts
export interface BetterAuthMembership {
    organizationId: string;
    userId: string;
    role: 'owner' | 'admin' | 'member';
}
```

#### <code v-pre>BetterAuthOAuthProfile</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L72) <code v-pre>packages/auth/src/better-auth/types.ts</code>

```ts
export interface BetterAuthOAuthProfile {
    provider: BetterAuthProviderKind;
    providerAccountId: string;
    email: string;
}
```

#### <code v-pre>BetterAuthOrganization</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L96) <code v-pre>packages/auth/src/better-auth/types.ts</code>

Organization + membership records. Better Auth's `organization` plugin persists these two tables and exposes create / invite / accept / list helpers on the auth client. The mock keeps the same shape so a suite can assert against membership state after invitation flows.

```ts
export interface BetterAuthOrganization {
    id: string;
    name: string;
    slug: string;
    createdBy: string;
}
```

#### <code v-pre>BetterAuthPasskey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L113) <code v-pre>packages/auth/src/better-auth/types.ts</code>

Passkey credential — Better Auth's `passkey` plugin stores a WebAuthn credential per user. The mock skips the WebAuthn ceremony and only records the shape.

```ts
export interface BetterAuthPasskey {
    id: string;
    userId: string;
    credentialId: string;
    publicKey: string;
}
```

#### <code v-pre>BetterAuthPluginKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L40) <code v-pre>packages/auth/src/better-auth/types.ts</code>

Plugin registry keys the mock understands. Better Auth's real plugin system is open-ended, but the ones covered by the AC (organizations + passkey + magic link + 2FA/TOTP) are the ones consumers actually mock in tests today. `emailAndPassword` and `magicLink` and `twoFactor` land here even though Better Auth distinguishes between core config and plugins — the mock treats them as opt-in capabilities the caller flips on for a specific suite, which is closer to how they are used in practice.

```ts
export type BetterAuthPluginKind = 'emailAndPassword' | 'magicLink' | 'twoFactor' | 'organizations' | 'passkey';
```

#### <code v-pre>BetterAuthProviderKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L28) <code v-pre>packages/auth/src/better-auth/types.ts</code>

Built-in social provider mocks. Better Auth's real `socialProviders` config accepts an open map, but for tests we only mock the two shapes documented in the quick-start (Google + GitHub). Extra providers can be added without breaking the surface — the mock builder rejects unknown kinds explicitly.

```ts
export type BetterAuthProviderKind = 'google' | 'github';
```

#### <code v-pre>BetterAuthProviderMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L171) <code v-pre>packages/auth/src/better-auth/types.ts</code>

```ts
export interface BetterAuthProviderMock {
    kind: BetterAuthProviderKind;
    id: string;
    name: string;
    signIn: (input?: {
        email?: string;
        sub?: string;
    }) => Promise<BetterAuthOAuthProfile>;
}
```

#### <code v-pre>BetterAuthSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L58) <code v-pre>packages/auth/src/better-auth/types.ts</code>

```ts
export interface BetterAuthSession {
    id: string;
    userId: string;
    expiresAt: Date;
    /** Better Auth exposes `token` on the returned session — the mock mirrors the shape. */
    token: string;
}
```

#### <code v-pre>BetterAuthTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L208) <code v-pre>packages/auth/src/better-auth/types.ts</code>

```ts
export interface BetterAuthTestEnv extends TestEnvBase<'mock'> {
    database: BetterAuthDatabaseAdapter;
    providers: Record<BetterAuthProviderKind, BetterAuthProviderMock>;
    plugins: Set<BetterAuthPluginKind>;
    sessionExpiration: number;
    verificationExpiration: number;
    /**
     * Register a new email + password user. Rejects when the email already exists,
     * when the `emailAndPassword` plugin is not enabled, or on empty password.
     */
    signUpWithPassword: (input: {
        email: string;
        password: string;
    }) => Promise<{
        user: BetterAuthUser;
        session: BetterAuthSession;
    }>;
    signInWithPassword: (input: {
        email: string;
        password: string;
    }) => Promise<{
        user: BetterAuthUser;
        session: BetterAuthSession;
    }>;
    signInWithOAuth: (provider: BetterAuthProviderKind, input?: {
        email?: string;
        sub?: string;
    }) => Promise<{
        user: BetterAuthUser;
        session: BetterAuthSession;
    }>;
    /**
     * Send a magic link. Returns the token value the caller would embed in the
     * click-through URL. Rejects when `magicLink` plugin is not enabled.
     */
    sendMagicLink: (input: {
        email: string;
    }) => Promise<{
        token: string;
    }>;
    /**
     * Consume a magic-link token. Creates the user on first sign-in, marks the
     * user's email as verified, and issues a session. Rejects on unknown / expired
     * token.
     */
    consumeMagicLink: (input: {
        email: string;
        token: string;
    }) => Promise<{
        user: BetterAuthUser;
        session: BetterAuthSession;
    }>;
    /**
     * Enrol a user in TOTP 2FA. Returns the raw secret (base32 in real usage —
     * the mock returns an opaque string sufficient to verify against later).
     * Rejects when `twoFactor` plugin is not enabled.
     */
    enrollTwoFactor: (input: {
        userId: string;
    }) => Promise<{
        secret: string;
    }>;
    /**
     * Verify a TOTP code. The mock accepts codes derived from the enrolled secret
     * via {@link generateTotpCode}. Rejects on wrong code or unenrolled user.
     */
    verifyTwoFactorCode: (input: {
        userId: string;
        code: string;
    }) => Promise<boolean>;
    /** Session validation — returns null on missing / expired token. */
    validateSession: (token: string) => Promise<{
        user: BetterAuthUser;
        session: BetterAuthSession;
    } | null>;
    invalidateSession: (token: string) => Promise<void>;
    invalidateUserSessions: (userId: string) => Promise<void>;
    /**
     * Organizations plugin helpers. Rejects when the plugin is not enabled.
     * Membership defaults to `owner` for the creator.
     */
    createOrganization: (input: {
        name: string;
        slug: string;
        userId: string;
    }) => Promise<BetterAuthOrganization>;
    inviteToOrganization: (input: {
        organizationId: string;
        userId: string;
        role?: 'admin' | 'member';
    }) => Promise<BetterAuthMembership>;
    /**
     * Passkey plugin helper. Rejects when the plugin is not enabled. The mock
     * skips the WebAuthn ceremony and records the shape.
     */
    registerPasskey: (input: {
        userId: string;
        credentialId: string;
        publicKey: string;
    }) => Promise<BetterAuthPasskey>;
}
```

#### <code v-pre>BetterAuthUser</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L47) <code v-pre>packages/auth/src/better-auth/types.ts</code>

```ts
export interface BetterAuthUser {
    id: string;
    email: string;
    /** Password hash returned by the password helper — never stored in plain text. */
    passwordHash?: string | undefined;
    /** Set to true once the user completes the initial magic-link click / OAuth callback. */
    emailVerified: boolean;
    /** Populated when the `twoFactor` plugin is enabled and the user completes TOTP setup. */
    twoFactorSecret?: string | undefined;
}
```

#### <code v-pre>BetterAuthVerification</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L84) <code v-pre>packages/auth/src/better-auth/types.ts</code>

Verification token issued for magic-link sign-in. Mirrors Better Auth's internal `verification` table (identifier + value + expiresAt). Consuming the token deletes it, so re-using a magic link rejects the second attempt — the same policy Better Auth enforces at runtime.

```ts
export interface BetterAuthVerification {
    identifier: string;
    value: string;
    expiresAt: Date;
}
```

#### <code v-pre>SetupBetterAuthEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/types.ts#L181) <code v-pre>packages/auth/src/better-auth/types.ts</code>

```ts
export interface SetupBetterAuthEnvOptions {
    /**
     * Which social provider mocks to expose. Defaults to `['google', 'github']`.
     * Password / magic-link / 2FA are configured through `plugins`, not `providers`.
     */
    providers?: BetterAuthProviderKind[] | undefined;
    /** Session lifetime in seconds. Defaults to 7 days, matching Better Auth's default. */
    sessionExpiration?: number | undefined;
    /**
     * Enabled plugin surfaces. Defaults to `['emailAndPassword']` — the minimum
     * Better Auth suite (password sign-up + sign-in). Adding `magicLink` unlocks
     * `sendMagicLink` + `consumeMagicLink`; adding `twoFactor` unlocks the TOTP
     * helpers; `organizations` / `passkey` unlock the corresponding plugin helpers.
     */
    plugins?: BetterAuthPluginKind[] | undefined;
    /**
     * Pre-built adapter instance. When omitted, the helper builds an in-memory
     * adapter of the requested {@link database.kind} (default `prisma`).
     */
    database?: BetterAuthDatabaseAdapter | {
        kind?: BetterAuthDatabaseKind;
    } | undefined;
    /** Verification token lifetime in seconds. Defaults to 15 minutes. */
    verificationExpiration?: number | undefined;
}
```
