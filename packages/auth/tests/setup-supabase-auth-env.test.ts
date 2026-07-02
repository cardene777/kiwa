import { afterEach, describe, expect, it } from 'vitest';
import {
  setupSupabaseAuthEnv,
  verifySupabaseAccessToken,
  type SupabaseAuthTestEnv,
} from '../src/index.js';

const envs: SupabaseAuthTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    const env = envs.pop();
    if (env) await env.stop();
  }
});

describe('setupSupabaseAuthEnv (defaults)', () => {
  it('T-SAC-001 defaults expose Supabase-shaped projectUrl and session/OTP lifetimes', async () => {
    const env = await setupSupabaseAuthEnv();
    envs.push(env);
    expect(env.mode).toBe('mock');
    expect(env.projectUrl).toBe('https://mock.supabase.co');
    expect(env.sessionExpiration).toBe(3600);
    expect(env.otpExpiration).toBe(3600);
    expect(env.seededTokens).toEqual({});
  });

  it('T-SAC-002 rejects non-positive sessionExpiration', async () => {
    await expect(
      setupSupabaseAuthEnv({ sessionExpiration: 0 }),
    ).rejects.toThrow(/sessionExpiration must be a positive/);
  });

  it('T-SAC-003 rejects non-positive otpExpiration', async () => {
    await expect(setupSupabaseAuthEnv({ otpExpiration: -1 })).rejects.toThrow(
      /otpExpiration must be a positive/,
    );
  });

  it('T-SAC-004 seeds users at env setup time', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [
        {
          email: 'alice@example.test',
          password: 'secret',
          emailConfirmed: true,
          appMetadata: { plan: 'pro' },
          userMetadata: { firstName: 'Alice' },
        },
      ],
    });
    envs.push(env);
    const user = await env.admin.getUserByEmail('alice@example.test');
    expect(user?.email).toBe('alice@example.test');
    expect(user?.appMetadata).toEqual({ plan: 'pro' });
    expect(user?.userMetadata).toEqual({ firstName: 'Alice' });
    expect(user?.emailConfirmedAt).toBeInstanceOf(Date);
  });

  it('T-SAC-005 seeds tokens for pre-existing users', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [{ email: 'alice@example.test', password: 'secret', emailConfirmed: true }],
      tokens: [{ userEmail: 'alice@example.test' }],
    });
    envs.push(env);
    const seeded = env.seededTokens['alice@example.test'];
    expect(seeded).toBeDefined();
    expect(seeded?.accessToken).toBeTypeOf('string');
    expect(seeded?.refreshToken).toBeTypeOf('string');
    expect(seeded?.sessionId).toBeTypeOf('string');
  });

  it('T-SAC-006 rejects seeded tokens for unknown users', async () => {
    await expect(
      setupSupabaseAuthEnv({
        tokens: [{ userEmail: 'ghost@example.test' }],
      }),
    ).rejects.toThrow(/cannot seed token, user with email ghost/);
  });
});

describe('setupSupabaseAuthEnv (email/password flow)', () => {
  it('T-SAC-007 signUp creates a pending user and returns null session', async () => {
    const env = await setupSupabaseAuthEnv();
    envs.push(env);
    const { user, session } = await env.auth.signUp({
      email: 'new@example.test',
      password: 'strong-pass',
    });
    expect(user.email).toBe('new@example.test');
    // Default Supabase project requires email confirmation — session is null.
    expect(session).toBeNull();
    expect(user.emailConfirmedAt).toBeUndefined();
  });

  it('T-SAC-008 signInWithPassword succeeds and returns session tokens', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [{ email: 'alice@example.test', password: 'secret', emailConfirmed: true }],
    });
    envs.push(env);
    const { user, session } = await env.auth.signInWithPassword({
      email: 'alice@example.test',
      password: 'secret',
    });
    expect(user.email).toBe('alice@example.test');
    expect(session.accessToken).toBeTypeOf('string');
    expect(session.refreshToken).toBeTypeOf('string');
    expect(session.tokenType).toBe('bearer');
    expect(session.expiresIn).toBe(3600);
    expect(user.lastSignInAt).toBeInstanceOf(Date);
  });

  it('T-SAC-009 signInWithPassword rejects invalid password', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [{ email: 'alice@example.test', password: 'correct', emailConfirmed: true }],
    });
    envs.push(env);
    await expect(
      env.auth.signInWithPassword({ email: 'alice@example.test', password: 'wrong' }),
    ).rejects.toThrow(/invalid login credentials/);
  });

  it('T-SAC-010 signInWithPassword rejects unknown user', async () => {
    const env = await setupSupabaseAuthEnv();
    envs.push(env);
    await expect(
      env.auth.signInWithPassword({ email: 'ghost@example.test', password: 'nope' }),
    ).rejects.toThrow(/invalid login credentials/);
  });
});

