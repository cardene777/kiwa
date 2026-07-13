import { describe, expect, it } from 'vitest';
import { createInMemoryBetterAuthAdapter } from '../src/better-auth/adapter.js';
import {
  createSessionFor,
  validateSessionByToken,
} from '../src/better-auth/session.js';
import { createIdTokenSigner } from '../src/oidc/id-token.js';
import { createJwksEndpoint } from '../src/oidc/jwks.js';

describe('better-auth/session validateSessionByToken orphan user branch', () => {
  it('returns null and deletes session when user was deleted after session issuance', async () => {
    const db = createInMemoryBetterAuthAdapter();
    const user = await db.createUser({ email: 'a@example.com' });
    const session = await createSessionFor(db, user, 3600);
    // Simulate user being deleted while session still exists
    await db.deleteUser(user.id);
    // Manually reinstate orphan session (deleteUser cascades sessions in most stores)
    await db.createSession({
      id: 'orphan-sess',
      userId: 'deleted-user-id',
      expiresAt: new Date(Date.now() + 60_000),
      token: 'orphan-token',
    });
    const result = await validateSessionByToken(db, 'orphan-token');
    expect(result).toBeNull();
    expect(await db.getSessionByToken('orphan-token')).toBeNull();
  });
});

describe('oidc/id-token sign + verify additional branches', () => {
  it('sign includes extraClaims when provided', () => {
    const jwks = createJwksEndpoint({ url: 'https://example.com/.well-known/jwks.json' });
    const signer = createIdTokenSigner({
      issuer: 'https://example.com',
      jwks,
    });
    const token = signer.sign({
      sub: 'user-1',
      aud: 'client-1',
      extraClaims: { custom: 'value', role: 'admin' },
    });
    expect(token.claims).toMatchObject({ custom: 'value', role: 'admin' });
  });

  it('sign works without extraClaims (undefined spread branch)', () => {
    const jwks = createJwksEndpoint({ url: 'https://example.com/.well-known/jwks.json' });
    const signer = createIdTokenSigner({
      issuer: 'https://example.com',
      jwks,
    });
    const token = signer.sign({
      sub: 'user-1',
      aud: 'client-1',
    });
    expect(token.claims.sub).toBe('user-1');
  });

  it('verify happy path returns valid=true for token signed by same env', () => {
    const jwks = createJwksEndpoint({
      url: 'https://example.com/.well-known/jwks.json',
      initialAlg: 'RS256',
    });
    const signer = createIdTokenSigner({
      issuer: 'https://example.com',
      jwks,
    });
    const token = signer.sign({
      sub: 'user-1',
      aud: 'client-1',
    });
    const result = signer.verify(token.jwt, {
      expectedIssuer: 'https://example.com',
      expectedAudience: 'client-1',
    });
    expect(result.valid).toBe(true);
  });
});
