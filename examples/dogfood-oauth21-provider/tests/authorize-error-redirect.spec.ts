/**
 * v1.22-2 Bug 1 fix — /authorize post-adapter error RFC 6749 §4.1.2.1
 * redirect fidelity spec.
 *
 * RFC 6749 §4.1.2.1 mandates that when the authorization request is rejected
 * for reasons OTHER than an untrusted `client_id` / `redirect_uri`, the AS
 * MUST redirect the user-agent back to `redirect_uri` with `error` +
 * `error_description` + `state` as query parameters. Returning JSON here
 * (as the pre-v1.22-2 dogfood app did) produces a cross-driver fidelity
 * divergence — real IdPs (Keycloak, Auth0, oauth2-mock-server via Navikt)
 * all redirect, so the mock's JSON response would fail the release gate
 * once the real driver is wired.
 *
 * This spec pins the 302 redirect contract for 3 rejection cases:
 *   1. missing `code_challenge` (PKCE pre-flight, RFC 9700 §2.1)
 *   2. missing `state` (adapter-side rejection, RFC 6749 §4.1.1 mandates)
 *   3. bad `response_type=token` (implicit refused, RFC 6749 §4.1.1 +
 *      OAuth 2.1 §4.1)
 *
 * Untrusted-URI cases (missing `client_id` / `redirect_uri` / malformed
 * URI) MUST stay JSON — RFC §4.1.2.1 explicitly forbids redirecting to
 * an unvalidated URI. Those cases are covered separately in
 * `tests/endpoints-skeleton.spec.ts` (pre-flight guards).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __resetOAuth21Counters } from '@kiwa/auth';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { createHonoApp } from '../src/lib/hono-app.js';

const CLIENT = {
  clientId: 'dogfood-client',
  redirectUris: ['https://client.example.test/callback'],
  scopes: ['read', 'write'],
} as const;

const USER = { subject: 'user-1', scopes: ['read', 'write'] } as const;
const REDIRECT = CLIENT.redirectUris[0];
const ISSUER = 'https://as.example.test';

function clearBootstrapEnv(): void {
  delete process.env['OAUTH21_BOOTSTRAP'];
  delete process.env['KIWA_MODE'];
  delete process.env['OAUTH21_MOCK_SERVER_URL'];
}

async function bootstrap(): Promise<ReturnType<typeof createHonoApp>> {
  __resetOAuth21Counters();
  const mock = await makeMockAdapter({
    issuer: ISSUER,
    clients: [CLIENT],
    users: [USER],
    now: () => 1_700_000_000_000,
  });
  return createHonoApp({ adapter: mock, authenticatedSubject: USER.subject });
}

describe('/authorize RFC 6749 §4.1.2.1 error redirect fidelity (v1.22-2 Bug 1)', () => {
  beforeEach(clearBootstrapEnv);
  afterEach(clearBootstrapEnv);

  it('missing code_challenge — 302 redirect to redirect_uri with invalid_request + state', async () => {
    // RFC 9700 §2.1 mandates PKCE; missing challenge is an
    // `invalid_request`. redirect_uri is validly formed so §4.1.2.1
    // requires the AS to redirect back to it (NOT return JSON) so the
    // client's callback handler can surface the error to the resource
    // owner uniformly with success + failure paths.
    const app = await bootstrap();
    const url = new URL(`${ISSUER}/authorize`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', CLIENT.clientId);
    url.searchParams.set('redirect_uri', REDIRECT);
    url.searchParams.set('state', 'st-missing-challenge');
    url.searchParams.set('code_challenge_method', 'S256');
    // no code_challenge — RFC 9700 §2.1 refuses
    const res = await app.request(url.pathname + url.search, {
      redirect: 'manual',
    });
    expect(res.status).toBe(302);
    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    const parsed = new URL(location as string);
    // Redirect target is exactly the registered callback URL — the AS
    // does NOT append the error params to a different origin.
    expect(parsed.origin + parsed.pathname).toBe(REDIRECT);
    expect(parsed.searchParams.get('error')).toBe('invalid_request');
    expect(parsed.searchParams.get('error_description')).toContain(
      'code_challenge',
    );
    expect(parsed.searchParams.get('state')).toBe('st-missing-challenge');
  });

  it('missing state — 302 redirect to redirect_uri with invalid_request + empty state', async () => {
    // RFC 6749 §4.1.1 mandates that the AS include `state` in the error
    // redirect. When the client omitted it, the AS still round-trips an
    // empty string so the callback handler can distinguish "state was
    // absent" from "state was tampered". The kiwa AS rejects a missing
    // state to keep the CSRF defence uniform.
    const app = await bootstrap();
    const url = new URL(`${ISSUER}/authorize`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', CLIENT.clientId);
    url.searchParams.set('redirect_uri', REDIRECT);
    url.searchParams.set('code_challenge', 'a'.repeat(43));
    url.searchParams.set('code_challenge_method', 'S256');
    // no `state` — the kiwa AS rejects with "state parameter missing"
    const res = await app.request(url.pathname + url.search, {
      redirect: 'manual',
    });
    expect(res.status).toBe(302);
    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    const parsed = new URL(location as string);
    expect(parsed.origin + parsed.pathname).toBe(REDIRECT);
    expect(parsed.searchParams.get('error')).toBe('invalid_request');
    // The client did not send a state, so the AS round-trips an empty
    // string — RFC 6749 §4.1.2.1 requires the parameter be included when
    // the client supplied one; the AS includes it always in the dogfood
    // for consistency so callbacks always find the field.
    expect(parsed.searchParams.get('state')).toBe('');
  });

  it('bad response_type=token — 302 redirect to redirect_uri with unsupported_response_type + state', async () => {
    // OAuth 2.1 §4.1 refuses implicit + hybrid at discovery, and RFC 6749
    // §4.1.2.1 requires the runtime refusal to redirect back to the
    // trusted redirect_uri so the client sees the same failure mode as
    // any other AS. This is the case that would produce a real vs mock
    // divergence in the fidelity harness — Navikt's oauth2-mock-server
    // redirects here, so the dogfood mock must too.
    const app = await bootstrap();
    const url = new URL(`${ISSUER}/authorize`);
    url.searchParams.set('response_type', 'token');
    url.searchParams.set('client_id', CLIENT.clientId);
    url.searchParams.set('redirect_uri', REDIRECT);
    url.searchParams.set('state', 'st-implicit-refused');
    const res = await app.request(url.pathname + url.search, {
      redirect: 'manual',
    });
    expect(res.status).toBe(302);
    const location = res.headers.get('location');
    expect(location).toBeTruthy();
    const parsed = new URL(location as string);
    expect(parsed.origin + parsed.pathname).toBe(REDIRECT);
    expect(parsed.searchParams.get('error')).toBe(
      'unsupported_response_type',
    );
    expect(parsed.searchParams.get('state')).toBe('st-implicit-refused');
  });

  it('untrusted redirect_uri — MUST stay JSON (never redirect to an unvalidated URI)', async () => {
    // Sanity check that the redirect fix does NOT open the door to
    // redirecting to a malformed URI — a scheme-less "not-a-url" cannot
    // be trusted so the AS falls back to JSON per §4.1.2.1 (server logs
    // the failure, developer sees the error inline; a real AS would
    // render an error page to the resource owner).
    const app = await bootstrap();
    const url = new URL(`${ISSUER}/authorize`);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', CLIENT.clientId);
    url.searchParams.set('redirect_uri', 'not-a-url');
    url.searchParams.set('state', 'st-malformed');
    url.searchParams.set('code_challenge', 'a'.repeat(43));
    url.searchParams.set('code_challenge_method', 'S256');
    const res = await app.request(url.pathname + url.search, {
      redirect: 'manual',
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as Record<string, string>;
    expect(body['error']).toBe('invalid_request');
    expect(body['error_description']).toContain('redirect_uri');
  });
});
