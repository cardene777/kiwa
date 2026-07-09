/**
 * id_token verification wrapper — layers dogfood-app-specific fidelity
 * assertions on top of `@kiwa-lab/auth`'s `verifyIdToken`. Sub-Issue
 * v1.21-4c (this state) exercises the OIDC Core 1.0 §3.1.3.7 verification
 * requirements + the §3.1.3.6 hash-chain semantics.
 *
 * The wrapper does not re-implement JWS crypto — the underlying
 * `createIdTokenSigner.verify` already checks signature + iss / aud / exp /
 * iat / nonce / at_hash / c_hash. The wrapper adds:
 *   - a structured `IdTokenVerifyIssue` discriminator so tests can pin the
 *     failure axis (`signature` / `claims` / `nonce` / `hash_chain`) without
 *     grepping the underlying reason string;
 *   - a `mustVerify` variant that throws on failure so the RP callback path
 *     can treat the return value as always-valid;
 *   - a `parseIdTokenHeader` helper that pulls the `kid` out of a JWT
 *     compact-serialization without cryptographic decoding, so the RP can
 *     look up the matching JWKS key before invoking the verifier.
 *
 * The four fidelity axes covered by the harness (`tests/id-token-verify.spec.ts`) —
 *
 * | axis | assertion |
 * |---|---|
 * | 1. JWS signature | header.payload.signature triple must recompute to the JWKS-active kid signature; tampering or wrong-kid refuses |
 * | 2. claims 一致 | iss / aud / exp / iat must match RP expectations within skew tolerance |
 * | 3. nonce echo | authorization-request `nonce` must equal `nonce` claim in the id_token; missing echo refuses |
 * | 4. hash chain | `at_hash` = SHA-256(access_token)[0..15] base64url; `c_hash` = SHA-256(code)[0..15] base64url |
 *
 * Every axis maps 1:1 onto a section in `docs/quality-reports/auth/oidc-federation-id-token.md`.
 */

import type {
  IdTokenClaims,
  VerifyIdTokenOptions,
  VerifyIdTokenResult,
} from '@kiwa-lab/auth';

/**
 * Verifier callback shape — matches `OidcTestEnv.verifyIdToken`. The wrapper
 * accepts the verifier as a dependency so the mock env's `verifyIdToken` can
 * be swapped for a Keycloak-backed one without touching the wrapper.
 */
export type IdTokenVerifier = (
  jwt: string,
  options: VerifyIdTokenOptions,
) => VerifyIdTokenResult;

/**
 * Fidelity axis a verification failure maps onto. The wrapper classifies the
 * underlying `reason` string into one of these tags so tests can assert on the
 * failure mode without regexing.
 */
export type IdTokenVerifyAxis =
  | 'structural'
  | 'signature'
  | 'claims'
  | 'nonce'
  | 'hash_chain';

/**
 * Structured verification issue produced by the wrapper on failure. `axis`
 * pins the fidelity axis the failure belongs to; `reason` echoes the
 * underlying verifier's raw message for debuggability.
 */
export interface IdTokenVerifyIssue {
  axis: IdTokenVerifyAxis;
  reason: string;
}

/**
 * Discriminated wrapper result. `ok=true` carries the verified claims;
 * `ok=false` carries a structured {@link IdTokenVerifyIssue} so tests pin
 * the axis.
 */
export type IdTokenVerifyOutcome =
  | { ok: true; claims: IdTokenClaims }
  | { ok: false; issue: IdTokenVerifyIssue };

/**
 * Classify a `reason` string from the underlying verifier onto one of the
 * four fidelity axes. The mock verifier emits reasons that start with
 * `id_token:` and mention the failing field — matching on the field
 * substring is cheaper and more robust than a full grammar.
 */
export function classifyVerifyReason(reason: string): IdTokenVerifyAxis {
  if (reason.includes('signature') || reason.includes('kid') || reason.includes('alg')) {
    return 'signature';
  }
  if (reason.includes('nonce')) {
    return 'nonce';
  }
  if (reason.includes('at_hash') || reason.includes('c_hash')) {
    return 'hash_chain';
  }
  if (
    reason.includes('iss') ||
    reason.includes('aud') ||
    reason.includes('exp') ||
    reason.includes('iat')
  ) {
    return 'claims';
  }
  // Fallback — structural failure (segment count, base64url decoding, JSON
  // parse). Tests do not assert on this axis directly because the mock never
  // emits malformed segments; it exists so a hypothetical downstream regression
  // (invalid base64url in a manually-crafted token) still classifies.
  return 'structural';
}

