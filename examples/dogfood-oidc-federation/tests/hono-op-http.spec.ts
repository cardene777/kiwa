/**
 * Hono OP HTTP integration smoke tests. The fidelity harness in
 * `discovery-jwks-skeleton.spec.ts` drives the adapter directly to avoid
 * HTTP round-trip noise; this file proves the Hono routes in
 * `src/lib/deno-op.ts` correctly forward to the adapter + return the OIDC-
 * expected response shapes over HTTP.
 *
 * Coverage is intentionally shallow (skeleton phase) — routes exist +
 * shape correctness + status code mapping. Sub-Issues v1.21-4b/c/d wire
 * DCR / authorize / token / userinfo through the same Hono app and grow
 * the HTTP-layer tests accordingly.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { createOpApp } from '../src/lib/deno-op.js';

const ISSUER = 'https://op.example.test';

describe('createOpApp — GET /.well-known/openid-configuration', () => {
  it('returns 200 + OIDC Discovery §3 metadata on mock driver', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const app = createOpApp({ adapter });
    const response = await app.request(
      'http://localhost/.well-known/openid-configuration',
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { issuer: string; jwks_uri: string };
    expect(body.issuer).toBe(ISSUER);
    expect(body.jwks_uri).toBe(`${ISSUER}/jwks`);
    await adapter.reset();
  });

  it('returns 200 + static shape on real driver even in env-missing', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: {} });
    const app = createOpApp({ adapter });
    const response = await app.request(
      'http://localhost/.well-known/openid-configuration',
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      issuer: string;
      response_types_supported: string[];
    };
    expect(body.issuer).toBe(ISSUER);
    expect(body.response_types_supported).toEqual(['code']);
    await adapter.reset();
  });
});

describe('createOpApp — GET /jwks', () => {
  it('returns 200 + JWKS document on mock driver', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const app = createOpApp({ adapter });
    const response = await app.request('http://localhost/jwks');
    expect(response.status).toBe(200);
    const body = (await response.json()) as { keys: unknown[] };
    expect(Array.isArray(body.keys)).toBe(true);
    expect(body.keys.length).toBeGreaterThan(0);
    await adapter.reset();
  });

  it('returns 503 on real driver in env-missing', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: {} });
    const app = createOpApp({ adapter });
    const response = await app.request('http://localhost/jwks');
    expect(response.status).toBe(503);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('server_error');
    await adapter.reset();
  });
});

describe('createOpApp — POST /jwks/rotate (test-only surface)', () => {
  it('rotates + returns 200 with active kid on mock driver', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const app = createOpApp({ adapter });
    const first = await app.request('http://localhost/jwks/rotate', {
      method: 'POST',
    });
    expect(first.status).toBe(200);
    const firstBody = (await first.json()) as { active_kid: string };
    const second = await app.request('http://localhost/jwks/rotate', {
      method: 'POST',
    });
    const secondBody = (await second.json()) as { active_kid: string };
    expect(secondBody.active_kid).not.toBe(firstBody.active_kid);
    await adapter.reset();
  });
});

describe('createOpApp — POST /register (DCR skeleton)', () => {
  it('creates + returns 201 with client_id on mock driver', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const app = createOpApp({ adapter });
    const response = await app.request('http://localhost/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        redirect_uris: ['https://rp.example.test/callback'],
      }),
    });
    expect(response.status).toBe(201);
    const body = (await response.json()) as { client_id: string };
    expect(body.client_id).toMatch(/^client-\d{3}$/);
    await adapter.reset();
  });

  it('returns 400 on invalid JSON body', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const app = createOpApp({ adapter });
    const response = await app.request('http://localhost/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not json',
    });
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe('invalid_request');
    await adapter.reset();
  });

  it('returns 400 on non-object JSON body', async () => {
    const adapter = await makeMockAdapter({ issuer: ISSUER });
    const app = createOpApp({ adapter });
    const response = await app.request('http://localhost/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify('a string'),
    });
    expect(response.status).toBe(400);
    await adapter.reset();
  });

  it('returns 503 on real driver env-missing', async () => {
    const adapter = await makeRealAdapter({ issuer: ISSUER, env: {} });
    const app = createOpApp({ adapter });
    const response = await app.request('http://localhost/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        redirect_uris: ['https://rp.example.test/callback'],
      }),
    });
    expect(response.status).toBe(503);
    await adapter.reset();
  });
});
