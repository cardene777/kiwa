/**
 * `.well-known/openid-configuration` route handler.
 *
 * Discovery is stateless — the metadata document is derived from the
 * adapter's issuer + advertised endpoints. Real deployments serve this
 * from a CDN because the shape only changes on OP configuration bumps;
 * the dogfood app rebuilds it per request so tests can override the
 * issuer without restarting.
 *
 * See {@link buildDiscovery} for the shape SSOT.
 */

import type { DiscoveryMetadata, OAuth21ASAdapter } from '../../adapters/interface.js';

export function createWellKnownHandler(
  adapter: OAuth21ASAdapter,
): () => DiscoveryMetadata {
  return function GET() {
    return adapter.discovery();
  };
}
