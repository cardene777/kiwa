/**
 * `/revoke` route handler shell.
 *
 * RFC 7009 §2.2 mandates revocation is idempotent — the handler swallows
 * the AS's rejection for unknown / already-revoked tokens so the client
 * always sees 200 (empty body). The Hono wrapper in
 * `src/lib/hono-app.ts` translates this delegate's void return into a
 * 200 response.
 *
 * Sub-Issue v1.21-3d (`revocation-fidelity-release-gate`) extends the
 * handler to invoke {@link cascadeRevoke} when the caller supplies the
 * underlying AS handle. Cascade tears down every access + active refresh
 * token in the `(clientId, subject)` family so a compromised token
 * cannot ripple into follow-up refreshes (RFC 9700 §2.2.2). Legacy
 * callers that pass only the {@link OAuth21ASAdapter} still get RFC 7009
 * idempotent single-token revocation.
 */

import type { AuthorizationServer } from '@kiwa-lab/auth';
import type { OAuth21ASAdapter } from '../../adapters/interface.js';
import {
  cascadeRevoke,
  type CascadeRevocationReport,
} from '../../lib/revocation-cascade.js';

export interface RevokeHandlerInput {
  token: string;
  clientId: string;
}

/**
 * Legacy handler — RFC 7009 single-token revocation. Used when the caller
 * has only the adapter surface (no direct AS handle for family lookup).
 */
export function createRevokeHandler(
  adapter: OAuth21ASAdapter,
): (input: RevokeHandlerInput) => void {
  return function revoke(input: RevokeHandlerInput): void {
    try {
      adapter.revoke(input.token, input.clientId);
    } catch {
      // RFC 7009 §2.2 — revocation is idempotent, swallow errors.
    }
  };
}

/**
 * Cascade handler — RFC 9700 §2.2.2 family teardown. Requires a direct AS
 * handle so the wrapper can iterate the access + refresh token registries
 * to fan out the revocation. Returns the cascade report so tracing
 * callers can observe fan-out size without inspecting the registry
 * themselves.
 */
export function createCascadeRevokeHandler(
  as: AuthorizationServer,
): (input: RevokeHandlerInput) => CascadeRevocationReport {
  return function revoke(
    input: RevokeHandlerInput,
  ): CascadeRevocationReport {
    try {
      return cascadeRevoke(as, input.token, input.clientId);
    } catch {
      // RFC 7009 §2.2 — cross-client / unknown attempts surface silently
      // as an empty report. The AS state stays unchanged.
      return {
        accessTokensRevoked: 0,
        refreshTokensRevoked: 0,
        family: null,
      };
    }
  };
}
