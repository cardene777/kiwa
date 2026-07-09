import { afterEach, describe, expect, it } from 'vitest';
import { setupNextAuthEnv, type NextAuthTestEnv } from '@kiwa-lab/auth';
import { createProtectedRoute, type ProtectedProfile } from '../src/route.js';

const envs: NextAuthTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function callProtected(
  env: NextAuthTestEnv,
  token: string,
): Promise<{ status: number; body: ProtectedProfile | { error: string } }> {
  const handler = createProtectedRoute(env);
  const res = await handler(
    new Request('http://kiwa.test/api/me', {
      headers: token ? { 'x-session-token': token } : {},
    }),
  );
  const body = (await res.json()) as ProtectedProfile | { error: string };
  return { status: res.status, body };
}

describe('auth PoC — Google provider (jwt strategy)', () => {
  it('T-AUTH-001 signs in and returns the user profile from a protected route', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    const signed = await env.signIn('google', { email: 'alice@example.test', name: 'Alice' });
    const res = await callProtected(env, signed.session.sessionToken);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: 'alice@example.test', name: 'Alice' });
  });

  it('T-AUTH-002 rejects a request without a session token', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    const res = await callProtected(env, '');
    expect(res.status).toBe(401);
    expect((res.body as { error: string }).error).toBe('missing session token');
  });
});

describe('auth PoC — GitHub provider (jwt strategy)', () => {
  it('T-AUTH-003 second sign-in reuses the same user row', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    const first = await env.signIn('github', { sub: 'gh-1', email: 'bob@example.test' });
    const second = await env.signIn('github', { sub: 'gh-1', email: 'bob@example.test' });
    expect(second.user.id).toBe(first.user.id);
  });
});

describe('auth PoC — Email provider (magic link)', () => {
  it('T-AUTH-004 magic link requires an email', async () => {
    const env = await setupNextAuthEnv({ providers: ['email'] });
    envs.push(env);
    await expect(env.signIn('email')).rejects.toThrow(/email/);
  });

  it('T-AUTH-005 magic link sign-in issues a valid session token', async () => {
    const env = await setupNextAuthEnv({ providers: ['email'] });
    envs.push(env);
    const signed = await env.signIn('email', { email: 'carol@example.test' });
    const res = await callProtected(env, signed.session.sessionToken);
    expect(res.status).toBe(200);
    expect((res.body as ProtectedProfile).email).toBe('carol@example.test');
  });
});

describe('auth PoC — database session strategy', () => {
  it('T-AUTH-006 signOut invalidates the session token', async () => {
    const env = await setupNextAuthEnv({ session: { strategy: 'database' } });
    envs.push(env);
    const signed = await env.signIn('google', { email: 'dave@example.test' });
    const before = await callProtected(env, signed.session.sessionToken);
    expect(before.status).toBe(200);
    await env.signOut(signed.session.sessionToken);
    const after = await callProtected(env, signed.session.sessionToken);
    expect(after.status).toBe(401);
  });

  it('T-AUTH-007 protected route rejects a fabricated token', async () => {
    const env = await setupNextAuthEnv({ session: { strategy: 'database' } });
    envs.push(env);
    const res = await callProtected(env, 'database-session-999999');
    expect(res.status).toBe(401);
  });
});

describe('auth PoC — database adapter contract', () => {
  it('T-AUTH-008 sign-in persists the user and account rows to the injected adapter', async () => {
    const env = await setupNextAuthEnv();
    envs.push(env);
    const signed = await env.signIn('google', { sub: 'g-42', email: 'eva@example.test' });
    const account = await env.database.getUserByAccount({
      provider: 'google',
      providerAccountId: 'g-42',
    });
    expect(account?.id).toBe(signed.user.id);
  });
});
