import { describe, expect, it } from 'vitest';
import { createInMemoryBetterAuthAdapter } from '../src/better-auth/adapter.js';

describe('better-auth/adapter additional defensive branches', () => {
  it('createUser omits passwordHash when input has undefined passwordHash', async () => {
    const db = createInMemoryBetterAuthAdapter();
    const user = await db.createUser({ email: 'a@example.com' });
    expect(user.passwordHash).toBeUndefined();
  });

  it('createUser omits twoFactorSecret when input has undefined twoFactorSecret', async () => {
    const db = createInMemoryBetterAuthAdapter();
    const user = await db.createUser({ email: 'a@example.com' });
    expect(user.twoFactorSecret).toBeUndefined();
  });

  it('createUser preserves emailVerified default false when omitted', async () => {
    const db = createInMemoryBetterAuthAdapter();
    const user = await db.createUser({ email: 'a@example.com' });
    expect(user.emailVerified).toBe(false);
  });

  it('createUser preserves emailVerified=true when explicitly set', async () => {
    const db = createInMemoryBetterAuthAdapter();
    const user = await db.createUser({ email: 'a@example.com', emailVerified: true });
    expect(user.emailVerified).toBe(true);
  });

  it('deleteSession is a no-op when session id is unknown', async () => {
    const db = createInMemoryBetterAuthAdapter();
    await expect(db.deleteSession('nonexistent')).resolves.toBeUndefined();
  });

  it('deleteUserSessions removes only sessions belonging to that user', async () => {
    const db = createInMemoryBetterAuthAdapter();
    const u1 = await db.createUser({ email: 'a@example.com' });
    const u2 = await db.createUser({ email: 'b@example.com' });
    await db.createSession({
      id: 's1',
      userId: u1.id,
      expiresAt: new Date(Date.now() + 60_000),
      token: 't1',
    });
    await db.createSession({
      id: 's2',
      userId: u2.id,
      expiresAt: new Date(Date.now() + 60_000),
      token: 't2',
    });
    await db.deleteUserSessions(u1.id);
    expect(await db.getSession('s1')).toBeNull();
    expect(await db.getSession('s2')).not.toBeNull();
  });

  it('deleteUser cascades to passkeys entries owned by that user', async () => {
    const db = createInMemoryBetterAuthAdapter();
    const u1 = await db.createUser({ email: 'a@example.com' });
    const u2 = await db.createUser({ email: 'b@example.com' });
    // Directly add passkey rows via adapter method
    if ('createPasskey' in db) {
      await (db as unknown as { createPasskey: (p: unknown) => Promise<unknown> }).createPasskey({
        id: 'p1',
        userId: u1.id,
        publicKey: 'pk-1',
      });
      await (db as unknown as { createPasskey: (p: unknown) => Promise<unknown> }).createPasskey({
        id: 'p2',
        userId: u2.id,
        publicKey: 'pk-2',
      });
    }
    await db.deleteUser(u1.id);
    expect(await db.getUser(u1.id)).toBeNull();
    // u2 remains untouched
    expect(await db.getUser(u2.id)).not.toBeNull();
  });
});
