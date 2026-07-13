import { describe, expect, it } from 'vitest';
import { createInMemoryLuciaAdapter } from '../src/lucia/adapter.js';
import { createInMemoryBetterAuthAdapter } from '../src/better-auth/adapter.js';

describe('lucia/adapter updateSession + getUserByOAuthAccount branches', () => {
  it('updateSession returns null when session id is unknown', async () => {
    const db = createInMemoryLuciaAdapter();
    const result = await db.updateSession({
      id: 'nonexistent',
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    expect(result).toBeNull();
  });

  it('updateSession patches existing session and returns updated shape', async () => {
    const db = createInMemoryLuciaAdapter();
    const user = await db.createUser({ email: 'a@example.com' });
    await db.createSession({
      id: 's1',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      fresh: false,
    });
    const updated = await db.updateSession({
      id: 's1',
      expiresAt: new Date(Date.now() + 120_000),
    } as never);
    expect(updated).not.toBeNull();
    expect(updated?.id).toBe('s1');
  });

  it('getUserByOAuthAccount returns null when account not linked', async () => {
    const db = createInMemoryLuciaAdapter();
    const user = await db.getUserByOAuthAccount({
      provider: 'google',
      providerAccountId: 'nonexistent',
    });
    expect(user).toBeNull();
  });

  it('getUserByOAuthAccount returns user when account linked', async () => {
    const db = createInMemoryLuciaAdapter();
    const user = await db.createUser({ email: 'a@example.com' });
    await db.linkOAuthAccount({
      userId: user.id,
      provider: 'google',
      providerAccountId: 'sub-1',
    } as never);
    const found = await db.getUserByOAuthAccount({
      provider: 'google',
      providerAccountId: 'sub-1',
    });
    expect(found?.id).toBe(user.id);
  });
});

describe('better-auth/adapter updateUser email index rebuild branches', () => {
  it('updateUser throws when id is unknown', async () => {
    const db = createInMemoryBetterAuthAdapter();
    await expect(
      db.updateUser({ id: 'nonexistent', emailVerified: true }),
    ).rejects.toThrow(/unknown id/);
  });

  it('updateUser rebuilds email index when email is patched', async () => {
    const db = createInMemoryBetterAuthAdapter();
    const user = await db.createUser({ email: 'a@example.com' });
    await db.updateUser({ id: user.id, email: 'b@example.com' });
    expect(await db.getUserByEmail('a@example.com')).toBeNull();
    expect((await db.getUserByEmail('b@example.com'))?.id).toBe(user.id);
  });

  it('updateUser preserves email index when email is unchanged', async () => {
    const db = createInMemoryBetterAuthAdapter();
    const user = await db.createUser({ email: 'a@example.com' });
    await db.updateUser({ id: user.id, emailVerified: true });
    expect((await db.getUserByEmail('a@example.com'))?.id).toBe(user.id);
  });
});
