---
title: "@kiwa-lab/auth oauth21__authorization-server の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>oauth21&#95;&#95;authorization-server</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createAuthorizationServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/authorization-server.ts#L38) <code v-pre>packages/auth/src/oauth21/authorization-server.ts</code>

Mock Authorization Server implementing the RFC 9700 (OAuth 2.1) endpoint surface: `/authorize`, `/token`, `/revoke`, `/introspect`. The mock keeps every piece of state in-memory so a test can drive the AS through method calls without HTTP plumbing. Notable enforcement (matches OAuth 2.1 hardening): - `response_type=code` only. `token` (implicit) is refused. - PKCE always mandatory. `code_challenge_method=plain` refused. - `grant_type=password` and `grant_type=client_credentials` refused. - Refresh tokens rotate on every use per RFC 9700 §2.2. - Revoked / expired / re-used refresh tokens are rejected. - DPoP-bound tokens verify the JWK thumbprint on `/token`. - `jti` replay defence guards the DPoP proof registry.

```ts
export declare function createAuthorizationServer(options?: AuthorizationServerOptions): AuthorizationServer;
```


