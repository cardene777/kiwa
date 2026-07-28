---
title: "@kiwa-lab/auth oidc__jwks の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>oidc&#95;&#95;jwks</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/jwks.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>&#95;&#95;resetJwksCounter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/jwks.ts#L15) <code v-pre>packages/auth/src/oidc/jwks.ts</code>

Reset the kid counter. Called by `setupOidcEnv` when preparing a fresh env so repeated env constructions produce identical output.

```ts
export declare function __resetJwksCounter(): void;
```

#### <code v-pre>createJwksEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/jwks.ts#L92) <code v-pre>packages/auth/src/oidc/jwks.ts</code>

Build the JWKS endpoint. Owns the current active signing key + the retired key registry with retention windows. Rotation semantics matches Auth0 / Google-style OPs: on `rotate()` the current key is retired with a retention deadline (`retentionSec` from now), a fresh key becomes active, and `fetch()` returns both until the retired key's deadline passes. Tokens signed by the retired key verify until the deadline — after that, `activeKey()` still resolves but the retired kid is dropped from the JWKS document.

```ts
export declare function createJwksEndpoint(options: CreateJwksEndpointOptions): JwksEndpoint;
```


