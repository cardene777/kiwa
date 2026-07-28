---
title: "@kiwa-lab/auth oidc__setup-oidc-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>oidc&#95;&#95;setup-oidc-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/setup-oidc-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>&#95;&#95;resetOidcCounters</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/setup-oidc-env.ts#L27) <code v-pre>packages/auth/src/oidc/setup-oidc-env.ts</code>

Reset every module-scope counter used by the OIDC adapter so consecutive `setupOidcEnv` calls produce stable, deterministic ids.

```ts
export declare function __resetOidcCounters(): void;
```

#### <code v-pre>setupOidcEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/setup-oidc-env.ts#L46) <code v-pre>packages/auth/src/oidc/setup-oidc-env.ts</code>

Set up the OIDC test environment. Composes: - the OAuth 2.1 mock AS (OIDC layers on top of it), - the Discovery endpoint (`/.well-known/openid-configuration`), - the JWKS endpoint (RS256 / ES256 + kid rotation + retention), - the DCR endpoint (RFC 7591), - the id_token signer + verifier (OIDC Core §2 + §3.1.3.6-7), - the Federation trust-chain resolver (OIDF 1.0 §7). The env is hermetic — every mutation goes through the returned surface, and a single `stop()` disposes the underlying OAuth 2.1 AS + resets the OIDC state.

```ts
export declare function setupOidcEnv(options?: SetupOidcEnvOptions): Promise<OidcTestEnv>;
```


