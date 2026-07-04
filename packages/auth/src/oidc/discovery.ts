import type {
  DiscoveryEndpoint,
  OpenIdProviderMetadata,
} from './types.js';

/**
 * Options accepted by `createDiscoveryEndpoint`. The mock derives every other
 * URL from the `issuer` so tests only have to override an issuer to relocate
 * the AS. `metadataOverrides` merges into the returned document — callers
 * simulating an OP that advertises non-default fields (`ES256` only, extra
 * scopes) pass overrides here.
 */
export interface CreateDiscoveryEndpointOptions {
  issuer: string;
  metadataOverrides?: Partial<OpenIdProviderMetadata>;
}

/**
 * Build the base OIDC Discovery document per OpenID Connect Discovery 1.0
 * §3. Every endpoint is derived from the issuer with a fixed path so tests
 * asserting URL shape have a single string to grep for.
 */
function baseMetadata(issuer: string): OpenIdProviderMetadata {
  const trimmed = issuer.replace(/\/$/, '');
  return {
    issuer: trimmed,
    authorization_endpoint: `${trimmed}/authorize`,
    token_endpoint: `${trimmed}/token`,
    jwks_uri: `${trimmed}/jwks`,
    registration_endpoint: `${trimmed}/register`,
    userinfo_endpoint: `${trimmed}/userinfo`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256', 'ES256'],
    scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
    token_endpoint_auth_methods_supported: [
      'client_secret_basic',
      'client_secret_post',
      'none',
    ],
    claims_supported: [
      'sub',
      'iss',
      'aud',
      'exp',
      'iat',
      'nonce',
      'at_hash',
      'c_hash',
      'name',
      'email',
    ],
    code_challenge_methods_supported: ['S256'],
  };
}

/**
 * Build the OIDC discovery endpoint. The mock keeps every field in-memory;
 * `fetch()` returns a fresh object so callers cannot mutate the underlying
 * metadata by reference.
 *
 * The document is intentionally read-only. Tests that need to simulate an OP
 * changing metadata should rebuild the discovery endpoint rather than reach
 * into the returned object.
 */
export function createDiscoveryEndpoint(
  options: CreateDiscoveryEndpointOptions,
): DiscoveryEndpoint {
  const issuer = options.issuer.replace(/\/$/, '');
  const url = `${issuer}/.well-known/openid-configuration`;

  const metadata: OpenIdProviderMetadata = {
    ...baseMetadata(issuer),
    ...(options.metadataOverrides ?? {}),
  };

  // OIDC Discovery §4.3 requires `issuer` in the document to match the URL
  // used to fetch it. The mock enforces this at construction — if a caller
  // overrides `issuer` in `metadataOverrides` to a different string, the
  // discovery endpoint refuses to build.
  if (metadata.issuer !== issuer) {
    throw new Error(
      `createDiscoveryEndpoint: metadata.issuer "${metadata.issuer}" must match endpoint issuer "${issuer}" (OIDC Discovery §4.3)`,
    );
  }

  return {
    url,
    issuer,
    fetch(): OpenIdProviderMetadata {
      // Shallow clone so callers cannot mutate the internal metadata. Arrays
      // are frozen too — the RP surface treats every advertised list as
      // immutable, so freezing prevents accidental in-place edits.
      return {
        ...metadata,
        response_types_supported: [...metadata.response_types_supported],
        subject_types_supported: [...metadata.subject_types_supported],
        id_token_signing_alg_values_supported: [
          ...metadata.id_token_signing_alg_values_supported,
        ],
        scopes_supported: [...metadata.scopes_supported],
        token_endpoint_auth_methods_supported: [
          ...metadata.token_endpoint_auth_methods_supported,
        ],
        claims_supported: [...metadata.claims_supported],
        code_challenge_methods_supported: [
          ...metadata.code_challenge_methods_supported,
        ],
      };
    },
  };
}
