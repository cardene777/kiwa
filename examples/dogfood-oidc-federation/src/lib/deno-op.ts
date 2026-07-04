/**
 * Hono OP — wires the OIDC provider surface (discovery + JWKS + DCR +
 * authorize + token) onto Hono routes. Sub-Issue v1.21-4a (this state)
 * wires:
 *   - GET `/.well-known/openid-configuration` — discovery metadata
 *   - GET `/jwks` — current JWKS document
 *   - POST `/jwks/rotate` — rotate the active signing key (test-only)
 *   - POST `/register` — DCR endpoint stub (mock-only, real refuses)
 *
 * `/authorize` + `/token` come from the underlying OAuth 2.1 mock and land
 * in Sub-Issue v1.21-4b/c wiring. `/userinfo` lands in Sub-Issue v1.21-4c
 * with the id_token verification harness.
 *
 * The Hono app is framework-agnostic — the fidelity harness drives the
 * adapter directly without booting Hono; Cloudflare Workers + Deno Deploy
 * mount the app through the same handler.
 */

import { Hono } from 'hono';
import type { OIDCOPAdapter } from '../adapters/interface.js';

export interface CreateOpAppOptions {
  adapter: OIDCOPAdapter;
}

/**
 * Build the OIDC OP Hono app. Every route delegates to the injected
 * adapter so the same app drives both mock + real drivers with no code
 * changes at the routing layer.
 */
export function createOpApp(options: CreateOpAppOptions): Hono {
  const app = new Hono();
  const { adapter } = options;

  // Discovery — OpenID Connect Discovery 1.0 §3. Always returns 200 with
  // the metadata document; the RP-side guard (assertIssuerMatchesFetchUrl)
  // checks the issuer field against the URL used to fetch.
  app.get('/.well-known/openid-configuration', (context) => {
    const metadata = adapter.discovery();
    return context.json(metadata);
  });

  // JWKS — RFC 7517 §5. Always returns 200 with `{keys: [...]}`. Real
  // driver refuses with 503 when env-missing so tests can uniformly detect
  // the skip condition.
  app.get('/jwks', (context) => {
    try {
      const document = adapter.jwks();
      return context.json(document);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return context.json({ error: 'server_error', error_description: message }, 503);
    }
  });

  // JWKS rotate — test-only surface exposed so the fidelity harness can
  // drive the rotation retention semantics through HTTP. Production OPs
  // rotate on a schedule; the mock exposes the trigger directly for test
  // determinism.
  app.post('/jwks/rotate', (context) => {
    try {
      const key = adapter.rotateJwks();
      return context.json({ active_kid: key.kid });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return context.json({ error: 'server_error', error_description: message }, 503);
    }
  });

  // DCR — RFC 7591 §3. Sub-Issue v1.21-4a routes the request but only the
  // mock implements it; the real driver refuses with 503 until Sub-Issue
  // v1.21-4b wires Keycloak `/registrations`.
  app.post('/register', async (context) => {
    let body: unknown;
    try {
      body = await context.req.json();
    } catch {
      return context.json(
        { error: 'invalid_request', error_description: 'request body is not valid JSON' },
        400,
      );
    }
    if (typeof body !== 'object' || body === null) {
      return context.json(
        { error: 'invalid_request', error_description: 'request body must be a JSON object' },
        400,
      );
    }
    try {
      // The adapter's registerClient signature narrows the request shape;
      // downstream Sub-Issue v1.21-4b tightens the shape assertions.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = adapter.registerClient(body as any);
      return context.json(response, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = message.includes('KIWA_OIDC_ENV_MISSING') ? 503 : 400;
      return context.json({ error: 'invalid_client_metadata', error_description: message }, status);
    }
  });

  return app;
}
