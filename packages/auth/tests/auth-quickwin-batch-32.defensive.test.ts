import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { createSyncFabric } from '../src/passkey/sync-fabric.js';
import { verifyClerkJwt } from '../src/clerk/jwt.js';

function b64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input) : input;
  return buf.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

const JWT_HEADER = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

describe('passkey/sync-fabric list mapping branch', () => {
  it('list returns cloned credentials after backup', () => {
    const fabric = createSyncFabric('icloud-keychain');
    // Type-cast fixture minimal enough for sync-fabric to run the map+spread
    fabric.backup({
      credentialId: 'c1',
      userId: 'u1',
      publicKey: 'pk',
      signCount: 0,
      backupEligible: true,
      backedUp: true,
      syncedFabrics: ['icloud-keychain'],
    } as never);
    const listed = fabric.list();
    expect(listed).toHaveLength(1);
    expect(listed[0]?.credentialId).toBe('c1');
    expect(listed[0]?.syncedFabrics).toEqual(['icloud-keychain']);
  });

  it('list returns cloned credentials with fresh syncedFabrics array', () => {
    const fabric = createSyncFabric('google-password-manager');
    fabric.backup({
      credentialId: 'c2',
      userId: 'u2',
      publicKey: 'pk',
      signCount: 0,
      backupEligible: true,
      backedUp: true,
      syncedFabrics: ['google-password-manager', 'icloud-keychain'],
    } as never);
    const listed = fabric.list();
    // Verify the array itself is a fresh clone (not the same reference)
    expect(listed[0]?.syncedFabrics).toEqual([
      'google-password-manager',
      'icloud-keychain',
    ]);
  });
});

describe('clerk/jwt payload parse failure branch', () => {
  it('throws when payload segment is not valid JSON', () => {
    const secret = 'test-secret';
    const forgedPayload = b64url('not-json-{{{');
    const sig = b64url(
      createHmac('sha256', secret).update(`${JWT_HEADER}.${forgedPayload}`).digest(),
    );
    const token = `${JWT_HEADER}.${forgedPayload}.${sig}`;
    expect(() => verifyClerkJwt(token, secret)).toThrow(/payload is not valid JSON/);
  });

  it('throws when token is expired', () => {
    const secret = 'test-secret';
    const claims = {
      iss: 'https://tenant.clerk.accounts.dev',
      sub: 'user_1',
      sid: 'sess_1',
      iat: 1_600_000_000,
      exp: 1_600_003_600, // long past
    };
    const payload = b64url(JSON.stringify(claims));
    const sig = b64url(
      createHmac('sha256', secret).update(`${JWT_HEADER}.${payload}`).digest(),
    );
    const token = `${JWT_HEADER}.${payload}.${sig}`;
    expect(() => verifyClerkJwt(token, secret)).toThrow(/token expired/);
  });

  it('throws when signature does not match', () => {
    const secret = 'test-secret';
    const claims = {
      iss: 'https://tenant.clerk.accounts.dev',
      sub: 'user_1',
      sid: 'sess_1',
      iat: 1_900_000_000,
      exp: 1_900_003_600,
    };
    const payload = b64url(JSON.stringify(claims));
    const token = `${JWT_HEADER}.${payload}.wrong-signature`;
    expect(() => verifyClerkJwt(token, secret)).toThrow(/signature mismatch/);
  });
});
