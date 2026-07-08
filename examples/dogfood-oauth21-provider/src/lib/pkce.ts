/**
 * PKCE (Proof Key for Code Exchange) helper wrapper for the dogfood AS.
 *
 * RFC 7636 defines the mechanism, RFC 9700 §2.1.1 hardens it for OAuth 2.1
 * by mandating `S256` and forbidding `plain`. The kiwa-test/auth package
 * ships the primitive helpers (`createPkceChallenge`, `deriveCodeChallenge`,
 * `verifyCodeChallenge`) that this module re-exports plus adds
 * dogfood-level guard helpers so route handlers can reject downgraded
 * inputs before the AS ever sees them.
 *
 * Split rationale — the kiwa primitives are provider-neutral (used by
 * mock + real AS + supabase adapter), whereas the wrappers here encode
 * the dogfood app's contract with the client: the client never picks the
 * method (S256 is fixed), the verifier is generated once per flow start,
 * and the challenge is stored in the AS record for the token endpoint to
 * verify.
 *
 * Fidelity axes covered:
 *  1. verifier entropy — {@link assertVerifierFormat} rejects verifiers
 *     shorter than 43 chars, longer than 128 chars, or containing
 *     reserved characters. RFC 7636 §4.1.
 *  2. challenge derivation — {@link deriveChallengeS256} returns
 *     `base64url(SHA-256(verifier))` without padding.
 *  3. method enforcement — {@link assertMethodAllowed} rejects `plain`
 *     and any method other than `S256`. Missing method is refused
 *     upstream in the route handler with `invalid_request` (OAuth 2.1
 *     mandate — no `plain` default).
 *  4. verifier mismatch — {@link verifyChallenge} returns `false` when
 *     the derived challenge does not match the stored challenge; route
 *     handlers translate that to `invalid_grant`.
 */

import {
  createPkceChallenge as kiwaCreatePkceChallenge,
  deriveCodeChallenge as kiwaDeriveCodeChallenge,
  verifyCodeChallenge as kiwaVerifyCodeChallenge,
} from '@kiwa/auth';
import type { PkceChallenge, PkceChallengeMethod } from '@kiwa/auth';

/**
 * RFC 7636 §4.1 — code_verifier length bounds. 43 chars is the low bound
 * from 32 bytes of entropy base64url-encoded, 128 chars the high bound.
 */
export const PKCE_VERIFIER_MIN_LENGTH = 43;
export const PKCE_VERIFIER_MAX_LENGTH = 128;

/**
 * RFC 7636 §4.1 — the unreserved URL character set the verifier may use.
 * Anything outside this set (including padding `=`) is a downgrade.
 */
const PKCE_VERIFIER_CHARSET = /^[A-Za-z0-9\-._~]+$/;

/**
 * RFC 9700 §2.1.1 — only `S256` is allowed. `plain` is forbidden outright.
 */
export const PKCE_ALLOWED_METHOD: PkceChallengeMethod = 'S256';

/**
 * Kind tag used by {@link PkceValidationError} so route handlers can map
 * each rejection reason onto an OAuth 2.1 error code (`invalid_request`
 * for pre-flight rejections, `invalid_grant` for verifier mismatch on
 * `/token`).
 */
export type PkceRejectionKind =
  | 'verifier_too_short'
  | 'verifier_too_long'
  | 'verifier_invalid_charset'
  | 'method_plain_refused'
  | 'method_missing_refused'
  | 'method_unknown_refused'
  | 'verifier_mismatch';

/**
 * Distinguished error the PKCE wrapper throws so route handlers do not
 * have to grep on the underlying kiwa AS error string. Every method that
 * refuses input pins the {@link PkceRejectionKind} tag.
 */
export class PkceValidationError extends Error {
  readonly kind: PkceRejectionKind;
  constructor(kind: PkceRejectionKind, message: string) {
    super(message);
    this.name = 'PkceValidationError';
    this.kind = kind;
  }
}

