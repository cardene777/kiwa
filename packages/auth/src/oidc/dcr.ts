import { createHash, randomBytes } from 'node:crypto';
import type { AuthorizationServer } from '../oauth21/types.js';
import type {
  ClientRegistrationRequest,
  ClientRegistrationResponse,
} from './types.js';

/**
 * Module-scoped monotonic counter so registered client_ids are reproducible.
 * `client-001`, `client-002`, ... — matches the id style of PKCE verifiers +
 * JWKS kids so grepping test output stays consistent.
 */
let clientIdCounter = 0;

/**
 * Reset the client_id counter. Called by `setupOidcEnv` when preparing a
 * fresh env so repeated env constructions produce identical output.
 */
export function __resetDcrCounter(): void {
  clientIdCounter = 0;
}

/**
 * OAuth 2.1 grant types the mock allows on registration. The historical
 * grants that OAuth 2.1 dropped (`implicit`, `password`, `client_credentials`)
 * are refused here so registrations that would create clients using dropped
 * grants trip at registration time.
 */
const ALLOWED_GRANT_TYPES = new Set([
  'authorization_code',
  'refresh_token',
]);

/**
 * OIDC response types the mock allows. Discovery advertises `code` only, so
 * DCR mirrors that.
 */
const ALLOWED_RESPONSE_TYPES = new Set(['code']);

/**
 * Token endpoint auth methods the mock allows. Matches the Discovery
 * advertisement.
 */
const ALLOWED_AUTH_METHODS = new Set([
  'client_secret_basic',
  'client_secret_post',
  'none',
]);

/**
 * Base64url-decode a string. Used to parse the mock software_statement JWT
 * for its payload claims.
 */
function base64UrlDecode(input: string): string {
  const pad = 4 - (input.length % 4);
  const padded = input + (pad === 4 ? '' : '='.repeat(pad));
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
    'utf-8',
  );
}

/**
 * Base64url-encode a `Buffer`.
 */
