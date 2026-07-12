import { describe, expect, it } from 'vitest';
import { setupSupabaseAuthEnv } from '../src/supabase/setup-supabase-auth-env.js';

describe('setup-supabase-auth-env defensive branches', () => {
  it('throws when sessionExpiration is zero or negative', async () => {
    await expect(setupSupabaseAuthEnv({ sessionExpiration: 0 })).rejects.toThrow(
      /sessionExpiration must be a positive number/,
    );
    await expect(setupSupabaseAuthEnv({ sessionExpiration: -1 })).rejects.toThrow(
      /sessionExpiration must be a positive number/,
    );
  });

  it('throws when otpExpiration is zero or negative', async () => {
    await expect(setupSupabaseAuthEnv({ otpExpiration: 0 })).rejects.toThrow(
      /otpExpiration must be a positive number/,
    );
    await expect(setupSupabaseAuthEnv({ otpExpiration: -60 })).rejects.toThrow(
      /otpExpiration must be a positive number/,
    );
  });

  it('accepts custom projectUrl override', async () => {
    const env = await setupSupabaseAuthEnv({ projectUrl: 'https://custom.supabase.co' });
    expect(env.projectUrl).toBe('https://custom.supabase.co');
  });

  it('signUp requires either email or phone', async () => {
    const env = await setupSupabaseAuthEnv();
    await expect(
      env.auth.signUp({ password: 'p' } as never),
    ).rejects.toThrow(/either email or phone/);
  });

  it('signInWithPassword rejects unknown email', async () => {
    const env = await setupSupabaseAuthEnv();
    await expect(
      env.auth.signInWithPassword({ email: 'ghost@example.com', password: 'p' }),
    ).rejects.toThrow(/invalid login credentials/);
  });

  it('signInWithPassword rejects wrong password', async () => {
    const env = await setupSupabaseAuthEnv();
    await env.auth.signUp({ email: 'a@example.com', password: 'correct' });
    await expect(
      env.auth.signInWithPassword({ email: 'a@example.com', password: 'wrong' }),
    ).rejects.toThrow(/invalid login credentials/);
  });

  it('signInWithOtp throws when user not found and shouldCreateUser=false', async () => {
    const env = await setupSupabaseAuthEnv();
    await expect(
      env.auth.signInWithOtp({
        email: 'ghost@example.com',
        options: { shouldCreateUser: false },
      }),
    ).rejects.toThrow(/shouldCreateUser is false/);
  });

  it('signInWithOtp creates user when shouldCreateUser default (true)', async () => {
    const env = await setupSupabaseAuthEnv();
    const result = await env.auth.signInWithOtp({ email: 'a@example.com' });
    expect(result.otp).toBeDefined();
    expect(result.otp.code.length).toBe(6);
  });

  it('exchangeCodeForSession throws on invalid code', async () => {
    const env = await setupSupabaseAuthEnv();
    await expect(
      env.auth.exchangeCodeForSession({
        code: 'invalid-code',
        codeVerifier: 'v',
      }),
    ).rejects.toThrow(/invalid or expired authorization code/);
  });

  it('verifyOtp throws on invalid OTP', async () => {
    const env = await setupSupabaseAuthEnv();
    await expect(
      env.auth.verifyOtp({
        email: 'a@example.com',
        token: '000000',
        type: 'email',
      }),
    ).rejects.toThrow(/invalid or expired OTP/);
  });

  it('signInWithOAuth returns authorization URL with PKCE challenge', async () => {
    const env = await setupSupabaseAuthEnv();
    const result = await env.auth.signInWithOAuth({ provider: 'google' });
    expect(result.url).toContain('code_challenge=');
    expect(result.url).toContain('provider=google');
  });
});