/**
 * Verify an id_token JWT through the wrapper. Returns a discriminated outcome
 * so callers can pattern-match on the failure axis. The underlying verifier
 * is invoked once — every axis assertion the mock performs is folded into a
 * single `valid` / `reason` shape which the wrapper then unpacks.
 */
export function verifyIdToken(
  verifier: IdTokenVerifier,
  jwt: string,
  options: VerifyIdTokenOptions,
): IdTokenVerifyOutcome {
  const result = verifier(jwt, options);
  if (result.valid && result.claims !== undefined) {
    return { ok: true, claims: result.claims };
  }
  const reason = result.reason ?? 'id_token: verification failed without reason';
  return {
    ok: false,
    issue: {
      axis: classifyVerifyReason(reason),
      reason,
    },
  };
}

/**
 * Error thrown by {@link mustVerifyIdToken} when verification fails. Carries
 * the same {@link IdTokenVerifyIssue} the discriminated wrapper would report
 * so downstream catch blocks can inspect the axis without re-classifying.
 */
export class IdTokenVerifyError extends Error {
  constructor(public issue: IdTokenVerifyIssue) {
    super(`id_token: ${issue.axis} — ${issue.reason}`);
    this.name = 'IdTokenVerifyError';
  }
}

/**
 * Verify an id_token JWT and throw on failure. Useful for the RP callback
 * path where the caller wants to treat the return value as always-valid
 * claims (any failure produces an HTTP 401 upstream).
 */
export function mustVerifyIdToken(
  verifier: IdTokenVerifier,
  jwt: string,
  options: VerifyIdTokenOptions,
): IdTokenClaims {
  const outcome = verifyIdToken(verifier, jwt, options);
  if (outcome.ok) {
    return outcome.claims;
  }
  throw new IdTokenVerifyError(outcome.issue);
}

/**
 * Parsed id_token header. Only the `kid` and `alg` fields are extracted; the
 * `typ` is dropped because RFC 7515 §4.1.9 makes it optional. The wrapper
 * uses this to look up the matching JWKS key before invoking the verifier.
 */
export interface IdTokenHeader {
  alg: 'RS256' | 'ES256';
  kid: string;
}

/**
 * Base64url-decode a string. Duplicated locally instead of importing from
 * `@kiwa-lab/auth` because the auth package does not export the helper;
 * the RP-side helper stays fully self-contained.
 */
function base64UrlDecode(input: string): string {
  const pad = 4 - (input.length % 4);
  const padded = input + (pad === 4 ? '' : '='.repeat(pad));
  return Buffer.from(
    padded.replace(/-/g, '+').replace(/_/g, '/'),
    'base64',
  ).toString('utf-8');
}

/**
 * Parse the id_token header without invoking the verifier. Returns the alg +
 * kid so the RP can look up the matching JWKS key. Throws when the JWT is
 * structurally malformed so the caller can distinguish this from a signature
 * mismatch.
 */
export function parseIdTokenHeader(jwt: string): IdTokenHeader {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new IdTokenVerifyError({
      axis: 'structural',
      reason: `id_token: expected 3 segments, got ${parts.length}`,
    });
  }
  const headerB64 = parts[0] as string;
  let parsed: unknown;
  try {
    parsed = JSON.parse(base64UrlDecode(headerB64));
  } catch (err) {
    throw new IdTokenVerifyError({
      axis: 'structural',
      reason: `id_token: header parse failed — ${(err as Error).message}`,
    });
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new IdTokenVerifyError({
      axis: 'structural',
      reason: 'id_token: header is not a JSON object',
    });
  }
  const record = parsed as Record<string, unknown>;
  const alg = record['alg'];
  const kid = record['kid'];
  if (alg !== 'RS256' && alg !== 'ES256') {
    throw new IdTokenVerifyError({
      axis: 'signature',
      reason: `id_token: header alg "${String(alg)}" is not RS256/ES256`,
    });
  }
  if (typeof kid !== 'string' || kid.length === 0) {
    throw new IdTokenVerifyError({
      axis: 'signature',
      reason: 'id_token: header missing kid',
    });
  }
  return { alg, kid };
}
