---
title: "@kiwa-lab/auth clerk__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>clerk&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>ClerkEmailAddress</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L23) <code v-pre>packages/auth/src/clerk/types.ts</code>

```ts
export interface ClerkEmailAddress {
    id: string;
    emailAddress: string;
    verified: boolean;
}
```

#### <code v-pre>ClerkExternalAccount</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L17) <code v-pre>packages/auth/src/clerk/types.ts</code>

Clerk's real user record carries dozens of fields — the mock covers the ones that consumers actually assert against in tests (id + primary email + phone + external accounts + org memberships). Additional fields can be added later without breaking the surface.

```ts
export interface ClerkExternalAccount {
    provider: 'oauth_google' | 'oauth_github' | 'oauth_apple' | 'oauth_microsoft';
    providerUserId: string;
    emailAddress: string;
}
```

#### <code v-pre>ClerkOrganization</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L110) <code v-pre>packages/auth/src/clerk/types.ts</code>

```ts
export interface ClerkOrganization {
    id: string;
    name: string;
    slug: string;
    createdBy: string;
    createdAt: Date;
    publicMetadata?: Record<string, unknown> | undefined;
}
```

#### <code v-pre>ClerkOrganizationMembership</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L119) <code v-pre>packages/auth/src/clerk/types.ts</code>

```ts
export interface ClerkOrganizationMembership {
    id: string;
    organizationId: string;
    userId: string;
    role: ClerkOrganizationRole;
    createdAt: Date;
}
```

#### <code v-pre>ClerkOrganizationRole</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L102) <code v-pre>packages/auth/src/clerk/types.ts</code>

Organization + memberships. Clerk's real organization plugin exposes `organizations.getOrganization`, `memberships.getOrganizationMembership`, and a role model that includes org-scoped roles (`org:admin` / `org:member` in prod). The mock uses the shorter role names for readability but keeps the same relational shape.

```ts
export type ClerkOrganizationRole = 'owner' | 'admin' | 'member';
```

#### <code v-pre>ClerkPhoneNumber</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L29) <code v-pre>packages/auth/src/clerk/types.ts</code>

```ts
export interface ClerkPhoneNumber {
    id: string;
    phoneNumber: string;
    verified: boolean;
}
```

#### <code v-pre>ClerkSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L56) <code v-pre>packages/auth/src/clerk/types.ts</code>

Clerk session. Sessions are keyed by opaque id (`sess_...` in prod), the mock keeps the same shape. The `token` is the raw JWT surfaced to the client through `getToken()` — the mock generates a base64-encoded stub JWT.

```ts
export interface ClerkSession {
    id: string;
    userId: string;
    /** The active org the session is scoped to (Clerk multi-tenant). */
    activeOrganizationId?: string | undefined;
    expiresAt: Date;
    /** The raw JWT string emitted to the client. */
    token: string;
    /** Session status — Clerk's real API uses `active` / `expired` / `revoked` / `ended`. */
    status: 'active' | 'expired' | 'revoked' | 'ended';
}
```

#### <code v-pre>ClerkSessionClaims</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L74) <code v-pre>packages/auth/src/clerk/types.ts</code>

JWT claims Clerk embeds in the session token. `sub` = user id, `sid` = session id, `org_id` + `org_role` = active org context, `iat` / `exp` = standard JWT timestamps. The mock encodes these in a base64 stub the `verifyToken` helper decodes back.

