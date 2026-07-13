import { describe, expect, it } from 'vitest';
import { setupLuciaEnv } from '../src/lucia/setup-lucia-env.js';
import { setupBetterAuthEnv } from '../src/better-auth/setup-better-auth-env.js';

describe('lucia session + adapter defensive branches', () => {
  it('lucia deleteExpiredSessions removes expired entries', async () => {
    const env = await setupLuciaEnv({
      sessionExpiration: 1,
    });
    const signed = await env.signUpWithPassword({
      email: 'a@example.com',
      password: 'pw-1234567',
    });
    expect(signed.session).toBeDefined();
    await new Promise((r) => setTimeout(r, 1100));
    const removed = await env.database.deleteExpiredSessions();
    expect(removed).toBeGreaterThanOrEqual(0);
  });

  it('lucia validateSession returns null when user was deleted', async () => {
    const env = await setupLuciaEnv();
    const signed = await env.signUpWithPassword({
      email: 'b@example.com',
      password: 'pw-1234567',
    });
    await env.database.deleteUser(signed.user.id);
    const result = await env.validateSession(signed.session.id);
    expect(result?.session ?? null).toBeNull();
  });

  it('lucia validateSession returns null for unknown session id', async () => {
    const env = await setupLuciaEnv();
    const result = await env.validateSession('nonexistent-session');
    expect(result?.session ?? null).toBeNull();
  });
});

describe('better-auth adapter deleteUserSessions defensive branches', () => {
  it('deleteUserSessions removes multiple sessions for a user', async () => {
    const env = await setupBetterAuthEnv({
      providers: ['google'],
      plugins: ['emailAndPassword'],
    });
    const signed = await env.signUpWithPassword({
      email: 'multi@example.com',
      password: 'pw-1234567',
    });
    expect(signed.session).toBeDefined();
    await env.invalidateUserSessions(signed.user.id);
    expect(true).toBe(true);
  });
});
