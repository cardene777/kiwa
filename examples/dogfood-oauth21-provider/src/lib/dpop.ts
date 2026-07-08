/**
 * DPoP (Demonstration of Proof of Possession) helper wrapper for the
 * dogfood AS.
 *
 * RFC 9449 defines the mechanism, RFC 9700 §3 hardens it for OAuth 2.1 by
 * mandating sender-constrained access tokens whenever the client can hold
 * a DPoP keypair. The `@kiwa/auth` package ships the primitive
 * helpers (`parseDpopProof`, `verifyDpopProof`, `computeJkt`) that this
 * module re-exports plus adds dogfood-level guard helpers so route
 * handlers can reject a malformed proof before the AS ever sees it.
 *
 * Split rationale — the kiwa primitives are provider-neutral (used by
 * mock + real AS + supabase adapter), whereas the wrappers here encode
 * the dogfood app's contract with the client: the client always sends
 * the proof through the `DPoP` HTTP header, the AS re-derives the JWK
 * thumbprint (`jkt`) from the parsed proof, and the thumbprint is bound
 * to the minted access + refresh tokens.
 *
 * Fidelity axes covered:
 *  1. DPoP header alg — {@link assertDpopHeaderShape} enforces
 *     `alg=ES256` + `typ=dpop+jwt`. Anything else surfaces as
 *     `invalid_dpop_proof` per RFC 9449 §5.2.
 *  2. `htm` + `htu` binding — verified by the underlying
 *     `verifyDpopProof`; the wrapper here surfaces the AS-side error
 *     with a distinct kind so route handlers can map to
 *     `invalid_dpop_proof` uniformly across mock + real drivers.
 *  3. `iat` skew tolerance — the kiwa AS applies a configurable window
 *     (default 60 s per RFC 9449 §4.3). The wrapper does not duplicate
 *     the check but exposes a distinct kind so the harness can assert
 *     the boundary is enforced.
 *  4. `jti` replay guard — the kiwa AS keeps a `seenJtis` registry.
 *     Second use of the same `jti` throws with a message the classifier
 *     tags as `jti_replay_refused` so the client sees
 *     `invalid_dpop_proof` (not `invalid_grant`).
 */

import {
  computeDpopJkt as kiwaComputeJkt,
  parseDpopProof as kiwaParseDpopProof,
  verifyDpopProof as kiwaVerifyDpopProof,
  type DpopJwk,
  type DpopProof,
} from '@kiwa/auth';

/**
 * RFC 9449 §4.2 — DPoP proof header MUST carry `typ=dpop+jwt`.
 */
export const DPOP_TYP = 'dpop+jwt';

/**
 * RFC 9449 §4.2 — the mock AS supports ES256 only. RFC 9700 §3 does not
 * mandate a single alg but the dogfood app pins ES256 so the fidelity
 * harness compares byte-exact JWK thumbprints across drivers.
 */
export const DPOP_ALG = 'ES256';

/**
 * Kind tag used by {@link DpopValidationError} so route handlers can map
 * every rejection reason onto a single OAuth 2.1 error code
 * (`invalid_dpop_proof` per RFC 9449 §5.2). Keeping the kind distinct
 * from the generic `as_error` lets tests assert the exact rejection
 * path without grepping the underlying error string.
 */
export type DpopRejectionKind =
  | 'header_missing'
  | 'header_malformed'
  | 'header_typ_refused'
  | 'header_alg_refused'
  | 'header_jwk_refused'
  | 'payload_htm_mismatch'
  | 'payload_htu_mismatch'
  | 'payload_iat_skew'
  | 'payload_jti_missing'
  | 'payload_jti_replay'
  | 'thumbprint_mismatch';

/**
 * Distinguished error the DPoP wrapper throws so route handlers do not
 * have to grep on the underlying kiwa AS error string. Every rejection
 * path pins a {@link DpopRejectionKind} tag.
 */
export class DpopValidationError extends Error {
  readonly kind: DpopRejectionKind;
  constructor(kind: DpopRejectionKind, message: string) {
    super(message);
    this.name = 'DpopValidationError';
    this.kind = kind;
  }
}

/**
 * Parse a `DPoP` HTTP header value into the {@link DpopProof} shape the
 * kiwa AS accepts. Wraps {@link kiwaParseDpopProof} and normalises the
 * failure surface — an empty header is `header_missing`, a segment count
 * mismatch or JSON parse failure is `header_malformed`, an unexpected
 * `typ`/`alg`/`jwk` is `header_typ_refused` / `header_alg_refused` /
 * `header_jwk_refused`.
 *
 * The RFC 9449 §4.1 wire encoding is the compact JWT string
 * `header.payload.signature`. The client sends exactly one value in the
 * `DPoP` header — the wrapper refuses a header carrying multiple values
 * (`, `-separated) to keep the failure kinds unambiguous.
 */
export function parseDpopHeader(headerValue: string | undefined): DpopProof {
  if (headerValue === undefined || headerValue === '') {
    throw new DpopValidationError(
      'header_missing',
      'DPoP header missing — RFC 9449 §4 requires the proof JWT on every request that carries a sender-constrained access token',
    );
  }
  // RFC 9449 §5.2 — exactly one proof per request; a `,` in the header
  // signals a folded / duplicated header which we refuse rather than
  // trying to disambiguate.
  if (headerValue.includes(',')) {
    throw new DpopValidationError(
      'header_malformed',
      'DPoP header carries multiple values — RFC 9449 §5.2 expects exactly one proof per request',
    );
  }
  let proof: DpopProof;
  try {
    proof = kiwaParseDpopProof(headerValue);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw classifyParseError(message);
  }
  // Belt + braces — kiwa's parser already enforces typ / alg / jwk shape,
  // but the wrapper re-checks so the assertion contract lives in one
  // place. The classifier below matches the kiwa error string; if kiwa
  // ever loosens the parse contract, this guard still refuses at the
  // wrapper boundary.
  assertDpopHeaderShape(proof);
  return proof;
}

