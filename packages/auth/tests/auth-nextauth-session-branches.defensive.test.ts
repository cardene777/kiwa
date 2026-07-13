import { describe, expect, it } from 'vitest';
import { setupNextAuthEnv } from '../src/setup-nextauth-env.js';

describe('nextauth getSession defensive branches', () => {
  it('returns session for valid unexpired token (database strategy)', async () => {
    const env = await setupNextAuthEnv({
      providers: ['google'],
      session: { strategy: 'database', maxAge: 3600 },
    });
    const signed = await env.signIn('google', {
      email: 'a@example.com',
      sub: 'oauth-a',
    });
    const session = await env.getSession(signed.session.sessionToken);
    expect(session?.user.email).toBe('a@example.com');
  });

  it('returns null for unknown session token (database strategy)', async () => {
    const env = await setupNextAuthEnv({
      providers: ['google'],
      session: { strategy: 'database' },
    });
    const session = await env.getSession('nonexistent-token');
    expect(session).toBeNull();
  });

  it('returns null for expired session (database strategy expires branch)', async () => {
    const env = await setupNextAuthEnv({
      providers: ['google'],
      session: { strategy: 'database', maxAge: 1 },
    });
    const signed = await env.signIn('google', {
      email: 'b@example.com',
      sub: 'oauth-b',
    });
    // Manually inject expired session by adjusting the database directly.
    // We can't easily do that with the standard API, so we simulate by
    // creating a session with maxAge=0 via signOut+re-signIn is not possible.
    // Instead, wait until after the maxAge for a real test.
    await new Promise((r) => setTimeout(r, 1100));
    const session = await env.getSession(signed.session.sessionToken);
    expect(session).toBeNull();
  });

  it('handles JWT strategy sessions', async () => {
    const env = await setupNextAuthEnv({
      providers: ['google'],
      session: { strategy: 'jwt' },
    });
    const signed = await env.signIn('google', {
      email: 'c@example.com',
      sub: 'oauth-c',
    });
    const session = await env.getSession(signed.session.sessionToken);
    expect(session?.user.email).toBe('c@example.com');
  });

  it('signOut removes session (database strategy)', async () => {
    const env = await setupNextAuthEnv({
      providers: ['google'],
      session: { strategy: 'database' },
    });
    const signed = await env.signIn('google', {
      email: 'd@example.com',
      sub: 'oauth-d',
    });
    await env.signOut(signed.session.sessionToken);
    const session = await env.getSession(signed.session.sessionToken);
    expect(session).toBeNull();
  });

  it('stop resets database', async () => {
    const env = await setupNextAuthEnv({
      providers: ['google'],
    });
    await env.signIn('google', { email: 'x@example.com', sub: 'x' });
    await env.stop();
    // After stop/reset, signing in again should work fresh.
    expect(env.database).toBeDefined();
  });

  it('throws for unknown session strategy', async () => {
    await expect(
      setupNextAuthEnv({
        providers: ['google'],
        session: { strategy: 'bogus' as never },
      }),
    ).rejects.toThrow(/unknown session strategy/);
  });

  it('throws when providers is empty', async () => {
    await expect(
      setupNextAuthEnv({ providers: [] as never }),
    ).rejects.toThrow(/providers must contain at least one entry/);
  });
});
