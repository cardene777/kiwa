import { describe, expect, it } from 'vitest';
import { createInMemoryAdapter, hashPassword, verifyPassword } from '../../src/index.js';

/**
 * auth fidelity domain test — real API (createInMemoryAdapter / hashPassword /
 * verifyPassword) で mock 挙動が Auth.js contract に fidelity を持つか assert する。
 */
describe('auth fidelity — real adapter contract', () => {
  it('T-FID-D-001 createInMemoryAdapter は createUser + getUser で id 一意性を保つ', async () => {
    const adapter = createInMemoryAdapter();
    const u1 = await adapter.createUser({ email: 'a@example.com', emailVerified: undefined });
    const u2 = await adapter.createUser({ email: 'b@example.com', emailVerified: undefined });
    expect(u1.id).not.toBe(u2.id);
    const fetched = await adapter.getUser(u1.id);
    expect(fetched?.email).toBe('a@example.com');
  });

  it('T-FID-D-002 createInMemoryAdapter は getUserByEmail で email 検索を pass', async () => {
    const adapter = createInMemoryAdapter();
    const created = await adapter.createUser({ email: 'c@example.com', emailVerified: undefined });
    const found = await adapter.getUserByEmail('c@example.com');
    expect(found?.id).toBe(created.id);
    const missing = await adapter.getUserByEmail('nope@example.com');
    expect(missing).toBeNull();
  });

  it('T-FID-D-003 hashPassword + verifyPassword round-trip', async () => {
    const hashed = await hashPassword('secret-password-123');
    expect(hashed).not.toBe('secret-password-123');
    const valid = await verifyPassword(hashed, 'secret-password-123');
    expect(valid).toBe(true);
    const invalid = await verifyPassword(hashed, 'wrong-password');
    expect(invalid).toBe(false);
  });

  it('T-FID-D-004 createInMemoryAdapter は createSession + getSessionAndUser で user 紐付け', async () => {
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({ email: 'd@example.com', emailVerified: undefined });
    const expires = new Date(Date.now() + 3_600_000);
    const session = await adapter.createSession({
      sessionToken: 'token-abc',
      userId: user.id,
      expires,
    });
    const bundle = await adapter.getSessionAndUser(session.sessionToken);
    expect(bundle?.user.id).toBe(user.id);
    expect(bundle?.session.sessionToken).toBe('token-abc');
  });

  it('T-FID-D-005 createInMemoryAdapter は linkAccount + getUserByAccount で OAuth 紐付け', async () => {
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({ email: 'e@example.com', emailVerified: undefined });
    await adapter.linkAccount({
      userId: user.id,
      type: 'oauth',
      provider: 'github',
      providerAccountId: 'gh-123',
    });
    const found = await adapter.getUserByAccount({
      provider: 'github',
      providerAccountId: 'gh-123',
    });
    expect(found?.id).toBe(user.id);
  });
});
