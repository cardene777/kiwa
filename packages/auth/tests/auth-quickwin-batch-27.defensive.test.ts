import { describe, expect, it } from 'vitest';
import { setupBetterAuthEnv } from '../src/better-auth/setup-better-auth-env.js';

describe('better-auth consumeMagicLink existing user branches', () => {
  it('consumeMagicLink for existing user with emailVerified=false flips flag via updateUser', async () => {
    const env = await setupBetterAuthEnv({
      plugins: ['magicLink', 'emailAndPassword'],
    });
    // Pre-create user via password sign-up (emailVerified defaults false)
    await env.signUpWithPassword({ email: 'a@example.com', password: 'p' });
    const { token } = await env.sendMagicLink({ email: 'a@example.com' });
    const result = await env.consumeMagicLink({ email: 'a@example.com', token });
    expect(result.user.emailVerified).toBe(true);
  });

  it('consumeMagicLink for new user creates with emailVerified=true', async () => {
    const env = await setupBetterAuthEnv({ plugins: ['magicLink'] });
    const { token } = await env.sendMagicLink({ email: 'new@example.com' });
    const result = await env.consumeMagicLink({ email: 'new@example.com', token });
    expect(result.user.email).toBe('new@example.com');
    expect(result.user.emailVerified).toBe(true);
  });

  it('consumeMagicLink throws when token is invalid', async () => {
    const env = await setupBetterAuthEnv({ plugins: ['magicLink'] });
    await expect(
      env.consumeMagicLink({ email: 'a@example.com', token: 'wrong-token' }),
    ).rejects.toThrow(/invalid or expired token/);
  });

  it('invalidateSession no-ops when token is unknown', async () => {
    const env = await setupBetterAuthEnv();
    await expect(env.invalidateSession('nonexistent-token')).resolves.toBeUndefined();
  });

  it('invalidateSession deletes the session when token is valid', async () => {
    const env = await setupBetterAuthEnv({ plugins: ['emailAndPassword'] });
    const { session } = await env.signUpWithPassword({
      email: 'a@example.com',
      password: 'p',
    });
    await env.invalidateSession(session.token);
    const found = await env.validateSession(session.token);
    expect(found).toBeNull();
  });
});
