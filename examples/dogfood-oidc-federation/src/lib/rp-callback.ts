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

/**
 * Outcome of the callback exchange. `status` is the HTTP status the route
 * returns; `message` becomes the `statusMessage`.
 *
 * Returning a value rather than throwing an HTTP error keeps this module free
 * of the Nitro helpers, which is what lets a test run it.
 */
export type CallbackOutcome<TUserinfo extends UserinfoLike = UserinfoLike> =
  | { ok: true; userinfo: TUserinfo; claims: IdTokenClaims }
  | { ok: false; status: number; message: string };

/**
 * The only field of a userinfo response the callback reasons about. The route
 * keeps its own richer type; this module stays generic over it so narrowing
 * the response shape here does not erase the caller's fields.
 */
export interface UserinfoLike {
  sub: string;
}

/** Token endpoint response fields the callback consumes. */
export interface TokenResponseLike {
  access_token: string;
  id_token: string;
}

/**
 * Everything the callback needs that it cannot compute itself. The network
 * calls are injected so a test can drive each failure without a live OP, the
 * same way `runCli` takes its `spawn`.
 */
export interface RunCallbackDeps<TUserinfo extends UserinfoLike = UserinfoLike> {
  fetchJwks: () => Promise<JwksDocument>;
  exchangeCode: () => Promise<TokenResponseLike>;
  fetchUserinfo: (accessToken: string) => Promise<TUserinfo>;
  now?: () => number;
}

/** Request-derived and cookie-derived values, already read by the route. */
export interface RunCallbackInput {
  code: string;
  state: string;
  cookieState: string | undefined;
  cookieNonce: string | undefined;
  cookieVerifier: string | undefined;
  issuer: string;
  clientId: string;
}

/**
 * Run the callback exchange and decide what the route should answer.
 *
 * The order matters and is asserted by the tests: the CSRF gate precedes the
 * token exchange, verification precedes the userinfo fetch, and a failed
 * verification stops before anything is stored. A caller that skipped a step
 * would still compile, so the sequence is pinned by execution rather than by
 * review.
 */
export async function runCallback<TUserinfo extends UserinfoLike>(
  input: RunCallbackInput,
  deps: RunCallbackDeps<TUserinfo>,
): Promise<CallbackOutcome<TUserinfo>> {
  if (typeof input.code !== 'string' || typeof input.state !== 'string') {
    return { ok: false, status: 400, message: 'callback body missing code or state' };
  }
  if (input.cookieState === undefined || input.cookieState !== input.state) {
    return { ok: false, status: 400, message: 'state mismatch (CSRF gate)' };
  }
  if (input.cookieVerifier === undefined) {
    return { ok: false, status: 400, message: 'code_verifier cookie missing' };
  }
  if (input.cookieNonce === undefined) {
    return { ok: false, status: 400, message: 'nonce cookie missing' };
  }

  const tokenResponse = await deps.exchangeCode();

  let jwks: JwksDocument;
  try {
    jwks = await deps.fetchJwks();
  } catch {
    // No keys means no way to tell a genuine id_token from a forged one.
    // Skipping verification here would hand an attacker the whole exchange.
    return { ok: false, status: 401, message: 'id_token rejected: JWKS unavailable' };
  }

  let claims: IdTokenClaims;
  try {
    claims = verifyCallbackIdToken({
      jwks,
      idToken: tokenResponse.id_token,
      accessToken: tokenResponse.access_token,
      code: input.code,
      nonce: input.cookieNonce,
      issuer: input.issuer,
      clientId: input.clientId,
      ...(deps.now === undefined ? {} : { now: deps.now }),
    });
  } catch (err) {
    // The axis goes in the message because an operator reading a 401 needs to
    // tell a misconfigured OP (claims / nonce) from a forged token.
    const issue = err instanceof IdTokenVerifyError ? err.issue : undefined;
    return {
      ok: false,
      status: 401,
      message:
        issue === undefined
          ? 'id_token rejected'
          : `id_token rejected: ${issue.axis} — ${issue.reason}`,
    };
  }

  const userinfo = await deps.fetchUserinfo(tokenResponse.access_token);

  try {
    assertUserinfoSubMatches(userinfo.sub, claims);
  } catch (err) {
    return {
      ok: false,
      status: 401,
      message:
        err instanceof UserinfoSubMismatchError ? err.message : 'userinfo sub check failed',
    };
  }

  return { ok: true, userinfo, claims };
}
