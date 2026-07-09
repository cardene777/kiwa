import { afterEach, describe, expect, it } from 'vitest';
import {
  generateTotpCode,
  setupBetterAuthEnv,
  type BetterAuthTestEnv,
} from '@kiwa-lab/auth';
import { createProtectedRoute, type ProtectedProfile } from '../src/route.js';

const envs: BetterAuthTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

async function callProtected(
  env: BetterAuthTestEnv,
  token: string,
): Promise<{
  status: number;
  body: ProtectedProfile | { error: string };
}> {
  const handler = createProtectedRoute(env);
  const res = await handler(
    new Request('http://kiwa.test/api/me', {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }),
  );
  const body = (await res.json()) as ProtectedProfile | { error: string };
  return { status: res.status, body };
}

describe('better-auth PoC — password auth on prisma adapter', () => {
  it('T-BA-001 signs up and returns the user profile through the protected route', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    const signed = await env.signUpWithPassword({
      email: 'alice@example.test',
      password: 'correct-horse-battery-staple',
    });
    const res = await callProtected(env, signed.session.token);
    expect(res.status).toBe(200);
    expect((res.body as ProtectedProfile).email).toBe('alice@example.test');
    expect((res.body as ProtectedProfile).emailVerified).toBe(false);
  });

  it('T-BA-002 rejects a request without a bearer token', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    const res = await callProtected(env, '');
    expect(res.status).toBe(401);
    expect((res.body as { error: string }).error).toBe('missing token');
  });
});

describe('better-auth PoC — magic link flow', () => {
  it('T-BA-003 sends a magic link, consumes it, and the resulting session grants access', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['emailAndPassword', 'magicLink'],
    });
    envs.push(env);
    const { token } = await env.sendMagicLink({ email: 'ml@example.test' });
    const signed = await env.consumeMagicLink({
      email: 'ml@example.test',
      token,
    });
    const res = await callProtected(env, signed.session.token);
    expect(res.status).toBe(200);
    // Magic-link sign-in marks the email as verified as a side-effect of the click.
    expect((res.body as ProtectedProfile).emailVerified).toBe(true);
  });
});

describe('better-auth PoC — 2FA gated protected route', () => {
  it('T-BA-004 2FA-enrolled user completes a TOTP challenge before hitting the protected route', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['emailAndPassword', 'twoFactor'],
    });
    envs.push(env);
    const signed = await env.signUpWithPassword({
      email: 'tfa@example.test',
      password: 'p',
    });
    const { secret } = await env.enrollTwoFactor({ userId: signed.user.id });
    // Consumer computes the current code — mirrors what an authenticator app emits.
    const code = generateTotpCode(secret);
    const ok = await env.verifyTwoFactorCode({ userId: signed.user.id, code });
    expect(ok).toBe(true);
    const res = await callProtected(env, signed.session.token);
    expect(res.status).toBe(200);
  });
});

describe('better-auth PoC — social sign-in flows', () => {
  it('T-BA-005 google sign-in creates a verified-email user and the session grants access', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    const signed = await env.signInWithOAuth('google', {
      sub: 'g-42',
      email: 'carol@example.test',
    });
    const res = await callProtected(env, signed.session.token);
    expect(res.status).toBe(200);
    expect((res.body as ProtectedProfile).emailVerified).toBe(true);
  });

  it('T-BA-006 github sign-in reuses a password user with the same email', async () => {
    const env = await setupBetterAuthEnv();
    envs.push(env);
    const pwd = await env.signUpWithPassword({
      email: 'dave@example.test',
      password: 'p1234567',
    });
    const oauth = await env.signInWithOAuth('github', {
      sub: 'gh-7',
      email: 'dave@example.test',
    });
    expect(oauth.user.id).toBe(pwd.user.id);
  });
});

describe('better-auth PoC — adapter compat matrix', () => {
  it('T-BA-007 drizzle adapter kind produces the same happy-path shape as prisma', async () => {
    const env = await setupBetterAuthEnv({ database: { kind: 'drizzle' } });
    envs.push(env);
    expect(env.database.kind).toBe('drizzle');
    const signed = await env.signInWithOAuth('google', {
      sub: 'g-99',
      email: 'grace@example.test',
    });
    const res = await callProtected(env, signed.session.token);
    expect(res.status).toBe(200);
    expect((res.body as ProtectedProfile).email).toBe('grace@example.test');
  });

  it('T-BA-008 kysely adapter kind exposes the same operation surface end-to-end', async () => {
    const env = await setupBetterAuthEnv({ database: { kind: 'kysely' } });
    envs.push(env);
    expect(env.database.kind).toBe('kysely');
    const signed = await env.signUpWithPassword({
      email: 'henry@example.test',
      password: 'p',
    });
    // invalidateSession clears the token; the next request must be rejected.
    await env.invalidateSession(signed.session.token);
    const res = await callProtected(env, signed.session.token);
    expect(res.status).toBe(401);
  });
});
