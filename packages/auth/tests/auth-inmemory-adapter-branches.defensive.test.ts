import { describe, expect, it } from 'vitest';
import { createInMemoryAdapter } from '../src/adapter.js';

describe('createInMemoryAdapter defensive branches', () => {
  it('createUser without emailVerified skips the emailVerified branch', async () => {
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({ email: 'a@example.com' });
    expect(user.emailVerified).toBeUndefined();
  });

  it('updateUser without email in patch keeps current email index untouched', async () => {
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({
      email: 'b@example.com',
      name: 'Alice',
    });
    const updated = await adapter.updateUser({ id: user.id, name: 'Alice2' });
    expect(updated.email).toBe('b@example.com');
    expect(updated.name).toBe('Alice2');
    const byEmail = await adapter.getUserByEmail('b@example.com');
    expect(byEmail?.id).toBe(user.id);
  });

  it('updateUser with same email does not re-index (patch.email === current.email branch)', async () => {
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({ email: 'c@example.com' });
    const updated = await adapter.updateUser({
      id: user.id,
      email: 'c@example.com',
      name: 'renamed',
    });
    expect(updated.email).toBe('c@example.com');
  });

  it('deleteUser succeeds when user + accounts + sessions exist', async () => {
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({ email: 'd@example.com' });
    await adapter.linkAccount({
      provider: 'google',
      providerAccountId: 'gid-1',
      userId: user.id,
      type: 'oauth',
    });
    await adapter.createSession({
      sessionToken: 'tok-1',
      userId: user.id,
      expires: new Date(Date.now() + 60_000),
    });
    await adapter.deleteUser(user.id);
    expect(await adapter.getUser(user.id)).toBeNull();
    expect(await adapter.getUserByEmail('d@example.com')).toBeNull();
    expect(
      await adapter.getUserByAccount({
        provider: 'google',
        providerAccountId: 'gid-1',
      }),
    ).toBeNull();
  });

  it('deleteUser is a no-op when id is unknown', async () => {
    const adapter = createInMemoryAdapter();
    await expect(
      adapter.deleteUser('user-unknown'),
    ).resolves.toBeUndefined();
  });

  it('getSessionAndUser returns null when session token is unknown', async () => {
    const adapter = createInMemoryAdapter();
    expect(await adapter.getSessionAndUser('nonexistent-token')).toBeNull();
  });

  it('getSessionAndUser returns null when session exists but user was deleted', async () => {
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({ email: 'e@example.com' });
    await adapter.createSession({
      sessionToken: 'tok-e',
      userId: user.id,
      expires: new Date(Date.now() + 60_000),
    });
    await adapter.deleteUser(user.id);
    // deleteUser also removed session, so ensure a session-but-no-user case
    // by creating a session referencing a nonexistent user via a separate token.
    await adapter.createSession({
      sessionToken: 'tok-orphan',
      userId: 'user-doesnotexist',
      expires: new Date(Date.now() + 60_000),
    });
    expect(await adapter.getSessionAndUser('tok-orphan')).toBeNull();
  });

  it('getSessionAndUser returns session + user for a valid token', async () => {
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({ email: 'f@example.com' });
    await adapter.createSession({
      sessionToken: 'tok-valid',
      userId: user.id,
      expires: new Date(Date.now() + 60_000),
    });
    const result = await adapter.getSessionAndUser('tok-valid');
    expect(result?.user.id).toBe(user.id);
    expect(result?.session.sessionToken).toBe('tok-valid');
  });
});