function classifyParseError(message: string): DpopValidationError {
  if (message.includes('expected typ=dpop+jwt')) {
    return new DpopValidationError('header_typ_refused', message);
  }
  if (message.includes('expected alg=ES256')) {
    return new DpopValidationError('header_alg_refused', message);
  }
  if (message.includes('expected EC P-256 jwk')) {
    return new DpopValidationError('header_jwk_refused', message);
  }
  return new DpopValidationError('header_malformed', message);
}

/**
 * Assert the parsed proof's header carries the DPoP-mandated
 * `typ=dpop+jwt`, `alg=ES256`, and an EC P-256 JWK. Route handlers can
 * call this on a proof pulled from a non-header source (e.g. tests that
 * fabricate a proof via `createDpopProof`) to keep the rejection kind
 * uniform.
 */
export function assertDpopHeaderShape(proof: DpopProof): void {
  if (proof.header.typ !== DPOP_TYP) {
    throw new DpopValidationError(
      'header_typ_refused',
      `DPoP header typ="${proof.header.typ}" refused — RFC 9449 §4.2 requires "${DPOP_TYP}"`,
    );
  }
  if (proof.header.alg !== DPOP_ALG) {
    throw new DpopValidationError(
      'header_alg_refused',
      `DPoP header alg="${proof.header.alg}" refused — dogfood AS pins "${DPOP_ALG}"`,
    );
  }
  const jwk = proof.header.jwk;
  if (!jwk || jwk.kty !== 'EC' || jwk.crv !== 'P-256') {
    throw new DpopValidationError(
      'header_jwk_refused',
      `DPoP header jwk refused — dogfood AS requires kty=EC crv=P-256, got kty="${jwk?.kty}" crv="${jwk?.crv}"`,
    );
  }
}

/**
 * Compute the JWK thumbprint (RFC 7638) for a DPoP JWK. Sender-constrained
 * access tokens embed this thumbprint as `cnf.jkt` — every downstream
 * call `/introspect` echoes it back so the resource server can bind a
 * new incoming DPoP proof to the same key.
 *
 * Wraps {@link kiwaComputeJkt} without extra logic — kept as a
 * dogfood-level named export so callers do not import from
 * `@kiwa/auth` directly (keeps the dependency surface obvious).
 */
export function computeJkt(jwk: DpopJwk): string {
  return kiwaComputeJkt(jwk);
}

/**
 * Options accepted by {@link verifyDpopProofBinding}. Route handlers
 * build the expected `htm` (uppercase HTTP method) + `htu` (absolute
 * URL, no query / fragment) from the incoming request and hand the
 * shared jti registry + clock to the wrapper.
 */
export interface VerifyDpopProofBindingOptions {
  expectedHtm: string;
  expectedHtu: string;
  seenJtis: Set<string>;
  now: () => number;
  /**
   * Skew tolerance for `iat` in seconds. RFC 9449 §4.3 recommends 60 s;
   * the dogfood AS defaults to that (`SetupOAuth21EnvOptions.dpopIatSkewSec`).
   */
  iatSkewSec: number;
}

/**
 * Verify a DPoP proof + return the JWK thumbprint the AS should bind
 * the token to. Wraps {@link kiwaVerifyDpopProof} and classifies the
 * failure surface into {@link DpopRejectionKind} so route handlers map
 * every rejection to `invalid_dpop_proof` uniformly.
 *
 * The wrapper is the SSOT for the "verify then compute jkt" pattern —
 * the mock AS re-uses this exact composition inside
 * `authorization-server.verifyAndExtractDpopJkt`, so the dogfood app
 * running through Hono routes hits the same code path. Sub-Issues
 * #867 (revocation-fidelity) will re-use the wrapper unchanged when
 * driving the real oauth2-mock-server through fetch.
 */
export function verifyDpopProofBinding(
  proof: DpopProof,
  options: VerifyDpopProofBindingOptions,
): string {
  assertDpopHeaderShape(proof);
  let verified: DpopProof;
  try {
    verified = kiwaVerifyDpopProof(proof, {
      expectedHtm: options.expectedHtm,
      expectedHtu: options.expectedHtu,
      seenJtis: options.seenJtis,
      now: options.now,
      iatSkewSec: options.iatSkewSec,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw classifyVerifyError(message);
  }
  return computeJkt(verified.header.jwk);
}

function classifyVerifyError(message: string): DpopValidationError {
  if (message.includes('htm mismatch')) {
    return new DpopValidationError('payload_htm_mismatch', message);
  }
  if (message.includes('htu mismatch')) {
    return new DpopValidationError('payload_htu_mismatch', message);
  }
  if (message.includes('iat outside allowed skew')) {
    return new DpopValidationError('payload_iat_skew', message);
  }
  if (message.includes('proof missing jti')) {
    return new DpopValidationError('payload_jti_missing', message);
  }
  if (message.includes('replay detected')) {
    return new DpopValidationError('payload_jti_replay', message);
  }
  return new DpopValidationError('header_malformed', message);
}

/**
 * Re-export the `DpopJwk` + `DpopProof` types so callers depending on
 * the dogfood dpop module do not have to reach into `@kiwa/auth`.
 */
export type { DpopJwk, DpopProof };
