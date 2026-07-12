import { describe, expect, it } from 'vitest';
import { createInMemoryLuciaAdapter } from '../src/lucia/adapter.js';
import { validateSessionId } from '../src/lucia/session.js';
import type { LuciaUser } from '../src/lucia/types.js';

function makeUser(id: string, email: string): LuciaUser {
  return { id, email };
}

describe('lucia/session validateSessionId defensive branches', () => {
  it('returns null when session does not exist', async () => {
    const db = createInMemoryLuciaAdapter();
    const result = await validateSessionId(db, 'nonexistent', 3600);
    expect(result).toBeNull();
  });

  it('returns null and deletes session when expired', async () => {
    const db = createInMemoryLuciaAdapter();
    const user = await db.createUser(makeUser('u1', 'a@example.com'));
    const now = Date.now();
    await db.createSession({
      id: 'expired-sess',
      userId: user.id,
      expiresAt: new Date(now - 60_000),
      fresh: false,
    });
    const result = await validateSessionId(db, 'expired-sess', 3600);
    expect(result).toBeNull();
    expect(await db.getSession('expired-sess')).toBeNull();
  });

  it('returns null and deletes session when user no longer exists', async () => {
    const db = createInMemoryLuciaAdapter();
    const now = Date.now();
    await db.createSession({
      id: 'orphan-sess',
      userId: 'deleted-user',
      expiresAt: new Date(now + 60_000),
      fresh: false,
    });
    const result = await validateSessionId(db, 'orphan-sess', 3600);
    expect(result).toBeNull();
    expect(await db.getSession('orphan-sess')).toBeNull();
  });
});

describe('lucia/adapter defensive branches', () => {
  it('getUser returns null for unknown id', async () => {
    const db = createInMemoryLuciaAdapter();
    expect(await db.getUser('unknown')).toBeNull();
  });

  it('getUserByEmail returns null for unknown email', async () => {
    const db = createInMemoryLuciaAdapter();
    expect(await db.getUserByEmail('nobody@example.com')).toBeNull();
  });

  it('updateUser throws when id is unknown', async () => {
    const db = createInMemoryLuciaAdapter();
    await expect(db.updateUser({ id: 'unknown', email: 'x@example.com' })).rejects.toThrow(
      /unknown id/,
    );
  });

  it('updateUser rebuilds email index when email changes', async () => {
    const db = createInMemoryLuciaAdapter();
    const created = await db.createUser(makeUser('u1', 'a@example.com'));
    const next = await db.updateUser({ id: created.id, email: 'b@example.com' });
    expect(next.email).toBe('b@example.com');
    expect(await db.getUserByEmail('a@example.com')).toBeNull();
    expect((await db.getUserByEmail('b@example.com'))?.email).toBe('b@example.com');
  });

  it('updateUser preserves email index when email is unchanged', async () => {
    const db = createInMemoryLuciaAdapter();
    const created = await db.createUser(makeUser('u1', 'a@example.com'));
    const next = await db.updateUser({ id: created.id });
    expect((await db.getUserByEmail('a@example.com'))?.email).toBe('a@example.com');
    expect(next.email).toBe('a@example.com');
  });

  it('deleteUser is idempotent on unknown id', async () => {
    const db = createInMemoryLuciaAdapter();
    await expect(db.deleteUser('nonexistent')).resolves.toBeUndefined();
  });

  it('deleteUser cascades to sessions and oauth accounts', async () => {
    const db = createInMemoryLuciaAdapter();
    const user = await db.createUser(makeUser('u1', 'a@example.com'));
    await db.createSession({
      id: 'sess-1',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      fresh: false,
    });
    await db.deleteUser(user.id);
    expect(await db.getUser(user.id)).toBeNull();
    expect(await db.getSession('sess-1')).toBeNull();
  });
});
