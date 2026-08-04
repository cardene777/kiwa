/**
 * RP callback verification steps, extracted from the Nuxt route so they can be
 * executed by a test.
 *
 * `rp/server/api/callback.post.ts` is a `defineEventHandler`, which only runs
 * under the Nitro runtime — booting it costs a `nuxt build` plus a live
 * server, so the RP specs replay the flow's contract instead of invoking the
 * route. That leaves anything written inline in the handler unexecuted by the
 * suite. The security-carrying steps live here so they are covered directly,
 * and the route stays a thin adapter that maps a thrown error onto a 401.
 *
 * The same split is why `packages/cli` keeps `runCli.ts` beside a six-line
 * `bin.ts`.
 */

import { createJwksDocumentVerifier } from '@kiwa-lab/auth';
import type { IdTokenClaims, JwksDocument } from '@kiwa-lab/auth';

import { IdTokenVerifyError, mustVerifyIdToken } from './id-token.js';

/**
 * Everything the callback knows when it is ready to judge an id_token. The
 * cookie-sourced values (`nonce`) and the request-sourced values (`code`)
 * arrive already checked for presence by the route; this module decides
 * whether the token agrees with them.
 */
export interface VerifyCallbackIdTokenInput {
  /** JWKS document downloaded from the OP's `jwks_uri`. */
  jwks: JwksDocument;
  /** `id_token` from the token endpoint response. */
  idToken: string;
  /** `access_token` from the same response, checked against `at_hash`. */
  accessToken: string;
  /** Authorization code just redeemed, checked against `c_hash`. */
  code: string;
  /** `nonce` the RP put in the authorization request, from its cookie. */
  nonce: string;
  /** Issuer the RP is configured to trust. */
  issuer: string;
  /** This RP's `client_id`, expected as the token's audience. */
  clientId: string;
  /** Deterministic clock for tests. Defaults to the system clock. */
  now?: () => number;
}

/**
 * Verify an id_token against the OP's published keys and the RP's own
 * expectations, returning the claims on success.
 *
 * Throws {@link IdTokenVerifyError} carrying the axis that failed — signature,
 * claims, nonce, or hash chain. Callers treat any throw as "do not proceed";
 * the axis exists so an operator reading the rejection can tell a forged token
 * from a misconfigured OP.
 */
export function verifyCallbackIdToken(
  input: VerifyCallbackIdTokenInput,
): IdTokenClaims {
  const verifier = createJwksDocumentVerifier(
    input.jwks,
    ...(input.now === undefined ? [] : [input.now]),
  );
  return mustVerifyIdToken(verifier, input.idToken, {
    expectedIssuer: input.issuer,
    expectedAudience: input.clientId,
    expectedNonce: input.nonce,
    expectedAccessToken: input.accessToken,
    expectedCode: input.code,
  });
}

/**
 * Error thrown when the userinfo response describes a different subject than
 * the id_token did.
 */
export class UserinfoSubMismatchError extends Error {
  constructor(
    public readonly idTokenSub: string,
    public readonly userinfoSub: string,
  ) {
    super(
      `userinfo: sub "${userinfoSub}" does not match the verified id_token sub "${idTokenSub}"`,
    );
    this.name = 'UserinfoSubMismatchError';
  }
}

/**
 * Enforce OIDC Core §5.3.2 — the userinfo `sub` must equal the id_token `sub`.
 *
 * Verifying the id_token says nothing about the profile fetched with the
 * access_token: they are separate responses. Without this check, an
 * access_token bound to a different subject would seed the session with
 * someone else's profile while the id_token verification reported success.
 */
export function assertUserinfoSubMatches(
  userinfoSub: string,
  claims: IdTokenClaims,
): void {
  if (userinfoSub !== claims.sub) {
    throw new UserinfoSubMismatchError(claims.sub, userinfoSub);
  }
}

export { IdTokenVerifyError };
