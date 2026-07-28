---
title: "@kiwa-lab/auth oidc-id-token の API 契約"
---

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>oidc-id-token</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/id-token.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>&#95;&#95;resetIdTokenCounter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/id-token.ts#L18) <code v-pre>packages/auth/src/oidc/id-token.ts</code>

Reset any module-scope state carried by the signer. Called by `setupOidcEnv` when preparing a fresh env so repeated env constructions produce identical output. Kept as a no-op today (the mock signature is deterministic from `header.payload.kid` without stateful entropy) so future additions have a stable reset seam.

```ts
export declare function __resetIdTokenCounter(): void;
```

#### <code v-pre>computeTokenHash</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/id-token.ts#L49) <code v-pre>packages/auth/src/oidc/id-token.ts</code>

Compute the OIDC Core §3.1.3.6 hash (at_hash / c_hash). Left half of the SHA-256 of the ASCII string, base64url-encoded. For RS256 / ES256 the spec says "left half" — for a SHA-256 digest that's 16 bytes.

```ts
export declare function computeTokenHash(input: string): string;
```

#### <code v-pre>createIdTokenSigner</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/id-token.ts#L88) <code v-pre>packages/auth/src/oidc/id-token.ts</code>

Build the id_token signer + verifier. Owns the JWKS endpoint reference so signing always uses the currently-active key + verification looks up the kid across the full JWKS (active + retained-retired keys, within the retention window).

```ts
export declare function createIdTokenSigner(options: CreateIdTokenSignerOptions): IdTokenSigner;
```


