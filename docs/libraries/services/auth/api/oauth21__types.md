---
title: "@kiwa-lab/auth oauth21__types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>oauth21&#95;&#95;types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>AccessToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L198) <code v-pre>packages/auth/src/oauth21/types.ts</code>

```ts
export interface AccessToken {
    token: string;
    tokenType: 'Bearer' | 'DPoP';
    expiresAt: number;
    scope: string;
    clientId: string;
    subject: string;
    /**
     * SHA-256 thumbprint of the DPoP public JWK the token is bound to. Absent
     * when the token is a plain bearer.
     */
    dpopJkt?: string;
    /** Resource indicator (RFC 8707) the token is bound to, when supplied. */
    resource?: string;
}
```

#### <code v-pre>AuthorizationRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L121) <code v-pre>packages/auth/src/oauth21/types.ts</code>

Authorization request submitted to `/authorize`. RFC 9700 §2.1 requires PKCE parameters on every request — `code_challenge` + `code_challenge_method` are mandatory even for confidential clients.

```ts
export interface AuthorizationRequest {
    responseType: 'code';
    clientId: string;
    redirectUri: string;
    state: string;
    scope?: string;
    codeChallenge: string;
    codeChallengeMethod: PkceChallengeMethod;
    /**
     * Optional resource indicator (RFC 8707). When present the AS records it on
     * the issued code so `/token` can bind the resulting access token to that
     * resource.
     */
    resource?: string;
}
```

#### <code v-pre>AuthorizationResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L143) <code v-pre>packages/auth/src/oauth21/types.ts</code>

Response to a successful `/authorize` call. Real deployments 302-redirect the browser to `redirectUri?code=...&state=...`; the mock returns the parsed shape directly so tests can assert `code` and `state` without HTTP plumbing.

```ts
export interface AuthorizationResponse {
    code: string;
    state: string;
    redirectUri: string;
}
```

#### <code v-pre>AuthorizationServer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L315) <code v-pre>packages/auth/src/oauth21/types.ts</code>

`AuthorizationServer` return shape from `createAuthorizationServer`. Exposes the RFC 6749 / 9700 / 7662 endpoint surface as plain methods.

```ts
export interface AuthorizationServer {
    readonly issuer: string;
    /** Register an additional client after env construction. */
    registerClient(client: ClientRegistration): void;
    /** Register an additional user after env construction. */
    registerUser(user: AuthorizationUser): void;
    /** Handle an authorization request. Called by tests as if driving `/authorize`. */
    authorize(request: AuthorizationRequest, subject: string): AuthorizationResponse;
    /** Handle a token request. Called by tests as if driving `/token`. */
    token(request: TokenRequest): TokenResponse;
    /** Handle a token revocation. Called by tests as if driving `/revoke`. */
    revoke(token: string, clientId: string): void;
    /** Introspect a token per RFC 7662. */
    introspect(token: string): IntrospectionResponse;
    /**
     * Snapshot every issued access token, **including expired ones**. Test-only
     * inspection — production ASes never expose this.
     *
     * The list is not filtered by `expiresAt` (#2180). `introspect()` reports an
     * expired token as `active: false`, so the two answer different questions:
     * this one is the issuance history, that one is the current validity.
     */
    listAccessTokens(): readonly AccessToken[];
    /**
     * Snapshot every refresh token, including revoked and rotated ones.
     *
     * Both snapshot methods copy the elements as well as the array (#2179).
     * `readonly T[]` freezes the array, not what it holds, so returning the
     * stored objects would let a caller rewrite a token's `scope` and have the
     * refresh path grant it.
     */
    listRefreshTokens(): readonly RefreshToken[];
    /** Snapshot the set of jti values the AS has seen. */
    listSeenJtis(): readonly string[];
    /** Reset every token, code, and jti registry without disposing the AS. */
    reset(): void;
}
```

#### <code v-pre>AuthorizationServerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L356) <code v-pre>packages/auth/src/oauth21/types.ts</code>

Options accepted by `createAuthorizationServer`.

```ts
export interface AuthorizationServerOptions {
    issuer?: string;
    clients?: readonly ClientRegistration[];
    users?: readonly AuthorizationUser[];
    /**
     * Access token lifetime in seconds. Defaults to 3600 (RFC 6749 §5.1
     * `expires_in` convention). Tests wanting near-expiry paths pass a small
     * number.
     */
    accessTokenLifetimeSec?: number;
    /**
     * Refresh token lifetime in seconds. Defaults to 86400.
     */
    refreshTokenLifetimeSec?: number;
    /**
     * DPoP proof `iat` skew tolerance in seconds. RFC 9449 §4.3 recommends 60
     * seconds; the mock uses that as default. Callers wanting deterministic
     * tests can override.
     */
    dpopIatSkewSec?: number;
    /** Deterministic clock. When omitted the mock uses `Date.now()`. */
    now?: () => number;
}
```

#### <code v-pre>AuthorizationUser</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L306) <code v-pre>packages/auth/src/oauth21/types.ts</code>

