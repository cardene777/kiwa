import { describe, expect, it } from 'vitest';
import { setupNextAuthEnv } from '../src/setup-nextauth-env.js';
import { createRlsRegistry } from '../src/supabase-advanced/rls.js';
import type { RlsPolicyContext } from '../src/supabase-advanced/types.js';

describe('setup-nextauth-env getSession expired branches', () => {
  it('database strategy returns null when session is expired', async () => {
    const env = await setupNextAuthEnv({
      providers: ['google'],
      session: { strategy: 'database' },
    });
    const { session } = await env.signIn('google');
    // Manually expire the session by rewinding its expiry
    const row = await env.database.getSessionAndUser(session.sessionToken);
    if (row) {
      row.session.expires = new Date(Date.now() - 60_000);
    }
    const result = await env.getSession(session.sessionToken);
    expect(result).toBeNull();
  });

  it('database strategy returns null when session not found', async () => {
    const env = await setupNextAuthEnv({
      providers: ['google'],
      session: { strategy: 'database' },
    });
    const result = await env.getSession('nonexistent-token');
    expect(result).toBeNull();
  });

  it('JWT strategy returns null when user was deleted after token issue', async () => {
    const env = await setupNextAuthEnv({
      providers: ['google'],
      session: { strategy: 'jwt' },
    });
    const { user, session } = await env.signIn('google');
    await env.database.deleteUser(user.id);
    const result = await env.getSession(session.sessionToken);
    expect(result).toBeNull();
  });

  it('JWT strategy returns null when sessionToken format is invalid', async () => {
    const env = await setupNextAuthEnv({
      providers: ['google'],
      session: { strategy: 'jwt' },
    });
    const result = await env.getSession('malformed-no-user-suffix');
    expect(result).toBeNull();
  });
});

const CTX_AUTH: RlsPolicyContext = {
  role: 'authenticated',
  userId: 'u1',
  appMetadata: {},
  userMetadata: {},
  jwt: {},
};

describe('supabase-advanced/rls check command matching branches', () => {
  it('policy with command=all matches any command', () => {
    const registry = createRlsRegistry();
    registry.define({
      name: 'catch-all',
      table: 't1',
      command: 'all',
      roles: ['authenticated'],
      using: () => true,
      withCheck: () => true,
    });
    const outcome = registry.check(
      { table: 't1', command: 'insert', accessToken: 'x', newRow: { a: 1 } },
      CTX_AUTH,
    );
    expect(outcome.allowed).toBe(true);
  });

  it('policy with specific command rejects non-matching command', () => {
    const registry = createRlsRegistry();
    registry.define({
      name: 'select-only',
      table: 't1',
      command: 'select',
      roles: ['authenticated'],
      using: () => true,
    });
    const outcome = registry.check(
      { table: 't1', command: 'insert', accessToken: 'x', newRow: { a: 1 } },
      CTX_AUTH,
    );
    expect(outcome.allowed).toBe(false);
  });

  it('policy with multiple roles matches any listed role', () => {
    const registry = createRlsRegistry();
    registry.define({
      name: 'multi-role',
      table: 't1',
      command: 'select',
      roles: ['authenticated', 'anon'],
      using: () => true,
    });
    const outcome = registry.check(
      { table: 't1', command: 'select', accessToken: 'x', row: { a: 1 } },
      CTX_AUTH,
    );
    expect(outcome.allowed).toBe(true);
  });
});
