/**
 * `/authorize` route handler shell.
 *
 * The full Hono wiring lives in `src/lib/hono-app.ts` so a single fetch
 * -shaped invoker can drive the AS end-to-end. This module exports the
 * pure delegate a caller would invoke without HTTP plumbing so the
 * fidelity harness can compare mock vs real without booting either
 * runtime.
 *
 * Sub-Issue v1.21-3b (`pkce-flow`) grows this to include the PKCE
 * challenge storage + verifier check hand-off. Sub-Issue v1.21-3a (this
 * file) exposes the delegate contract so downstream tests do not have to
 * re-wire when the PKCE logic lands.
 */

import type {
  AuthorizationRequest,
  AuthorizationResponse,
} from '@kiwa-test/auth';
import type { OAuth21ASAdapter } from '../../adapters/interface.js';

export interface AuthorizeHandlerInput {
  request: AuthorizationRequest;
  subject: string;
}

export function createAuthorizeHandler(
  adapter: OAuth21ASAdapter,
): (input: AuthorizeHandlerInput) => AuthorizationResponse {
  return function authorize(input: AuthorizeHandlerInput): AuthorizationResponse {
    return adapter.authorize(input.request, input.subject);
  };
}
