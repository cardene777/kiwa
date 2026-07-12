import type { TestEnvBase } from '@kiwa-lab/core';

import type {
  AuthorizationServer,
  ClientRegistration as OAuth21ClientRegistration,
  OAuth21TestEnv,
} from '../oauth21/types.js';

/**
 * OpenID Provider metadata returned by the Discovery endpoint
 * (`.well-known/openid-configuration`). Fields follow OpenID Connect Discovery
 * 1.0 §3. The mock returns the minimum set that a Relying Party (RP) needs to
 * complete the Authorization Code + PKCE flow that OIDC layers on top of
 * OAuth 2.1.
 *
 * `issuer` MUST match the URL used to fetch the document (spec §4.3). The mock
 * derives every other URL from it so a test can compare with a single string
 * mismatch check.
 */
export interface OpenIdProviderMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  registration_endpoint: string;
  userinfo_endpoint: string;
  /** Response types advertised. Always `['code']` (OIDC hybrid / implicit dropped). */
  response_types_supported: readonly string[];
  /** Subject identifier types. `public` only in the mock. */
  subject_types_supported: readonly string[];
  /** id_token signing algs advertised. `RS256` + `ES256`. */
  id_token_signing_alg_values_supported: readonly string[];
  /** Scopes advertised. Always contains `openid`. */
  scopes_supported: readonly string[];
  /** Token endpoint auth methods advertised. */
  token_endpoint_auth_methods_supported: readonly string[];
  /** Claims advertised via id_token. */
  claims_supported: readonly string[];
  /** PKCE code challenge methods. Always `['S256']` per OAuth 2.1. */
  code_challenge_methods_supported: readonly string[];
}

/**
 * Discovery endpoint handle. `fetch()` returns the OP metadata as a plain
 * object — a real HTTP client would parse the JSON body but the mock skips
 * the encoding trip so tests can assert on the fields directly.
 */
export interface DiscoveryEndpoint {
  readonly url: string;
  readonly issuer: string;
  fetch(): OpenIdProviderMetadata;
}

/**
 * OpenID Connect Dynamic Client Registration request per RFC 7591 §2.
 * Fields the mock validates: `redirect_uris` (mandatory, non-empty),
 * `grant_types` (must be OAuth 2.1 allowlist), `token_endpoint_auth_method`
 * (must be an advertised method). `client_name` is treated as opaque
 * metadata.
 */
export interface ClientRegistrationRequest {
  redirect_uris: readonly string[];
  client_name?: string;
  grant_types?: readonly string[];
  response_types?: readonly string[];
  token_endpoint_auth_method?: string;
  scope?: string;
  /**
   * Optional software statement per RFC 7591 §2.3. The mock treats it as a
   * signed JWT of the form `header.payload.signature`. When present the
   * signature is checked against the AS trust anchor + the payload claims
   * are folded into the registration.
   */
  software_statement?: string;
}

/**
 * Response body from `/register` (RFC 7591 §3). Real deployments assign a
 * random `client_id` and (for confidential clients) a `client_secret`; the
 * mock returns deterministic ids from a monotonic counter for reproducible
 * tests.
 */
export interface ClientRegistrationResponse {
  client_id: string;
  client_secret?: string;
  client_id_issued_at: number;
  redirect_uris: readonly string[];
  grant_types: readonly string[];
  response_types: readonly string[];
  token_endpoint_auth_method: string;
  scope: string;
}

/**
 * JWKS entry. Keys are opaque records — the mock signs id_tokens with an
 * HMAC-style signature keyed by `kid`, so `n` / `e` / `x` / `y` are
 * placeholders that let a real client parse the JWK without cracking the
 * cryptographic invariants.
 */
