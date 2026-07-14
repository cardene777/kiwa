import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  assertToolCalledWith,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { createInMemoryAdapter, issueSession, upsertUserFromProfile } from '../../src/index.js';

const STRATEGY = 'database' as const;
const MAX_AGE = 3600;

/**
 * auth skill domain test — auth の主要 skill flow (OAuth login / session revoke) を
 * spy 経路で assert する。
 */
describe('auth skill — OAuth login / session issue skill flow', () => {
  it('T-SKL-D-001 OAuth login flow で upsertUser + issueSession が順序で発火', async () => {
    const spy = createToolSpy();
    const adapter = createInMemoryAdapter();
    const profile = {
      provider: 'github' as const,
      providerAccountId: 'gh-skill-1',
      email: 'skill1@example.com',
      name: 'Skill 1',
    };
    const user = await upsertUserFromProfile(adapter, profile);
    spy.record('upsertUserFromProfile', JSON.stringify({ provider: 'github' }));
    const session = await issueSession(adapter, user, STRATEGY, MAX_AGE);
    spy.record('issueSession', JSON.stringify({ userId: user.id }));

    assertToolCalled(spy, 'upsertUserFromProfile');
    assertToolCalled(spy, 'issueSession');
    assertToolCallOrder(spy, ['upsertUserFromProfile', 'issueSession']);
    expect(session.sessionToken.length).toBeGreaterThan(0);
  });

  it('T-SKL-D-002 session revoke skill flow (issueSession + deleteSession)', async () => {
    const spy = createToolSpy();
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({ email: 'revoke@example.com', emailVerified: undefined });
    const session = await issueSession(adapter, user, STRATEGY, MAX_AGE);
    spy.record('issueSession', JSON.stringify({ userId: user.id }));
    await adapter.deleteSession(session.sessionToken);
    spy.record('deleteSession', JSON.stringify({ token: session.sessionToken }));

    assertToolCalledWith(spy, 'deleteSession', { token: session.sessionToken });
    assertToolCallOrder(spy, ['issueSession', 'deleteSession']);
    const bundle = await adapter.getSessionAndUser(session.sessionToken);
    expect(bundle).toBeNull();
  });

  it('T-SKL-D-003 multi login skill flow (times=2 issueSession)', async () => {
    const spy = createToolSpy();
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({ email: 'multi-skill@example.com', emailVerified: undefined });
    await issueSession(adapter, user, STRATEGY, MAX_AGE);
    spy.record('issueSession', '{}');
    await issueSession(adapter, user, STRATEGY, MAX_AGE);
    spy.record('issueSession', '{}');

    assertToolCalled(spy, 'issueSession', { times: 2 });
  });

  it('T-SKL-D-004 OAuth link skill flow (upsertUser + getUserByAccount)', async () => {
    const spy = createToolSpy();
    const adapter = createInMemoryAdapter();
    const profile = {
      provider: 'google' as const,
      providerAccountId: 'g-skill-4',
      email: 'skill4@example.com',
      name: 'Skill 4',
    };
    const user = await upsertUserFromProfile(adapter, profile);
    spy.record('upsertUserFromProfile', JSON.stringify({ provider: 'google' }));
    const found = await adapter.getUserByAccount({
      provider: 'google',
      providerAccountId: 'g-skill-4',
    });
    spy.record('getUserByAccount', JSON.stringify({ provider: 'google' }));

    assertToolCalled(spy, 'upsertUserFromProfile');
    assertToolCalled(spy, 'getUserByAccount');
    expect(found?.id).toBe(user.id);
  });

  it('T-SKL-D-005 session round-trip skill flow (createUser + issueSession + getSessionAndUser)', async () => {
    const spy = createToolSpy();
    const adapter = createInMemoryAdapter();
    const user = await adapter.createUser({ email: 'pw@example.com', emailVerified: undefined });
    spy.record('createUser', JSON.stringify({ email: 'pw@example.com' }));

    const session = await issueSession(adapter, user, STRATEGY, MAX_AGE);
    spy.record('issueSession', JSON.stringify({ userId: user.id }));
    const bundle = await adapter.getSessionAndUser(session.sessionToken);
    spy.record('getSessionAndUser', JSON.stringify({ token: session.sessionToken }));

    assertToolCallOrder(spy, ['createUser', 'issueSession', 'getSessionAndUser']);
    expect(bundle?.user.id).toBe(user.id);
  });
});
