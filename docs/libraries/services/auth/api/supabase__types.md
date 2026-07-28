---
title: "@kiwa-lab/auth supabase__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>supabase&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>SetupSupabaseAuthEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L157) <code v-pre>packages/auth/src/supabase/types.ts</code>

Options accepted by {@link setupSupabaseAuthEnv }. Every field is optional — the defaults exercise a single anonymous project shape.

```ts
export interface SetupSupabaseAuthEnvOptions {
    /**
     * Project URL — used as the JWT issuer (`iss` claim). Defaults to a stub URL
     * matching Supabase's format.
     */
    projectUrl?: string | undefined;
    /**
     * Session access-token lifetime (seconds). Defaults to 3600 (1 hour), matching
     * Supabase's hosted default.
     */
    sessionExpiration?: number | undefined;
    /**
     * OTP code lifetime (seconds). Defaults to 3600 (1 hour), matching Supabase's
     * magic-link + SMS OTP default.
     */
    otpExpiration?: number | undefined;
    /**
     * Pre-seeded users. Each entry becomes a {@link SupabaseUser} through the
     * `admin.createUser` API path. Useful for tests that need a specific user id
     * to assert against without going through `signUp`.
     */
    users?: Array<{
        email?: string;
        phone?: string;
        password?: string;
        emailConfirmed?: boolean;
        phoneConfirmed?: boolean;
        identities?: Array<{
            provider: SupabaseIdentityProvider;
            identityData?: Record<string, unknown>;
        }>;
        appMetadata?: Record<string, unknown>;
        userMetadata?: Record<string, unknown>;
        role?: 'authenticated' | 'anon' | 'service_role';
    }> | undefined;
    /**
     * Pre-seeded sessions. Each entry issues an active session for the user with
     * the matching email — the resulting token pair is exposed back for use in
     * the suite.
     */
    tokens?: Array<{
        userEmail: string;
    }> | undefined;
}
```

#### <code v-pre>SupabaseAccessTokenClaims</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L95) <code v-pre>packages/auth/src/supabase/types.ts</code>

JWT claims Supabase Auth embeds in the access_token. The mock encodes these in an HS256-signed JWT the `verifyToken` helper decodes back.

```ts
export interface SupabaseAccessTokenClaims {
    /** Subject — the Supabase user id. */
    sub: string;
    /** Audience — typically `authenticated`. */
    aud: string;
    /** Role — used by PostgREST for RLS (`authenticated` / `anon` / `service_role`). */
    role: 'authenticated' | 'anon' | 'service_role';
    email: string | undefined;
    phone: string | undefined;
    /** Application metadata — writeable only via admin API, exposed in JWT for RLS. */
    app_metadata: Record<string, unknown>;
    /** User metadata — writeable by the user themselves. */
    user_metadata: Record<string, unknown>;
    /** Session id — links the access_token to the refresh_token. */
    session_id: string;
    /** Issued at, seconds since epoch. */
    iat: number;
    /** Expires at, seconds since epoch. */
    exp: number;
    /** JWT issuer — Supabase uses `<project>.supabase.co/auth/v1` in prod. */
    iss: string;
    /** Auth method used to sign in — Supabase surfaces this in `amr`. */
    amr: Array<{
        method: string;
        timestamp: number;
    }>;
}
```

#### <code v-pre>SupabaseAuthTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L209) <code v-pre>packages/auth/src/supabase/types.ts</code>

The test env returned by {@link setupSupabaseAuthEnv }. Consumers hold this handle for the lifetime of a test and call `stop()` in `afterEach` to reset all in-memory state. The `auth` handle mirrors `@supabase/supabase-js`'s `client.auth.*` client surface so call sites are drop-in-compatible after swap. The `admin` handle mirrors `client.auth.admin.*` — the service-role-only API.

