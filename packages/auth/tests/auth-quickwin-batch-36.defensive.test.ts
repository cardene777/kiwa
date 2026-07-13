import { describe, expect, it } from 'vitest';
import { setupOidcEnv } from '../src/oidc/setup-oidc-env.js';
import { createDcrEndpoint } from '../src/oidc/dcr.js';
import { createAuthorizationServer } from '../src/oauth21/authorization-server.js';
import {
  createEntityStatement,
  createTrustAnchor,
} from '../src/oidc/federation.js';

describe('setup-oidc-env resolveTrustChain binding', () => {
  it('env.resolveTrustChain delegates to federation resolver', async () => {
    const env = await setupOidcEnv();
    const anchor = createTrustAnchor({ entity_id: 'https://anchor.example.com' });
    const leaf = createEntityStatement({
      iss: 'https://anchor.example.com',
      sub: 'https://leaf.example.com',
    });
    const result = env.resolveTrustChain({
      leaf,
      intermediates: [],
      anchor,
    });
    expect(result.valid).toBe(true);
  });

  it('env.resolveTrustChain reports broken chain via delegation', async () => {
    const env = await setupOidcEnv();
    const anchor = createTrustAnchor({ entity_id: 'https://anchor.example.com' });
    const leaf = createEntityStatement({
      iss: 'https://missing.example.com',
      sub: 'https://leaf.example.com',
    });
    const result = env.resolveTrustChain({
      leaf,
      intermediates: [],
      anchor,
    });
    expect(result.valid).toBe(false);
    expect(result.reason_code).toBe('broken_link');
  });
});

describe('oidc/dcr createDcrEndpoint factory', () => {
  it('createDcrEndpoint exposes url + register on the returned handle', () => {
    const server = createAuthorizationServer({ issuer: 'https://as.example' });
    const endpoint = createDcrEndpoint({
      url: 'https://as.example/register',
      server,
    });
    expect(endpoint.url).toBe('https://as.example/register');
    expect(typeof endpoint.register).toBe('function');
  });

  it('createDcrEndpoint.register delegates to dynamicClientRegistration', () => {
    const server = createAuthorizationServer({ issuer: 'https://as.example' });
    const endpoint = createDcrEndpoint({
      url: 'https://as.example/register',
      server,
    });
    const response = endpoint.register({
      redirect_uris: ['https://rp.example/cb'],
    });
    expect(response.client_id).toBeDefined();
    expect(response.redirect_uris).toContain('https://rp.example/cb');
  });

  it('createDcrEndpoint.register propagates DCR validation errors', () => {
    const server = createAuthorizationServer({ issuer: 'https://as.example' });
    const endpoint = createDcrEndpoint({
      url: 'https://as.example/register',
      server,
    });
    expect(() =>
      endpoint.register({
        redirect_uris: [], // empty → RFC 7591 §2 rejects
      }),
    ).toThrow(/redirect_uris/);
  });
});
