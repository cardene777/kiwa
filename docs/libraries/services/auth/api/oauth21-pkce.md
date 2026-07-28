---
title: "@kiwa-lab/auth oauth21-pkce の API 契約"
---

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>oauth21-pkce</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>&#95;&#95;resetPkceCounter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L18) <code v-pre>packages/auth/src/oauth21/pkce.ts</code>

Reset the verifier counter. Called by `setupOAuth21Env` when preparing a fresh env so repeated env constructions produce identical output.

```ts
export declare function __resetPkceCounter(): void;
```

#### <code v-pre>createPkceChallenge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L85) <code v-pre>packages/auth/src/oauth21/pkce.ts</code>

Build a complete PKCE challenge (verifier + challenge). Convenience wrapper that always uses S256.

```ts
export declare function createPkceChallenge(): PkceChallenge;
```

#### <code v-pre>deriveCodeChallenge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L58) <code v-pre>packages/auth/src/oauth21/pkce.ts</code>

Derive the code challenge for a verifier. RFC 9700 §2.1.1 forbids the `plain` method — the function rejects it explicitly rather than silently downgrading. Only `S256` is accepted.

```ts
export declare function deriveCodeChallenge(verifier: string, method?: PkceChallengeMethod): string;
```

#### <code v-pre>generateCodeVerifier</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L38) <code v-pre>packages/auth/src/oauth21/pkce.ts</code>

Generate a fresh code verifier. RFC 7636 §4.1 requires 43-128 characters from the unreserved URL set. The mock produces 43-char base64url strings.

```ts
export declare function generateCodeVerifier(): string;
```

#### <code v-pre>verifyCodeChallenge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/pkce.ts#L99) <code v-pre>packages/auth/src/oauth21/pkce.ts</code>

Verify that a supplied `codeVerifier` hashes to the stored `codeChallenge`. Used by the token endpoint on `authorization_code` exchange.

```ts
export declare function verifyCodeChallenge(codeVerifier: string, codeChallenge: string, method: PkceChallengeMethod): boolean;
```