export interface JwksKey {
  kid: string;
  /** Signature algorithm. Only `RS256` + `ES256` supported. */
  alg: 'RS256' | 'ES256';
  /** Key type. `RSA` for `RS256`, `EC` for `ES256`. */
  kty: 'RSA' | 'EC';
  /** Public exponent (RS256). Base64url-encoded placeholder. */
  n?: string;
  e?: string;
  /** EC curve params (ES256). */
  crv?: 'P-256';
  x?: string;
  y?: string;
  /** Public key use. Always `sig` in the mock. */
  use: 'sig';
  /**
   * Retention deadline in seconds since epoch. `undefined` means the key is
   * currently the active signing key; once rotated the mock stamps this
   * with `now + retentionSec` and drops the key once `now > retiredAt`.
   */
  retiredAt?: number;
}

/**
 * JWKS document returned by `/jwks`. Real deployments return `{keys: [...]}`
 * per RFC 7517 §5; the mock mirrors that shape verbatim.
 */
export interface JwksDocument {
  keys: readonly JwksKey[];
}

/**
 * JWKS endpoint handle. Exposes `fetch()` (returns the current key set),
 * `rotate()` (mint a new active key, retire the old one with a retention
 * window), and `activeKey()` (peek the current signing key).
 */
export interface JwksEndpoint {
  readonly url: string;
  fetch(): JwksDocument;
  rotate(): JwksKey;
  activeKey(): JwksKey;
  /**
   * Snapshot every key including retired ones still in the retention window.
   * Test-only inspection.
   */
  allKeys(): readonly JwksKey[];
}

/**
 * id_token claim shape per OpenID Connect Core 1.0 §2. `iss` / `sub` / `aud`
 * / `exp` / `iat` are mandatory. The optional claims are the ones the mock
 * validates on `verifyIdToken` — extending this shape requires teaching the
 * verifier about new claims.
 */
export interface IdTokenClaims {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  /**
   * Nonce echoed from the authorization request. Mandatory when the RP sent
   * one — the mock refuses to sign an id_token missing `nonce` when the
   * caller passes an `expectedNonce` on verify.
   */
  nonce?: string;
  /**
   * Access token hash per OIDC Core §3.1.3.6. Left half of the SHA-256 of
   * the ASCII access_token, base64url-encoded.
   */
  at_hash?: string;
  /**
   * Authorization code hash per OIDC Core §3.3.2.11. Left half of the
   * SHA-256 of the ASCII code, base64url-encoded.
   */
  c_hash?: string;
  /** Additional claim carrier. */
  [claim: string]: unknown;
}

/**
 * Compact-serialized id_token JWT (`header.payload.signature`). The mock
 * exposes the parsed claims so tests can assert without decoding the JWT.
 */
export interface IdToken {
  jwt: string;
  header: {
    alg: 'RS256' | 'ES256';
    typ: 'JWT';
    kid: string;
  };
  claims: IdTokenClaims;
}

/**
 * Input to `signIdToken`. The signer builds a full JWT from these fields plus
 * the currently-active JWKS key.
 */
export interface SignIdTokenInput {
  /** Issuer. Defaults to the AS issuer. */
  iss?: string;
  /** Subject. Required — no default. */
  sub: string;
  /** Audience (client_id of the RP). Required. */
  aud: string;
  /** Lifetime in seconds. Added to `iat` to compute `exp`. */
  lifetimeSec?: number;
  /** Nonce echoed from the authorization request. */
  nonce?: string;
  /** ASCII access_token that `at_hash` should cover. */
  accessToken?: string;
  /** ASCII authorization code that `c_hash` should cover. */
  code?: string;
  /** Additional custom claims folded into the payload. */
  extraClaims?: Record<string, unknown>;
}

/**
 * Options accepted by `verifyIdToken`. The verifier refuses on any mismatch —
 * `expectedIssuer` / `expectedAudience` are mandatory in practice (the mock
 * types them as required to remind callers). `expectedNonce` /
 * `expectedAccessToken` / `expectedCode` are optional because not every flow
 * carries them, but if the token has the corresponding claim the verifier
 * checks it against the expectation.
 */
