---
title: "@kiwa-lab/auth oidc-dcr の API 契約"
---

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>oidc-dcr</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>&#95;&#95;resetDcrCounter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L19) <code v-pre>packages/auth/src/oidc/dcr.ts</code>

Reset the client_id counter. Called by `setupOidcEnv` when preparing a fresh env so repeated env constructions produce identical output.

```ts
export declare function __resetDcrCounter(): void;
```

#### <code v-pre>createDcrEndpoint</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L310) <code v-pre>packages/auth/src/oidc/dcr.ts</code>

Build a DCR endpoint handle. Tests use this when they want to inspect the advertised URL alongside the registration side effects.

```ts
export declare function createDcrEndpoint(options: CreateDcrEndpointOptions): DcrEndpoint;
```

#### <code v-pre>dynamicClientRegistration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L235) <code v-pre>packages/auth/src/oidc/dcr.ts</code>

Register a client with the underlying mock AS. Returns the RFC 7591 §3 response. `client_id` is assigned deterministically; `client_secret` is omitted when `token_endpoint_auth_method` is `none` (matches how a real AS treats public clients).

```ts
export declare function dynamicClientRegistration(options: DynamicClientRegistrationOptions, request: ClientRegistrationRequest): ClientRegistrationResponse;
```

#### <code v-pre>mintSoftwareStatement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oidc/dcr.ts#L127) <code v-pre>packages/auth/src/oidc/dcr.ts</code>

Mint a software_statement JWT for testing. Tests use this to build valid / invalid software statements without cracking real JWS crypto.

```ts
export declare function mintSoftwareStatement(claims: Record<string, unknown>, trustAnchor: string, headerOverrides?: Record<string, unknown>): string;
```


