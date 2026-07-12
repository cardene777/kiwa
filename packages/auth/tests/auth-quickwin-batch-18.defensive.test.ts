import { describe, expect, it } from 'vitest';
import { createInMemoryBetterAuthAdapter } from '../src/better-auth/adapter.js';
import {
  createSessionFor,
  validateSessionByToken,
} from '../src/better-auth/session.js';

describe('better-auth/session validateSessionByToken defensive branches', () => {
  it('returns null when token does not exist', async () => {
    const db = createInMemoryBetterAuthAdapter();
    expect(await validateSessionByToken(db, 'nonexistent-token')).toBeNull();
  });

  it('returns null and deletes expired session', async () => {
    const db = createInMemoryBetterAuthAdapter();
    const user = await db.createUser({ email: 'a@example.com' });
    // Manually create an expired session
    await db.createSession({
      id: 'expired-sess',
      userId: user.id,
      expiresAt: new Date(Date.now() - 60_000),
      token: 'expired-token',
    });
    const result = await validateSessionByToken(db, 'expired-token');
    expect(result).toBeNull();
  });

  it('returns { user, session } for a valid non-expired token', async () => {
    const db = createInMemoryBetterAuthAdapter();
    const user = await db.createUser({ email: 'a@example.com' });
    const session = await createSessionFor(db, user, 3600);
    const result = await validateSessionByToken(db, session.token);
    expect(result?.user.email).toBe('a@example.com');
  });
});

describe('better-auth/adapter defensive branches', () => {
  it('createUser throws when email already registered', async () => {
    const db = createInMemoryBetterAuthAdapter();
    await db.createUser({ email: 'a@example.com' });
    await expect(db.createUser({ email: 'a@example.com' })).rejects.toThrow(
      /already registered/,
    );
  });

  it('createUser defaults emailVerified to false when omitted', async () => {
    const db = createInMemoryBetterAuthAdapter();
    const user = await db.createUser({ email: 'a@example.com' });
    expect(user.emailVerified).toBe(false);
  });

  it('createUser preserves passwordHash and twoFactorSecret when provided', async () => {
    const db = createInMemoryBetterAuthAdapter();
    const user = await db.createUser({
      email: 'a@example.com',
      passwordHash: 'hash-1',
      twoFactorSecret: 'totp-1',
    });
    expect(user.passwordHash).toBe('hash-1');
    expect(user.twoFactorSecret).toBe('totp-1');
  });

  it('getUser + getUserByEmail return null for unknown values', async () => {
    const db = createInMemoryBetterAuthAdapter();
    expect(await db.getUser('unknown')).toBeNull();
    expect(await db.getUserByEmail('nobody@example.com')).toBeNull();
  });

  it('deleteUser cascades to sessions + accounts + memberships + passkeys', async () => {
    const db = createInMemoryBetterAuthAdapter();
    const user = await db.createUser({ email: 'a@example.com' });
    await db.createSession({
      id: 'sess-1',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      token: 'tok-1',
    });
    await db.deleteUser(user.id);
    expect(await db.getUser(user.id)).toBeNull();
    expect(await db.getSession('sess-1')).toBeNull();
    expect(await db.getSessionByToken('tok-1')).toBeNull();
  });

  it('deleteUser is idempotent on unknown id', async () => {
    const db = createInMemoryBetterAuthAdapter();
    await expect(db.deleteUser('nonexistent')).resolves.toBeUndefined();
  });

  it('accepts custom kind (drizzle / kysely)', () => {
    const db = createInMemoryBetterAuthAdapter('drizzle');
    expect(db.kind).toBe('drizzle');
    const db2 = createInMemoryBetterAuthAdapter('kysely');
    expect(db2.kind).toBe('kysely');
  });
});
