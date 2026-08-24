import type { TestEnvBase } from '@kiwa-lab/core';

/**
 * OAuth 2.1 grant type. The mock intentionally exposes only the RFC 9700
 * "OAuth 2.1" allowlisted grants — `authorization_code` (with PKCE always
 * required) + `refresh_token`. The historical `implicit` and `password`
 * grants that OAuth 2.0 permitted were dropped by 2.1 and the mock rejects
 * them at parse time so tests catch a downgrade attack immediately.
 */
export type OAuth21GrantType = 'authorization_code' | 'refresh_token';

export const OAUTH21_GRANT_TYPES: readonly OAuth21GrantType[] = ['authorization_code', 'refresh_token'];

export function isOAuth21GrantType(value: string): value is OAuth21GrantType {
  return OAUTH21_GRANT_TYPES.includes(value as OAuth21GrantType);
}

/**
 * PKCE code challenge method. RFC 9700 §2.1.1 mandates `S256` for OAuth 2.1
 * and forbids `plain` — every parse path in the mock rejects `plain`
 * explicitly rather than silently downgrading.
 */
export type PkceChallengeMethod = 'S256';

/**
 * PKCE challenge produced by `generateCodeVerifier` + `deriveCodeChallenge`.
 * The verifier is the high-entropy secret the client keeps; the challenge is
 * the SHA-256 hash the client sends to the Authorization Server on
 * `/authorize`, and later proves possession of by sending the verifier on
 * `/token`.
 */
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

/**
 * DPoP proof JWT parameters. RFC 9449 defines a Demonstration of Proof of
 * Possession JWT that binds an access token to the client's asymmetric key,
 * defeating bearer-token exfiltration. The mock uses ES256 (P-256 ECDSA) as
 * the only supported alg — matching the alg advertised in the DPoP spec's
 * default deployment.
 */
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

/**
 * Public JWK embedded in the DPoP proof header. The mock represents the P-256
 * key as an opaque thumbprint so tests can compare identity without cracking
 * the JWK fields.
 */
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

/**
 * DPoP proof JWT structure. The mock represents the JWT as a compact
 * `header.payload.signature` string but exposes the parsed header + payload
 * for assertions.
 */
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

/**
 * Authorization request submitted to `/authorize`. RFC 9700 §2.1 requires
 * PKCE parameters on every request — `code_challenge` + `code_challenge_method`
 * are mandatory even for confidential clients.
 */
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

/**
 * Response to a successful `/authorize` call. Real deployments 302-redirect
 * the browser to `redirectUri?code=...&state=...`; the mock returns the
 * parsed shape directly so tests can assert `code` and `state` without HTTP
 * plumbing.
 */
export interface AuthorizationResponse {
  code: string;
  state: string;
  redirectUri: string;
}

/**
 * Token request submitted to `/token`. RFC 6749 §4.1.3 dictates the shape;
 * OAuth 2.1 adds mandatory PKCE (`code_verifier`) and RFC 9449 optionally
 * adds `DPoP` header for sender-constrained tokens.
 */
export type TokenRequest =
  | {
      grantType: 'authorization_code';
      code: string;
      redirectUri: string;
      clientId: string;
      codeVerifier: string;
      /** DPoP proof for sender-constrained access tokens. Optional. */
      dpop?: DpopProof;
    }
  | {
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

/**
 * 全 field が primitive であることを型で強制する (#2180 r1-f2)。
 *
 * `listAccessTokens()` / `listRefreshTokens()` は要素を **浅く** copy して返す (#2179)。
 * それで足りるのは field が全て primitive だからで、object や配列の field を足すと
 * spread が内部参照を再公開して穴が戻る。
 *
 * コメントで注意するだけでは静かに戻るので、**足した時点で compile を落とす**。
 * `NonPrimitiveKeys<T>` は非 primitive な field 名を返し、下の `never` 代入が失敗する。
 */
type Primitive = string | number | boolean | bigint | symbol | null | undefined;

type NonPrimitiveKeys<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends Primitive ? never : K;
}[keyof T];


/**
 * 「primitive」 または「primitive の readonly 配列」 でない field 名を返す。
 *
 * `ClientRegistration` / `AuthorizationUser` 用 (#2180 r1-f2 の派生)。 この 2 型は
 * `redirectUris` / `scopes` という配列 field を持つので `NonPrimitiveKeys` は使えない
 * (正しい実装で落ちてしまう)。
 *
 * 守りたいのは **copy の深さと field の形が食い違わないこと**。 登録経路は配列 field を
 * 名指しで copy しているため、`metadata: Record<string, unknown>` のような field が
 * 足されると **その field だけ素通しして呼出側と参照を共有する** = #2179 で塞いだ穴が戻る。
 *
 * 配列 field を 1 つ足すだけなら copy の追加で済むが、object field を足すなら copy の形を
 * 変えないといけない。 後者を compile で止める。
 */