function base64UrlEncode(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Parsed software_statement JWT. The mock does not implement full JWS crypto
 * — the signature is a deterministic SHA-256 of `header.payload` +
 * `trustAnchor` string. Callers wanting to test signature verification pass
 * a matching / mismatching `trustAnchor` on registration.
 */
interface ParsedSoftwareStatement {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

/**
 * Parse a compact-serialized software_statement JWT. Refuses on malformed
 * shape.
 */
function parseSoftwareStatement(jwt: string): ParsedSoftwareStatement {
  const parts = jwt.split('.');
  if (parts.length !== 3) {
    throw new Error(
      `software_statement: expected 3 dot-separated segments, got ${parts.length}`,
    );
  }
  // `parts.length === 3` guarantees every index defined; assert to satisfy
  // `noUncheckedIndexedAccess`.
  const headerB64 = parts[0] as string;
  const payloadB64 = parts[1] as string;
  const signature = parts[2] as string;
  const header = JSON.parse(base64UrlDecode(headerB64)) as Record<string, unknown>;
  const payload = JSON.parse(base64UrlDecode(payloadB64)) as Record<string, unknown>;
  return { header, payload, signature };
}

/**
 * Compute the deterministic mock signature for a software_statement JWT. The
 * mock uses SHA-256(`header.payload.trustAnchor`) truncated to 32 base64url
 * chars — matches the shape a real HS256 signature would produce but skips
 * the HMAC key negotiation.
 */
function computeSoftwareStatementSignature(
  header: string,
  payload: string,
  trustAnchor: string,
): string {
  const digest = createHash('sha256')
    .update(`${header}.${payload}.${trustAnchor}`)
    .digest();
  return base64UrlEncode(digest);
}

/**
 * Mint a software_statement JWT for testing. Tests use this to build valid /
 * invalid software statements without cracking real JWS crypto.
 */
export function mintSoftwareStatement(
  claims: Record<string, unknown>,
  trustAnchor: string,
  headerOverrides?: Record<string, unknown>,
): string {
  const header = {
    typ: 'JWT',
    alg: 'HS256',
    ...(headerOverrides ?? {}),
  };
  const headerB64 = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(Buffer.from(JSON.stringify(claims)));
  const signature = computeSoftwareStatementSignature(
    headerB64,
    payloadB64,
    trustAnchor,
  );
  return `${headerB64}.${payloadB64}.${signature}`;
}

export interface DynamicClientRegistrationOptions {
  /** Underlying OAuth 2.1 mock AS to attach the client to. */
  server: AuthorizationServer;
  /**
   * Trust anchor used to verify `software_statement` signatures. When absent
   * the mock refuses every request that carries a `software_statement`.
   */
  softwareStatementTrustAnchor?: string;
  /** Deterministic clock. */
  now?: () => number;
}

/**
 * Options accepted by the DCR endpoint handle. Extends the operator opts
 * with per-endpoint URL for advertisement.
 */
export interface CreateDcrEndpointOptions extends DynamicClientRegistrationOptions {
  url: string;
}

/**
 * Dynamic Client Registration endpoint handle.
 */
export interface DcrEndpoint {
  readonly url: string;
  register(request: ClientRegistrationRequest): ClientRegistrationResponse;
}

/**
 * Validate a registration request per RFC 7591 §2. Refuses on missing
 * required fields, empty `redirect_uris`, dropped OAuth 2.1 grants, or
 * unsupported auth methods.
 */
function validateRequest(request: ClientRegistrationRequest): void {
  if (!Array.isArray(request.redirect_uris) || request.redirect_uris.length === 0) {
    throw new Error(
      'dynamicClientRegistration: `redirect_uris` must be a non-empty array (RFC 7591 §2)',
    );
  }
  for (const uri of request.redirect_uris) {
    if (typeof uri !== 'string' || uri.length === 0) {
      throw new Error(
        `dynamicClientRegistration: every redirect_uri must be a non-empty string (got "${uri}")`,
      );
    }
    try {
      // URL constructor throws on malformed input — matches how a real AS
      // would refuse a garbage URI.
      new URL(uri);
    } catch {
      throw new Error(
        `dynamicClientRegistration: redirect_uri "${uri}" is not a valid URL`,
      );
    }
  }

  const grants = request.grant_types ?? ['authorization_code'];
  for (const grant of grants) {
    if (!ALLOWED_GRANT_TYPES.has(grant)) {
      throw new Error(
        `dynamicClientRegistration: grant_type "${grant}" refused — OAuth 2.1 allowlist is ${[...ALLOWED_GRANT_TYPES].join(', ')}`,
      );
    }
  }

  const responses = request.response_types ?? ['code'];
  for (const responseType of responses) {
    if (!ALLOWED_RESPONSE_TYPES.has(responseType)) {
      throw new Error(
        `dynamicClientRegistration: response_type "${responseType}" refused — OIDC Discovery advertises "code" only`,
      );
    }
  }

  const authMethod = request.token_endpoint_auth_method ?? 'client_secret_basic';
  if (!ALLOWED_AUTH_METHODS.has(authMethod)) {
    throw new Error(
      `dynamicClientRegistration: token_endpoint_auth_method "${authMethod}" refused — advertised methods are ${[...ALLOWED_AUTH_METHODS].join(', ')}`,
    );
  }
}

/**
 * Register a client with the underlying mock AS. Returns the RFC 7591 §3
 * response. `client_id` is assigned deterministically; `client_secret` is
 * omitted when `token_endpoint_auth_method` is `none` (matches how a real AS
 * treats public clients).
 */
export function dynamicClientRegistration(
  options: DynamicClientRegistrationOptions,
  request: ClientRegistrationRequest,
): ClientRegistrationResponse {
  validateRequest(request);

  // If a software_statement is present, verify its signature + fold its
  // claims into the registration. RFC 7591 §2.3 says the AS MAY refuse a
  // registration whose software_statement signature does not verify.
  if (request.software_statement !== undefined) {
    if (options.softwareStatementTrustAnchor === undefined) {
      throw new Error(
        'dynamicClientRegistration: software_statement supplied but no trust anchor configured on the AS',
      );
    }
    let parsed: ParsedSoftwareStatement;
    try {
      parsed = parseSoftwareStatement(request.software_statement);
    } catch (err) {
      throw new Error(
        `dynamicClientRegistration: software_statement parse failed — ${(err as Error).message}`,
      );
    }
    // parseSoftwareStatement above already validated `parts.length === 3`;
    // re-splitting here for the signature is safe.
    const rawParts = request.software_statement.split('.');
    const headerB64 = rawParts[0] as string;
    const payloadB64 = rawParts[1] as string;
    const expected = computeSoftwareStatementSignature(
      headerB64,
      payloadB64,
      options.softwareStatementTrustAnchor,
    );
    if (parsed.signature !== expected) {
      throw new Error(
        'dynamicClientRegistration: software_statement signature verification failed',
      );
    }
  }

  const now = options.now ?? (() => Date.now());
  clientIdCounter += 1;
  const clientId = `client-${clientIdCounter.toString().padStart(3, '0')}`;
  const authMethod = request.token_endpoint_auth_method ?? 'client_secret_basic';
  const isPublic = authMethod === 'none';

  const response: ClientRegistrationResponse = {
    client_id: clientId,
    ...(isPublic
      ? {}
      : { client_secret: base64UrlEncode(randomBytes(24)) }),
    client_id_issued_at: Math.floor(now() / 1000),
    redirect_uris: [...request.redirect_uris],
    grant_types: [...(request.grant_types ?? ['authorization_code'])],
    response_types: [...(request.response_types ?? ['code'])],
    token_endpoint_auth_method: authMethod,
    scope: request.scope ?? 'openid',
  };

  // Attach to the underlying OAuth 2.1 mock AS so `/authorize` + `/token`
  // recognise the newly-registered client.
  options.server.registerClient({
    clientId,
    redirectUris: [...request.redirect_uris],
    scopes: (request.scope ?? 'openid').split(' '),
    clientType: isPublic ? 'public' : 'confidential',
  });

  return response;
}

/**
 * Build a DCR endpoint handle. Tests use this when they want to inspect the
 * advertised URL alongside the registration side effects.
 */
export function createDcrEndpoint(options: CreateDcrEndpointOptions): DcrEndpoint {
  return {
    url: options.url,
    register(request: ClientRegistrationRequest): ClientRegistrationResponse {
      return dynamicClientRegistration(options, request);
    },
  };
}
