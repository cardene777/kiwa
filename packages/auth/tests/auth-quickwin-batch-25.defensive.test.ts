import { describe, expect, it } from 'vitest';
import { setupBetterAuthEnv } from '../src/better-auth/setup-better-auth-env.js';
import { setupOidcEnv } from '../src/oidc/setup-oidc-env.js';

describe('better-auth setup-better-auth-env additional branches', () => {
  it('enrollTwoFactor happy path assigns TOTP secret', async () => {
    const env = await setupBetterAuthEnv({ plugins: ['emailAndPassword', 'twoFactor'] });
    const { user } = await env.signUpWithPassword({
      email: 'a@example.com',
      password: 'p',
    });
    const result = await env.enrollTwoFactor({ userId: user.id });
    expect(result.secret).toBeDefined();
    expect(result.secret.length).toBeGreaterThan(0);
  });

  it('verifyTwoFactorCode throws when user is not enrolled in 2FA', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['emailAndPassword', 'twoFactor'],
    });
    const { user } = await env.signUpWithPassword({
      email: 'b@example.com',
      password: 'p',
    });
    await expect(
      env.verifyTwoFactorCode({ userId: user.id, code: '000000' }),
    ).rejects.toThrow(/not enrolled in 2FA/);
  });

  it('verifyTwoFactorCode throws when user does not exist', async () => {
    const env = await setupBetterAuthEnv({ plugins: ['twoFactor'] });
    await expect(
      env.verifyTwoFactorCode({ userId: 'nonexistent', code: '000000' }),
    ).rejects.toThrow(/not enrolled in 2FA/);
  });
});

describe('oidc/setup-oidc-env additional branches', () => {
  it('accepts explicit issuer without trailing slash', async () => {
    const env = await setupOidcEnv({ issuer: 'https://op.example' });
    expect(env.issuer).toBe('https://op.example');
  });

  it('accepts fully custom clients + users', async () => {
    const env = await setupOidcEnv({
      clients: [
        {
          clientId: 'client-1',
          redirectUris: ['https://rp.example/cb'],
        },
      ],
      users: [{ subject: 'u1' }],
    });
    expect(env).toBeDefined();
  });
});