```ts
export interface SupabaseAuthTestEnv extends TestEnvBase<'mock'> {
    projectUrl: string;
    sessionExpiration: number;
    otpExpiration: number;
    /**
     * Seed tokens returned during setup. Only populated when the caller passes
     * `tokens` in {@link SetupSupabaseAuthEnvOptions}. Keyed by user email.
     */
    seededTokens: Record<string, {
        accessToken: string;
        refreshToken: string;
        sessionId: string;
    }>;
    /** Client-side auth API — mirrors `client.auth.*`. */
    auth: {
        signUp: (input: {
            email?: string;
            phone?: string;
            password: string;
            options?: {
                data?: Record<string, unknown>;
            };
        }) => Promise<{
            user: SupabaseUser;
            session: SupabaseSession | null;
        }>;
        signInWithPassword: (input: {
            email?: string;
            phone?: string;
            password: string;
        }) => Promise<{
            user: SupabaseUser;
            session: SupabaseSession;
        }>;
        signInWithOtp: (input: {
            email?: string;
            phone?: string;
            options?: {
                shouldCreateUser?: boolean;
                emailRedirectTo?: string;
            };
        }) => Promise<{
            otp: SupabaseOtpDelivery;
        }>;
        signInWithOAuth: (input: {
            provider: Exclude<SupabaseIdentityProvider, 'email'>;
            options?: {
                redirectTo?: string;
                scopes?: string;
            };
        }) => Promise<SupabaseOAuthAuthorizationUrl>;
        exchangeCodeForSession: (input: {
            code: string;
            codeVerifier: string;
        }) => Promise<{
            user: SupabaseUser;
            session: SupabaseSession;
        }>;
        verifyOtp: (input: {
            email?: string;
            phone?: string;
            token: string;
            type: 'email' | 'sms' | 'magiclink' | 'signup' | 'recovery';
        }) => Promise<{
            user: SupabaseUser;
            session: SupabaseSession;
        }>;
        refreshSession: (input: {
            refreshToken: string;
        }) => Promise<{
            user: SupabaseUser;
            session: SupabaseSession;
        }>;
        signOut: (input: {
            accessToken: string;
        }) => Promise<void>;
        getUser: (accessToken: string) => Promise<SupabaseUser>;
    };
    /** Admin (service-role) API — mirrors `client.auth.admin.*`. */
    admin: {
        createUser: (input: {
            email?: string;
            phone?: string;
            password?: string;
            emailConfirm?: boolean;
            phoneConfirm?: boolean;
            appMetadata?: Record<string, unknown>;
            userMetadata?: Record<string, unknown>;
            role?: 'authenticated' | 'anon' | 'service_role';
        }) => Promise<SupabaseUser>;
        getUserById: (id: string) => Promise<SupabaseUser>;
        getUserByEmail: (email: string) => Promise<SupabaseUser | null>;
        listUsers: () => Promise<SupabaseUser[]>;
        updateUserById: (id: string, patch: Partial<{
            email: string;
            phone: string;
            password: string;
            emailConfirm: boolean;
            phoneConfirm: boolean;
            appMetadata: Record<string, unknown>;
            userMetadata: Record<string, unknown>;
        }>) => Promise<SupabaseUser>;
        deleteUser: (id: string) => Promise<void>;
    };
    /**
     * Verify a Supabase access token. Returns the decoded claims when the token
     * is valid, throws on invalid / expired tokens. Mirrors GoTrue's
     * `authorization.verifyJwt`.
     */
    verifyToken: (token: string) => Promise<SupabaseAccessTokenClaims>;
    /**
     * Introspection — every OTP delivery the mock has issued (magic link + SMS).
     * Tests use this to assert delivery channel + one-time code without threading
     * a mock inbox.
     */
    listOtpDeliveries: (channel?: 'email' | 'sms') => SupabaseOtpDelivery[];
    /** Introspection — every pending OAuth authorization URL. */
    listOAuthPending: () => SupabaseOAuthAuthorizationUrl[];
}
```

