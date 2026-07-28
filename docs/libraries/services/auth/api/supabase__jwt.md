---
title: "@kiwa-lab/auth supabase__jwt の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>supabase&#95;&#95;jwt</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>generateSupabaseRefreshToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L92) <code v-pre>packages/auth/src/supabase/jwt.ts</code>

Generate a random opaque refresh token. Supabase's real refresh tokens are opaque strings (not JWTs) rotated on each `refreshSession` call.

```ts
export declare function generateSupabaseRefreshToken(): string;
```

#### <code v-pre>generateSupabaseSigningSecret</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L84) <code v-pre>packages/auth/src/supabase/jwt.ts</code>

Generate a random 32-byte secret for signing. Called once per {@link setupSupabaseAuthEnv } invocation so each env has its own signing key.

```ts
export declare function generateSupabaseSigningSecret(): string;
```

#### <code v-pre>signSupabaseAccessToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L30) <code v-pre>packages/auth/src/supabase/jwt.ts</code>

Sign a set of Supabase access-token claims into a `&lt;header&gt;.&lt;payload&gt;.&lt;signature&gt;` JWT. The secret is unique per test env — tokens issued by one env cannot be verified by another, mirroring per-project JWT_SECRET separation in production.

```ts
export declare function signSupabaseAccessToken(claims: SupabaseAccessTokenClaims, secret: string): string;
```

#### <code v-pre>verifySupabaseAccessToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/supabase/jwt.ts#L47) <code v-pre>packages/auth/src/supabase/jwt.ts</code>

Verify a Supabase access token JWT and return its decoded claims. Throws on shape mismatch, signature mismatch, or expired token. Mirrors GoTrue's own verification path.

```ts
export declare function verifySupabaseAccessToken(token: string, secret: string): SupabaseAccessTokenClaims;
```