describe('setupSupabaseAuthEnv (magic link / OTP flow)', () => {
  it('T-SAC-011 signInWithOtp email issues a magic link + OTP code', async () => {
    const env = await setupSupabaseAuthEnv();
    envs.push(env);
    const { otp } = await env.auth.signInWithOtp({ email: 'new@example.test' });
    expect(otp.channel).toBe('email');
    expect(otp.recipient).toBe('new@example.test');
    expect(otp.code).toMatch(/^\d{6}$/);
    expect(otp.magicLink).toContain('mock.supabase.co/auth/v1/verify');
    expect(otp.magicLink).toContain(otp.code);
    expect(otp.consumed).toBe(false);
  });

  it('T-SAC-012 signInWithOtp sms issues an SMS OTP without magic link', async () => {
    const env = await setupSupabaseAuthEnv();
    envs.push(env);
    const { otp } = await env.auth.signInWithOtp({ phone: '+15550001111' });
    expect(otp.channel).toBe('sms');
    expect(otp.recipient).toBe('+15550001111');
    expect(otp.magicLink).toBeUndefined();
  });

  it('T-SAC-013 signInWithOtp rejects unknown user when shouldCreateUser is false', async () => {
    const env = await setupSupabaseAuthEnv();
    envs.push(env);
    await expect(
      env.auth.signInWithOtp({
        email: 'ghost@example.test',
        options: { shouldCreateUser: false },
      }),
    ).rejects.toThrow(/user not found/);
  });

  it('T-SAC-014 verifyOtp with the delivered code returns a session', async () => {
    const env = await setupSupabaseAuthEnv();
    envs.push(env);
    const { otp } = await env.auth.signInWithOtp({ email: 'alice@example.test' });
    const { session } = await env.auth.verifyOtp({
      email: 'alice@example.test',
      token: otp.code,
      type: 'magiclink',
    });
    expect(session.accessToken).toBeTypeOf('string');
    expect(session.user.email).toBe('alice@example.test');
    // OTP consumed, cannot reuse.
    await expect(
      env.auth.verifyOtp({
        email: 'alice@example.test',
        token: otp.code,
        type: 'magiclink',
      }),
    ).rejects.toThrow(/invalid or expired OTP/);
  });

  it('T-SAC-015 verifyOtp rejects wrong code', async () => {
    const env = await setupSupabaseAuthEnv();
    envs.push(env);
    await env.auth.signInWithOtp({ email: 'alice@example.test' });
    await expect(
      env.auth.verifyOtp({
        email: 'alice@example.test',
        token: '000000',
        type: 'magiclink',
      }),
    ).rejects.toThrow(/invalid or expired OTP/);
  });

  it('T-SAC-016 listOtpDeliveries filters by channel', async () => {
    const env = await setupSupabaseAuthEnv();
    envs.push(env);
    await env.auth.signInWithOtp({ email: 'a@example.test' });
    await env.auth.signInWithOtp({ phone: '+15550002222' });
    expect(env.listOtpDeliveries('email')).toHaveLength(1);
    expect(env.listOtpDeliveries('sms')).toHaveLength(1);
    expect(env.listOtpDeliveries()).toHaveLength(2);
  });
});

