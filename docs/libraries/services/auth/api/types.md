---
title: "@kiwa-lab/auth types の API 契約"
---

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)



### 型

#### <code v-pre>AuthAccount</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L35) <code v-pre>packages/auth/src/types.ts</code>

```ts
export interface AuthAccount {
    userId: string;
    provider: ProviderKind;
    providerAccountId: string;
    type: 'oauth' | 'email';
}
```

#### <code v-pre>AuthDatabaseAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L60) <code v-pre>packages/auth/src/types.ts</code>

Minimal, Auth.js-compatible database adapter surface. Both Prisma (`@auth/prisma-adapter`) and Drizzle (`@auth/drizzle-adapter`) expose the same method names, so the mock can stand in for either.

```ts
export interface AuthDatabaseAdapter {
    createUser: (user: Omit<AuthUser, 'id'>) => Promise<AuthUser>;
    getUser: (id: string) => Promise<AuthUser | null>;
    getUserByEmail: (email: string) => Promise<AuthUser | null>;
    getUserByAccount: (input: {
        provider: ProviderKind;
        providerAccountId: string;
    }) => Promise<AuthUser | null>;
    updateUser: (user: Partial<AuthUser> & {
        id: string;
    }) => Promise<AuthUser>;
    deleteUser: (id: string) => Promise<void>;
    linkAccount: (account: AuthAccount) => Promise<AuthAccount>;
    unlinkAccount: (input: {
        provider: ProviderKind;
        providerAccountId: string;
    }) => Promise<void>;
    createSession: (session: AuthSession) => Promise<AuthSession>;
    getSessionAndUser: (sessionToken: string) => Promise<{
        session: AuthSession;
        user: AuthUser;
    } | null>;
    updateSession: (session: Partial<AuthSession> & {
        sessionToken: string;
    }) => Promise<AuthSession | null>;
    deleteSession: (sessionToken: string) => Promise<void>;
    createVerificationToken: (token: VerificationToken) => Promise<VerificationToken>;
    useVerificationToken: (input: {
        identifier: string;
        token: string;
    }) => Promise<VerificationToken | null>;
    /** Reset all in-memory tables. Test-only affordance not present in real adapters. */
    reset: () => void;
}
```

#### <code v-pre>AuthProfile</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L21) <code v-pre>packages/auth/src/types.ts</code>

```ts
export interface AuthProfile {
    provider: ProviderKind;
    providerAccountId: string;
    email: string;
    name?: string | undefined;
}
```

#### <code v-pre>AuthSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L42) <code v-pre>packages/auth/src/types.ts</code>

```ts
export interface AuthSession {
    sessionToken: string;
    userId: string;
    expires: Date;
}
```

#### <code v-pre>AuthUser</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L28) <code v-pre>packages/auth/src/types.ts</code>

```ts
export interface AuthUser {
    id: string;
    email: string;
    name?: string | undefined;
    emailVerified?: Date | undefined;
}
```

#### <code v-pre>NextAuthTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L85) <code v-pre>packages/auth/src/types.ts</code>

```ts
export interface NextAuthTestEnv extends TestEnvBase<'mock'> {
    session: {
        strategy: SessionStrategy;
        maxAge: number;
    };
    providers: Record<ProviderKind, ProviderMock>;
    database: AuthDatabaseAdapter;
    /**
     * Simulate the full sign-in flow through the given provider. Returns the
     * session that a real NextAuth callback would produce.
     */
    signIn: (provider: ProviderKind, input?: {
        email?: string;
        sub?: string;
        name?: string;
    }) => Promise<{
        user: AuthUser;
        session: {
            sessionToken: string;
            expires: Date;
        };
        strategy: SessionStrategy;
    }>;
    /** Retrieve the session for a token — mirrors `auth()` / `getServerSession()`. */
    getSession: (sessionToken: string) => Promise<{
        user: AuthUser;
        expires: Date;
    } | null>;
    /** Sign the user out — mirrors NextAuth's `signOut()`. */
    signOut: (sessionToken: string) => Promise<void>;
}
```

#### <code v-pre>ProviderKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L11) <code v-pre>packages/auth/src/types.ts</code>

```ts
export type ProviderKind = 'google' | 'github' | 'email';
```

#### <code v-pre>ProviderMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L13) <code v-pre>packages/auth/src/types.ts</code>

```ts
export interface ProviderMock {
    kind: ProviderKind;
    id: string;
    name: string;
    /** Simulate a successful sign-in. Returns the profile the provider would return. */
    signIn: (input?: {
        email?: string;
        sub?: string;
        name?: string;
    }) => Promise<AuthProfile>;
}
```

#### <code v-pre>SessionStrategy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L3) <code v-pre>packages/auth/src/types.ts</code>

```ts
export type SessionStrategy = 'jwt' | 'database';
```

#### <code v-pre>SetupNextAuthEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L79) <code v-pre>packages/auth/src/types.ts</code>

```ts
export interface SetupNextAuthEnvOptions {
    providers?: ProviderKind[] | undefined;
    session?: {
        strategy?: SessionStrategy;
        maxAge?: number;
    } | undefined;
    database?: AuthDatabaseAdapter | undefined;
}
```

#### <code v-pre>VerificationToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/types.ts#L48) <code v-pre>packages/auth/src/types.ts</code>

```ts
export interface VerificationToken {
    identifier: string;
    token: string;
    expires: Date;
}
```
