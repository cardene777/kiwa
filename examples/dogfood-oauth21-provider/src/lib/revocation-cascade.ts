/**
 * Revocation cascade helper for the dogfood AS (Sub-Issue v1.21-3d — #867).
 *
 * RFC 7009 §2 defines `/revoke` as a per-token operation, but RFC 9700
 * §2.2.2 requires that any signal of compromise (e.g. reuse of a rotated
 * refresh_token) tear down the entire token family — every access + refresh
 * token derived from the same original grant. `/revoke` on a client-side
 * initiated cascade is the RP-visible entry point for that teardown:
 * revoking any single token (access or refresh) invalidates every sibling
 * minted from the same `(clientId, subject)` pair.
 *
 * Design notes:
 *  - The kiwa AS `revoke(token, clientId)` primitive only handles the single
 *    token passed in; it does not cascade because the underlying storage has
 *    no explicit grant family id. This wrapper reconstructs the family by
 *    filtering `listAccessTokens()` + `listRefreshTokens()` on the
 *    `(clientId, subject)` pair of the target token.
 *  - Cascade scope is `(clientId, subject)` rather than `(clientId, subject,
 *    scope)` on purpose — RFC 9700 §2.2.2 mandates full family teardown when
 *    compromise is suspected, and a legitimate client can always re-obtain a
 *    narrower grant afterwards. Narrowing the scope filter would leave a
 *    scoped subset alive, defeating the point of the cascade.
 *  - The wrapper is idempotent per RFC 7009 §2.2 — revoking a token that
 *    does not exist swallows silently; revoking a token that is already
 *    revoked is a no-op that still walks the family so any lingering
 *    siblings are cleaned up (defence in depth against partial cascades on
 *    earlier failures).
 *  - Cascade delegates directly to the AS handle, bypassing the adapter
 *    trace. Tests observe cascade fan-out through the AS state
 *    (`listAccessTokens()` + `listRefreshTokens()`) or the
 *    {@link CascadeRevocationReport} return value — not through the
 *    adapter's trace buffer. This keeps cascade a pure AS-state operation
 *    so a caller can drive it outside the Hono route as well.
 */

import type { AuthorizationServer } from '@kiwa-lab/auth';

/**
 * Report emitted by {@link cascadeRevoke} describing the effect of a
 * cascade. Tests assert on this shape to prove cascade fan-out without
 * having to grep the token registry manually.
 */
export interface CascadeRevocationReport {
  /** Number of access tokens revoked (deleted from the active registry). */
  accessTokensRevoked: number;
  /** Number of active refresh tokens revoked (marked `revoked: true`). */
  refreshTokensRevoked: number;
  /**
   * `(clientId, subject)` identity of the revoked family. `null` when the
   * target token was unknown — the caller sees a silent 200 per RFC 7009.
   */
  family: { clientId: string; subject: string } | null;
}

/**
 * Locate the `(clientId, subject)` identity of the token being revoked so
 * the cascade knows which family to tear down. Returns `null` when the
 * token is unknown (RFC 7009 §2.2 silent-success path).
 *
 * Both access + refresh registries are consulted; either token type can be
 * the entry point for a cascade. Rotated (already-revoked) refresh tokens
 * are also inspected — an attacker replaying a rotated token still triggers
 * cascade of any surviving family members that a partial earlier teardown
 * may have missed.
 */
export function locateGrantFamily(
  as: AuthorizationServer,
  token: string,
): { clientId: string; subject: string } | null {
  const access = as
    .listAccessTokens()
    .find((entry) => entry.token === token);
  if (access) {
    return { clientId: access.clientId, subject: access.subject };
  }
  const refresh = as
    .listRefreshTokens()
    .find((entry) => entry.token === token);
  if (refresh) {
    return { clientId: refresh.clientId, subject: refresh.subject };
  }
  return null;
}

/**
 * Cascade revocation. Given a single token, revoke every access + active
 * refresh token minted for the same `(clientId, subject)` pair. Returns a
 * {@link CascadeRevocationReport} the caller uses to log / trace the
 * fan-out.
 *
 * The wrapper delegates the actual token-level revocation to the AS's own
 * `revoke(token, clientId)` primitive so the AS state machine stays in
 * charge of the write. This preserves RFC 7009 §2.2 idempotency and
 * ensures `/introspect` picks up the revoked state through the AS's
 * existing lookup.
 *
 * @param as underlying kiwa AS handle
 * @param token token presented at `/revoke`
 * @param clientId client credential submitted with the revoke call
 */
export function cascadeRevoke(
  as: AuthorizationServer,
  token: string,
  clientId: string,
): CascadeRevocationReport {
  const family = locateGrantFamily(as, token);
  if (!family) {
    // Unknown token — RFC 7009 §2.2 silent success. No cascade to fan out.
    return { accessTokensRevoked: 0, refreshTokensRevoked: 0, family: null };
  }
  // Cross-client attempt — surface the underlying AS rejection so the
  // client sees `error=invalid_request` per RFC 7009 §2.1.
  if (family.clientId !== clientId) {
    as.revoke(token, clientId);
    // Unreachable — the AS throws before we get here — but the compiler
    // requires a return so we surface an empty report for typing.
    return { accessTokensRevoked: 0, refreshTokensRevoked: 0, family: null };
  }

  let accessRevoked = 0;
  let refreshRevoked = 0;

  // 1. Revoke every active access token in the family. The AS `revoke`
  //    primitive deletes it from the active map; a re-lookup returns
  //    `active: false` through `/introspect`.
  const accessTokens = as
    .listAccessTokens()
    .filter(
      (entry) =>
        entry.clientId === family.clientId &&
        entry.subject === family.subject,
    );
  for (const entry of accessTokens) {
    as.revoke(entry.token, family.clientId);
    accessRevoked += 1;
  }

  // 2. Revoke every active refresh token in the family. `listRefreshTokens`
  //    returns rotated + revoked entries too; we only revoke the ones that
  //    are still active (`revoked: false`). Rotated / already-revoked
  //    tokens are left untouched — they are already unusable and revoking
  //    them again is a no-op inside the AS.
  const refreshTokens = as
    .listRefreshTokens()
    .filter(
      (entry) =>
        entry.clientId === family.clientId &&
        entry.subject === family.subject &&
        entry.revoked === false,
    );
  for (const entry of refreshTokens) {
    as.revoke(entry.token, family.clientId);
    refreshRevoked += 1;
  }

  return {
    accessTokensRevoked: accessRevoked,
    refreshTokensRevoked: refreshRevoked,
    family,
  };
}