```ts
export interface ClerkSessionClaims {
    /** Subject — the Clerk user id. */
    sub: string;
    /** Session id — the Clerk session id. */
    sid: string;
    /** Active organization id (present when session is scoped to an org). */
    org_id?: string | undefined;
    /** Active organization role (owner | admin | member typically). */
    org_role?: string | undefined;
    /** Active organization slug. */
    org_slug?: string | undefined;
    /** Issued at, seconds since epoch. */
    iat: number;
    /** Expires at, seconds since epoch. */
    exp: number;
    /** JWT issuer — Clerk uses `https://<instance>.clerk.accounts.dev` in prod. */
    iss: string;
    /** JWT audience — optional in Clerk, but present when configured. */
    aud?: string | undefined;
}
```

#### <code v-pre>ClerkTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L187) <code v-pre>packages/auth/src/clerk/types.ts</code>

The test env returned by {@link setupClerkEnv }. Consumers hold this handle for the lifetime of a test and call `stop()` in `afterEach` to reset all in-memory state. The `users` / `sessions` / `organizations` handles mirror the shape of Clerk's real `@clerk/backend` SDK — call sites that use the mock are drop-in-compatible with the real client after swap.

```ts
export interface ClerkTestEnv extends TestEnvBase<'mock'> {
    issuer: string;
    audience: string | undefined;
    sessionExpiration: number;
    /**
     * Seed tokens returned during setup. Only populated when the caller passes
     * `tokens` in {@link SetupClerkEnvOptions}. Keyed by primary email.
     */
    seededTokens: Record<string, {
        token: string;
        sessionId: string;
    }>;
    /** Users API — mirrors `@clerk/backend`'s `users.*` surface. */
    users: {
        createUser: (input: {
            primaryEmailAddress: string;
            firstName?: string;
            lastName?: string;
            phoneNumber?: string;
            externalAccounts?: ClerkExternalAccount[];
            publicMetadata?: Record<string, unknown>;
            privateMetadata?: Record<string, unknown>;
        }) => Promise<ClerkUser>;
        getUser: (id: string) => Promise<ClerkUser>;
        getUserByEmail: (email: string) => Promise<ClerkUser | null>;
        updateUser: (id: string, patch: Partial<Pick<ClerkUser, 'firstName' | 'lastName' | 'publicMetadata' | 'privateMetadata'>>) => Promise<ClerkUser>;
        deleteUser: (id: string) => Promise<void>;
        listUsers: () => Promise<ClerkUser[]>;
    };
    /** Sessions API — mirrors `@clerk/backend`'s `sessions.*` surface. */
    sessions: {
        createSession: (input: {
            userId: string;
            organizationId?: string;
        }) => Promise<{
            session: ClerkSession;
            token: string;
        }>;
        getSession: (id: string) => Promise<ClerkSession>;
        revokeSession: (id: string) => Promise<ClerkSession>;
        listSessionsForUser: (userId: string) => Promise<ClerkSession[]>;
    };
    /** Organizations API — mirrors `@clerk/backend`'s `organizations.*` surface. */
    organizations: {
        createOrganization: (input: {
            name: string;
            slug: string;
            createdBy: string;
            publicMetadata?: Record<string, unknown>;
        }) => Promise<ClerkOrganization>;
        getOrganization: (id: string) => Promise<ClerkOrganization>;
        getOrganizationBySlug: (slug: string) => Promise<ClerkOrganization | null>;
        createMembership: (input: {
            organizationId: string;
            userId: string;
            role: ClerkOrganizationRole;
        }) => Promise<ClerkOrganizationMembership>;
        getOrganizationMembership: (input: {
            organizationId: string;
            userId: string;
        }) => Promise<ClerkOrganizationMembership | null>;
        listMembershipsForUser: (userId: string) => Promise<ClerkOrganizationMembership[]>;
        listMembershipsForOrganization: (organizationId: string) => Promise<ClerkOrganizationMembership[]>;
        updateMembership: (input: {
            organizationId: string;
            userId: string;
            role: ClerkOrganizationRole;
        }) => Promise<ClerkOrganizationMembership>;
        deleteMembership: (input: {
            organizationId: string;
            userId: string;
        }) => Promise<void>;
    };
    /**
     * Verify a Clerk session token. Returns the decoded claims when the token
     * is valid, throws on invalid / expired / revoked tokens. Mirrors
     * `@clerk/backend`'s `verifyToken` helper.
     */
    verifyToken: (token: string) => Promise<ClerkSessionClaims>;
    /**
     * Convenience helper — sign in an existing user (by email) and return the
     * fresh session + JWT. Used in tests that want the full flow without
     * threading a session id through `sessions.createSession` manually.
     */
    signIn: (input: {
        email: string;
        organizationSlug?: string;
    }) => Promise<{
        user: ClerkUser;
        session: ClerkSession;
        token: string;
    }>;
}
```

#### <code v-pre>ClerkUser</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L35) <code v-pre>packages/auth/src/clerk/types.ts</code>

```ts
export interface ClerkUser {
    id: string;
    /** Primary email surfaced by Clerk's `primaryEmailAddress` field. */
    primaryEmailAddress: string;
    emailAddresses: ClerkEmailAddress[];
    phoneNumbers: ClerkPhoneNumber[];
    externalAccounts: ClerkExternalAccount[];
    firstName?: string | undefined;
    lastName?: string | undefined;
    /** Public metadata surfaced to the frontend. */
    publicMetadata?: Record<string, unknown> | undefined;
    /** Private metadata retained on the backend only. */
    privateMetadata?: Record<string, unknown> | undefined;
    createdAt: Date;
}
```

#### <code v-pre>SetupClerkEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/types.ts#L132) <code v-pre>packages/auth/src/clerk/types.ts</code>

Options accepted by {@link setupClerkEnv }. Every field is optional — the defaults exercise a single-org / single-user shape that matches Clerk's hosted quick-start.

```ts
export interface SetupClerkEnvOptions {
    /**
     * Session lifetime in seconds. Defaults to 7 days, matching Clerk's default
     * session inactivity timeout for hosted instances.
     */
    sessionExpiration?: number | undefined;
    /**
     * Pre-seeded users. Each entry becomes a {@link ClerkUser} through the
     * `createUser` API. Useful for tests that need a specific user id to
     * assert against without going through `signIn`.
     */
    users?: Array<{
        primaryEmailAddress: string;
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        externalAccounts?: ClerkExternalAccount[];
        publicMetadata?: Record<string, unknown>;
        privateMetadata?: Record<string, unknown>;
    }> | undefined;
    /**
     * Pre-seeded organizations. Each entry becomes a {@link ClerkOrganization}.
     * The `createdBy` field is a reference to a user's primary email — the
     * setup resolves it to the corresponding user id after user creation.
     */
    orgs?: Array<{
        name: string;
        slug: string;
        createdByEmail: string;
        publicMetadata?: Record<string, unknown>;
    }> | undefined;
    /**
     * Pre-seeded session tokens. Each entry issues an active session for the
     * user with the matching primary email — the resulting token is exposed
     * back to the caller for use in the suite.
     */
    tokens?: Array<{
        userEmail: string;
        organizationSlug?: string;
        /** Override the JWT issuer for the seeded tokens. */
        issuer?: string;
    }> | undefined;
    /** JWT issuer used when issuing session tokens. Defaults to the mock instance stub. */
    issuer?: string | undefined;
    /** JWT audience used when issuing session tokens. Defaults to undefined. */
    audience?: string | undefined;
}
```
