/**
 * Discovery route helpers — assert on the `issuer` field matching the URL
 * used to fetch the document (Discovery §4.3) so a real client parsing the
 * response can trust that the metadata was not swapped in-transit.
 *
 * The mock exposes `discovery.fetch()` but does not simulate an HTTP round
 * trip; the harness stamps the fetch URL onto each call so the guard has
 * something to compare against.
 */

import type { OpenIdProviderMetadata } from '@kiwa/auth';

/**
 * Error thrown when the discovery response `issuer` field disagrees with
 * the URL used to fetch the document. OIDC Discovery §4.3 — the RP MUST
 * verify the two values match; a mismatch is a signed indication of a
 * misconfigured OP (or a MITM swapping the response body).
 */
export class DiscoveryIssuerMismatchError extends Error {
  constructor(public expected: string, public actual: string) {
    super(
      `discovery: issuer mismatch — fetched at "${expected}" but metadata reports "${actual}"`,
    );
    this.name = 'DiscoveryIssuerMismatchError';
  }
}

/**
 * Guard the discovery metadata against the URL used to fetch it. Real
 * deployments derive `fetchUrl` from the `.well-known/openid-configuration`
 * request URL by stripping the well-known suffix; the mock passes the
 * issuer URL directly since it does not model the well-known path in
 * v1.21-4a (Sub-Issue v1.21-4b lands the DCR endpoint + well-known path
 * simulation).
 *
 * Throws `DiscoveryIssuerMismatchError` when `metadata.issuer` does not
 * exactly match `fetchUrl` (after trimming trailing slashes on both sides).
 */
export function assertIssuerMatchesFetchUrl(
  metadata: OpenIdProviderMetadata,
  fetchUrl: string,
): void {
  const normalizedFetch = fetchUrl.replace(/\/$/, '');
  const normalizedIssuer = metadata.issuer.replace(/\/$/, '');
  if (normalizedFetch !== normalizedIssuer) {
    throw new DiscoveryIssuerMismatchError(normalizedFetch, normalizedIssuer);
  }
}

/**
 * Validate the discovery response shape against OIDC Discovery §3 required
 * fields. The mock always returns every field so this guard is a defence
 * against a hypothetical adapter change that drops a mandatory key —
 * the fidelity harness runs this against both mock + real to catch shape
 * drift.
 */
export function assertRequiredDiscoveryFields(
  metadata: OpenIdProviderMetadata,
): void {
  const required: readonly (keyof OpenIdProviderMetadata)[] = [
    'issuer',
    'authorization_endpoint',
    'token_endpoint',
    'jwks_uri',
    'response_types_supported',
    'subject_types_supported',
    'id_token_signing_alg_values_supported',
  ];
  for (const field of required) {
    if (metadata[field] === undefined) {
      throw new Error(`discovery: missing required field "${field}"`);
    }
  }
}

/**
 * OAuth 2.1 restrictions layered onto the OIDC discovery response. OIDC
 * inherits from OAuth 2.1 (RFC 9700 draft), so implicit / password / plain
 * PKCE MUST NOT be advertised. The mock omits these; the guard fails if
 * the advertised subsets ever expand.
 */
export function assertOAuth21Restrictions(
  metadata: OpenIdProviderMetadata,
): void {
  if (!metadata.response_types_supported.includes('code')) {
    throw new Error('discovery: response_types_supported must include "code"');
  }
  const forbiddenResponseTypes = ['token', 'id_token', 'token id_token'];
  for (const forbidden of forbiddenResponseTypes) {
    if (metadata.response_types_supported.includes(forbidden)) {
      throw new Error(
        `discovery: response_types_supported must not advertise "${forbidden}" (OAuth 2.1 drops implicit)`,
      );
    }
  }
  if (!metadata.code_challenge_methods_supported.includes('S256')) {
    throw new Error(
      'discovery: code_challenge_methods_supported must include "S256"',
    );
  }
  if (metadata.code_challenge_methods_supported.includes('plain')) {
    throw new Error(
      'discovery: code_challenge_methods_supported must not advertise "plain"',
    );
  }
}
