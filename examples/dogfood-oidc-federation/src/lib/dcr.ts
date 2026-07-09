/**
 * DCR registration handler — RFC 7591 Dynamic Client Registration for the
 * dogfood OP. The handler sits between the Hono `/register` route + the
 * underlying `@kiwa-lab/auth` `dynamicClientRegistration` helper so the
 * dogfood app can layer RFC-7591-specific behaviour that the shared kiwa
 * library does not carry:
 *   - three RFC 7591 client authentication methods —
 *     `client_secret_basic`, `client_secret_post`, and a JWT-based method
 *     tagged `pk_jwt` in the mock (RFC 7523 §2.2 style). The JWT-based
 *     method requires a JWKS source (`jwks_uri` or inline `jwks`) so the
 *     OP has a public key to verify future client authentication assertions.
 *   - explicit OAuth 2.1 dropped-grant refusal (implicit / password /
 *     client_credentials) — the underlying library already refuses these,
 *     but the wrapper produces a stable `errorKind` so downstream tests can
 *     pin the refusal without regexing the underlying error message.
 *   - `software_statement` JWS signature verification via the shared trust
 *     anchor. Verified statements produce a `verified` trace annotation
 *     that Sub-Issues layered on top consume to fold claims onto the
 *     registration.
 *   - `redirect_uris` presence + URL validation — hard-fails on missing /
 *     empty / non-URL entries per RFC 7591 §2.
 *
 * The wrapper never touches the underlying kiwa surface directly; it drives
 * the adapter injected by the OP so the Hono handler stays framework-neutral
 * + the fidelity harness can compare mock vs real behaviour uniformly.
 */

import type {
  ClientRegistrationRequest,
  ClientRegistrationResponse,
} from '@kiwa-lab/auth';

/**
 * Auth methods the dogfood DCR handler advertises. The underlying kiwa
 * library allows `client_secret_basic`, `client_secret_post`, and `none`
 * — the dogfood layer replaces `none` with `pk_jwt` (JWT-based client auth
 * per RFC 7523) to model the Federation trust chain requirement that
 * production RPs authenticate with an asymmetric key rather than a shared
 * secret.
 */
export type DogfoodAuthMethod =
  | 'client_secret_basic'
  | 'client_secret_post'
  | 'pk_jwt';

const ALLOWED_AUTH_METHODS = new Set<DogfoodAuthMethod>([
  'client_secret_basic',
  'client_secret_post',
  'pk_jwt',
]);

/**
 * OAuth 2.1 dropped grants. The dogfood layer refuses these before
 * delegating to the underlying kiwa registration so the failure surface
 * carries a stable `dropped_grant_type` errorKind rather than the generic
 * `unsupported_grant_type` the shared library emits.
 */
const DROPPED_GRANT_TYPES = new Set(['implicit', 'password', 'client_credentials']);

/**
 * Extended registration request accepted by the dogfood DCR handler.
 * Extends the RFC 7591 core shape with a JWKS source pair — the RP
 * publishes its public key at `jwks_uri` (recommended) or inlines the JWKS
 * document via `jwks`. The pair is mandatory when
 * `token_endpoint_auth_method` is `pk_jwt`.
 */
export interface ExtendedClientRegistrationRequest
  extends ClientRegistrationRequest {
  jwks_uri?: string;
  jwks?: { keys: readonly Record<string, unknown>[] };
}

/**
 * Extended registration response returned by the dogfood DCR handler.
 * Echoes back `jwks_uri` when the client authenticated via `pk_jwt`, so
 * downstream RP integrations can inspect the registered surface.
 */
export interface ExtendedClientRegistrationResponse
  extends ClientRegistrationResponse {
  jwks_uri?: string;
}

/**
 * Trace annotation the DCR handler emits so downstream tests can pin the
 * refusal surface + softwareStatement handling without parsing the underlying
 * exception. Kept as a plain record — the trace event on the adapter
 * carries this in its `detail` field.
 */
export interface DcrTraceDetail {
  auth_method?: DogfoodAuthMethod;
  software_statement?: 'verified' | 'refused';
  errorKind?: string;
}

