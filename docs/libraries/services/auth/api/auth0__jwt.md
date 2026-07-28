---
title: "@kiwa-lab/auth auth0__jwt の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>auth0&#95;&#95;jwt</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>generateAuth0SigningSecret</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L143) <code v-pre>packages/auth/src/auth0/jwt.ts</code>

Generate a random signing secret. Called once per {@link setupAuth0Env } invocation so each env has its own signing key — mirrors Auth0's per-tenant key isolation.

```ts
export declare function generateAuth0SigningSecret(): string;
```

#### <code v-pre>signAuth0AccessToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L46) <code v-pre>packages/auth/src/auth0/jwt.ts</code>

Sign a set of Auth0 access_token claims. Same signature shape as id_token — Auth0's real access tokens are separately signed with the tenant's key pair, but for the mock they share the per-env secret to keep the verify path uniform.

```ts
export declare function signAuth0AccessToken(claims: Auth0AccessTokenClaims, secret: string): string;
```

#### <code v-pre>signAuth0IdToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L36) <code v-pre>packages/auth/src/auth0/jwt.ts</code>

Sign a set of Auth0 id_token claims into a `&lt;header&gt;.&lt;payload&gt;.&lt;signature&gt;` JWT. The secret is unique per test env — tokens issued by one env cannot be verified by another, which mirrors Auth0's per-tenant signing keys.

```ts
export declare function signAuth0IdToken(claims: Auth0IdTokenClaims, secret: string): string;
```

#### <code v-pre>verifyAuth0AccessToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L88) <code v-pre>packages/auth/src/auth0/jwt.ts</code>

Verify an access_token. Auth0's access tokens can have `aud` as string or string[] — the mock accepts both and matches the expected audience against every entry.

```ts
export declare function verifyAuth0AccessToken(token: string, secret: string, expected: {
    issuer: string;
    audience: string;
}): Auth0AccessTokenClaims;
```

#### <code v-pre>verifyAuth0IdToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/auth0/jwt.ts#L64) <code v-pre>packages/auth/src/auth0/jwt.ts</code>

Verify an id_token and return its decoded claims. Throws on shape mismatch, signature mismatch, expired token, or issuer mismatch. Mirrors what `express-jwt` + JWKS verification does in a real Auth0 backend.

```ts
export declare function verifyAuth0IdToken(token: string, secret: string, expected: {
    issuer: string;
    audience: string;
}): Auth0IdTokenClaims;
```


