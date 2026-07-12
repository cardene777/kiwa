import { describe, expect, it } from 'vitest';
import { setupBetterAuthEnv } from '../src/better-auth/setup-better-auth-env.js';

describe('setup-better-auth-env defensive branches', () => {
  it('throws when providers array is empty', async () => {
    await expect(setupBetterAuthEnv({ providers: [] })).rejects.toThrow(
      /providers must contain at least one entry/,
    );
  });

  it('throws when sessionExpiration is zero or negative', async () => {
    await expect(setupBetterAuthEnv({ sessionExpiration: 0 })).rejects.toThrow(
      /sessionExpiration must be a positive number/,
    );
    await expect(setupBetterAuthEnv({ sessionExpiration: -1 })).rejects.toThrow(
      /sessionExpiration must be a positive number/,
    );
  });

  it('throws when verificationExpiration is zero or negative', async () => {
    await expect(setupBetterAuthEnv({ verificationExpiration: 0 })).rejects.toThrow(
      /verificationExpiration must be a positive number/,
    );
    await expect(setupBetterAuthEnv({ verificationExpiration: -100 })).rejects.toThrow(
      /verificationExpiration must be a positive number/,
    );
  });

  it('signInWithOAuth throws when provider not configured', async () => {
    const env = await setupBetterAuthEnv({ providers: ['google'] });
    await expect(env.signInWithOAuth('github' as never)).rejects.toThrow(
      /provider "github" was not configured/,
    );
  });

  it('sendMagicLink throws when magicLink plugin is not enabled', async () => {
    const env = await setupBetterAuthEnv({ plugins: [] });
    await expect(env.sendMagicLink({ email: 'a@example.com' })).rejects.toThrow(
      /requires the "magicLink" plugin/,
    );
  });

  it('sendMagicLink throws when email is empty', async () => {
    const env = await setupBetterAuthEnv({ plugins: ['magicLink'] });
    await expect(env.sendMagicLink({ email: '' })).rejects.toThrow(/email is required/);
  });

  it('enrollTwoFactor throws when twoFactor plugin is not enabled', async () => {
    const env = await setupBetterAuthEnv({ plugins: [] });
    await expect(env.enrollTwoFactor({ userId: 'u1' })).rejects.toThrow(
      /requires the "twoFactor" plugin/,
    );
  });

  it('enrollTwoFactor throws when user id is unknown', async () => {
    const env = await setupBetterAuthEnv({ plugins: ['twoFactor'] });
    await expect(env.enrollTwoFactor({ userId: 'nonexistent' })).rejects.toThrow(
      /unknown user id/,
    );
  });

  it('signUpWithPassword throws when emailAndPassword plugin is not enabled', async () => {
    const env = await setupBetterAuthEnv({ plugins: [] });
    await expect(
      env.signUpWithPassword({ email: 'a@example.com', password: 'p' }),
    ).rejects.toThrow(/requires the "emailAndPassword" plugin/);
  });

  it('signUpWithPassword throws when email is empty', async () => {
    const env = await setupBetterAuthEnv({ plugins: ['emailAndPassword'] });
    await expect(env.signUpWithPassword({ email: '', password: 'p' })).rejects.toThrow(
      /email is required/,
    );
  });
});