/**
 * Result of `handleRegistration`. `ok=false` carries a `detail.errorKind`
 * so callers can wire error surfaces without matching regex against the
 * thrown message.
 */
export type HandleRegistrationResult =
  | {
      ok: true;
      response: ExtendedClientRegistrationResponse;
      detail: DcrTraceDetail;
    }
  | {
      ok: false;
      error: Error;
      detail: DcrTraceDetail;
    };

/**
 * Delegate signature — the mock adapter injects a bound
 * `env.registerClient` here so the handler stays adapter-agnostic. The
 * delegate is expected to run the RFC 7591 §2 core validation + persistence
 * for `client_secret_basic` / `client_secret_post` clients; the wrapper
 * layers the extra checks around it.
 */
export type UnderlyingRegisterDelegate = (
  request: ClientRegistrationRequest,
) => ClientRegistrationResponse;

/**
 * Validate the `redirect_uris` field. RFC 7591 §2 requires a non-empty
 * array of URLs. The wrapper duplicates the underlying library check so it
 * can attach a stable `errorKind` and surface the failure through the trace
 * detail without scraping the underlying exception.
 */
function validateRedirectUris(request: ExtendedClientRegistrationRequest): void {
  if (
    !Array.isArray(request.redirect_uris) ||
    request.redirect_uris.length === 0
  ) {
    throw new Error(
      'dcr-flow: `redirect_uris` must be a non-empty array (RFC 7591 §2)',
    );
  }
  for (const uri of request.redirect_uris) {
    if (typeof uri !== 'string' || uri.length === 0) {
      throw new Error(
        `dcr-flow: every redirect_uri must be a non-empty string (got "${uri}")`,
      );
    }
    try {
      new URL(uri);
    } catch {
      throw new Error(
        `dcr-flow: redirect_uri "${uri}" is not a valid URL`,
      );
    }
  }
}

/**
 * Validate the token_endpoint_auth_method against the dogfood allowlist. The
 * underlying kiwa library refuses methods not on its own allowlist; the
 * wrapper narrows further so the `pk_jwt` extension is opt-in + the trace
 * carries the requested method for downstream fidelity comparison.
 */
function validateAuthMethod(request: ExtendedClientRegistrationRequest): DogfoodAuthMethod {
  const method = (request.token_endpoint_auth_method ??
    'client_secret_basic') as DogfoodAuthMethod;
  if (!ALLOWED_AUTH_METHODS.has(method)) {
    throw new Error(
      `dcr-flow: token_endpoint_auth_method "${method}" refused — allowed methods are ${[...ALLOWED_AUTH_METHODS].join(', ')}`,
    );
  }
  return method;
}

/**
 * Validate the `grant_types` array against the OAuth 2.1 dropped-grant
 * blocklist. When any dropped grant is requested the wrapper throws with a
 * stable `errorKind=dropped_grant_type` on the trace detail; the underlying
 * library also refuses the same grants but with a different message shape.
 */
function validateDroppedGrants(request: ExtendedClientRegistrationRequest): void {
  const grants = request.grant_types;
  if (grants === undefined) {
    return;
  }
  for (const grant of grants) {
    if (DROPPED_GRANT_TYPES.has(grant)) {
      throw new Error(
        `dcr-flow: grant_type "${grant}" refused — OAuth 2.1 dropped grants (${[...DROPPED_GRANT_TYPES].join(', ')}) cannot be registered`,
      );
    }
  }
}

/**
 * Validate the JWKS source when `pk_jwt` is requested. RFC 7591 §2 requires
 * `jwks_uri` or inline `jwks` for JWT-based client authentication so the OP
 * has a public key to verify future client assertions.
 */
