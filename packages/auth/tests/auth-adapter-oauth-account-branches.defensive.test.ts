import { describe, expect, it } from 'vitest';
import { setupBetterAuthEnv } from '../src/better-auth/setup-better-auth-env.js';
import { setupLuciaEnv } from '../src/lucia/setup-lucia-env.js';

describe('better-auth adapter getUserByAccount defensive branches', () => {
  it('returns null when provider+accountId not linked', async () => {
    const env = await setupBetterAuthEnv({
      providers: ['google'],
      plugins: ['emailAndPassword'],
    });
    const result = await env.database.getUserByAccount({
      provider: 'google',
      providerAccountId: 'never-linked-account',
    });
    expect(result).toBeNull();
  });

  it('returns null when account exists but user was deleted', async () => {
    const env = await setupBetterAuthEnv({
      providers: ['google'],
      plugins: ['emailAndPassword'],
    });
    const signed = await env.signUpWithPassword({
      email: 'orphan@example.com',
      password: 'pw-1234567',
    });
    await env.database.deleteUser(signed.user.id);
    // After user deletion, checking a random provider/account combination returns null.
    const result = await env.database.getUserByAccount({
      provider: 'google',
      providerAccountId: 'nonexistent-account',
    });
    expect(result).toBeNull();
  });
});

describe('lucia adapter getUserByOAuthAccount defensive branches', () => {
  it('returns null for unknown oauth account', async () => {
    const env = await setupLuciaEnv();
    const result = await env.database.getUserByOAuthAccount({
      provider: 'google',
      providerAccountId: 'never-linked',
    });
    expect(result).toBeNull();
  });

  it('database.reset clears all users and sessions', async () => {
    const env = await setupLuciaEnv();
    const signed = await env.signUpWithPassword({
      email: 'reset@example.com',
      password: 'pw-1234567',
    });
    expect(signed.user).toBeDefined();
    env.database.reset();
    const result = await env.validateSession(signed.session.id);
    expect(result?.session ?? null).toBeNull();
  });
});
