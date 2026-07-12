import { describe, expect, it } from 'vitest';
import { setupSupabaseAdvancedEnv } from '../src/supabase-advanced/setup-supabase-advanced-env.js';

describe('setup-supabase-advanced-env defensive branches', () => {
  it('throws when sessionExpiration is zero or negative', async () => {
    await expect(setupSupabaseAdvancedEnv({ sessionExpiration: 0 })).rejects.toThrow(
      /sessionExpiration must be positive/,
    );
    await expect(setupSupabaseAdvancedEnv({ sessionExpiration: -1 })).rejects.toThrow(
      /sessionExpiration must be positive/,
    );
  });

  it('throws when mfaChallengeExpiration is zero or negative', async () => {
    await expect(setupSupabaseAdvancedEnv({ mfaChallengeExpiration: 0 })).rejects.toThrow(
      /mfaChallengeExpiration must be positive/,
    );
    await expect(setupSupabaseAdvancedEnv({ mfaChallengeExpiration: -60 })).rejects.toThrow(
      /mfaChallengeExpiration must be positive/,
    );
  });

  it('throws when siweNonceExpiration is zero or negative', async () => {
    await expect(setupSupabaseAdvancedEnv({ siweNonceExpiration: 0 })).rejects.toThrow(
      /siweNonceExpiration must be positive/,
    );
    await expect(setupSupabaseAdvancedEnv({ siweNonceExpiration: -100 })).rejects.toThrow(
      /siweNonceExpiration must be positive/,
    );
  });

  it('accepts custom projectUrl override', async () => {
    const env = await setupSupabaseAdvancedEnv({
      projectUrl: 'https://custom.supabase.co',
    });
    expect(env.projectUrl).toBe('https://custom.supabase.co');
  });

  it('preseeds users with all optional fields (phone / role / appMetadata / userMetadata / password)', async () => {
    const env = await setupSupabaseAdvancedEnv({
      users: [
        {
          email: 'a@example.com',
          phone: '+81900000001',
          role: 'authenticated',
          appMetadata: { plan: 'pro' },
          userMetadata: { name: 'Alice' },
          password: 'p',
        },
      ],
    });
    expect(env).toBeDefined();
  });

  it('preseeds users with only phone (no email)', async () => {
    const env = await setupSupabaseAdvancedEnv({
      users: [
        {
          phone: '+81900000002',
          role: 'anon',
        },
      ],
    });
    expect(env).toBeDefined();
  });

  it('throws when preseeded users have duplicate email', async () => {
    await expect(
      setupSupabaseAdvancedEnv({
        users: [
          { email: 'dup@example.com' },
          { email: 'dup@example.com' },
        ],
      }),
    ).rejects.toThrow(/already exists/);
  });

  it('mfa.enrollTotp throws when user not found', async () => {
    const env = await setupSupabaseAdvancedEnv();
    await expect(env.mfa.enrollTotp({ userId: 'nonexistent' })).rejects.toThrow(
      /not found/,
    );
  });
});
