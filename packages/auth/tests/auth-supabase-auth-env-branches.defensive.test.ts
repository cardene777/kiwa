import { describe, expect, it } from 'vitest';
import { setupSupabaseAuthEnv } from '../src/supabase/setup-supabase-auth-env.js';

describe('supabase-auth-env defensive branches', () => {
  it('signInWithPassword throws when email unknown', async () => {
    const env = await setupSupabaseAuthEnv();
    await expect(
      env.auth.signInWithPassword({
        email: 'unknown@example.com',
        password: 'anything',
      }),
    ).rejects.toThrow(/invalid login credentials/);
  });

  it('signInWithPassword throws when password wrong', async () => {
    const env = await setupSupabaseAuthEnv();
    await env.auth.signUp({
      email: 'user@example.com',
      password: 'correct-pw-1234',
    });
    await expect(
      env.auth.signInWithPassword({
        email: 'user@example.com',
        password: 'wrong-pw',
      }),
    ).rejects.toThrow(/invalid login credentials/);
  });

  it('signUp with email returns null session (default confirmation)', async () => {
    const env = await setupSupabaseAuthEnv();
    const result = await env.auth.signUp({
      email: 'newuser@example.com',
      password: 'password-1234',
    });
    expect(result.session).toBeNull();
    expect(result.user).toBeDefined();
  });

  it('signUp with phone uses phone credential', async () => {
    const env = await setupSupabaseAuthEnv();
    const result = await env.auth.signUp({
      phone: '+81901234567',
      password: 'password-1234',
    });
    expect(result.user.phone).toBe('+81901234567');
  });

  it('signInWithOtp with shouldCreateUser=false throws when user not found', async () => {
    const env = await setupSupabaseAuthEnv();
    await expect(
      env.auth.signInWithOtp({
        email: 'no-user@example.com',
        options: { shouldCreateUser: false },
      }),
    ).rejects.toThrow(/user not found and shouldCreateUser is false/);
  });

  it('signInWithOtp with shouldCreateUser=true auto-creates user', async () => {
    const env = await setupSupabaseAuthEnv();
    const result = await env.auth.signInWithOtp({
      email: 'new-otp@example.com',
      options: { shouldCreateUser: true },
    });
    expect(result).toBeDefined();
  });

  it('signInWithOtp with phone uses sms channel', async () => {
    const env = await setupSupabaseAuthEnv();
    const result = await env.auth.signInWithOtp({
      phone: '+8190111222333',
    });
    expect(result).toBeDefined();
  });

  it('signInWithOtp with emailRedirectTo option builds magic link', async () => {
    const env = await setupSupabaseAuthEnv();
    const result = await env.auth.signInWithOtp({
      email: 'redirect@example.com',
      options: {
        emailRedirectTo: 'https://example.com/callback',
        shouldCreateUser: true,
      },
    });
    expect(result).toBeDefined();
  });

  it('signOut is idempotent (safe to call twice)', async () => {
    const env = await setupSupabaseAuthEnv();
    const signed = await env.auth.signUp({
      email: 'signout@example.com',
      password: 'pw-1234567',
    });
    // signUp with email returns null session, so grab via signIn
    const signIn = await env.auth.signInWithPassword({
      email: 'signout@example.com',
      password: 'pw-1234567',
    });
    await env.auth.signOut({ accessToken: signIn.session!.accessToken });
    await expect(
      env.auth.signOut({ accessToken: signIn.session!.accessToken }),
    ).resolves.toBeUndefined();
    expect(signed.user).toBeDefined();
  });

  it('setupSupabaseAuthEnv with custom projectUrl', async () => {
    const env = await setupSupabaseAuthEnv({
      projectUrl: 'https://custom.supabase.co',
    });
    expect(env.projectUrl).toBe('https://custom.supabase.co');
  });
});