export interface VerifyIdTokenOptions {
  expectedIssuer: string;
  expectedAudience: string;
  expectedNonce?: string;
  /** ASCII access_token to compare against `at_hash`. */
  expectedAccessToken?: string;
  /** ASCII code to compare against `c_hash`. */
  expectedCode?: string;
  /** Deterministic clock. */
  now?: () => number;
  /**
   * Skew tolerance in seconds. Clock drift between the RP and OP is common
   * in real deployments; the mock defaults to 60 s to match the DPoP skew
   * default in the OAuth 2.1 adapter.
   */
  clockSkewSec?: number;
}

/**
 * Verify result. `valid` false always carries a `reason` so tests can pin
 * failure modes without regexing the exception message.
 */
export interface VerifyIdTokenResult {
  valid: boolean;
  claims?: IdTokenClaims;
  reason?: string;
}

/**
 * Trust chain node in an OpenID Federation 1.0 trust chain. The mock
 * represents each node as a plain object rather than a signed Entity
 * Configuration JWT — the point is to prove the chain-walk logic, not the
 * signature cryptography.
 */
export interface TrustAnchor {
  /** Entity identifier (URL). */
  entity_id: string;
  /**
   * Public JWKS the node advertises. In real Federation this signs its own
   * Entity Configuration + Entity Statements about subordinates.
   */
  jwks: JwksDocument;
  /** Metadata the node advertises. */
  metadata: {
    openid_provider?: Partial<OpenIdProviderMetadata>;
    openid_relying_party?: Record<string, unknown>;
  };
}

/**
 * Entity Statement per OpenID Federation 1.0 §3.1. The mock represents it as
 * a plain object (skipping the JWS signature) with the subject / issuer pair
 * that the chain walker follows. Real deployments would serialize this as a
 * JWT signed by the issuer's JWKS.
 */
export interface EntityStatement {
  /** Issuing entity. */
  iss: string;
  /** Subject entity being described. */
  sub: string;
  /** JWKS the subject advertises. */
  jwks: JwksDocument;
  /** Metadata the subject advertises. */
  metadata: {
    openid_provider?: Partial<OpenIdProviderMetadata>;
    openid_relying_party?: Record<string, unknown>;
  };
  /** Expiration in seconds since epoch. */
  exp: number;
  /** Issue time in seconds since epoch. */
  iat: number;
}

/**
 * Structured discriminator for `TrustChainResult.reason`. Downstream wrappers
 * (dogfood-oidc-federation の `classifyFederationReason` 等) が reason string の
 * substring match で failure axis を判定する fragile 依存を除去するため、
 * underlying resolver 側で 5 種の failure axis を tag 付けする。
 *
 * `broken_link` — chain step が previous step の `iss` を describe しない
 * (walker が該当 intermediate を見つけられず exhausted、 または cycle 検出前に
 * exhaust)、 `cycle` — walker が既訪 entity を再訪、
 * `expired_intermediate` — intermediate statement の `exp <= now`、
 * `expired_leaf` — leaf statement の `exp <= now`、
 * `anchor_mismatch` — chain 到達点の `iss` が指定 trust anchor と一致しない。
 */
export type TrustChainReasonCode =
  | 'broken_link'
  | 'cycle'
  | 'expired_intermediate'
  | 'expired_leaf'
  | 'anchor_mismatch';

export const TRUST_CHAIN_REASON_CODES: readonly TrustChainReasonCode[] = [
  'broken_link',
  'cycle',
  'expired_intermediate',
  'expired_leaf',
  'anchor_mismatch',
];

export function isTrustChainReasonCode(value: string): value is TrustChainReasonCode {
  return TRUST_CHAIN_REASON_CODES.includes(value as TrustChainReasonCode);
}

/**
 * Trust chain returned by `resolveTrustChain`. The chain is ordered from the
 * leaf (index 0) to the trust anchor (last index). `valid` false always
 * carries a `reason` + `reason_code` — the `reason_code` は failure axis を
 * pin する structured tag、 `reason` は human-readable diagnostic string。
 */