type DeepNonCopyableKeys<T> = {
  [K in keyof T]-?: NonNullable<T[K]> extends Primitive
    ? never
    : NonNullable<T[K]> extends readonly (infer E)[]
      ? NonNullable<E> extends Primitive
        ? never
        : K
      : K;
}[keyof T];

/**
 * Access token minted by `/token`. Contains just enough state for the mock
 * to answer `/introspect` and `/revoke` — a real JWT would encode this into
 * claims, the mock keeps a plain record for test ergonomics.
 */
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

/**
 * Refresh token minted alongside every access token. RFC 9700 §2.2 mandates
 * refresh token rotation — every use of a refresh token invalidates the
 * previous token and issues a fresh one. The mock records a monotonic
 * `rotationCount` so tests can assert the rotation happened.
 */
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

/**
 * 上の 2 型に非 primitive な field を足すと、ここで compile が落ちる。
 *
 * 落ちたら選ぶのは 2 つ。 field を primitive に直すか、`listAccessTokens()` /
 * `listRefreshTokens()` の copy を深くするか。 **浅い copy のまま足してはいけない** =
 * 内部参照が再公開され、#2179 で塞いだ穴が戻る。
 */
type _AssertAccessTokenAllPrimitive = NonPrimitiveKeys<AccessToken> extends never ? true : never;
type _AssertRefreshTokenAllPrimitive = NonPrimitiveKeys<RefreshToken> extends never ? true : never;

const _accessTokenIsFlat: _AssertAccessTokenAllPrimitive = true;
const _refreshTokenIsFlat: _AssertRefreshTokenAllPrimitive = true;
void _accessTokenIsFlat;
void _refreshTokenIsFlat;

/**
 * 登録経路が copy できる形に留まっていることを強制する (#2180)。
 *
 * 落ちたら選ぶのは 2 つ。 field を primitive か primitive の配列にするか、
 * `authorization-server.ts` の `ownClient()` / `ownUser()` の copy を深くするか。
 * **名指し copy のまま足してはいけない** = その field だけ呼出側と参照を共有する。
 */
type _AssertClientCopyable = DeepNonCopyableKeys<ClientRegistration> extends never ? true : never;
type _AssertUserCopyable = DeepNonCopyableKeys<AuthorizationUser> extends never ? true : never;

const _clientIsCopyable: _AssertClientCopyable = true;
const _userIsCopyable: _AssertUserCopyable = true;
void _clientIsCopyable;
void _userIsCopyable;

/**
 * Response to a successful `/token` call. Mirrors the RFC 6749 token response
 * body verbatim so a caller wiring the mock behind a real HTTP client can
 * treat it as-is.
 */
export interface TokenResponse {
  accessToken: string;
  tokenType: 'Bearer' | 'DPoP';
  expiresIn: number;
  refreshToken: string;
  scope: string;
}

/**
 * Introspection response per RFC 7662. The mock returns the minimal shape a
 * resource server needs to authorize a request.
 */
export interface IntrospectionResponse {
  active: boolean;
  scope?: string;
  clientId?: string;
  sub?: string;
  exp?: number;
  tokenType?: 'Bearer' | 'DPoP';
  resource?: string;
}

/**
 * Client registration accepted by the mock AS. Real deployments manage
 * clients through a Dynamic Client Registration endpoint (RFC 7591); the
 * mock accepts the client shape at env construction to keep tests hermetic.
 */
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

/**
 * User account preseeded on the mock AS.
 *
 * `scopes` is the set the AS may grant this user, and **omitting it means the
 * empty set** (#2169). A requested scope has to appear here, or the request is
 * rejected — the mock never grants a scope nobody declared.
 *
 * Tests that do not care about scopes can keep omitting it as long as they do
 * not request one; the no-scope path yields an empty grant. Tests that request
 * a scope must declare it.
 */
export interface AuthorizationUser {
  subject: string;
  scopes?: readonly string[];
}

/**
 * `AuthorizationServer` return shape from `createAuthorizationServer`.
 * Exposes the RFC 6749 / 9700 / 7662 endpoint surface as plain methods.
 */
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
   * Snapshot every access token the AS still holds, **including expired ones**.
   * Test-only inspection — production ASes never expose this.
   *
   * The list is not filtered by `expiresAt` (#2180). `introspect()` reports an
   * expired token as `active: false`, so the two answer different questions:
   * this one is what the AS is holding, that one is the current validity.
   *
   * **Not an issuance record.** `revoke()` removes an access token from the
   * registry outright, while a revoked refresh token stays with `revoked: true`.
   * Counting this list across a `revoke()` therefore undercounts what was issued.
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

/**
 * Options accepted by `createAuthorizationServer`.
 */
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

/**
 * Options accepted by `setupOAuth21Env`. Composes the AS options with helpers
 * for PKCE + DPoP.
 */
export interface SetupOAuth21EnvOptions extends AuthorizationServerOptions {}

/**
 * `setupOAuth21Env` return shape. Exposes the AS plus the standalone helpers
 * so a test can drive PKCE + DPoP without importing the module leaves.
 */
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
