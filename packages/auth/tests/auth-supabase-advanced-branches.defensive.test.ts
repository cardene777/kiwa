import { describe, expect, it } from 'vitest';
import { setupSupabaseAdvancedEnv } from '../src/supabase-advanced/setup-supabase-advanced-env.js';

describe('supabase-advanced setup guards', () => {
  it('throws when sessionExpiration <= 0', async () => {
    await expect(
      setupSupabaseAdvancedEnv({ sessionExpiration: 0 }),
    ).rejects.toThrow(/sessionExpiration must be positive/);
  });

  it('throws when mfaChallengeExpiration <= 0', async () => {
    await expect(
      setupSupabaseAdvancedEnv({ mfaChallengeExpiration: 0 }),
    ).rejects.toThrow(/mfaChallengeExpiration must be positive/);
  });

  it('throws when siweNonceExpiration <= 0', async () => {
    await expect(
      setupSupabaseAdvancedEnv({ siweNonceExpiration: 0 }),
    ).rejects.toThrow();
  });
});

describe('supabase-advanced mfa defensive branches', () => {
  it('enrollTotp throws when userId unknown', async () => {
    const env = await setupSupabaseAdvancedEnv();
    await expect(
      env.mfa.enrollTotp({ userId: 'user-nope', friendlyName: 'my totp' }),
    ).rejects.toThrow(/user user-nope not found/);
  });

  it('issueBackupCodes throws when userId unknown', async () => {
    const env = await setupSupabaseAdvancedEnv();
    await expect(
      env.mfa.issueBackupCodes({ userId: 'user-nope' }),
    ).rejects.toThrow(/user user-nope not found/);
  });

  it('challenge throws when factorId unknown', async () => {
    const env = await setupSupabaseAdvancedEnv();
    await expect(
      env.mfa.challenge({ factorId: 'factor-nope' }),
    ).rejects.toThrow(/factor factor-nope not found/);
  });

  it('verifyChallenge throws when challengeId unknown', async () => {
    const env = await setupSupabaseAdvancedEnv();
    await expect(
      env.mfa.verifyChallenge({ challengeId: 'chall-nope', code: '000000' }),
    ).rejects.toThrow(/challenge chall-nope not found/);
  });

  it('consumeBackupCode throws when code invalid', async () => {
    const env = await setupSupabaseAdvancedEnv();
    await expect(
      env.mfa.consumeBackupCode({ userId: 'u1', code: 'bogus' }),
    ).rejects.toThrow(/code invalid or already consumed/);
  });
});

describe('supabase-advanced saml defensive branches', () => {
  it('initiateSsoLogin throws for invalid email (no @)', async () => {
    const env = await setupSupabaseAdvancedEnv();
    await expect(
      env.saml.initiateSsoLogin({ email: 'not-an-email' }),
    ).rejects.toThrow(/invalid email/);
  });

  it('initiateSsoLogin throws for unmatched domain', async () => {
    const env = await setupSupabaseAdvancedEnv();
    await expect(
      env.saml.initiateSsoLogin({ email: 'user@unmatched.example.com' }),
    ).rejects.toThrow(/no SAML IdP registered for domain/);
  });
});

describe('supabase-advanced env seed defensive branches', () => {
  it('creates env with seed users', async () => {
    const env = await setupSupabaseAdvancedEnv({
      users: [{ email: 'seed@example.com' }],
    });
    expect(env).toBeDefined();
    expect(env.projectUrl).toBeDefined();
  });

  it('creates env with default projectUrl', async () => {
    const env = await setupSupabaseAdvancedEnv();
    expect(env.projectUrl).toContain('supabase.co');
  });

  it('creates env with custom projectUrl', async () => {
    const env = await setupSupabaseAdvancedEnv({
      projectUrl: 'https://my-project.supabase.co',
    });
    expect(env.projectUrl).toBe('https://my-project.supabase.co');
  });
});
