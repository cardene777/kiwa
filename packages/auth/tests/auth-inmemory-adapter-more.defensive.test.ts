import { describe, expect, it } from 'vitest';
import { createInMemoryAdapter } from '../src/adapter.js';

describe('createInMemoryAdapter additional defensive branches', () => {
  it('createUser with name preserves name field', async () => {
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({
      email: 'a@example.com',
      name: 'Alice',
    });
    expect(user.name).toBe('Alice');
  });

  it('createUser with emailVerified preserves flag', async () => {
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({
      email: 'b@example.com',
      emailVerified: new Date('2026-07-13'),
    });
    expect(user.emailVerified).toBeDefined();
  });

  it('updateUser email change without value in patch keeps index intact', async () => {
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({ email: 'c@example.com' });
    // patch.email undefined branch — no reindex
    const updated = await adapter.updateUser({
      id: user.id,
      name: 'Bob',
    });
    expect(updated.name).toBe('Bob');
    const byEmail = await adapter.getUserByEmail('c@example.com');
    expect(byEmail?.id).toBe(user.id);
  });

  it('updateSession returns null when session unknown', async () => {
    const adapter = createInMemoryAdapter();
    const result = await adapter.updateSession({
      sessionToken: 'nonexistent',
      expires: new Date(Date.now() + 60_000),
    });
    expect(result).toBeNull();
  });

  it('updateSession updates existing session fields', async () => {
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({ email: 'd@example.com' });
    const original = new Date(Date.now() + 60_000);
    await adapter.createSession({
      sessionToken: 'tok-1',
      userId: user.id,
      expires: original,
    });
    const newExpires = new Date(Date.now() + 120_000);
    const updated = await adapter.updateSession({
      sessionToken: 'tok-1',
      expires: newExpires,
    });
    expect(updated?.expires.getTime()).toBe(newExpires.getTime());
  });

  it('deleteSession is a no-op for unknown token', async () => {
    const adapter = createInMemoryAdapter();
    await expect(
      adapter.deleteSession('nonexistent'),
    ).resolves.toBeUndefined();
  });

  it('createVerificationToken + useVerificationToken round trip', async () => {
    const adapter = createInMemoryAdapter();
    const token = {
      identifier: 'user@example.com',
      token: 'verify-token-1',
      expires: new Date(Date.now() + 60_000),
    };
    await adapter.createVerificationToken(token);
    const used = await adapter.useVerificationToken({
      identifier: token.identifier,
      token: token.token,
    });
    expect(used?.token).toBe('verify-token-1');
  });

  it('useVerificationToken returns null for unknown token', async () => {
    const adapter = createInMemoryAdapter();
    const result = await adapter.useVerificationToken({
      identifier: 'x@example.com',
      token: 'nonexistent',
    });
    expect(result).toBeNull();
  });
});
