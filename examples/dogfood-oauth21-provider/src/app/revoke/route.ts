/**
 * `/revoke` route handler shell.
 *
 * RFC 7009 §2.2 mandates revocation is idempotent — the handler swallows
 * the AS's rejection for unknown / already-revoked tokens so the client
 * always sees 200 (empty body). The Hono wrapper in
 * `src/lib/hono-app.ts` translates this delegate's void return into a
 * 200 response.
 *
 * Sub-Issue v1.21-3d (`revocation-fidelity-release-gate`) grows this
 * to include cascade logic (revoking an access_token invalidates the
 * whole refresh token family).
 */

import type { OAuth21ASAdapter } from '../../adapters/interface.js';

export interface RevokeHandlerInput {
  token: string;
  clientId: string;
}

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
