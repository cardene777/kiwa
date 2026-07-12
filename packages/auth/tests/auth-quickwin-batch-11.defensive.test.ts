import { describe, expect, it } from 'vitest';
import {
  __resetDpopCounters,
  createDpopProof,
  createMockDpopJwk,
  parseDpopProof,
} from '../src/oauth21/dpop.js';
import { createJwksEndpoint } from '../src/oidc/jwks.js';
import { createIdTokenSigner } from '../src/oidc/id-token.js';

describe('oauth21/dpop parseDpopProof defensive branches', () => {
  it('throws when JWT does not have 3 segments', () => {
    expect(() => parseDpopProof('one.two')).toThrow(/expected compact JWT with 3 segments/);
    expect(() => parseDpopProof('a.b.c.d')).toThrow(/3 segments/);
  });

  it('throws when typ is not dpop+jwt', () => {
    __resetDpopCounters();
    const proof = createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.com/token',
      iat: 1_900_000_000,
      jwk: createMockDpopJwk(),
    });
    const [_, payloadEncoded, sigEncoded] = proof.jwt.split('.');
    const forgedHeader = Buffer.from(
      JSON.stringify({ typ: 'jwt', alg: 'ES256', jwk: proof.header.jwk }),
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const forged = `${forgedHeader}.${payloadEncoded}.${sigEncoded}`;
    expect(() => parseDpopProof(forged)).toThrow(/expected typ=dpop\+jwt/);
  });

  it('throws when alg is not ES256', () => {
    __resetDpopCounters();
    const proof = createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.com/token',
      iat: 1_900_000_000,
      jwk: createMockDpopJwk(),
    });
    const [_, payloadEncoded, sigEncoded] = proof.jwt.split('.');
    const forgedHeader = Buffer.from(
      JSON.stringify({ typ: 'dpop+jwt', alg: 'RS256', jwk: proof.header.jwk }),
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const forged = `${forgedHeader}.${payloadEncoded}.${sigEncoded}`;
    expect(() => parseDpopProof(forged)).toThrow(/expected alg=ES256/);
  });

  it('throws when jwk is missing or wrong kty', () => {
    __resetDpopCounters();
    const proof = createDpopProof({
      htm: 'POST',
      htu: 'https://as.example.com/token',
      iat: 1_900_000_000,
      jwk: createMockDpopJwk(),
    });
    const [_, payloadEncoded, sigEncoded] = proof.jwt.split('.');
    const forgedHeader = Buffer.from(
      JSON.stringify({
        typ: 'dpop+jwt',
        alg: 'ES256',
        jwk: { kty: 'RSA', crv: 'P-256' },
      }),
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const forged = `${forgedHeader}.${payloadEncoded}.${sigEncoded}`;
    expect(() => parseDpopProof(forged)).toThrow(/expected EC P-256 jwk/);
  });
});

describe('oidc/id-token verify defensive branches', () => {
  it('reports invalid when JWT does not have 3 segments', () => {
    const jwks = createJwksEndpoint({ url: 'https://example.com/.well-known/jwks.json' });
    const signer = createIdTokenSigner({
      issuer: 'https://example.com',
      jwks,
    });
    const result = signer.verify('only.two', {
      expectedIssuer: 'https://example.com',
      expectedAudience: 'client-1',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('3 dot-separated segments');
  });

  it('reports invalid when header parse fails', () => {
    const jwks = createJwksEndpoint({ url: 'https://example.com/.well-known/jwks.json' });
    const signer = createIdTokenSigner({
      issuer: 'https://example.com',
      jwks,
    });
    const result = signer.verify('!not-json.body.sig', {
      expectedIssuer: 'https://example.com',
      expectedAudience: 'client-1',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('header parse failed');
  });

  it('reports invalid when kid not in JWKS', () => {
    const jwks = createJwksEndpoint({ url: 'https://example.com/.well-known/jwks.json' });
    const signer = createIdTokenSigner({
      issuer: 'https://example.com',
      jwks,
    });
    const forgedHeader = Buffer.from(
      JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'unknown-kid' }),
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const forgedPayload = Buffer.from(JSON.stringify({ iss: 'x', sub: 'y', aud: 'z' }))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const result = signer.verify(`${forgedHeader}.${forgedPayload}.sig`, {
      expectedIssuer: 'https://example.com',
      expectedAudience: 'client-1',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('not found in JWKS');
  });

  it('reports invalid when header alg does not match JWKS key alg', () => {
    const jwks = createJwksEndpoint({
      url: 'https://example.com/.well-known/jwks.json',
      initialAlg: 'RS256',
    });
    const signer = createIdTokenSigner({
      issuer: 'https://example.com',
      jwks,
    });
    const activeKey = jwks.activeKey();
    const forgedHeader = Buffer.from(
      JSON.stringify({ alg: 'ES256', typ: 'JWT', kid: activeKey.kid }),
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const forgedPayload = Buffer.from(JSON.stringify({ iss: 'x', sub: 'y', aud: 'z' }))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const result = signer.verify(`${forgedHeader}.${forgedPayload}.sig`, {
      expectedIssuer: 'https://example.com',
      expectedAudience: 'client-1',
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('does not match JWKS entry alg');
  });
});
