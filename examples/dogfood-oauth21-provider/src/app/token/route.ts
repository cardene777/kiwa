/**
 * `/token` route handler shell.
 *
 * Delegates straight to the adapter — the Hono wrapper in
 * `src/lib/hono-app.ts` translates form-urlencoded / JSON bodies into
 * the shared {@link TokenRequest} shape before invoking this delegate.
 *
 * Sub-Issue v1.21-3b (`pkce-flow`) grows this to include the PKCE
 * verifier check (already handled by the kiwa AS but wrapped here for
 * trace consistency). Sub-Issue v1.21-3c (`dpop-refresh-rotation`)
 * grows this to include DPoP proof binding + refresh rotation.
 */

import type { TokenRequest, TokenResponse } from '@kiwa-test/auth';
import type { OAuth21ASAdapter } from '../../adapters/interface.js';

export function createTokenHandler(
  adapter: OAuth21ASAdapter,
): (request: TokenRequest) => TokenResponse {
  return function token(request: TokenRequest): TokenResponse {
    return adapter.token(request);
  };
}
