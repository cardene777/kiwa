---
title: "@kiwa-lab/auth clerk__jwt の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>clerk&#95;&#95;jwt</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/jwt.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>signClerkJwt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/jwt.ts#L35) <code v-pre>packages/auth/src/clerk/jwt.ts</code>

Sign a set of Clerk session claims into a `&lt;header&gt;.&lt;payload&gt;.&lt;signature&gt;` JWT. The secret is unique per test env (generated at setup) — tokens issued by one env cannot be verified by another, which mirrors Clerk's per-instance signing keys.

```ts
export declare function signClerkJwt(claims: ClerkSessionClaims, secret: string): string;
```

#### <code v-pre>verifyClerkJwt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/clerk/jwt.ts#L49) <code v-pre>packages/auth/src/clerk/jwt.ts</code>

Verify a JWT and return its decoded claims. Throws on shape mismatch, signature mismatch, or expired token. Mirrors `verifyToken` from `@clerk/backend` — the error messages surface which failure mode hit.

```ts
export declare function verifyClerkJwt(token: string, secret: string): ClerkSessionClaims;
```


