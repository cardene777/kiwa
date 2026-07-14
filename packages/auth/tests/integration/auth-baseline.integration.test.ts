import { describe, expect, it } from 'vitest';
import { createInMemoryAdapter, issueSession, upsertUserFromProfile } from '../../src/index.js';

const STRATEGY = 'database' as const;
const MAX_AGE = 3600;

/**
 * auth integration domain test — real API (createInMemoryAdapter + issueSession +
 * upsertUserFromProfile) の workflow を end-to-end で assert する。
 */
describe('auth integration — upsertUserFromProfile + issueSession workflow', () => {
  it('T-INT-D-001 profile → upsertUser → issueSession の end-to-end', async () => {
    const adapter = createInMemoryAdapter();
    const profile = {
      provider: 'github' as const,
      providerAccountId: 'gh-user-1',
      email: 'user1@example.com',
      name: 'Test User 1',
    };
    const user = await upsertUserFromProfile(adapter, profile);
    expect(user.email).toBe('user1@example.com');

    const session = await issueSession(adapter, user, STRATEGY, MAX_AGE);
    expect(session.sessionToken.length).toBeGreaterThan(0);
    expect(session.expires.getTime()).toBeGreaterThan(Date.now());
  });

  it('T-INT-D-002 upsertUserFromProfile は同 profile で idempotent (2 回目は既存 user)', async () => {
    const adapter = createInMemoryAdapter();
    const profile = {
      provider: 'google' as const,
      providerAccountId: 'g-user-2',
      email: 'user2@example.com',
      name: 'Test User 2',
    };
    const first = await upsertUserFromProfile(adapter, profile);
    const second = await upsertUserFromProfile(adapter, profile);
    expect(first.id).toBe(second.id);
  });

  it('T-INT-D-003 issueSession は複数 call で異なる sessionToken', async () => {
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({ email: 'multi@example.com', emailVerified: undefined });
    const s1 = await issueSession(adapter, user, STRATEGY, MAX_AGE);
    const s2 = await issueSession(adapter, user, STRATEGY, MAX_AGE);
    expect(s1.sessionToken).not.toBe(s2.sessionToken);
  });

  it('T-INT-D-004 issueSession + getSessionAndUser で session 復元', async () => {
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({ email: 'restore@example.com', emailVerified: undefined });
    const session = await issueSession(adapter, user, STRATEGY, MAX_AGE);
    const restored = await adapter.getSessionAndUser(session.sessionToken);
    expect(restored?.user.id).toBe(user.id);
    expect(restored?.session.expires.getTime()).toBeGreaterThan(Date.now());
  });

  it('T-INT-D-005 upsertUserFromProfile の profile を差し替えても user は 1 つ', async () => {
    const adapter = createInMemoryAdapter();
    const profile1 = {
      provider: 'github' as const,
      providerAccountId: 'gh-user-3',
      email: 'user3@example.com',
      name: 'User 3',
    };
    const user1 = await upsertUserFromProfile(adapter, profile1);
    const profile2 = { ...profile1, name: 'Updated User 3' };
    const user2 = await upsertUserFromProfile(adapter, profile2);
    expect(user1.id).toBe(user2.id);
  });
});
