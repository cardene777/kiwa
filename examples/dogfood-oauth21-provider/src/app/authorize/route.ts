/**
 * `/authorize` route handler shell.
 *
 * The full Hono wiring lives in `src/lib/hono-app.ts` so a single fetch
 * -shaped invoker can drive the AS end-to-end. This module exports the
 * pure delegate a caller would invoke without HTTP plumbing so the
 * fidelity harness can compare mock vs real without booting either
 * runtime.
 *
 * Sub-Issue v1.21-3b (`pkce-flow`) grew this to enforce PKCE method +
 * challenge presence at the handler layer. The kiwa AS re-enforces the
 * same rules, but running them here first keeps the error kinds stable
 * regardless of which adapter is bound (mock validates through kiwa's
 * error strings, real via oauth2-mock-server's status codes).
 */

import type {
  AuthorizationRequest,
  AuthorizationResponse,
} from '@kiwa-test/auth';
import type { OAuth21ASAdapter } from '../../adapters/interface.js';
import { assertMethodAllowed, PkceValidationError } from '../../lib/pkce.js';

export interface AuthorizeHandlerInput {
  request: AuthorizationRequest;
  subject: string;
}

/**
 * Pre-flight PKCE guard against the client-supplied query values (before
 * an {@link AuthorizationRequest} is built). Rejects any request that
 * would let a client fall back to `plain`, omit the method (OAuth 2.1
 * forbids the RFC 7636 `plain` default) or omit the challenge outright.
 *
 * Running the guard on the raw query values means the Hono handler can
 * build a narrowly-typed {@link AuthorizationRequest} once the guard
 * succeeds — the method is proven to be `S256` at that point.
 */
export function assertAuthorizeQueryPkce(input: {
  codeChallenge: string | undefined;
  codeChallengeMethod: string | undefined;
}): void {
  if (!input.codeChallenge || input.codeChallenge === '') {
    throw new PkceValidationError(
      'method_missing_refused',
      'PKCE code_challenge missing — RFC 9700 §2.1 mandates PKCE for every authorization request',
    );
  }
  assertMethodAllowed(input.codeChallengeMethod);
}

/**
 * Pre-flight PKCE guard for a fully-built {@link AuthorizationRequest}
 * — used by the framework-agnostic {@link createAuthorizeHandler}
 * delegate. Delegates to {@link assertAuthorizeQueryPkce} so both entry
 * points enforce the same rules.
 */
export function assertAuthorizePkce(request: AuthorizationRequest): void {
  assertAuthorizeQueryPkce({
    codeChallenge: request.codeChallenge,
    codeChallengeMethod: request.codeChallengeMethod,
  });
}

export function createAuthorizeHandler(
  adapter: OAuth21ASAdapter,
): (input: AuthorizeHandlerInput) => AuthorizationResponse {
  return function authorize(input: AuthorizeHandlerInput): AuthorizationResponse {
    assertAuthorizePkce(input.request);
    return adapter.authorize(input.request, input.subject);
  };
}