describe('setupSupabaseAuthEnv (OAuth PKCE flow)', () => {
  it('T-SAC-017 signInWithOAuth returns an authorization URL + code + PKCE verifier', async () => {
    const env = await setupSupabaseAuthEnv();
    envs.push(env);
    const url = await env.auth.signInWithOAuth({ provider: 'google' });
    expect(url.provider).toBe('google');
    expect(url.url).toContain('provider=google');
    expect(url.url).toContain('code_challenge=');
    expect(url.codeVerifier).toBeTypeOf('string');
    expect(url.code).toBeTypeOf('string');
    expect(env.listOAuthPending()).toHaveLength(1);
  });

  it('T-SAC-018 exchangeCodeForSession succeeds with matching code + verifier', async () => {
    const env = await setupSupabaseAuthEnv();
    envs.push(env);
    const url = await env.auth.signInWithOAuth({ provider: 'github' });
    const { user, session } = await env.auth.exchangeCodeForSession({
      code: url.code,
      codeVerifier: url.codeVerifier,
    });
    expect(user.appMetadata.provider).toBe('github');
    expect(user.identities[0]?.provider).toBe('github');
    expect(session.accessToken).toBeTypeOf('string');
    // Pending URL consumed.
    expect(env.listOAuthPending()).toHaveLength(0);
  });

  it('T-SAC-019 exchangeCodeForSession rejects wrong verifier', async () => {
    const env = await setupSupabaseAuthEnv();
    envs.push(env);
    const url = await env.auth.signInWithOAuth({ provider: 'apple' });
    await expect(
      env.auth.exchangeCodeForSession({ code: url.code, codeVerifier: 'wrong' }),
    ).rejects.toThrow(/invalid or expired authorization code/);
  });
});

describe('setupSupabaseAuthEnv (JWT verification)', () => {
  it('T-SAC-020 verifyToken returns claims for a valid access token', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [{ email: 'alice@example.test', password: 'secret', emailConfirmed: true }],
    });
    envs.push(env);
    const { session } = await env.auth.signInWithPassword({
      email: 'alice@example.test',
      password: 'secret',
    });
    const claims = await env.verifyToken(session.accessToken);
    expect(claims.sub).toBe(session.user.id);
    expect(claims.email).toBe('alice@example.test');
    expect(claims.aud).toBe('authenticated');
    expect(claims.role).toBe('authenticated');
    expect(claims.iss).toBe('https://mock.supabase.co/auth/v1');
    expect(claims.amr[0]?.method).toBe('password');
  });

  it('T-SAC-021 verifyToken rejects a token from a different env', async () => {
    const env1 = await setupSupabaseAuthEnv({
      users: [{ email: 'a@example.test', password: 'x', emailConfirmed: true }],
    });
    const env2 = await setupSupabaseAuthEnv({
      users: [{ email: 'b@example.test', password: 'y', emailConfirmed: true }],
    });
    envs.push(env1, env2);
    const { session } = await env1.auth.signInWithPassword({
      email: 'a@example.test',
      password: 'x',
    });
    await expect(env2.verifyToken(session.accessToken)).rejects.toThrow(/signature mismatch/);
  });

  it('T-SAC-022 verifyToken rejects malformed token', async () => {
    const env = await setupSupabaseAuthEnv();
    envs.push(env);
    await expect(env.verifyToken('not.a.token.at.all')).rejects.toThrow(/malformed token/);
  });

  it('T-SAC-023 verifyToken rejects tampered payload', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [{ email: 'alice@example.test', password: 'secret', emailConfirmed: true }],
    });
    envs.push(env);
    const { session } = await env.auth.signInWithPassword({
      email: 'alice@example.test',
      password: 'secret',
    });
    const parts = session.accessToken.split('.');
    // Swap payload to a fake but base64-shaped string.
    const tampered = `${parts[0]}.eyJzdWIiOiJoYWNrIn0.${parts[2]}`;
    await expect(env.verifyToken(tampered)).rejects.toThrow(/signature mismatch/);
  });
});

