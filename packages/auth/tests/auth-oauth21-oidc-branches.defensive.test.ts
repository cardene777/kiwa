import { describe, expect, it } from 'vitest';
import {
  createMockDpopJwk,
  createDpopProof,
  parseDpopProof,
  verifyDpopProof,
} from '../src/oauth21/dpop.js';
import { dynamicClientRegistration } from '../src/oidc/dcr.js';
import { createAuthorizationServer } from '../src/oauth21/authorization-server.js';

describe('dpop defensive branches', () => {
  it('parseDpopProof handles proof without payload fields (defaults)', () => {
    const jwk = createMockDpopJwk();
    const proof = createDpopProof({
      jwk,
      htm: 'POST',
      htu: 'https://example.com/token',
    });
    const parsed = parseDpopProof(proof.jwt);
    expect(parsed.payload.htm).toBe('POST');
    expect(parsed.payload.htu).toBe('https://example.com/token');
    expect(parsed.payload.iat).toBeGreaterThan(0);
  });

  it('verifyDpopProof throws when jti replay detected', () => {
    const jwk = createMockDpopJwk();
    const proof = createDpopProof({
      jwk,
      htm: 'GET',
      htu: 'https://example.com/api',
    });
    const seen = new Set<string>();
    const opts = {
      expectedHtm: 'GET',
      expectedHtu: 'https://example.com/api',
      iatSkewSec: 300,
      seenJtis: seen,
      now: () => Date.now(),
    };
    verifyDpopProof(proof, opts);
    expect(() => verifyDpopProof(proof, opts)).toThrow(/replay detected/);
  });

  it('verifyDpopProof throws on iat outside skew', () => {
    const jwk = createMockDpopJwk();
    const proof = createDpopProof({
      jwk,
      htm: 'GET',
      htu: 'https://example.com/api',
      iat: Math.floor(Date.now() / 1000) - 3600,
    });
    expect(() =>
      verifyDpopProof(proof, {
        expectedHtm: 'GET',
        expectedHtu: 'https://example.com/api',
        iatSkewSec: 10,
        seenJtis: new Set(),
        now: () => Date.now(),
      }),
    ).toThrow(/iat outside allowed skew/);
  });
});

describe('dcr defensive branches', () => {
  it('throws when redirect_uris is not an array', () => {
    expect(() =>
      dynamicClientRegistration({ server: createAuthorizationServer() }, {
        redirect_uris: undefined as never,
      }),
    ).toThrow(/`redirect_uris` must be a non-empty array/);
  });

  it('throws when redirect_uris is empty', () => {
    expect(() =>
      dynamicClientRegistration({ server: createAuthorizationServer() }, {
        redirect_uris: [],
      }),
    ).toThrow(/`redirect_uris` must be a non-empty array/);
  });

  it('throws when redirect_uri is empty string', () => {
    expect(() =>
      dynamicClientRegistration({ server: createAuthorizationServer() }, {
        redirect_uris: [''],
      }),
    ).toThrow(/every redirect_uri must be a non-empty string/);
  });

  it('throws when redirect_uri is malformed URL', () => {
    expect(() =>
      dynamicClientRegistration({ server: createAuthorizationServer() }, {
        redirect_uris: ['not-a-valid-url-string'],
      }),
    ).toThrow(/is not a valid URL/);
  });

  it('throws when grant_type is not in allowlist', () => {
    expect(() =>
      dynamicClientRegistration({ server: createAuthorizationServer() }, {
        redirect_uris: ['https://example.com/cb'],
        grant_types: ['implicit'] as never,
      }),
    ).toThrow(/grant_type "implicit" refused/);
  });

  it('throws when response_type is not code', () => {
    expect(() =>
      dynamicClientRegistration({ server: createAuthorizationServer() }, {
        redirect_uris: ['https://example.com/cb'],
        response_types: ['token'] as never,
      }),
    ).toThrow(/response_type "token" refused/);
  });

  it('throws when token_endpoint_auth_method is not in allowlist', () => {
    expect(() =>
      dynamicClientRegistration({ server: createAuthorizationServer() }, {
        redirect_uris: ['https://example.com/cb'],
        token_endpoint_auth_method: 'client_secret_none' as never,
      }),
    ).toThrow(/token_endpoint_auth_method .* refused/);
  });

  it('registers client with valid input (happy path)', () => {
    const result = dynamicClientRegistration({ server: createAuthorizationServer() }, {
      redirect_uris: ['https://example.com/cb'],
    });
    expect(result.client_id).toBeDefined();
  });
});