User account preseeded on the mock AS. `scopes` is the set the AS may grant this user, and **omitting it means the empty set** (#2169). A requested scope has to appear here, or the request is rejected — the mock never grants a scope nobody declared. Tests that do not care about scopes can keep omitting it as long as they do not request one; the no-scope path yields an empty grant. Tests that request a scope must declare it.

```ts
export interface AuthorizationUser {
    subject: string;
    scopes?: readonly string[];
}
```

#### <code v-pre>ClientRegistration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L282) <code v-pre>packages/auth/src/oauth21/types.ts</code>

Client registration accepted by the mock AS. Real deployments manage clients through a Dynamic Client Registration endpoint (RFC 7591); the mock accepts the client shape at env construction to keep tests hermetic.

```ts
export interface ClientRegistration {
    clientId: string;
    redirectUris: readonly string[];
    /**
     * Scopes this client is registered for, with the same rule as
     * `AuthorizationUser.scopes` — omitting it means the empty set, so a client
     * that declares nothing can be granted nothing (#2169).
     */
    scopes?: readonly string[];
    /** Public / confidential distinction. `public` requires PKCE (still). */
    clientType?: 'public' | 'confidential';
}
```

#### <code v-pre>DpopJwk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L81) <code v-pre>packages/auth/src/oauth21/types.ts</code>

Public JWK embedded in the DPoP proof header. The mock represents the P-256 key as an opaque thumbprint so tests can compare identity without cracking the JWK fields.

```ts
export interface DpopJwk {
    /** Key type. Always `EC` for the ES256 alg the mock supports. */
    kty: 'EC';
    /** Curve. Always `P-256`. */
    crv: 'P-256';
    /** Base64url-encoded x-coordinate placeholder. */
    x: string;
    /** Base64url-encoded y-coordinate placeholder. */
    y: string;
}
```

#### <code v-pre>DpopProof</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L97) <code v-pre>packages/auth/src/oauth21/types.ts</code>

DPoP proof JWT structure. The mock represents the JWT as a compact `header.payload.signature` string but exposes the parsed header + payload for assertions.

```ts
export interface DpopProof {
    /** Full compact-serialized JWT string (`header.payload.signature`). */
    jwt: string;
    header: {
        /** Always `dpop+jwt` per RFC 9449 §4.2. */
        typ: 'dpop+jwt';
        /** Always `ES256`. */
        alg: 'ES256';
        /** Public JWK the AS binds the access token to. */
        jwk: DpopJwk;
    };
    payload: {
        htm: string;
        htu: string;
        iat: number;
        jti: string;
    };
}
```

#### <code v-pre>DpopProofInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L52) <code v-pre>packages/auth/src/oauth21/types.ts</code>

DPoP proof JWT parameters. RFC 9449 defines a Demonstration of Proof of Possession JWT that binds an access token to the client's asymmetric key, defeating bearer-token exfiltration. The mock uses ES256 (P-256 ECDSA) as the only supported alg — matching the alg advertised in the DPoP spec's default deployment.

```ts
export interface DpopProofInput {
    /** Uppercase HTTP method (`GET` / `POST` / `PUT` / `DELETE`). */
    htm: string;
    /** Absolute request URL, no query or fragment. */
    htu: string;
    /**
     * Issued-at timestamp in seconds since epoch. Callers can set this
     * explicitly (deterministic tests) or accept the default `Date.now()/1000`.
     */
    iat?: number;
    /**
     * Unique proof identifier. When omitted the mock generates a monotonic id
     * so replay attacks trip the AS's jti registry. Callers wanting to simulate
     * a replay pass an already-used `jti`.
     */
    jti?: string;
    /**
     * Public JWK the AS records as the client's DPoP key. When omitted the
     * mock provisions a fresh mock JWK; test suites that want to link multiple
     * proofs to the same key pass an existing `jwk`.
     */
    jwk?: DpopJwk;
}
```

#### <code v-pre>IntrospectionResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L267) <code v-pre>packages/auth/src/oauth21/types.ts</code>

Introspection response per RFC 7662. The mock returns the minimal shape a resource server needs to authorize a request.

```ts
export interface IntrospectionResponse {
    active: boolean;
    scope?: string;
    clientId?: string;
    sub?: string;
    exp?: number;
    tokenType?: 'Bearer' | 'DPoP';
    resource?: string;
}
```

#### <code v-pre>OAuth21GrantType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L10) <code v-pre>packages/auth/src/oauth21/types.ts</code>

OAuth 2.1 grant type. The mock intentionally exposes only the RFC 9700 "OAuth 2.1" allowlisted grants — `authorization_code` (with PKCE always required) + `refresh_token`. The historical `implicit` and `password` grants that OAuth 2.0 permitted were dropped by 2.1 and the mock rejects them at parse time so tests catch a downgrade attack immediately.

```ts
export type OAuth21GrantType = 'authorization_code' | 'refresh_token';
```

#### <code v-pre>OAuth21TestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L390) <code v-pre>packages/auth/src/oauth21/types.ts</code>

`setupOAuth21Env` return shape. Exposes the AS plus the standalone helpers so a test can drive PKCE + DPoP without importing the module leaves.

```ts
export interface OAuth21TestEnv extends TestEnvBase<'mock'> {
    readonly server: AuthorizationServer;
    /**
     * Generate a fresh PKCE code verifier. Deterministic within a single env
     * (monotonic counter) so tests reading the verifier get reproducible
     * output.
     */
    generateCodeVerifier(): string;
    /**
     * Derive the S256 challenge for a given verifier. Rejects `plain`.
     */
    deriveCodeChallenge(verifier: string, method?: PkceChallengeMethod): string;
    /**
     * Build a complete `PkceChallenge` (verifier + challenge). Convenience
     * wrapper.
     */
    createPkceChallenge(): PkceChallenge;
    /**
     * Mint a DPoP proof for a given HTTP method + URL. Returns the parsed
     * proof; the client sends `proof.jwt` in the `DPoP` header.
     */
    createDpopProof(input: DpopProofInput): DpopProof;
    /**
     * Rotate the current refresh token. Convenience wrapper around
     * `server.token({grantType: 'refresh_token', ...})`.
     */
    refreshToken(refreshToken: string, clientId: string, dpop?: DpopProof): TokenResponse;
    /**
     * Reset every fabricated PKCE / DPoP artifact and the AS registry. Does
     * not dispose the env — call `stop` for that.
     */
    reset(): void;
}
```

#### <code v-pre>PkceChallenge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L32) <code v-pre>packages/auth/src/oauth21/types.ts</code>

PKCE challenge produced by `generateCodeVerifier` + `deriveCodeChallenge`. The verifier is the high-entropy secret the client keeps; the challenge is the SHA-256 hash the client sends to the Authorization Server on `/authorize`, and later proves possession of by sending the verifier on `/token`.

```ts
export interface PkceChallenge {
    /** High-entropy secret. Kept by the client. */
    codeVerifier: string;
    /**
     * SHA-256 hash of the verifier, base64url encoded. Sent by the client on
     * `/authorize`; the AS records it against the issued code and, on `/token`,
     * re-hashes the verifier the client sends to compare.
     */
    codeChallenge: string;
    /** Method used to derive the challenge. Always `S256` in OAuth 2.1. */
    codeChallengeMethod: PkceChallengeMethod;
}
```

#### <code v-pre>PkceChallengeMethod</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L23) <code v-pre>packages/auth/src/oauth21/types.ts</code>

PKCE code challenge method. RFC 9700 §2.1.1 mandates `S256` for OAuth 2.1 and forbids `plain` — every parse path in the mock rejects `plain` explicitly rather than silently downgrading.

```ts
export type PkceChallengeMethod = 'S256';
```

#### <code v-pre>RefreshToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L220) <code v-pre>packages/auth/src/oauth21/types.ts</code>

Refresh token minted alongside every access token. RFC 9700 §2.2 mandates refresh token rotation — every use of a refresh token invalidates the previous token and issues a fresh one. The mock records a monotonic `rotationCount` so tests can assert the rotation happened.

```ts
export interface RefreshToken {
    token: string;
    clientId: string;
    subject: string;
    scope: string;
    rotationCount: number;
    expiresAt: number;
    /** Set to `true` after `/revoke` or a rotation. Prevents reuse. */
    revoked: boolean;
    /** SHA-256 thumbprint of the DPoP key, when bound. */
    dpopJkt?: string;
    /** Resource indicator, when bound. */
    resource?: string;
}
```

#### <code v-pre>SetupOAuth21EnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L384) <code v-pre>packages/auth/src/oauth21/types.ts</code>

Options accepted by `setupOAuth21Env`. Composes the AS options with helpers for PKCE + DPoP.

```ts
export interface SetupOAuth21EnvOptions extends AuthorizationServerOptions {
}
```

#### <code v-pre>TokenRequest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L154) <code v-pre>packages/auth/src/oauth21/types.ts</code>

Token request submitted to `/token`. RFC 6749 §4.1.3 dictates the shape; OAuth 2.1 adds mandatory PKCE (`code_verifier`) and RFC 9449 optionally adds `DPoP` header for sender-constrained tokens.

```ts
export type TokenRequest = {
    grantType: 'authorization_code';
    code: string;
    redirectUri: string;
    clientId: string;
    codeVerifier: string;
    /** DPoP proof for sender-constrained access tokens. Optional. */
    dpop?: DpopProof;
} | {
    grantType: 'refresh_token';
    refreshToken: string;
    clientId: string;
    /** DPoP proof for sender-constrained access tokens. Optional. */
    dpop?: DpopProof;
    /**
     * Explicit scope narrowing (RFC 6749 §6). When omitted the refreshed
     * token inherits the original grant's scope.
     */
    scope?: string;
};
```

#### <code v-pre>TokenResponse</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/types.ts#L255) <code v-pre>packages/auth/src/oauth21/types.ts</code>

Response to a successful `/token` call. Mirrors the RFC 6749 token response body verbatim so a caller wiring the mock behind a real HTTP client can treat it as-is.

```ts
export interface TokenResponse {
    accessToken: string;
    tokenType: 'Bearer' | 'DPoP';
    expiresIn: number;
    refreshToken: string;
    scope: string;
}
```