#### <code v-pre>SupabaseIdentity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L43) <code v-pre>packages/auth/src/supabase/types.ts</code>

```ts
export interface SupabaseIdentity {
    id: string;
    userId: string;
    identityId: string;
    provider: SupabaseIdentityProvider;
    identityData: Record<string, unknown>;
    createdAt: Date;
    lastSignInAt: Date;
}
```

#### <code v-pre>SupabaseIdentityProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L20) <code v-pre>packages/auth/src/supabase/types.ts</code>

Supabase identity — one per external provider (email or OAuth) linked to a user. Real Supabase surfaces `identities: Identity[]` on every user record.

```ts
export type SupabaseIdentityProvider = 'email' | 'google' | 'github' | 'apple' | 'azure' | 'facebook' | 'twitter';
```

#### <code v-pre>SupabaseOAuthAuthorizationUrl</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L144) <code v-pre>packages/auth/src/supabase/types.ts</code>

OAuth authorization URL response — mimicking `signInWithOAuth`. The mock captures the URL for the test to assert against, then a follow-up `exchangeCodeForSession` completes the PKCE flow.

```ts
export interface SupabaseOAuthAuthorizationUrl {
    provider: Exclude<SupabaseIdentityProvider, 'email'>;
    url: string;
    /** PKCE code_verifier — the mock returns it so tests can drive the exchange. */
    codeVerifier: string;
    /** Authorization code the mock will accept in `exchangeCodeForSession`. */
    code: string;
}
```

#### <code v-pre>SupabaseOtpDelivery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L124) <code v-pre>packages/auth/src/supabase/types.ts</code>

OTP delivery record — captured whenever the mock issues a magic link or an SMS OTP. Tests can inspect this to assert the delivery channel + one-time code.

```ts
export interface SupabaseOtpDelivery {
    channel: 'email' | 'sms';
    recipient: string;
    /** One-time code (6 digits for email OTP, sms OTP). */
    code: string;
    /** Magic link URL when the flow used `signInWithOtp({ shouldCreateUser })`. */
    magicLink: string | undefined;
    /** ISO ms timestamp of when the code was issued. */
    issuedAt: Date;
    /** ISO ms — when the code expires (default 1 hour). */
    expiresAt: Date;
    /** True once the code has been consumed via `verifyOtp`. */
    consumed: boolean;
}
```

#### <code v-pre>SupabaseSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L80) <code v-pre>packages/auth/src/supabase/types.ts</code>

Supabase session — a pair of tokens (access_token + refresh_token) plus the user they authenticate. Real Supabase returns this shape from `signInWithPassword` / `signUp` / `signInWithOtp` / `exchangeCodeForSession`.

```ts
export interface SupabaseSession {
    accessToken: string;
    refreshToken: string;
    /** JWT expiration timestamp (seconds since epoch). */
    expiresAt: number;
    /** Seconds until expiration (Supabase surfaces both fields). */
    expiresIn: number;
    tokenType: 'bearer';
    user: SupabaseUser;
}
```

#### <code v-pre>SupabaseUser</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/types.ts#L59) <code v-pre>packages/auth/src/supabase/types.ts</code>

Supabase user record. The mock covers the fields that consumers assert against in tests — id + email + phone + identities + app_metadata + user_metadata + timestamps. Real Supabase carries additional fields (banned_until / is_sso_user / confirmation_sent_at etc) that are added lazily as needed.

```ts
export interface SupabaseUser {
    id: string;
    aud: string;
    role: 'authenticated' | 'anon' | 'service_role';
    email: string | undefined;
    emailConfirmedAt: Date | undefined;
    phone: string | undefined;
    phoneConfirmedAt: Date | undefined;
    identities: SupabaseIdentity[];
    appMetadata: Record<string, unknown>;
    userMetadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
    lastSignInAt: Date | undefined;
}
```