export interface TrustChainResult {
  valid: boolean;
  chain?: readonly EntityStatement[];
  anchor?: TrustAnchor;
  reason?: string;
  /**
   * Failure axis を pin する structured tag。 `valid === false` の時のみ
   * 存在する。 wrapper が substring match せず discriminated union として
   * failure mode を分岐できるようにする (undefined 許容で backward compat)。
   */
  reason_code?: TrustChainReasonCode;
}

/**
 * `setupOidcEnv` return shape. Composes the OAuth 2.1 mock AS with OIDC
 * discovery / DCR / JWKS / id_token / federation helpers.
 */
export interface OidcTestEnv extends TestEnvBase<'mock'> {
  readonly issuer: string;
  readonly discovery: DiscoveryEndpoint;
  readonly jwks: JwksEndpoint;
  /**
   * Underlying OAuth 2.1 mock AS. OIDC layers `id_token` on the OAuth 2.1
   * authorization_code flow — tests can drive the AS directly for the OAuth
   * plumbing and use the OIDC helpers for the `id_token` layer on top.
   */
  readonly server: AuthorizationServer;
  /**
   * Underlying OAuth 2.1 env. Tests exclusively driving the OIDC surface
   * rarely touch this; it's exposed so callers can reuse PKCE / DPoP helpers.
   */
  readonly oauth21: OAuth21TestEnv;
  /**
   * Register a client via the Dynamic Client Registration endpoint (RFC
   * 7591). Returns the AS-assigned client_id + client_secret.
   */
  registerClient(request: ClientRegistrationRequest): ClientRegistrationResponse;
  /**
   * Sign an id_token with the currently-active JWKS key. Called by the RP
   * flow after `/token` mints the access token — the mock exposes it as a
   * standalone helper so tests can build id_tokens without driving the full
   * flow.
   */
  signIdToken(input: SignIdTokenInput): IdToken;
  /**
   * Verify an id_token JWT. Returns a discriminated result so tests can
   * assert on `reason` for failure paths.
   */
  verifyIdToken(jwt: string, options: VerifyIdTokenOptions): VerifyIdTokenResult;
  /**
   * Resolve a trust chain from a leaf entity to a trust anchor. Returns the
   * ordered chain when valid; a discriminated failure otherwise.
   */
  resolveTrustChain(input: ResolveTrustChainInput): TrustChainResult;
  /** Reset every OIDC fabricated artifact + the underlying OAuth 2.1 state. */
  reset(): void;
}

/**
 * Options accepted by `setupOidcEnv`. Extends the OAuth 2.1 options with
 * OIDC-specific settings.
 */
export interface SetupOidcEnvOptions {
  issuer?: string;
  clients?: readonly OAuth21ClientRegistration[];
  users?: readonly {
    subject: string;
    scopes?: readonly string[];
  }[];
  /**
   * Access token lifetime (seconds). Passed through to the OAuth 2.1 mock.
   */
  accessTokenLifetimeSec?: number;
  /** Refresh token lifetime (seconds). Passed through to the OAuth 2.1 mock. */
  refreshTokenLifetimeSec?: number;
  /** id_token lifetime (seconds). Defaults to 3600. */
  idTokenLifetimeSec?: number;
  /**
   * Retention window for retired JWKS keys (seconds). Defaults to 86400
   * (24 h). During the retention window a token signed by the retired key
   * still verifies; after it, the key is dropped from the JWKS.
   */
  jwksRetentionSec?: number;
  /**
   * Software statement issuer used to validate DCR `software_statement`
   * signatures. When absent the mock refuses every request that carries a
   * `software_statement`.
   */
  softwareStatementIssuer?: string;
  /** Deterministic clock. */
  now?: () => number;
}

/**
 * Input to `resolveTrustChain`. The caller supplies the leaf entity's
 * statement + a set of intermediate statements + the trusted anchor. The
 * mock walks from leaf to anchor following the `iss` / `sub` linkage.
 */
export interface ResolveTrustChainInput {
  leaf: EntityStatement;
  intermediates: readonly EntityStatement[];
  anchor: TrustAnchor;
  /** Deterministic clock. */
  now?: () => number;
}