function validateJwksSourceForJwtAuth(
  method: DogfoodAuthMethod,
  request: ExtendedClientRegistrationRequest,
): void {
  if (method !== 'pk_jwt') {
    return;
  }
  const hasJwksUri = typeof request.jwks_uri === 'string' && request.jwks_uri.length > 0;
  const hasInlineJwks =
    request.jwks !== undefined &&
    Array.isArray(request.jwks.keys) &&
    request.jwks.keys.length > 0;
  if (!hasJwksUri && !hasInlineJwks) {
    throw new Error(
      'dcr-flow: pk_jwt requires jwks_uri or inline jwks (RFC 7591 §2 mandatory JWKS source for JWT-based client auth)',
    );
  }
  if (hasJwksUri) {
    try {
      new URL(request.jwks_uri!);
    } catch {
      throw new Error(
        `dcr-flow: jwks_uri "${request.jwks_uri}" is not a valid URL`,
      );
    }
  }
}

/**
 * Handle a DCR registration request. Runs the wrapper checks in order:
 *   1. `redirect_uris` presence + URL validation.
 *   2. `token_endpoint_auth_method` allowlist.
 *   3. `grant_types` dropped-grant blocklist.
 *   4. JWKS source for `pk_jwt`.
 *   5. Delegate to the underlying kiwa registration handler.
 *
 * `pk_jwt` is translated to `none` before delegation so the underlying
 * library recognises it as a public client (no `client_secret` minted). The
 * wrapper echoes back `pk_jwt` on the response so callers see the
 * requested method verbatim.
 *
 * Successful `software_statement` verification (via the underlying library)
 * is annotated as `verified` on the returned detail so downstream tests can
 * pin the acceptance surface without inspecting the underlying trace.
 */
export function handleRegistration(
  delegate: UnderlyingRegisterDelegate,
  request: ExtendedClientRegistrationRequest,
): HandleRegistrationResult {
  const detail: DcrTraceDetail = {};
  try {
    validateRedirectUris(request);
    const method = validateAuthMethod(request);
    detail.auth_method = method;
    validateDroppedGrants(request);
    validateJwksSourceForJwtAuth(method, request);

    // pk_jwt maps to `none` on the underlying kiwa library so the client is
    // stored as public (no client_secret). The response echoes back
    // `pk_jwt` so callers observe the dogfood method verbatim.
    const underlyingMethod = method === 'pk_jwt' ? 'none' : method;
    const underlyingRequest: ClientRegistrationRequest = {
      ...request,
      token_endpoint_auth_method: underlyingMethod,
    };
    const underlyingResponse = delegate(underlyingRequest);

    if (request.software_statement !== undefined) {
      // The underlying library refuses on signature failure — reaching this
      // branch with a software_statement present means verification passed.
      detail.software_statement = 'verified';
    }

    const response: ExtendedClientRegistrationResponse = {
      ...underlyingResponse,
      token_endpoint_auth_method: method,
      ...(request.jwks_uri === undefined ? {} : { jwks_uri: request.jwks_uri }),
    };
    return { ok: true, response, detail };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    detail.errorKind = classifyDcrError(message);
    if (request.software_statement !== undefined && detail.errorKind === 'invalid_software_statement') {
      detail.software_statement = 'refused';
    }
    return { ok: false, error: err instanceof Error ? err : new Error(message), detail };
  }
}

/**
 * Classify a DCR-layer error into a stable errorKind. Downstream tests pin
 * on these strings so the wrapper's failure surface stays observable
 * without regexing the underlying exception message.
 */
function classifyDcrError(message: string): string {
  if (/redirect_uris?/.test(message)) return 'invalid_redirect_uris';
  if (message.includes('jwks_uri') || message.includes('pk_jwt requires jwks')) {
    return 'invalid_jwks_source';
  }
  if (message.includes('token_endpoint_auth_method')) return 'unsupported_auth_method';
  if (message.includes('software_statement')) return 'invalid_software_statement';
  if (message.includes('grant_type')) {
    // Both dropped grants (dcr-flow layer) and unsupported grants
    // (underlying library) share this errorKind; the trace detail
    // distinguishes via `auth_method` presence.
    return message.includes('dropped')
      ? 'dropped_grant_type'
      : 'unsupported_grant_type';
  }
  if (message.includes('response_type')) return 'unsupported_response_type';
  return 'unknown_error';
}