/**
 * Produce a fresh `{codeVerifier, codeChallenge, codeChallengeMethod}` triple.
 * Wraps {@link kiwaCreatePkceChallenge} without extra logic — kept as a
 * dogfood-level named export so callers do not import from
 * `@kiwa/auth` directly (keeps the dependency surface obvious).
 */
export function createPkceChallenge(): PkceChallenge {
  return kiwaCreatePkceChallenge();
}

/**
 * Derive `code_challenge = base64url(SHA-256(code_verifier))` per RFC 7636
 * §4.2. Method is fixed to `S256` — the dogfood app does not expose a
 * plain-PKCE code path, so the caller never picks the method.
 */
export function deriveChallengeS256(verifier: string): string {
  return kiwaDeriveCodeChallenge(verifier, 'S256');
}

/**
 * Verify that a supplied verifier hashes to the stored challenge with
 * S256. Returns `true` on match, `false` on mismatch. Route handlers map
 * `false` to `invalid_grant` per RFC 6749 §5.2.
 */
export function verifyChallenge(
  verifier: string,
  storedChallenge: string,
): boolean {
  return kiwaVerifyCodeChallenge(verifier, storedChallenge, 'S256');
}

/**
 * Assert the verifier format per RFC 7636 §4.1. Throws
 * {@link PkceValidationError} on failure so route handlers can translate
 * the kind to an HTTP status uniformly.
 *
 * Checks:
 *   1. length in [43, 128]
 *   2. characters in unreserved URL set `[A-Za-z0-9-._~]`
 */
export function assertVerifierFormat(verifier: string): void {
  if (verifier.length < PKCE_VERIFIER_MIN_LENGTH) {
    throw new PkceValidationError(
      'verifier_too_short',
      `PKCE code_verifier too short — got ${verifier.length} chars, RFC 7636 §4.1 requires at least ${PKCE_VERIFIER_MIN_LENGTH}`,
    );
  }
  if (verifier.length > PKCE_VERIFIER_MAX_LENGTH) {
    throw new PkceValidationError(
      'verifier_too_long',
      `PKCE code_verifier too long — got ${verifier.length} chars, RFC 7636 §4.1 permits at most ${PKCE_VERIFIER_MAX_LENGTH}`,
    );
  }
  if (!PKCE_VERIFIER_CHARSET.test(verifier)) {
    throw new PkceValidationError(
      'verifier_invalid_charset',
      'PKCE code_verifier contains characters outside the RFC 7636 §4.1 unreserved set [A-Za-z0-9-._~]',
    );
  }
}

/**
 * Assert the `code_challenge_method` value per RFC 9700 §2.1.1. `plain`
 * and any unknown method are refused. `undefined` (method not supplied
 * on the request) is refused too — OAuth 2.1 hardens away the RFC 7636
 * default of `plain`, so the client must send `S256` explicitly.
 */
export function assertMethodAllowed(
  method: string | undefined,
): asserts method is 'S256' {
  if (method === undefined || method === '') {
    throw new PkceValidationError(
      'method_missing_refused',
      'PKCE code_challenge_method missing — OAuth 2.1 forbids defaulting to plain, so the client must send S256 explicitly',
    );
  }
  if (method === 'plain') {
    throw new PkceValidationError(
      'method_plain_refused',
      'PKCE code_challenge_method "plain" refused — RFC 9700 §2.1.1 mandates S256',
    );
  }
  if (method !== PKCE_ALLOWED_METHOD) {
    throw new PkceValidationError(
      'method_unknown_refused',
      `PKCE code_challenge_method "${method}" refused — only "${PKCE_ALLOWED_METHOD}" is allowed`,
    );
  }
}

/**
 * Convenience — assert verifier format then verify against the stored
 * challenge. Throws {@link PkceValidationError} with kind
 * `verifier_mismatch` when the challenge derived from the verifier does
 * not match the recorded challenge.
 */
export function assertVerifierMatches(
  verifier: string,
  storedChallenge: string,
): void {
  assertVerifierFormat(verifier);
  if (!verifyChallenge(verifier, storedChallenge)) {
    throw new PkceValidationError(
      'verifier_mismatch',
      'PKCE code_verifier does not match the recorded code_challenge',
    );
  }
}
