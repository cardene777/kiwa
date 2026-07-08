/**
 * `/token` route handler shell.
 *
 * Delegates to the adapter — the Hono wrapper in `src/lib/hono-app.ts`
 * translates form-urlencoded / JSON bodies into the shared
 * {@link TokenRequest} shape before invoking this delegate.
 *
 * Sub-Issue v1.21-3b (`pkce-flow`) grew this to enforce that every
 * `authorization_code` exchange carries a verifier — the format check
 * runs before the adapter is called so a malformed verifier is refused
 * with a distinguished {@link PkceValidationError} kind rather than the
 * generic `invalid_grant` the kiwa AS would emit downstream. The
 * cryptographic match check stays inside the kiwa AS because it also
 * owns the recorded challenge.
 *
 * Sub-Issue v1.21-3c (`dpop-refresh-rotation`) will grow this again to
 * include DPoP proof binding + refresh rotation guards at this layer.
 */

import type { TokenRequest, TokenResponse } from '@kiwa/auth';
import type { OAuth21ASAdapter } from '../../adapters/interface.js';
import { assertVerifierFormat, PkceValidationError } from '../../lib/pkce.js';

/**
 * Pre-flight guard for the `authorization_code` grant path. Rejects
 * malformed verifiers (wrong length / illegal characters) before the
 * adapter is invoked so tests can distinguish a client bug (verifier
 * format wrong) from a spoofed exchange (verifier does not match the
 * recorded challenge).
 *
 * For `refresh_token` the guard is a no-op — refresh does not carry a
 * verifier.
 */
export function assertTokenPkce(request: TokenRequest): void {
  if (request.grantType !== 'authorization_code') return;
  if (!request.codeVerifier || request.codeVerifier === '') {
    throw new PkceValidationError(
      'method_missing_refused',
      'PKCE code_verifier missing — RFC 7636 §4.5 mandates it for authorization_code exchange',
    );
  }
  assertVerifierFormat(request.codeVerifier);
}

export function createTokenHandler(
  adapter: OAuth21ASAdapter,
): (request: TokenRequest) => TokenResponse {
  return function token(request: TokenRequest): TokenResponse {
    assertTokenPkce(request);
    return adapter.token(request);
  };
}
