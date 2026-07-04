/**
 * Refresh token rotation helper wrapper for the dogfood AS.
 *
 * RFC 9700 §2.2 mandates that every `/token` `grant_type=refresh_token`
 * exchange invalidate the previous refresh token and mint a fresh one.
 * The rotation is the primary defence against exfiltration — if a stolen
 * refresh token is used, the legitimate client's next call fails
 * (`invalid_grant`) because the token was already rotated, and the AS
 * tears down the whole token family (RFC 9700 §2.2.2).
 *
 * The `@kiwa-test/auth` package ships `rotateRefreshToken` +
 * `mintRefreshToken` at the primitive layer; this wrapper adds
 * dogfood-level classifier + guard helpers so Hono route handlers can
 * distinguish rotation-family compromise (`invalid_grant`) from a
 * generic unknown-token error (`invalid_grant`) uniformly across mock +
 * real drivers.
 *
 * Fidelity axes covered:
 *  1. rotation on use — every `/token` `grant_type=refresh_token`
 *     success invalidates the previous token and mints a new one.
 *     Assert by inspecting the AS's `listRefreshTokens()` snapshot
 *     (rotated tokens are marked `revoked: true`, active token has
 *     `rotationCount = previous + 1`).
 *  2. re-use detection — a call using the *previous* (already rotated)
 *     token fails with `invalid_grant` and tears down the family
 *     (classified by {@link classifyRefreshTokenError} as
 *     `refresh_token_reused`).
 *  3. expiry enforcement — a refresh token past its `expiresAt` fails
 *     with `invalid_grant` before the AS mints anything.
 *  4. binding preservation — the rotated token inherits `client_id`
 *     and DPoP `jkt` from the previous token (RFC 9449 §4.3 —
 *     rotation must preserve the sender-constrained binding).
 */

import {
  rotateRefreshToken as kiwaRotateRefreshToken,
  type RefreshToken,
} from '@kiwa-test/auth';

/**
 * Kind tag used by {@link RefreshRotationError} so route handlers can
 * map every rotation-family rejection reason onto a stable OAuth 2.1
 * error code (RFC 6749 §5.2 `invalid_grant` for all rotation failures).
 */
export type RefreshRotationRejectionKind =
  | 'unknown_refresh_token'
  | 'refresh_token_revoked'
  | 'refresh_token_expired'
  | 'refresh_token_reused'
  | 'client_id_mismatch'
  | 'dpop_binding_missing'
  | 'dpop_binding_mismatch'
  | 'scope_widened';

/**
 * Distinguished error the refresh rotation wrapper throws so route
 * handlers do not have to grep on the underlying kiwa AS error string.
 */
export class RefreshRotationError extends Error {
  readonly kind: RefreshRotationRejectionKind;
  constructor(kind: RefreshRotationRejectionKind, message: string) {
    super(message);
    this.name = 'RefreshRotationError';
    this.kind = kind;
  }
}

/**
 * Classify a kiwa AS rejection message from `token(...)` on the
 * refresh_token grant path into a {@link RefreshRotationRejectionKind}.
 * Route handlers call this before returning the OAuth error code so a
 * caller inspecting the error can tell reuse (family compromise) apart
 * from an unknown token.
 */
export function classifyRefreshTokenError(
  message: string,
): RefreshRotationRejectionKind | null {
  if (message.includes('has been rotated')) return 'refresh_token_reused';
  if (message.includes('unknown refresh_token')) return 'unknown_refresh_token';
  if (message.includes('refresh_token') && message.includes('revoked')) {
    return 'refresh_token_revoked';
  }
  if (message.includes('refresh_token') && message.includes('expired')) {
    return 'refresh_token_expired';
  }
  if (message.includes('client_id mismatch')) return 'client_id_mismatch';
  if (message.includes('refresh_token is DPoP-bound but no DPoP proof')) {
    return 'dpop_binding_missing';
  }
  if (message.includes('DPoP JWK thumbprint mismatch')) {
    return 'dpop_binding_mismatch';
  }
  if (message.includes('refresh scope') && message.includes('not in original grant')) {
    return 'scope_widened';
  }
  return null;
}

/**
 * Options accepted by {@link rotateAndMint}. Mirrors the kiwa
 * `rotateRefreshToken` signature but keeps the dogfood API surface
 * flat so callers do not have to import `@kiwa-test/auth` types.
 */
export interface RotateAndMintOptions {
  /** Refresh token being rotated. */
  previous: RefreshToken;
  /** Lifetime in seconds for the freshly-minted token. */
  lifetimeSec: number;
  /** Deterministic clock; the AS shares its clock with the wrapper. */
  now: () => number;
  /** Optional scope narrowing (RFC 6749 §6). Widening is refused. */
  scope?: string;
  /** JWK thumbprint the new token should be bound to. */
  dpopJkt?: string;
  /** Resource indicator inherited from the previous token. */
  resource?: string;
}

/**
 * Rotate a refresh token — invalidate the previous, mint a new one that
 * inherits the client + subject + scope + DPoP binding + resource.
 * Wraps {@link kiwaRotateRefreshToken} and normalises the failure
 * surface so any AS-level rejection surfaces as a
 * {@link RefreshRotationError}.
 *
 * Note — the AS itself performs the rotation inside `handleRefreshToken`.
 * This wrapper is exposed for tests + follow-up Sub-Issues that want to
 * simulate a rotation without invoking the full `/token` handler.
 */
export function rotateAndMint(opts: RotateAndMintOptions): RefreshToken {
  try {
    const overrides: {
      scope?: string;
      dpopJkt?: string;
      resource?: string;
    } = {};
    if (opts.scope !== undefined) overrides.scope = opts.scope;
    if (opts.dpopJkt !== undefined) overrides.dpopJkt = opts.dpopJkt;
    if (opts.resource !== undefined) overrides.resource = opts.resource;
    return kiwaRotateRefreshToken(
      opts.previous,
      opts.lifetimeSec,
      opts.now,
      overrides,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('already revoked')) {
      throw new RefreshRotationError('refresh_token_revoked', message);
    }
    throw err;
  }
}

/**
 * Re-export the `RefreshToken` type so callers depending on the dogfood
 * refresh-rotation module do not have to reach into `@kiwa-test/auth`.
 */
export type { RefreshToken };
