import { afterEach, describe, expect, it } from 'vitest';
import { setupSupabaseAuthEnv, type SupabaseAuthTestEnv } from '@kiwa/auth';
import {
  completeOAuthCallback,
  completeSignupFlow,
  requireAuthenticatedUser,
} from '../src/signup-flow.js';

const envs: SupabaseAuthTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function makeEnv(): Promise<SupabaseAuthTestEnv> {
  const env = await setupSupabaseAuthEnv({
    projectUrl: 'https://poc.supabase.co',
  });
  envs.push(env);
  return env;
}

describe('Supabase Auth core PoC — signup flow', () => {
  it('T-SAC-POC-001 signUp + magic link + verifyOtp yields an authenticated session', async () => {
    const env = await makeEnv();
    const result = await completeSignupFlow(env, {
      email: 'alice@example.test',
      password: 'strong-secret',
      userMetadata: { firstName: 'Alice' },
    });
    expect(result.userId).toBeTypeOf('string');
    expect(result.accessToken).toBeTypeOf('string');
    expect(result.refreshToken).toBeTypeOf('string');
    const claims = await env.verifyToken(result.accessToken);
    expect(claims.email).toBe('alice@example.test');
  });

  it('T-SAC-POC-002 signup flow surfaces user_metadata provided at signUp', async () => {
    const env = await makeEnv();
    await completeSignupFlow(env, {
      email: 'bob@example.test',
      password: 'strong',
      userMetadata: { firstName: 'Bob', plan: 'pro' },
    });
    const user = await env.admin.getUserByEmail('bob@example.test');
    expect(user?.userMetadata).toEqual({ firstName: 'Bob', plan: 'pro' });
  });
});

describe('Supabase Auth core PoC — OAuth PKCE callback', () => {
  it('T-SAC-POC-003 OAuth callback exchanges code + verifier for a session', async () => {
    const env = await makeEnv();
    const authUrl = await env.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: 'https://example.test/callback' },
    });
    const result = await completeOAuthCallback(env, {
      code: authUrl.code,
      codeVerifier: authUrl.codeVerifier,
    });
    const claims = await env.verifyToken(result.accessToken);
    expect(claims.amr[0]?.method).toBe('oauth:github');
  });
});

describe('Supabase Auth core PoC — session verification middleware', () => {
  it('T-SAC-POC-004 requireAuthenticatedUser returns claims for a valid token', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [{ email: 'alice@example.test', password: 'x', emailConfirmed: true }],
    });
    envs.push(env);
    const { session } = await env.auth.signInWithPassword({
      email: 'alice@example.test',
      password: 'x',
    });
    const user = await requireAuthenticatedUser(env, session.accessToken);
    expect(user?.email).toBe('alice@example.test');
  });

  it('T-SAC-POC-005 requireAuthenticatedUser returns null for a tampered token', async () => {
    const env = await makeEnv();
    const user = await requireAuthenticatedUser(env, 'not.a.valid.token');
    expect(user).toBeNull();
  });

  it('T-SAC-POC-006 requireAuthenticatedUser returns null for a token from a different env', async () => {
    const env1 = await setupSupabaseAuthEnv({
      users: [{ email: 'a@example.test', password: 'x', emailConfirmed: true }],
    });
    const env2 = await setupSupabaseAuthEnv({});
    envs.push(env1, env2);
    const { session } = await env1.auth.signInWithPassword({
      email: 'a@example.test',
      password: 'x',
    });
    const result = await requireAuthenticatedUser(env2, session.accessToken);
    expect(result).toBeNull();
  });
});

describe('Supabase Auth core PoC — session refresh + revocation', () => {
  it('T-SAC-POC-007 refresh rotates tokens and invalidates the old refresh token', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [{ email: 'alice@example.test', password: 'x', emailConfirmed: true }],
    });
    envs.push(env);
    const { session: first } = await env.auth.signInWithPassword({
      email: 'alice@example.test',
      password: 'x',
    });
    await new Promise((r) => setTimeout(r, 1100));
    const refreshed = await env.auth.refreshSession({ refreshToken: first.refreshToken });
    expect(refreshed.session.accessToken).not.toBe(first.accessToken);
    // Old refresh token no longer works.
    await expect(
      env.auth.refreshSession({ refreshToken: first.refreshToken }),
    ).rejects.toThrow(/invalid refresh token/);
  }, 3000);

  it('T-SAC-POC-008 signOut prevents future token verification via getUser', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [{ email: 'alice@example.test', password: 'x', emailConfirmed: true }],
    });
    envs.push(env);
    const { session } = await env.auth.signInWithPassword({
      email: 'alice@example.test',
      password: 'x',
    });
    await env.auth.signOut({ accessToken: session.accessToken });
    await expect(env.auth.getUser(session.accessToken)).rejects.toThrow(/session revoked/);
  });
});