describe('setupSupabaseAuthEnv (session lifecycle)', () => {
  it('T-SAC-024 refreshSession rotates both access + refresh tokens', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [{ email: 'alice@example.test', password: 'secret', emailConfirmed: true }],
    });
    envs.push(env);
    const { session } = await env.auth.signInWithPassword({
      email: 'alice@example.test',
      password: 'secret',
    });
    const original = session;
    // Sleep 1s to advance the JWT `iat` — Supabase's real JWT payload changes
    // each refresh via the `iat` timestamp, so the mock does the same.
    await new Promise((r) => setTimeout(r, 1100));
    const refreshed = await env.auth.refreshSession({ refreshToken: original.refreshToken });
    expect(refreshed.session.accessToken).not.toBe(original.accessToken);
    expect(refreshed.session.refreshToken).not.toBe(original.refreshToken);
    expect(refreshed.user.id).toBe(original.user.id);
  }, 3000);

  it('T-SAC-025 refreshSession rejects revoked session', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [{ email: 'alice@example.test', password: 'secret', emailConfirmed: true }],
    });
    envs.push(env);
    const { session } = await env.auth.signInWithPassword({
      email: 'alice@example.test',
      password: 'secret',
    });
    await env.auth.signOut({ accessToken: session.accessToken });
    await expect(
      env.auth.refreshSession({ refreshToken: session.refreshToken }),
    ).rejects.toThrow(/invalid refresh token/);
  });

  it('T-SAC-026 signOut prevents subsequent getUser call', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [{ email: 'alice@example.test', password: 'secret', emailConfirmed: true }],
    });
    envs.push(env);
    const { session } = await env.auth.signInWithPassword({
      email: 'alice@example.test',
      password: 'secret',
    });
    await env.auth.signOut({ accessToken: session.accessToken });
    await expect(env.auth.getUser(session.accessToken)).rejects.toThrow(/session revoked/);
  });

  it('T-SAC-027 getUser returns user for a valid access token', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [{ email: 'alice@example.test', password: 'secret', emailConfirmed: true }],
    });
    envs.push(env);
    const { session } = await env.auth.signInWithPassword({
      email: 'alice@example.test',
      password: 'secret',
    });
    const user = await env.auth.getUser(session.accessToken);
    expect(user.email).toBe('alice@example.test');
  });
});

describe('setupSupabaseAuthEnv (admin API)', () => {
  it('T-SAC-028 admin.createUser stores user and returns record', async () => {
    const env = await setupSupabaseAuthEnv();
    envs.push(env);
    const user = await env.admin.createUser({
      email: 'admin-created@example.test',
      password: 'x',
      emailConfirm: true,
      appMetadata: { role: 'internal' },
    });
    expect(user.email).toBe('admin-created@example.test');
    expect(user.emailConfirmedAt).toBeInstanceOf(Date);
    expect(user.appMetadata).toEqual({ role: 'internal' });
  });

  it('T-SAC-029 admin.createUser rejects if neither email nor phone provided', async () => {
    const env = await setupSupabaseAuthEnv();
    envs.push(env);
    await expect(env.admin.createUser({} as never)).rejects.toThrow(
      /either email or phone is required/,
    );
  });

  it('T-SAC-030 admin.updateUserById updates metadata + password', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [{ email: 'alice@example.test', password: 'old', emailConfirmed: true }],
    });
    envs.push(env);
    const user = await env.admin.getUserByEmail('alice@example.test');
    const updated = await env.admin.updateUserById(user!.id, {
      password: 'new',
      appMetadata: { role: 'admin' },
    });
    expect(updated.appMetadata).toEqual({ role: 'admin' });
    // Old password rejected.
    await expect(
      env.auth.signInWithPassword({ email: 'alice@example.test', password: 'old' }),
    ).rejects.toThrow(/invalid login credentials/);
    // New password succeeds.
    const { session } = await env.auth.signInWithPassword({
      email: 'alice@example.test',
      password: 'new',
    });
    expect(session.accessToken).toBeTypeOf('string');
  });

  it('T-SAC-031 admin.deleteUser removes the user', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [{ email: 'alice@example.test', password: 'secret', emailConfirmed: true }],
    });
    envs.push(env);
    const user = await env.admin.getUserByEmail('alice@example.test');
    await env.admin.deleteUser(user!.id);
    expect(await env.admin.getUserByEmail('alice@example.test')).toBeNull();
  });

  it('T-SAC-032 admin.listUsers returns every user', async () => {
    const env = await setupSupabaseAuthEnv({
      users: [
        { email: 'a@example.test', password: 'x', emailConfirmed: true },
        { email: 'b@example.test', password: 'y', emailConfirmed: true },
      ],
    });
    envs.push(env);
    const list = await env.admin.listUsers();
    expect(list.map((u) => u.email).sort()).toEqual(['a@example.test', 'b@example.test']);
  });
});

describe('setupSupabaseAuthEnv (helper exports)', () => {
  it('T-SAC-033 verifySupabaseAccessToken helper is exported', async () => {
    // Sanity check — the standalone helper is exported alongside the env.
    expect(verifySupabaseAccessToken).toBeTypeOf('function');
  });
});
